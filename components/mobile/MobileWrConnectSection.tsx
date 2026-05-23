'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import {
  MobileProse,
  MobileSectionHeader,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_WR_CONNECT, mobileChapterId } from '@/lib/mobile/content'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

export function MobileWrConnectSection() {
  const chapterId = mobileChapterId('wr-connect')
  const copyScrollActive = useCopyScrollActive(chapterId)
  const paragraphs = splitParagraphs(MOBILE_WR_CONNECT.body)

  return (
    <ChapterViewport
      chapterId={chapterId}
      isLast={false}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--wr-connect"
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="mobile-chapter-panel__scroll"
      >
        <div className="mobile-chapter-panel__content">
          <MobileSectionHeader
            eyebrow={MOBILE_WR_CONNECT.eyebrow}
            headline={MOBILE_WR_CONNECT.headline}
            meta={MOBILE_WR_CONNECT.meta}
          />
          <MobileProse paragraphs={paragraphs} />
          <div className="mobile-phase-panels" role="list">
            {MOBILE_WR_CONNECT.phases.map((phase) => (
              <div key={phase.label} className="mobile-phase-panels__panel" role="listitem">
                <p className="mobile-phase-panels__label">{phase.label}</p>
                <p className="mobile-phase-panels__text">{phase.text}</p>
              </div>
            ))}
          </div>
          <aside className="mobile-award-callout">
            <p>{MOBILE_WR_CONNECT.award}</p>
          </aside>
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
