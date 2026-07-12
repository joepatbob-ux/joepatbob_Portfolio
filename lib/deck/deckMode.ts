// Desktop "deck" presentation: a fixed stage where a momentum-gated wheel steps
// between chapters with a sequential fade, instead of scrolling through them.
// Opt-in and desktop-only — touch / mobile keep the existing scroll narrative.
//
// Gating: enabled by `?deck=1` (adds `html.deck-mode`), and only *active* on a
// wide viewport with a fine pointer. Everything else runs the normal engine.

export const DECK_MODE_CLASS = 'deck-mode'

/** Deck is opt-in via `?deck=1` (kept off by default so it can't affect prod). */
export function deckRequested(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return new URLSearchParams(window.location.search).get('deck') === '1'
  } catch {
    return false
  }
}

/** Set `html.deck-mode` from the `?deck=` flag. Called once at boot. */
export function initDeckModeClass(): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle(DECK_MODE_CLASS, deckRequested())
}

/** True when the deck flag is on. CSS keys off `html.deck-mode`. */
export function isDeckMode(): boolean {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains(DECK_MODE_CLASS)
}

/** Media query the deck runs under — wide viewport + fine pointer (mouse/trackpad). */
export const DECK_ACTIVE_MQ = '(min-width: 1024px) and (pointer: fine)'

/** True when the deck presentation should actually drive navigation right now. */
export function isDeckActive(): boolean {
  if (!isDeckMode() || typeof window === 'undefined') return false
  return window.matchMedia(DECK_ACTIVE_MQ).matches
}
