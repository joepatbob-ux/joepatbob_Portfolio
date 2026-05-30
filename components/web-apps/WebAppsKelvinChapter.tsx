'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import { KelvinQuadScratch } from '@/components/web-apps/KelvinQuadScratch'
import {
  MobileProse,
  MobileSubStory,
  splitParagraphs,
  WebAppsComplianceCallout,
  WebAppsNdaNote,
  WebAppsNumberedList,
  WebAppsProductGrid,
  WebAppsThesisClose,
} from '@/components/web-apps/WebAppsSectionParts'
import {
  WEB_APPS_KELVIN,
  WEB_APPS_KELVIN_CHAPTER_ID,
} from '@/lib/web-apps/content'

export function WebAppsKelvinChapter() {
  const [s01, s02, s03, s04] = WEB_APPS_KELVIN.subStories
  const s01Intro = splitParagraphs(s01.intro)

  return (
    <FlowChapterSlideLayout
      chapterId={WEB_APPS_KELVIN_CHAPTER_ID}
      fillViewport
      isLast
      className="mobile-chapter-slot web-apps-chapter-slot"
      stage={<KelvinQuadScratch />}
      copy={
        <MobileLearnMore
          headline={WEB_APPS_KELVIN.headline}
          subhead={WEB_APPS_KELVIN.subhead}
          meta={WEB_APPS_KELVIN.meta}
        >
          <MobileSubStory heading={s01.heading}>
            <MobileProse paragraphs={s01Intro} />
            <WebAppsProductGrid products={s01.products} />
            <MobileProse paragraphs={splitParagraphs(s01.inertia)} />
          </MobileSubStory>

          <MobileSubStory heading={s02.heading}>
            <MobileProse paragraphs={splitParagraphs(s02.intro)} />
            <WebAppsComplianceCallout>
              {splitParagraphs(s02.complianceCallout).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </WebAppsComplianceCallout>
            <MobileProse paragraphs={splitParagraphs(s02.close)} />
          </MobileSubStory>

          <MobileSubStory heading={s03.heading}>
            <MobileProse paragraphs={splitParagraphs(s03.intro)} />
            <p className="web-apps-pillars-lead">What Kelvin addresses:</p>
            <WebAppsNumberedList items={s03.pillars} />
          </MobileSubStory>

          <MobileSubStory heading={s04.heading}>
            {s04.ndaNote ? <WebAppsNdaNote>{s04.ndaNote}</WebAppsNdaNote> : null}
            <MobileProse paragraphs={splitParagraphs(s04.body)} />
            <WebAppsThesisClose>{s04.thesisClose}</WebAppsThesisClose>
          </MobileSubStory>
        </MobileLearnMore>
      }
    />
  )
}
