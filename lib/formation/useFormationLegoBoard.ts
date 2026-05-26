'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import {
  boardSnapPointFromBrickPlacement,
  brickPlacement,
  drawOrderKey,
  BRICK_VIEWBOX,
  placementSnapAnchor,
  positionPinFits,
  positionPinFromBoardSnapPoint,
  snapPositionPinFromScreen,
  snappedPlacementFromNative,
  snapToTopLevel,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { spritePlacement } from '@/lib/formation/spritePlacement'
import {
  clientToBoardNative,
  clientToClip,
  clipToBoardNative,
  fullScreenToClip,
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

/** Drag follow: anchor tracks pointer without peg snapping (snap only on release). */
function placementFollowPointer(
  native: { x: number; y: number },
  boardW: number,
  pivot: BrickPivot,
  level: number,
) {
  return spritePlacement(
    boardW,
    placementSnapAnchor(pivot),
    native,
    BRICK_VIEWBOX,
    level,
    0,
  )
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
  const [activeId, setActiveId] = useState<BrickColor>('cyan')
  const [dragId, setDragId] = useState<BrickColor | null>(null)
  const [dragFree, setDragFree] = useState<{ left: number; top: number } | null>(
    null,
  )
  const [dragHasMoved, setDragHasMoved] = useState(false)
  const boardRef = useRef<HTMLDivElement>(null)
  const grabOffsetClip = useRef({ x: 0, y: 0 })
  const dragNativeRef = useRef<{ x: number; y: number } | null>(null)
  const dragPointerStartClip = useRef<{ x: number; y: number } | null>(null)

  const boardW = FORMATION_BOARD_DISPLAY_W
  const plate = useMemo(() => plateDisplayLayout(boardW), [boardW])

  const activePiece = useMemo(
    () => pieces.find((p) => p.id === activeId) ?? pieces[0],
    [activeId, pieces],
  )

  const draggingPiece = useMemo(
    () => (dragId ? pieces.find((p) => p.id === dragId) : null),
    [dragId, pieces],
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
        0,
      )
      if (free && piece.id === dragId) {
        return { ...snapped, left: free.left, top: free.top }
      }
      return snapped
    },
    [boardW, dragId],
  )

  const activePlacement = useMemo(() => {
    if (!activePiece) return brickPlacement(boardW, 0, 0, 'left', 0, 0)
    return placementForPiece(activePiece, dragId === activeId ? dragFree : null)
  }, [activePiece, boardW, dragFree, dragId, placementForPiece])

  const commitSnap = useCallback(
    (
      pieceId: BrickColor,
      native: { x: number; y: number },
      piecePivot: BrickPivot,
      pieceLevel: number,
    ) => {
      const snap = snappedPlacementFromNative(
        native.x,
        native.y,
        boardW,
        piecePivot,
        pieceLevel,
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
    const piece = draggingPiece
    const release = dragFree
    if (piece && release && dragHasMoved) {
      setPieces((prev) => {
        const peg = snapPositionPinFromScreen(
          release.left,
          release.top,
          boardW,
          piece.pivot,
          { gx: piece.gx, gy: piece.gy },
        )
        const topLevel = snapToTopLevel(
          peg.gx,
          peg.gy,
          piece.pivot,
          prev,
          piece.id,
        )
        return prev.map((p) =>
          p.id === piece.id
            ? { ...p, gx: peg.gx, gy: peg.gy, level: topLevel }
            : p,
        )
      })
    }
    dragNativeRef.current = null
    dragPointerStartClip.current = null
    setDragHasMoved(false)
    setDragId(null)
    setDragFree(null)
  }, [boardW, dragFree, dragHasMoved, draggingPiece])

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
      commitSnap(activePiece.id, native, activePiece.pivot, activePiece.level)
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
      const { clipX, clipY } = fullScreenToClip(
        piecePlacement.left,
        piecePlacement.top,
        plate,
      )
      const pointer = clientToClip(boardRef.current, e.clientX, e.clientY)
      grabOffsetClip.current = {
        x: pointer.clipX - clipX,
        y: pointer.clipY - clipY,
      }
      dragNativeRef.current = clipToBoardNative(clipX, clipY, boardW)
      dragPointerStartClip.current = { x: pointer.clipX, y: pointer.clipY }
      setDragHasMoved(false)
      setDragId(pieceId)
      setDragFree(null)
      boardRef.current.setPointerCapture(e.pointerId)
    },
    [boardW, pieces, placementForPiece, plate],
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
        if (!dragHasMoved) setDragHasMoved(true)
      }
      const native = clipToBoardNative(
        pointer.clipX - grabOffsetClip.current.x,
        pointer.clipY - grabOffsetClip.current.y,
        boardW,
      )
      const { left, top } = placementFollowPointer(
        native,
        boardW,
        piece.pivot,
        piece.level,
      )
      dragNativeRef.current = native
      setDragFree({ left, top })
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
              0,
            )
      const snapOnBoard = boardSnapPointFromBrickPlacement(
        placement.left,
        placement.top,
        boardW,
        piece.pivot,
      )
      const peg = positionPinFromBoardSnapPoint(snapOnBoard, next)

      setPieces((prev) => {
        const topLevel = snapToTopLevel(peg.gx, peg.gy, next, prev, activeId)
        return prev.map((p) =>
          p.id === activeId
            ? { ...p, gx: peg.gx, gy: peg.gy, pivot: next, level: topLevel }
            : p,
        )
      })
      setDragFree(null)
      dragNativeRef.current = null
    },
    [activeId, boardW, dragFree, dragId, pieces],
  )

  const toggleActivePivot = useCallback(() => {
    if (!activePiece) return
    rotateActivePiece(activePiece.pivot === 'left' ? 'right' : 'left')
  }, [activePiece, rotateActivePiece])

  const piecesWithPlacement = useMemo(() => {
    return pieces
      .map((p) => {
        const placement = placementForPiece(
          p,
          dragId === p.id ? dragFree : null,
        )
        return {
          ...p,
          placement,
          z: drawOrderKey(p.gx, p.gy, p.level, p.pivot),
        }
      })
      .sort((a, b) => a.z - b.z)
  }, [dragFree, dragId, pieces, placementForPiece])

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
    activePositionPin: { gx: activePiece?.gx ?? 0, gy: activePiece?.gy ?? 0 },
    brickPlace: activePlacement,
    onBoardPointerDown,
    onBrickPointerDown,
    onPointerMove,
    onPointerUp,
  }
}
