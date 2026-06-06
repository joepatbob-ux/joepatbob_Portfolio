import type { ReactNode } from 'react'
import { formatChapterInline } from '@/lib/chapter-slide/formatChapterInline'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'

/** @deprecated Use parseChapterBody */
export const splitParagraphs = parseChapterBody

export function MobileLabelGrid({
  items,
}: {
  items: readonly { label: string; text: string }[]
}) {
  return (
    <dl className="mobile-label-grid">
      {items.map((item) => (
        <div key={item.label} className="mobile-label-grid__cell">
          <dt className="mobile-label-grid__label">{item.label}</dt>
          <dd className="mobile-label-grid__text">{item.text}</dd>
        </div>
      ))}
    </dl>
  )
}

export { CaseStudySectionHeader as MobileSectionHeader } from '@/components/case-study/CaseStudySectionHeader'

export function MobileSubStoryHeading({ heading }: { heading: string }) {
  return (
    <>
      <h3 className="mobile-sub-story__heading">{heading}</h3>
      <div className="mobile-sub-story__rule" aria-hidden />
    </>
  )
}

export function MobileSubStory({
  heading,
  children,
}: {
  heading: string
  children: ReactNode
}) {
  return (
    <article className="mobile-sub-story">
      <div className="mobile-sub-story__body">
        <MobileSubStoryHeading heading={heading} />
        {children}
      </div>
    </article>
  )
}

export function MobileProse({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="mobile-prose">
      {paragraphs.map((p, i) => (
        <p key={i} className="mobile-prose__p">
          {formatChapterInline(p)}
        </p>
      ))}
    </div>
  )
}
