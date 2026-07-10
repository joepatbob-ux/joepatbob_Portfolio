import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { Sticker } from '@/components/Sticker'
import { useStickers } from '@/components/StickerProvider'
import { useLayoutMobile } from '@/lib/hooks/useLayoutMobile'
import { useLayoutTopBarNav } from '@/lib/hooks/useLayoutTopBarNav'
import { eibChapterId } from '@/lib/everything-in-between/content'
import { activeSlideIdPublished, chapterRevealForId } from '@/lib/scroll/chapterSlideshow'
import { CHAPTER_STAGE_PAINT_VISIBILITY } from '@/lib/scroll/chapterVisibility'
import { isContinuousChapters } from '@/lib/scroll/continuousChapters'
import { pileRotationForId, pileScatterOffsetForId } from '@/lib/stickers'
import { scheduleScrollFrame } from '@/lib/scroll/scrollFrame'
import { useAnchorPortalFollow } from '@/lib/hooks/useAnchorPortalFollow'
import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'

const PRACTICE_CHAPTER_ID = eibChapterId('practice')

export function StickerPile() {
  const { deck, deckReady, activeDrag, beginDragFromPile, zIndices, stickerHeights } =
    useStickers()
  const layoutMobile = useLayoutMobile()
  const topBarNav = useLayoutTopBarNav()
  const inFlowScroll = topBarNav || isContinuousChapters()
  const { activeSlideId } = useChapterNav()
  const anchorRef = useRef<HTMLDivElement>(null)
  const pileVisibleRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  const [pileVisible, setPileVisible] = useState(false)

  useEffect(() => {
    setMounted(true)
    document
      .querySelectorAll<HTMLElement>('body > .sticker-pile-portal:not([data-sticker-managed])')
      .forEach((node) => node.remove())
  }, [])

  useEffect(() => {
    const sync = () => {
      const vis = inFlowScroll
        ? isContinuousChapters()
          ? chapterRevealForId(PRACTICE_CHAPTER_ID) >=
            CHAPTER_STAGE_PAINT_VISIBILITY
          : activeSlideIdPublished() === PRACTICE_CHAPTER_ID
        : activeSlideId === PRACTICE_CHAPTER_ID
      if (vis !== pileVisibleRef.current) {
        pileVisibleRef.current = vis
        setPileVisible(vis)
      }
    }

    sync()
    if (!inFlowScroll) return
    return scheduleScrollFrame(sync)
  }, [inFlowScroll, activeSlideId])

  const rotationFor = useCallback(
    (id: string) => pileRotationForId(id, layoutMobile),
    [layoutMobile],
  )

  const topAsset = deck[0]
  const draggingTop =
    activeDrag?.kind === 'pile' &&
    topAsset != null &&
    activeDrag.asset.id === topAsset.id

  const pileSize = stickerHeights.pile + stickerHeights.pilePad

  const onGrabPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0 || !deckReady || !topAsset || activeDrag) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    beginDragFromPile(
      topAsset,
      e.clientX,
      e.clientY,
      rotationFor(topAsset.id),
    )
  }

  const usePortal = !topBarNav
  const portalRef = useAnchorPortalFollow(
    anchorRef,
    mounted && pileVisible && usePortal && !isPrerenderSnapshot(),
  )

  const pileStack = (
    <div
      className="sticker-pile"
      style={{ width: pileSize, height: pileSize }}
      aria-label="Sticker stack"
    >
      {!deckReady ? null : deck.length === 0 ? (
        <p className="sticker-pile__empty">
          Stack&apos;s empty — refresh to restock.
        </p>
      ) : (
        <>
          {[...deck].reverse().map((asset, reverseIndex) => {
            const indexFromTop = deck.length - 1 - reverseIndex
            const isTopCard = asset.id === topAsset?.id
            const layout = pileScatterOffsetForId(asset.id, layoutMobile)
            const rotation = rotationFor(asset.id)

            const cardClass = [
              'sticker-pile__card',
              isTopCard ? 'sticker-pile__card--top' : 'sticker-pile__card--under',
              isTopCard && draggingTop ? 'sticker-pile__card--top-dragging' : '',
            ]
              .filter(Boolean)
              .join(' ')

            const cardStyle = {
              zIndex:
                isTopCard && draggingTop
                  ? 0
                  : deck.length - indexFromTop,
              ['--stack-x' as string]: `${layout.x}px`,
              ['--stack-y' as string]: `${layout.y}px`,
            }

            return (
              <div
                key={asset.id}
                className={cardClass}
                style={cardStyle}
                aria-hidden={!isTopCard}
              >
                <Sticker
                  src={asset.src}
                  alt={isTopCard ? asset.alt : ''}
                  assetId={asset.id}
                  rotation={rotation}
                  elevated={isTopCard}
                />
              </div>
            )
          })}

          {topAsset && !draggingTop && (
            <button
              type="button"
              className="sticker-pile__grab"
              aria-label={`Pick up ${topAsset.alt}`}
              onPointerDown={onGrabPointerDown}
            />
          )}
        </>
      )}
    </div>
  )

  const portaledPile =
    usePortal &&
    mounted &&
    pileVisible &&
    !isPrerenderSnapshot() &&
    createPortal(
      <div
        ref={portalRef}
        data-sticker-managed=""
        className={[
          'sticker-pile-portal',
          draggingTop ? 'sticker-pile-portal--pile-drag' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{
          zIndex: draggingTop ? zIndices.pile - 2 : zIndices.pile,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          pointerEvents: draggingTop ? 'none' : 'auto',
        }}
      >
        {pileStack}
      </div>,
      document.body,
    )

  return (
    <div
      className={[
        'sticker-pile-wrap',
        topBarNav ? 'sticker-pile-wrap--inline' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={!pileVisible}
      style={{
        opacity: pileVisible ? 1 : 0,
        visibility: pileVisible ? 'visible' : 'hidden',
        pointerEvents: pileVisible ? undefined : 'none',
      }}
    >
      {usePortal ? (
        <>
          <div
            ref={anchorRef}
            className="sticker-pile-anchor"
            style={{ width: pileSize, height: pileSize }}
            aria-hidden
          />
          {portaledPile}
        </>
      ) : pileVisible ? (
        pileStack
      ) : null}
    </div>
  )
}
