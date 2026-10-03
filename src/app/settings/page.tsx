'use client'

import { useState } from 'react'
import { Settings, RefreshCw, Database, Check, AlertCircle, Globe, Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/lib/LanguageContext'

export default function SettingsPage() {
  const { language, setLanguage, t } = useLanguage()
  const isMl = language === 'ml'
  const [shopName, setShopName] = useState('My Shop')
  const [savedShop, setSavedShop] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [error, setError] = useState('')

  const handleSaveShop = () => {
    setSavedShop(true)
    setTimeout(() => setSavedShop(false), 2500)
  }

  const handleReset = async () => {
    const confirmText = isMl
      ? 'എല്ലാ ഉൽപ്പന്നങ്ങളും വിൽപ്പന വിവരങ്ങളും മായ്ക്കണോ? ഇത് പഴയപടിയാക്കാൻ കഴിയില്ല.'
      : 'Are you sure you want to clear all products and sales data? This cannot be undone.'
    if (!confirm(confirmText)) return

    setResetting(true)
    setError('')
    try {
      const res = await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clear: true }),
      })
      const data = await res.json()
      if (data.cleared) {
        setResetDone(true)
        setTimeout(() => setResetDone(false), 3000)
      } else {
        setError(data.message || 'Clear failed')
      }
    } catch {
      setError(isMl ? 'നെറ്റ്‌വർക്ക് തകരാർ സംഭവിച്ചു' : 'Network error')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('settingsTitle')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('settingsSubtitle')}</p>
      </div>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            {t('languageSectionTitle')}
          </CardTitle>
          <CardDescription>{t('languageSectionDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="app_language"
                value="en"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-900">English</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="app_language"
                value="ml"
                checked={language === 'ml'}
                onChange={() => setLanguage('ml')}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-gray-900">മലയാളം</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Shop Profile */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-900">
            <Store className="h-4 w-4 text-indigo-600" />
            {t('shopInfoTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            {t('shopInfoDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-gray-700">{t('shopNameLabel')}</Label>
            <div className="flex gap-2">
              <Input
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                placeholder={isMl ? 'കടയുടെ പേര് നൽകുക' : 'Enter shop name'}
                className="max-w-md"
              />
              <Button
                variant="outline"
                onClick={handleSaveShop}
                className="shrink-0 font-medium"
              >
                {savedShop ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    {isMl ? 'സേവ് ചെയ്തു' : 'Saved'}
                  </>
                ) : (
                  t('saveChanges')
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-gray-200/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-gray-900">
            <Database className="h-4 w-4 text-gray-600" />
            {t('demoDataTitle')}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            {t('demoDataDesc')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            {t('demoDataWarning')}
          </p>

          {resetDone && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg text-xs font-medium text-green-700 border border-green-200">
              <Check className="h-4 w-4 text-green-600 shrink-0" />
              <span>{t('resetSuccess')}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 rounded-lg text-xs font-medium text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetting}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              {resetting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" />
                  {t('resetting')}
                </>
              ) : (
                t('resetButton')
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Minimal Footer */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-400">
          StockPilot • {t('aboutTagline')} • v1.0
        </p>
      </div>
    </div>
  )
}
