import { NextRequest, NextResponse } from 'next/server'
import { sqlite } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(100),
  category: z.string().min(1, 'Category is required'),
  sku: z.string().min(1, 'SKU is required'),
  sellingPrice: z.number().positive('Selling price must be positive'),
  costPrice: z.number().min(0, 'Cost price cannot be negative'),
  currentStock: z.number().int().min(0, 'Stock cannot be negative'),
  minimumStock: z.number().int().min(0, 'Minimum stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  supplier: z.string().optional().default(''),
})

function mapProduct(p: Record<string, unknown>) {
  return {
    id: p.id,
    name: p.name,
    category: p.category,
    sku: p.sku,
    sellingPrice: p.selling_price,
    costPrice: p.cost_price,
    currentStock: p.current_stock,
    minimumStock: p.minimum_stock,
    unit: p.unit,
    supplier: p.supplier,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    isLowStock: (p.current_stock as number) <= (p.minimum_stock as number),
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || ''
    const lowStock = searchParams.get('lowStock') === 'true'

    let query = 'SELECT * FROM products WHERE 1=1'
    const params: (string | number)[] = []

    if (search) {
      query += ' AND (name LIKE ? OR sku LIKE ? OR category LIKE ?)'
      const term = `%${search}%`
      params.push(term, term, term)
    }

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    if (lowStock) {
      query += ' AND current_stock <= minimum_stock'
    }

    query += ' ORDER BY name ASC'

    const products = sqlite.prepare(query).all(...params) as Array<Record<string, unknown>>

    // Get all unique categories
    const categories = sqlite.prepare('SELECT DISTINCT category FROM products ORDER BY category').all() as Array<{ category: string }>

    return NextResponse.json({
      products: products.map(mapProduct),
      categories: categories.map(c => c.category),
    })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = createProductSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const data = result.data

    // Check duplicate SKU
    const existing = sqlite.prepare('SELECT id FROM products WHERE sku = ?').get(data.sku)
    if (existing) {
      return NextResponse.json(
        { error: `SKU "${data.sku}" is already in use. Please use a unique SKU.`, field: 'sku' },
        { status: 409 }
      )
    }

    const insert = sqlite.prepare(`
      INSERT INTO products (name, category, sku, selling_price, cost_price, current_stock, minimum_stock, unit, supplier)
      VALUES (@name, @category, @sku, @sellingPrice, @costPrice, @currentStock, @minimumStock, @unit, @supplier)
    `)

    const info = insert.run({
      name: data.name,
      category: data.category,
      sku: data.sku,
      sellingPrice: data.sellingPrice,
      costPrice: data.costPrice,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
      unit: data.unit,
      supplier: data.supplier || null,
    })

    const product = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid) as Record<string, unknown>

    return NextResponse.json({ product: mapProduct(product) }, { status: 201 })
  } catch (error) {
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
