'use client'

import { useEffect, useState } from 'react'
import { fetchThemedVerdantCharacterSvg } from '@/lib/verdant/themeCharacterSvg'

interface Props {
  code: string
  className?: string
  alt?: string
}

/** Inline themed character SVG (label / secondary label segment colors). */
export function VerdantCharacterSvg({ code, className, alt }: Props) {
  const [markup, setMarkup] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setMarkup(null)

    fetchThemedVerdantCharacterSvg(code)
      .then((svg) => {
        if (!cancelled) setMarkup(svg)
      })
      .catch(() => {
        if (!cancelled) setMarkup(null)
      })

    return () => {
      cancelled = true
    }
  }, [code])

  const classNames = ['verdant-character-svg', className]
    .filter(Boolean)
    .join(' ')

  if (!markup) {
    return <span className={classNames} aria-hidden />
  }

  return (
    <span
      className={classNames}
      role="img"
      aria-label={alt ?? `Verdant character ${code}`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
