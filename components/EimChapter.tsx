'use client'

import { ChapterViewport } from '@/components/ChapterViewport'
import { EimPathArt } from '@/components/EimPathArt'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'
import { useCallback, useEffect, useState } from 'react'

const CHAPTER_ID = 'hardware-eim'
const DRAW_MS = 1400
const SCROLL_OUT_MS = 300

const HEADLINE = 'Configuration belongs at the thermostat.'
const SUBTITLE = 'Solving a problem by moving it somewhere better'
const BODY = `The Equipment Interface Module supports both indoor and outdoor HVAC equipment. The challenge: how does a contractor communicate equipment type without traveling back and forth between thermostat and unit?

I moved the configuration to the thermostat. Through a simple pairing flow, the contractor sets location and equipment type once, without leaving. The EIM configures itself accordingly. Contractors noticed immediately.`

interface Props {
  index: number
  isLast: boolean
}

export function EimChapter({ index, isLast }: Props) {
  const { isActive, opacity: panelOpacity } = useChapterPanelOpacity(CHAPTER_ID)

  const [copyIn, setCopyIn] = useState(false)

  const resetReveal = useCallback(() => {
    setCopyIn(false)
  }, [])

  useEffect(() => {
    if (!isActive) resetReveal()
  }, [isActive, resetReveal])

  useEffect(() => {
    if (!isActive) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setCopyIn(true)
      return
    }

    const ghostMs = 200
    const copyAt = ghostMs + DRAW_MS * 0.5
    const tCopy = window.setTimeout(() => setCopyIn(true), copyAt)

    return () => window.clearTimeout(tCopy)
  }, [isActive])

  const chapterActive = isActive
  const scrollOutStyle =
    panelOpacity < 1
      ? { transition: `opacity ${SCROLL_OUT_MS}ms ease` }
      : undefined

  return (
    <ChapterViewport
      chapterId={CHAPTER_ID}
      isLast={isLast}
      className="eim-chapter"
      fillViewport
    >
      <div
        className="eim-chapter__viewport"
        aria-hidden={!chapterActive}
        style={scrollOutStyle}
      >
        <div className="eim-chapter__stage">
          <EimPathArt
            active={chapterActive}
            triggerDraw={chapterActive}
            drawDurationMs={DRAW_MS}
            showLabel
          />
        </div>

        <div
          className={[
            'eim-chapter__copy',
            copyIn ? 'eim-chapter__reveal--in eim-chapter__reveal--from-right' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <h3 className="eim-chapter__headline">{HEADLINE}</h3>
          <p className="eim-chapter__subtitle">{SUBTITLE}</p>
          <div className="eim-chapter__rule" aria-hidden />
          <p className="eim-chapter__body">{BODY}</p>
        </div>
      </div>

      <footer className="eim-chapter__footer">
        <div className="eim-chapter__footer-rule" aria-hidden />
        <p className="eim-chapter__footer-meta">
          {String(index + 1).padStart(2, '0')} — EIM
        </p>
      </footer>
    </ChapterViewport>
  )
}
