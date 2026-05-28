'use client'

import { DragScrubber } from '@/components/DragScrubber'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { CaseStudySplit } from '@/components/case-study/CaseStudySplit'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSectionHeader,
  MobileSubStory,
  MobileSubStoryHeading,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'

export function MobileSensiSection() {
  const chapterId = mobileChapterId('sensi')
  const intro = splitParagraphs(MOBILE_SENSI.intro)
  const color = MOBILE_SENSI.subStories[0]
  const colorParas = splitParagraphs(color.body)
  const install = MOBILE_SENSI.subStories[1]
  const installParas = splitParagraphs(install.body)
  const platform = MOBILE_SENSI.subStories[2]
  const platformParas = splitParagraphs(platform.body)

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
          caption={color.scrubber.caption}
        />
      }
      copy={
        <>
          <MobileSectionHeader
            eyebrow={MOBILE_SENSI.eyebrow}
            headline={MOBILE_SENSI.headline}
            meta={MOBILE_SENSI.meta}
          />
          <MobileProse paragraphs={intro.slice(0, 2)} />
          <MobileSubStoryHeading number={color.number} heading={color.heading} />
          {colorParas[0] ? <MobileProse paragraphs={[colorParas[0]]} /> : null}
        </>
      }
      belowFold={
        <>
          <MobileProse paragraphs={intro.slice(2)} />
          {colorParas[2] ? <MobileProse paragraphs={[colorParas[2]]} /> : null}
          <MobileLabelGrid items={color.problems} columns={3} />

          <MobileSubStory number={install.number} heading={install.heading}>
            <CaseStudySplit
              copy={
                <>
                  <MobileProse paragraphs={installParas} />
                  <blockquote className="mobile-blockquote">
                    <p>{install.quote}</p>
                  </blockquote>
                </>
              }
              stage={
                <figure className="mobile-figure">
                  <img
                    src={install.imageSrc}
                    alt={install.imageAlt}
                    className="mobile-figure__img"
                  />
                </figure>
              }
            />
          </MobileSubStory>

          <MobileSubStory number={platform.number} heading={platform.heading}>
            <MobileProse paragraphs={platformParas} />
            <aside className="mobile-thesis-close">
              <p>{platform.thesisClose}</p>
            </aside>
          </MobileSubStory>
        </>
      }
    />
  )
}
