/** Dev-only LCD segment annotator — add `?sensiLiteSegments=1` on localhost:3000. */

export const SENSI_LITE_CHAPTER_ID = 'hardware-sensi-lite'

export type SegmentPick = {
  /** Stable pick key: element `id` or `@idx:N` from data-seg-idx */
  key: string
  tag: string
  id: string
  idx: number | null
  className: string
}

const IDX_PREFIX = '@idx:'
const SYSTEM_ID = /^(clip|filter)/

export function isAtlasSegment(el: SVGElement): boolean {
  if (el.closest('defs, clipPath, filter, mask')) return false
  const tag = el.tagName.toLowerCase()
  if (tag === 'rect') return false
  return tag === 'path' || tag === 'g'
}

export function isSemanticSegmentId(id: string): boolean {
  return Boolean(id) && !SYSTEM_ID.test(id)
}

export function isSensiLiteSegmentDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('sensiLiteSegments') === '1'
}

export function scrollToSensiLiteChapter() {
  const el = document.querySelector<HTMLElement>(
    `[data-chapter-id="${SENSI_LITE_CHAPTER_ID}"]`,
  )
  if (!el) return false
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  return true
}

export function segmentKeyFromElement(el: SVGElement): string {
  if (el.id) return el.id
  const idx = el.getAttribute('data-seg-idx')
  return idx !== null ? `${IDX_PREFIX}${idx}` : ''
}

export function toSegmentPick(el: SVGElement): SegmentPick {
  const idxAttr = el.getAttribute('data-seg-idx')
  const idx = idxAttr !== null ? Number(idxAttr) : null
  return {
    key: segmentKeyFromElement(el),
    tag: el.tagName.toLowerCase(),
    id: el.id,
    idx: Number.isFinite(idx) ? idx : null,
    className: el.getAttribute('class') ?? '',
  }
}

/** Prefer a named parent group over its child paths when clicking the LCD. */
export function resolvePickTarget(root: ParentNode, el: SVGElement): SVGElement {
  const namedGroup = el.closest<SVGElement>('g[id]')
  if (
    namedGroup &&
    root.contains(namedGroup) &&
    isAtlasSegment(namedGroup) &&
    isSemanticSegmentId(namedGroup.id)
  ) {
    return namedGroup
  }

  if (el.id && isSemanticSegmentId(el.id)) return el

  return el
}

export function collectAllSegmentPicks(root: ParentNode): SegmentPick[] {
  const picks: SegmentPick[] = []
  const seen = new Set<string>()

  const add = (el: SVGElement) => {
    const key = segmentKeyFromElement(el)
    if (!key || seen.has(key)) return
    seen.add(key)
    picks.push(toSegmentPick(el))
  }

  root.querySelectorAll<SVGElement>('g[id]').forEach((el) => {
    if (!isAtlasSegment(el)) return
    if (!isSemanticSegmentId(el.id)) return
    add(el)
  })

  root.querySelectorAll<SVGElement>('path[id]').forEach((el) => {
    if (!isAtlasSegment(el)) return
    if (!isSemanticSegmentId(el.id)) return
    const parentGroup = el.closest<SVGElement>('g[id]')
    if (parentGroup && isSemanticSegmentId(parentGroup.id)) return
    add(el)
  })

  root.querySelectorAll<SVGElement>('path, g').forEach((el) => {
    if (!isAtlasSegment(el)) return
    if (el.id && isSemanticSegmentId(el.id)) return
    const parentGroup = el.closest<SVGElement>('g[id]')
    if (parentGroup && isSemanticSegmentId(parentGroup.id)) return
    add(el)
  })

  return picks
}

export function resolveSegmentElement(root: ParentNode, key: string): SVGElement | null {
  if (!key) return null
  if (key.startsWith(IDX_PREFIX)) {
    const idx = key.slice(IDX_PREFIX.length)
    return root.querySelector<SVGElement>(`[data-seg-idx="${idx}"]`)
  }
  return root.querySelector<SVGElement>(`#${CSS.escape(key)}`)
}

export function tagSegmentCandidates(root: ParentNode) {
  let idx = 0
  root.querySelectorAll<SVGElement>('path, g').forEach((el) => {
    if (el.closest('defs, clipPath, filter, mask')) return
    if (el.id || el.hasAttribute('data-seg-idx')) return
    el.setAttribute('data-seg-idx', String(idx))
    idx += 1
  })
}

export function applySegmentId(el: SVGElement, nextId: string) {
  const trimmed = nextId.trim()
  if (!trimmed) return

  el.id = trimmed
  if (el.tagName.toLowerCase() === 'g') {
    el.classList.add('lcd-seg-group')
    el.querySelectorAll<SVGElement>('path').forEach((path) => {
      path.classList.add('lcd-seg')
    })
  } else {
    el.classList.add('lcd-seg')
  }
}

export function canBreakApartSegment(pick: SegmentPick): boolean {
  return pick.tag === 'g' && Boolean(pick.id)
}

export function canMergeSegments(picks: readonly SegmentPick[]): boolean {
  return picks.length >= 2
}

export function mergeTargetIdFromSelection(
  picks: readonly SegmentPick[],
  groupIdDraft: string,
): string | null {
  const trimmed = groupIdDraft.trim()
  if (trimmed) return trimmed
  const ids = [...new Set(picks.map((p) => p.id).filter(Boolean))]
  if (ids.length === 1) return ids[0]
  return null
}

