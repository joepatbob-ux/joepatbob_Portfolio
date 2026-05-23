import type { ReactNode } from 'react'

export function splitParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter((p) => p.trim().length > 0)
}

export function MobileMetaRow({
  items,
}: {
  items: readonly { label: string; value: string }[]
}) {
  return (
    <dl className="mobile-meta-row">
      {items.map((item) => (
        <div key={item.label} className="mobile-meta-row__item">
          <dt className="mobile-meta-row__label">{item.label}</dt>
          <dd className="mobile-meta-row__value">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

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

export function MobileSectionHeader({
  eyebrow,
  headline,
  meta,
}: {
  eyebrow: string
  headline: string
  meta: readonly { label: string; value: string }[]
}) {
  return (
    <header className="mobile-section-header">
      <p className="mobile-section-header__eyebrow">{eyebrow}</p>
      <h2 className="mobile-section-header__headline">
        {headline.split('\n').map((line, i) => (
          <span key={i} className="mobile-section-header__headline-line">
            {line}
          </span>
        ))}
      </h2>
      <div className="mobile-section-header__rule" aria-hidden />
      <MobileMetaRow items={meta} />
    </header>
  )
}

export function MobileSubStory({
  number,
  heading,
  children,
}: {
  number: string
  heading: string
  children: ReactNode
}) {
  return (
    <article className="mobile-sub-story">
      <div className="mobile-sub-story__marker" aria-hidden>
        <span className="mobile-sub-story__number">{number}</span>
      </div>
      <div className="mobile-sub-story__body">
        <h3 className="mobile-sub-story__heading">{heading}</h3>
        <div className="mobile-sub-story__rule" aria-hidden />
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
