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

/** Pin a fixed overlay to the visible viewport band (iOS Safari toolbars). */
export function syncElementToVisualViewport(el: HTMLElement): void {
  const vv = window.visualViewport
  if (!vv) return

  el.style.top = `${Math.round(vv.offsetTop)}px`
  el.style.height = `${Math.round(vv.height)}px`
  el.style.bottom = 'auto'
}

export function clearVisualViewportSync(el: HTMLElement): void {
  el.style.top = ''
  el.style.height = ''
  el.style.bottom = ''
}
