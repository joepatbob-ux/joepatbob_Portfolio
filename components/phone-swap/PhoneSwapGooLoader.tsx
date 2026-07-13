import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { createGooPulse, type GooPulseRecipe } from '@/lib/glyph-dust/createGooPulse'

/** Ambient breathing goo cluster — matches the interlude particle language. */
const RECIPE: GooPulseRecipe = {
  motes: 500,
  radius: 0.4,
  dotSize: 7,
  goo: 18,
  breath: 0.11,
  breathMs: 2400,
  spin: 0.8,
  errant: 0,
}

/** `?gooDebug=1` shows a live size slider (and freezes the loader — see PhoneSwap). */
export function isGooDebug(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('gooDebug') === '1'
  } catch {
    return false
  }
}

/**
 * Loader for the phone stage: a churning, breathing cluster of accent motes
 * rendered as sticky goo, echoing the interlude dust. Client-only; reduced
 * motion holds a single settled frame. Sits in place of the generic spinner
 * while the 3D chunk and phone models load.
 */
export function PhoneSwapGooLoader({ label = 'Loading phones…' }: { label?: string }) {
  const hydrated = useHydrated()
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const debug = isGooDebug()
  const [size, setSize] = useState(80) // debug-only display size (px)

  useEffect(() => {
    if (!hydrated) return
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = 360
    canvas.height = 360
    const engine = createGooPulse(canvas, RECIPE)

    if (reduced) {
      engine.renderStatic()
      return () => engine.destroy()
    }
    engine.start()
    return () => engine.destroy()
  }, [hydrated, reduced])

  // In debug, override the CSS clamp with the slider value so it can be dialed live.
  const canvasStyle: CSSProperties | undefined = debug
    ? { width: size, height: size }
    : undefined

  return (
    <div className="phone-goo-loader" role="status" aria-live="polite" aria-busy="true">
      {hydrated ? (
        <canvas
          ref={canvasRef}
          className="phone-goo-loader__canvas"
          style={canvasStyle}
          aria-hidden
        />
      ) : (
        <div className="phone-goo-loader__canvas" aria-hidden />
      )}
      <span className="phone-goo-loader__label">{label}</span>

      {debug ? (
        <div className="phone-goo-loader__debug">
          <input
            type="range"
            min={40}
            max={140}
            step={1}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
          <code>
            {size}px → width: clamp({Math.round(size * 0.72)}px, {(size / 8.2).toFixed(1)}vh,{' '}
            {size}px)
          </code>
        </div>
      ) : null}
    </div>
  )
}
