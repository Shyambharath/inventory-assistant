'use client'

import { useState, useEffect, useCallback } from 'react'
import { ShoppingCart, TrendingUp, Package, RefreshCw, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatTime } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import type { Sale, SalesPeriod } from '@/types'

interface SalesSummary {
  totalTransactions: number
  totalRevenue: number
  totalUnitsSold: number
  topProduct: { name: string; revenue: number; units_sold: number } | null
}

export default function SalesPage() {
  const { language, t } = useLanguage()
  const [period, setPeriod] = useState<SalesPeriod>('today')
  const [sales, setSales] = useState<Sale[]>([])
  const [summary, setSummary] = useState<SalesSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSales = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales?period=${period}`)
      const data = await res.json()
      setSales(data.sales || [])
      setSummary(data.summary || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  const periodLabels: Record<SalesPeriod, string> = {
    today: t('periodToday'),
    week: t('periodWeek'),
    month: t('periodMonth'),
  }

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('salesTitle')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{t('salesSubtitle')}</p>
        </div>
        <div className="flex w-full sm:w-auto bg-white border border-gray-200/90 rounded-xl p-1 shadow-2xs">
          {(['today', 'week', 'month'] as SalesPeriod[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                period === p
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="shadow-xs border-gray-200/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-green-50 shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">{t('revenue')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{formatCurrency(summary?.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xs border-gray-200/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">{t('transactionsCount')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{summary?.totalTransactions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xs border-gray-200/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-blue-50 shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">{t('unitsSold')}</p>
                <p className="text-sm sm:text-lg font-bold text-gray-900 truncate">{summary?.totalUnitsSold || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xs border-gray-200/80">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-amber-50 shrink-0">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs text-gray-500 truncate">{t('topProduct')}</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                  {summary?.topProduct?.name || '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-500" />
            {t('salesFor')} {periodLabels[period]}
            <Badge variant="secondary">{sales.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="h-6 w-6 text-indigo-500 animate-spin" />
            </div>
          ) : sales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <ShoppingCart className="h-10 w-10 mb-3" />
              <p className="text-sm">{t('noSalesPeriod')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 px-6 py-3">{t('thProduct')}</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">{t('thQty')}</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">{t('thAmount')}</th>
                    <th className="text-right text-xs font-medium text-gray-500 px-6 py-3">{t('thDateTime')}</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(sale => (
                    <tr key={sale.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{sale.productName}</p>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-gray-600">
                          {sale.quantity} {sale.productUnit}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-semibold text-green-700">
                          {formatCurrency(sale.totalAmount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs text-gray-500">
                          <p>{sale.createdAt ? formatDate(sale.createdAt) : ''}</p>
                          <p>{sale.createdAt ? formatTime(sale.createdAt) : ''}</p>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
