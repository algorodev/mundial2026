'use client'
import { createContext, useContext, useTransition } from 'react'
import type { Dictionary, Locale } from '@/lib/i18n'

type I18nCtx = { locale: Locale; t: Dictionary; setLocale: (l: Locale) => void; pending: boolean }
const I18nContext = createContext<I18nCtx | null>(null)

export function I18nProvider({
  locale,
  dictionary,
  children,
}: {
  locale: Locale
  dictionary: Dictionary
  children: React.ReactNode
}) {
  const [pending, start] = useTransition()

  function setLocale(l: Locale) {
    start(() => {
      document.cookie = `locale=${l};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
      window.location.reload()
    })
  }

  return (
    <I18nContext.Provider value={{ locale, t: dictionary, setLocale, pending }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nCtx {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be inside I18nProvider')
  return ctx
}
