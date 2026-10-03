import { sqlite } from './db'

const DEMO_PRODUCTS = [
  {
    name: 'Rice (5kg)',
    category: 'Grains',
    sku: 'GRN-RICE-5KG',
    selling_price: 250,
    cost_price: 190,
    current_stock: 8,
    minimum_stock: 15,
    unit: 'bags',
    supplier: 'Agarwal Traders',
  },
  {
    name: 'Cooking Oil (1L)',
    category: 'Oil & Ghee',
    sku: 'OIL-COOK-1L',
    selling_price: 180,
    cost_price: 145,
    current_stock: 4,
    minimum_stock: 10,
    unit: 'bottles',
    supplier: 'Manoj Distributors',
  },
  {
    name: 'Sugar (1kg)',
    category: 'Essentials',
    sku: 'ESS-SUGAR-1KG',
    selling_price: 45,
    cost_price: 38,
    current_stock: 25,
    minimum_stock: 20,
    unit: 'packets',
    supplier: 'Sharma & Sons',
  },
  {
    name: 'Milk (1L)',
    category: 'Dairy',
    sku: 'DRY-MILK-1L',
    selling_price: 65,
    cost_price: 55,
    current_stock: 3,
    minimum_stock: 8,
    unit: 'pouches',
    supplier: 'Local Dairy Co.',
  },
  {
    name: 'Good Day Biscuits',
    category: 'Snacks',
    sku: 'SNK-BISCUIT-GD',
    selling_price: 30,
    cost_price: 22,
    current_stock: 40,
    minimum_stock: 20,
    unit: 'packets',
    supplier: 'Britannia Distributor',
  },
  {
    name: 'Tata Tea Premium (250g)',
    category: 'Beverages',
    sku: 'BEV-TEA-TATA',
    selling_price: 120,
    cost_price: 95,
    current_stock: 12,
    minimum_stock: 10,
    unit: 'packets',
    supplier: 'Tata Consumer Products',
  },
  {
    name: 'Nescafe Classic (50g)',
    category: 'Beverages',
    sku: 'BEV-COFFEE-NESCAFE',
    selling_price: 220,
    cost_price: 175,
    current_stock: 6,
    minimum_stock: 5,
    unit: 'jars',
    supplier: 'Nestle Distributor',
  },
  {
    name: 'Lux Soap (100g)',
    category: 'Personal Care',
    sku: 'PC-SOAP-LUX',
    selling_price: 40,
    cost_price: 30,
    current_stock: 2,
    minimum_stock: 5,
    unit: 'bars',
    supplier: 'HUL Distributor',
  },
  {
    name: "Head & Shoulders (180ml)",
    category: 'Personal Care',
    sku: 'PC-SHAMP-HNS',
    selling_price: 180,
    cost_price: 140,
    current_stock: 18,
    minimum_stock: 10,
    unit: 'bottles',
    supplier: 'P&G Distributor',
  },
  {
    name: 'Bisleri Water (1L)',
    category: 'Beverages',
    sku: 'BEV-WATER-BISL',
    selling_price: 20,
    cost_price: 12,
    current_stock: 30,
    minimum_stock: 24,
    unit: 'bottles',
    supplier: 'Bisleri International',
  },
]

export function seedDatabase() {
  // Check if already seeded
  const existing = sqlite.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number }
  if (existing.count > 0) {
    return { seeded: false, message: 'Database already has data' }
  }

  const insertProduct = sqlite.prepare(`
    INSERT INTO products (name, category, sku, selling_price, cost_price, current_stock, minimum_stock, unit, supplier)
    VALUES (@name, @category, @sku, @selling_price, @cost_price, @current_stock, @minimum_stock, @unit, @supplier)
  `)

  const insertSale = sqlite.prepare(`
    INSERT INTO sales (product_id, quantity, total_amount, created_at)
    VALUES (@product_id, @quantity, @total_amount, @created_at)
  `)

  const seedAll = sqlite.transaction(() => {
    // Insert all products
    for (const product of DEMO_PRODUCTS) {
      insertProduct.run(product)
    }

    // Get all product IDs by SKU for sales
    const getProduct = sqlite.prepare('SELECT id, selling_price FROM products WHERE sku = ?')

    const now = new Date()
    const today = now.toISOString().replace('T', ' ').slice(0, 19)

    // Helper to get datetime offset by hours
    const offsetHours = (h: number) => {
      const d = new Date(now.getTime() - h * 60 * 60 * 1000)
      return d.toISOString().replace('T', ' ').slice(0, 19)
    }

    const offsetDays = (days: number) => {
      const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
      return d.toISOString().replace('T', ' ').slice(0, 19)
    }

    // Create realistic demo sales
    const demoSales = [
      { sku: 'GRN-RICE-5KG', qty: 2, time: offsetHours(1) },
      { sku: 'DRY-MILK-1L', qty: 3, time: offsetHours(2) },
      { sku: 'BEV-WATER-BISL', qty: 6, time: offsetHours(3) },
      { sku: 'SNK-BISCUIT-GD', qty: 5, time: offsetHours(4) },
      { sku: 'ESS-SUGAR-1KG', qty: 2, time: offsetHours(5) },
      { sku: 'OIL-COOK-1L', qty: 1, time: offsetDays(1) },
      { sku: 'BEV-TEA-TATA', qty: 3, time: offsetDays(1) },
      { sku: 'PC-SOAP-LUX', qty: 2, time: offsetDays(1) },
      { sku: 'GRN-RICE-5KG', qty: 3, time: offsetDays(2) },
      { sku: 'BEV-WATER-BISL', qty: 12, time: offsetDays(2) },
      { sku: 'BEV-COFFEE-NESCAFE', qty: 1, time: offsetDays(2) },
      { sku: 'SNK-BISCUIT-GD', qty: 8, time: offsetDays(3) },
      { sku: 'PC-SHAMP-HNS', qty: 2, time: offsetDays(3) },
      { sku: 'DRY-MILK-1L', qty: 5, time: offsetDays(4) },
      { sku: 'ESS-SUGAR-1KG', qty: 4, time: offsetDays(4) },
      { sku: 'GRN-RICE-5KG', qty: 1, time: offsetDays(5) },
      { sku: 'BEV-TEA-TATA', qty: 2, time: offsetDays(5) },
      { sku: 'OIL-COOK-1L', qty: 2, time: offsetDays(6) },
      { sku: 'BEV-WATER-BISL', qty: 10, time: offsetDays(6) },
      { sku: 'SNK-BISCUIT-GD', qty: 6, time: offsetDays(7) },
    ]

    for (const sale of demoSales) {
      const product = getProduct.get(sale.sku) as { id: number; selling_price: number } | undefined
      if (product) {
        insertSale.run({
          product_id: product.id,
          quantity: sale.qty,
          total_amount: product.selling_price * sale.qty,
          created_at: sale.time,
        })
      }
    }
  })

  seedAll()
  return { seeded: true, message: 'Demo data seeded successfully' }
}

export function clearAllData() {
  sqlite.exec('DELETE FROM sales; DELETE FROM products; DELETE FROM users;')
  return { cleared: true, message: 'All inventory and sales data cleared successfully' }
}

export function resetAndReseed() {
  sqlite.exec('DELETE FROM sales; DELETE FROM products; DELETE FROM users;')
  return seedDatabase()
}
