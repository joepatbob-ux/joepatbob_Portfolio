import { useEffect, useRef, useState } from 'react'
import dynamic from '@/lib/dynamic'
import { useHydrated } from '@/lib/hooks/useHydrated'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'
import { createGlyphDust, type GlyphDustHandle } from '@/lib/glyph-dust/createGlyphDust'
import {
  DEFAULT_CHROME_TUNE,
  DEFAULT_GLYPH_DUST_RECIPE,
  isChromiumBrowser,
  isGlyphDustDebugEnabled,
  loadGlyphDustDebugState,
  saveGlyphDustDebugState,
  type GlyphDustDebugState,
} from '@/lib/glyph-dust/glyphDustDebug'

/* Dev-only dial panel (?glyphDustDebug=1) — flag-gated lazy mount so its chunk
 * never enters the entry graph or gets fetched on a normal visit. */
const GlyphDustDebugPanel = dynamic(
  () =>
    import('@/components/GlyphDustDebugPanel').then((m) => ({
      default: m.GlyphDustDebugPanel,
    })),
  { loading: () => null },
)

/**
 * Interlude signature: a conserved cloud of accent motes that settles into the
 * four section glyphs (thermostat / phone / browser / smiley), dispersing into a
 * sticky gooey cloud between each. Client-only; paused while offscreen; reduced
 * motion holds a single static form.
 *
 * Dev tuning: add `?glyphDustDebug=1` on localhost for the dial panel.
 */
export function PortfolioInterludeGlyphs() {
  const hydrated = useHydrated()
  const reduced = usePrefersReducedMotion()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GlyphDustHandle | null>(null)
  const [debugEnabled, setDebugEnabled] = useState(false)
  const [debugState, setDebugState] = useState<GlyphDustDebugState | null>(null)
  const [canvasPx, setCanvasPx] = useState(760)
  const debugRecipe = debugState?.recipe
  const debugChrome = debugState?.chrome
  const debugPhase = debugState?.phase
  const debugPaused = debugState?.paused
  /* Scrub position is read once at engine creation but must not recreate the
   * engine on every slider move — the effect below reacts to scrubs live. */
  const scrubRef = useRef({ paused: debugPaused, phase: debugPhase })
  scrubRef.current = { paused: debugPaused, phase: debugPhase }

  useEffect(() => {
    if (!hydrated) return
    const enabled = isGlyphDustDebugEnabled()
    setDebugEnabled(enabled)
    if (enabled) setDebugState(loadGlyphDustDebugState())
  }, [hydrated])

  useEffect(() => {
    if (!debugEnabled || !debugState) return
    saveGlyphDustDebugState(debugState)
  }, [debugEnabled, debugState])

  useEffect(() => {
    if (!hydrated || isPrerenderSnapshot()) return
    const canvas = canvasRef.current
    if (!canvas) return

    const small = window.matchMedia('(max-width: 767px)').matches
    const px = small ? 520 : 760
    canvas.width = px
    canvas.height = px
    setCanvasPx(px)

    const recipe = debugEnabled && debugRecipe ? debugRecipe : DEFAULT_GLYPH_DUST_RECIPE
    const chrome =
      debugEnabled && debugChrome
        ? debugChrome
        : isChromiumBrowser()
          ? DEFAULT_CHROME_TUNE
          : undefined

    const engine = createGlyphDust(canvas, {
      ...recipe,
      chrome,
      maxMotes: small ? 14000 : 28000,
    })
    engineRef.current = engine

    if (reduced) {
      engine.renderStatic()
      return () => {
        engine.destroy()
        engineRef.current = null
      }
    }

    if (debugEnabled && scrubRef.current.paused) {
      engine.seekPhase(scrubRef.current.phase ?? 0)
    } else if (debugEnabled) {
      engine.resumeCycle()
    } else {
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
        engineRef.current = null
      }
    }

    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [hydrated, reduced, debugEnabled, debugRecipe, debugChrome])

  useEffect(() => {
    if (!debugEnabled || debugPaused === undefined) return
    const engine = engineRef.current
    if (!engine) return
    if (debugPaused) engine.seekPhase(debugPhase ?? 0)
    else engine.resumeCycle()
  }, [debugEnabled, debugPhase, debugPaused])

  if (!hydrated || isPrerenderSnapshot()) {
    return (
      <div
        className="portfolio-interlude__glyphs portfolio-interlude__glyphs--placeholder"
        aria-hidden
      />
    )
  }

  return (
    <>
      <canvas ref={canvasRef} className="portfolio-interlude__glyphs" aria-hidden />
      {debugEnabled && debugState ? (
        <GlyphDustDebugPanel
          state={debugState}
          canvasPx={canvasPx}
          onChange={setDebugState}
        />
      ) : null}
    </>
  )
}
