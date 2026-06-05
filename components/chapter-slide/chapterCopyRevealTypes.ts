import type { ReactNode } from 'react'

export interface ChapterCopyRevealProps {
  headline: string
  subhead?: string
  align?: 'left' | 'center'
  /** Flow sections use section header; hardware chapters use chapter copy headline. */
  headerVariant?: 'section' | 'chapter'
  triggerLabel?: string
  children: ReactNode
}
