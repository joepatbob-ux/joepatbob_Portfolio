/** First scroll target when entering a case study section from site nav. */
export function sectionEntryChapterId(sectionId: string): string {
  if (sectionId === 'mobile') return 'mobile-overview'
  if (sectionId === 'web-apps') return 'web-apps-overview'
  if (sectionId === 'everything-else') return 'everything-else-overview'
  return `${sectionId}-overview`
}
