/** Document scroll position — accounts for iOS body scroll lock (fixed body reports scrollY 0). */

let lockCount = 0
let savedScrollY = 0

export function getDocumentScrollY(): number {
  if (typeof window === 'undefined') return 0
  if (lockCount > 0) return savedScrollY
  return document.scrollingElement?.scrollTop ?? window.scrollY
}

export function pushDocumentScrollLock(): void {
  if (typeof window === 'undefined') return
  lockCount += 1
  if (lockCount === 1) {
    savedScrollY = document.scrollingElement?.scrollTop ?? window.scrollY
  }
}

export function popDocumentScrollLock(): void {
  lockCount = Math.max(0, lockCount - 1)
}

export function peekSavedScrollY(): number {
  return savedScrollY
}
