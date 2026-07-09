'use client'

import {
  buildAtomizeCells,
  drawAtomizeFrame,
  stepAtomizeProgress,
  type AtomizeCell,
} from '@/lib/effects/atomizeImage'
import { useCallback, useEffect, useRef, useState } from 'react'

const CELL_SIZE = 12

function readAccentColor(node: HTMLElement): string {
  const accent = getComputedStyle(node).getPropertyValue('--color-accent').trim()
  return accent || '#DE3E18'
}

function readMonoFont(node: HTMLElement): string {
  const mono = getComputedStyle(node).fontFamily
  return mono || 'ui-monospace, monospace'
}

export function useAtomizeImage(src: string) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const snapshotRef = useRef<HTMLCanvasElement | null>(null)
  const cellsRef = useRef<AtomizeCell[]>([])
  const progressRef = useRef(0)
  const targetRef = useRef(0)
  const rafRef = useRef<number | null>(null)
  const [ready, setReady] = useState(false)
  const [hovered, setHovered] = useState(false)

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
      accentColor: readAccentColor(root),
      fontFamily: readMonoFont(root),
    })
  }, [])

  const startLoop = useCallback(() => {
    if (rafRef.current != null) return

    const tick = () => {
      const next = stepAtomizeProgress(progressRef.current, targetRef.current)
      progressRef.current = next
      paint()

      if (Math.abs(next - targetRef.current) > 0.01) {
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
    cellsRef.current = buildAtomizeCells(data, displayW, displayH, CELL_SIZE)
    paint()
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
  }, [])

  const onPointerLeave = useCallback(() => {
    setHovered(false)
  }, [])

  return {
    rootRef,
    canvasRef,
    ready,
    hovered,
    onPointerEnter,
    onPointerLeave,
  }
}
