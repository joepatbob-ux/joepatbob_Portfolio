'use client'

import {
  DEFAULT_STAGE_ARTIFACT_TUNE,
  getStageArtifactTune,
  patchStageArtifactTune,
  saveStageArtifactTune,
  STAGE_TUNE_CHANGE,
  type StageArtifactTuneSettings,
} from '@/lib/stage-artifact-tune/settings'
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
  settings: StageArtifactTuneSettings
  patchSettings: (patch: Partial<StageArtifactTuneSettings>) => StageArtifactTuneSettings
  resetSettings: () => void
}

const StageArtifactTuneContext = createContext<ContextValue | null>(null)

export function StageArtifactTuneProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StageArtifactTuneSettings>(() =>
    typeof window === 'undefined' ? DEFAULT_STAGE_ARTIFACT_TUNE : getStageArtifactTune(),
  )

  const patchSettings = useCallback((patch: Partial<StageArtifactTuneSettings>) => {
    const next = patchStageArtifactTune(patch)
    setSettings(next)
    return next
  }, [])

  const resetSettings = useCallback(() => {
    saveStageArtifactTune(DEFAULT_STAGE_ARTIFACT_TUNE)
    setSettings(DEFAULT_STAGE_ARTIFACT_TUNE)
  }, [])

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<StageArtifactTuneSettings>).detail
      setSettings(detail ?? getStageArtifactTune())
    }
    const onNav = () => setSettings(getStageArtifactTune())

    window.addEventListener(STAGE_TUNE_CHANGE, onChange)
    window.addEventListener('popstate', onNav)
    window.addEventListener('hashchange', onNav)
    return () => {
      window.removeEventListener(STAGE_TUNE_CHANGE, onChange)
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('hashchange', onNav)
    }
  }, [])

  const value = useMemo(
    () => ({ settings, patchSettings, resetSettings }),
    [settings, patchSettings, resetSettings],
  )

  return (
    <StageArtifactTuneContext.Provider value={value}>
      {children}
    </StageArtifactTuneContext.Provider>
  )
}

export function useStageArtifactTune() {
  const ctx = useContext(StageArtifactTuneContext)
  if (!ctx) {
    throw new Error('useStageArtifactTune must be used within StageArtifactTuneProvider')
  }
  return ctx
}

export function useStageArtifactTuneOptional() {
  return useContext(StageArtifactTuneContext)
}
