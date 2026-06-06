import { LAYOUT_MQ } from '@/lib/layout/breakpoints'

export function isLayoutMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(LAYOUT_MQ.mobile).matches
}
