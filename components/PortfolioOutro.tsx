import { EibPracticeClose } from '@/components/everything-in-between/EibSectionParts'
import { EIB_PRACTICE } from '@/lib/everything-in-between/content'
import { useContentDebug } from '@/components/ContentDebugProvider'

/**
 * Full-viewport closing page after the last chapter — bookends the
 * hero → interlude opening with a quiet landing, and gives page-end momentum a
 * real page to settle on instead of bouncing at the bottom of the tall final
 * chapter. The statement + contact move here out of the last chapter's copy.
 */
export function PortfolioOutro() {
  const { text } = useContentDebug()
  const statement = text(
    'everything-in-between/practice/chapter#close',
    EIB_PRACTICE.close,
  )

  return (
    <section
      id="portfolio-outro"
      className="portfolio-outro"
      aria-label="Closing"
    >
      <EibPracticeClose statement={statement} />
    </section>
  )
}
