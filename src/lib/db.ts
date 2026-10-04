import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const isVercel = Boolean(process.env.VERCEL)
let DB_PATH = path.join(process.cwd(), 'stockpilot.db')

if (isVercel) {
  const tmpPath = path.join('/tmp', 'stockpilot.db')
  if (!fs.existsSync(tmpPath) && fs.existsSync(DB_PATH)) {
    try {
      fs.copyFileSync(DB_PATH, tmpPath)
    } catch (e) {
      console.warn('Could not copy db to /tmp:', e)
    }
  }
  DB_PATH = tmpPath
}

const sqlite = new Database(DB_PATH)

// Enable WAL mode for better performance on local dev
if (!isVercel) {
  sqlite.pragma('journal_mode = WAL')
}
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    selling_price REAL NOT NULL CHECK(selling_price >= 0),
    cost_price REAL NOT NULL CHECK(cost_price >= 0),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK(current_stock >= 0),
    minimum_stock INTEGER NOT NULL DEFAULT 10 CHECK(minimum_stock >= 0),
    unit TEXT NOT NULL DEFAULT 'units',
    supplier TEXT,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    total_amount REAL NOT NULL CHECK(total_amount >= 0),
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  );
`)

export { sqlite }
