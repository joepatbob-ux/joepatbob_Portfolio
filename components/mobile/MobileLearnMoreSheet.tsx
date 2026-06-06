'use client'

import { useDialogFocusTrap } from '@/lib/hooks/useDialogFocusTrap'
import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
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

  useDialogFocusTrap(panelRef, open)

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
          <div
            className="mobile-learn-more-sheet__rule mobile-section-header__rule"
            aria-hidden
          />
        </div>
        <div className="mobile-learn-more-sheet__scroll">
          <span
            className="mobile-learn-more-sheet__edge-blur mobile-learn-more-sheet__edge-blur--top"
            aria-hidden
          />
          <div className="mobile-learn-more-sheet__body">{children}</div>
          <span
            className="mobile-learn-more-sheet__edge-blur mobile-learn-more-sheet__edge-blur--bottom"
            aria-hidden
          />
        </div>
        <div className="mobile-learn-more-sheet__footer overlay-action-footer">
          <OverlayActionPill variant="secondary" onClick={onClose}>
            Close
          </OverlayActionPill>
        </div>
      </div>
    </div>,
    document.body,
  )
}
