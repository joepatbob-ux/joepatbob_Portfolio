import { useEffect, useState } from 'react'
import {
  fetchThemedVerdantCharacterSvg,
  getCachedThemedVerdantCharacterSvg,
} from '@/lib/verdant/themeCharacterSvg'

interface Props {
  code: string
  className?: string
  alt?: string
}

/** Inline themed character SVG (label / secondary label segment colors). */
export function VerdantCharacterSvg({ code, className, alt }: Props) {
  const [markup, setMarkup] = useState(
    () => getCachedThemedVerdantCharacterSvg(code) ?? null,
  )

  useEffect(() => {
    const cached = getCachedThemedVerdantCharacterSvg(code)
    if (cached) {
      setMarkup(cached)
      return
    }

    let cancelled = false

    fetchThemedVerdantCharacterSvg(code)
      .then((svg) => {
        if (!cancelled) setMarkup(svg)
      })
      .catch(() => {
        /* Keep the previous glyph visible while the next character loads. */
      })

    return () => {
      cancelled = true
    }
  }, [code])

  const classNames = ['verdant-character-svg', className]
    .filter(Boolean)
    .join(' ')

  /* One render path in both states: branching to a bare placeholder while the
     SVG loads broke hydration against the prerender snapshot (which bakes the
     loaded glyph). With dangerouslySetInnerHTML React adopts the baked
     children, so the glyph stays visible until the fetch replaces it. */
  return (
    <span
      className={classNames}
      role="img"
      aria-label={alt ?? `Verdant character ${code}`}
      dangerouslySetInnerHTML={{ __html: markup ?? '' }}
    />
  )
}
