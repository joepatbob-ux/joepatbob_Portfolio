import type { GlyphDustChromeTune, GlyphDustRecipe } from '@/lib/glyph-dust/createGlyphDust'

/** Production interlude recipe (Chrome-tuned via glyphDustDebug, Jul 2026). */
export const DEFAULT_GLYPH_DUST_RECIPE: GlyphDustRecipe = {
  shapeDens: 140,
  dotSize: 0.03,
  cloudDot: 0.04,
  hold: 1300,
  flow: 6600,
  stagger: 1,
  shimmer: 2,
  goo: 1,
  curve: 2,
  errant: 34,
}

export const DEFAULT_CHROME_TUNE: GlyphDustChromeTune = {
  gooMult: 0.34,
  threshold: 76,
}

export interface GlyphDustDebugState {
  recipe: GlyphDustRecipe
  chrome: GlyphDustChromeTune
  phase: number
  paused: boolean
}

export interface GlyphDustDebugPackage {
  glyphDustDebug: '1'
  recipe: GlyphDustRecipe
  chrome: GlyphDustChromeTune
  meta: {
    userAgent: string
    isChromium: boolean
    canvasPx: number
    phase: number
    paused: boolean
    exportedAt: string
  }
}

const STORAGE_KEY = 'glyphDustDebugState'

export function isGlyphDustDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('glyphDustDebug') === '1'
}

export function isChromiumBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  return !(
    /Safari/i.test(navigator.userAgent) &&
    !/Chrome|Chromium|Edg/i.test(navigator.userAgent)
  )
}

export function loadGlyphDustDebugState(): GlyphDustDebugState {
  const base: GlyphDustDebugState = {
    recipe: { ...DEFAULT_GLYPH_DUST_RECIPE },
    chrome: { ...DEFAULT_CHROME_TUNE },
    phase: holdPhaseCenter(1),
    paused: true,
  }
  if (typeof window === 'undefined') return base
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return base
    const parsed = JSON.parse(raw) as Partial<GlyphDustDebugState>
    return {
      recipe: { ...base.recipe, ...parsed.recipe },
      chrome: { ...base.chrome, ...parsed.chrome },
      phase: typeof parsed.phase === 'number' ? parsed.phase : base.phase,
      paused: typeof parsed.paused === 'boolean' ? parsed.paused : base.paused,
    }
  } catch {
    return base
  }
}

export function saveGlyphDustDebugState(state: GlyphDustDebugState): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function holdPhaseCenter(glyphIndex: number, recipe = DEFAULT_GLYPH_DUST_RECIPE): number {
  const holdFrac = recipe.hold / (recipe.hold + recipe.flow)
  return (glyphIndex + holdFrac * 0.5) / 4
}

export function morphPhaseMidpoint(
  fromGlyph: number,
  recipe = DEFAULT_GLYPH_DUST_RECIPE,
): number {
  const holdFrac = recipe.hold / (recipe.hold + recipe.flow)
  return (fromGlyph + holdFrac + (1 - holdFrac) * 0.5) / 4
}

export function buildGlyphDustDebugPackage(
  state: GlyphDustDebugState,
  canvasPx: number,
): GlyphDustDebugPackage {
  return {
    glyphDustDebug: '1',
    recipe: state.recipe,
    chrome: state.chrome,
    meta: {
      userAgent: navigator.userAgent,
      isChromium: isChromiumBrowser(),
      canvasPx,
      phase: state.phase,
      paused: state.paused,
      exportedAt: new Date().toISOString(),
    },
  }
}

export function formatGlyphDustDebugPackage(pkg: GlyphDustDebugPackage): string {
  return JSON.stringify(pkg, null, 2)
}
