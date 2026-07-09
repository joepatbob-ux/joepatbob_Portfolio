'use client'

import {
  buildAtomizeCells,
  drawAtomizeFrame,
  photoOpacityFromProgress,
  stepAtomizeProgress,
  type AtomizeCell,
} from '@/lib/effects/atomizeImage'
import { useCallback, useEffect, useRef, useState } from 'react'

/** Dense glyph grid — narrow columns read as board width. */
const CELL_W = 5
const CELL_H = 7

function readGlyphColor(node: HTMLElement): string {
  const glyph = getComputedStyle(node).getPropertyValue('--atomize-glyph-color').trim()
  if (glyph) return glyph
  const accent = getComputedStyle(node).getPropertyValue('--color-accent').trim()
  return accent || '#DE3E18'
}

function readFieldColor(node: HTMLElement): string {
  const field = getComputedStyle(node).getPropertyValue('--atomize-field-bg').trim()
  return field || '#0a0a0a'
}

function readMonoFont(): string {
  const root = document.documentElement
  const fromVar = getComputedStyle(root).getPropertyValue('--font-mono').trim()
  if (fromVar) return fromVar
  return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
}

export function useAtomizeImage(src: string) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const snapshotRef = useRef<HTMLCanvasElement | null>(null)
  const cellsRef = useRef<AtomizeCell[]>([])
  const progressRef = useRef(0)
  const targetRef = useRef(0)
  const hoveredRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState(0)

  hoveredRef.current = hovered

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const paint = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const snapshot = snapshotRef.current
    if (!root || !canvas || !snapshot || cellsRef.current.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawAtomizeFrame({
      ctx,
      image: snapshot,
      cells: cellsRef.current,
      progress: progressRef.current,
      glyphColor: readGlyphColor(root),
      fieldColor: readFieldColor(root),
      fontFamily: readMonoFont(),
    })
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return

    const tick = () => {
      const next = stepAtomizeProgress(progressRef.current, targetRef.current)
      progressRef.current = next
      setProgress(next)
      paint()

      const moving = Math.abs(next - targetRef.current) > 0.008
      setAnimating(moving)

      if (moving) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [paint])

  const layoutCanvas = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!root || !canvas || !image) return

    const rect = root.getBoundingClientRect()
    const displayW = Math.round(rect.width)
    const displayH = Math.round(rect.height)
    if (displayW < 8 || displayH < 8) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.width = Math.round(displayW * dpr)
    canvas.height = Math.round(displayH * dpr)
    canvas.style.width = `${displayW}px`
    canvas.style.height = `${displayH}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const offscreen = document.createElement('canvas')
    offscreen.width = displayW
    offscreen.height = displayH
    const offCtx = offscreen.getContext('2d')
    if (!offCtx) return

    offCtx.drawImage(image, 0, 0, displayW, displayH)
    snapshotRef.current = offscreen
    const { data } = offCtx.getImageData(0, 0, displayW, displayH)
    cellsRef.current = buildAtomizeCells(
      data,
      displayW,
      displayH,
      CELL_W,
      CELL_H,
    )
    if (hoveredRef.current || progressRef.current > 0.008) {
      paint()
    }
    setReady(true)
  }, [paint])

  useEffect(() => {
    const image = new Image()
    image.decoding = 'async'
    image.src = src

    image.onload = () => {
      imageRef.current = image
      layoutCanvas()
    }

    image.onerror = () => {
      imageRef.current = null
      snapshotRef.current = null
      setReady(false)
    }

    return () => {
      imageRef.current = null
      snapshotRef.current = null
    }
  }, [layoutCanvas, src])

  useEffect(() => {
    if (!ready) return
    layoutCanvas()
  }, [layoutCanvas, ready])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const observer = new ResizeObserver(() => layoutCanvas())
    observer.observe(root)
    return () => observer.disconnect()
  }, [layoutCanvas, ready])

  useEffect(() => {
    targetRef.current = hovered ? 1 : 0
    startLoop()
  }, [hovered, startLoop])

  useEffect(() => stopLoop, [stopLoop])

  const onPointerEnter = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setHovered(true)
    paint()
  }, [paint])

  const onPointerLeave = useCallback(() => {
    setHovered(false)
  }, [])

  const live = hovered || animating || progress > 0.008
  const photoOpacity = live ? photoOpacityFromProgress(progress) : 1

  return {
    rootRef,
    canvasRef,
    ready,
    live,
    progress,
    photoOpacity,
    onPointerEnter,
    onPointerLeave,
  }
}
