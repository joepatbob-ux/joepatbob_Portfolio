'use client'

import { syncStageArtifactTuneCss } from '@/lib/stage-artifact-tune/applyCssVars'
import {
  getStageArtifactTune,
  STAGE_TUNE_CHANGE,
} from '@/lib/stage-artifact-tune/settings'
import { useEffect } from 'react'

/** Applies stage artifact size CSS variables from tune settings. */
export function StageArtifactTuneController() {
  useEffect(() => {
    const apply = () => syncStageArtifactTuneCss(getStageArtifactTune())

    apply()
    window.addEventListener(STAGE_TUNE_CHANGE, apply)
    window.addEventListener('popstate', apply)
    window.addEventListener('hashchange', apply)

    return () => {
      window.removeEventListener(STAGE_TUNE_CHANGE, apply)
      window.removeEventListener('popstate', apply)
      window.removeEventListener('hashchange', apply)
    }
  }, [])

  return null
}