function isNamedSegmentGroup(el: SVGElement): boolean {
  return el.tagName.toLowerCase() === 'g' && Boolean(el.id) && isSemanticSegmentId(el.id)
}

function absorbIntoGroup(target: SVGElement, source: SVGElement) {
  if (isNamedSegmentGroup(source)) {
    const children = Array.from(source.children) as SVGElement[]
    children.forEach((child) => absorbIntoGroup(target, child))
    source.remove()
    return
  }

  if (source.id && source.id !== target.id) source.removeAttribute('id')
  target.appendChild(source)
  if (source.tagName.toLowerCase() === 'path') source.classList.add('lcd-seg')
}

/** Merge selected segments into one named group (flattens nested named groups). */
export function mergeSegments(
  root: ParentNode,
  keys: readonly string[],
  groupId: string,
): SegmentPick | null {
  const trimmed = groupId.trim()
  if (!trimmed || keys.length < 2) return null

  const elements = keys
    .map((key) => resolveSegmentElement(root, key))
    .filter((el): el is SVGElement => el !== null)
  if (elements.length < 2) return null

  let target = elements.find((el) => isNamedSegmentGroup(el) && el.id === trimmed)

  if (!target) {
    const parent = elements[0].parentNode
    if (!parent) return null

    const ordered = [...elements].sort((a, b) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )

    target = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    parent.insertBefore(target, ordered[0])
    applySegmentId(target, trimmed)
  }

  elements.forEach((el) => {
    if (el === target) return
    absorbIntoGroup(target!, el)
  })

  tagSegmentCandidates(root)
  return toSegmentPick(target)
}

/** Unwrap a named group so its children can be picked and lit individually. */
export function breakApartSegmentGroup(root: ParentNode, key: string): SegmentPick[] {
  const group = resolveSegmentElement(root, key)
  if (!group || group.tagName.toLowerCase() !== 'g') return []
  if (!group.id || !isSemanticSegmentId(group.id)) return []

  const parent = group.parentNode
  if (!parent) return []

  // Release only element children — pretty-printed SVG interleaves whitespace
  // text nodes, which have no tagName and aren't pickable segments. They get
  // discarded with the group wrapper below.
  const released: SVGElement[] = []
  while (group.firstElementChild) {
    const child = group.firstElementChild as SVGElement
    parent.insertBefore(child, group)
    released.push(child)
  }

  group.remove()

  released.forEach((el) => {
    if (el.tagName.toLowerCase() === 'path') {
      el.classList.add('lcd-seg')
    }
  })

  tagSegmentCandidates(root)
  return released.map((el) => toSegmentPick(el))
}

export function wrapSegmentsWithId(
  root: ParentNode,
  keys: readonly string[],
  groupId: string,
): boolean {
  const trimmed = groupId.trim()
  if (!trimmed) return false

  const elements = keys
    .map((key) => resolveSegmentElement(root, key))
    .filter((el): el is SVGElement => el !== null)
  if (elements.length === 0) return false

  if (elements.length === 1) {
    applySegmentId(elements[0], trimmed)
    return true
  }

  const parent = elements[0].parentNode
  if (!parent) return false

  const ordered = [...elements].sort((a, b) =>
    a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
  )

  const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
  parent.insertBefore(group, ordered[0])

  ordered.forEach((el) => {
    group.appendChild(el)
    if (el.id && el.id !== trimmed) el.removeAttribute('id')
    if (el.tagName.toLowerCase() === 'path') el.classList.add('lcd-seg')
  })

  applySegmentId(group, trimmed)
  return true
}

export function collectNamedSegmentIds(root: ParentNode): ReadonlySet<string> {
  const ids = new Set<string>()
  root.querySelectorAll<SVGElement>('path[id], g[id]').forEach((el) => {
    if (!isAtlasSegment(el)) return
    if (isSemanticSegmentId(el.id)) ids.add(el.id)
  })
  return ids
}

function isNamedInAtlas(el: SVGElement, namedIds: ReadonlySet<string>): boolean {
  if (el.id && namedIds.has(el.id)) return true
  const group = el.parentElement?.closest<SVGElement>('g[id]')
  return Boolean(group?.id && namedIds.has(group.id))
}

export function applyAtlasPaint(
  root: ParentNode,
  namedIds: ReadonlySet<string>,
  selectedKeys: ReadonlySet<string>,
) {
  root.querySelectorAll<SVGElement>('path, g').forEach((el) => {
    if (!isAtlasSegment(el)) return

    el.classList.remove('lcd-seg--atlas-base', 'lcd-seg--atlas-named', 'lcd-seg--atlas-selected')

    const key = segmentKeyFromElement(el)
    if (selectedKeys.has(key)) {
      el.classList.add('lcd-seg--atlas-selected')
      return
    }
    if (isNamedInAtlas(el, namedIds)) {
      el.classList.add('lcd-seg--atlas-named')
      return
    }
    el.classList.add('lcd-seg--atlas-base')
  })
}

export function collectSegmentIdMap(root: ParentNode): Record<string, string> {
  const map: Record<string, string> = {}
  root.querySelectorAll<SVGElement>('path[id], g[id]').forEach((el) => {
    if (!isAtlasSegment(el)) return
    if (!isSemanticSegmentId(el.id)) return
    map[el.id] = el.tagName.toLowerCase()
  })
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)))
}

export function formatSegmentIdMap(map: Record<string, string>): string {
  return JSON.stringify(map, null, 2)
}
