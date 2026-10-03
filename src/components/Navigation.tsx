'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingCart, Bot, Settings, Boxes, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/LanguageContext'
import { TranslationKey } from '@/lib/translations'

interface NavDef {
  href: string
  labelKey: TranslationKey
  icon: typeof LayoutDashboard
}

const navDefs: NavDef[] = [
  { href: '/', labelKey: 'navDashboard', icon: LayoutDashboard },
  { href: '/products', labelKey: 'navProducts', icon: Package },
  { href: '/sales', labelKey: 'navSales', icon: ShoppingCart },
  { href: '/ai', labelKey: 'navAI', icon: Bot },
  { href: '/settings', labelKey: 'navSettings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 min-h-screen shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
          <Boxes className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 leading-tight">StockPilot</p>
          <p className="text-xs text-gray-500">Inventory Assistant</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navDefs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href
          const label = t(labelKey)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-5 w-5', active ? 'text-indigo-600' : 'text-gray-400')} />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-xs text-gray-400">{t('demoMode')}</p>
      </div>
    </aside>
  )
}

export function MobileTopBar() {
  const pathname = usePathname()
  const { t } = useLanguage()

  const currentNav = navDefs.find(n => n.href === pathname)
  const pageTitle = currentNav ? t(currentNav.labelKey) : 'StockPilot'

  return (
    <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80 px-4 h-14 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 shadow-xs">
          <Boxes className="h-4 w-4" />
        </div>
        <div className="truncate">
          <p className="text-sm font-bold text-gray-900 leading-none">StockPilot</p>
          <p className="text-[11px] text-gray-500 leading-none mt-1 truncate">{pageTitle}</p>
        </div>
      </div>
      <Link
        href="/ai"
        className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold hover:bg-indigo-100 transition-colors"
      >
        <Sparkles className="h-3 w-3 text-indigo-600" />
        <span>AI</span>
      </Link>
    </header>
  )
}

export function MobileNav() {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-2px_10px_rgba(0,0,0,0.04)] pb-[max(0.25rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center justify-around h-15 px-1 py-1">
        {navDefs.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href
          const label = t(labelKey)
          const shortLabel = labelKey === 'navAI' ? 'AI' : label

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-all active:scale-95 touch-manipulation',
                active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'
              )}
            >
              <div className={cn(
                'flex items-center justify-center w-8 h-7 rounded-md transition-colors',
                active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500'
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                'text-[10px] leading-tight truncate max-w-[62px] text-center font-medium mt-0.5',
                active ? 'text-indigo-600 font-semibold' : 'text-gray-500'
              )}>
                {shortLabel}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
