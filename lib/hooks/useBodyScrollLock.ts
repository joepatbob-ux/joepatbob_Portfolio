import {
  getDocumentScrollY,
  popDocumentScrollLock,
  pushDocumentScrollLock,
  peekSavedScrollY,
} from '@/lib/documentScrollY'
import { useEffect } from 'react'

export { getDocumentScrollY, peekSavedScrollY }

/** iOS-safe scroll lock — fixed body + restored scroll position on release. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return

    pushDocumentScrollLock()
    const scrollY = getDocumentScrollY()
    const { body } = document
    const html = document.documentElement
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'
    body.style.touchAction = 'none'
    html.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'

    return () => {
      const restoreY = peekSavedScrollY()
      popDocumentScrollLock()
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      body.style.touchAction = ''
      html.style.overflow = ''
      html.style.overscrollBehavior = ''
      window.scrollTo(0, restoreY)
    }
  }, [active])
}
