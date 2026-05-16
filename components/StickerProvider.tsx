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
  buildOrderedDeck,
  uniqueStickerDeck,
  type StickerAsset,
} from '@/lib/stickers'

export interface PlacedSticker {
  instanceId: string
  assetId: string
  src: string
  alt: string
  x: number
  y: number
  rotation: number
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
  placed: PlacedSticker[]
  activeDrag: ActiveDrag | null
  beginDragFromPile: (
    asset: StickerAsset,
    clientX: number,
    clientY: number,
    rotation?: number,
  ) => void
  beginDragPlaced: (instanceId: string, clientX: number, clientY: number) => void
  moveDrag: (clientX: number, clientY: number) => void
  endDrag: (pageX: number, pageY: number) => void
  cancelDrag: () => void
}

const StickerContext = createContext<StickerContextValue | null>(null)

const STORAGE_KEY = 'joepatbob-stickers-v4'

interface PersistedState {
  deckIds: string[]
  placed: PlacedSticker[]
}

function loadPersisted(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersistedState
  } catch {
    return null
  }
}

function randomRotation(): number {
  return Math.round((Math.random() * 30 - 15) * 10) / 10
}

let instanceCounter = 0
function nextInstanceId(): string {
  instanceCounter += 1
  return `sticker-${Date.now()}-${instanceCounter}`
}

export function StickerProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<StickerAsset[]>([])
  const [placed, setPlaced] = useState<PlacedSticker[]>([])
  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null)
  const dragRef = useRef<{
    instanceId?: string
    fromPile: boolean
    asset: StickerAsset
    rotation: number
    originX?: number
    originY?: number
  } | null>(null)
  const hydrated = useRef(false)
  const deckRef = useRef(deck)
  deckRef.current = deck

  useEffect(() => {
    const saved = loadPersisted()
    const placedStickers = saved?.placed ?? []
    setPlaced(placedStickers)

    const placedIds = new Set(placedStickers.map((p) => p.assetId))
    setDeck(buildOrderedDeck(placedIds, saved?.deckIds))

    hydrated.current = true
  }, [])

  useEffect(() => {
    if (!hydrated.current) return
    const payload: PersistedState = {
      deckIds: deck.map((s) => s.id),
      placed,
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }, [deck, placed])

  const beginDragFromPile = useCallback(
    (
      asset: StickerAsset,
      clientX: number,
      clientY: number,
      rotation = randomRotation(),
    ) => {
      if (deckRef.current[0]?.id !== asset.id) return
      dragRef.current = { fromPile: true, asset, rotation }
      setActiveDrag({ asset, clientX, clientY, rotation, fromPile: true })
    },
    [],
  )

  const beginDragPlaced = useCallback(
    (instanceId: string, clientX: number, clientY: number) => {
      const sticker = placed.find((p) => p.instanceId === instanceId)
      if (!sticker) return
      const asset: StickerAsset = {
        id: sticker.assetId,
        src: sticker.src,
        alt: sticker.alt,
      }
      dragRef.current = {
        instanceId,
        fromPile: false,
        asset,
        rotation: sticker.rotation,
        originX: sticker.x,
        originY: sticker.y,
      }
      setPlaced((prev) => prev.filter((p) => p.instanceId !== instanceId))
      setActiveDrag({
        asset,
        clientX,
        clientY,
        rotation: sticker.rotation,
        fromPile: false,
      })
    },
    [placed],
  )

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    setActiveDrag((prev) => (prev ? { ...prev, clientX, clientY } : null))
  }, [])

  const endDrag = useCallback((pageX: number, pageY: number) => {
    const drag = dragRef.current
    if (!drag) return

    const next: PlacedSticker = {
      instanceId: drag.instanceId ?? nextInstanceId(),
      assetId: drag.asset.id,
      src: drag.asset.src,
      alt: drag.asset.alt,
      x: pageX,
      y: pageY,
      rotation: drag.rotation,
    }

    setPlaced((prev) => [...prev, next])

    if (drag.fromPile) {
      setDeck((prev) => uniqueStickerDeck(prev.filter((s) => s.id !== drag.asset.id)))
    }

    dragRef.current = null
    setActiveDrag(null)
  }, [])

  const cancelDrag = useCallback(() => {
    const drag = dragRef.current
    if (!drag) return

    if (!drag.fromPile && drag.instanceId) {
      const { instanceId } = drag
      setPlaced((prev) => [
        ...prev,
        {
          instanceId,
          assetId: drag.asset.id,
          src: drag.asset.src,
          alt: drag.asset.alt,
          x: drag.originX ?? 0,
          y: drag.originY ?? 0,
          rotation: drag.rotation,
        },
      ])
    }

    dragRef.current = null
    setActiveDrag(null)
  }, [])

  const value = useMemo(
    () => ({
      deck,
      placed,
      activeDrag,
      beginDragFromPile,
      beginDragPlaced,
      moveDrag,
      endDrag,
      cancelDrag,
    }),
    [
      deck,
      placed,
      activeDrag,
      beginDragFromPile,
      beginDragPlaced,
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
