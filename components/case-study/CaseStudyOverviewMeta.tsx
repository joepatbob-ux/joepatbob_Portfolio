import type { OverviewMetaItem } from '@/lib/types'

interface Props {
  items: readonly OverviewMetaItem[]
}

/** Key–value metadata — tile grid + full-width bands; label over value inside each block. */
export function CaseStudyOverviewMeta({ items }: Props) {
  if (items.length === 0) return null

  const compact = items.filter((item) => !item.wide)
  const wide = items.filter((item) => item.wide)
  const split = compact.length > 0 && wide.length > 0

  return (
    <aside
      className={[
        'case-study-overview-meta',
        split ? 'case-study-overview-meta--split' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Project details"
    >
      {compact.length > 0 ? (
        <dl
          className={[
            'case-study-overview-meta__tiles',
            compact.length % 2 === 1
              ? 'case-study-overview-meta__tiles--odd'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {compact.map((item) => (
            <div key={item.label} className="case-study-overview-meta__tile">
              <dt className="case-study-overview-meta__key">{item.label}</dt>
              <dd className="case-study-overview-meta__value">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {wide.length > 0 ? (
        <dl className="case-study-overview-meta__bands">
          {wide.map((item) => (
            <div key={item.label} className="case-study-overview-meta__band">
              <dt className="case-study-overview-meta__key">{item.label}</dt>
              <dd className="case-study-overview-meta__value">{item.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </aside>
  )
}
