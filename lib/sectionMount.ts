import { CHAPTER_PRELOAD_ROOT_MARGIN } from '@/lib/layout/intersectionPreload'
import { useEffect, useState, type RefObject } from 'react'

const DEFERRED_SECTIONS = new Set(['mobile', 'web-apps', 'everything-else'])
const forcedMount = new Set<string>()
const listeners = new Map<string, Set<() => void>>()

export function isDeferredSection(sectionId: string): boolean {
  return DEFERRED_SECTIONS.has(sectionId)
}

/** Mount a deferred section before programmatic scroll (sidebar / chapter nav). */
export function requestSectionMount(sectionId: string) {
  if (!isDeferredSection(sectionId)) return
  if (forcedMount.has(sectionId)) return
  forcedMount.add(sectionId)
  listeners.get(sectionId)?.forEach((fn) => fn())
}

export function sectionIdFromChapterId(chapterId: string): string | null {
  if (chapterId.startsWith('mobile-')) return 'mobile'
  if (chapterId.startsWith('web-apps-')) return 'web-apps'
  if (chapterId.startsWith('everything-else-')) return 'everything-else'
  if (chapterId.startsWith('hardware-')) return 'hardware'
  return null
}

function subscribe(sectionId: string, fn: () => void) {
  let set = listeners.get(sectionId)
  if (!set) {
    set = new Set()
    listeners.set(sectionId, set)
  }
  set.add(fn)
  return () => {
    set!.delete(fn)
  }
}

/** True when section content should render (immediate, in view, or nav-requested). */
export function useSectionMount(
  sectionId: string,
  rootRef: RefObject<HTMLElement | null>,
  immediate = false,
): boolean {
  const [mounted, setMounted] = useState(
    immediate || !isDeferredSection(sectionId) || forcedMount.has(sectionId),
  )

  useEffect(() => {
    if (mounted) return
    if (forcedMount.has(sectionId)) {
      setMounted(true)
      return
    }
    return subscribe(sectionId, () => setMounted(true))
  }, [sectionId, mounted])

  useEffect(() => {
    if (mounted || immediate) return
    const root = rootRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setMounted(true)
      },
      { rootMargin: CHAPTER_PRELOAD_ROOT_MARGIN, threshold: 0 },
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [mounted, immediate, rootRef])

  return mounted
}
