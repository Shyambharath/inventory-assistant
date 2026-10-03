import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar, MobileNav, MobileTopBar } from '@/components/Navigation'
import { LanguageProvider } from '@/lib/LanguageContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StockPilot — AI Inventory Assistant',
  description: 'Smart inventory management for small retail shops in India',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900 antialiased`}>
        <LanguageProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
              <MobileTopBar />
              <main className="flex-1 pb-20 md:pb-6">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </LanguageProvider>
      </body>
    </html>
  )
}
