import { CHAPTER_PRELOAD_ROOT_MARGIN } from '@/lib/layout/intersectionPreload'
import { useEffect, useState, type RefObject } from 'react'

const forcedMount = new Set<string>()
const listeners = new Map<string, Set<() => void>>()

/** All hardware chapter slides — defer until near viewport or nav. */
export function isDeferredChapter(chapterId: string): boolean {
  return chapterId.startsWith('hardware-')
}

export function requestChapterMount(chapterId: string) {
  if (!isDeferredChapter(chapterId)) return
  if (forcedMount.has(chapterId)) return
  forcedMount.add(chapterId)
  listeners.get(chapterId)?.forEach((fn) => fn())
}

function subscribe(chapterId: string, fn: () => void) {
  let set = listeners.get(chapterId)
  if (!set) {
    set = new Set()
    listeners.set(chapterId, set)
  }
  set.add(fn)
  return () => {
    set!.delete(fn)
  }
}

export function useChapterMount(
  chapterId: string,
  rootRef: RefObject<HTMLElement | null>,
  immediate = false,
): boolean {
  const [mounted, setMounted] = useState(
    immediate || !isDeferredChapter(chapterId) || forcedMount.has(chapterId),
  )

  useEffect(() => {
    if (mounted) return
    if (forcedMount.has(chapterId)) {
      setMounted(true)
      return
    }
    return subscribe(chapterId, () => setMounted(true))
  }, [chapterId, mounted])

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
