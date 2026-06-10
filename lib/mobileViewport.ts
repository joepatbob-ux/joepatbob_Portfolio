/** Layout viewport — prefers visualViewport on iOS Safari (URL bar, keyboard). */

export function getLayoutViewportHeight(): number {
  if (typeof window === 'undefined') return 0
  const vv = window.visualViewport
  if (vv && vv.height > 0) return vv.height
  return window.innerHeight
}

export function getLayoutViewportOffsetTop(): number {
  if (typeof window === 'undefined') return 0
  return window.visualViewport?.offsetTop ?? 0
}
