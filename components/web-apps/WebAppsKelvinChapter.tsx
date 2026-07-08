'use client'

import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { KelvinScratch } from '@/components/web-apps/kelvin-scratch/KelvinScratch'
import {
  MobileProse,
  splitParagraphs,
  WebAppsNdaNote,
} from '@/components/web-apps/WebAppsSectionParts'
import {
  WEB_APPS_KELVIN,
  WEB_APPS_KELVIN_CHAPTER_ID,
} from '@/lib/web-apps/content'

export function WebAppsKelvinChapter() {
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
          <MobileProse paragraphs={splitParagraphs(WEB_APPS_KELVIN.prose)} />
          {/* NDA disclosure stays permanently visible — never an expandable fact */}
          <WebAppsNdaNote>{WEB_APPS_KELVIN.ndaNote}</WebAppsNdaNote>
          <MobileProse paragraphs={splitParagraphs(WEB_APPS_KELVIN.facts)} />
        </ChapterCopyReveal>
      }
    />
  )
}
