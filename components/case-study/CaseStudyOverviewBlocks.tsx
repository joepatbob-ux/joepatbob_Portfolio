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

function OverviewPatentCell({ patent }: { patent: OverviewPatentEntry }) {
  return (
    <div className="case-study-overview-patent">
      <p className="case-study-overview-patent__number">{patent.number}</p>
      {patent.title ? (
        <p className="case-study-overview-patent__title">{patent.title}</p>
      ) : null}
      {patent.status ? (
        <p className="case-study-overview-patent__status">{patent.status}</p>
      ) : null}
    </div>
  )
}

function OverviewPatentsBlock({ items }: { items: readonly OverviewPatentEntry[] }) {
  return (
    <section className="case-study-overview-block case-study-overview-block--patents">
      <h3 className="case-study-overview-block__label">Patents</h3>
      <div className="case-study-overview-patents">
        {items.map((patent) => (
          <OverviewPatentCell key={`${patent.number}-${patent.title ?? ''}`} patent={patent} />
        ))}
      </div>
    </section>
  )
}

function OverviewAwardBlock({ product, headline, detail }: OverviewAwardBlock) {
  return (
    <section className="case-study-overview-block case-study-overview-block--award">
      <h3 className="case-study-overview-block__label">Award</h3>
      <div className="case-study-overview-awards">
        <div className="case-study-overview-award">
          <p className="case-study-overview-award__product">{product}</p>
          <p className="case-study-overview-award__headline">{headline}</p>
          {detail ? (
            <p className="case-study-overview-award__detail">{detail}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function OverviewHighlightBlock({ label, headline, detail }: OverviewHighlightBlock) {
  return (
    <section className="case-study-overview-block case-study-overview-block--highlight">
      <h3 className="case-study-overview-block__label">{label}</h3>
      <aside className="case-study-overview-highlight">
        <p className="case-study-overview-highlight__headline">{headline}</p>
        {detail ? <p className="case-study-overview-highlight__detail">{detail}</p> : null}
      </aside>
    </section>
  )
}

function OverviewQuoteBlock({ quote, attribution }: OverviewQuoteBlock) {
  return (
    <section className="case-study-overview-block case-study-overview-block--quote">
      <figure className="case-study-overview-quote">
        <span
          className="case-study-overview-quote__mark case-study-overview-quote__mark--open"
          aria-hidden
        >
          &ldquo;
        </span>
        <blockquote className="case-study-overview-quote__text">
          <p>{quote}</p>
        </blockquote>
        <span
          className="case-study-overview-quote__mark case-study-overview-quote__mark--close"
          aria-hidden
        >
          &rdquo;
        </span>
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
