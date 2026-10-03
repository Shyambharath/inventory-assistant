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
import { ShoppingCart, AlertTriangle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import type { Product } from '@/types'

interface RecordSaleModalProps {
  open: boolean
  onClose: () => void
  products: Product[]
  onSaleRecorded: () => void
}

export function RecordSaleModal({ open, onClose, products, onSaleRecorded }: RecordSaleModalProps) {
  const { language, t } = useLanguage()
  const isMl = language === 'ml'
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ message: string; lowStockMessage: string | null } | null>(null)

  const selectedProduct = products.find(p => p.id.toString() === productId)
  const qty = parseInt(quantity) || 0
  const remainingStock = selectedProduct ? selectedProduct.currentStock - qty : 0
  const isOverStock = selectedProduct ? qty > selectedProduct.currentStock : false
  const estimatedTotal = selectedProduct ? selectedProduct.sellingPrice * qty : 0

  const handleClose = () => {
    setProductId('')
    setQuantity('')
    setError('')
    setSuccess(null)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId || !quantity) {
      setError('Please select a product and enter quantity.')
      return
    }
    if (qty <= 0) {
      setError('Quantity must be at least 1.')
      return
    }
    if (isOverStock) {
      setError(`Only ${selectedProduct?.currentStock} ${selectedProduct?.unit} available.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: parseInt(productId), quantity: qty }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to record sale.')
        return
      }

      setSuccess({
        message: `Sold ${qty} ${selectedProduct?.unit} of "${selectedProduct?.name}" for ${formatCurrency(estimatedTotal)}`,
        lowStockMessage: data.lowStockMessage,
      })
      onSaleRecorded()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleAnother = () => {
    setProductId('')
    setQuantity('')
    setError('')
    setSuccess(null)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-indigo-600" />
            {t('recordSaleBtn')}
          </DialogTitle>
          <DialogDescription>
            {isMl ? 'ഉൽപ്പന്നവും വിറ്റ അളവും തിരഞ്ഞെടുക്കുക.' : 'Select a product and enter the quantity sold.'}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">{isMl ? 'വിൽപ്പന രേഖപ്പെടുത്തി!' : 'Sale Recorded!'}</p>
                <p className="text-sm text-green-700 mt-1">{success.message}</p>
              </div>
            </div>

            {success.lowStockMessage && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-800">{success.lowStockMessage}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                {isMl ? 'പൂർത്തിയായി' : 'Done'}
              </Button>
              <Button className="flex-1" onClick={handleAnother}>
                {isMl ? 'മറ്റൊന്ന് രേഖപ്പെടുത്തുക' : 'Record Another'}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">{t('thProduct')}</Label>
              <Select value={productId} onValueChange={setProductId}>
                <SelectTrigger>
                  <SelectValue placeholder={isMl ? 'ഉൽപ്പന്നം തിരഞ്ഞെടുക്കുക...' : 'Select a product...'} />
                </SelectTrigger>
                <SelectContent>
                  {products.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name} — {p.currentStock} {p.unit} {t('inStock')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProduct && (
              <div className="p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t('inStock')}:</span>
                  <span className="font-medium">{selectedProduct.currentStock} {selectedProduct.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{isMl ? 'യൂണിറ്റ് വില:' : 'Price per unit:'}</span>
                  <span className="font-medium">{formatCurrency(selectedProduct.sellingPrice)}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="quantity">{isMl ? 'വിറ്റ അളവ്' : 'Quantity Sold'}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.currentStock}
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                placeholder={isMl ? 'അളവ് നൽകുക...' : 'Enter quantity...'}
                className="text-lg"
              />
            </div>

            {selectedProduct && qty > 0 && (
              <div className={`p-3 rounded-lg text-sm space-y-1 ${isOverStock ? 'bg-red-50 border border-red-200' : 'bg-indigo-50 border border-indigo-200'}`}>
                <div className="flex justify-between">
                  <span className={isOverStock ? 'text-red-600' : 'text-indigo-600'}>
                    {isMl ? 'ബാക്കി വരുന്ന സ്റ്റോക്ക്:' : 'Remaining after sale:'}
                  </span>
                  <span className={`font-medium ${isOverStock ? 'text-red-700' : 'text-indigo-700'}`}>
                    {remainingStock} {selectedProduct.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className={isOverStock ? 'text-red-600' : 'text-indigo-600'}>
                    {isMl ? 'ആകെ തുക:' : 'Total amount:'}
                  </span>
                  <span className={`font-bold ${isOverStock ? 'text-red-700' : 'text-indigo-700'}`}>
                    {formatCurrency(estimatedTotal)}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                {t('cancelAction')}
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !productId || !quantity || isOverStock}
              >
                {loading ? (isMl ? 'രേഖപ്പെടുത്തുന്നു...' : 'Recording...') : t('recordSaleBtn')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
