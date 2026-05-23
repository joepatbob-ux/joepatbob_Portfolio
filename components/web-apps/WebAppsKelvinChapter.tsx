'use client'

import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterViewport } from '@/components/ChapterViewport'
import { CaseStudySplit } from '@/components/case-study/CaseStudySplit'
import { KelvinQuadScratch } from '@/components/web-apps/KelvinQuadScratch'
import {
  MobileProse,
  MobileSubStory,
  splitParagraphs,
  WebAppsComplianceCallout,
  WebAppsNdaNote,
  WebAppsNumberedList,
  WebAppsProductGrid,
  WebAppsSectionHeader,
  WebAppsThesisClose,
} from '@/components/web-apps/WebAppsSectionParts'
import {
  WEB_APPS_KELVIN,
  WEB_APPS_KELVIN_CHAPTER_ID,
} from '@/lib/web-apps/content'
import { useCopyScrollActive } from '@/lib/useCopyScrollActive'

export function WebAppsKelvinChapter() {
  const copyScrollActive = useCopyScrollActive(WEB_APPS_KELVIN_CHAPTER_ID)
  const [s01, s02, s03, s04] = WEB_APPS_KELVIN.subStories

  return (
    <ChapterViewport
      chapterId={WEB_APPS_KELVIN_CHAPTER_ID}
      fillViewport
      isLast
      className="web-apps-kelvin-slot mobile-chapter-slot"
    >
      <ChapterCopyScroller
        active={copyScrollActive}
        className="mobile-chapter-panel__scroll"
      >
        <div className="mobile-chapter-panel__content web-apps-kelvin__content">
          <WebAppsSectionHeader
            eyebrow={WEB_APPS_KELVIN.eyebrow}
            headline={WEB_APPS_KELVIN.headline}
            subhead={WEB_APPS_KELVIN.subhead}
            meta={WEB_APPS_KELVIN.meta}
          />

          <div className="mobile-sub-stories">
            <MobileSubStory number={s01.number} heading={s01.heading}>
              <CaseStudySplit
                className="case-study-split--wide-stage"
                copy={
                  <>
                    <MobileProse paragraphs={splitParagraphs(s01.intro)} />
                    <WebAppsProductGrid products={s01.products} />
                    <MobileProse paragraphs={splitParagraphs(s01.inertia)} />
                  </>
                }
                stage={<KelvinQuadScratch />}
              />
            </MobileSubStory>

            <MobileSubStory number={s02.number} heading={s02.heading}>
              <MobileProse paragraphs={splitParagraphs(s02.intro)} />
              <WebAppsComplianceCallout>
                {splitParagraphs(s02.complianceCallout).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </WebAppsComplianceCallout>
              <MobileProse paragraphs={splitParagraphs(s02.close)} />
            </MobileSubStory>

            <MobileSubStory number={s03.number} heading={s03.heading}>
              <MobileProse paragraphs={splitParagraphs(s03.intro)} />
              <p className="web-apps-pillars-lead">What Kelvin addresses:</p>
              <WebAppsNumberedList items={s03.pillars} />
            </MobileSubStory>

            <MobileSubStory number={s04.number} heading={s04.heading}>
              {s04.ndaNote ? <WebAppsNdaNote>{s04.ndaNote}</WebAppsNdaNote> : null}
              <MobileProse paragraphs={splitParagraphs(s04.body)} />
              <WebAppsThesisClose>{s04.thesisClose}</WebAppsThesisClose>
            </MobileSubStory>
          </div>
        </div>
      </ChapterCopyScroller>
    </ChapterViewport>
  )
}
