'use client'

import {
  touch2DotCssMetrics,
  touch2HorizontalDotsScale,
} from '@/lib/touch2/touch2StageMetrics'
import { useEffect, useState, type CSSProperties, type RefObject } from 'react'

function availableDotsWidth(
  row: HTMLElement,
  themeEl: HTMLElement | null,
): number {
  const rowStyle = getComputedStyle(row)
  const gap =
    parseFloat(rowStyle.columnGap) ||
    parseFloat(rowStyle.gap) ||
    12
  const themeW = themeEl?.offsetWidth ?? 0
  const reserved = themeW > 0 ? themeW + gap : 0
  return Math.max(0, row.clientWidth - reserved)
}

/** Touch2 horizontal dot metrics scaled to fit beside a sibling control (e.g. theme toggle). */
export function useTouch2HorizontalDotMetrics(
  slideCount: number,
  rowRef: RefObject<HTMLElement | null>,
  themeRef: RefObject<HTMLElement | null>,
): CSSProperties {
  const [metrics, setMetrics] = useState<CSSProperties>(() =>
    touch2DotCssMetrics(1),
  )

  useEffect(() => {
    const row = rowRef.current
    if (!row || typeof ResizeObserver === 'undefined') {
      setMetrics(touch2DotCssMetrics(1))
      return
    }

    const update = () => {
      const available = availableDotsWidth(row, themeRef.current)
      const scale = touch2HorizontalDotsScale(available, slideCount)
      setMetrics(touch2DotCssMetrics(scale))
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(row)
    const themeEl = themeRef.current
    if (themeEl) observer.observe(themeEl)
    return () => observer.disconnect()
  }, [rowRef, themeRef, slideCount])

  return metrics
}
