'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  boardSnapPointFromBrickPlacement,
  brickLayerLift,
  brickPlacement,
  brickIsoZIndex,
  SELECTED_VIEWBOX,
  placementSnapAnchor,
  positionPinFits,
  positionPinFromBoardSnapPoint,
  positionPinFromRaisedBrickPlacement,
  previewStackLevel,
  hasBrickStackedAbove,
  isPointerOnRotateRing,
  resolveStackedSnap,
  snappedPlacementFromNative,
  snapToTopLevel,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { roundPlacementPx } from '@/lib/formation/pixelNudge'
import { spritePlacement } from '@/lib/formation/spritePlacement'
import { scheduleScrollFrame } from '@/lib/scrollFrame'
import {
  clientToBoardNative,
  clientToClip,
  plateDisplayLayout,
  screenPlacementFromBoardRect,
} from '@/lib/formation/plateViewport'

export const FORMATION_BOARD_DISPLAY_W = 720
const FORMATION_BOARD_MIN_W = 280

export const DEFAULT_POSITION_PIN = { gx: 2, gy: 2 }

export const FORMATION_BRICK_COLORS: BrickColor[] = [
  'cyan',
  'magenta',
  'yellow',
  'black',
]

/** Ignore pointer noise so click-to-select does not re-snap the brick. */
const DRAG_THRESHOLD_PX = 5

type FormationPiece = {
  id: BrickColor
  color: BrickColor
  gx: number
  gy: number
  pivot: BrickPivot
  level: number
}

function initialPositionPin(pivot: BrickPivot): { gx: number; gy: number } {
  if (positionPinFits(DEFAULT_POSITION_PIN.gx, DEFAULT_POSITION_PIN.gy, pivot)) {
    return DEFAULT_POSITION_PIN
  }
  return positionPinFromBoardSnapPoint({ x: 0, y: 0 }, pivot)
}

/** Drag follow: anchor tracks pointer; renderLevel lifts the sprite while dragging. */
function placementFollowPointer(
  native: { x: number; y: number },
  boardW: number,
  pivot: BrickPivot,
  renderLevel: number,
) {
  const layerLift = brickLayerLift(boardW)
  return spritePlacement(
    boardW,
    placementSnapAnchor(pivot),
    native,
    SELECTED_VIEWBOX,
    renderLevel,
    layerLift,
  )
}

function depthZDuringDrag(
  piece: FormationPiece,
  dragFree: { left: number; top: number } | null,
  previewLevel: number,
  boardW: number,
): number {
  if (!dragFree) {
    return brickIsoZIndex(piece.gx, piece.gy, piece.pivot, piece.level)
  }
  const peg = positionPinFromRaisedBrickPlacement(
    dragFree.left,
    dragFree.top,
    boardW,
    piece.pivot,
    previewLevel,
  )
  return brickIsoZIndex(peg.gx, peg.gy, piece.pivot, previewLevel)
}

function clampPieceToPlate(
  piece: FormationPiece,
  boardW: number,
  pieces: FormationPiece[],
): FormationPiece {
  const pin = positionPinFits(piece.gx, piece.gy, piece.pivot)
    ? { gx: piece.gx, gy: piece.gy }
    : initialPositionPin(piece.pivot)
  const level = snapToTopLevel(
    pin.gx,
    pin.gy,
    piece.pivot,
    pieces,
    piece.id,
  )
  return { ...piece, gx: pin.gx, gy: pin.gy, level }
}

