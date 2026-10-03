import { NextRequest, NextResponse } from 'next/server'
import { sqlite } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionType, productId, quantity, newPrice, language = 'en' } = body

    if (!productId || !actionType) {
      return NextResponse.json({ error: 'Missing productId or actionType' }, { status: 400 })
    }

    const product = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Record<string, unknown> | undefined
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const isMl = language === 'ml'
    const name = product.name as string
    const unit = product.unit as string

    if (actionType === 'SALE') {
      const qty = parseInt(quantity, 10)
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: isMl ? 'അളവ് ശരിയല്ല' : 'Invalid quantity' }, { status: 400 })
      }

      const currentStock = product.current_stock as number
      if (qty > currentStock) {
        return NextResponse.json({
          error: isMl
            ? `ആവശ്യത്തിന് സ്റ്റോക്കില്ല (${currentStock} ${unit} മാത്രം ബാക്കി)`
            : `Insufficient stock (${currentStock} ${unit} available)`
        }, { status: 400 })
      }

      const sellingPrice = product.selling_price as number
      const totalAmount = sellingPrice * qty

      // Atomic transaction: record sale and decrease stock
      sqlite.transaction(() => {
        sqlite.prepare(`
          INSERT INTO sales (product_id, quantity, total_amount)
          VALUES (?, ?, ?)
        `).run(productId, qty, totalAmount)

        sqlite.prepare(`
          UPDATE products
          SET current_stock = current_stock - ?,
              updated_at = datetime('now', 'localtime')
          WHERE id = ?
        `).run(qty, productId)
      })()

      const updated = sqlite.prepare('SELECT current_stock, minimum_stock FROM products WHERE id = ?').get(productId) as { current_stock: number; minimum_stock: number }
      const newStock = updated.current_stock

      const message = isMl
        ? `✅ ${qty} ${unit} ${name} വിൽപ്പന രേഖപ്പെടുത്തി. പുതിയ സ്റ്റോക്ക്: ${newStock} ${unit}.`
        : `✅ Sold ${qty} ${unit} of ${name}. New stock: ${newStock} ${unit}.`

      return NextResponse.json({
        success: true,
        message,
        newStock,
      })
    }

    if (actionType === 'RECEIVE_STOCK') {
      const qty = parseInt(quantity, 10)
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json({ error: isMl ? 'അളവ് ശരിയല്ല' : 'Invalid quantity' }, { status: 400 })
      }

      sqlite.prepare(`
        UPDATE products
        SET current_stock = current_stock + ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(qty, productId)

      const updated = sqlite.prepare('SELECT current_stock FROM products WHERE id = ?').get(productId) as { current_stock: number }
      const newStock = updated.current_stock

      const message = isMl
        ? `✅ ${qty} ${unit} ${name} സ്റ്റോക്കിലേക്ക് ചേർത്തു. പുതിയ സ്റ്റോക്ക്: ${newStock} ${unit}.`
        : `✅ Added ${qty} ${unit} to ${name}. New stock: ${newStock} ${unit}.`

      return NextResponse.json({
        success: true,
        message,
        newStock,
      })
    }

    if (actionType === 'UPDATE_PRICE') {
      const price = parseFloat(newPrice)
      if (isNaN(price) || price < 0) {
        return NextResponse.json({ error: isMl ? 'വില ശരിയല്ല' : 'Invalid price' }, { status: 400 })
      }

      sqlite.prepare(`
        UPDATE products
        SET selling_price = ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(price, productId)

      const message = isMl
        ? `✅ ${name} വില ₹${price} ആക്കി മാറ്റി.`
        : `✅ Updated price of ${name} to ₹${price}.`

      return NextResponse.json({
        success: true,
        message,
        newPrice: price,
      })
    }

    return NextResponse.json({ error: 'Unknown action type' }, { status: 400 })
  } catch (error) {
    console.error('Action execution error:', error)
    return NextResponse.json({ error: 'Failed to execute action' }, { status: 500 })
  }
}
