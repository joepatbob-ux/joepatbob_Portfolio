'use client'

import {
  VERDANT_DEFAULT_SELECTION,
  type VerdantSelection,
} from '@/lib/verdant/characterSelector'
import { useCallback, useEffect, useState } from 'react'

export function useVerdantSelection(isActive = true) {
  const [selection, setSelection] = useState<VerdantSelection>(
    VERDANT_DEFAULT_SELECTION,
  )

  const reset = useCallback(() => {
    setSelection(VERDANT_DEFAULT_SELECTION)
  }, [])

  useEffect(() => {
    if (!isActive) reset()
  }, [isActive, reset])

  const selectCharacter = useCallback((code: string) => {
    setSelection({ kind: 'character', code })
  }, [])

  const selectSketch = useCallback(() => {
    setSelection({ kind: 'sketch' })
  }, [])

  const selectBoard = useCallback(() => {
    setSelection({ kind: 'board' })
  }, [])

  return {
    selection,
    selectCharacter,
    selectSketch,
    selectBoard,
    reset,
  }
}
