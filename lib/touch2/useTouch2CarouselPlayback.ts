'use client'

import { useCallback, useEffect, useRef, useState, type FocusEvent } from 'react'

export const TOUCH2_AUTO_PLAY_MS = 6200

export type Touch2CarouselPauseHandlers = {
  onPointerEnter: () => void
  onPointerLeave: () => void
  onFocusCapture: () => void
  onBlurCapture: (e: FocusEvent) => void
}

/** Shared autoplay, dot progress, pause-on-hover, and arrow-key cycling for Touch2-style carousels. */
export function useTouch2CarouselPlayback(
  count: number,
  options?: {
    autoPlay?: boolean
    autoPlayInterval?: number
    isActive?: boolean
  },
) {
  const autoPlay = options?.autoPlay ?? true
  const autoPlayInterval = options?.autoPlayInterval ?? TOUCH2_AUTO_PLAY_MS
  const isActive = options?.isActive ?? true

  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [playbackEpoch, setPlaybackEpoch] = useState(0)
  const rafRef = useRef(0)
  const elapsedRef = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])

  const go = useCallback(
    (delta: number) => {
      if (count <= 0) return
      elapsedRef.current = 0
      setIndex((i) => (i + delta + count) % count)
      setProgress(0)
    },
    [count],
  )

  const selectIndex = useCallback((i: number) => {
    elapsedRef.current = 0
    setIndex(i)
    setProgress(0)
  }, [])

  const resetTimer = useCallback(() => {
    elapsedRef.current = 0
    setProgress(0)
    setPlaybackEpoch((epoch) => epoch + 1)
  }, [])

  const shouldAutoPlay =
    autoPlay && isActive && !paused && !reducedMotion && count > 1

  useEffect(() => {
    if (!shouldAutoPlay) return

    const started = performance.now() - elapsedRef.current

    const tick = (now: number) => {
      const elapsed = now - started
      elapsedRef.current = elapsed
      const p = Math.min(1, elapsed / autoPlayInterval)
      setProgress(p)
      if (p >= 1) {
        elapsedRef.current = 0
        setIndex((i) => (i + 1) % count)
        setProgress(0)
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [shouldAutoPlay, index, count, autoPlayInterval, playbackEpoch])

  useEffect(() => {
    if (!isActive || count <= 1) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isActive, count, go])

  const showProgressBar = autoPlay && isActive && !reducedMotion && count > 1
  const indicatorProgress = showProgressBar ? progress : 0

  const pauseHandlers: Touch2CarouselPauseHandlers = {
    onPointerEnter: () => setPaused(true),
    onPointerLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
        setPaused(false)
      }
    },
  }

  return {
    index,
    selectIndex,
    resetTimer,
    go,
    reducedMotion,
    indicatorProgress,
    pauseHandlers,
  }
}
