'use client'

import { useIconMorph } from '@/lib/preloader/useIconMorph'
import { PRELOADER_VIEWBOX } from '@/lib/preloader/iconPaths'
import { isCollapsedInner } from '@/lib/preloader/morphEngine'

type Props = {
  size?: number
  className?: string
  active?: boolean
  showLabel?: boolean
  'aria-hidden'?: boolean
}

export function MorphIcon({
  size = 32,
  className,
  active = true,
  showLabel = false,
  'aria-hidden': ariaHidden,
}: Props) {
  const { frameD, innerDs, label, morphing } = useIconMorph(active)
  const rootClass = ['morph-icon', className].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <svg
        className="morph-icon__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${PRELOADER_VIEWBOX} ${PRELOADER_VIEWBOX}`}
        aria-hidden={ariaHidden ?? !showLabel}
        role={showLabel ? 'img' : undefined}
        aria-label={showLabel ? label : undefined}
      >
        <path className="morph-icon__frame" d={frameD} fill="currentColor" />
        {innerDs.map((innerD, index) =>
          morphing || !isCollapsedInner(innerD) ? (
            <path
              key={index}
              className="morph-icon__inner"
              d={innerD}
              fill="currentColor"
            />
          ) : null,
        )}
      </svg>
      {showLabel ? <span className="morph-icon__label">{label}</span> : null}
    </div>
  )
}
