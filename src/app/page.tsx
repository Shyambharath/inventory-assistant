'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package, TrendingUp, ShoppingCart, AlertTriangle,
  IndianRupee, Plus, RefreshCw, CheckCircle, Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RecordSaleModal } from '@/components/RecordSaleModal'
import { ProductForm } from '@/components/ProductForm'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import type { DashboardStats, Product, Sale } from '@/types'

function StatCard({
  title, value, subtitle, icon: Icon, color = 'indigo',
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ComponentType<{ className?: string }>
  color?: 'indigo' | 'green' | 'amber' | 'blue' | 'red'
}) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <Card className="shadow-xs border-gray-200/80">
      <CardContent className="p-3.5 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-1.5">
            <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900 mt-0.5 sm:mt-1 truncate">{value}</p>
            {subtitle && <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className={`flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl shrink-0 ${colors[color]}`}>
            <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { language, t } = useLanguage()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [productModalOpen, setProductModalOpen] = useState(false)
  const [markedOrdered, setMarkedOrdered] = useState<Set<number>>(new Set())

  const fetchData = useCallback(async () => {
    try {
      const [dashRes, prodRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/products'),
      ])
      const dashData = await dashRes.json()
      const prodData = await prodRes.json()
      setStats(dashData)
      setProducts(prodData.products || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSaleRecorded = () => {
    fetchData()
  }

  const handleProductSaved = () => {
    fetchData()
  }

  const handleMarkOrdered = (productId: number) => {
    setMarkedOrdered(prev => {
      const next = new Set(prev)
      next.add(productId)
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-500">{language === 'ml' ? 'StockPilot ലോഡ് ചെയ്യുന്നു...' : 'Loading StockPilot...'}</p>
        </div>
      </div>
    )
  }

  const lowStockItems = stats?.lowStockProducts.filter(p => !markedOrdered.has(p.id)) || []

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-5 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('dashboardTitle')}</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5 sm:mt-1">
            {new Date().toLocaleDateString(language === 'ml' ? 'ml-IN' : 'en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setProductModalOpen(true)}
            className="flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial h-11 text-sm sm:text-base font-semibold"
          >
            <Plus className="h-5 w-5 text-indigo-600" />
            {t('addProduct')}
          </Button>
          <Button
            size="lg"
            onClick={() => setSaleModalOpen(true)}
            className="flex items-center justify-center gap-2 shadow-xs flex-1 sm:flex-initial h-11 text-sm sm:text-base font-semibold"
          >
            <ShoppingCart className="h-5 w-5" />
            {t('recordSaleBtn')}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 sm:gap-4">
        <StatCard
          title={t('totalProducts')}
          value={stats?.totalProducts.toString() || '0'}
          icon={Package}
          color="indigo"
        />
        <StatCard
          title={t('totalUnits')}
          value={stats?.totalUnits.toLocaleString('en-IN') || '0'}
          subtitle={t('inStock')}
          icon={TrendingUp}
          color="blue"
        />
        <StatCard
          title={t('todaySales')}
          value={formatCurrency(stats?.todaySalesRevenue || 0)}
          subtitle={`${stats?.todaySalesCount || 0} ${t('transactions')}`}
          icon={ShoppingCart}
          color="green"
        />
        <StatCard
          title={t('lowStock')}
          value={stats?.lowStockCount.toString() || '0'}
          subtitle={t('needAttention')}
          icon={AlertTriangle}
          color={stats?.lowStockCount ? 'amber' : 'indigo'}
        />
        <StatCard
          title={t('inventoryValue')}
          value={formatCurrency(stats?.inventoryValue || 0)}
          subtitle={t('atSellingPrice')}
          icon={IndianRupee}
          color="green"
        />
      </div>

      {stats?.totalProducts === 0 && (
        <Card className="border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 p-6 sm:p-8 text-center shadow-xs rounded-2xl border">
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <Package className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {language === 'ml' ? 'നിങ്ങളുടെ കടയിലെ ഉൽപ്പന്നങ്ങൾ ചേർക്കുക' : 'Start Adding Your Products'}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              {language === 'ml'
                ? 'നിങ്ങളുടെ ഇൻവെന്ററി ഇപ്പോൾ ശൂന്യമാണ്. ഉൽപ്പന്നങ്ങളുടെ പേര്, സ്റ്റോക്ക്, വിൽക്കുന്ന വില എന്നിവ നൽകി തുടങ്ങാം.'
                : 'Your inventory is currently empty. Add your products with price and stock to start tracking sales and low stock.'}
            </p>
            <div className="pt-2">
              <Button
                onClick={() => setProductModalOpen(true)}
                className="inline-flex items-center gap-2 shadow-xs font-semibold"
              >
                <Plus className="h-4 w-4" />
                {t('addProduct')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
        {/* Low Stock Alerts */}
        <Card className="shadow-xs border-gray-200/80">
          <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t('lowStockAlerts')}
              {lowStockItems.length > 0 && (
                <Badge variant="warning">{lowStockItems.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {lowStockItems.length === 0 ? (
              <div className="flex items-center gap-3 py-6 text-center justify-center text-gray-400">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">{t('allStockedWell')}</span>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lowStockItems.map(product => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100 gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        {product.currentStock} {product.unit} {t('left')} · {t('min')}: {product.minimumStock}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs shrink-0 h-8 px-2.5 bg-white border-amber-200 text-amber-800 hover:bg-amber-100"
                      onClick={() => handleMarkOrdered(product.id)}
                    >
                      {t('markOrdered')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card className="shadow-xs border-gray-200/80">
          <CardHeader className="pb-3 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-5 w-5 text-indigo-500" />
              {t('recentSales')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            {!stats?.recentSales || stats.recentSales.length === 0 ? (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <p className="text-sm">{t('noSalesYet')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSales.map((sale: Sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{sale.productName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {sale.quantity} {sale.productUnit} · {sale.createdAt ? formatDate(sale.createdAt) : ''} {sale.createdAt ? formatTime(sale.createdAt) : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-green-700">
                      {formatCurrency(sale.totalAmount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RecordSaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        products={products.filter(p => p.currentStock > 0)}
        onSaleRecorded={handleSaleRecorded}
      />

      <ProductForm
        open={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        product={null}
        onSaved={handleProductSaved}
      />
    </div>
  )
}
