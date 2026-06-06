// lib/types.ts

export interface Chapter {
  id: string
  title: string
  subtitle: string
  body: string
  imageAlt: string
  imageSrc?: string          // filled once images are placed in /public/images/
  imageLayout: 'portrait' | 'landscape' | 'full-width'
  imagePosition: 'left' | 'right'
}

export interface OverviewMetaItem {
  label: string
  value: string
  /** Full-width band below the tile grid — long outcome / products lines. */
  wide?: boolean
}

export interface Section {
  id: string
  label: string
  eyebrow: string
  headline: string
  overviewBody: string
  overviewMeta?: readonly OverviewMetaItem[]
  lessonTitle: string
  lessonBody: string
  chapters: Chapter[]
  /** Optional block after the last chapter; scroll-spy uses lessons id, not nav. */
  closingQuote?: {
    quote: string
    attribution: string
  }
}

export interface NavChapter {
  id: string
  label: string
}

export interface NavSection {
  id: string
  label: string
  chapters: NavChapter[]
}
