import { parseScopeEntry } from '@/lib/case-study/parseScopeEntry'
import type {
  OverviewAwardBlock,
  OverviewBlock,
  OverviewHighlightBlock,
  OverviewPatentEntry,
  OverviewQuoteBlock,
} from '@/lib/types'

function OverviewScopeBlock({ items }: { items: readonly string[] }) {
  return (
    <section className="case-study-overview-block case-study-overview-block--scope">
      <h3 className="case-study-overview-block__label">Scope</h3>
      <dl
        className={[
          'case-study-overview-scope',
          items.length % 2 === 1 ? 'case-study-overview-scope--odd' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {items.map((entry) => {
          const { name, detail } = parseScopeEntry(entry)
          return (
            <div key={entry} className="case-study-overview-scope__cell">
              <dd className="case-study-overview-scope__name">{name}</dd>
              {detail ? (
                <dd className="case-study-overview-scope__detail">{detail}</dd>
              ) : null}
            </div>
          )
        })}
      </dl>
    </section>
  )
}

/**
 * Credential entry: name + optional title on the left, mono meta on the right.
 */
function OverviewLeaderRow({
  name,
  title,
  meta,
}: {
  name: string
  title?: string | null
  meta?: string | null
}) {
  return (
    <div className="case-study-overview-row">
      <span className="case-study-overview-row__lead">
        <span className="case-study-overview-row__name">{name}</span>
        {title ? (
          <span className="case-study-overview-row__title">{title}</span>
        ) : null}
      </span>
      {meta ? <span className="case-study-overview-row__meta">{meta}</span> : null}
    </div>
  )
}

function OverviewPatentsBlock({ items }: { items: readonly OverviewPatentEntry[] }) {
  return (
    <section className="case-study-overview-block case-study-overview-block--patents">
      <h3 className="case-study-overview-block__label">Patents</h3>
      <div className="case-study-overview-rows">
        {items.map((patent) => (
          <OverviewLeaderRow
            key={`${patent.number}-${patent.title ?? ''}`}
            name={patent.number}
            title={patent.title}
            meta={patent.status}
          />
        ))}
      </div>
    </section>
  )
}

function OverviewAwardBlock({ product, headline, detail }: OverviewAwardBlock) {
  return (
    <section className="case-study-overview-block case-study-overview-block--award">
      <h3 className="case-study-overview-block__label">Award</h3>
      <div className="case-study-overview-rows">
        <OverviewLeaderRow name={product} title={headline} meta={detail} />
      </div>
    </section>
  )
}

function OverviewHighlightBlock({ label, headline, detail }: OverviewHighlightBlock) {
  return (
    <section className="case-study-overview-block case-study-overview-block--highlight">
      <h3 className="case-study-overview-block__label">{label}</h3>
      <div className="case-study-overview-rows">
        <OverviewLeaderRow name={headline} meta={detail} />
      </div>
    </section>
  )
}

function OverviewQuoteBlock({ quote, attribution }: OverviewQuoteBlock) {
  return (
    <section className="case-study-overview-block case-study-overview-block--quote">
      <figure className="case-study-overview-quote">
        <blockquote className="case-study-overview-quote__text">
          <p>
            <span className="case-study-overview-quote__mark" aria-hidden>
              {'“'}
            </span>
            {quote}
            <span className="case-study-overview-quote__mark" aria-hidden>
              {'”'}
            </span>
          </p>
        </blockquote>
        {attribution ? (
          <figcaption className="case-study-overview-quote__attr">
            {attribution}
          </figcaption>
        ) : null}
      </figure>
    </section>
  )
}

interface Props {
  blocks: readonly OverviewBlock[]
}

/** Overview metadata — scope grid plus optional patents / award containers. */
export function CaseStudyOverviewBlocks({ blocks }: Props) {
  if (blocks.length === 0) return null

  return (
    <div className="case-study-overview-blocks" aria-label="Project details">
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'scope':
            return <OverviewScopeBlock key={`scope-${index}`} items={block.items} />
          case 'patents':
            return <OverviewPatentsBlock key={`patents-${index}`} items={block.items} />
          case 'award':
            return <OverviewAwardBlock key={`award-${index}`} {...block} />
          case 'highlight':
            return <OverviewHighlightBlock key={`highlight-${index}`} {...block} />
          case 'quote':
            return <OverviewQuoteBlock key={`quote-${index}`} {...block} />
          default:
            return null
        }
      })}
    </div>
  )
}
