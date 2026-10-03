import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
})

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  category: text('category').notNull(),
  sku: text('sku').notNull().unique(),
  sellingPrice: real('selling_price').notNull(),
  costPrice: real('cost_price').notNull(),
  currentStock: integer('current_stock').notNull().default(0),
  minimumStock: integer('minimum_stock').notNull().default(10),
  unit: text('unit').notNull().default('units'),
  supplier: text('supplier'),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now', 'localtime'))`),
})

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: integer('quantity').notNull(),
  totalAmount: real('total_amount').notNull(),
  createdAt: text('created_at').default(sql`(datetime('now', 'localtime'))`),
})
