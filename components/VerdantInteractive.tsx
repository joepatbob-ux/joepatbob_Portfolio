import { useEffect } from 'react'
import { VerdantCharacterSelector } from '@/components/VerdantCharacterSelector'
import { VerdantPreviewStage } from '@/components/VerdantPreviewStage'
import { fetchThemedVerdantCharacterSvg } from '@/lib/verdant/themeCharacterSvg'
import { useVerdantSelection } from '@/lib/verdant/useVerdantSelection'

const PREFETCH_CHARACTER_CODES = ['ALL', 'NONE', '0', '1', '7'] as const

type Props = {
  isActive?: boolean
}

export function VerdantInteractive({ isActive = true }: Props) {
  const { selection, selectCharacter, selectView } = useVerdantSelection()

  useEffect(() => {
    if (!isActive) return
    for (const code of PREFETCH_CHARACTER_CODES) {
      void fetchThemedVerdantCharacterSvg(code)
    }
  }, [isActive])

  return (
    <div className="verdant-interactive">
      <VerdantPreviewStage selection={selection} />
      <VerdantCharacterSelector
        selection={selection}
        onSelectCharacter={selectCharacter}
        onSelectView={selectView}
      />
    </div>
  )
}
