import type { ReactNode } from 'react'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'

/** @deprecated Use parseChapterBody */
export const splitParagraphs = parseChapterBody

export function MobileLabelGrid({
  items,
  columns = 3,
}: {
  items: readonly { label: string; text: string }[]
  columns?: 2 | 3
}) {
  return (
    <ul
      className={`mobile-label-grid mobile-label-grid--cols-${columns}`}
      role="list"
    >
      {items.map((item) => (
        <li key={item.label} className="mobile-label-grid__cell">
          <p className="mobile-label-grid__label">{item.label}</p>
          <p className="mobile-label-grid__text">{item.text}</p>
        </li>
      ))}
    </ul>
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
          {p}
        </p>
      ))}
    </div>
  )
}
