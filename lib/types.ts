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
  /** @deprecated Prefer `overviewBlocks` on the section. */
  value?: string
  /** @deprecated Prefer `overviewBlocks` on the section. */
  items?: readonly string[]
  /** @deprecated Scope uses `overviewBlocks` instead. */
  wide?: boolean
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

export type OverviewBlock =
  | OverviewScopeBlock
  | OverviewPatentsBlock
  | OverviewAwardBlock

export interface Section {
  id: string
  label: string
  eyebrow: string
  headline: string
  overviewBody: string
  /** @deprecated Prefer `overviewBlocks`. */
  overviewMeta?: readonly OverviewMetaItem[]
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
