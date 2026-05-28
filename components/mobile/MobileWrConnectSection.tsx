'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { MobileProse, MobileSectionHeader, splitParagraphs } from '@/components/mobile/MobileSectionParts'
import { MOBILE_WR_CONNECT, mobileChapterId } from '@/lib/mobile/content'

export function MobileWrConnectSection() {
  const chapterId = mobileChapterId('wr-connect')
  const paragraphs = splitParagraphs(MOBILE_WR_CONNECT.body)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      isLast={false}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--wr-connect"
      stage={<div className="flow-chapter-slide__stage--empty" aria-hidden />}
      copy={
        <>
          <MobileSectionHeader
            eyebrow={MOBILE_WR_CONNECT.eyebrow}
            headline={MOBILE_WR_CONNECT.headline}
            meta={MOBILE_WR_CONNECT.meta}
          />
          <MobileProse paragraphs={paragraphs.slice(0, 2)} />
        </>
      }
      belowFold={
        <>
          <MobileProse paragraphs={paragraphs.slice(2)} />
          <div className="mobile-phase-panels" role="list">
            {MOBILE_WR_CONNECT.phases.map((phase) => (
              <div
                key={phase.label}
                className="mobile-phase-panels__panel"
                role="listitem"
              >
                <p className="mobile-phase-panels__label">{phase.label}</p>
                <p className="mobile-phase-panels__text">{phase.text}</p>
              </div>
            ))}
          </div>
          <aside className="mobile-award-callout">
            <p>{MOBILE_WR_CONNECT.award}</p>
          </aside>
        </>
      }
    />
  )
}
