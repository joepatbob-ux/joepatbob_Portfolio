'use client'

/**
 * Compact-band (768–1023) More/Less expand state.
 * Provider is a no-op outside compact mode — see ChapterSlideShell.
 */

import { useChapterActive } from '@/lib/chapterActiveContext'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ContextValue = {
  expanded: boolean
  setExpanded: (expanded: boolean) => void
  toggleExpanded: () => void
}

const ChapterCompactViewContext = createContext<ContextValue | null>(null)

export function ChapterCompactViewProvider({
  enabled,
  children,
}: {
  enabled: boolean
  children: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const chapterActive = useChapterActive()
  const toggleExpanded = useCallback(() => setExpanded((v) => !v), [])

  useEffect(() => {
    if (!enabled || !chapterActive) setExpanded(false)
  }, [enabled, chapterActive])

  const value = useMemo(
    () => (enabled ? { expanded, setExpanded, toggleExpanded } : null),
    [enabled, expanded, toggleExpanded],
  )

  if (!enabled) return <>{children}</>

  return (
    <ChapterCompactViewContext.Provider value={value!}>
      {children}
    </ChapterCompactViewContext.Provider>
  )
}

export function useChapterCompactView(): ContextValue | null {
  return useContext(ChapterCompactViewContext)
}

export function ChapterCompactViewInner({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  const ctx = useChapterCompactView()
  const rootClass = [
    className,
    ctx ? 'chapter-slide__inner--compact-expand' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      className={rootClass}
      data-chapter-expanded={ctx?.expanded ? 'true' : 'false'}
    >
      {children}
    </div>
  )
}
