'use client'

import { useContactForm } from '@/components/ContactFormProvider'
import {
  CONTACT_EMAIL_MAILTO,
  CONTACT_LINKEDIN_URL,
} from '@/lib/contact'

export function ContactButton() {
  const { openContact } = useContactForm()

  return (
    <div
      className="contact-liquid contact-liquid--with-message"
      aria-label="Contact — email, message, or LinkedIn"
    >
      <div className="contact-liquid__surface">
        <span className="contact-liquid__label" aria-hidden>
          Contact
        </span>
        <div className="contact-liquid__split">
          <a
            className="contact-liquid__btn contact-liquid__btn--email"
            href={CONTACT_EMAIL_MAILTO}
          >
            Email
          </a>
          <button
            type="button"
            className="contact-liquid__btn contact-liquid__btn--message"
            onClick={openContact}
          >
            Message
          </button>
          <a
            className="contact-liquid__btn contact-liquid__btn--linkedin"
            href={CONTACT_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  )
}
