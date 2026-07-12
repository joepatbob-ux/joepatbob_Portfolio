// Desktop "deck" presentation: a fixed stage where a momentum-gated wheel steps
// between chapters with a fade, instead of scrolling through them. Opt-in and
// desktop-only — touch / mobile keep the existing scroll narrative.
//
// Gating: `?deck=1` enables it, active only on a wide viewport with a fine
// pointer. `?deck=all` forces it on regardless of pointer (for testing on
// headless / touch). The pointer decision is resolved once at boot into the
// `deck-fine` class so CSS and JS agree without a `pointer:` media query.

export const DECK_MODE_CLASS = 'deck-mode'
export const DECK_FINE_CLASS = 'deck-fine'

function deckParam(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return new URLSearchParams(window.location.search).get('deck')
  } catch {
    return null
  }
}

/** Deck is opt-in via `?deck=1` (or `?deck=all` to force past the pointer gate). */
export function deckRequested(): boolean {
  const v = deckParam()
  return v === '1' || v === 'all'
}

/** `?deck=all` forces the deck on even without a fine pointer (testing). */
export function deckForced(): boolean {
  return deckParam() === 'all'
}

/** Set `html.deck-mode` + `html.deck-fine` from the flag and pointer, once at boot. */
export function initDeckModeClass(): void {
  if (typeof document === 'undefined') return
  const on = deckRequested()
  document.documentElement.classList.toggle(DECK_MODE_CLASS, on)
  const fine =
    on && (deckForced() || window.matchMedia('(pointer: fine)').matches)
  document.documentElement.classList.toggle(DECK_FINE_CLASS, fine)
  // The deck uses the base (non-continuous) chapter layout — a two-column,
  // viewport-fit stage/copy — not the tall continuous-scroll stack. Turn the
  // continuous-scroll CSS/JS off so stages render statically instead of pinning.
  if (on) document.documentElement.classList.remove('continuous-chapters')
}

/** True when the deck flag is on. */
export function isDeckMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains(DECK_MODE_CLASS)
}

/** True when the deck presentation should actually drive navigation right now. */
export function isDeckActive(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false
  const root = document.documentElement
  return (
    root.classList.contains(DECK_MODE_CLASS) &&
    root.classList.contains(DECK_FINE_CLASS) &&
    window.matchMedia('(min-width: 1024px)').matches
  )
}
