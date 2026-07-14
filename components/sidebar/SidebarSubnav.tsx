import type { Dispatch, RefObject, SetStateAction } from 'react'
import type { NavSection } from '@/lib/types'
import {
  ACCENT,
  BLUR_PX,
  FONT_MONO,
  NAV_FADED,
  NAV_PILL_1,
  TRANSITION_MS,
} from '@/components/sidebar/constants'

function toChapterId(sectionId: string, chapterId: string): string {
  return `${sectionId}-${chapterId}`
}

/**
 * Chapter pills at viewport center (desktop) / inside the overlay panel.
 * Selected = muted-accent fill; hover = accent ring + accent label.
 */
export function SidebarSubnav({
  subnavRef,
  subnavClass,
  section,
  interactive,
  overlayMode,
  visibleItems,
  activeChapter,
  hoverChapterId,
  reducedMotion,
  onSelectChapter,
  setHoverChapterId,
  setHoverSectionId,
}: {
  subnavRef: RefObject<HTMLElement>
  subnavClass: string
  section: NavSection
  interactive: boolean
  overlayMode: boolean
  visibleItems: number[]
  activeChapter: string | null
  hoverChapterId: string | null
  reducedMotion: boolean
  onSelectChapter: (chapterId: string) => void
  setHoverChapterId: Dispatch<SetStateAction<string | null>>
  setHoverSectionId: Dispatch<SetStateAction<string | null>>
}) {
  return (
    <div className={subnavClass}>
      <nav
        ref={subnavRef}
        className="sidebar-subnav--fixed"
        aria-label="Chapter navigation"
        data-sidebar-nav-hit
        style={{
          position: 'fixed',
          top: '50vh',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          zIndex: 101,
          pointerEvents: interactive ? 'auto' : 'none',
        }}
      >
        {section.chapters.map((chapter, i) => {
          const chId = toChapterId(section.id, chapter.id)
          const isActive = activeChapter === chId
          const isVisible = interactive && (overlayMode || visibleItems.includes(i))
          const isHoverThis = hoverChapterId === chId
          const chapterFill = isActive && !isHoverThis ? NAV_PILL_1 : 'transparent'
          // Keep the ring present but transparent when idle so the hover only
          // animates its colour. Transitioning box-shadow from `none` renders the
          // ring unevenly on the first paint (a broken bottom edge).
          const chapterRing = `0 0 0 1px ${isHoverThis ? ACCENT : 'transparent'}`
          return (
            <button
              key={chapter.id}
              type="button"
              className="sidebar-subnav__chapter"
              onClick={() => onSelectChapter(chId)}
              aria-current={isActive ? 'true' : undefined}
              tabIndex={isVisible ? 0 : -1}
              aria-hidden={!isVisible ? true : undefined}
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                opacity: isVisible ? 1 : 0,
                filter:
                  reducedMotion || isVisible ? 'blur(0)' : `blur(${BLUR_PX}px)`,
                transform:
                  reducedMotion || isVisible ? 'translateY(0)' : 'translateY(4px)',
                transition: reducedMotion
                  ? 'background 180ms ease, box-shadow 180ms ease'
                  : `opacity ${TRANSITION_MS}ms ease ${i * 20}ms, filter ${TRANSITION_MS}ms ease ${i * 20}ms, transform ${TRANSITION_MS}ms ease ${i * 20}ms, background 180ms ease, box-shadow 180ms ease`,
                pointerEvents: isVisible ? 'auto' : 'none',
                borderRadius: 9999,
                // 44px keeps the WCAG touch target; padding + gap sit on the 8px
                // grid, and the label is centred with line-height 1 (below).
                minHeight: 44,
                padding: '8px 16px',
                background: chapterFill,
                boxShadow: chapterRing,
                border: 'none',
                font: 'inherit',
              }}
              onMouseEnter={() => {
                setHoverChapterId(chId)
                setHoverSectionId(null)
              }}
              onMouseLeave={() => {
                setHoverChapterId((prev) => (prev === chId ? null : prev))
              }}
            >
              <span
                style={{
                  fontFamily: FONT_MONO,
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                  color: isHoverThis || isActive ? ACCENT : NAV_FADED,
                }}
              >
                {chapter.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
