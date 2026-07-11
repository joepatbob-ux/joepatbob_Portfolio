import { useEffect, useRef } from 'react'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { createGlyphDust, type GlyphDustRecipe } from '@/lib/glyph-dust/createGlyphDust'

/** Tuned recipe (from the interlude dust prototype). */
const RECIPE: GlyphDustRecipe = {
  shapeDens: 92.8,
  dotSize: 0.06,
  cloudDot: 0.03,
  hold: 1100,
  flow: 6000,
  stagger: 0.6,
  shimmer: 1.0,
  goo: 14.0,
  curve: 1.6, // gentle bow on the direct shape→shape morph
  errant: 42, // free-floating specks that never merge
}

/**
 * Interlude signature: a conserved cloud of accent motes that settles into the
 * four section glyphs (thermostat / phone / browser / smiley), dispersing into a
 * sticky gooey cloud between each. Client-only; paused while offscreen; reduced
 * motion holds a single static form.
 */
export function PortfolioInterludeGlyphs() {
  const hydrated = useHydrated()
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!hydrated || isPrerenderSnapshot()) return
    const canvas = canvasRef.current
    if (!canvas) return

    const small = window.matchMedia('(max-width: 767px)').matches
    canvas.width = small ? 520 : 760
    canvas.height = canvas.width

    const engine = createGlyphDust(canvas, {
      ...RECIPE,
      maxMotes: small ? 14000 : 28000,
    })

    if (reduced) {
      engine.renderStatic()
      return () => engine.destroy()
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) engine.start()
        else engine.stop()
      },
      { threshold: 0.05 },
    )
    io.observe(canvas)
    return () => {
      io.disconnect()
      engine.destroy()
    }
  }, [hydrated, reduced])

  if (!hydrated || isPrerenderSnapshot()) {
    return (
      <div
        className="portfolio-interlude__glyphs portfolio-interlude__glyphs--placeholder"
        aria-hidden
      />
    )
  }
  return <canvas ref={canvasRef} className="portfolio-interlude__glyphs" aria-hidden />
}
