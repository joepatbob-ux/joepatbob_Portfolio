'use client'

import {
  VERDANT_DEFAULT_SELECTION,
  type VerdantSelection,
  type VerdantViewKind,
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

  const selectView = useCallback((kind: VerdantViewKind) => {
    setSelection({ kind })
  }, [])

  return {
    selection,
    selectCharacter,
    selectView,
    reset,
  }
}
