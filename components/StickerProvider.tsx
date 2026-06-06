'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  nearestChapterIdForDocY,
  pickActiveSlideId,
} from '@/lib/chapterSlideshow'
import { installStickerDragListeners } from '@/lib/stickerDrag'
import { flushScrollFrame } from '@/lib/scrollFrame'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import {
  stickerZIndices,
  type StickerZIndices,
} from '@/lib/layout/stacking'
import {
  STICKER_ASSETS,
  createShuffledDeck,
  deckFromOrderedIds,
  readStoredDeckIds,
  uniqueStickerDeck,
  writeStoredDeckIds,
  stickerHeights,
  type StickerAsset,
  type StickerHeights,
} from '@/lib/stickers'

/** Desktop defaults — on phone use `useStickers().zIndices` (matches globals.css). */
export const STICKER_Z_BASE = 116
export const STICKER_Z_PILE = STICKER_Z_BASE - 1
export const STICKER_Z_DRAG = STICKER_Z_BASE + 104

export interface PlacedSticker {
  instanceId: string
  assetId: string
  src: string
  alt: string
  /** Viewport center (client coordinates). */
  x: number
  y: number
  rotation: number
  zIndex: number
  chapterId: string
}

export type ActiveDrag =
  | {
      kind: 'pile'
      asset: StickerAsset
      clientX: number
      clientY: number
      rotation: number
    }
  | {
      kind: 'placed'
      instanceId: string
      asset: StickerAsset
      clientX: number
      clientY: number
      rotation: number
      grabOffsetX: number
      grabOffsetY: number
    }

interface StickerContextValue {
  zIndices: StickerZIndices
  stickerHeights: StickerHeights
  deck: StickerAsset[]
  deckReady: boolean
  placed: PlacedSticker[]
  selectedInstanceId: string | null
  activeDrag: ActiveDrag | null
  draggingInstanceId: string | null
  beginDragFromPile: (
    asset: StickerAsset,
    clientX: number,
    clientY: number,
    rotation?: number,
  ) => void
  beginDragPlaced: (instanceId: string, clientX: number, clientY: number) => void
  selectSticker: (instanceId: string | null) => void
  updatePlaced: (
    instanceId: string,
    patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'rotation'>>,
  ) => void
  removePlaced: (instanceId: string) => void
  returnAssetToDeck: (assetId: string) => void
}

const StickerContext = createContext<StickerContextValue | null>(null)

const LEGACY_STORAGE_KEYS = [
  'joepatbob-stickers-v1',
  'joepatbob-stickers-v2',
  'joepatbob-stickers-v3',
  'joepatbob-stickers-v4',
]

function randomRotation(): number {
  return Math.round((Math.random() * 30 - 15) * 10) / 10
}

function stackTopZ(placed: PlacedSticker[], base: number): number {
  if (placed.length === 0) return base
  return Math.max(base, ...placed.map((s) => s.zIndex))
}

function withStickerOnTop(
  placed: PlacedSticker[],
  instanceId: string,
  zIndex: number,
): PlacedSticker[] {
  return placed.map((s) =>
    s.instanceId === instanceId ? { ...s, zIndex } : s,
  )
}

let instanceCounter = 0
function nextInstanceId(): string {
  instanceCounter += 1
  return `sticker-${Date.now()}-${instanceCounter}`
}

