import { useEffect, useState } from 'react'
import { InterludeLayoutPicker } from '@/components/InterludeLayoutPicker'
import { PortfolioInterludeGlyphs } from '@/components/PortfolioInterludeGlyphs'
import { readInterludeCopyStyle, type InterludeCopyStyle } from '@/lib/interludeCopyStyle'
import { readInterludeLayout, type InterludeLayout } from '@/lib/interludeLayout'

const HEADLINE =
  'I shape each product to work at its best, while understanding how it can and should interconnect with the others.'
const BODY =
  'That is how strengths compound, weaknesses are offset, and the whole becomes more stable than any one product could be alone.'

function InterludeHeadline({ copyStyle }: { copyStyle: InterludeCopyStyle }) {
  if (copyStyle === 'rhythm') {
    return (
      <p className="portfolio-interlude__headline">
        I shape each product to work at its best,
        <br />
        while understanding how it can and should interconnect with the others.
      </p>
    )
  }
  return <p className="portfolio-interlude__headline">{HEADLINE}</p>
}

function InterludeBody({ copyStyle }: { copyStyle: InterludeCopyStyle }) {
  if (copyStyle === 'pull') {
    return (
      <blockquote className="portfolio-interlude__body portfolio-interlude__pull">
        <p>{BODY}</p>
      </blockquote>
    )
  }
  return <p className="portfolio-interlude__body">{BODY}</p>
}

function InterludeCopy({
  part,
  copyStyle,
}: {
  part?: 'headline' | 'body'
  copyStyle: InterludeCopyStyle
}) {
  if (copyStyle === 'continuous' && !part) {
    return (
      <div className="portfolio-interlude__copy portfolio-interlude__copy--continuous">
        <p className="portfolio-interlude__continuous">
          <span className="portfolio-interlude__continuous-lead">{HEADLINE}</span> {BODY}
        </p>
      </div>
    )
  }

  if (copyStyle === 'continuous' && part) {
    if (part === 'headline') {
      return <p className="portfolio-interlude__headline">{HEADLINE}</p>
    }
    return <p className="portfolio-interlude__body">{BODY}</p>
  }

  if (part === 'headline') {
    return <InterludeHeadline copyStyle={copyStyle} />
  }
  if (part === 'body') {
    return <InterludeBody copyStyle={copyStyle} />
  }

  return (
    <div
      className={[
        'portfolio-interlude__copy',
        `portfolio-interlude__copy--${copyStyle}`,
      ].join(' ')}
    >
      <InterludeHeadline copyStyle={copyStyle} />
      <InterludeBody copyStyle={copyStyle} />
    </div>
  )
}

function InterludeContent({
  layout,
  copyStyle,
}: {
  layout: InterludeLayout
  copyStyle: InterludeCopyStyle
}) {
  switch (layout) {
    case 'sandwich':
      return (
        <>
          <InterludeCopy part="headline" copyStyle={copyStyle} />
          <PortfolioInterludeGlyphs />
          <InterludeCopy part="body" copyStyle={copyStyle} />
        </>
      )
    case 'split':
      return (
        <div className="portfolio-interlude__row">
          <PortfolioInterludeGlyphs />
          <InterludeCopy copyStyle={copyStyle} />
        </div>
      )
    case 'editorial':
      return (
        <div className="portfolio-interlude__row portfolio-interlude__row--editorial">
          <InterludeCopy copyStyle={copyStyle} />
          <PortfolioInterludeGlyphs />
        </div>
      )
    case 'stack':
    default:
      return (
        <>
          <PortfolioInterludeGlyphs />
          <InterludeCopy copyStyle={copyStyle} />
        </>
      )
  }
}

/**
 * Full-viewport pause between the hero and the first section — quiet room for
 * the sidebar nav to travel up and pin before the portfolio content begins.
 *
 * Dev: `?interludeLayout=1` page layouts; `?interludeCopy=1` copy typography.
 */
export function PortfolioInterlude() {
  const [layout, setLayout] = useState<InterludeLayout>('stack')
  const [copyStyle, setCopyStyle] = useState<InterludeCopyStyle>('classic')

  useEffect(() => {
    setLayout(readInterludeLayout())
    setCopyStyle(readInterludeCopyStyle())
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
      <InterludeLayoutPicker
        layout={layout}
        copyStyle={copyStyle}
        onLayoutChange={setLayout}
        onCopyStyleChange={setCopyStyle}
      />
      <InterludeContent layout={layout} copyStyle={copyStyle} />
    </section>
  )
}
