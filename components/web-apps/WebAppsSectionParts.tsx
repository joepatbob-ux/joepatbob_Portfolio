import type { ReactNode } from 'react'
import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSubStory,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'

export { splitParagraphs, MobileProse, MobileSubStory, MobileLabelGrid }

export function WebAppsSectionHeader({
  headline,
  subhead,
}: {
  headline: string
  subhead: string
}) {
  return (
    <CaseStudySectionHeader
      className="web-apps-section-header"
      headline={headline}
      subhead={subhead}
    />
  )
}

export function WebAppsProductGrid({
  products,
}: {
  products: readonly {
    name: string
    domain: string
    description: string
  }[]
}) {
  return (
    <ul className="web-apps-product-grid" role="list">
      {products.map((product) => (
        <li key={product.name} className="web-apps-product-grid__cell">
          <p className="web-apps-product-grid__domain">{product.domain}</p>
          <p className="web-apps-product-grid__name">{product.name}</p>
          <p className="web-apps-product-grid__desc">{product.description}</p>
        </li>
      ))}
    </ul>
  )
}

export function WebAppsNumberedList({
  items,
}: {
  items: readonly { num: string; label: string; text: string }[]
}) {
  return (
    <ol className="web-apps-numbered-list">
      {items.map((item) => (
        <li key={item.num} className="web-apps-numbered-list__item">
          <span className="web-apps-numbered-list__num" aria-hidden>
            {item.num}
          </span>
          <div className="web-apps-numbered-list__content">
            <p className="web-apps-numbered-list__label">{item.label}</p>
            <p className="web-apps-numbered-list__text">{item.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export function WebAppsComplianceCallout({ children }: { children: ReactNode }) {
  return <aside className="web-apps-compliance-callout">{children}</aside>
}

export function WebAppsNdaNote({ children }: { children: ReactNode }) {
  return <p className="web-apps-nda-note">{children}</p>
}

export function WebAppsThesisClose({ children }: { children: ReactNode }) {
  return (
    <aside className="mobile-thesis-close web-apps-thesis-close">
      <p>{children}</p>
    </aside>
  )
}
