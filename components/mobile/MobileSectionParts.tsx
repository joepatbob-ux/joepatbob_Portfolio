import { ChapterBodyGroups } from '@/components/chapter-slide/ChapterBodyGroups'
import { groupChapterBody } from '@/lib/chapter-slide/parseChapterBody'

export { CaseStudySectionHeader as MobileSectionHeader } from '@/components/case-study/CaseStudySectionHeader'

export function MobileProse({
  paragraphs,
  className,
}: {
  paragraphs: string[]
  className?: string
}) {
  const groups = groupChapterBody(paragraphs)

  return (
    <div
      className={['mobile-prose', className].filter(Boolean).join(' ')}
    >
      <ChapterBodyGroups groups={groups} paragraphClass="mobile-prose__p" />
    </div>
  )
}
