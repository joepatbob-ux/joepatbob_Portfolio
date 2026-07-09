'use client'

import {
  VERDANT_DEFAULT_SELECTION,
  type VerdantSelection,
  type VerdantViewKind,
} from '@/lib/verdant/characterSelector'
import { useCallback, useState } from 'react'

export function useVerdantSelection() {
  const [selection, setSelection] = useState<VerdantSelection>(
    VERDANT_DEFAULT_SELECTION,
  )

  const reset = useCallback(() => {
    setSelection(VERDANT_DEFAULT_SELECTION)
  }, [])

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
