import type { ReactNode } from 'react'
import { CaseStudySectionHeader } from '@/components/case-study/CaseStudySectionHeader'
import { MobileProse, splitParagraphs } from '@/components/mobile/MobileSectionParts'

export { splitParagraphs, MobileProse }

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

export function WebAppsNdaNote({ children }: { children: ReactNode }) {
  return <p className="web-apps-nda-note">{children}</p>
}
