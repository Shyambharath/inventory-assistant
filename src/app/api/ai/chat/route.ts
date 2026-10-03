import { NextRequest, NextResponse } from 'next/server'
import { sqlite } from '@/lib/db'

export const dynamic = 'force-dynamic'

interface ProductRecord {
  id: number
  name: string
  category: string
  current_stock: number
  minimum_stock: number
  unit: string
  selling_price: number
}

interface SaleRecord {
  quantity: number
  total_amount: number
  product_name: string
  product_unit: string
}

const NUMBER_MAP: Record<string, number> = {
  // Malayalam numbers
  'ഒരു': 1,
  'ഒന്ന്': 1,
  'രണ്ട്': 2,
  'മൂന്ന്': 3,
  'നാല്': 4,
  'അഞ്ച്': 5,
  'ആറ്': 6,
  'ഏഴ്': 7,
  'എട്ട്': 8,
  'ഒൻപത്': 9,
  'പത്ത്': 10,
  'പതിനഞ്ച്': 15,
  'ഇരുപത്': 20,
  'മുപ്പത്': 30,
  'നാൽപ്പത്': 40,
  'അമ്പത്': 50,
  'നൂറ്': 100,
  // English numbers
  'one': 1,
  'two': 2,
  'three': 3,
  'four': 4,
  'five': 5,
  'six': 6,
  'seven': 7,
  'eight': 8,
  'nine': 9,
  'ten': 10,
  'fifteen': 15,
  'twenty': 20,
  'thirty': 30,
  'forty': 40,
  'fifty': 50,
  'hundred': 100,
}

const PRODUCT_ALIASES: Record<string, string[]> = {
  'rice': ['rice', 'അരി', 'റൈസ്'],
  'cooking oil': ['oil', 'cooking oil', 'എണ്ണ', 'വെളിച്ചെണ്ണ', 'ഓയിൽ'],
  'sugar': ['sugar', 'പഞ്ചസാര', 'ഷുഗർ'],
  'milk': ['milk', 'പാൽ', 'പാല്', 'മിൽക്ക്'],
  'biscuits': ['biscuit', 'biscuits', 'ഗുഡ് ഡേ', 'ബിസ്കറ്റ്', 'ബിസ്ക്കറ്റ്'],
  'tea': ['tea', 'tata tea', 'ചായ', 'തേയില', 'ടീ'],
  'coffee': ['coffee', 'nescafe', 'കാപ്പി', 'കോഫി'],
  'soap': ['soap', 'lux', 'സോപ്പ്'],
  'shampoo': ['shampoo', 'head & shoulders', 'ഷാംപൂ'],
  'water': ['water', 'bisleri', 'വെള്ളം', 'വാട്ടർ'],
}

function extractQuantity(text: string): number | null {
  // Check digits
  const digitMatch = text.match(/\b(\d+)\b/)
  if (digitMatch) {
    const num = parseInt(digitMatch[1], 10)
    if (!isNaN(num) && num > 0) return num
  }

  // Check word numbers
  for (const [word, val] of Object.entries(NUMBER_MAP)) {
    if (text.includes(word)) {
      return val
    }
  }

  return null
}

function matchProduct(text: string, products: ProductRecord[]): ProductRecord | null {
  const lower = text.toLowerCase()

  // Match known aliases first
  for (const [key, aliases] of Object.entries(PRODUCT_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(alias.toLowerCase())) {
        const found = products.find(p => p.name.toLowerCase().includes(key))
        if (found) return found
      }
    }
  }

  // Direct product name match
  for (const p of products) {
    const pName = p.name.toLowerCase()
    if (lower.includes(pName)) return p

    // Try first word of product name
    const firstWord = pName.split(/[\s(]/)[0]
    if (firstWord.length >= 3 && lower.includes(firstWord)) {
      return p
    }
  }

  return null
}

interface ParsedResult {
  reply: string
  type: 'ACTION' | 'QUERY' | 'CLARIFICATION'
  action?: {
    actionType: 'SALE' | 'RECEIVE_STOCK' | 'UPDATE_PRICE'
    productId: number
    productName: string
    productUnit: string
    quantity?: number
    newPrice?: number
    confirmationMessage: string
  }
}

