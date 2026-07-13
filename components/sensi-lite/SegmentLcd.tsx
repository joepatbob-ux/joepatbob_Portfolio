import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from 'react'
import {
  applyAtlasPaint,
  breakApartSegmentGroup,
  collectAllSegmentPicks,
  collectNamedSegmentIds,
  collectSegmentIdMap,
  mergeSegments,
  resolvePickTarget,
  tagSegmentCandidates,
  toSegmentPick,
  wrapSegmentsWithId,
  type SegmentPick,
} from '@/lib/sensi-lite/sensiLiteSegmentDebug'

const GROUP_SELECTOR = '.lcd-seg-group'
const SCREEN_SVG_URL = '/images/sensi-lite/screen.svg?v=17'

function applySegmentLit(el: SVGPathElement, isLit: boolean) {
  el.classList.toggle('lit', isLit)
  if (isLit) {
    el.style.fillOpacity = '1'
  } else {
    el.style.removeProperty('fill-opacity')
  }
}

export type SegmentLcdHandle = {
  applyIds: (keys: string[], id: string) => boolean
  breakApart: (key: string) => SegmentPick[]
  merge: (keys: string[], id: string) => SegmentPick | null
  collectAllPicks: () => SegmentPick[]
  exportIdMap: () => Record<string, string>
  exportSvg: () => string
}

export const SegmentLcd = forwardRef<
  SegmentLcdHandle,
  {
    lit: ReadonlySet<string>
    flash?: boolean
    style?: CSSProperties
    debug?: boolean
    atlas?: boolean
    selectedKeys?: ReadonlySet<string>
    namedRevision?: number
    onSegmentPick?: (pick: SegmentPick, additive: boolean) => void
  }
>(function SegmentLcd(
  {
    lit,
    flash = false,
    style,
    debug = false,
    atlas = false,
    selectedKeys = new Set(),
    namedRevision = 0,
    onSegmentPick,
  },
  ref,
) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [screenSvg, setScreenSvg] = useState('')

  useEffect(() => {
    let cancelled = false
    fetch(SCREEN_SVG_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`screen.svg ${res.status}`)
        return res.text()
      })
      .then((markup) => {
        if (!cancelled) setScreenSvg(markup)
      })
      .catch(() => {
        if (!cancelled) setScreenSvg('')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !screenSvg) return
    if (debug) tagSegmentCandidates(root)
  }, [debug, screenSvg])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !screenSvg || atlas) return

    root.querySelectorAll<SVGElement>(GROUP_SELECTOR).forEach((group) => {
      const groupLit = group.id ? lit.has(group.id) : false
      let anyChildLit = false
      group.querySelectorAll<SVGPathElement>('.lcd-seg').forEach((child) => {
        const childLit = child.id ? lit.has(child.id) : groupLit
        if (childLit) anyChildLit = true
        applySegmentLit(child, childLit)
      })
      group.classList.toggle('lit', groupLit || anyChildLit)
    })

    root.querySelectorAll<SVGPathElement>('.lcd-seg').forEach((el) => {
      if (el.closest('.lcd-seg-group')) return
      const isLit = el.id ? lit.has(el.id) : false
      applySegmentLit(el, isLit)
    })
  }, [atlas, lit, screenSvg])

  useEffect(() => {
    const root = rootRef.current
    if (!root || !screenSvg || !atlas) return

    const namedIds = collectNamedSegmentIds(root)
    applyAtlasPaint(root, namedIds, selectedKeys)
  }, [atlas, namedRevision, screenSvg, selectedKeys])

  useImperativeHandle(
    ref,
    () => ({
      applyIds(keys: string[], id: string) {
        const root = rootRef.current
        if (!root) return false
        const ok = wrapSegmentsWithId(root, keys, id)
        if (ok && atlas) {
          const namedIds = collectNamedSegmentIds(root)
          applyAtlasPaint(root, namedIds, selectedKeys)
        }
        return ok
      },
      breakApart(key: string) {
        const root = rootRef.current
        if (!root) return []
        const released = breakApartSegmentGroup(root, key)
        if (released.length > 0 && atlas) {
          const namedIds = collectNamedSegmentIds(root)
          applyAtlasPaint(root, namedIds, selectedKeys)
        }
        return released
      },
      merge(keys: string[], id: string) {
        const root = rootRef.current
        if (!root) return null
        const merged = mergeSegments(root, keys, id)
        if (merged && atlas) {
          const namedIds = collectNamedSegmentIds(root)
          applyAtlasPaint(root, namedIds, selectedKeys)
        }
        return merged
      },
      collectAllPicks() {
        const root = rootRef.current
        return root ? collectAllSegmentPicks(root) : []
      },
      exportIdMap() {
        const root = rootRef.current
        return root ? collectSegmentIdMap(root) : {}
      },
      exportSvg() {
        const svg = rootRef.current?.querySelector('svg')
        return svg ? svg.outerHTML : ''
      },
    }),
    [atlas, selectedKeys],
  )

  const onClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!debug || !onSegmentPick) return

      const root = rootRef.current
      if (!root) return

      const target = e.target as Element
      if (!root.contains(target)) return

      const hit = target.closest('path, g') as SVGElement | null
      if (!hit || !root.contains(hit)) return
      if (hit.closest('defs, clipPath, filter, mask')) return
      if (hit.tagName.toLowerCase() === 'rect') return

      e.preventDefault()
      e.stopPropagation()
      const seg = resolvePickTarget(root, hit)
      const additive = e.shiftKey || e.metaKey || e.ctrlKey
      onSegmentPick(toSegmentPick(seg), additive)
    },
    [debug, onSegmentPick],
  )

  if (!screenSvg) return null

  const className = [
    'segment-lcd',
    debug ? 'segment-lcd--debug' : '',
    atlas ? 'segment-lcd--atlas' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div
      ref={rootRef}
      className={className}
      style={{
        opacity: flash ? 0.35 : 1,
        transition: flash ? 'none' : 'opacity 80ms ease',
        ...style,
      }}
      onClick={onClick}
      dangerouslySetInnerHTML={{ __html: screenSvg }}
      aria-hidden={!debug}
      aria-label={debug ? 'LCD segment picker' : undefined}
    />
  )
})
