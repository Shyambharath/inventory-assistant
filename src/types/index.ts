export interface Product {
  id: number
  name: string
  category: string
  sku: string
  sellingPrice: number
  costPrice: number
  currentStock: number
  minimumStock: number
  unit: string
  supplier: string | null
  createdAt: string | null
  updatedAt: string | null
  isLowStock?: boolean
}

export interface Sale {
  id: number
  productId: number
  quantity: number
  totalAmount: number
  createdAt: string | null
  productName?: string
  productUnit?: string
}

export interface DashboardStats {
  totalProducts: number
  totalUnits: number
  todaySalesCount: number
  todaySalesRevenue: number
  inventoryValue: number
  lowStockCount: number
  lowStockProducts: Product[]
  recentSales: Sale[]
}

export interface ActionProposal {
  actionType: 'SALE' | 'RECEIVE_STOCK' | 'UPDATE_PRICE'
  productId: number
  productName: string
  productUnit?: string
  quantity?: number
  newPrice?: number
  confirmationMessage: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  resultMessage?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  action?: ActionProposal
}

export interface ApiError {
  error: string
  field?: string
}

export type SalesPeriod = 'today' | 'week' | 'month'
