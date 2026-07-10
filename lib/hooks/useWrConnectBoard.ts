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
const FALLBACK_GLYPH = '#DE3E18'
const FALLBACK_MONO =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'

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
  // Style + geometry caches — the paint loop must not call getComputedStyle or
  // trigger layout per frame.
  const styleRef = useRef<{ glyph: string; font: string } | null>(null)
  const sizeRef = useRef<{ w: number; h: number } | null>(null)
  const canvasReadyRef = useRef(false)

  const [imageLoaded, setImageLoaded] = useState(false)
  const [canvasReady, setCanvasReady] = useState(false)
  // Single boundary-driven flag — flips at interaction start and settle end,
  // never per animation frame (a per-frame setState re-rendered the stage
  // throughout every dissolve).
  const [live, setLive] = useState(false)

  const markCanvasReady = useCallback((ready: boolean) => {
    if (canvasReadyRef.current === ready) return
    canvasReadyRef.current = ready
    setCanvasReady(ready)
  }, [])

  /** Refreshed at layout and interaction boundaries — covers theme switches. */
  const readStyles = useCallback(() => {
    const root = rootRef.current
    if (!root) return
    const rootStyle = getComputedStyle(root)
    const glyph =
      rootStyle.getPropertyValue('--wr-connect-board-glyph').trim() ||
      rootStyle.getPropertyValue('--color-accent').trim() ||
      FALLBACK_GLYPH
    const font =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--font-mono')
        .trim() || FALLBACK_MONO
    styleRef.current = { glyph, font }
  }, [])

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

    const style = styleRef.current ?? { glyph: FALLBACK_GLYPH, font: FALLBACK_MONO }
    drawWrConnectBoardFrame({
      ctx,
      image,
      imageFit: fit,
      particles: particlesRef.current,
      progress: progressRef.current,
      glyphColor: style.glyph,
      fontFamily: style.font,
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

    // Sample + rebuild particles BEFORE touching the visible canvas: setting
    // canvas.width erases the bitmap, and any failure after that left a blank
    // canvas covering a hidden photo (the recurring "board not appearing").
    const fit = containRect(displayW, displayH, image.naturalWidth, image.naturalHeight)
    const sample = document.createElement('canvas')
    sample.width = displayW
    sample.height = displayH
    const sampleCtx = sample.getContext('2d')
    if (!sampleCtx) return false

    sampleCtx.drawImage(image, fit.x, fit.y, fit.w, fit.h)
    const { data } = sampleCtx.getImageData(0, 0, displayW, displayH)
    const particles = buildBoardParticles(data, displayW, displayH, PARTICLE_GAP)

    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = Math.round(displayW * dpr)
    canvas.height = Math.round(displayH * dpr)
    const ctx = canvas.getContext('2d')
    if (!ctx) return false
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    fitRef.current = fit
    particlesRef.current = particles
    resetParticles(particlesRef.current)
    sizeRef.current = { w: displayW, h: displayH }
    readStyles()

    if (!paint()) return false
    markCanvasReady(true)
    return true
  }, [paint, readStyles, markCanvasReady])

  const runLoop = useCallback(() => {
    if (rafRef.current != null) return

    paint()

    const tick = () => {
      const now = performance.now()
      const transition = transitionRef.current
      const next = progressFromTransition(transition, now)
      progressRef.current = next

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

      if (stillLive) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        rafRef.current = null
        resetParticles(particlesRef.current)
        paint()
        setLive(false)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [paint])

  useEffect(() => {
    let cancelled = false
    setImageLoaded(false)
    markCanvasReady(false)
    setLive(false)
    progressRef.current = 0
    targetRef.current = 0
    transitionRef.current = { from: 0, to: 0, startedAt: performance.now() }
    imageRef.current = null
    fitRef.current = null
    particlesRef.current = []
    sizeRef.current = null

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
  }, [src, stopLoop, markCanvasReady])

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
      // ResizeObserver fires once on observe — skip the resample when the
      // size hasn't actually changed and the canvas is already good.
      const rect = root.getBoundingClientRect()
      const size = sizeRef.current
      if (
        size &&
        canvasReadyRef.current &&
        Math.round(rect.width) === size.w &&
        Math.round(rect.height) === size.h
      ) {
        return
      }
      if (!layout()) {
        // Never leave a blank canvas covering the photo — fall back to the
        // <img> until a later resize lays out successfully.
        markCanvasReady(false)
      }
    })
    observer.observe(root)
    return () => observer.disconnect()
  }, [imageLoaded, layout, markCanvasReady])

  useEffect(() => () => stopLoop(), [stopLoop])

  // Touch: while the dissolve is active the drag drives particles, so the
  // page must not pan underneath. touch-action is locked in at gesture start
  // (pointerenter has already begun the effect by then), so this has to be a
  // non-passive touchmove preventDefault. hoverRef is only true when the
  // effect actually runs (canvas ready, motion allowed) — idle touches still
  // scroll the page normally.
  useEffect(() => {
    const root = rootRef.current
    if (!root || !imageLoaded) return

    const onTouchMove = (event: TouchEvent) => {
      if (hoverRef.current) event.preventDefault()
    }
    root.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => root.removeEventListener('touchmove', onTouchMove)
  }, [imageLoaded])

  const onPointerEnter = useCallback(() => {
    if (!canvasReadyRef.current || prefersReducedMotion()) return
    hoverRef.current = true
    readStyles()
    setLive(true)
    beginTransition(1)
    runLoop()
  }, [readStyles, beginTransition, runLoop])

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!canvasReadyRef.current) return
      const root = rootRef.current
      if (!root) return
      const rect = root.getBoundingClientRect()
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      }
      if (hoverRef.current) runLoop()
    },
    [runLoop],
  )

  const onPointerLeave = useCallback(() => {
    hoverRef.current = false
    mouseRef.current = OFFSCREEN
    beginTransition(0)
    runLoop()
  }, [beginTransition, runLoop])

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
