import { PortfolioInterludeGlyphs } from '@/components/PortfolioInterludeGlyphs'

/**
 * Full-viewport pause between the hero and the first section — quiet room for
 * the sidebar nav to travel up and pin before the portfolio content begins.
 * A gooey dust cycle of the four section glyphs sits above the statement copy.
 */
export function PortfolioInterlude() {
  return (
    <section className="portfolio-interlude" aria-label="Working philosophy">
      <PortfolioInterludeGlyphs />
      <div className="portfolio-interlude__copy">
        <p className="portfolio-interlude__headline">
          I shape each product to work at its best, while understanding how it
          can and should interconnect with the others.
        </p>
        <p className="portfolio-interlude__body">
          That is how strengths compound, weaknesses are offset, and the whole
          becomes more stable than any one product could be alone.
        </p>
      </div>
    </section>
  )
}
