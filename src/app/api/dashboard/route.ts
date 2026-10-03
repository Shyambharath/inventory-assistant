import { NextResponse } from 'next/server'
import { sqlite } from '@/lib/db'
import { seedDatabase } from '@/lib/seed'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStr = todayStart.toISOString().replace('T', ' ').slice(0, 19)

    const totalProducts = (sqlite.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }).count
    const totalUnits = (sqlite.prepare('SELECT COALESCE(SUM(current_stock), 0) as total FROM products').get() as { total: number }).total
    const inventoryValue = (sqlite.prepare('SELECT COALESCE(SUM(selling_price * current_stock), 0) as value FROM products').get() as { value: number }).value

    const todaySales = sqlite.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM sales
      WHERE created_at >= ?
    `).get(todayStr) as { count: number; revenue: number }

    const lowStockProducts = sqlite.prepare(`
      SELECT * FROM products
      WHERE current_stock <= minimum_stock
      ORDER BY (current_stock * 1.0 / NULLIF(minimum_stock, 0)) ASC
    `).all() as Array<Record<string, unknown>>

    const recentSales = sqlite.prepare(`
      SELECT s.*, p.name as product_name, p.unit as product_unit
      FROM sales s
      JOIN products p ON s.product_id = p.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `).all() as Array<Record<string, unknown>>

    return NextResponse.json({
      totalProducts,
      totalUnits,
      todaySalesCount: todaySales.count,
      todaySalesRevenue: todaySales.revenue,
      inventoryValue,
      lowStockCount: lowStockProducts.length,
      lowStockProducts: lowStockProducts.map(p => ({
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
        isLowStock: true,
      })),
      recentSales: recentSales.map(s => ({
        id: s.id,
        productId: s.product_id,
        quantity: s.quantity,
        totalAmount: s.total_amount,
        createdAt: s.created_at,
        productName: s.product_name,
        productUnit: s.product_unit,
      })),
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 })
  }
}
