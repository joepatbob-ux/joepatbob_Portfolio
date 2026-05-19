'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { VerdantInteractive } from '@/components/VerdantInteractive'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useCallback, useEffect, useState } from 'react'

const CHAPTER_ID = 'hardware-verdant'
const SCROLL_OUT_MS = 300
const COPY_SETTLE_MS = 480
const DEFAULT_CHAR = 'NONE'

const HEADLINE = 'Designed for distance.'
const SUBTITLE =
  'Designing for hospitality, distance, and every language at once'
const BODY = `The Verdant VX4 and Line Voltage thermostats serve the hospitality market — guests who speak different languages, interact with the thermostat once, and read it from across a hotel room.

The Line Voltage thermostat for the European market pushed further: I replaced all text labels with iconography. An icon either communicates or it doesn't.

To support the Verdant display, I designed a high-density segment character set from scratch — angled slices with flexible geometry that renders numbers with far greater clarity at distance. Pending US patent.`

interface Props {
  index: number
  isLast: boolean
}

export function VerdantChapter({ index, isLast }: Props) {
  const { isActive, opacity: panelOpacity } = useChapterPanelOpacity(CHAPTER_ID)
  const [selectedCode, setSelectedCode] = useState(DEFAULT_CHAR)
  const [copyIn, setCopyIn] = useState(false)

  const reset = useCallback(() => {
    setCopyIn(false)
    setSelectedCode(DEFAULT_CHAR)
  }, [])

  useEffect(() => {
    if (!isActive) reset()
  }, [isActive, reset])

  useEffect(() => {
    if (!isActive) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setCopyIn(true)
      return
    }

    setCopyIn(false)
    const t = window.setTimeout(() => setCopyIn(true), COPY_SETTLE_MS)
    return () => window.clearTimeout(t)
  }, [isActive])

  const scrollOutStyle =
    panelOpacity < 1
      ? { transition: `opacity ${SCROLL_OUT_MS}ms ease` }
      : undefined

  return (
    <ChapterViewport
      chapterId={CHAPTER_ID}
      isLast={isLast}
      className="verdant-chapter"
      fillViewport
    >
      <div
        className="verdant-chapter__viewport"
        aria-hidden={!isActive}
        style={scrollOutStyle}
      >
        <div className="verdant-chapter__stage">
          <VerdantInteractive
            selectedCode={selectedCode}
            onSelectCode={setSelectedCode}
          />
        </div>

        <div
          className={[
            'verdant-chapter__copy',
            copyIn ? 'verdant-chapter__reveal--in verdant-chapter__reveal--from-right' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <h3 className="verdant-chapter__headline">{HEADLINE}</h3>
          <p className="verdant-chapter__subtitle">{SUBTITLE}</p>
          <div className="verdant-chapter__rule" aria-hidden />
          <p className="verdant-chapter__body">{BODY}</p>
        </div>
      </div>

      <footer className="verdant-chapter__footer">
        <div className="verdant-chapter__footer-rule" aria-hidden />
        <p className="verdant-chapter__footer-meta">
          {String(index + 1).padStart(2, '0')} — Verdant
        </p>
      </footer>
    </ChapterViewport>
  )
}
