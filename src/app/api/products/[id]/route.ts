import { NextRequest, NextResponse } from 'next/server'
import { sqlite } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const updateProductSchema = z.object({
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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(params.id) as Record<string, unknown> | undefined
  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }
  return NextResponse.json({ product: mapProduct(product) })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const body = await request.json()
    const result = updateProductSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const data = result.data

    // Check duplicate SKU (excluding current product)
    const skuConflict = sqlite.prepare('SELECT id FROM products WHERE sku = ? AND id != ?').get(data.sku, params.id)
    if (skuConflict) {
      return NextResponse.json(
        { error: `SKU "${data.sku}" is already in use by another product.`, field: 'sku' },
        { status: 409 }
      )
    }

    sqlite.prepare(`
      UPDATE products
      SET name = @name, category = @category, sku = @sku,
          selling_price = @sellingPrice, cost_price = @costPrice,
          current_stock = @currentStock, minimum_stock = @minimumStock,
          unit = @unit, supplier = @supplier,
          updated_at = datetime('now', 'localtime')
      WHERE id = @id
    `).run({
      name: data.name,
      category: data.category,
      sku: data.sku,
      sellingPrice: data.sellingPrice,
      costPrice: data.costPrice,
      currentStock: data.currentStock,
      minimumStock: data.minimumStock,
      unit: data.unit,
      supplier: data.supplier || null,
      id: params.id,
    })

    const updated = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(params.id) as Record<string, unknown>
    return NextResponse.json({ product: mapProduct(updated) })
  } catch (error) {
    console.error('Product PUT error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existing = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(params.id)
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    sqlite.prepare('DELETE FROM products WHERE id = ?').run(params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
