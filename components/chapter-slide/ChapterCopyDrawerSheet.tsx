'use client'

import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function ChapterCopyDrawerSheet({ open, onClose, title, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
  }, [open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="chapter-copy-drawer"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="chapter-copy-drawer__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="chapter-copy-drawer__header">
          <h2 id={titleId} className="chapter-copy-drawer__title">
            {title}
          </h2>
          <div
            className="chapter-copy-drawer__rule mobile-section-header__rule"
            aria-hidden
          />
        </div>
        <div className="chapter-copy-drawer__scroll">
          <span
            className="chapter-copy-drawer__edge-blur chapter-copy-drawer__edge-blur--top"
            aria-hidden
          />
          <div className="chapter-copy-drawer__body">{children}</div>
          <span
            className="chapter-copy-drawer__edge-blur chapter-copy-drawer__edge-blur--bottom"
            aria-hidden
          />
        </div>
        <div className="chapter-copy-drawer__footer overlay-action-footer">
          <OverlayActionPill variant="secondary" onClick={onClose}>
            Close
          </OverlayActionPill>
        </div>
      </div>
    </div>,
    document.body,
  )
}
