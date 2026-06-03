import {
  BOARD_VIEWBOX,
  boardScale,
  PLATE_CONTENT_BOUNDS,
} from '@/lib/formation/legoGrid'
import type { SpritePlacement } from '@/lib/formation/spritePlacement'

/** Plate container + pan layer sized to the full SVG baseplate. */
export type PlateDisplayLayout = {
  width: number
  height: number
  scale: number
  fullWidth: number
  fullHeight: number
  panX: number
  panY: number
}

export function plateDisplayLayout(displayWidth: number): PlateDisplayLayout {
  const scale = boardScale(displayWidth)
  const b = PLATE_CONTENT_BOUNDS
  return {
    width: b.width * scale,
    height: b.height * scale,
    scale,
    fullWidth: BOARD_VIEWBOX.width * scale,
    fullHeight: BOARD_VIEWBOX.height * scale,
    panX: -b.minX * scale,
    panY: -b.minY * scale,
  }
}

export function plateDisplayHeight(displayWidth: number): number {
  return PLATE_CONTENT_BOUNDS.height * boardScale(displayWidth)
}

/** Clip-container coords → board native (full SVG space). */
export function clipToBoardNative(
  clipX: number,
  clipY: number,
  displayWidth: number,
): { x: number; y: number } {
  const scale = boardScale(displayWidth)
  const b = PLATE_CONTENT_BOUNDS
  return {
    x: clipX / scale + b.minX,
    y: clipY / scale + b.minY,
  }
}

/** Full-image screen placement → clip-container coords. */
export function fullScreenToClip(
  fullLeft: number,
  fullTop: number,
  layout: PlateDisplayLayout,
): { clipX: number; clipY: number } {
  return {
    clipX: fullLeft + layout.panX,
    clipY: fullTop + layout.panY,
  }
}

export function clientToClip(
  boardEl: HTMLElement,
  clientX: number,
  clientY: number,
): { clipX: number; clipY: number } {
  const rect = boardEl.getBoundingClientRect()
  return {
    clipX: clientX - rect.left,
    clipY: clientY - rect.top,
  }
}

export function clientToBoardNative(
  boardEl: HTMLElement,
  clientX: number,
  clientY: number,
  displayWidth: number,
): { x: number; y: number } {
  const { clipX, clipY } = clientToClip(boardEl, clientX, clientY)
  return clipToBoardNative(clipX, clipY, displayWidth)
}

/** Map pan-space sprite placement to viewport-fixed coordinates (brick portal). */
export function screenPlacementFromBoardRect(
  boardRect: { left: number; top: number },
  layout: PlateDisplayLayout,
  placement: SpritePlacement,
): SpritePlacement {
  return {
    left: boardRect.left + layout.panX + placement.left,
    top: boardRect.top + layout.panY + placement.top,
    width: placement.width,
    height: placement.height,
  }
}

export function clientPlacementFromBoard(
  boardEl: HTMLElement,
  layout: PlateDisplayLayout,
  placement: SpritePlacement,
): SpritePlacement {
  return screenPlacementFromBoardRect(
    boardEl.getBoundingClientRect(),
    layout,
    placement,
  )
}
