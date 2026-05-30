'use client'

import { Suspense, useEffect } from 'react'
import { PhoneSwap } from '@/components/PhoneSwap'
import { FlowChapterSlideLayout } from '@/components/chapter-slide/FlowChapterSlideLayout'
import { PhoneSwapBoundary } from '@/components/phone-swap/PhoneSwapBoundary'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { MobileLearnMore } from '@/components/mobile/MobileLearnMore'
import {
  MobileLabelGrid,
  MobileProse,
  MobileSubStory,
  splitParagraphs,
} from '@/components/mobile/MobileSectionParts'
import { MOBILE_SENSI, mobileChapterId } from '@/lib/mobile/content'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { useChapterPanelOpacity } from '@/lib/useChapterPanelOpacity'

export function MobileSensiSection() {
  const chapterId = mobileChapterId('sensi')
  const panel = useChapterPanelOpacity(chapterId)
  const { phase, activeSlideId, reveals } = useChapterNav()

  // #region agent log
  useEffect(() => {
    const slot = document.querySelector<HTMLElement>(
      `[data-chapter-id="${chapterId}"]`,
    )
    const panelEl = slot?.querySelector<HTMLElement>('.portfolio-chapter-panel')
    const overviewReveal = reveals['mobile-overview'] ?? 0
    const canvas = slot?.querySelector<HTMLCanvasElement>(
      '.phone-swap__canvas-hit canvas',
    )
    const canvasRect = canvas?.getBoundingClientRect()
    debugLog(
      'MobileSensiSection.tsx:panel',
      'mobile-sensi panel visibility',
      {
        chapterId,
        phase,
        activeSlideId,
        scrollReveal: panel.opacity,
        overviewReveal,
        isActive: panel.isActive,
        inlineOpacity: panelEl?.style.opacity ?? null,
        panelOpacity: panelEl ? getComputedStyle(panelEl).opacity : null,
        panelZIndex: panelEl ? getComputedStyle(panelEl).zIndex : null,
        slotFound: !!slot,
        canvasRectW: canvasRect?.width ?? 0,
        canvasRectH: canvasRect?.height ?? 0,
        canvasClientH: canvas?.clientHeight ?? 0,
      },
      'D',
      'post-fix',
    )
  }, [chapterId, panel.opacity, panel.isActive, phase, activeSlideId, reveals])
  // #endregion
  const [color, install, platform] = MOBILE_SENSI.subStories
  const intro = splitParagraphs(MOBILE_SENSI.intro)

  return (
    <FlowChapterSlideLayout
      chapterId={chapterId}
      fillViewport
      className="mobile-chapter-slot mobile-chapter-slot--sensi"
      stage={
        <PhoneSwapBoundary key="phone-swap-3d">
          <Suspense
            fallback={
              <p className="phone-swap__fallback">Loading 3D preview…</p>
            }
          >
            <PhoneSwap />
          </Suspense>
        </PhoneSwapBoundary>
      }
      copy={
        <MobileLearnMore
          headline={MOBILE_SENSI.headline}
          meta={MOBILE_SENSI.meta}
        >
          <MobileProse paragraphs={intro} />
          <div className="mobile-sub-stories">
            <MobileSubStory heading={color.heading}>
              <MobileProse paragraphs={splitParagraphs(color.body)} />
              <MobileLabelGrid items={color.problems} columns={3} />
            </MobileSubStory>
            <MobileSubStory heading={install.heading}>
              <MobileProse paragraphs={splitParagraphs(install.body)} />
              <blockquote className="mobile-blockquote">
                <p>{install.quote}</p>
              </blockquote>
            </MobileSubStory>
            <MobileSubStory heading={platform.heading}>
              <MobileProse paragraphs={splitParagraphs(platform.body)} />
              <aside className="mobile-thesis-close">
                <p>{platform.thesisClose}</p>
              </aside>
            </MobileSubStory>
          </div>
        </MobileLearnMore>
      }
    />
  )
}
