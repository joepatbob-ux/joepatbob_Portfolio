'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  boardDisplayHeight,
  brickPlacement,
  BRICK_VIEWBOX,
  clampBrickAnchor,
  positionPinFromBrickPlacement,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { boardScale, nearestStudFromNative } from '@/lib/formation/legoGrid'
import { roundPlacementPx } from '@/lib/formation/pixelNudge'

export const FORMATION_BOARD_DISPLAY_W = 720

export const DEFAULT_POSITION_PIN = { gx: 2, gy: 2 }

export function useFormationLegoBoard() {
  const [pivot, setPivot] = useState<BrickPivot>('left')
  const [positionPin, setPositionPin] = useState(DEFAULT_POSITION_PIN)
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const grabOffset = useRef({ x: 0, y: 0 })
  const dragPlacementRef = useRef<{ left: number; top: number } | null>(null)

  const boardW = FORMATION_BOARD_DISPLAY_W
  const boardH = boardDisplayHeight(boardW)

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

  const setPositionPinFromPeg = useCallback(
    (gx: number, gy: number) => {
      setPositionPin(clampBrickAnchor(gx, gy, pivot))
      setDragFree(null)
      dragPlacementRef.current = null
    },
    [pivot],
  )

  const endDrag = useCallback(() => {
    const dragged = dragPlacementRef.current
    if (dragged) {
      const peg = positionPinFromBrickPlacement(
        dragged.left,
        dragged.top,
        boardW,
        pivot,
      )
      setPositionPin(peg)
    }
    dragPlacementRef.current = null
    setIsDragging(false)
    setDragFree(null)
  }, [boardW, pivot])

  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('.formation-lego__block')) return
      if (!boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const s = boardScale(boardW)
      const peg = nearestStudFromNative(
        (e.clientX - rect.left) / s,
        (e.clientY - rect.top) / s,
      )
      setPositionPinFromPeg(peg.gx, peg.gy)
    },
    [boardW, setPositionPinFromPeg],
  )

  const onBrickPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current) return
      e.stopPropagation()
      const rect = boardRef.current.getBoundingClientRect()
      grabOffset.current = {
        x: e.clientX - rect.left - brickPlace.left,
        y: e.clientY - rect.top - brickPlace.top,
      }
      const pos = roundPlacementPx(brickPlace.left, brickPlace.top)
      dragPlacementRef.current = pos
      setDragFree(pos)
      setIsDragging(true)
      boardRef.current.setPointerCapture(e.pointerId)
    },
    [brickPlace.left, brickPlace.top],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const pos = roundPlacementPx(
        e.clientX - rect.left - grabOffset.current.x,
        e.clientY - rect.top - grabOffset.current.y,
      )
      dragPlacementRef.current = pos
      setDragFree(pos)
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
    setDragFree(null)
    dragPlacementRef.current = null
  }, [])

  return {
    boardRef,
    boardW,
    boardH,
    brickViewBox: BRICK_VIEWBOX,
    pivot,
    setPivotAndClamp,
    isDragging,
    brickPlace,
    onBoardPointerDown,
    onBrickPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
