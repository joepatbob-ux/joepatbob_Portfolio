import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { ChapterCopyReveal } from '@/components/chapter-slide/ChapterCopyReveal'
import { KelvinScratch } from '@/components/web-apps/kelvin-scratch/KelvinScratch'
import {
  MobileProse,
  WebAppsNdaNote,
} from '@/components/web-apps/WebAppsSectionParts'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'
import {
  WEB_APPS_KELVIN,
  WEB_APPS_KELVIN_CHAPTER_ID,
} from '@/lib/web-apps/content'
import { useContentDebug } from '@/components/ContentDebugProvider'

export function WebAppsKelvinChapter() {
  const { text } = useContentDebug()
  const headline = text(
    'web-apps/kelvin-ds/intro#headline',
    WEB_APPS_KELVIN.headline,
  )
  const subhead = text(
    'web-apps/kelvin-ds/intro#subhead',
    WEB_APPS_KELVIN.subhead,
  )
  const ndaNote = text('web-apps/kelvin-ds/intro#ndaNote', WEB_APPS_KELVIN.ndaNote)
  const prose = text('web-apps/kelvin-ds/intro#prose', WEB_APPS_KELVIN.prose)
  const facts = text('web-apps/kelvin-ds/intro#facts', WEB_APPS_KELVIN.facts)

  return (
    <FlowChapterSlideLayout
      chapterId={WEB_APPS_KELVIN_CHAPTER_ID}
      fillViewport
      isLast
      className="mobile-chapter-slot web-apps-chapter-slot"
      stageAriaLabel="Kelvin design system scratch-off reveal"
      stage={<KelvinScratch chapterId={WEB_APPS_KELVIN_CHAPTER_ID} />}
      copy={
        <ChapterCopyReveal headline={headline} subhead={subhead}>
          <MobileProse paragraphs={parseChapterBody(prose)} />
          {/* NDA disclosure stays permanently visible — never an expandable fact */}
          <WebAppsNdaNote>{ndaNote}</WebAppsNdaNote>
          <MobileProse paragraphs={parseChapterBody(facts)} />
        </ChapterCopyReveal>
      }
    />
  )
}