export function StickerProvider({ children }: { children: ReactNode }) {
  const layoutMobile = useLayoutMobile()
  const zIndices = stickerZIndices(layoutMobile)
  const heights = useMemo(() => stickerHeights(layoutMobile), [layoutMobile])
  const zBaseRef = useRef(zIndices.base)
  zBaseRef.current = zIndices.base

  const [deck, setDeck] = useState<StickerAsset[]>([])
  const [deckReady, setDeckReady] = useState(false)
  const [placed, setPlaced] = useState<PlacedSticker[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null,
  )
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const [draggingInstanceId, setDraggingInstanceId] = useState<string | null>(
    null,
  )

  const deckRef = useRef(deck)
  deckRef.current = deck
  const placedRef = useRef(placed)
  placedRef.current = placed
  const activeDragRef = useRef<ActiveDrag | null>(null)
  const dragPointerRef = useRef({ x: 0, y: 0 })
  const dragListenersRef = useRef<(() => void) | null>(null)
  const deckInitRef = useRef(false)

  const removeDragListeners = useCallback(() => {
    dragListenersRef.current?.()
    dragListenersRef.current = null
  }, [])

  const commitDeck = useCallback((next: StickerAsset[]) => {
    const deckNext = uniqueStickerDeck(next)
    setDeck(deckNext)
    writeStoredDeckIds(deckNext.map((s) => s.id))
  }, [])

  const returnAssetToDeck = useCallback(
    (assetId: string) => {
      const asset = STICKER_ASSETS.find((a) => a.id === assetId)
      if (!asset) return
      const ids = new Set(deckRef.current.map((s) => s.id))
      if (ids.has(assetId)) return
      commitDeck([asset, ...deckRef.current])
    },
    [commitDeck],
  )

  useEffect(() => {
    for (const key of LEGACY_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }
  }, [])

  useEffect(() => {
    if (deckInitRef.current) return
    deckInitRef.current = true

    const placedIds = new Set(placedRef.current.map((s) => s.assetId))
    const stored = readStoredDeckIds()
    const next = stored?.length
      ? deckFromOrderedIds(stored, placedIds)
      : createShuffledDeck(placedIds)

    commitDeck(next)
    setDeckReady(true)
  }, [commitDeck])

  const selectSticker = useCallback(
    (instanceId: string | null) => {
      setSelectedInstanceId(instanceId)
      if (instanceId) {
        setPlaced((prev) => {
          const selectedZ = Math.max(
            stackTopZ(prev, zBaseRef.current) + 1,
            zIndices.selected,
          )
          return withStickerOnTop(prev, instanceId, selectedZ)
        })
      }
    },
    [zIndices.selected],
  )

  const updatePlaced = useCallback(
    (
      instanceId: string,
      patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'rotation'>>,
    ) => {
      setPlaced((prev) =>
        prev.map((s) =>
          s.instanceId === instanceId ? { ...s, ...patch } : s,
        ),
      )
    },
    [],
  )

  const removePlaced = useCallback(
    (instanceId: string) => {
      const removed = placedRef.current.find((s) => s.instanceId === instanceId)
      setPlaced((prev) => prev.filter((s) => s.instanceId !== instanceId))
      setSelectedInstanceId((prev) => (prev === instanceId ? null : prev))
      if (removed) returnAssetToDeck(removed.assetId)
    },
    [returnAssetToDeck],
  )

  const placeSticker = useCallback(
    (
      asset: StickerAsset,
      x: number,
      y: number,
      rotation: number,
      chapterId: string,
    ) => {
      const instanceId = nextInstanceId()
      setPlaced((prev) => {
        const next: PlacedSticker = {
          instanceId,
          assetId: asset.id,
          src: asset.src,
          alt: asset.alt,
          x,
          y,
          rotation,
          zIndex: stackTopZ(prev, zBaseRef.current) + 1,
          chapterId,
        }
        return [...prev, next]
      })
      setSelectedInstanceId(instanceId)
      return instanceId
    },
    [],
  )

  const endDrag = useCallback(() => {
    const drag = activeDragRef.current
    if (!drag) return

    removeDragListeners()

    const clientX = dragPointerRef.current.x
    const clientY = dragPointerRef.current.y
    const pageY = clientY + window.scrollY
    const chapterId =
      pickActiveSlideId() ?? nearestChapterIdForDocY(pageY) ?? ''

    if (drag.kind === 'pile') {
      placeSticker(drag.asset, clientX, clientY, drag.rotation, chapterId)
      commitDeck(deckRef.current.filter((s) => s.id !== drag.asset.id))
    } else {
      updatePlaced(drag.instanceId, {
        x: clientX - drag.grabOffsetX,
        y: clientY - drag.grabOffsetY,
      })
      setSelectedInstanceId(drag.instanceId)
    }

    setDraggingInstanceId(null)
    activeDragRef.current = null
    setActiveDrag(null)
    requestAnimationFrame(() => flushScrollFrame())
  }, [commitDeck, placeSticker, removeDragListeners, updatePlaced])

  const cancelDrag = useCallback(() => {
    removeDragListeners()
    setDraggingInstanceId(null)
    activeDragRef.current = null
    setActiveDrag(null)
  }, [removeDragListeners])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    dragPointerRef.current = { x: clientX, y: clientY }
    setActiveDrag((prev) => {
      if (!prev) return null
      const next = { ...prev, clientX, clientY } as ActiveDrag
      activeDragRef.current = next
      return next
    })
  }, [])

  const installDragListeners = useCallback(() => {
    removeDragListeners()
    dragListenersRef.current = installStickerDragListeners({
      onMove: moveDrag,
      onEnd: endDrag,
      onCancel: cancelDrag,
    })
  }, [moveDrag, endDrag, cancelDrag, removeDragListeners])

  const beginDragFromPile = useCallback(
    (
      asset: StickerAsset,
      clientX: number,
      clientY: number,
      rotation = randomRotation(),
    ) => {
      if (deckRef.current[0]?.id !== asset.id) return
      setSelectedInstanceId(null)
      dragPointerRef.current = { x: clientX, y: clientY }
      const drag: ActiveDrag = {
        kind: 'pile',
        asset,
        clientX,
        clientY,
        rotation,
      }
      activeDragRef.current = drag
      setActiveDrag(drag)
      installDragListeners()
    },
    [installDragListeners],
  )

  const beginDragPlaced = useCallback(
    (instanceId: string, clientX: number, clientY: number) => {
      if (activeDragRef.current) return
      const sticker = placedRef.current.find((s) => s.instanceId === instanceId)
      if (!sticker) return

      const asset: StickerAsset = {
        id: sticker.assetId,
        src: sticker.src,
        alt: sticker.alt,
      }

      selectSticker(instanceId)
      dragPointerRef.current = { x: clientX, y: clientY }

      const drag: ActiveDrag = {
        kind: 'placed',
        instanceId,
        asset,
        clientX,
        clientY,
        rotation: sticker.rotation,
        grabOffsetX: clientX - sticker.x,
        grabOffsetY: clientY - sticker.y,
      }
      activeDragRef.current = drag
      setActiveDrag(drag)
      setDraggingInstanceId(instanceId)
      installDragListeners()
    },
    [installDragListeners, selectSticker],
  )

  useEffect(() => () => removeDragListeners(), [removeDragListeners])

  const value = useMemo(
    () => ({
      zIndices,
      stickerHeights: heights,
      deck,
      deckReady,
      placed,
      selectedInstanceId,
      activeDrag,
      draggingInstanceId,
      beginDragFromPile,
      beginDragPlaced,
      selectSticker,
      updatePlaced,
      removePlaced,
      returnAssetToDeck,
    }),
    [
      zIndices,
      heights,
      deck,
      deckReady,
      placed,
      selectedInstanceId,
      activeDrag,
      draggingInstanceId,
      beginDragFromPile,
      beginDragPlaced,
      selectSticker,
      updatePlaced,
      removePlaced,
      returnAssetToDeck,
    ],
  )

  return (
    <StickerContext.Provider value={value}>{children}</StickerContext.Provider>
  )
}

export function useStickers(): StickerContextValue {
  const ctx = useContext(StickerContext)
  if (!ctx) {
    throw new Error('useStickers must be used within StickerProvider')
  }
  return ctx
}