export function useFormationLegoBoard(options?: {
  /** Desktop portal bricks track viewport position on scroll. */
  syncBoardRectOnScroll?: boolean
  /** Re-measure board anchor when the chapter becomes visible (nav / scroll). */
  visible?: boolean
}) {
  const syncBoardRectOnScroll = options?.syncBoardRectOnScroll ?? true
  const visible = options?.visible ?? true
  const stageRef = useRef<HTMLDivElement>(null)
  const [boardW, setBoardW] = useState(FORMATION_BOARD_DISPLAY_W)
  const [pieces, setPieces] = useState<FormationPiece[]>(() => {
    const initial: FormationPiece[] = [
      { id: 'cyan', color: 'cyan', gx: 2, gy: 2, pivot: 'left', level: 0 },
      { id: 'magenta', color: 'magenta', gx: 5, gy: 2, pivot: 'left', level: 0 },
      { id: 'yellow', color: 'yellow', gx: 2, gy: 6, pivot: 'left', level: 0 },
      { id: 'black', color: 'black', gx: 6, gy: 6, pivot: 'right', level: 0 },
    ]
    return initial.map((p) => clampPieceToPlate(p, FORMATION_BOARD_DISPLAY_W, initial))
  })
  const [activeId, setActiveId] = useState<BrickColor | null>(null)
  const [dragId, setDragId] = useState<BrickColor | null>(null)
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [dragHasMoved, setDragHasMoved] = useState(false)
  const [dragPreviewLevel, setDragPreviewLevel] = useState(0)
  const [boardRect, setBoardRect] = useState({ left: 0, top: 0 })
  const boardRef = useRef<HTMLDivElement>(null)
  /** Pointer minus snap-anchor in board native space (not brick box top-left). */
  const grabOffsetNative = useRef({ x: 0, y: 0 })
  const dragNativeRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointerStartClip = useRef<{ x: number; y: number } | null>(null)
  /** Sync drag state for pointerup (React state can lag one frame behind move). */
  const dragFreeRef = useRef<{ left: number; top: number } | null>(null)
  const dragHasMovedRef = useRef(false)
  const dragPieceIdRef = useRef<BrickColor | null>(null)
  const dragPreviewLevelRef = useRef(0)
  /** Selected brick tapped again (not ring) — set down on pointer up without drag. */
  const tapToSetDownRef = useRef(false)
  const capturePointerIdRef = useRef<number | null>(null)
  const captureTargetRef = useRef<HTMLElement | null>(null)

  const layerLift = useMemo(() => brickLayerLift(boardW), [boardW])
  const plate = useMemo(() => plateDisplayLayout(boardW), [boardW])

  useEffect(() => {
    const stageEl = stageRef.current
    if (!stageEl || typeof ResizeObserver === 'undefined') return

    const updateBoardWidth = () => {
      const nextWidth = Math.max(
        FORMATION_BOARD_MIN_W,
        Math.floor(stageEl.clientWidth),
      )
      setBoardW((prev) => (prev === nextWidth ? prev : nextWidth))
    }

    updateBoardWidth()
    const observer = new ResizeObserver(updateBoardWidth)
    observer.observe(stageEl)

    return () => observer.disconnect()
  }, [])

  const activePiece = useMemo(
    () =>
      activeId ? (pieces.find((p) => p.id === activeId) ?? null) : null,
    [activeId, pieces],
  )

  const selectPiece = useCallback(
    (pieceId: BrickColor | null) => {
      if (pieceId != null) {
        const piece = pieces.find((p) => p.id === pieceId)
        if (!piece || hasBrickStackedAbove(piece, pieces)) return
      }
      setActiveId(pieceId)
    },
    [pieces],
  )

  useEffect(() => {
    if (!activeId) return
    const active = pieces.find((p) => p.id === activeId)
    if (active && hasBrickStackedAbove(active, pieces)) {
      setActiveId(null)
    }
  }, [activeId, pieces])

  const isDragging = dragId != null && dragHasMoved

  /** Selected / active drag uses `Lego_Brick_*_Selected.svg` (orange guides). */
  const isPiecePickedUp = useCallback(
    (pieceId: BrickColor) => {
      if (activeId !== pieceId && dragId !== pieceId) return false
      const piece = pieces.find((p) => p.id === pieceId)
      return piece != null && !hasBrickStackedAbove(piece, pieces)
    },
    [activeId, dragId, pieces],
  )

  const placementForPiece = useCallback(
    (piece: FormationPiece, free?: { left: number; top: number } | null) => {
      const pickedUp = isPiecePickedUp(piece.id)
      const snapped = brickPlacement(
        boardW,
        piece.gx,
        piece.gy,
        piece.pivot,
        piece.level,
        layerLift,
        pickedUp,
      )
      if (free && piece.id === dragId) {
        return { ...snapped, left: free.left, top: free.top }
      }
      return snapped
    },
    [boardW, dragId, isPiecePickedUp, layerLift],
  )

  const commitSnap = useCallback(
    (
      pieceId: BrickColor,
      native: { x: number; y: number },
      piecePivot: BrickPivot,
    ) => {
      const snap = snappedPlacementFromNative(
        native.x,
        native.y,
        boardW,
        piecePivot,
        0,
        0,
      )
      setPieces((prev) => {
        const topLevel = snapToTopLevel(
          snap.peg.gx,
          snap.peg.gy,
          piecePivot,
          prev,
          pieceId,
        )
        return prev.map((p) =>
          p.id === pieceId
            ? {
                ...p,
                gx: snap.peg.gx,
                gy: snap.peg.gy,
                pivot: piecePivot,
                level: topLevel,
              }
            : p,
        )
      })
    },
    [boardW],
  )

  const endDrag = useCallback(() => {
    const pieceId = dragPieceIdRef.current
    const piece = pieceId ? pieces.find((p) => p.id === pieceId) : null
    const release = dragFreeRef.current
    const moved = dragHasMovedRef.current
    const tapSetDown = tapToSetDownRef.current

    if (piece && !moved && tapSetDown) {
      const placement = placementForPiece(piece)
      const native = boardSnapPointFromBrickPlacement(
        placement.left,
        placement.top,
        boardW,
        piece.pivot,
        piece.level,
        layerLift,
      )
      commitSnap(piece.id, native, piece.pivot)
      setActiveId(null)
    } else if (piece && release && moved) {
      const previewLevel = dragPreviewLevelRef.current
      setPieces((prev) => {
        const { peg, level: topLevel } = resolveStackedSnap(
          release.left,
          release.top,
          boardW,
          piece.pivot,
          previewLevel,
          prev,
          piece.id,
        )
        return prev.map((p) =>
          p.id === piece.id
            ? { ...p, gx: peg.gx, gy: peg.gy, level: topLevel }
            : p,
        )
      })
      setActiveId(null)
    }

    dragNativeRef.current = null
    dragPointerStartClip.current = null
    dragFreeRef.current = null
    dragHasMovedRef.current = false
    dragPieceIdRef.current = null
    dragPreviewLevelRef.current = 0
    tapToSetDownRef.current = false
    setDragPreviewLevel(0)
    setDragHasMoved(false)
    setDragId(null)
    setDragFree(null)
  }, [boardW, commitSnap, layerLift, pieces, placementForPiece])

  useEffect(() => {
    const boardEl = boardRef.current
    if (!boardEl) return

    const sync = () => {
      const rect = boardEl.getBoundingClientRect()
      const left = Math.round(rect.left)
      const top = Math.round(rect.top)
      setBoardRect((prev) =>
        prev.left === left && prev.top === top ? prev : { left, top },
      )
    }

    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(boardEl)
    window.addEventListener('resize', sync)

    if (!syncBoardRectOnScroll) {
      return () => {
        ro.disconnect()
        window.removeEventListener('resize', sync)
      }
    }

    const unsubScroll = scheduleScrollFrame(sync)

    return () => {
      ro.disconnect()
      unsubScroll()
      window.removeEventListener('resize', sync)
    }
  }, [boardW, plate.panX, plate.panY, syncBoardRectOnScroll])

  useEffect(() => {
    if (!visible) return
    const boardEl = boardRef.current
    if (!boardEl) return
    const rect = boardEl.getBoundingClientRect()
    const left = Math.round(rect.left)
    const top = Math.round(rect.top)
    setBoardRect((prev) =>
      prev.left === left && prev.top === top ? prev : { left, top },
    )
  }, [visible, boardW, plate.panX, plate.panY])

  const rotateActivePiece = useCallback(
    (next: BrickPivot) => {
      const piece = pieces.find((p) => p.id === activeId)
      if (!piece || piece.pivot === next) return
      if (hasBrickStackedAbove(piece, pieces)) return

      const placement =
        dragId === activeId && dragFree
          ? { left: dragFree.left, top: dragFree.top }
          : brickPlacement(
              boardW,
              piece.gx,
              piece.gy,
              piece.pivot,
              piece.level,
              layerLift,
              true,
            )
      const renderLevel =
        dragId === activeId && dragFree ? dragPreviewLevel : piece.level
      const snapOnBoard = boardSnapPointFromBrickPlacement(
        placement.left,
        placement.top,
        boardW,
        piece.pivot,
        renderLevel,
        layerLift,
      )
      const peg = positionPinFromBoardSnapPoint(snapOnBoard, next)

      setPieces((prev) => {
        const topLevel = snapToTopLevel(peg.gx, peg.gy, next, prev, piece.id)
        return prev.map((p) =>
          p.id === piece.id
            ? { ...p, gx: peg.gx, gy: peg.gy, pivot: next, level: topLevel }
            : p,
        )
      })
      setDragFree(null)
      dragNativeRef.current = null
    },
    [activeId, boardW, dragFree, dragId, dragPreviewLevel, layerLift, pieces],
  )

  const toggleActivePivot = useCallback(() => {
    if (!activePiece) return
    rotateActivePiece(activePiece.pivot === 'left' ? 'right' : 'left')
  }, [activePiece, rotateActivePiece])

  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('.formation-lego__block')) return
      if (!boardRef.current || !activePiece) return
      if (hasBrickStackedAbove(activePiece, pieces)) return
      const native = clientToBoardNative(
        boardRef.current,
        e.clientX,
        e.clientY,
        boardW,
      )
      commitSnap(activePiece.id, native, activePiece.pivot)
    },
    [activePiece, boardW, commitSnap, pieces],
  )

  const onBrickPointerDown = useCallback(
    (pieceId: BrickColor) => (e: React.PointerEvent) => {
      if (!boardRef.current) return
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece || hasBrickStackedAbove(piece, pieces)) return

      e.stopPropagation()
      const wasSelected = activeId === pieceId
      selectPiece(pieceId)

      const piecePlacement = placementForPiece(piece)
      const boardRectLive = boardRef.current.getBoundingClientRect()
      const screenPlacement = screenPlacementFromBoardRect(
        { left: boardRectLive.left, top: boardRectLive.top },
        plate,
        piecePlacement,
      )
      const onRotateRing =
        wasSelected &&
        isPointerOnRotateRing(
          e.clientX,
          e.clientY,
          screenPlacement,
          piece.pivot,
        )
      if (onRotateRing) {
        toggleActivePivot()
        return
      }

      tapToSetDownRef.current = wasSelected

      const pointerNative = clientToBoardNative(
        boardRef.current,
        e.clientX,
        e.clientY,
        boardW,
      )
      const anchorNative = boardSnapPointFromBrickPlacement(
        piecePlacement.left,
        piecePlacement.top,
        boardW,
        piece.pivot,
        piece.level,
        layerLift,
      )
      grabOffsetNative.current = {
        x: pointerNative.x - anchorNative.x,
        y: pointerNative.y - anchorNative.y,
      }
      dragNativeRef.current = anchorNative
      const pointerClip = clientToClip(boardRef.current, e.clientX, e.clientY)
      dragPointerStartClip.current = {
        x: pointerClip.clipX,
        y: pointerClip.clipY,
      }
      dragFreeRef.current = null
      dragHasMovedRef.current = false
      dragPieceIdRef.current = pieceId
      dragPreviewLevelRef.current = piece.level
      setDragPreviewLevel(piece.level)
      setDragHasMoved(false)
      setDragId(pieceId)
      setDragFree(null)
      captureTargetRef.current = e.currentTarget as HTMLElement
      capturePointerIdRef.current = e.pointerId
    },
    [
      activeId,
      boardW,
      layerLift,
      pieces,
      placementForPiece,
      plate,
      selectPiece,
      toggleActivePivot,
    ],
  )

  const onPointerMoveAt = useCallback(
    (clientX: number, clientY: number, pointerId: number) => {
      if (!dragId || !boardRef.current) return
      if (
        capturePointerIdRef.current != null &&
        pointerId !== capturePointerIdRef.current
      ) {
        return
      }
      const piece = pieces.find((p) => p.id === dragId)
      if (!piece) return
      const pointer = clientToClip(boardRef.current, clientX, clientY)
      const start = dragPointerStartClip.current
      if (start) {
        const dx = pointer.clipX - start.x
        const dy = pointer.clipY - start.y
        if (
          !dragHasMoved &&
          dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX
        ) {
          return
        }
        if (!dragHasMoved) {
          dragHasMovedRef.current = true
          setDragHasMoved(true)
          const target = captureTargetRef.current
          if (
            target &&
            !target.hasPointerCapture(pointerId)
          ) {
            target.setPointerCapture(pointerId)
          }
        }
      }
      const pointerNative = clientToBoardNative(
        boardRef.current,
        clientX,
        clientY,
        boardW,
      )
      const anchorNative = {
        x: pointerNative.x - grabOffsetNative.current.x,
        y: pointerNative.y - grabOffsetNative.current.y,
      }
      const level0 = spritePlacement(
        boardW,
        placementSnapAnchor(piece.pivot),
        anchorNative,
        SELECTED_VIEWBOX,
        0,
        0,
      )
      let previewLevel = previewStackLevel(
        level0.left,
        level0.top,
        boardW,
        piece.pivot,
        0,
        pieces,
        dragId,
      )
      let { left, top } = placementFollowPointer(
        anchorNative,
        boardW,
        piece.pivot,
        previewLevel,
      )
      previewLevel = previewStackLevel(
        left,
        top,
        boardW,
        piece.pivot,
        previewLevel,
        pieces,
        dragId,
      )
      ;({ left, top } = placementFollowPointer(
        anchorNative,
        boardW,
        piece.pivot,
        previewLevel,
      ))
      dragPreviewLevelRef.current = previewLevel
      setDragPreviewLevel(previewLevel)
      dragNativeRef.current = anchorNative
      const nextFree = roundPlacementPx(left, top)
      dragFreeRef.current = nextFree
      setDragFree(nextFree)
    },
    [boardW, dragHasMoved, dragId, pieces],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      onPointerMoveAt(e.clientX, e.clientY, e.pointerId)
    },
    [onPointerMoveAt],
  )

  const finishPointer = useCallback(
    (pointerId: number) => {
      const target = captureTargetRef.current
      if (target?.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId)
      }
      capturePointerIdRef.current = null
      captureTargetRef.current = null
      endDrag()
    },
    [endDrag],
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (
        capturePointerIdRef.current != null &&
        e.pointerId !== capturePointerIdRef.current
      ) {
        return
      }
      finishPointer(e.pointerId)
    },
    [finishPointer],
  )

  useEffect(() => {
    if (dragId == null) return

    const onWinMove = (e: PointerEvent) => {
      if (dragHasMovedRef.current) {
        e.preventDefault()
      }
      onPointerMoveAt(e.clientX, e.clientY, e.pointerId)
    }

    const onWinEnd = (e: PointerEvent) => {
      if (
        capturePointerIdRef.current != null &&
        e.pointerId !== capturePointerIdRef.current
      ) {
        return
      }
      e.preventDefault()
      finishPointer(e.pointerId)
    }

    window.addEventListener('pointermove', onWinMove, { passive: false })
    window.addEventListener('pointerup', onWinEnd)
    window.addEventListener('pointercancel', onWinEnd)

    return () => {
      window.removeEventListener('pointermove', onWinMove)
      window.removeEventListener('pointerup', onWinEnd)
      window.removeEventListener('pointercancel', onWinEnd)
    }
  }, [dragId, finishPointer, onPointerMoveAt])

  const piecesWithPlacement = useMemo(() => {
    return pieces
      .map((p) => {
        const isFreeDrag = dragId === p.id && dragHasMoved
        const free = isFreeDrag ? dragFree : null
        const placement = placementForPiece(p, free)
        const isAnchored = hasBrickStackedAbove(p, pieces)
        const screenPlacement = screenPlacementFromBoardRect(
          boardRect,
          plate,
          placement,
        )
        return {
          ...p,
          placement,
          screenPlacement,
          isAnchored,
          z: depthZDuringDrag(
            p,
            isFreeDrag ? dragFree : null,
            isFreeDrag ? dragPreviewLevel : p.level,
            boardW,
          ),
        }
      })
      .sort((a, b) => a.z - b.z)
  }, [
    boardRect,
    boardW,
    dragFree,
    dragHasMoved,
    dragId,
    dragPreviewLevel,
    plate,
    pieces,
    placementForPiece,
  ])

  return {
    stageRef,
    boardRef,
    boardRect,
    boardW,
    plate,
    isPiecePickedUp,
    isDragging,
    draggingId: dragId,
    pieces: piecesWithPlacement,
    activeId,
    activePivot: activePiece?.pivot ?? 'left',
    toggleActivePivot,
    rotateActivePiece,
    selectPiece,
    onBoardPointerDown,
    onBrickPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
