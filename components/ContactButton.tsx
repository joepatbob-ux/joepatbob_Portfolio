'use client'

const EMAIL = 'me@joepatbob.com'
const LINKEDIN_URL = 'https://www.linkedin.com/in/joepatbob'

export function ContactButton() {
  return (
    <div className="contact-liquid" aria-label="Contact — email or LinkedIn">
      <div className="contact-liquid__surface">
        <span className="contact-liquid__label" aria-hidden>
          Contact
        </span>
        <div className="contact-liquid__split">
          <a
            className="contact-liquid__btn contact-liquid__btn--email"
            href={`mailto:${EMAIL}`}
          >
            Email
          </a>
          <a
            className="contact-liquid__btn contact-liquid__btn--linkedin"
            href={LINKEDIN_URL}
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
