'use client'

import {
  createContext,
  useCallback,
  useContext,
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
  const toggleExpanded = useCallback(() => setExpanded((v) => !v), [])

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
