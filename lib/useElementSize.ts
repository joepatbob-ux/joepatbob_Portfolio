import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefCallback,
} from 'react'

/** Observe an element’s content box — for sizing canvas/scratch surfaces from CSS layout. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [node, setNode] = useState<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  const setRef = useCallback<RefCallback<T>>((el) => {
    ref.current = el
    setNode(el)
  }, [])

  useEffect(() => {
    const el = node
    if (!el) return

    const update = (entry?: ResizeObserverEntry) => {
      const box = entry?.contentBoxSize?.[0]
      const width = box?.inlineSize ?? el.getBoundingClientRect().width
      const height = box?.blockSize ?? el.getBoundingClientRect().height
      setSize({
        width: Math.round(width),
        height: Math.round(height),
      })
    }

    update()
    const ro = new ResizeObserver((entries) => update(entries[0]))
    ro.observe(el)
    return () => ro.disconnect()
  }, [node])

  return { ref: setRef, refObject: ref, size }
}
