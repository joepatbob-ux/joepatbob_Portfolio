'use client'

import {
  BOWL_GLASS_TUNE_CHANGE,
  readBowlGlassTune,
  readBowlTuneEnabled,
  saveBowlGlassTune,
  type BowlGlassTuneSettings,
} from '@/lib/everything-in-between/bowlGlassTune'
import { useCallback, useEffect, useState, type MouseEvent } from 'react'

export function useQuoteBowlGlassTune() {
  const [tuneOpen, setTuneOpen] = useState(false)
  const [glassTune, setGlassTune] = useState<BowlGlassTuneSettings>(() =>
    readBowlGlassTune(),
  )
  const [tuneDev, setTuneDev] = useState(false)

  useEffect(() => {
    setTuneDev(readBowlTuneEnabled())
    const onTune = () => setGlassTune(readBowlGlassTune())
    window.addEventListener(BOWL_GLASS_TUNE_CHANGE, onTune)
    return () => window.removeEventListener(BOWL_GLASS_TUNE_CHANGE, onTune)
  }, [])

  const onGlassTuneChange = useCallback((next: BowlGlassTuneSettings) => {
    setGlassTune(next)
    saveBowlGlassTune(next)
  }, [])

  const openTune = useCallback((e?: MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setTuneOpen(true)
  }, [])

  const closeTune = useCallback(() => setTuneOpen(false), [])

  return {
    tuneOpen,
    tuneDev,
    glassTune,
    openTune,
    closeTune,
    onGlassTuneChange,
  }
}
