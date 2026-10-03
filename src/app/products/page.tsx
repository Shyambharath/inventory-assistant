'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Search, Filter, Edit2, Trash2,
  AlertTriangle, Package, RefreshCw, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { ProductForm } from '@/components/ProductForm'
import { RecordSaleModal } from '@/components/RecordSaleModal'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import type { Product } from '@/types'

export default function ProductsPage() {
  const { language, t } = useLanguage()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [saleModalOpen, setSaleModalOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category && category !== 'all') params.set('category', category)
      if (lowStockOnly) params.set('lowStock', 'true')

      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      setProducts(data.products || [])
      if (data.categories?.length > 0) setCategories(data.categories)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, category, lowStockOnly])

  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300)
    return () => clearTimeout(timer)
  }, [fetchProducts])

  const handleDelete = async (id: number) => {
    setDeleting(true)
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' })
      setDeleteConfirm(null)
      fetchProducts()
    } catch {
      // ignore
    } finally {
      setDeleting(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setFormOpen(true)
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditProduct(null)
  }

  return (
    <div className="p-3.5 sm:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('productsTitle')}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">{products.length} {t('productsFound')}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={() => setSaleModalOpen(true)} className="flex-1 sm:flex-none justify-center h-10 text-xs sm:text-sm">
            {t('recordSaleBtn')}
          </Button>
          <Button onClick={() => setFormOpen(true)} className="flex-1 sm:flex-none justify-center h-10 text-xs sm:text-sm shadow-xs">
            <Plus className="h-4 w-4 mr-1 shrink-0" />
            {t('addProduct')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Select value={category || 'all'} onValueChange={val => setCategory(val === 'all' ? '' : val)}>
            <SelectTrigger className="flex-1 sm:w-48 h-10 text-sm">
              <SelectValue placeholder={t('allCategories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allCategories')}</SelectItem>
              {categories.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={lowStockOnly ? 'warning' : 'outline'}
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="gap-1.5 whitespace-nowrap h-10 px-3 text-xs sm:text-sm shrink-0"
          >
            <AlertTriangle className="h-4 w-4" />
            {t('lowStockFilter')}
          </Button>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <RefreshCw className="h-7 w-7 text-indigo-500 animate-spin" />
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">{t('noProductsFound')}</p>
            <p className="text-sm mt-1">{t('adjustFilterText')}</p>
            {!search && !category && (
              <Button className="mt-4" onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4 mr-1" /> {t('addFirstProduct')}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map(product => (
            <Card key={product.id} className={product.isLowStock ? 'border-amber-200' : ''}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900 truncate">{product.name}</h3>
                      {product.isLowStock && (
                        <Badge variant="warning">{t('lowStockFilter')}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{product.sku}</p>
                  </div>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-400">{t('inStock')}</p>
                    <p className={`text-xl font-bold ${product.isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                      {product.currentStock}
                      <span className="text-sm font-normal text-gray-400 ml-1">{product.unit}</span>
                    </p>
                    {product.isLowStock && (
                      <p className="text-xs text-amber-600 mt-0.5">{t('min')}: {product.minimumStock}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t('price')}</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(product.sellingPrice)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t('cost')}: {formatCurrency(product.costPrice)}</p>
                  </div>
                </div>

                {product.supplier && (
                  <p className="text-xs text-gray-400 mb-3">📦 {product.supplier}</p>
                )}

                {/* Delete confirm */}
                {deleteConfirm === product.id ? (
                  <div className="flex gap-2">
                    <p className="text-xs text-red-600 flex-1 self-center">{t('deleteConfirm')}</p>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(product.id)} disabled={deleting}>
                      {deleting ? '...' : t('yes')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleteConfirm(null)}>{t('no')}</Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit2 className="h-3 w-3" /> {t('edit')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteConfirm(product.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onClose={handleFormClose}
        product={editProduct}
        onSaved={fetchProducts}
      />

      <RecordSaleModal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        products={products.filter(p => p.currentStock > 0)}
        onSaleRecorded={fetchProducts}
      />
    </div>
  )
}
