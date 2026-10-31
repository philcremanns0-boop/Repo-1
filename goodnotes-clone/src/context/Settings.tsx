import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { EN } from '../i18n'

export type ThemeMode = 'light' | 'dark' | 'system'
export type Lang = 'de' | 'en'
export type ScrollDir = 'vertical' | 'horizontal'
export type ToolbarStyle = 'docked' | 'floating'
interface Stored { theme: ThemeMode; lang: Lang; scroll: ScrollDir; toolbar: ToolbarStyle }
interface Ctx extends Stored {
  dark: boolean
  set: (p: Partial<Stored>) => void
  t: (s: string) => string
}
const KEY = 'gn:settings'
const Context = createContext<Ctx>(null as unknown as Ctx)
export const useSettings = () => useContext(Context)
export const useT = () => useContext(Context).t

function load(): Stored {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { theme: v.theme ?? 'system', lang: v.lang ?? 'de', scroll: v.scroll ?? 'vertical', toolbar: v.toolbar === 'floating' ? 'floating' : 'docked' }
  } catch {
    return { theme: 'system', lang: 'de', scroll: 'vertical', toolbar: 'docked' }
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Stored>(load)
  const [sysDark, setSysDark] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const m = matchMedia('(prefers-color-scheme: dark)')
    const f = () => setSysDark(m.matches)
    m.addEventListener('change', f)
    return () => m.removeEventListener('change', f)
  }, [])
  const dark = s.theme === 'dark' || (s.theme === 'system' && sysDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.lang = s.lang
    document.querySelector('meta[name=color-scheme]')?.setAttribute('content', dark ? 'dark' : 'light')
  }, [dark, s.lang])
  const set = useCallback((p: Partial<Stored>) => {
    setS((o) => {
      const n = { ...o, ...p }
      try { localStorage.setItem(KEY, JSON.stringify(n)) } catch { /* ignore */ }
      return n
    })
  }, [])
  const t = useCallback((str: string) => (s.lang === 'de' ? str : EN[str] ?? str), [s.lang])
  const value = useMemo(() => ({ ...s, dark, set, t }), [s, dark, set, t])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
