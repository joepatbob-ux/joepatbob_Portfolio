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
  endDrag: (pageX: number, pageY: number) => void
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

let instanceCounter = 0
function nextInstanceId(): string {
  instanceCounter += 1
  return `sticker-${Date.now()}-${instanceCounter}`
}

export function StickerProvider({ children }: { children: ReactNode }) {
  const [deck, setDeck] = useState<StickerAsset[]>(() =>
    buildOrderedDeck(new Set()),
  )
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
    originX?: number
    originY?: number
  } | null>(null)
  const deckRef = useRef(deck)
  deckRef.current = deck

  useEffect(() => {
    for (const key of LEGACY_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }
  }, [])

  const selectSticker = useCallback((instanceId: string | null) => {
    setSelectedInstanceId(instanceId)
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

  const beginDragFromPile = useCallback(
    (
      asset: StickerAsset,
      clientX: number,
      clientY: number,
      rotation = randomRotation(),
    ) => {
      if (deckRef.current[0]?.id !== asset.id) return
      setSelectedInstanceId(null)
      dragRef.current = { fromPile: true, asset, rotation }
      setActiveDrag({ asset, clientX, clientY, rotation, fromPile: true })
    },
    [],
  )

  const moveDrag = useCallback((clientX: number, clientY: number) => {
    setActiveDrag((prev) => (prev ? { ...prev, clientX, clientY } : null))
  }, [])

  const endDrag = useCallback((pageX: number, pageY: number) => {
    const drag = dragRef.current
    if (!drag) return

    const instanceId = drag.instanceId ?? nextInstanceId()
    const next: PlacedSticker = {
      instanceId,
      assetId: drag.asset.id,
      src: drag.asset.src,
      alt: drag.asset.alt,
      x: pageX,
      y: pageY,
      rotation: drag.rotation,
    }

    setPlaced((prev) => [...prev, next])
    setSelectedInstanceId(instanceId)

    if (drag.fromPile) {
      setDeck((prev) => uniqueStickerDeck(prev.filter((s) => s.id !== drag.asset.id)))
    }

    dragRef.current = null
    setActiveDrag(null)
  }, [])

  const cancelDrag = useCallback(() => {
    dragRef.current = null
    setActiveDrag(null)
  }, [])

  const value = useMemo(
    () => ({
      deck,
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
