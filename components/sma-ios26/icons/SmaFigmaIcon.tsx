'use client'

import { smaSvg, type SmaSvgName } from '@/lib/sma-ios26/figma-assets'

type SmaFigmaIconProps = {
  name: SmaSvgName
  size?: number
  className?: string
  /** When set, tints a monochrome SVG via CSS mask (tab bar active/inactive). */
  color?: string
}

export function SmaFigmaIcon({ name, size = 22, className, color }: SmaFigmaIconProps) {
  const src = smaSvg(name)

  if (color) {
    return (
      <span
        className={className}
        aria-hidden
        style={{
          display: 'inline-block',
          width: size,
          height: size,
          backgroundColor: color,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    )
  }

  return (
    <img
      src={src}
      alt=""
      className={className}
      aria-hidden
      draggable={false}
      {...(!className ? { width: size, height: size } : {})}
    />
  )
}
