import { Fragment, useRef, type Dispatch, ReactNode, SetStateAction } from 'react'
import { useNavSentenceLayout } from '@/components/NavSentenceLayoutProvider'
import { NAV_SECTIONS, navMainSentenceAriaLabel } from '@/lib/nav'
import type { NavMainSentenceLine } from '@/lib/navSentenceLayout'
import type { NavSection } from '@/lib/types'
import { NavWrapDebug } from '@/components/NavWrapDebug'

const ACCENT = 'var(--color-accent)'
const LAST_SECTION_ID = NAV_SECTIONS[NAV_SECTIONS.length - 1]?.id

const sectionById = new Map(NAV_SECTIONS.map((sec) => [sec.id, sec]))

/** Keep the tail words on one line inside the final keyword (period renders outside). */
function lastSectionLabelContent(label: string): ReactNode {
  const words = label.split(' ')
  if (words.length <= 2) return label
  const tail = words.slice(-2).join(' ')
  const prefix = `${words.slice(0, -2).join(' ')} `
  return (
    <>
      {prefix}
      <span className="sidebar-main-nav__nowrap">{tail}</span>
    </>
  )
}

function lineEndsWithPeriod(line: NavMainSentenceLine): boolean {
  return line.kind === 'keywords' && (!line.suffix || line.suffix === '.')
}

function MainNavSentenceBody({
  lines,
  keywordFor,
}: {
  lines: NavMainSentenceLine[]
  keywordFor: (sec: NavSection, isLast: boolean) => ReactNode
}) {
  return (
    <>
      {lines.map((line) => (
        <span
          key={line.id}
          className={[
            'sidebar-main-nav__line',
            line.nowrap ? 'sidebar-main-nav__line--nowrap' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-nav-line={line.id}
        >
          {line.kind === 'text' ? (
            line.text
          ) : (
            <>
              {line.prefix ? (
                <span className="sidebar-main-nav__connector" aria-hidden="true">
                  {line.prefix}
                </span>
              ) : null}
              {line.sectionIds.map((sectionId, index) => {
                const sec = sectionById.get(sectionId)
                if (!sec) return null
                const isLastOnLine = index === line.sectionIds.length - 1
                const isLastInSentence = isLastOnLine && sectionId === LAST_SECTION_ID
                const showTerminalPeriod =
                  isLastInSentence && lineEndsWithPeriod(line)
                // Keep the trailing punctuation glued to its keyword (so a wrap
                // can't orphan the comma onto the next line) while leaving the
                // following space — and any "and" — free to break.
                const connector = !isLastOnLine
                  ? (line.between?.[index] ?? ', ')
                  : ''
                const boundPunct = connector.match(/^\S*/)?.[0] ?? ''
                const breakRest = connector.slice(boundPunct.length)
                return (
                  <Fragment key={sectionId}>
                    <span
                      className={[
                        'sidebar-main-nav__keyword-group',
                        isLastOnLine ? '' : 'sidebar-main-nav__keyword-group--bind',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {keywordFor(sec, isLastInSentence)}
                      {showTerminalPeriod ? (
                        <span
                          className="sidebar-main-nav__connector sidebar-main-nav__period"
                          aria-hidden="true"
                        >
                          .
                        </span>
                      ) : null}
                      {boundPunct ? (
                        <span className="sidebar-main-nav__connector" aria-hidden="true">
                          {boundPunct}
                        </span>
                      ) : null}
                    </span>
                    {breakRest ? (
                      <span className="sidebar-main-nav__connector" aria-hidden="true">
                        {breakRest}
                      </span>
                    ) : null}
                  </Fragment>
                )
              })}
              {line.suffix && line.suffix !== '.' ? (
                <span className="sidebar-main-nav__connector" aria-hidden="true">
                  {line.suffix}
                </span>
              ) : null}
            </>
          )}
        </span>
      ))}
    </>
  )
}

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

export function SidebarMainNavSentence(props: Props) {
  const navRef = useRef<HTMLElement>(null)
  const { lines } = useNavSentenceLayout()
  const ariaLabel = navMainSentenceAriaLabel()

  if (props.variant === 'mobile-hero') {
    return (
      <nav
        ref={navRef}
        className="sidebar-main-nav__sentence sidebar-main-nav__sentence--mobile-hero"
        aria-label={ariaLabel}
        style={{
          fontFamily: 'var(--font-ahg)',
          fontWeight: 700,
          fontSize: 'clamp(16px, 5vw, 22px)',
          lineHeight: 1.2,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          color: 'var(--color-ink)',
          margin: 0,
          width: 'min(100%, 380px)',
        }}
      >
        <MainNavSentenceBody
          lines={lines}
          keywordFor={(sec, isLast) => (
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
          )}
        />
        <NavWrapDebug rootRef={navRef} />
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
      ref={navRef}
      className="sidebar-main-nav__sentence"
      aria-label={ariaLabel}
      style={{ color: inkColor }}
    >
      <MainNavSentenceBody
        lines={lines}
        keywordFor={(sec, isLast) => {
          const isActive = activeSection === sec.id
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
          return (
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
        }}
      />
      <NavWrapDebug rootRef={navRef} />
    </nav>
  )
}
