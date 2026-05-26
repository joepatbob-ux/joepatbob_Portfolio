'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  boardSnapPointFromBrickPlacement,
  brickPlacement,
  BRICK_VIEWBOX,
  positionPinFits,
  positionPinFromBoardSnapPoint,
  snappedPlacementFromNative,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import {
  clientToBoardNative,
  clientToClip,
  clipToBoardNative,
  fullScreenToClip,
  plateDisplayLayout,
} from '@/lib/formation/plateViewport'

export const FORMATION_BOARD_DISPLAY_W = 720

export const DEFAULT_POSITION_PIN = { gx: 2, gy: 2 }

function initialPositionPin(pivot: BrickPivot): { gx: number; gy: number } {
  if (positionPinFits(DEFAULT_POSITION_PIN.gx, DEFAULT_POSITION_PIN.gy, pivot)) {
    return DEFAULT_POSITION_PIN
  }
  return positionPinFromBoardSnapPoint({ x: 0, y: 0 }, pivot)
}

export function useFormationLegoBoard() {
  const [pivot, setPivot] = useState<BrickPivot>('left')
  const [positionPin, setPositionPin] = useState(() =>
    initialPositionPin('left'),
  )
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [isDragging, setIsDragging] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const grabOffsetClip = useRef({ x: 0, y: 0 })
  const dragNativeRef = useRef<{ x: number; y: number } | null>(null)

  const boardW = FORMATION_BOARD_DISPLAY_W
  const plate = useMemo(() => plateDisplayLayout(boardW), [boardW])

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

  const applyNativeSnap = useCallback(
    (native: { x: number; y: number }, forPivot: BrickPivot) => {
      setPositionPin(
        snappedPlacementFromNative(native.x, native.y, boardW, forPivot).peg,
      )
      setDragFree(null)
      dragNativeRef.current = null
    },
    [boardW],
  )

  const placementAtNative = useCallback(
    (native: { x: number; y: number }) => {
      const { peg, placement } = snappedPlacementFromNative(
        native.x,
        native.y,
        boardW,
        pivot,
      )
      return {
        peg,
        left: placement.left,
        top: placement.top,
      }
    },
    [boardW, pivot],
  )

  const endDrag = useCallback(() => {
    const native = dragNativeRef.current
    if (native) {
      setPositionPin(placementAtNative(native).peg)
    }
    dragNativeRef.current = null
    setIsDragging(false)
    setDragFree(null)
  }, [placementAtNative])

  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('.formation-lego__block')) return
      if (!boardRef.current) return
      const native = clientToBoardNative(
        boardRef.current,
        e.clientX,
        e.clientY,
        boardW,
      )
      applyNativeSnap(native, pivot)
    },
    [applyNativeSnap, boardW, pivot],
  )

  const onBrickPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!boardRef.current) return
      e.stopPropagation()
      const { clipX, clipY } = fullScreenToClip(
        brickPlace.left,
        brickPlace.top,
        plate,
      )
      const pointer = clientToClip(boardRef.current, e.clientX, e.clientY)
      grabOffsetClip.current = {
        x: pointer.clipX - clipX,
        y: pointer.clipY - clipY,
      }
      const native = clipToBoardNative(clipX, clipY, boardW)
      dragNativeRef.current = native
      // Keep exact placement when selecting so the brick does not jump on pointer-down.
      setDragFree({ left: brickPlace.left, top: brickPlace.top })
      setIsDragging(true)
      boardRef.current.setPointerCapture(e.pointerId)
    },
    [boardW, brickPlace.left, brickPlace.top, plate],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !boardRef.current) return
      const pointer = clientToClip(boardRef.current, e.clientX, e.clientY)
      const native = clipToBoardNative(
        pointer.clipX - grabOffsetClip.current.x,
        pointer.clipY - grabOffsetClip.current.y,
        boardW,
      )
      const { left, top } = placementAtNative(native)
      dragNativeRef.current = native
      setDragFree({ left, top })
    },
    [boardW, isDragging, placementAtNative],
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

  const setPivotAndClamp = useCallback(
    (next: BrickPivot) => {
      if (next === pivot) return
      const placement =
        dragFree ??
        brickPlacement(boardW, positionPin.gx, positionPin.gy, pivot, 0, 0)
      const snapOnBoard = boardSnapPointFromBrickPlacement(
        placement.left,
        placement.top,
        boardW,
        pivot,
      )
      const peg = positionPinFromBoardSnapPoint(snapOnBoard, next)
      setPivot(next)
      setPositionPin(peg)
      setDragFree(null)
      dragNativeRef.current = null
    },
    [boardW, pivot, positionPin, dragFree],
  )

  return {
    boardRef,
    boardW,
    plate,
    brickViewBox: BRICK_VIEWBOX,
    pivot,
    setPivotAndClamp,
    isDragging,
    brickPlace,
    onBoardPointerDown,
    onBrickPointerDown,
    onPointerMove,
    onPointerUp,
    positionPin,
  }
}
