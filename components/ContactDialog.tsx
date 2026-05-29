'use client'

import {
  CONTACT_EMAIL_MAX,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
  type ContactFormStatus,
} from '@/lib/contactForm'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
}

export function ContactDialog({ open, onClose }: Props) {
  const titleId = useId()
  const descId = useId()
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<ContactFormStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const startedAtRef = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    startedAtRef.current = Date.now()
    setStatus('idle')
    setError(null)
  }, [open])

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
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setError(null)
      setStatus('sending')

      const form = e.currentTarget
      const data = new FormData(form)

      const payload = {
        name: String(data.get('name') ?? '').trim(),
        replyEmail: String(data.get('replyEmail') ?? '').trim(),
        message: String(data.get('message') ?? '').trim(),
        company: String(data.get('company') ?? '').trim(),
        formStartedAt: startedAtRef.current,
      }

      try {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const json = (await res.json().catch(() => ({}))) as {
          error?: string
        }
        if (!res.ok) {
          setError(json.error ?? 'Could not send message')
          setStatus('error')
          return
        }
        setStatus('sent')
        form.reset()
      } catch {
        setError(
          'Network error — use LinkedIn or try again when the site is deployed.',
        )
        setStatus('error')
      }
    },
    [],
  )

  if (!mounted || !open) return null

  return createPortal(
    <div
      className="contact-dialog"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        className="contact-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <button
          type="button"
          className="contact-dialog__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        <h2 id={titleId} className="contact-dialog__title">
          Send a message
        </h2>
        <p id={descId} className="contact-dialog__desc">
          Your email stays off this page. I&apos;ll reply from my inbox.
        </p>

        {status === 'sent' ? (
          <p className="contact-dialog__success" role="status">
            Thanks — message sent. I&apos;ll get back to you soon.
          </p>
        ) : (
          <form className="contact-form" onSubmit={onSubmit} noValidate>
            <div className="contact-form__honeypot" aria-hidden>
              <label htmlFor="contact-company">Company</label>
              <input
                id="contact-company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <label className="contact-form__field">
              <span className="contact-form__label">Name</span>
              <input
                name="name"
                type="text"
                required
                maxLength={CONTACT_NAME_MAX}
                autoComplete="name"
                disabled={status === 'sending'}
              />
            </label>

            <label className="contact-form__field">
              <span className="contact-form__label">Your email</span>
              <input
                name="replyEmail"
                type="email"
                required
                maxLength={CONTACT_EMAIL_MAX}
                autoComplete="email"
                inputMode="email"
                disabled={status === 'sending'}
              />
            </label>

            <label className="contact-form__field">
              <span className="contact-form__label">Message</span>
              <textarea
                name="message"
                required
                minLength={CONTACT_MESSAGE_MIN}
                maxLength={CONTACT_MESSAGE_MAX}
                rows={5}
                disabled={status === 'sending'}
              />
            </label>

            {error ? (
              <p className="contact-form__error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="contact-form__actions">
              <button
                type="button"
                className="contact-form__btn contact-form__btn--ghost"
                onClick={onClose}
                disabled={status === 'sending'}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="contact-form__btn contact-form__btn--primary"
                disabled={status === 'sending'}
              >
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  )
}
