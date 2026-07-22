import { useEffect, useState } from 'react'
import { useContentDebug } from '@/components/ContentDebugProvider'
import dynamic from '@/lib/dynamic'
import { PortfolioInterludeGlyphs } from '@/components/PortfolioInterludeGlyphs'
import { readInterludeCopyStyle, type InterludeCopyStyle } from '@/lib/interludeCopyStyle'
import { readInterludeLayout, type InterludeLayout } from '@/lib/interludeLayout'

/* Dev-only picker (?interludeLayout=1 / ?interludeCopy=1) — flag-gated lazy
 * mount so its chunk never loads on a normal visit. */
const InterludeLayoutPicker = dynamic(
  () =>
    import('@/components/InterludeLayoutPicker').then((m) => ({
      default: m.InterludeLayoutPicker,
    })),
  { loading: () => null },
)

function interludeDevPickerRequested(): boolean {
  if (typeof window === 'undefined') return false
  if (process.env.NODE_ENV === 'production') return false
  const params = new URLSearchParams(window.location.search)
  return params.has('interludeLayout') || params.has('interludeCopy')
}

export const INTERLUDE_HEADLINE =
  'The experience is bigger than any one product or team.'
export const INTERLUDE_BODY =
  'Hardware, software, brand, sales, support, and the people behind them all shape what reaches the user. I look for the patterns that connect them, so each decision can solve the immediate problem while strengthening the larger experience.'

function useInterludeCopy() {
  const { text } = useContentDebug()
  return {
    headline: text('interlude#headline', INTERLUDE_HEADLINE),
    body: text('interlude#body', INTERLUDE_BODY),
  }
}

function InterludeHeadline({
  copyStyle,
  headline,
}: {
  copyStyle: InterludeCopyStyle
  headline: string
}) {
  if (copyStyle === 'rhythm') {
    const [lead, tail] = headline.split(' than ')
    if (tail) {
      return (
        <p className="portfolio-interlude__headline">
          {lead}
          <br />
          than {tail}
        </p>
      )
    }
  }
  return <p className="portfolio-interlude__headline">{headline}</p>
}

/* Break the body onto a new line at the second sentence ("I look for …"),
 * with a gap between the two lines (see .portfolio-interlude__body-line).
 * Falls back to the whole string when overridden copy lacks that phrase. */
function renderBodyLines(body: string) {
  const [lead, tail] = body.split(/\s+(?=I look for )/)
  if (tail) {
    return (
      <>
        <span className="portfolio-interlude__body-line">{lead}</span>
        <span className="portfolio-interlude__body-line">{tail}</span>
      </>
    )
  }
  return body
}

function InterludeBody({ copyStyle, body }: { copyStyle: InterludeCopyStyle; body: string }) {
  if (copyStyle === 'pull') {
    return (
      <blockquote className="portfolio-interlude__body portfolio-interlude__pull">
        <p>{renderBodyLines(body)}</p>
      </blockquote>
    )
  }
  return <p className="portfolio-interlude__body">{renderBodyLines(body)}</p>
}

function InterludeCopy({
  part,
  copyStyle,
  headline,
  body,
}: {
  part?: 'headline' | 'body'
  copyStyle: InterludeCopyStyle
  headline: string
  body: string
}) {
  if (copyStyle === 'continuous' && !part) {
    return (
      <div className="portfolio-interlude__copy portfolio-interlude__copy--continuous">
        <p className="portfolio-interlude__continuous">
          <span className="portfolio-interlude__continuous-lead">{headline}</span> {body}
        </p>
      </div>
    )
  }

  if (copyStyle === 'continuous' && part) {
    if (part === 'headline') {
      return <p className="portfolio-interlude__headline">{headline}</p>
    }
    return <p className="portfolio-interlude__body">{body}</p>
  }

  if (part === 'headline') {
    return <InterludeHeadline copyStyle={copyStyle} headline={headline} />
  }
  if (part === 'body') {
    return <InterludeBody copyStyle={copyStyle} body={body} />
  }

  return (
    <div
      className={[
        'portfolio-interlude__copy',
        `portfolio-interlude__copy--${copyStyle}`,
      ].join(' ')}
    >
      <InterludeHeadline copyStyle={copyStyle} headline={headline} />
      <InterludeBody copyStyle={copyStyle} body={body} />
    </div>
  )
}

function InterludeContent({
  layout,
  copyStyle,
  headline,
  body,
}: {
  layout: InterludeLayout
  copyStyle: InterludeCopyStyle
  headline: string
  body: string
}) {
  const copyProps = { copyStyle, headline, body }
  switch (layout) {
    case 'sandwich':
      return (
        <>
          <InterludeCopy part="headline" {...copyProps} />
          <PortfolioInterludeGlyphs />
          <InterludeCopy part="body" {...copyProps} />
        </>
      )
    case 'split':
      return (
        <div className="portfolio-interlude__row">
          <PortfolioInterludeGlyphs />
          <InterludeCopy {...copyProps} />
        </div>
      )
    case 'editorial':
      return (
        <div className="portfolio-interlude__row portfolio-interlude__row--editorial">
          <InterludeCopy {...copyProps} />
          <PortfolioInterludeGlyphs />
        </div>
      )
    case 'stack':
    default:
      return (
        <>
          <PortfolioInterludeGlyphs />
          <InterludeCopy {...copyProps} />
        </>
      )
  }
}

/**
 * Full-viewport pause between the hero and the first section — quiet room for
 * the sidebar nav to travel up and pin before the portfolio content begins.
 *
 * Dev: `?interludeLayout=1` page layouts; `?interludeCopy=1` copy typography;
 * `?contentDebug=1` per-page copy overrides.
 */
export function PortfolioInterlude() {
  const [layout, setLayout] = useState<InterludeLayout>('stack')
  const [copyStyle, setCopyStyle] = useState<InterludeCopyStyle>('classic')
  const [pickerOn, setPickerOn] = useState(false)
  const { headline, body } = useInterludeCopy()

  useEffect(() => {
    setLayout(readInterludeLayout())
    setCopyStyle(readInterludeCopyStyle())
    setPickerOn(interludeDevPickerRequested())
  }, [])

  return (
    <section
      id="portfolio-interlude"
      className={[
        'portfolio-interlude',
        `portfolio-interlude--${layout}`,
        `portfolio-interlude--copy-${copyStyle}`,
      ].join(' ')}
      aria-label="Working philosophy"
    >
      {pickerOn ? (
        <InterludeLayoutPicker
          layout={layout}
          copyStyle={copyStyle}
          onLayoutChange={setLayout}
          onCopyStyleChange={setCopyStyle}
        />
      ) : null}
      <InterludeContent
        layout={layout}
        copyStyle={copyStyle}
        headline={headline}
        body={body}
      />
    </section>
  )
}
