'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { KelvinScratch } from '@/components/web-apps/kelvin-scratch/KelvinScratch'
import {
  MobileProse,
  MobileSubStory,
  MobileSubStoryHeading,
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

  return (
    <FlowChapterSlideLayout
      chapterId={WEB_APPS_KELVIN_CHAPTER_ID}
      fillViewport
      isLast
      className="mobile-chapter-slot web-apps-chapter-slot"
      stageAriaLabel="Kelvin design system scratch-off reveal"
      stage={<KelvinScratch chapterId={WEB_APPS_KELVIN_CHAPTER_ID} />}
      copy={
        <ChapterCopyReveal
          headline={WEB_APPS_KELVIN.headline}
          subhead={WEB_APPS_KELVIN.subhead}
        >
          <MobileSubStory heading={s01.heading}>
            <WebAppsProductGrid products={s01.products} />
            {s01.inertia.trim() ? (
              <>
                <MobileSubStoryHeading heading="Revenue-protecting inertia is a real force." />
                <MobileProse paragraphs={splitParagraphs(s01.inertia)} />
              </>
            ) : null}
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
            {s04.thesisClose ? (
              <WebAppsThesisClose>{s04.thesisClose}</WebAppsThesisClose>
            ) : null}
          </MobileSubStory>
        </ChapterCopyReveal>
      }
    />
  )
}
