'use client'

import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function MobileLearnMoreSheet({ open, onClose, title, children }: Props) {
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

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="mobile-learn-more-sheet"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="mobile-learn-more-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="mobile-learn-more-sheet__header">
          <h2 id={titleId} className="mobile-learn-more-sheet__title">
            {title}
          </h2>
          <button
            type="button"
            className="mobile-learn-more-sheet__close"
            aria-label="Close"
            onClick={onClose}
          >
            <span aria-hidden>×</span>
          </button>
        </div>
        <div className="mobile-learn-more-sheet__body">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
