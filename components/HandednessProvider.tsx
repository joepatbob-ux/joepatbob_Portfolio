'use client'

/**
 * Layout handedness for hero + mobile chrome:
 * - `right` (default): portrait anchored right, copy / menus trail to the right.
 * - `left`: mirrored — anchor left, copy / menus left-aligned.
 * Persisted under `portfolio-handedness`. Change via swipe on the hero (see Hero.tsx)
 * or `setHandedness('left'|'right')`.
 */
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'

export type Handedness = 'left' | 'right'

const STORAGE_KEY = 'portfolio-handedness'

function readStored(): Handedness | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'left' || v === 'right') return v
  } catch {
    /* ignore */
  }
  return null
}

function writeStored(h: Handedness) {
  try {
    localStorage.setItem(STORAGE_KEY, h)
  } catch {
    /* ignore */
  }
}

type HandednessContextValue = {
  handedness: Handedness
  setHandedness: (h: Handedness) => void
  detectionSettled: boolean
}

const HandednessContext = createContext<HandednessContextValue | null>(null)

export function HandednessProvider({ children }: { children: React.ReactNode }) {
  const [handedness, setHandednessState] = useState<Handedness>('right')
  const [detectionSettled, setDetectionSettled] = useState(false)

  useLayoutEffect(() => {
    const stored = readStored()
    if (stored) setHandednessState(stored)
    setDetectionSettled(true)
  }, [])

  const setHandedness = useCallback((h: Handedness) => {
    writeStored(h)
    setHandednessState(h)
    setDetectionSettled(true)
  }, [])

  const value = useMemo(
    () => ({ handedness, setHandedness, detectionSettled }),
    [handedness, setHandedness, detectionSettled],
  )

  return (
    <HandednessContext.Provider value={value}>{children}</HandednessContext.Provider>
  )
}

export function useHandedness() {
  const ctx = useContext(HandednessContext)
  if (!ctx) {
    throw new Error('useHandedness must be used within HandednessProvider')
  }
  return ctx
}
