'use client'

import React, { createContext, useContext, useEffect } from 'react'

type Theme = 'light'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.classList.add('light')
    localStorage.setItem('panca_theme', 'light')
  }, [])

  const setTheme = () => {}

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme, resolvedTheme: 'light' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return { theme: 'light' as const, setTheme: () => {}, resolvedTheme: 'light' as const }
  }
  return context
}
