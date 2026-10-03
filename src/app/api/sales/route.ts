import { NextRequest, NextResponse } from 'next/server'
import { sqlite } from '@/lib/db'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSaleSchema = z.object({
  productId: z.number().int().positive('Product ID must be a positive integer'),
  quantity: z.number().int().positive('Quantity must be at least 1'),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    let dateFilter = ''
    const now = new Date()

    if (period === 'today') {
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      dateFilter = todayStart.toISOString().replace('T', ' ').slice(0, 19)
    } else if (period === 'week') {
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - 7)
      weekStart.setHours(0, 0, 0, 0)
      dateFilter = weekStart.toISOString().replace('T', ' ').slice(0, 19)
    } else if (period === 'month') {
      const monthStart = new Date(now)
      monthStart.setDate(now.getDate() - 30)
      monthStart.setHours(0, 0, 0, 0)
      dateFilter = monthStart.toISOString().replace('T', ' ').slice(0, 19)
    }

    const salesRows = sqlite.prepare(`
      SELECT s.*, p.name as product_name, p.unit as product_unit, p.selling_price
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.created_at >= ?
      ORDER BY s.created_at DESC
    `).all(dateFilter) as Array<Record<string, unknown>>

    const summary = sqlite.prepare(`
      SELECT
        COUNT(*) as total_transactions,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(quantity), 0) as total_units_sold
      FROM sales
      WHERE created_at >= ?
    `).get(dateFilter) as { total_transactions: number; total_revenue: number; total_units_sold: number }

    // Top product by revenue
    const topProduct = sqlite.prepare(`
      SELECT p.name, SUM(s.total_amount) as revenue, SUM(s.quantity) as units_sold
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.created_at >= ?
      GROUP BY s.product_id
      ORDER BY revenue DESC
      LIMIT 1
    `).get(dateFilter) as { name: string; revenue: number; units_sold: number } | undefined

    return NextResponse.json({
      sales: salesRows.map(s => ({
        id: s.id,
        productId: s.product_id,
        quantity: s.quantity,
        totalAmount: s.total_amount,
        createdAt: s.created_at,
        productName: s.product_name,
        productUnit: s.product_unit,
      })),
      summary: {
        totalTransactions: summary.total_transactions,
        totalRevenue: summary.total_revenue,
        totalUnitsSold: summary.total_units_sold,
        topProduct: topProduct || null,
      },
    })
  } catch (error) {
    console.error('Sales GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = createSaleSchema.safeParse(body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      return NextResponse.json(
        { error: firstError.message, field: firstError.path[0] },
        { status: 400 }
      )
    }

    const { productId, quantity } = result.data

    // Get product with stock info
    const product = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Record<string, unknown> | undefined

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const currentStock = product.current_stock as number
    const sellingPrice = product.selling_price as number

    if (quantity > currentStock) {
      return NextResponse.json(
        {
          error: `Insufficient stock. Only ${currentStock} ${product.unit} of "${product.name}" available.`,
          field: 'quantity',
        },
        { status: 400 }
      )
    }

    const totalAmount = sellingPrice * quantity

    // Atomic transaction: insert sale + update stock
    const recordSale = sqlite.transaction(() => {
      sqlite.prepare(`
        INSERT INTO sales (product_id, quantity, total_amount)
        VALUES (?, ?, ?)
      `).run(productId, quantity, totalAmount)

      sqlite.prepare(`
        UPDATE products
        SET current_stock = current_stock - ?,
            updated_at = datetime('now', 'localtime')
        WHERE id = ?
      `).run(quantity, productId)
    })

    recordSale()

    const updatedProduct = sqlite.prepare('SELECT * FROM products WHERE id = ?').get(productId) as Record<string, unknown>
    const newStock = updatedProduct.current_stock as number
    const minimumStock = updatedProduct.minimum_stock as number

    return NextResponse.json({
      success: true,
      sale: {
        productId,
        quantity,
        totalAmount,
        productName: product.name,
      },
      updatedStock: newStock,
      isLowStock: newStock <= minimumStock,
      lowStockMessage:
        newStock <= minimumStock
          ? `⚠️ "${product.name}" is now low on stock (${newStock} remaining, minimum is ${minimumStock}).`
          : null,
    })
  } catch (error) {
    console.error('Sales POST error:', error)
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 })
  }
}
