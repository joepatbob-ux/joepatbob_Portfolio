'use client'

import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { useDialogFocusTrap } from '@/lib/hooks/useDialogFocusTrap'
import { useVisualViewportOverlay } from '@/lib/hooks/useVisualViewportOverlay'
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
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useVisualViewportOverlay(rootRef, open)
  useDialogFocusTrap(panelRef, open)
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div ref={rootRef} className="mobile-learn-more-sheet" data-state="open">
      <button
        type="button"
        className="mobile-learn-more-sheet__scrim"
        aria-label="Close panel"
        onClick={onClose}
      />
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
        <div className="mobile-learn-more-sheet__body">{children}</div>
        <div className="mobile-learn-more-sheet__footer overlay-action-footer">
          <OverlayActionPill variant="primary" onClick={onClose}>
            Close
          </OverlayActionPill>
        </div>
      </div>
    </div>,
    document.body,
  )
}
