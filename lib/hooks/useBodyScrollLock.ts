'use client'

import { useEffect } from 'react'

let lockCount = 0
let savedScrollY = 0

/** iOS-safe scroll lock — fixed body + restored scroll position on release. */
export function useBodyScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return

    lockCount += 1
    if (lockCount === 1) {
      savedScrollY = window.scrollY
      const { body } = document
      const html = document.documentElement
      body.style.position = 'fixed'
      body.style.top = `-${savedScrollY}px`
      body.style.left = '0'
      body.style.right = '0'
      body.style.width = '100%'
      body.style.overflow = 'hidden'
      html.style.overflow = 'hidden'
    }

    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount !== 0) return

      const { body } = document
      const html = document.documentElement
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      html.style.overflow = ''
      window.scrollTo(0, savedScrollY)
    }
  }, [active])
}
