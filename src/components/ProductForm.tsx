'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'
import { generateSKU } from '@/lib/utils'
import type { Product } from '@/types'

const CATEGORIES = [
  'Grains', 'Oil & Ghee', 'Essentials', 'Dairy', 'Snacks',
  'Beverages', 'Personal Care', 'Cleaning', 'Stationery', 'Other'
]

const UNITS = ['units', 'packets', 'bottles', 'bags', 'boxes', 'bars', 'pouches', 'jars', 'kg', 'liters', 'pieces']

interface ProductFormProps {
  open: boolean
  onClose: () => void
  product?: Product | null
  onSaved: () => void
}

const defaultForm = {
  name: '',
  category: '',
  sku: '',
  sellingPrice: '',
  costPrice: '',
  currentStock: '',
  minimumStock: '10',
  unit: 'units',
  supplier: '',
}

export function ProductForm({ open, onClose, product, onSaved }: ProductFormProps) {
  const [form, setForm] = useState(
    product
      ? {
          name: product.name,
          category: product.category,
          sku: product.sku,
          sellingPrice: product.sellingPrice.toString(),
          costPrice: product.costPrice.toString(),
          currentStock: product.currentStock.toString(),
          minimumStock: product.minimumStock.toString(),
          unit: product.unit,
          supplier: product.supplier || '',
        }
      : defaultForm
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    setForm(defaultForm)
    setError('')
    onClose()
  }

  const handleCategoryChange = (val: string) => {
    setForm(f => ({
      ...f,
      category: val,
      sku: f.name ? generateSKU(f.name, val) : f.sku,
    }))
  }

  const handleNameChange = (val: string) => {
    setForm(f => ({
      ...f,
      name: val,
      sku: f.category && !product ? generateSKU(val, f.category) : f.sku,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      category: form.category,
      sku: form.sku.trim(),
      sellingPrice: parseFloat(form.sellingPrice),
      costPrice: parseFloat(form.costPrice),
      currentStock: parseInt(form.currentStock),
      minimumStock: parseInt(form.minimumStock),
      unit: form.unit,
      supplier: form.supplier.trim(),
    }

    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save product.')
        return
      }

      onSaved()
      handleClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the product details below.' : 'Fill in the product details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Product Name *</Label>
              <Input
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="e.g. Rice (5kg)"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>SKU *</Label>
              <Input
                value={form.sku}
                onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="e.g. GRN-RICE-5KG"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Selling Price (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.sellingPrice}
                onChange={e => setForm(f => ({ ...f, sellingPrice: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Cost Price (₹) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.costPrice}
                onChange={e => setForm(f => ({ ...f, costPrice: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Current Stock *</Label>
              <Input
                type="number"
                min="0"
                value={form.currentStock}
                onChange={e => setForm(f => ({ ...f, currentStock: e.target.value }))}
                placeholder="0"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Stock</Label>
              <Input
                type="number"
                min="0"
                value={form.minimumStock}
                onChange={e => setForm(f => ({ ...f, minimumStock: e.target.value }))}
                placeholder="10"
              />
            </div>

            <div className="space-y-2">
              <Label>Unit *</Label>
              <Select value={form.unit} onValueChange={val => setForm(f => ({ ...f, unit: val }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input
                value={form.supplier}
                onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Saving...' : product ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
