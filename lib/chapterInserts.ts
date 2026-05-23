/** Extra scroll slides inserted after a section chapter (nav + DOM stay in sync). */

export type ChapterInsertDef = {
  sectionId: string
  /** Section chapter id after which this slide is rendered. */
  afterChapterId: string
  /** Suffix for `data-chapter-id` → `{sectionId}-{insertId}`. */
  insertId: string
  navLabel: string
  fillViewport?: boolean
  viewportClassName?: string
}

export const CHAPTER_INSERTS: readonly ChapterInsertDef[] = [] as const

export function fullInsertChapterId(sectionId: string, insertId: string): string {
  return `${sectionId}-${insertId}`
}

export function insertsAfterChapter(
  sectionId: string,
  chapterId: string,
): ChapterInsertDef[] {
  return CHAPTER_INSERTS.filter(
    (insert) =>
      insert.sectionId === sectionId && insert.afterChapterId === chapterId,
  )
}

export function navInsertsAfterChapter(
  sectionId: string,
  chapterId: string,
): Pick<ChapterInsertDef, 'insertId' | 'navLabel'>[] {
  return insertsAfterChapter(sectionId, chapterId).map(
    ({ insertId, navLabel }) => ({ insertId, navLabel }),
  )
}
