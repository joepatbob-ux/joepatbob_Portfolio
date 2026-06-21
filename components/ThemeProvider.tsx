'use client'

/**
 * Theme preference API for a future light / system / dark control.
 * Today: preference defaults to `system` (only); hero portrait and `.hero-pin`
 * use `HERO_CANVAS_BG`. `<html>` uses `--color-paper`. Section copy
 * still uses `prefers-color-scheme` tokens in CSS (`--color-paper`, etc.).
 *
 * When you add a toggle: bind it to `setPreference`. For full manual theming,
 * sync `document.documentElement.dataset` from `resolvedTheme` and mirror
 * your dark-mode `:root` tokens in `globals.css` under that attribute.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react'
import { HERO_CANVAS_BG } from '@/lib/hero-canvas'

/** Stored preference; `'system'` follows OS light/dark. */
export type ThemePreference = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  preference: ThemePreference
  /** Effective theme for components (hero portrait, future global styles). */
  resolvedTheme: 'light' | 'dark'
  setPreference: (next: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'theme-preference'

function readStoredPreference(): ThemePreference | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return null
}

function subscribeSystemTheme(onChange: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSystemThemeSnapshot(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** SSR / hydration default; updates right after hydrate from real OS preference. */
function getSystemThemeServerSnapshot(): 'light' | 'dark' {
  return 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')

  const systemTheme = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  )

  useEffect(() => {
    const stored = readStoredPreference()
    if (stored) setPreferenceState(stored)
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
  }, [])

  const resolvedTheme: 'light' | 'dark' =
    preference === 'system' ? systemTheme : preference

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme
    const heroCanvas =
      resolvedTheme === 'dark' ? HERO_CANVAS_BG.dark : HERO_CANVAS_BG.light
    document.documentElement.style.backgroundColor = ''
    document.documentElement.style.setProperty('--color-hero-canvas', heroCanvas)
    document.documentElement.style.colorScheme =
      resolvedTheme === 'dark' ? 'dark' : 'light'
  }, [resolvedTheme])

  const value = useMemo(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  )

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}
