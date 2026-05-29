'use client'

import { DragScrubber } from '@/components/DragScrubber'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSectionHeader,
  MobileSubStory,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'

export function MobileSensiSection() {
  const chapterId = mobileChapterId('sensi')
  const [color, install, platform] = MOBILE_SENSI.subStories
  const intro = splitParagraphs(MOBILE_SENSI.intro)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--sensi"
      stage={
        <DragScrubber
          beforeSrc={color.scrubber.beforeSrc}
          afterSrc={color.scrubber.afterSrc}
          beforeAlt={color.scrubber.beforeAlt}
          afterAlt={color.scrubber.afterAlt}
          beforeLabel="Orange"
          afterLabel="Dark mode"
          caption={color.scrubber.caption}
        />
      }
      copy={
        <>
          <MobileSectionHeader
            headline={MOBILE_SENSI.headline}
            meta={MOBILE_SENSI.meta}
          />
          <MobileProse paragraphs={intro} />
          <div className="mobile-sub-stories">
            <MobileSubStory heading={color.heading}>
              <MobileProse paragraphs={splitParagraphs(color.body)} />
              <MobileLabelGrid items={color.problems} columns={3} />
            </MobileSubStory>
            <MobileSubStory heading={install.heading}>
              <MobileProse paragraphs={splitParagraphs(install.body)} />
              <blockquote className="mobile-blockquote">
                <p>{install.quote}</p>
              </blockquote>
              <figure className="mobile-figure">
                <img
                  src={install.imageSrc}
                  alt={install.imageAlt}
                  className="mobile-figure__img"
                />
              </figure>
            </MobileSubStory>
            <MobileSubStory heading={platform.heading}>
              <MobileProse paragraphs={splitParagraphs(platform.body)} />
              <aside className="mobile-thesis-close">
                <p>{platform.thesisClose}</p>
              </aside>
            </MobileSubStory>
          </div>
        </>
      }
    />
  )
}
