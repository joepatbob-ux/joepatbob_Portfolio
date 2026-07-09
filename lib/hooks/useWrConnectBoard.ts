'use client'

import {
  BOARD_ASPECT,
  PARTICLE_GAP,
  buildBoardParticles,
  containRect,
  drawWrConnectBoardFrame,
  isTransitionComplete,
  loadBoardImage,
  physicsStrength,
  progressFromTransition,
  resetParticles,
  stepBoardParticles,
  type BoardParticle,
  type BoardTransition,
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
const PROGRESS_DONE = 0.004

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

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useWrConnectBoard(src: string) {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const fitRef = useRef<FitRect | null>(null)
  const particlesRef = useRef<BoardParticle[]>([])
  const progressRef = useRef(0)
  const targetRef = useRef(0)
  const transitionRef = useRef<BoardTransition>({ from: 0, to: 0, startedAt: 0 })
  const hoverRef = useRef(false)
  const mouseRef = useRef(OFFSCREEN)
  const rafRef = useRef<number | null>(null)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  const [hovering, setHovering] = useState(false)
  const [animating, setAnimating] = useState(false)
  const [progress, setProgress] = useState(0)

  hoverRef.current = hovering

  const beginTransition = useCallback((to: number) => {
    targetRef.current = to
    transitionRef.current = {
      from: progressRef.current,
      to,
      startedAt: performance.now(),
    }
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const paint = useCallback(() => {
    const root = rootRef.current
    const canvas = canvasRef.current
    const image = imageRef.current
    const fit = fitRef.current
    if (!root || !canvas || !image || !fit) return false

    const ctx = canvas.getContext('2d')
    if (!ctx) return false

    drawWrConnectBoardFrame({
      ctx,
      image,
      imageFit: fit,
      particles: particlesRef.current,
      progress: progressRef.current,
      glyphColor: readGlyphColor(root),
      fontFamily: readMonoFont(),
      sampleGap: PARTICLE_GAP,
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
    particlesRef.current = buildBoardParticles(data, displayW, displayH, PARTICLE_GAP)
    resetParticles(particlesRef.current)

    if (!paint()) return false
    setCanvasReady(true)
    return true
  }, [paint])

  const runLoop = useCallback(() => {
    if (rafRef.current != null) return

    paint()

    const tick = () => {
      const now = performance.now()
      const transition = transitionRef.current
      const next = progressFromTransition(transition, now)
      progressRef.current = next
      setProgress(next)

      const physics = physicsStrength(next, hoverRef.current)
      const settle = targetRef.current === 0 ? 1 - next : 0
      const settling = stepBoardParticles(
        particlesRef.current,
        mouseRef.current,
        physics,
        settle,
      )

      paint()

      const transitionDone = isTransitionComplete(transition, now)
      const progressMoving = !transitionDone
      const stillLive =
        hoverRef.current || progressMoving || settling || next > PROGRESS_DONE

      setAnimating(progressMoving || settling)

      if (stillLive) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        resetParticles(particlesRef.current)
        paint()
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [paint])

  useEffect(() => {
    let cancelled = false
    setImageLoaded(false)
    setCanvasReady(false)
    setProgress(0)
    progressRef.current = 0
    targetRef.current = 0
    transitionRef.current = { from: 0, to: 0, startedAt: performance.now() }
    imageRef.current = null
    fitRef.current = null
    particlesRef.current = []

    void loadBoardImage(src).then((image) => {
      if (cancelled || !image) return
      imageRef.current = image
      setImageLoaded(true)
    })

    return () => {
      cancelled = true
      stopLoop()
      imageRef.current = null
      fitRef.current = null
    }
  }, [src, stopLoop])

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

    const observer = new ResizeObserver(() => {
      layout()
      paint()
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [imageLoaded, layout, paint])

  useEffect(() => () => stopLoop(), [stopLoop])

  const onPointerEnter = useCallback(() => {
    if (!canvasReady || prefersReducedMotion()) return
    hoverRef.current = true
    setHovering(true)
    beginTransition(1)
    runLoop()
  }, [canvasReady, beginTransition, runLoop])

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
      if (hoverRef.current) runLoop()
    },
    [canvasReady, runLoop],
  )

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false
    setHovering(false)
    mouseRef.current = OFFSCREEN
    beginTransition(0)
    runLoop()
  }, [beginTransition, runLoop])

  const live = hovering || animating || progress > PROGRESS_DONE

  return {
    rootRef,
    canvasRef,
    canvasReady,
    live,
    aspectRatio: BOARD_ASPECT,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  }
}
