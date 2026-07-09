'use client'

import {
  buildGlyphGrid,
  containRect,
  drawBoardFrame,
  GLYPH_GAP,
  type ContainRect,
  type GlyphCell,
} from '@/lib/effects/atomizeImage'
import { loadRasterSource, type RasterSource } from '@/lib/effects/loadRasterSource'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react'

const OFFSCREEN_MOUSE = { x: -1000, y: -1000 }

function readGlyphColor(node: HTMLElement): string {
  return (
    getComputedStyle(node).getPropertyValue('--atomize-glyph-color').trim() ||
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

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useAtomizeImage(src: string) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sourceRef = useRef<RasterSource | null>(null)
  const fitRef = useRef<ContainRect | null>(null)
  const cellsRef = useRef<GlyphCell[]>([])
  const hoveredRef = useRef(false)
  const mouseRef = useRef(OFFSCREEN_MOUSE)
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string | null>(null)

  hoveredRef.current = hovered

  const paint = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const source = sourceRef.current
    const fit = fitRef.current
    if (!root || !canvas || !source || !fit) return false

    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    drawBoardFrame({
      ctx,
      image: source.canvas,
      imageFit: fit,
      cells: cellsRef.current,
      mouse: mouseRef.current,
      hover: hoveredRef.current,
      glyphColor: readGlyphColor(root),
      fontFamily: readMonoFont(),
    })
    return true
  }, [])

  const layout = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const source = sourceRef.current
    if (!root || !canvas || !source) return false

    const rect = root.getBoundingClientRect()
    const displayW = Math.round(rect.width)
    const displayH = Math.round(rect.height)
    if (displayW < 8 || displayH < 8) return false

    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = Math.round(displayW * dpr)
    canvas.height = Math.round(displayH * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const fit = containRect(displayW, displayH, source.width, source.height)
    fitRef.current = fit

    const sample = document.createElement('canvas')
    sample.width = displayW
    sample.height = displayH
    const sampleCtx = sample.getContext('2d')
    if (!sampleCtx) return false

    sampleCtx.drawImage(source.canvas, fit.x, fit.y, fit.w, fit.h)
    const { data } = sampleCtx.getImageData(0, 0, displayW, displayH)
    cellsRef.current = buildGlyphGrid(data, displayW, displayH, GLYPH_GAP)

    if (!paint()) return false
    setReady(true)
    return true
  }, [paint])

  const tryLayout = useCallback(() => {
    layout()
  }, [layout])

  useEffect(() => {
    let cancelled = false
    setReady(false)
    sourceRef.current = null
    fitRef.current = null

    void loadRasterSource(src).then((source) => {
      if (cancelled) return
      if (!source) {
        sourceRef.current = null
        setAspectRatio(null)
        return
      }
      sourceRef.current = source
      setAspectRatio(`${source.width} / ${source.height}`)
    })

    return () => {
      cancelled = true
      sourceRef.current = null
      fitRef.current = null
    }
  }, [src])

  useLayoutEffect(() => {
    if (!sourceRef.current || !aspectRatio) return

    let frame = 0
    let attempts = 0
    const run = () => {
      if (layout()) return
      attempts += 1
      if (attempts < 6) frame = requestAnimationFrame(run)
    }

    run()
    return () => cancelAnimationFrame(frame)
  }, [aspectRatio, layout])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !aspectRatio) return

    const observer = new ResizeObserver(() => tryLayout())
    observer.observe(root)
    return () => observer.disconnect()
  }, [aspectRatio, tryLayout])

  const onPointerEnter = useCallback(() => {
    if (!ready || prefersReducedMotion()) return
    setHovered(true)
    paint()
  }, [paint, ready])

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!ready) return
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    if (hoveredRef.current) paint()
  }, [paint, ready])

  const onPointerLeave = useCallback(() => {
    setHovered(false)
    mouseRef.current = OFFSCREEN_MOUSE
    paint()
  }, [paint])

  return {
    rootRef,
    canvasRef,
    ready,
    hovered,
    aspectRatio,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  }
}
