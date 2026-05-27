'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  boardSnapPointFromBrickPlacement,
  brickLayerLift,
  brickPlacement,
  brickIsoZIndex,
  BRICK_VIEWBOX,
  placementSnapAnchor,
  positionPinFits,
  positionPinFromBoardSnapPoint,
  positionPinFromRaisedBrickPlacement,
  previewStackLevel,
  resolveStackedSnap,
  snappedPlacementFromNative,
  snapToTopLevel,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { spritePlacement } from '@/lib/formation/spritePlacement'
import {
  clientToBoardNative,
  clientToClip,
  plateDisplayLayout,
} from '@/lib/formation/plateViewport'

export const FORMATION_BOARD_DISPLAY_W = 720

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
    BRICK_VIEWBOX,
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

export function useFormationLegoBoard() {
  const [pieces, setPieces] = useState<FormationPiece[]>(() => {
    const initial: FormationPiece[] = [
      { id: 'cyan', color: 'cyan', gx: 2, gy: 2, pivot: 'left', level: 0 },
      { id: 'magenta', color: 'magenta', gx: 5, gy: 2, pivot: 'left', level: 0 },
      { id: 'yellow', color: 'yellow', gx: 2, gy: 6, pivot: 'left', level: 0 },
      { id: 'black', color: 'black', gx: 6, gy: 6, pivot: 'right', level: 0 },
    ]
    return initial.map((p) => clampPieceToPlate(p, FORMATION_BOARD_DISPLAY_W, initial))
  })
  const [activeId, setActiveId] = useState<BrickColor | null>('cyan')
  const [dragId, setDragId] = useState<BrickColor | null>(null)
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [dragHasMoved, setDragHasMoved] = useState(false)
  const [dragPreviewLevel, setDragPreviewLevel] = useState(0)
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

  const boardW = FORMATION_BOARD_DISPLAY_W
  const layerLift = useMemo(() => brickLayerLift(boardW), [boardW])
  const plate = useMemo(() => plateDisplayLayout(boardW), [boardW])

  const activePiece = useMemo(
    () =>
      activeId ? (pieces.find((p) => p.id === activeId) ?? null) : null,
    [activeId, pieces],
  )


  const isDragging = dragId != null && dragHasMoved

  const placementForPiece = useCallback(
    (piece: FormationPiece, free?: { left: number; top: number } | null) => {
      const snapped = brickPlacement(
        boardW,
        piece.gx,
        piece.gy,
        piece.pivot,
        piece.level,
        layerLift,
      )
      if (free && piece.id === dragId) {
        return { ...snapped, left: free.left, top: free.top }
      }
      return snapped
    },
    [boardW, dragId, layerLift],
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

    if (piece && release && moved) {
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
    setDragPreviewLevel(0)
    setDragHasMoved(false)
    setDragId(null)
    setDragFree(null)
  }, [boardW, pieces])

  const onBoardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest('.formation-lego__block')) return
      if (!boardRef.current || !activePiece) return
      const native = clientToBoardNative(
        boardRef.current,
        e.clientX,
        e.clientY,
        boardW,
      )
      commitSnap(activePiece.id, native, activePiece.pivot)
    },
    [activePiece, boardW, commitSnap],
  )

  const onBrickPointerDown = useCallback(
    (pieceId: BrickColor) => (e: React.PointerEvent) => {
      if (!boardRef.current) return
      e.stopPropagation()
      setActiveId(pieceId)
      const piece = pieces.find((p) => p.id === pieceId)
      if (!piece) return

      const piecePlacement = placementForPiece(piece)
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
      boardRef.current.setPointerCapture(e.pointerId)
    },
    [boardW, layerLift, pieces, placementForPiece],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragId || !boardRef.current) return
      const piece = pieces.find((p) => p.id === dragId)
      if (!piece) return
      const pointer = clientToClip(boardRef.current, e.clientX, e.clientY)
      const start = dragPointerStartClip.current
      if (start) {
        const dx = pointer.clipX - start.x
        const dy = pointer.clipY - start.y
        if (!dragHasMoved && dx * dx + dy * dy < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) {
          return
        }
        if (!dragHasMoved) {
          dragHasMovedRef.current = true
          setDragHasMoved(true)
        }
      }
      const pointerNative = clientToBoardNative(
        boardRef.current,
        e.clientX,
        e.clientY,
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
        BRICK_VIEWBOX,
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
      const nextFree = { left, top }
      dragFreeRef.current = nextFree
      setDragFree(nextFree)
    },
    [boardW, dragHasMoved, dragId, pieces],
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

  const rotateActivePiece = useCallback(
    (next: BrickPivot) => {
      const piece = pieces.find((p) => p.id === activeId)
      if (!piece || piece.pivot === next) return

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

  const piecesWithPlacement = useMemo(() => {
    return pieces
      .map((p) => {
        const isFreeDrag = dragId === p.id && dragHasMoved
        const free = isFreeDrag ? dragFree : null
        const placement = placementForPiece(p, free)
        return {
          ...p,
          placement,
          z: depthZDuringDrag(
            p,
            isFreeDrag ? dragFree : null,
            isFreeDrag ? dragPreviewLevel : p.level,
            boardW,
          ),
        }
      })
      .sort((a, b) => a.z - b.z)
  }, [boardW, dragFree, dragHasMoved, dragId, dragPreviewLevel, pieces, placementForPiece])

  return {
    boardRef,
    boardW,
    plate,
    brickViewBox: BRICK_VIEWBOX,
    activePivot: activePiece?.pivot ?? 'left',
    rotateActivePiece,
    toggleActivePivot,
    isDragging,
    draggingId: dragId,
    pieces: piecesWithPlacement,
    activeId,
    setActiveId,
    onBoardPointerDown,
    onBrickPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
