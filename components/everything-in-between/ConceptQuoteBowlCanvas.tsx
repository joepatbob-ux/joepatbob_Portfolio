'use client'

import { BowlGlThemeSync } from '@/components/everything-in-between/quote-bowl/BowlGlThemeSync'
import { QuoteBowlScene } from '@/components/everything-in-between/quote-bowl/QuoteBowlScene'
import { QuoteBowlSceneLighting } from '@/components/everything-in-between/quote-bowl/QuoteBowlSceneLighting'
import type { QuoteBowlCanvasProps } from '@/lib/everything-in-between/quoteBowl/types'

export type { QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
export type { QuoteBowlCanvasProps }

export function ConceptQuoteBowlCanvas(props: QuoteBowlCanvasProps) {
  const { darkSurface, ...sceneProps } = props

  return (
    <>
      <BowlGlThemeSync darkSurface={darkSurface} />
      <QuoteBowlSceneLighting darkSurface={darkSurface} />
      <QuoteBowlScene {...sceneProps} darkSurface={darkSurface} />
    </>
  )
}
