/** Responsive chapter copy layout — see DESIGN_SPEC.md § Chapter copy modes. */
export type ChapterLayoutMode = 'mobile' | 'compact' | 'desktop'

export function usesCompactCopyMode(mode: ChapterLayoutMode): boolean {
  return mode === 'mobile' || mode === 'compact'
}

export function getChapterCopyColumnClasses(options: {
  mode: ChapterLayoutMode
  copyOnly?: boolean
  isFlow?: boolean
  extraClasses?: string | string[]
}): string {
  const { mode, copyOnly = false, isFlow = false, extraClasses } = options
  const extra = [
    ...(Array.isArray(extraClasses)
      ? extraClasses
      : extraClasses
        ? [extraClasses]
        : []),
  ]

  if (copyOnly) {
    return [
      'chapter-slide__copy',
      'chapter-copy',
      'chapter-slide__copy--overview',
      ...extra,
    ]
      .filter(Boolean)
      .join(' ')
  }

  if (usesCompactCopyMode(mode)) {
    return [
      'chapter-slide__copy',
      'chapter-copy',
      isFlow ? 'flow-chapter-slide__copy' : '',
      'mobile-learn-more-copy',
      mode === 'mobile' ? 'chapter-slide__copy--mobile-teaser' : '',
      mode === 'compact' ? 'chapter-slide__copy--compact-teaser' : '',
      ...extra,
    ]
      .filter(Boolean)
      .join(' ')
  }

  return [
    'chapter-slide__copy',
    'chapter-copy',
    isFlow ? 'flow-chapter-slide__copy' : '',
    ...extra,
  ]
    .filter(Boolean)
    .join(' ')
}
