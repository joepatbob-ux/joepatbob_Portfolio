import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_MAILTO,
  CONTACT_LINKEDIN_URL,
  CONTACT_RESUME_URL,
} from '@/lib/contact'
import { engagementSummary, trackEvent } from '@/lib/analytics'
import { parseChapterBody } from '@/lib/chapter-slide/parseChapterBody'

const trackContact = (channel: 'email' | 'linkedin' | 'resume') => () =>
  trackEvent('contact', { channel, engaged: engagementSummary() })

export function EibIntroProse({ text }: { text: string }) {
  return (
    <div className="eib-intro-prose mobile-prose">
      {parseChapterBody(text).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  )
}

export function EibPrinciplesList({
  items,
}: {
  items: readonly { num: string; statement: string }[]
}) {
  return (
    <ol className="eib-principles" role="list">
      {items.map((item) => (
        <li key={item.num} className="eib-principles__item">
          <span className="eib-principles__num" aria-hidden>
            {item.num}
          </span>
          <p className="eib-principles__statement">{item.statement}</p>
        </li>
      ))}
    </ol>
  )
}

export function EibPatentRow({
  patents,
}: {
  patents: readonly {
    number: string
    title: string
    status: string
  }[]
}) {
  return (
    <dl className="eib-patent-row">
      {patents.map((p) => (
        <div key={p.number} className="eib-patent-row__item">
          <dt className="eib-patent-row__number">
            {p.number}
            {p.title ? ` — ${p.title}` : ''}
          </dt>
          <dd className="eib-patent-row__status">
            {p.status ? `(${p.status})` : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}

export function EibPracticeClose({ statement }: { statement: string }) {
  return (
    <footer className="eib-practice-close">
      <p className="eib-practice-close__statement">{statement}</p>
      <p className="eib-practice-close__cta">
        <a
          className="eib-practice-close__email"
          href={CONTACT_EMAIL_MAILTO}
          aria-label={`Email ${CONTACT_EMAIL}`}
          onClick={trackContact('email')}
        >
          Email
        </a>
        <span className="eib-practice-close__sep" aria-hidden>
          ·
        </span>
        <a
          href={CONTACT_LINKEDIN_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackContact('linkedin')}
        >
          LinkedIn
        </a>
        <span className="eib-practice-close__sep" aria-hidden>
          ·
        </span>
        <a
          href={CONTACT_RESUME_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={trackContact('resume')}
        >
          Resume
        </a>
      </p>
    </footer>
  )
}
