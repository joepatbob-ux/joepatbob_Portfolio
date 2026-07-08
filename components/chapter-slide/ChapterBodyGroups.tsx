import { ExpandableFacts } from '@/components/chapter-slide/ExpandableFacts'
import { formatChapterInline } from '@/lib/chapter-slide/formatChapterInline'
import type { ChapterBodyGroup } from '@/lib/chapter-slide/parseChapterBody'

const CONTINUE_READING_LABEL = 'Continue reading'

interface Props {
  groups: ChapterBodyGroup[]
  /** Paragraph class — `chapter-copy__body` or `mobile-prose__p` */
  paragraphClass?: string
}

/** Intro paragraphs + expandable facts — a `**bold**` paragraph in the
    content markdown becomes a collapsed trigger, the paragraphs under it
    the detail. One fact open at a time per chapter. */
export function ChapterBodyGroups({
  groups,
  paragraphClass = 'chapter-copy__body',
}: Props) {
  const intro = groups.find((g) => g.subhead === null)
  const folds = groups.filter((g) => g.subhead !== null)

  // No subheads but a long intro — keep the lede, fold the rest
  if (folds.length === 0 && intro && intro.paragraphs.length > 2) {
    const [lede, ...rest] = intro.paragraphs
    return (
      <>
        <p className={paragraphClass}>{formatChapterInline(lede)}</p>
        <ExpandableFacts
          facts={[{ header: CONTINUE_READING_LABEL, detail: rest }]}
          paragraphClass={paragraphClass}
        />
      </>
    )
  }

  return (
    <>
      {intro?.paragraphs.map((paragraph, index) => (
        <p key={`intro-${index}`} className={paragraphClass}>
          {formatChapterInline(paragraph)}
        </p>
      ))}
      {folds.length > 0 ? (
        <ExpandableFacts
          facts={folds.map((group) => ({
            header: group.subhead!,
            detail: group.paragraphs,
          }))}
          paragraphClass={paragraphClass}
        />
      ) : null}
    </>
  )
}
