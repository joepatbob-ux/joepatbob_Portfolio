'use client'

/**
 * Layout handedness for hero + mobile chrome:
 * - `right` (default): portrait anchored right, copy / menus trail to the right.
 * - `left`: mirrored — anchor left, copy / menus left-aligned.
 * Persisted under `portfolio-handedness`. Change via swipe on the hero (see Hero.tsx)
 * or `setHandedness('left'|'right')`.
 *
 * **First visit (no stored value):** only while the CSS mobile breakpoint matches
 * `(max-width: 767px)`, landscape orientation picks `left` vs `right` from
 * `screen.orientation` (primary vs secondary, then angle fallback). Outside that
 * breakpoint, handedness stays `right` and orientation listeners are not active.
 * Rotating updates handedness until the user swipes (which writes storage and stops
 * auto updates).
 */
import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

export type Handedness = 'left' | 'right'

const STORAGE_KEY = 'portfolio-handedness'

/** Keep in sync with Hero.tsx + SidebarNav (`useIsMobile` / globals). */
const MOBILE_MQ = '(max-width: 767px)'

/**
 * Infer handedness from device rotation in mobile view only (`MOBILE_MQ`).
 * Mapping of primary vs secondary is heuristic; swap branches if QA finds it inverted on target devices.
 */
export function inferHandednessFromOrientation(): Handedness {
  if (typeof window === 'undefined') return 'right'
  if (!window.matchMedia(MOBILE_MQ).matches) return 'right'

  const land = window.matchMedia('(orientation: landscape)')
  if (!land.matches) return 'right'

  const o = window.screen?.orientation
  const type = o?.type
  if (type === 'landscape-secondary') return 'left'
  if (type === 'landscape-primary') return 'right'

  if (typeof o?.angle === 'number' && Number.isFinite(o.angle)) {
    const a = ((o.angle % 360) + 360) % 360
    if (a === 90) return 'right'
    if (a === 270) return 'left'
  }

  return 'right'
}

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
  /** When true, do not react to orientation/resize (user chose or value came from storage). */
  const lockAutoOrientation = useRef(false)

  useLayoutEffect(() => {
    const stored = readStored()
    if (stored) {
      lockAutoOrientation.current = true
      setHandednessState(stored)
      setDetectionSettled(true)
      return
    }

    const mobileMq = window.matchMedia(MOBILE_MQ)

    const syncFromOrientation = () => {
      if (lockAutoOrientation.current) return
      if (!mobileMq.matches) {
        setHandednessState('right')
        return
      }
      setHandednessState(inferHandednessFromOrientation())
    }

    const ori = window.screen?.orientation

    const attachMobileOrientationListeners = () => {
      ori?.addEventListener('change', syncFromOrientation)
      window.addEventListener('orientationchange', syncFromOrientation)
      window.addEventListener('resize', syncFromOrientation)
    }

    const detachMobileOrientationListeners = () => {
      ori?.removeEventListener('change', syncFromOrientation)
      window.removeEventListener('orientationchange', syncFromOrientation)
      window.removeEventListener('resize', syncFromOrientation)
    }

    const onMobileBreakpointChange = () => {
      if (mobileMq.matches) attachMobileOrientationListeners()
      else detachMobileOrientationListeners()
      syncFromOrientation()
    }

    syncFromOrientation()
    setDetectionSettled(true)

    if (mobileMq.matches) attachMobileOrientationListeners()
    mobileMq.addEventListener('change', onMobileBreakpointChange)

    return () => {
      detachMobileOrientationListeners()
      mobileMq.removeEventListener('change', onMobileBreakpointChange)
    }
  }, [])

  const setHandedness = useCallback((h: Handedness) => {
    lockAutoOrientation.current = true
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
