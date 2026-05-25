'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  anchorFromPlacement,
  ALIGN_VIEWBOX,
  blockOriginNativeInBrick,
  blockOriginScreenPosition,
  boardDisplayHeight,
  brickPlacement,
  alignPlacement,
  BRICK_VIEWBOX,
  clampBrickAnchor,
  footprintCells,
  pivotLayout,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import type { SpritePlacement } from '@/lib/formation/spritePlacement'
import { pegLabel } from '@/lib/formation/legoGrid'

export const FORMATION_BOARD_DISPLAY_W = 720

export const DEFAULT_POSITION_PIN = { gx: 2, gy: 2 }

function alignPlacementWithDrag(
  displayWidth: number,
  positionGx: number,
  positionGy: number,
  pivot: BrickPivot,
  brickPlace: SpritePlacement,
  snappedBrick: SpritePlacement,
): SpritePlacement {
  const align = alignPlacement(displayWidth, positionGx, positionGy, pivot, 0, 0)
  return {
    ...align,
    left: brickPlace.left + (align.left - snappedBrick.left),
    top: brickPlace.top + (align.top - snappedBrick.top),
  }
}

export function useFormationLegoBoard() {
  const [pivot, setPivot] = useState<BrickPivot>('left')
  const [positionPin, setPositionPin] = useState(DEFAULT_POSITION_PIN)
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const [showAlignGuide, setShowAlignGuide] = useState(true)
  const [showDebugPegs, setShowDebugPegs] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const grabOffset = useRef({ x: 0, y: 0 })

  const boardW = FORMATION_BOARD_DISPLAY_W
  const boardH = boardDisplayHeight(boardW)

  const footprint = useMemo(
    () => footprintCells(positionPin.gx, positionPin.gy, pivot),
    [positionPin, pivot],
  )

  const blockOriginOnBoard = useMemo(
    () =>
      blockOriginScreenPosition(
        positionPin.gx,
        positionPin.gy,
        boardW,
        pivot,
      ),
    [positionPin, pivot, boardW],
  )

  const blockOriginInBrick = useMemo(
    () => blockOriginNativeInBrick(pivot),
    [pivot],
  )

  const snappedBrick = useMemo(
    () =>
      brickPlacement(boardW, positionPin.gx, positionPin.gy, pivot, 0, 0),
    [boardW, positionPin, pivot],
  )

  const brickPlace = useMemo(
    () =>
      dragFree
        ? { ...snappedBrick, left: dragFree.left, top: dragFree.top }
        : snappedBrick,
    [dragFree, snappedBrick],
  )

  const alignPlace = useMemo(
    () =>
      dragFree
        ? alignPlacementWithDrag(
            boardW,
            positionPin.gx,
            positionPin.gy,
            pivot,
            brickPlace,
            snappedBrick,
          )
        : alignPlacement(boardW, positionPin.gx, positionPin.gy, pivot, 0, 0),
    [boardW, positionPin, pivot, dragFree, brickPlace, snappedBrick],
  )

  const layout = pivotLayout(pivot)
  const positionPegLabel = pegLabel(positionPin.gx, positionPin.gy)
  const footprintLabels = footprint.map((c) => pegLabel(c.x, c.y))

  const setPositionPinFromPeg = useCallback(
    (gx: number, gy: number) => {
      setPositionPin(clampBrickAnchor(gx, gy, pivot))
      setDragFree(null)
    },
    [pivot],
  )

  const endDrag = useCallback(() => {
    if (!dragFree) {
      setIsDragging(false)
      return
    }
    const anchor = anchorFromPlacement(
      dragFree.left,
      dragFree.top,
      boardW,
      pivot,
      0,
      0,
    )
    setPositionPinFromPeg(anchor.gx, anchor.gy)
    setIsDragging(false)
    setDragFree(null)
  }, [dragFree, pivot, boardW, setPositionPinFromPeg])

  const onBrickPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current) return
      e.stopPropagation()
      const rect = boardRef.current.getBoundingClientRect()
      grabOffset.current = {
        x: e.clientX - rect.left - brickPlace.left,
        y: e.clientY - rect.top - brickPlace.top,
      }
      setDragFree({ left: brickPlace.left, top: brickPlace.top })
      setIsDragging(true)
      boardRef.current.setPointerCapture(e.pointerId)
    },
    [brickPlace.left, brickPlace.top],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      setDragFree({
        left: e.clientX - rect.left - grabOffset.current.x,
        top: e.clientY - rect.top - grabOffset.current.y,
      })
    },
    [isDragging],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (boardRef.current?.hasPointerCapture(e.pointerId)) {
        boardRef.current.releasePointerCapture(e.pointerId)
      }
      endDrag()
    },
    [endDrag],
  )

  const setPivotAndClamp = useCallback((next: BrickPivot) => {
    setPivot(next)
    setPositionPin((p) => clampBrickAnchor(p.gx, p.gy, next))
  }, [])

  return {
    boardRef,
    boardW,
    boardH,
    brickViewBox: BRICK_VIEWBOX,
    alignViewBox: ALIGN_VIEWBOX,
    pivot,
    setPivotAndClamp,
    positionPin,
    positionPegLabel,
    footprint,
    footprintLabels,
    layout,
    showAlignGuide,
    setShowAlignGuide,
    showDebugPegs,
    setShowDebugPegs,
    isDragging,
    brickPlace,
    alignPlace,
    blockOriginOnBoard,
    blockOriginInBrick,
    setPositionPinFromPeg,
    onBrickPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
