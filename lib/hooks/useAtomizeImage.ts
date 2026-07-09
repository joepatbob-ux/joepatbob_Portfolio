'use client'

import {
  buildGlyphGrid,
  containRect,
  drawBoardFrame,
  GLYPH_GAP,
  SETTLE_STEP,
  stepToward,
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
const SETTLE_DELAY_MS = 520

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
  const glyphBlendRef = useRef(0)
  const hoveredRef = useRef(false)
  const mouseRef = useRef(OFFSCREEN_MOUSE)
  const settleRafRef = useRef<number | null>(null)
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ready, setReady] = useState(false)
  const [settled, setSettled] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<string | null>(null)

  hoveredRef.current = hovered

  const stopSettle = useCallback(() => {
    if (settleRafRef.current != null) {
      cancelAnimationFrame(settleRafRef.current)
      settleRafRef.current = null
    }
    if (settleTimerRef.current != null) {
      clearTimeout(settleTimerRef.current)
      settleTimerRef.current = null
    }
  }, [])

  const paint = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const source = sourceRef.current
    const fit = fitRef.current
    if (!root || !canvas || !source || !fit || cellsRef.current.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawBoardFrame({
      ctx,
      image: source.canvas,
      imageFit: fit,
      cells: cellsRef.current,
      mouse: mouseRef.current,
      glyphBlend: glyphBlendRef.current,
      hover: hoveredRef.current && glyphBlendRef.current > 0.98,
      glyphColor: readGlyphColor(root),
      fontFamily: readMonoFont(),
    })
  }, [])

  const runSettle = useCallback(() => {
    stopSettle()

    if (prefersReducedMotion()) {
      glyphBlendRef.current = 1
      setSettled(true)
      paint()
      return
    }

    const tick = () => {
      glyphBlendRef.current = stepToward(glyphBlendRef.current, 1, SETTLE_STEP)
      paint()

      if (glyphBlendRef.current < 0.995) {
        settleRafRef.current = requestAnimationFrame(tick)
      } else {
        glyphBlendRef.current = 1
        settleRafRef.current = null
        setSettled(true)
        paint()
      }
    }

    settleRafRef.current = requestAnimationFrame(tick)
  }, [paint, stopSettle])

  const scheduleSettle = useCallback(() => {
    stopSettle()
    glyphBlendRef.current = 0
    setSettled(false)

    if (prefersReducedMotion()) {
      glyphBlendRef.current = 1
      setSettled(true)
      paint()
      return
    }

    settleTimerRef.current = setTimeout(runSettle, SETTLE_DELAY_MS)
  }, [paint, runSettle, stopSettle])

  const layout = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const source = sourceRef.current
    if (!root || !canvas || !source) return

    const rect = root.getBoundingClientRect()
    const displayW = Math.round(rect.width)
    const displayH = Math.round(rect.height)
    if (displayW < 8 || displayH < 8) return

    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = Math.round(displayW * dpr)
    canvas.height = Math.round(displayH * dpr)

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const fit = containRect(displayW, displayH, source.width, source.height)
    fitRef.current = fit

    const sample = document.createElement('canvas')
    sample.width = displayW
    sample.height = displayH
    const sampleCtx = sample.getContext('2d')
    if (!sampleCtx) return

    sampleCtx.drawImage(source.canvas, fit.x, fit.y, fit.w, fit.h)
    const { data } = sampleCtx.getImageData(0, 0, displayW, displayH)
    cellsRef.current = buildGlyphGrid(data, displayW, displayH, GLYPH_GAP)

    paint()
    setReady(true)
    scheduleSettle()
  }, [paint, scheduleSettle])

  useEffect(() => {
    let cancelled = false
    setReady(false)
    setSettled(false)
    stopSettle()
    sourceRef.current = null
    fitRef.current = null
    glyphBlendRef.current = 0

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
      stopSettle()
      sourceRef.current = null
      fitRef.current = null
    }
  }, [src, stopSettle])

  useLayoutEffect(() => {
    if (!sourceRef.current || !aspectRatio) return
    layout()
  }, [aspectRatio, layout])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !ready) return

    const observer = new ResizeObserver(() => layout())
    observer.observe(root)
    return () => observer.disconnect()
  }, [layout, ready])

  useEffect(() => stopSettle, [stopSettle])

  const onPointerEnter = useCallback(() => {
    if (!settled || prefersReducedMotion()) return
    setHovered(true)
    paint()
  }, [paint, settled])

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (!settled) return
    const root = rootRef.current
    if (!root) return
    const rect = root.getBoundingClientRect()
    mouseRef.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    if (hoveredRef.current) paint()
  }, [paint, settled])

  const onPointerLeave = useCallback(() => {
    setHovered(false)
    mouseRef.current = OFFSCREEN_MOUSE
    paint()
  }, [paint])

  return {
    rootRef,
    canvasRef,
    ready,
    settled,
    hovered,
    aspectRatio,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  }
}
