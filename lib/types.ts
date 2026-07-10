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

export interface OverviewPatentEntry {
  number: string
  title?: string
  status?: string
}

export interface OverviewScopeBlock {
  kind: 'scope'
  items: readonly string[]
}

export interface OverviewPatentsBlock {
  kind: 'patents'
  items: readonly OverviewPatentEntry[]
}

export interface OverviewAwardBlock {
  kind: 'award'
  product: string
  headline: string
  detail?: string
}

export interface OverviewHighlightBlock {
  kind: 'highlight'
  label: string
  headline: string
  detail?: string
}

export interface OverviewQuoteBlock {
  kind: 'quote'
  quote: string
  attribution?: string
}

export type OverviewBlock =
  | OverviewScopeBlock
  | OverviewPatentsBlock
  | OverviewAwardBlock
  | OverviewHighlightBlock
  | OverviewQuoteBlock

export interface Section {
  id: string
  label: string
  eyebrow: string
  headline: string
  overviewBody: string
  overviewBlocks?: readonly OverviewBlock[]
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
