'use client'
import { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'light'
type ThemeCtx = { theme: Theme; toggleTheme: () => void }
const ThemeContext = createContext<ThemeCtx | null>(null)

export function ThemeProvider({
  defaultTheme,
  children,
}: {
  defaultTheme: Theme
  children: React.ReactNode
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.cookie = `theme=${theme};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme(t => (t === 'dark' ? 'light' : 'dark')) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeCtx {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
