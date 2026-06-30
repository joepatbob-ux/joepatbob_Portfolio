'use client'

import type { Dispatch, ReactNode, SetStateAction } from 'react'
import {
  NAV_SECTIONS,
  navMainSentenceAriaLabel,
  navSectionConnector,
} from '@/lib/nav'
import type { NavSection } from '@/lib/types'

const ACCENT = 'var(--color-accent)'

export type SidebarMainNavKeywordStyle = {
  color: string
  opacity: number
}

interface DesktopProps {
  variant: 'desktop'
  inkColor: string
  dimActive: boolean
  activeSection: string | null
  hoverSectionId: string | null
  fadeMainNavSelection: boolean
  navKeywordStyle: (opts: {
    dimActive: boolean
    isActive: boolean
    selectionExploringElsewhere: boolean
  }) => SidebarMainNavKeywordStyle
  onSelect: (sectionId: string) => void
  onHoverSection: Dispatch<SetStateAction<string | null>>
  onClearChapterHover: () => void
}

interface MobileHeroProps {
  variant: 'mobile-hero'
  onSelect: (sectionId: string) => void
  /** Mirrors mobile hero visibility — keeps keywords out of tab order when hero is hidden. */
  keywordTabIndex?: number
}

type Props = DesktopProps | MobileHeroProps

/** "In Between." stays together; "Everything" may wrap to its own line. */
function lastSectionLabelContent(label: string): ReactNode {
  const words = label.split(' ')
  if (words.length <= 2) {
    return (
      <span className="sidebar-main-nav__nowrap">
        {label}
        <span className="sidebar-main-nav__period" aria-hidden="true">
          .
        </span>
      </span>
    )
  }
  const tail = words.slice(-2).join(' ')
  const prefix = `${words.slice(0, -2).join(' ')} `
  return (
    <>
      {prefix}
      <span className="sidebar-main-nav__nowrap">
        {tail}
        <span className="sidebar-main-nav__period" aria-hidden="true">
          .
        </span>
      </span>
    </>
  )
}

function NavSectionPiece({
  sec,
  index,
  keywordButton,
}: {
  sec: NavSection
  index: number
  keywordButton: ReactNode
}) {
  const total = NAV_SECTIONS.length
  const isLast = index === total - 1
  const isPenultimate = index === total - 2
  const connector = navSectionConnector(index, total)
  const forceLineBefore = sec.id === 'web-apps'

  const piece =
    isLast ? (
      <span>{keywordButton}</span>
    ) : isPenultimate ? (
      <span>
        <span className="sidebar-main-nav__nowrap">
          {keywordButton}
          <span className="sidebar-main-nav__connector" aria-hidden="true">
            ,{' '}
          </span>
        </span>
        <span className="sidebar-main-nav__connector" aria-hidden="true">
          and{' '}
        </span>
      </span>
    ) : (
      <span>
        <span className="sidebar-main-nav__nowrap">
          {keywordButton}
          <span className="sidebar-main-nav__connector" aria-hidden="true">
            {connector}
          </span>
        </span>
      </span>
    )

  if (!forceLineBefore) return piece

  return (
    <>
      <br aria-hidden="true" className="sidebar-main-nav__break" />
      {piece}
    </>
  )
}

export function SidebarMainNavSentence(props: Props) {
  const ariaLabel = navMainSentenceAriaLabel()

  if (props.variant === 'mobile-hero') {
    return (
      <nav
        className="sidebar-main-nav__sentence sidebar-main-nav__sentence--mobile-hero"
        aria-label={ariaLabel}
        style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(18px, 6vw, 24px)',
          lineHeight: 1.2,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
          margin: 0,
          width: 'min(100%, 380px)',
        }}
      >
        <span>I design product systems across </span>
        {NAV_SECTIONS.map((sec, i) => {
          const isLast = i === NAV_SECTIONS.length - 1
          const keywordButton = (
            <button
              type="button"
              className="sidebar-main-nav__keyword"
              aria-label={sec.label}
              tabIndex={props.keywordTabIndex ?? 0}
              onClick={() => props.onSelect(sec.id)}
              style={{
                display: 'inline',
                margin: 0,
                padding: 0,
                border: 'none',
                background: 'none',
                font: 'inherit',
                letterSpacing: 'inherit',
                textTransform: 'inherit',
                lineHeight: 'inherit',
                color: ACCENT,
                cursor: 'pointer',
                verticalAlign: 'baseline',
                textAlign: 'inherit',
                transition: 'opacity 220ms ease, color 200ms ease',
              }}
            >
              {isLast ? lastSectionLabelContent(sec.label) : sec.label}
            </button>
          )
          return (
            <NavSectionPiece
              key={sec.id}
              sec={sec}
              index={i}
              keywordButton={keywordButton}
            />
          )
        })}
      </nav>
    )
  }

  const {
    inkColor,
    dimActive,
    activeSection,
    hoverSectionId,
    fadeMainNavSelection,
    navKeywordStyle,
    onSelect,
    onHoverSection,
    onClearChapterHover,
  } = props

  return (
    <nav
      className="sidebar-main-nav__sentence"
      aria-label={ariaLabel}
      style={{ color: inkColor }}
    >
      <span>I design product systems across </span>
      {NAV_SECTIONS.map((sec, i) => {
        const isActive = activeSection === sec.id
        const isLast = i === NAV_SECTIONS.length - 1
        const isHoverThis = hoverSectionId === sec.id
        const { color: mainColor, opacity: mainOpacity } = navKeywordStyle({
          dimActive,
          isActive,
          selectionExploringElsewhere: fadeMainNavSelection,
        })
        const keywordClass = [
          'sidebar-main-nav__keyword',
          isHoverThis ? 'sidebar-main-nav__keyword--hover' : '',
        ]
          .filter(Boolean)
          .join(' ')
        const keywordButton = (
          <button
            type="button"
            className={keywordClass}
            aria-label={sec.label}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => onSelect(sec.id)}
            style={{
              color: isHoverThis ? 'transparent' : mainColor,
              opacity: mainOpacity,
            }}
            onMouseEnter={() => {
              onHoverSection(sec.id)
              onClearChapterHover()
            }}
            onMouseLeave={() => {
              onHoverSection((prev) => (prev === sec.id ? null : prev))
            }}
          >
            {isLast ? lastSectionLabelContent(sec.label) : sec.label}
          </button>
        )
        return (
          <NavSectionPiece
            key={sec.id}
            sec={sec}
            index={i}
            keywordButton={keywordButton}
          />
        )
      })}
    </nav>
  )
}
