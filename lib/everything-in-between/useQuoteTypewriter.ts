'use client'

import { useEffect, useState } from 'react'

const CHAR_MS = 34

/** Typewriter reveal for quote slips — starts when `active` becomes true. */
export function useQuoteTypewriter(
  text: string | null,
  active: boolean,
  reducedMotion: boolean,
): string {
  const [visible, setVisible] = useState('')

  useEffect(() => {
    if (!active || !text) {
      setVisible('')
      return
    }

    if (reducedMotion) {
      setVisible(text)
      return
    }

    setVisible('')
    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setVisible(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(timer)
      }
    }, CHAR_MS)

    return () => window.clearInterval(timer)
  }, [active, reducedMotion, text])

  return visible
}
