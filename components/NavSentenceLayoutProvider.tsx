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
  clearLockedNavSentenceLines,
  DEFAULT_NAV_SENTENCE_LINES,
  formatLayoutAsTypeScript,
  isNavSentenceEditorEnabled,
  layoutToEditorText,
  loadLockedNavSentenceLines,
  parseEditorText,
  resolveNavSentenceLines,
  saveLockedNavSentenceLines,
  type NavMainSentenceLine,
} from '@/lib/navSentenceLayout'

interface NavSentenceLayoutContextValue {
  lines: NavMainSentenceLine[]
  editorEnabled: boolean
  draftText: string
  isLocked: boolean
  setDraftText: (text: string) => void
  lockIn: () => void
  resetToDefault: () => void
  copyTypeScript: () => Promise<boolean>
}

const NavSentenceLayoutContext =
  createContext<NavSentenceLayoutContextValue | null>(null)

export function NavSentenceLayoutProvider({ children }: { children: ReactNode }) {
  const [editorEnabled, setEditorEnabled] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedLines, setLockedLines] = useState<NavMainSentenceLine[]>(() => [
    ...DEFAULT_NAV_SENTENCE_LINES,
  ])
  const [draftText, setDraftTextState] = useState(() =>
    layoutToEditorText(DEFAULT_NAV_SENTENCE_LINES),
  )

  useEffect(() => {
    setEditorEnabled(isNavSentenceEditorEnabled())
    const locked = loadLockedNavSentenceLines()
    if (locked) {
      setLockedLines(locked)
      setDraftTextState(layoutToEditorText(locked))
      setIsLocked(true)
      return
    }
    const resolved = resolveNavSentenceLines()
    setLockedLines(resolved)
    setDraftTextState(layoutToEditorText(resolved))
    setIsLocked(false)
  }, [])

  const lines = useMemo(() => {
    if (editorEnabled) return parseEditorText(draftText)
    return lockedLines
  }, [editorEnabled, draftText, lockedLines])

  const setDraftText = useCallback((text: string) => {
    setDraftTextState(text)
  }, [])

  const lockIn = useCallback(() => {
    const parsed = parseEditorText(draftText)
    saveLockedNavSentenceLines(parsed)
    setLockedLines(parsed)
    setIsLocked(true)
  }, [draftText])

  const resetToDefault = useCallback(() => {
    clearLockedNavSentenceLines()
    const defaults = [...DEFAULT_NAV_SENTENCE_LINES]
    setLockedLines(defaults)
    setDraftTextState(layoutToEditorText(defaults))
    setIsLocked(false)
  }, [])

  const copyTypeScript = useCallback(async () => {
    const snippet = formatLayoutAsTypeScript(parseEditorText(draftText))
    try {
      await navigator.clipboard.writeText(snippet)
      return true
    } catch {
      return false
    }
  }, [draftText])

  const value = useMemo(
    () => ({
      lines,
      editorEnabled,
      draftText,
      isLocked,
      setDraftText,
      lockIn,
      resetToDefault,
      copyTypeScript,
    }),
    [
      lines,
      editorEnabled,
      draftText,
      isLocked,
      setDraftText,
      lockIn,
      resetToDefault,
      copyTypeScript,
    ],
  )

  return (
    <NavSentenceLayoutContext.Provider value={value}>
      {children}
    </NavSentenceLayoutContext.Provider>
  )
}

export function useNavSentenceLayout() {
  const ctx = useContext(NavSentenceLayoutContext)
  if (!ctx) {
    throw new Error('useNavSentenceLayout must be used within NavSentenceLayoutProvider')
  }
  return ctx
}
