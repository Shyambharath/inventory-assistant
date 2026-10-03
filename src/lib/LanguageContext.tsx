'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Language, TranslationKey, getTranslation } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: TranslationKey) => getTranslation(key, 'en'),
})

const STORAGE_KEY = 'stockpilot_lang'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null
      if (saved === 'en' || saved === 'ml') {
        setLanguageState(saved)
      }
    } catch {
      // localStorage not accessible
    }
    setMounted(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
  }

  const t = (key: TranslationKey): string => {
    return getTranslation(key, language)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
