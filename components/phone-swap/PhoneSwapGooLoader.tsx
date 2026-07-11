import { useEffect, useRef } from 'react'
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

  return (
    <div className="phone-goo-loader" role="status" aria-live="polite" aria-busy="true">
      {hydrated ? (
        <canvas ref={canvasRef} className="phone-goo-loader__canvas" aria-hidden />
      ) : (
        <div className="phone-goo-loader__canvas" aria-hidden />
      )}
      <span className="phone-goo-loader__label">{label}</span>
    </div>
  )
}
