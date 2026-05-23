'use client'

import { DragScrubber } from '@/components/DragScrubber'

interface Props {
  beforeSrc: string
  afterSrc: string
  beforeAlt: string
  afterAlt: string
  caption?: string
}

/** @deprecated Prefer DragScrubber — kept for existing chapter-registry usage. */
export function BeforeAfterSlider(props: Props) {
  return <DragScrubber {...props} />
}