function parseRuleBased(
  message: string,
  isMl: boolean,
  products: ProductRecord[],
  todaySales: SaleRecord[]
): ParsedResult {
  const lower = message.toLowerCase()

  // 1. Query: GET_TODAY_SALES (Check first so questions like "how much did I sell today?" or "ഇന്ന് എത്ര രൂപയുടെ സാധനം വിറ്റു?" work even if inventory is 0)
  const isSalesQuery =
    (lower.includes('എത്ര') && (lower.includes('വിറ്റു') || lower.includes('വിൽപ്പന') || lower.includes('രൂപ'))) ||
    lower.includes('ഇന്ന് എത്ര') ||
    lower.includes('ഇന്നത്തെ വിൽപ്പന') ||
    lower.includes('ഇന്ന് വിറ്റത്') ||
    lower.includes('how much did i sell') ||
    lower.includes('what did i sell') ||
    (lower.includes('today') && (lower.includes('sales') || lower.includes('sell') || lower.includes('sold') || lower.includes('make') || lower.includes('revenue')))

  if (isSalesQuery) {
    if (todaySales.length === 0) {
      return {
        type: 'QUERY',
        reply: isMl
          ? 'ഇന്ന് ഇതുവരെ വിൽപ്പനകൾ ഒന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.'
          : 'No sales have been recorded today yet.',
      }
    }

    const totalRevenue = todaySales.reduce((acc, s) => acc + s.total_amount, 0)
    if (isMl) {
      const list = todaySales.map(s => `• **${s.product_name}**: ${s.quantity} ${s.product_unit} — ₹${s.total_amount}`).join('\n')
      return {
        type: 'QUERY',
        reply: `📊 **ഇന്നത്തെ വിൽപ്പന വിവരങ്ങൾ:**\n\n${list}\n\n**ആകെ വരുമാനം: ₹${totalRevenue}**`,
      }
    } else {
      const list = todaySales.map(s => `• **${s.product_name}**: ${s.quantity} ${s.product_unit} — ₹${s.total_amount}`).join('\n')
      return {
        type: 'QUERY',
        reply: `📊 **Here's what you sold today:**\n\n${list}\n\n**Total revenue today: ₹${totalRevenue}**`,
      }
    }
  }

  // If no products in inventory, return clear guidance
  if (products.length === 0) {
    return {
      type: 'QUERY',
      reply: isMl
        ? 'നിങ്ങൾ ഇതുവരെ ഉൽപ്പന്നങ്ങൾ ഒന്നും ചേർത്തിട്ടില്ല. ഉൽപ്പന്നങ്ങൾ ചേർക്കാൻ "ഉൽപ്പന്നങ്ങൾ" പേജ് സന്ദർശിക്കുക.'
        : 'You haven\'t added any products yet. Please add your products in the Products page to start tracking inventory.',
    }
  }

  // 2. Check for UPDATE_PRICE
  const isPriceUpdate =
    lower.includes('വില') && (lower.includes('ആക്കൂ') || lower.includes('മാറ്റുക') || lower.includes('രൂപ')) ||
    (lower.includes('price') && (lower.includes('update') || lower.includes('change') || lower.includes('set') || lower.includes('to')))

  if (isPriceUpdate) {
    const product = matchProduct(message, products)
    const priceMatch = message.match(/(?:₹|rs\.?|രൂപ|price)?\s*(\d+(?:\.\d+)?)/i)
    const newPrice = priceMatch ? parseFloat(priceMatch[1]) : null

    if (product && newPrice && newPrice > 0) {
      return {
        type: 'ACTION',
        reply: isMl
          ? `${product.name} വില ₹${newPrice} ആക്കി മാറ്റാൻ സ്ഥിരീകരിക്കുക:`
          : `Please confirm updating price of ${product.name} to ₹${newPrice}:`,
        action: {
          actionType: 'UPDATE_PRICE',
          productId: product.id,
          productName: product.name,
          productUnit: product.unit,
          newPrice,
          confirmationMessage: isMl
            ? `${product.name} വില ₹${newPrice} ആക്കി മാറ്റട്ടേ?`
            : `Update price of ${product.name} to ₹${newPrice}?`,
        },
      }
    }

    return {
      type: 'CLARIFICATION',
      reply: isMl
        ? 'ഏത് ഉൽപ്പന്നത്തിന്റെ വിലയാണ് എത്രയാക്കി മാറ്റേണ്ടത് എന്ന് വ്യക്തമാക്കാമോ?'
        : 'Could you please specify which product and the new price?',
    }
  }

  // 2. Check for RECEIVE_STOCK
  const isReceiveStock =
    lower.includes('വന്നു') || lower.includes('എത്തി') || lower.includes('കിട്ടി') ||
    lower.includes('ചേർക്കുക') || lower.includes('വന്നിട്ടുണ്ട്') || lower.includes('പുതിയ സ്റ്റോക്ക്') ||
    lower.includes('came') || lower.includes('arrived') || lower.includes('received') ||
    lower.includes('stock in') || lower.includes('stock arrived')

  if (isReceiveStock) {
    const product = matchProduct(message, products)
    const qty = extractQuantity(message)

    if (product && qty) {
      return {
        type: 'ACTION',
        reply: isMl
          ? `${qty} ${product.unit} ${product.name} സ്റ്റോക്കിലേക്ക് ചേർക്കാൻ സ്ഥിരീകരിക്കുക:`
          : `Please confirm adding ${qty} ${product.unit} to ${product.name} stock:`,
        action: {
          actionType: 'RECEIVE_STOCK',
          productId: product.id,
          productName: product.name,
          productUnit: product.unit,
          quantity: qty,
          confirmationMessage: isMl
            ? `${qty} ${product.unit} ${product.name} പുതിയ സ്റ്റോക്ക് എത്തി.\nസ്റ്റോക്കിലേക്ക് ചേർക്കട്ടേ?`
            : `Add ${qty} packets to ${product.name} stock?\nThis will increase stock by ${qty}.`,
        },
      }
    }

    if (!product && qty) {
      return {
        type: 'CLARIFICATION',
        reply: isMl
          ? `${qty} എണ്ണം ഏത് ഉൽപ്പന്നമാണ് എത്തിയത് എന്ന് വ്യക്തമാക്കാമോ?`
          : `Which product did you receive ${qty} units of?`,
      }
    }

    return {
      type: 'CLARIFICATION',
      reply: isMl
        ? 'ഏത് ഉൽപ്പന്നമാണ് എത്ര അളവിലാണ് വന്നതെന്ന് വ്യക്തമാക്കാമോ?'
        : 'Could you please specify which product and how many units arrived?',
    }
  }

  // 4. Check for SALE
  const isSale =
    lower.includes('വിറ്റു') || lower.includes('വിൽക്കുക') || lower.includes('വിൽപ്പന') ||
    lower.includes('കൊടുത്തു') || lower.includes('പോയി') ||
    lower.includes('sold') || lower.includes('sell') || lower.includes('sale')

  if (isSale) {
    const product = matchProduct(message, products)
    const qty = extractQuantity(message)

    if (product && qty) {
      return {
        type: 'ACTION',
        reply: isMl
          ? `${qty} ${product.unit} ${product.name} വിൽപ്പന സ്ഥിരീകരിക്കുക:`
          : `Please confirm sale of ${qty} ${product.unit} of ${product.name}:`,
        action: {
          actionType: 'SALE',
          productId: product.id,
          productName: product.name,
          productUnit: product.unit,
          quantity: qty,
          confirmationMessage: isMl
            ? `${qty} ${product.unit} ${product.name} വിൽപ്പനയായി.\nസ്റ്റോക്ക് അപ്ഡേറ്റ് ചെയ്യട്ടേ?`
            : `Sell ${qty} packets of ${product.name}?\nThis will reduce ${product.name} stock by ${qty}.`,
        },
      }
    }

    if (!product && qty) {
      return {
        type: 'CLARIFICATION',
        reply: isMl
          ? `${qty} എണ്ണം ഏത് ഉൽപ്പന്നമാണ് വിറ്റതെന്ന് വ്യക്തമാക്കാമോ?`
          : `Which product did you sell ${qty} units of?`,
      }
    }

    return {
      type: 'CLARIFICATION',
      reply: isMl
        ? 'ഏത് ഉൽപ്പന്നമാണ് എത്ര അളവിലാണ് വിറ്റതെന്ന് വ്യക്തമാക്കാമോ?'
        : 'Could you please specify which product and how many units were sold?',
    }
  }

  // 4. Query: GET_STOCK
  const isStockQuery =
    lower.includes('സ്റ്റോക്ക്') || lower.includes('ബാക്കി') || lower.includes('എത്രയുണ്ട്') ||
    lower.includes('how much') || lower.includes('how many') || lower.includes('current stock') || lower.includes('check stock')

  if (isStockQuery) {
    const product = matchProduct(message, products)
    if (product) {
      const isLow = product.current_stock <= product.minimum_stock
      if (isMl) {
        return {
          type: 'QUERY',
          reply: `**${product.name}**\n\n• നിലവിലെ സ്റ്റോക്ക്: **${product.current_stock} ${product.unit}**\n• കുറഞ്ഞ സ്റ്റോക്ക് പരിധി: ${product.minimum_stock} ${product.unit}\n• അവസ്ഥ: ${isLow ? '⚠️ സ്റ്റോക്ക് കുറവാണ്' : '✅ ആവശ്യത്തിന് സ്റ്റോക്കുണ്ട്'}`,
        }
      } else {
        return {
          type: 'QUERY',
          reply: `**${product.name}** [${isLow ? '⚠️ LOW STOCK' : '✅ OK'}]\n\n• Current stock: **${product.current_stock} ${product.unit}**\n• Minimum stock: ${product.minimum_stock} ${product.unit}\n• Status: ${isLow ? 'below minimum level' : 'well stocked'}`,
        }
      }
    }
  }

  // 5. Query: GET_LOW_STOCK
  const isLowStockQuery =
    lower.includes('കുറവുള്ളത്') || lower.includes('കുറവ്') || lower.includes('തീരാറായത്') ||
    lower.includes('low') || lower.includes('running low') || lower.includes('reorder')

  if (isLowStockQuery) {
    const lowItems = products.filter(p => p.current_stock <= p.minimum_stock)
    if (lowItems.length === 0) {
      return {
        type: 'QUERY',
        reply: isMl
          ? '✅ എല്ലാ ഉൽപ്പന്നങ്ങളിലും ആവശ്യത്തിന് സ്റ്റോക്കുണ്ട്! ഓർഡർ ചെയ്യേണ്ട ഉൽപ്പന്നങ്ങൾ ഒന്നുമില്ല.'
          : '✅ Great news! All your products are sufficiently stocked. No items are below minimum stock.',
      }
    }

    if (isMl) {
      const list = lowItems.map(p => `• **${p.name}**: ${p.current_stock} ${p.unit} ബാക്കി (കുറഞ്ഞത്: ${p.minimum_stock})`).join('\n')
      return {
        type: 'QUERY',
        reply: `⚠️ **സ്റ്റോക്ക് കുറവുള്ള ഉൽപ്പന്നങ്ങൾ:**\n\n${list}\n\nഇവ ഉടൻ ഓർഡർ ചെയ്യാൻ നിർദ്ദേശിക്കുന്നു.`,
      }
    } else {
      const list = lowItems.map(p => `• **${p.name}**: ${p.current_stock} ${p.unit} remaining (minimum: ${p.minimum_stock})`).join('\n')
      return {
        type: 'QUERY',
        reply: `⚠️ **Here are the products running low on stock:**\n\n${list}\n\nI recommend reordering these soon to avoid stockouts.`,
      }
    }
  }


  // 7. General fallback
  const totalProducts = products.length
  const lowCount = products.filter(p => p.current_stock <= p.minimum_stock).length
  if (isMl) {
    return {
      type: 'QUERY',
      reply: `ഞാൻ നിങ്ങളുടെ StockPilot ഇൻവെന്ററി അസിസ്റ്റന്റാണ്. നിലവിലെ വിവരങ്ങൾ:\n\n• **ആകെ ഉൽപ്പന്നങ്ങൾ**: ${totalProducts}\n• **സ്റ്റോക്ക് കുറവുള്ളവ**: ${lowCount}\n• **ഇന്നത്തെ വിൽപ്പനകൾ**: ${todaySales.length}\n\nനിങ്ങൾക്ക് ചോദിക്കാം:\n- "എന്തൊക്കെയാണ് സ്റ്റോക്ക് കുറവുള്ളത്?"\n- "ഇന്ന് എത്ര രൂപയുടെ സാധനം വിറ്റു?"\n- "അരിയുടെ സ്റ്റോക്ക് എത്രയാണ്?"\n- "അഞ്ച് പാക്കറ്റ് അരി വിറ്റു"`,
    }
  } else {
    return {
      type: 'QUERY',
      reply: `I'm your StockPilot inventory assistant. Here's a quick summary:\n\n• **Total products**: ${totalProducts}\n• **Low stock items**: ${lowCount}\n• **Today's sales**: ${todaySales.length} transaction(s)\n\nYou can ask me things like:\n- "What's running low?"\n- "What did I sell today?"\n- "How much rice do I have?"\n- "I sold 5 packets of rice"`,
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, language = 'en' } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const isMl = language === 'ml'

    // Gather live inventory context
    const products = sqlite.prepare('SELECT id, name, category, current_stock, minimum_stock, unit, selling_price FROM products ORDER BY name').all() as ProductRecord[]

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString().replace('T', ' ').slice(0, 19)

    const todaySales = sqlite.prepare(`
      SELECT s.quantity, s.total_amount, p.name as product_name, p.unit as product_unit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.created_at >= ?
      ORDER BY s.created_at DESC
    `).all(todayStr) as SaleRecord[]

    // First, run deterministic parser
    const ruleResult = parseRuleBased(message, isMl, products, todaySales)

    // If ruleResult identified an ACTION or a specific QUERY, we can return it directly for ultra-fast response
    if (ruleResult.type === 'ACTION' || (ruleResult.type === 'QUERY' && ruleResult.reply.includes('•'))) {
      return NextResponse.json({
        reply: ruleResult.reply,
        type: ruleResult.type,
        action: ruleResult.action || null,
        mode: 'rule_engine',
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        reply: ruleResult.reply,
        type: ruleResult.type,
        action: ruleResult.action || null,
        mode: 'mock',
      })
    }

    // Use Gemini for natural variations
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-exp',
        generationConfig: { responseMimeType: 'application/json' },
      })

      const prompt = `You are StockPilot, an inventory assistant for a small Indian retail shop.
Language required: ${isMl ? 'Malayalam' : 'English'}.
Translate and reply ONLY in ${isMl ? 'Malayalam' : 'English'}.

CURRENT PRODUCTS IN STORE:
${JSON.stringify(products.map(p => ({ id: p.id, name: p.name, current_stock: p.current_stock, unit: p.unit, min_stock: p.minimum_stock, price: p.selling_price })), null, 2)}

TODAY'S SALES:
${JSON.stringify(todaySales, null, 2)}

USER MESSAGE: "${message}"

Task:
Determine if user message is:
1. "ACTION":
   - "SALE": User sold an item. Extract product id and quantity.
   - "RECEIVE_STOCK": New stock arrived. Extract product id and quantity.
   - "UPDATE_PRICE": Price update. Extract product id and newPrice.
2. "QUERY": User asking about stock, low stock, today's sales, or general info.
3. "CLARIFICATION": Ambiguous action command without clear product or quantity.

Respond with strict JSON:
{
  "type": "ACTION" | "QUERY" | "CLARIFICATION",
  "reply": "friendly explanation in ${isMl ? 'Malayalam' : 'English'}",
  "action": null or {
    "actionType": "SALE" | "RECEIVE_STOCK" | "UPDATE_PRICE",
    "productId": number,
    "productName": string,
    "productUnit": string,
    "quantity": number (optional),
    "newPrice": number (optional),
    "confirmationMessage": "confirmation string asking user to confirm before changing data in ${isMl ? 'Malayalam' : 'English'}"
  }
}`

      const result = await model.generateContent(prompt)
      const text = result.response.text()
      const parsed = JSON.parse(text)

      return NextResponse.json({
        reply: parsed.reply || ruleResult.reply,
        type: parsed.type || ruleResult.type,
        action: parsed.action || ruleResult.action || null,
        mode: 'gemini',
      })
    } catch (aiErr) {
      console.error('Gemini error, fallback to ruleResult:', aiErr)
      return NextResponse.json({
        reply: ruleResult.reply,
        type: ruleResult.type,
        action: ruleResult.action || null,
        mode: 'fallback',
      })
    }
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}
