'use client'

import type { ReactNode } from 'react'
import {
  SMA_LOGICAL_HEIGHT,
  SMA_LOGICAL_WIDTH,
} from '@/lib/sma-ios26/screen-spec'

type PhoneScreenViewportProps = {
  children: ReactNode
  /** Visual scale for debug lab (logical px stay fixed). */
  scale?: number
  debug?: boolean
  /** DOM id for future CanvasTexture capture hook. */
  captureId?: string
  /** Match iPhone display UV V-flip (live 3D overlay). */
  flipY?: boolean
}

export function PhoneScreenViewport({
  children,
  scale = 1,
  debug = false,
  captureId = 'sma-phone-screen',
  flipY = false,
}: PhoneScreenViewportProps) {
  return (
    <div
      className={`sma-viewport${debug ? ' sma-viewport--debug' : ''}`}
      style={
        {
          '--sma-w': `${SMA_LOGICAL_WIDTH}px`,
          '--sma-h': `${SMA_LOGICAL_HEIGHT}px`,
          '--sma-scale': scale,
        } as React.CSSProperties
      }
    >
      <div
        id={captureId}
        className="sma-viewport__inner"
        style={flipY ? { transform: 'scaleY(-1)' } : undefined}
      >
        {children}
      </div>
    </div>
  )
}
