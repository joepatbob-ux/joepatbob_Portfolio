'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'

const STORAGE_KEY = 'phone-layout-panel-position'

type Point = { x: number; y: number }

function defaultPosition(): Point {
  if (typeof window === 'undefined') return { x: 16, y: 72 }
  const width = Math.min(400, window.innerWidth - 32)
  return {
    x: Math.max(16, window.innerWidth - width - 20),
    y: 72,
  }
}

function readStoredPosition(): Point | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Point
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

function clampToViewport(
  pos: Point,
  panelWidth: number,
  panelHeight: number,
): Point {
  const margin = 8
  const maxX = Math.max(margin, window.innerWidth - panelWidth - margin)
  const maxY = Math.max(margin, window.innerHeight - panelHeight - margin)
  return {
    x: Math.max(margin, Math.min(maxX, pos.x)),
    y: Math.max(margin, Math.min(maxY, pos.y)),
  }
}

export function useFloatingPanelDrag() {
  const panelRef = useRef<HTMLDivElement>(null)
  const posRef = useRef<Point>(defaultPosition())
  const [position, setPosition] = useState<Point>(() => defaultPosition())
  const [dragging, setDragging] = useState(false)
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origX: number
    origY: number
  } | null>(null)

  const syncClamped = useCallback((next: Point) => {
    const el = panelRef.current
    const rect = el?.getBoundingClientRect()
    const w = rect?.width ?? 400
    const h = rect?.height ?? 480
    const clamped = clampToViewport(next, w, h)
    posRef.current = clamped
    setPosition(clamped)
    return clamped
  }, [])

  useEffect(() => {
    const stored = readStoredPosition()
    if (stored) syncClamped(stored)
  }, [syncClamped])

  useEffect(() => {
    const onResize = () => syncClamped(posRef.current)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [syncClamped])

  const onHeaderPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (e.button !== 0) return
      if ((e.target as HTMLElement).closest('button')) return

      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: posRef.current.x,
        origY: posRef.current.y,
      }
      setDragging(true)
      e.currentTarget.setPointerCapture(e.pointerId)
      e.preventDefault()
    },
    [],
  )

  const onHeaderPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return

      syncClamped({
        x: drag.origX + (e.clientX - drag.startX),
        y: drag.origY + (e.clientY - drag.startY),
      })
    },
    [syncClamped],
  )

  const endDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const drag = dragRef.current
      if (!drag || drag.pointerId !== e.pointerId) return

      dragRef.current = null
      setDragging(false)
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId)
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(posRef.current))
    },
    [],
  )

  const panelStyle = {
    left: position.x,
    top: position.y,
  } as const

  return {
    panelRef,
    panelStyle,
    dragging,
    onHeaderPointerDown,
    onHeaderPointerMove,
    onHeaderPointerUp: endDrag,
    onHeaderPointerCancel: endDrag,
  }
}
