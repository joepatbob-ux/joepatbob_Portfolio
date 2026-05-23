import type { ReactNode } from 'react'
import { splitParagraphs } from '@/components/mobile/MobileSectionParts'

export { splitParagraphs }

export function EibIntroProse({ text }: { text: string }) {
  return (
    <div className="eib-intro-prose mobile-prose">
      {splitParagraphs(text).map((p, i) => (
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
          <dd className="eib-patent-row__status">({p.status})</dd>
        </div>
      ))}
    </dl>
  )
}

export function EibPracticeClose({
  statement,
  email,
  linkedIn,
}: {
  statement: string
  email: string
  linkedIn: string
}) {
  return (
    <footer className="eib-practice-close">
      <p className="eib-practice-close__statement">{statement}</p>
      <p className="eib-practice-close__cta">
        <a href={`mailto:${email}`}>{email}</a>
        <span className="eib-practice-close__sep" aria-hidden>
          ·
        </span>
        <a
          href={`https://${linkedIn}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkedIn}
        </a>
      </p>
    </footer>
  )
}

export function EibSubSectionIntro({ children }: { children: ReactNode }) {
  return <div className="eib-sub-intro mobile-prose">{children}</div>
}
