'use client'

import { VerdantCharacterKeyboard } from '@/components/VerdantCharacterKeyboard'
import { VerdantCharacterSvg } from '@/components/VerdantCharacterSvg'

const PCB_PHOTO = '/images/hw-verdant.jpg'
const HARDWARE_PHOTO = '/images/Touch%202/IMG_0799.jpeg'

interface Props {
  selectedCode: string
  onSelectCode: (code: string) => void
}

export function VerdantInteractive({ selectedCode, onSelectCode }: Props) {
  return (
    <div className="verdant-interactive">
      <div className="verdant-interactive__display-row">
        <div className="verdant-interactive__glyph-stage" aria-live="polite">
          <VerdantCharacterSvg
            code={selectedCode}
            className="verdant-interactive__glyph"
          />
        </div>
        <div className="verdant-interactive__photos" aria-hidden>
          <img
            src={PCB_PHOTO}
            alt=""
            className="verdant-interactive__photo verdant-interactive__photo--top"
            decoding="async"
          />
          <img
            src={HARDWARE_PHOTO}
            alt="Verdant thermostat hardware reference"
            className="verdant-interactive__photo verdant-interactive__photo--bottom"
            decoding="async"
          />
        </div>
      </div>
      <VerdantCharacterKeyboard
        selectedCode={selectedCode}
        onSelect={onSelectCode}
      />
    </div>
  )
}
