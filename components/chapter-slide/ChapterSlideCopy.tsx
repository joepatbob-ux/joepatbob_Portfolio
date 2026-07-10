import { ChapterCopyScroller } from '@/components/ChapterCopyScroller'
import { ChapterBodyGroups } from '@/components/chapter-slide/ChapterBodyGroups'
import { isContinuousChapters } from '@/lib/continuousChapters'
import { formatHeadlinePeriod } from '@/lib/chapter-slide/formatHeadlinePeriod'
import {
  groupChapterBody,
  parseChapterBody,
} from '@/lib/chapter-slide/parseChapterBody'

export type ChapterSlideCopyLayout = 'chapter' | 'lessons'

interface Props {
  active: boolean
  headline: string
  body: string
  className?: string
  layout?: ChapterSlideCopyLayout
}

/** Headline, accent rule, and scrollable body — shared across case study slides.
    Subhead sections render as expandable folds so long copy scans as headlines. */
export function ChapterSlideCopy({
  active,
  headline,
  body,
  className,
  layout = 'chapter',
}: Props) {
  const groups = groupChapterBody(parseChapterBody(body))
  const showHeader = headline.trim().length > 0

  const copyBody = (
    <>
      {showHeader ? (
        <>
          <h3 className="chapter-copy__headline">
            {formatHeadlinePeriod(headline)}
          </h3>
          <div className="chapter-copy__rule" aria-hidden />
        </>
      ) : null}
      <div className="chapter-slide__body">
        <ChapterBodyGroups groups={groups} />
      </div>
    </>
  )

  return (
    <div
      className={[
        'chapter-slide__copy',
        'chapter-copy',
        layout === 'lessons' ? 'chapter-slide__copy--lessons' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isContinuousChapters() ? (
        copyBody
      ) : (
        <ChapterCopyScroller active={active}>{copyBody}</ChapterCopyScroller>
      )}
    </div>
  )
}
