export type Theme = 'dark' | 'light' | 'warm' | 'nature' | 'ocean'

export const themes: { id: Theme; name: string; icon: string }[] = [
  { id: 'dark', name: '暗夜', icon: '🌙' },
  { id: 'light', name: '明亮', icon: '☀️' },
  { id: 'warm', name: '暖阳', icon: '🔥' },
  { id: 'nature', name: '森林', icon: '🌿' },
  { id: 'ocean', name: '海洋', icon: '🌊' },
]

import { useState, useEffect } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved && themes.some(t => t.id === saved)) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.className = theme
    localStorage.setItem('theme', theme)
  }, [theme])

  function nextTheme() {
    setTheme(current => {
      const idx = themes.findIndex(t => t.id === current)
      return themes[(idx + 1) % themes.length].id
    })
  }

  return { theme, setTheme, nextTheme }
}
