'use client'

import {
  BOARD_ASPECT,
  BOARD_GLYPH_GAP,
  buildGlyphGrid,
  containRect,
  drawWrConnectBoard,
  loadBoardImage,
  type BoardGlyph,
  type FitRect,
} from '@/lib/wrConnectBoard'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'

const OFFSCREEN = { x: -1000, y: -1000 }

function readGlyphColor(node: HTMLElement): string {
  return (
    getComputedStyle(node).getPropertyValue('--wr-connect-board-glyph').trim() ||
    getComputedStyle(node).getPropertyValue('--color-accent').trim() ||
    '#DE3E18'
  )
}

function readMonoFont(): string {
  const fromVar = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-mono')
    .trim()
  return fromVar || 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
}

export function useWrConnectBoard(src: string) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fitRef = useRef<FitRect | null>(null)
  const cellsRef = useRef<BoardGlyph[]>([])
  const hoverRef = useRef(false)
  const mouseRef = useRef(OFFSCREEN)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [hovering, setHovering] = useState(false)

  hoverRef.current = hovering

  const paint = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const image = imageRef.current
    const fit = fitRef.current
    if (!root || !canvas || !image || !fit) return false

    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    drawWrConnectBoard({
      ctx,
      image,
      imageFit: fit,
      cells: cellsRef.current,
      mouse: mouseRef.current,
      hover: hoverRef.current,
      glyphColor: readGlyphColor(root),
      fontFamily: readMonoFont(),
    })
    return true
  }, [])

  const layout = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!root || !canvas || !image) return false

    const { width, height } = root.getBoundingClientRect()
    const displayW = Math.round(width)
    const displayH = Math.round(height)
    if (displayW < 8 || displayH < 8) return false

    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = Math.round(displayW * dpr)
    canvas.height = Math.round(displayH * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    fitRef.current = containRect(displayW, displayH, image.naturalWidth, image.naturalHeight)

    const sample = document.createElement('canvas')
    sample.width = displayW
    sample.height = displayH
    const sampleCtx = sample.getContext('2d')
    if (!sampleCtx) return false

    const fit = fitRef.current
    sampleCtx.drawImage(image, fit.x, fit.y, fit.w, fit.h)
    const { data } = sampleCtx.getImageData(0, 0, displayW, displayH)
    cellsRef.current = buildGlyphGrid(data, displayW, displayH, BOARD_GLYPH_GAP)

    if (!paint()) return false
    setCanvasReady(true)
    return true
  }, [paint])

  useEffect(() => {
    let cancelled = false
    setImageLoaded(false)
    setCanvasReady(false)
    imageRef.current = null
    fitRef.current = null
    cellsRef.current = []

    void loadBoardImage(src).then((image) => {
      if (cancelled || !image) return
      imageRef.current = image
      setImageLoaded(true)
    })

    return () => {
      cancelled = true
      imageRef.current = null
      fitRef.current = null
    }
  }, [src])

  useLayoutEffect(() => {
    if (!imageLoaded || !imageRef.current) return

    let frame = 0
    let attempts = 0
    const run = () => {
      if (layout()) return
      attempts += 1
      if (attempts < 6) frame = requestAnimationFrame(run)
    }

    run()
    return () => cancelAnimationFrame(frame)
  }, [imageLoaded, layout])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !imageLoaded) return

    const observer = new ResizeObserver(() => layout())
    observer.observe(root)
    return () => observer.disconnect()
  }, [imageLoaded, layout])

  const onPointerEnter = useCallback(() => {
    if (!canvasReady || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    setHovering(true)
    paint()
  }, [canvasReady, paint])

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!canvasReady) return
      const root = rootRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      if (hoverRef.current) paint()
    },
    [canvasReady, paint],
  )

  const onPointerLeave = useCallback(() => {
    setHovering(false)
    mouseRef.current = OFFSCREEN
    paint()
  }, [paint])

  return {
    rootRef,
    canvasRef,
    canvasReady,
    hovering,
    aspectRatio: BOARD_ASPECT,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  }
}
