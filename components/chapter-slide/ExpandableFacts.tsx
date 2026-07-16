import { useId, useState } from 'react'
import { formatChapterInline } from '@/lib/chapter-slide/formatChapterInline'
import { trackEvent } from '@/lib/analytics'

export interface ExpandableFactItem {
  /** Collapsed trigger line — rendered in the micro-label treatment. */
  header: string
  /** Optional label swapped in while expanded (e.g. "More" → "Less"). */
  expandedHeader?: string
  /** Detail revealed on expand — one or more body-copy paragraphs. */
  detail: string | readonly string[]
}

interface Props {
  facts: readonly ExpandableFactItem[]
  /** Paragraph class — `chapter-copy__body` or `mobile-prose__p` */
  paragraphClass?: string
}

/**
 * Single-open accordion of chapter facts. Opening one fact closes any other
 * open fact in the same group. `data-state` drives the plus→dot→minus icon:
 * "closing" (vs plain closed) exists so only a fact the user just closed
 * plays the collapse animation — never on mount, never on untouched rows.
 */
export function ExpandableFacts({
  facts,
  paragraphClass = 'chapter-copy__body',
}: Props) {
  const baseId = useId()
  const [open, setOpen] = useState<number | null>(null)
  const [closing, setClosing] = useState<number | null>(null)

  const toggle = (index: number) => {
    if (index !== open) {
      trackEvent('callout-expand', { callout: facts[index]?.header ?? String(index) })
    }
    setClosing(index === open ? index : open)
    setOpen(index === open ? null : index)
  }

  return (
    <div className="chapter-facts">
      {facts.map((fact, index) => {
        const isOpen = index === open
        const state = isOpen ? 'open' : index === closing ? 'closing' : 'closed'
        const panelId = `${baseId}-fact-${index}`
        const triggerId = `${panelId}-trigger`
        return (
          <div key={index} className="chapter-fact" data-state={state}>
            <button
              type="button"
              id={triggerId}
              className="chapter-fact__trigger"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => toggle(index)}
            >
              <span className="chapter-fact__icon" aria-hidden>
                <span className="chapter-fact__bar chapter-fact__bar--h" />
                <span className="chapter-fact__bar chapter-fact__bar--v" />
              </span>
              <span className="cs-microlabel chapter-fact__label">
                {isOpen && fact.expandedHeader ? fact.expandedHeader : fact.header}
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
              aria-hidden={!isOpen}
              className="chapter-fact__panel"
            >
              <div className="chapter-fact__panel-inner">
                <div className="chapter-fact__detail">
                  {(typeof fact.detail === 'string'
                    ? [fact.detail]
                    : fact.detail
                  ).map((paragraph, pIndex) => (
                    <p key={pIndex} className={paragraphClass}>
                      {formatChapterInline(paragraph)}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
