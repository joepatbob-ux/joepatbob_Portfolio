import {
  CONTACT_EMAIL_MAILTO,
  CONTACT_LINKEDIN_URL,
} from '@/lib/contact'
import { engagementSummary, trackEvent } from '@/lib/analytics'

// Engagement rides along so the dashboard shows what a converting visit
// looks like (time on site + chapters read before reaching out).
const trackContact = (channel: 'email' | 'linkedin') => () =>
  trackEvent('contact', { channel, engaged: engagementSummary() })

interface Props {
  /** `liquid` — desktop sidebar hover split; `panel` — mobile drawer chapter pills */
  variant?: 'liquid' | 'panel'
}

export function ContactButton({ variant = 'liquid' }: Props) {
  if (variant === 'panel') {
    return (
      <nav className="sidebar-contact-panel" aria-label="Contact">
        <a
          className="sidebar-nav-pill sidebar-subnav__chapter"
          href={CONTACT_EMAIL_MAILTO}
          onClick={trackContact('email')}
        >
          Email
        </a>
        <a
          className="sidebar-nav-pill sidebar-subnav__chapter"
          href={CONTACT_LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackContact('linkedin')}
        >
          LinkedIn
        </a>
      </nav>
    )
  }

  return (
    <nav className="contact-liquid" aria-label="Contact">
      <div className="contact-liquid__surface">
        <span className="contact-liquid__label" aria-hidden>
          Contact
        </span>
        <div className="contact-liquid__split">
          <a
            className="contact-liquid__btn contact-liquid__btn--email"
            href={CONTACT_EMAIL_MAILTO}
            onClick={trackContact('email')}
          >
            Email
          </a>
          <a
            className="contact-liquid__btn contact-liquid__btn--linkedin"
            href={CONTACT_LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={trackContact('linkedin')}
          >
            LinkedIn
          </a>
        </div>
      </div>
    </nav>
  )
}
