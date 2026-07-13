/** Dev-only nav wrap inspector — add `?navWrapDebug=1` on localhost. */

export type NavWrapLine = {
  index: number
  top: number
  left: number
  right: number
  bottom: number
  height: number
  text: string
}

export type NavWrapBreak = {
  lineIndex: number
  x: number
  y: number
  after: string
}

export type NavNowrapGroup = {
  label: string
  className: string
  width: number
  overflows: boolean
}

export type NavIntentionalLine = {
  id: string
  top: number
  height: number
  width: number
  text: string
  overflows: boolean
}

export type NavWrapMeasure = {
  containerWidth: number
  lineCount: number
  lines: NavWrapLine[]
  breaks: NavWrapBreak[]
  nowrapGroups: NavNowrapGroup[]
  intentionalLines: NavIntentionalLine[]
}

const LINE_COLORS = [
  'rgba(255, 99, 132, 0.18)',
  'rgba(54, 162, 235, 0.18)',
  'rgba(255, 206, 86, 0.2)',
  'rgba(75, 192, 192, 0.18)',
  'rgba(153, 102, 255, 0.18)',
  'rgba(255, 159, 64, 0.2)',
] as const

export function navWrapLineColor(index: number): string {
  return LINE_COLORS[index % LINE_COLORS.length]
}

export function isNavWrapDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  return new URLSearchParams(window.location.search).get('navWrapDebug') === '1'
}

type CharBox = {
  top: number
  left: number
  right: number
  bottom: number
  char: string
}

function roundTop(value: number): number {
  return Math.round(value * 2) / 2
}

function collectCharBoxes(root: HTMLElement): CharBox[] {
  const range = document.createRange()
  const boxes: CharBox[] = []

  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      for (let i = 0; i < text.length; i++) {
        range.setStart(node, i)
        range.setEnd(node, i + 1)
        const rect = range.getBoundingClientRect()
        if (!rect.width && text[i] !== ' ') continue
        boxes.push({
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          char: text[i] ?? '',
        })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as HTMLElement
    if (el.classList.contains('sidebar-main-nav__wrap-debug-layer')) return
    if (el.classList.contains('sidebar-main-nav__wrap-debug-badge')) return
    el.childNodes.forEach(walk)
  }

  root.childNodes.forEach(walk)
  return boxes
}

function trimLineText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function measureNavWrap(root: HTMLElement): NavWrapMeasure {
  const containerWidth = root.getBoundingClientRect().width
  const boxes = collectCharBoxes(root)

  const lineMap = new Map<number, CharBox[]>()
  for (const box of boxes) {
    const key = roundTop(box.top)
    const line = lineMap.get(key)
    if (line) line.push(box)
    else lineMap.set(key, [box])
  }

  const sortedTops = [...lineMap.keys()].sort((a, b) => a - b)
  const lines: NavWrapLine[] = sortedTops
    .map((top, index) => {
      const chars = lineMap.get(top) ?? []
      chars.sort((a, b) => a.left - b.left)
      const text = trimLineText(chars.map((c) => c.char).join(''))
      const left = chars[0]?.left ?? root.getBoundingClientRect().left
      const right = chars[chars.length - 1]?.right ?? left
      const bottom = Math.max(...chars.map((c) => c.bottom), top)
      return {
        index,
        top,
        left,
        right,
        bottom,
        height: bottom - top,
        text,
      }
    })
    .filter((line) => line.text.length > 0 && line.height > 1)
    .map((line, index) => ({ ...line, index }))

  const breaks: NavWrapBreak[] = []
  for (let i = 0; i < lines.length - 1; i++) {
    const current = lines[i]
    const next = lines[i + 1]
    breaks.push({
      lineIndex: i,
      x: current.right,
      y: current.bottom,
      after: current.text.slice(-24),
    })
    void next
  }

  const nowrapGroups = [...root.querySelectorAll<HTMLElement>(
    '.sidebar-main-nav__nowrap',
  )].map((el) => {
    const width = el.getBoundingClientRect().width
    return {
      label: trimLineText(el.textContent ?? ''),
      className: [...el.classList]
        .filter((c) => c.startsWith('sidebar-main-nav__'))
        .join(' '),
      width: Math.round(width),
      overflows: width > containerWidth + 0.5,
    }
  })

  const intentionalLines = [...root.querySelectorAll<HTMLElement>(
    '[data-nav-line]',
  )].map((el) => {
    const rect = el.getBoundingClientRect()
    const overflows = rect.width > containerWidth + 0.5
    return {
      id: el.dataset.navLine ?? '',
      top: rect.top,
      height: rect.height,
      width: Math.round(rect.width),
      text: trimLineText(el.textContent ?? ''),
      overflows,
    }
  })

  return {
    containerWidth: Math.round(containerWidth),
    lineCount: lines.length,
    lines,
    breaks,
    nowrapGroups,
    intentionalLines,
  }
}
