import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CONTENT_DEBUG_CATALOG,
} from '@/lib/content/contentDebugCatalog'
import {
  isContentDebugEnabled,
  loadContentDebugState,
  saveContentDebugState,
  type ContentDebugState,
} from '@/lib/content/contentDebug'
import type { Section } from '@/lib/types'

interface ContentDebugContextValue {
  enabled: boolean
  state: ContentDebugState
  defaults: Record<string, string>
  text: (key: string, fallback: string) => string
  setOverride: (key: string, value: string) => void
  clearOverride: (key: string) => void
  clearPageOverrides: (pageId: string) => void
  resetAllOverrides: () => void
  setSelectedPageId: (pageId: string) => void
  setFollowScroll: (follow: boolean) => void
  patchSection: (section: Section) => Section
}

const ContentDebugContext = createContext<ContentDebugContextValue | null>(null)

const { pages, defaults } = CONTENT_DEBUG_CATALOG

export function ContentDebugProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)
  const [state, setState] = useState<ContentDebugState>(() =>
    loadContentDebugState(pages[0]?.id ?? 'interlude'),
  )

  useEffect(() => {
    setEnabled(isContentDebugEnabled())
  }, [])

  useEffect(() => {
    if (!enabled) return
    saveContentDebugState(state)
  }, [enabled, state])

  const text = useCallback(
    (key: string, fallback: string) => {
      if (!enabled) return fallback
      const override = state.overrides[key]
      return override !== undefined ? override : fallback
    },
    [enabled, state.overrides],
  )

  const setOverride = useCallback((key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      overrides: { ...prev.overrides, [key]: value },
    }))
  }, [])

  const clearOverride = useCallback((key: string) => {
    setState((prev) => {
      const next = { ...prev.overrides }
      delete next[key]
      return { ...prev, overrides: next }
    })
  }, [])

  const clearPageOverrides = useCallback((pageId: string) => {
    const page = pages.find((p) => p.id === pageId)
    if (!page) return
    setState((prev) => {
      const next = { ...prev.overrides }
      for (const f of page.fields) delete next[f.key]
      return { ...prev, overrides: next }
    })
  }, [])

  const resetAllOverrides = useCallback(() => {
    setState((prev) => ({ ...prev, overrides: {} }))
  }, [])

  const setSelectedPageId = useCallback((selectedPageId: string) => {
    setState((prev) => ({ ...prev, selectedPageId }))
  }, [])

  const setFollowScroll = useCallback((followScroll: boolean) => {
    setState((prev) => ({ ...prev, followScroll }))
  }, [])

  const patchSection = useCallback(
    (section: Section): Section => {
      if (!enabled) return section
      const dir = section.id
      return {
        ...section,
        headline: text(`${dir}/section#headline`, section.headline),
        overviewBody: text(`${dir}/overview#body`, section.overviewBody),
        chapters: section.chapters.map((ch) => ({
          ...ch,
          title: text(`${dir}/${ch.id}#title`, ch.title),
          subtitle: text(`${dir}/${ch.id}#subtitle`, ch.subtitle),
          body: text(`${dir}/${ch.id}#body`, ch.body),
        })),
      }
    },
    [enabled, text],
  )

  const value = useMemo<ContentDebugContextValue>(
    () => ({
      enabled,
      state,
      defaults,
      text,
      setOverride,
      clearOverride,
      clearPageOverrides,
      resetAllOverrides,
      setSelectedPageId,
      setFollowScroll,
      patchSection,
    }),
    [
      enabled,
      state,
      text,
      setOverride,
      clearOverride,
      clearPageOverrides,
      resetAllOverrides,
      setSelectedPageId,
      setFollowScroll,
      patchSection,
    ],
  )

  return (
    <ContentDebugContext.Provider value={value}>
      {children}
    </ContentDebugContext.Provider>
  )
}

export function useContentDebug(): ContentDebugContextValue {
  const ctx = useContext(ContentDebugContext)
  if (!ctx) {
    return {
      enabled: false,
      state: { overrides: {}, selectedPageId: 'interlude', followScroll: true },
      defaults,
      text: (_key, fallback) => fallback,
      setOverride: () => {},
      clearOverride: () => {},
      clearPageOverrides: () => {},
      resetAllOverrides: () => {},
      setSelectedPageId: () => {},
      setFollowScroll: () => {},
      patchSection: (section) => section,
    }
  }
  return ctx
}
