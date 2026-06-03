import { readProtoDebugSearchParams } from '@/lib/protoDebugMode'

/** Stable ids for chapter shell layout debug (`?chapter-ghost=1`). */
export function chapterLayoutLayer(chapterId: string, part: string): string {
  return `${chapterId}/${part}`
}

export function isChapterLayoutGhostEnabled(): boolean {
  const params = readProtoDebugSearchParams()
  if (params.get('chapter-ghost') === '0') return false
  if (params.has('chapter-ghost')) return true
  if (params.get('layout-ghost') === '1') return true
  return false
}

/** Primary block class on a stage child for labeling (e.g. kelvin-scratch, phone-swap). */
export function stageArtifactLayerId(
  chapterId: string,
  el: HTMLElement,
  index: number,
): string {
  const block = [...el.classList].find(
    (c) =>
      c.length > 2 &&
      !c.startsWith('chapter-') &&
      !c.startsWith('flow-') &&
      !c.startsWith('portfolio-') &&
      !c.includes('mobile-learn-more'),
  )
  if (block) return chapterLayoutLayer(chapterId, `stage/${block}`)

  return chapterLayoutLayer(chapterId, `stage/child-${index}`)
}
