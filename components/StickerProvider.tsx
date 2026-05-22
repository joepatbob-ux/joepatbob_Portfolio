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
import { flushScrollFrame } from '@/lib/scrollFrame'
import {
  createShuffledDeck,
  deckFromOrderedIds,
  readStoredDeckIds,
  uniqueStickerDeck,
  writeStoredDeckIds,
  type StickerAsset,
} from '@/lib/stickers'

/** Matches --z-stickers in globals.css */
export const STICKER_Z_BASE = 105

export interface PlacedSticker {
  instanceId: string
  assetId: string
  src: string
  alt: string
  /** Viewport (client) coordinates of sticker center — matches drag ghost. */
  x: number
  y: number
  rotation: number
  zIndex: number
  chapterId: string
}

export interface ActiveDrag {
  asset: StickerAsset
  clientX: number
  clientY: number
  rotation: number
  fromPile: boolean
}

interface StickerContextValue {
  deck: StickerAsset[]
  deckReady: boolean
  placed: PlacedSticker[]
  selectedInstanceId: string | null
  activeDrag: ActiveDrag | null
  beginDragFromPile: (
    asset: StickerAsset,
    clientX: number,
    clientY: number,
    rotation?: number,
  ) => void
  selectSticker: (instanceId: string | null) => void
  updatePlaced: (
    instanceId: string,
    patch: Partial<Pick<PlacedSticker, 'x' | 'y' | 'rotation'>>,
  ) => void
  moveDrag: (clientX: number, clientY: number) => void
  endDrag: () => void
  cancelDrag: () => void
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

function stackTopZ(placed: PlacedSticker[]): number {
  if (placed.length === 0) return STICKER_Z_BASE
  return Math.max(STICKER_Z_BASE, ...placed.map((s) => s.zIndex))
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
  const [deck, setDeck] = useState<StickerAsset[]>([])
  const [deckReady, setDeckReady] = useState(false)
  const [placed, setPlaced] = useState<PlacedSticker[]>([])
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null,
  )
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const dragRef = useRef<{
    instanceId?: string
    fromPile: boolean
    asset: StickerAsset
    rotation: number
  } | null>(null)
  /** Last pointer position during drag (pointerup coords can be wrong with capture). */
  const dragPointerRef = useRef({ x: 0, y: 0 })
  const activeDragRef = useRef<ActiveDrag | null>(null)
  const deckRef = useRef(deck)
  deckRef.current = deck
  const deckInitRef = useRef(false)
  const dragListenersRef = useRef<(() => void) | null>(null)

  const removeDragListeners = useCallback(() => {
    dragListenersRef.current?.()
    dragListenersRef.current = null
  }, [])

  const commitDeck = useCallback((next: StickerAsset[]) => {
    const deckNext = uniqueStickerDeck(next)
    setDeck(deckNext)
    writeStoredDeckIds(deckNext.map((s) => s.id))
  }, [])

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

    const placedIds = new Set<string>()
    const stored = readStoredDeckIds()
    const next = stored?.length
      ? deckFromOrderedIds(stored, placedIds)
      : createShuffledDeck(placedIds)

    commitDeck(next)
    setDeckReady(true)
  }, [commitDeck])

  const selectSticker = useCallback((instanceId: string | null) => {
    setSelectedInstanceId(instanceId)
    if (instanceId) {
      setPlaced((prev) =>
        withStickerOnTop(prev, instanceId, stackTopZ(prev) + 1),
      )
    }
  }, [])

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

  const endDrag = useCallback(() => {
    const drag = dragRef.current
    if (!drag) return

    removeDragListeners()

    const live = activeDragRef.current
    const x = live?.clientX ?? dragPointerRef.current.x
    const y = live?.clientY ?? dragPointerRef.current.y
    const instanceId = drag.instanceId ?? nextInstanceId()
    const pageY = y + window.scrollY
    const chapterId =
      pickActiveSlideId() ?? nearestChapterIdForDocY(pageY) ?? ''

    setPlaced((prev) => {
      const next: PlacedSticker = {
        instanceId,
        assetId: drag.asset.id,
        src: drag.asset.src,
        alt: drag.asset.alt,
        x,
        y,
        rotation: drag.rotation,
        zIndex: stackTopZ(prev) + 1,
        chapterId,
      }
      return [...prev, next]
    })
    setSelectedInstanceId(instanceId)

    if (drag.fromPile) {
      commitDeck(deckRef.current.filter((s) => s.id !== drag.asset.id))
    }

    dragRef.current = null
    activeDragRef.current = null
    setActiveDrag(null)
    requestAnimationFrame(() => flushScrollFrame())
  }, [commitDeck, removeDragListeners])

  const cancelDrag = useCallback(() => {
    removeDragListeners()
    dragRef.current = null
    activeDragRef.current = null
    setActiveDrag(null)
  }, [removeDragListeners])

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    dragPointerRef.current = { x: clientX, y: clientY }
    setActiveDrag((prev) => {
      if (!prev) return null
      const next = { ...prev, clientX, clientY }
      activeDragRef.current = next
      return next
    })
  }, [])

  const installDragListeners = useCallback(() => {
    removeDragListeners()

    const onMove = (e: PointerEvent) => {
      moveDrag(e.clientX, e.clientY)
    }

    const onUp = (e: PointerEvent) => {
      e.preventDefault()
      e.stopPropagation()
      endDrag()
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cancelDrag()
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp, true)
    window.addEventListener('pointercancel', onUp, true)
    window.addEventListener('keydown', onKey)

    dragListenersRef.current = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp, true)
      window.removeEventListener('pointercancel', onUp, true)
      window.removeEventListener('keydown', onKey)
    }
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
      dragRef.current = { fromPile: true, asset, rotation }
      const drag: ActiveDrag = {
        asset,
        clientX,
        clientY,
        rotation,
        fromPile: true,
      }
      activeDragRef.current = drag
      setActiveDrag(drag)
      installDragListeners()
    },
    [installDragListeners],
  )

  useEffect(() => () => removeDragListeners(), [removeDragListeners])

  const value = useMemo(
    () => ({
      deck,
      deckReady,
      placed,
      selectedInstanceId,
      activeDrag,
      beginDragFromPile,
      selectSticker,
      updatePlaced,
      moveDrag,
      endDrag,
      cancelDrag,
    }),
    [
      deck,
      deckReady,
      placed,
      selectedInstanceId,
      activeDrag,
      beginDragFromPile,
      selectSticker,
      updatePlaced,
      moveDrag,
      endDrag,
      cancelDrag,
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
