// components/SidebarNav.tsx
// Full scroll choreography:
// - Hero name blurs out proportionally as user scrolls
// - Main nav sentence travels from above email up to top, locks at threshold
// - Divider blurs in when last chapter item of first section appears
// - Sub nav blurs in at viewport center after nav locks, chapters stagger in
// - All keywords start lit, dim to ~22% once nav is stuck (active stays full until exploration hover)
// - Hovering another section fades the active keyword; subnav chapter hover does not dim main
// - Subnav: selected = muted-accent fill; hover = accent ring + accent label
// - Main keywords only: hover = hollow glyphs + accent stroke (hero sentence)
// - Contact pill: accent at rest; expanded = muted fill; item hover = accent + ring
// - Email pill is fixed at bottom

'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { useDialogFocusTrap } from '@/lib/hooks/useDialogFocusTrap'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { activeSlideIdPublished } from '@/lib/chapterSlideshow'
import { getDocumentScrollY } from '@/lib/documentScrollY'
import { applySidebarHeroNameFade, applySidebarShellFade, isInHeroScrollZone, isTopBarInHeroScrollZone, resetSidebarShellFade } from '@/lib/heroScroll'
import { getLayoutViewportHeight } from '@/lib/mobileViewport'
import { NAV_SECTIONS, sectionIdForChapter } from '@/lib/nav'
import { SidebarMainNavSentence } from '@/components/SidebarMainNavSentence'
import { sectionEntryChapterId } from '@/lib/sectionEntryChapter'
import { OverlayActionPill } from '@/components/ui/OverlayActionPill'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { scheduleScrollFrame } from '@/lib/scrollFrame'
import { ContactButton } from '@/components/ContactButton'
import { useChapterNav } from '@/components/ChapterNavProvider'

// ── FONT STRINGS (CSS vars: --font-ahg / --font-mono from globals + layout) ─
const FONT_AHG  = 'var(--font-ahg)'
const FONT_MONO = 'var(--font-mono)'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ACCENT      = 'var(--color-accent)'
const NAV_FADED   = 'var(--color-nav-faded-selection)'
const NAV_PILL_1  = 'var(--color-nav-pill-muted-accent-1)'
const STAGGER_MS      = 60
const TRANSITION_MS   = 320
const SUBNAV_DELAY_MS = 280
const BLUR_PX         = 6
const NAV_TOP_PX      = 24
const EMAIL_BOTTOM_PX = 24

/** Phone + tablet overlay nav — keep in sync with `LAYOUT_MQ.topBarNav` / globals.css */
const TOP_BAR_NAV_MQ = LAYOUT_MQ.topBarNav

function readUsesTopBarNav(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(TOP_BAR_NAV_MQ).matches
}

function useTopBarNav() {
  const [usesTopBarNav, setUsesTopBarNav] = useState(readUsesTopBarNav)
  useEffect(() => {
    const mq = window.matchMedia(TOP_BAR_NAV_MQ)
    const sync = () => setUsesTopBarNav(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return usesTopBarNav
}

function SidebarOverlayClose({
  onClose,
  variant,
}: {
  onClose: () => void
  variant: 'tablet' | 'mobile-panel'
}) {
  return (
    <OverlayActionPill
      variant="secondary"
      className={[
        'sidebar-overlay-close',
        `sidebar-overlay-close--${variant}`,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Close navigation"
      data-sidebar-nav-hit
      onClick={(e) => {
        e.stopPropagation()
        onClose()
      }}
    >
      Close
    </OverlayActionPill>
  )
}


/** Main nav section keywords: orange + opacity dimming when stuck. */
function navKeywordStyle(opts: {
  dimActive: boolean
  isActive: boolean
  selectionExploringElsewhere: boolean
}): { color: string; opacity: number } {
  const { dimActive, isActive, selectionExploringElsewhere } = opts
  if (!dimActive) return { color: ACCENT, opacity: 1 }
  if (isActive) {
    return {
      color: selectionExploringElsewhere ? NAV_FADED : ACCENT,
      opacity: 1,
    }
  }
  return { color: NAV_FADED, opacity: 1 }
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function toChapterId(sectionId: string, chapterId: string): string {
  return `${sectionId}-${chapterId}`
}

function getScrollTop(): number {
  return getDocumentScrollY()
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function SidebarNav() {
  const usesTopBarNav = useTopBarNav()
  const reducedMotion = usePrefersReducedMotion()
  const { navigateToChapter, navigateToSection, phase: chapterNavPhase } =
    useChapterNav()
  const C = {
    ink: 'var(--color-ink)',
    divider: 'var(--color-rule)',
  }

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileNavReady, setMobileNavReady] = useState(false)
  const [mobileInHero, setMobileInHero] = useState(() => {
    if (typeof window === 'undefined') return true
    if (!window.matchMedia(LAYOUT_MQ.topBarNav).matches) {
      return isInHeroScrollZone()
    }
    return getDocumentScrollY() <= 24 || isTopBarInHeroScrollZone()
  })
  const mobileInHeroRef = useRef(mobileInHero)
  const lastHtmlHeroClassRef = useRef<boolean | null>(null)

  const [navIsStuck,          setNavIsStuck]          = useState(false)
  const [dividerVisible,      setDividerVisible]      = useState(false)
  const [subNavVisible,       setSubNavVisible]       = useState(false)
  const [chapterItemsVisible, setChapterItemsVisible] = useState<number[]>([])
  const [activeSection,       setActiveSection]       = useState<string | null>(null)
  const [activeChapter,       setActiveChapter]       = useState<string | null>(null)
  const [dimActive,           setDimActive]           = useState(false)
  const [hoverSectionId, setHoverSectionId] = useState<string | null>(null)
  const [hoverChapterId, setHoverChapterId] = useState<string | null>(null)
  const mobileRailRef = useRef<HTMLButtonElement>(null)

  /** Fade main keywords only when hovering a different section (subnav hover does not dim main). */
  const fadeMainNavSelection =
    hoverSectionId != null &&
    activeSection != null &&
    hoverSectionId !== activeSection

  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const subNavTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevStuck     = useRef(false)
  const subNavVisibleRef = useRef(false)
  const activeSectionRef = useRef<string | null>(null)
  const activeChapterRef = useRef<string | null>(null)
  const overlayOpenRef = useRef(false)
  const dividerPastHeroRef = useRef(false)
  const [desktopNavReady, setDesktopNavReady] = useState(false)
  const sidebarShellRef = useRef<HTMLDivElement>(null)
  const heroRef       = useRef<HTMLDivElement>(null)
  const navWrapRef    = useRef<HTMLDivElement>(null)
  const contactRef    = useRef<HTMLDivElement>(null)
  const mobileHeroRef = useRef<HTMLDivElement>(null)
  const mobileDrawerPanelRef = useRef<HTMLDivElement>(null)
  const subnavRef = useRef<HTMLElement>(null)
  const [heroNavSlot, setHeroNavSlot] = useState<Element | null>(null)

  useEffect(() => {
    setHeroNavSlot(document.getElementById('hero-mobile-nav-slot'))
  }, [])
  const layoutRef     = useRef({ viewportH: 900, navRestTop: 0, threshold: 648 })
  const stickThresholdRef = useRef(648)

  const measureLayout = useCallback(() => {
    const vh = window.innerHeight
    const safeBottom =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          '--safe-area-bottom',
        ),
      ) || 0
    let navRest = 0
    if (navWrapRef.current && contactRef.current) {
      navRest =
        vh -
        EMAIL_BOTTOM_PX -
        safeBottom -
        contactRef.current.clientHeight -
        12 -
        navWrapRef.current.clientHeight
    }
    layoutRef.current = { viewportH: vh, navRestTop: navRest, threshold: vh * 0.72 }
    stickThresholdRef.current = vh * 0.72
  }, [])

  useEffect(() => {
    const el = mobileRailRef.current
    if (!el || !usesTopBarNav) return

    const syncRailHeight = () => {
      const rootStyles = getComputedStyle(document.documentElement)
      const chromeBelow =
        parseFloat(rootStyles.getPropertyValue('--mobile-rail-chrome-below')) || 4
      const padTop = parseFloat(getComputedStyle(el).paddingTop) || 0
      const padBottom = parseFloat(getComputedStyle(el).paddingBottom) || 0
      const barHeight = Math.max(52, el.offsetHeight - padTop - padBottom)
      const overlayHeight = Math.ceil(el.offsetHeight + chromeBelow)
      document.documentElement.style.setProperty(
        '--mobile-nav-bar-height',
        `${Math.ceil(barHeight)}px`,
      )
      document.documentElement.style.setProperty(
        '--mobile-nav-overlay-height',
        `${overlayHeight}px`,
      )
    }

    syncRailHeight()
    const ro = new ResizeObserver(syncRailHeight)
    ro.observe(el)
    return () => {
      ro.disconnect()
      document.documentElement.style.removeProperty('--mobile-nav-bar-height')
      document.documentElement.style.removeProperty('--mobile-nav-overlay-height')
    }
  }, [usesTopBarNav, mobileInHero, mobileDrawerOpen, activeSection])

  useEffect(() => {
    if (usesTopBarNav && !mobileDrawerOpen) {
      return
    }
    measureLayout()
    window.addEventListener('resize', measureLayout)
    const ro = new ResizeObserver(measureLayout)
    if (navWrapRef.current) ro.observe(navWrapRef.current)
    if (contactRef.current) ro.observe(contactRef.current)
    return () => {
      window.removeEventListener('resize', measureLayout)
      ro.disconnect()
    }
  }, [usesTopBarNav, mobileDrawerOpen, measureLayout])

  const staggerIn = useCallback((sectionId: string, isFirst = false) => {
    staggerTimers.current.forEach(clearTimeout)
    staggerTimers.current = []
    setChapterItemsVisible([])
    const sec = NAV_SECTIONS.find((s) => s.id === sectionId)
    if (!sec) return
    if (reducedMotion) {
      setChapterItemsVisible(sec.chapters.map((_, i) => i))
      if (!isInHeroScrollZone()) setDividerVisible(true)
      return
    }
    sec.chapters.forEach((_, i) => {
      const t = setTimeout(() => {
        setChapterItemsVisible((prev) => [...prev, i])
        if (i === sec.chapters.length - 1 && !isInHeroScrollZone()) {
          setDividerVisible(true)
        }
      }, i * STAGGER_MS)
      staggerTimers.current.push(t)
    })
  }, [reducedMotion])

  const staggerOut = useCallback((cb: () => void) => {
    staggerTimers.current.forEach(clearTimeout)
    staggerTimers.current = []
    setChapterItemsVisible([])
    if (reducedMotion) {
      cb()
      return
    }
    setTimeout(cb, TRANSITION_MS * 0.55)
  }, [reducedMotion])

  const switchSection = useCallback(
    (id: string, options?: { animate?: boolean }) => {
      const animate = options?.animate !== false
      setActiveSection((prev) => {
        if (prev === id) return prev
        if (animate && subNavVisibleRef.current) {
          staggerOut(() => staggerIn(id))
        } else if (subNavVisibleRef.current) {
          staggerIn(id)
        }
        return id
      })
    },
    [staggerIn, staggerOut],
  )

  useEffect(() => {
    subNavVisibleRef.current = subNavVisible
  }, [subNavVisible])

  useEffect(() => {
    activeSectionRef.current = activeSection
  }, [activeSection])

  useEffect(() => {
    activeChapterRef.current = activeChapter
  }, [activeChapter])

  useEffect(() => {
    overlayOpenRef.current = mobileDrawerOpen
  }, [mobileDrawerOpen])

  const syncSidebarDivider = useCallback((inHero: boolean) => {
    if (overlayOpenRef.current) return
    const show = !inHero
    dividerPastHeroRef.current = show
    setDividerVisible(show)
  }, [])

  /** Expanded overlay panel: reveal chapter subnav even before scroll-lock threshold. */
  useEffect(() => {
    const overlayOpen = usesTopBarNav && mobileDrawerOpen
    if (!usesTopBarNav) return
    if (overlayOpen) {
      const id = activeSectionRef.current || NAV_SECTIONS[0].id
      setSubNavVisible(true)
      setDividerVisible(true)
      setDimActive(true)
      staggerIn(id, id === NAV_SECTIONS[0].id)
      return
    }
    if (!prevStuck.current) {
      setSubNavVisible(false)
      syncSidebarDivider(isInHeroScrollZone())
      setDimActive(false)
      setNavIsStuck(false)
      setChapterItemsVisible([])
      staggerTimers.current.forEach(clearTimeout)
      staggerTimers.current = []
    }
  }, [usesTopBarNav, mobileDrawerOpen, staggerIn, syncSidebarDivider])

  const applyScrollSpy = useCallback(() => {
    if (overlayOpenRef.current) return
    if (chapterNavPhase !== 'idle') return

    const chapterId = activeSlideIdPublished()
    if (!chapterId) return

    const sectionId = sectionIdForChapter(chapterId)
    if (!sectionId) return

    if (activeChapterRef.current !== chapterId) {
      activeChapterRef.current = chapterId
      setActiveChapter(chapterId)
    }

    if (activeSectionRef.current !== sectionId) {
      activeSectionRef.current = sectionId
      setActiveSection(sectionId)
      if (subNavVisibleRef.current) staggerOut(() => staggerIn(sectionId))
    }
  }, [chapterNavPhase, staggerIn, staggerOut])

  const applyStuckState = useCallback(
    (y: number) => {
      const threshold = stickThresholdRef.current
      const shouldStick = y >= threshold

      if (shouldStick && !prevStuck.current) {
        prevStuck.current = true
        setNavIsStuck(true)
        setDimActive(true)
        subNavTimer.current = setTimeout(() => {
          setSubNavVisible(true)
          const chapterId = activeSlideIdPublished()
          const sectionId = chapterId
            ? sectionIdForChapter(chapterId)
            : null
          const id = sectionId || NAV_SECTIONS[0].id
          activeSectionRef.current = id
          setActiveSection(id)
          if (chapterId) {
            activeChapterRef.current = chapterId
            setActiveChapter(chapterId)
          }
          staggerIn(id, id === NAV_SECTIONS[0].id)
        }, SUBNAV_DELAY_MS)
      } else if (!shouldStick && prevStuck.current) {
        prevStuck.current = false
        setNavIsStuck(false)
        setSubNavVisible(false)
        staggerTimers.current.forEach(clearTimeout)
        staggerTimers.current = []
        syncSidebarDivider(isInHeroScrollZone())
        setDimActive(false)
        setChapterItemsVisible([])
        if (subNavTimer.current) clearTimeout(subNavTimer.current)
      }
    },
    [staggerIn, syncSidebarDivider],
  )

  useEffect(() => {
    if (usesTopBarNav && mobileInHero && mobileDrawerOpen) {
      setMobileDrawerOpen(false)
    }
  }, [usesTopBarNav, mobileInHero, mobileDrawerOpen])

  useEffect(() => {
    document.documentElement.classList.toggle('mobile-nav-panel-open', usesTopBarNav && mobileDrawerOpen)
    return () => {
      document.documentElement.classList.remove('mobile-nav-panel-open')
    }
  }, [usesTopBarNav, mobileDrawerOpen])

  const drawerOpen = usesTopBarNav && mobileDrawerOpen
  useBodyScrollLock(drawerOpen)
  useDialogFocusTrap(mobileDrawerPanelRef, drawerOpen, subnavRef)

  const closeOverlays = useCallback(() => {
    setMobileDrawerOpen(false)
  }, [])

  const applyMobileHeroScroll = useCallback((y: number) => {
    const viewportH = getLayoutViewportHeight() || window.innerHeight
    applySidebarShellFade(mobileHeroRef.current, y, viewportH, 0)
  }, [])

  const applyDesktopNavScroll = useCallback((y: number) => {
    const { viewportH, navRestTop, threshold } = layoutRef.current
    const safeThreshold = threshold > 0 ? threshold : 1

    applySidebarHeroNameFade(heroRef.current, y, viewportH, BLUR_PX)

    const travelT = Math.min(1, y / safeThreshold)
    const navTop =
      y >= safeThreshold
        ? NAV_TOP_PX
        : navRestTop + (NAV_TOP_PX - navRestTop) * travelT
    if (navWrapRef.current) {
      navWrapRef.current.style.top = `${navTop}px`
    }
  }, [])

  /** Position nav before paint — avoids hero flash at `top: 0` while layout/scroll frame init. */
  useLayoutEffect(() => {
    if (usesTopBarNav) {
      if (mobileDrawerOpen) {
        measureLayout()
        resetSidebarShellFade(sidebarShellRef.current)
        applyDesktopNavScroll(getScrollTop())
        setDesktopNavReady(true)
        setMobileNavReady(true)
      } else {
        setDesktopNavReady(false)
        const y = getScrollTop()
        const inHero = isTopBarInHeroScrollZone()
        mobileInHeroRef.current = inHero
        setMobileInHero(inHero)
        lastHtmlHeroClassRef.current = inHero
        document.documentElement.classList.toggle('in-hero-scroll', inHero)
        document.documentElement.classList.toggle('past-hero-scroll', !inHero)
        if (inHero) {
          resetSidebarShellFade(mobileHeroRef.current)
          applyMobileHeroScroll(y)
        } else {
          resetSidebarShellFade(mobileHeroRef.current)
        }
        setMobileNavReady(true)
      }
      return
    }

    setMobileNavReady(true)
    measureLayout()
    applyDesktopNavScroll(getScrollTop())
    const inHero = isInHeroScrollZone()
    lastHtmlHeroClassRef.current = inHero
    document.documentElement.classList.toggle('in-hero-scroll', inHero)
    document.documentElement.classList.toggle('past-hero-scroll', !inHero)
    syncSidebarDivider(inHero)
    setDesktopNavReady(true)
  }, [usesTopBarNav, mobileDrawerOpen, measureLayout, applyDesktopNavScroll, applyMobileHeroScroll, syncSidebarDivider])

  /** Top-bar nav: hero intro fades on scroll; rail + drawer overlay after hero. */
  useEffect(() => {
    if (!usesTopBarNav) return

    return scheduleScrollFrame(() => {
      const y = getScrollTop()
      const inHero = isTopBarInHeroScrollZone()

      if (!mobileDrawerOpen && inHero !== mobileInHeroRef.current) {
        mobileInHeroRef.current = inHero
        setMobileInHero(inHero)
      }

      if (inHero !== lastHtmlHeroClassRef.current) {
        lastHtmlHeroClassRef.current = inHero
        document.documentElement.classList.toggle('in-hero-scroll', inHero)
        document.documentElement.classList.toggle('past-hero-scroll', !inHero)
      }

      if (inHero && !mobileDrawerOpen) {
        applyMobileHeroScroll(y)
      } else if (!inHero) {
        resetSidebarShellFade(mobileHeroRef.current)
      }

      if (!mobileDrawerOpen) {
        syncSidebarDivider(isTopBarInHeroScrollZone())
      }

      if (!inHero && !overlayOpenRef.current) applyScrollSpy()
    })
  }, [usesTopBarNav, mobileDrawerOpen, applyScrollSpy, applyMobileHeroScroll, syncSidebarDivider])

  useEffect(() => {
    if (!usesTopBarNav || !mobileDrawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOverlays()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [usesTopBarNav, mobileDrawerOpen, closeOverlays])

  // Scroll-linked sidebar hero name + nav travel — desktop only (top-bar nav uses mobile scroll frame).
  useEffect(() => {
    if (usesTopBarNav) return

    measureLayout()

    return scheduleScrollFrame(() => {
      const y = getScrollTop()
      const inHero = isInHeroScrollZone()
      if (inHero !== lastHtmlHeroClassRef.current) {
        lastHtmlHeroClassRef.current = inHero
        document.documentElement.classList.toggle('in-hero-scroll', inHero)
        document.documentElement.classList.toggle('past-hero-scroll', !inHero)
      }
      syncSidebarDivider(inHero)
      applyDesktopNavScroll(y)
      applyStuckState(y)
      if (prevStuck.current && !overlayOpenRef.current) applyScrollSpy()
    })
  }, [
    usesTopBarNav,
    applyStuckState,
    applyScrollSpy,
    measureLayout,
    applyDesktopNavScroll,
    syncSidebarDivider,
  ])

  useEffect(() => {
    if (usesTopBarNav) return
    return () => {
      document.documentElement.classList.remove('in-hero-scroll', 'past-hero-scroll')
    }
  }, [usesTopBarNav])

  const syncScrollAfterNavigate = useCallback(() => {
    applyStuckState(getScrollTop())
    applyScrollSpy()
  }, [applyStuckState, applyScrollSpy])

  const finishNavigate = useCallback(
    (closeOverlay: boolean) => {
      if (closeOverlay) closeOverlays()
      syncScrollAfterNavigate()
    },
    [closeOverlays, syncScrollAfterNavigate],
  )

  const scrollToChapter = (chapterId: string) => {
    const wasDrawerOpen = mobileDrawerOpen
    const sectionId = sectionIdForChapter(chapterId)
    if (sectionId) {
      activeSectionRef.current = sectionId
      setActiveSection(sectionId)
      switchSection(sectionId, { animate: false })
    }
    activeChapterRef.current = chapterId
    setActiveChapter(chapterId)
    if (wasDrawerOpen) {
      // Close first so useBodyScrollLock releases before navigation scrolls.
      // Two rAFs: rAF1 fires before paint, useEffect cleanup runs after paint,
      // then rAF2 fires with the body unlocked and scrollTo working.
      closeOverlays()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void navigateToChapter(chapterId).then(syncScrollAfterNavigate)
        })
      })
    } else {
      void navigateToChapter(chapterId).then(syncScrollAfterNavigate)
    }
  }

  const scrollToSection = (id: string) => {
    const wasDrawerOpen = mobileDrawerOpen
    const sec = NAV_SECTIONS.find((s) => s.id === id)
    activeSectionRef.current = id
    setActiveSection(id)
    switchSection(id, { animate: false })
    if (sec) {
      const entryChapterId = sectionEntryChapterId(id)
      activeChapterRef.current = entryChapterId
      setActiveChapter(entryChapterId)
    }
    if (wasDrawerOpen) {
      closeOverlays()
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          void navigateToSection(id).then(syncScrollAfterNavigate)
        })
      })
    } else {
      void navigateToSection(id).then(syncScrollAfterNavigate)
    }
  }

  const currentSection = NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0]

  const overlaySubnav = usesTopBarNav && mobileDrawerOpen
  const subnavInteractive = subNavVisible || overlaySubnav

  const showMobileRail = usesTopBarNav && !mobileInHero && !mobileDrawerOpen
  const showMobileHero = usesTopBarNav && mobileInHero && !mobileDrawerOpen

  const shellUsesOverlayWidth = usesTopBarNav && mobileDrawerOpen

  const shellClass = [
    'sidebar-desktop-shell',
    mobileDrawerOpen ? 'sidebar-mobile-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const subnavClass = [
    'sidebar-desktop-subnav',
    mobileDrawerOpen ? 'sidebar-mobile-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* Phone + tablet: hero intro → top rail → expand panel + scrim */}
      <div
        className={[
          'sidebar-mobile-nav',
          mobileNavReady ? 'sidebar-mobile-nav--ready' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div
          className={`sidebar-mobile-backdrop${mobileDrawerOpen ? ' sidebar-mobile-backdrop--visible' : ''}`}
          role="presentation"
          aria-hidden={mobileDrawerOpen ? undefined : true}
          onClick={closeOverlays}
        />

        <button
          ref={mobileRailRef}
          type="button"
          className={[
            'sidebar-mobile-rail',
            showMobileRail ? 'sidebar-mobile-rail--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-expanded={mobileDrawerOpen}
          aria-controls="sidebar-tablet-panel"
          aria-label={`Open navigation — ${currentSection.label}`}
          aria-hidden={showMobileRail ? undefined : true}
          tabIndex={showMobileRail ? 0 : -1}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <span className="sidebar-mobile-rail__chrome" aria-hidden />
          <p className="sidebar-mobile-rail__label" aria-hidden="true">
            I simplify complex systems for{' '}
            <span className="sidebar-mobile-rail__label-accent">
              {currentSection.label}
            </span>
          </p>
        </button>
      </div>

      {/* Sidebar shell — desktop; phone/tablet expand as overlay */}
      <div
        ref={mobileDrawerPanelRef}
        id="sidebar-tablet-panel"
        className={shellClass}
        role={usesTopBarNav && mobileDrawerOpen ? 'dialog' : undefined}
        aria-modal={usesTopBarNav && mobileDrawerOpen ? true : undefined}
        aria-label={usesTopBarNav && mobileDrawerOpen ? 'Navigation menu' : undefined}
      >
        <div
          ref={sidebarShellRef}
          className="sidebar-shell--fixed"
          data-nav-positioned={desktopNavReady ? 'true' : undefined}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: shellUsesOverlayWidth
              ? 'var(--sidebar-overlay-width)'
              : 'var(--sidebar-width)',
            height: '100dvh',
            zIndex: usesTopBarNav ? undefined : 100,
            pointerEvents:
              usesTopBarNav && mobileDrawerOpen
                ? 'auto'
                : 'none',
          }}
          onClick={(e) => {
            if ((e.target as Element).closest('[data-sidebar-nav-hit]')) return
            if (usesTopBarNav && mobileDrawerOpen) setMobileDrawerOpen(false)
          }}
        >
        {!(usesTopBarNav && mobileDrawerOpen) ? (
          <div
            aria-hidden
            className="sidebar-shell__divider"
            style={{
              opacity: dividerVisible ? 1 : 0,
              filter:
                reducedMotion || dividerVisible ? 'blur(0)' : `blur(${BLUR_PX}px)`,
              transition: reducedMotion
                ? 'opacity 600ms ease'
                : 'opacity 600ms ease, filter 600ms ease',
            }}
          />
        ) : null}

        {/* Hero name — opacity/blur driven by scroll frame */}
        <div
          ref={heroRef}
          className="sidebar-hero-name"
          aria-hidden
          style={{
            position: 'absolute',
            opacity: 1,
            filter: 'blur(0px)',
            transition: 'none',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ fontFamily: FONT_AHG, fontWeight: 700, fontSize: 'clamp(12px, 1.35vw, 28px)', lineHeight: 1.1, textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
            Hello, I am
          </div>
          <div
            className="sidebar-hero-name__display"
            style={{
            fontFamily: FONT_AHG,
            fontWeight: 700,
            /* Preferred scales with width; vh ceiling ≈ half viewport minus eyebrow (3 lines × lh 0.82). */
            fontSize: 'clamp(40px, min(7.5vw, calc((50dvh - 56px) / 2.46)), 240px)',
            lineHeight: 0.82,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: C.ink,
          }}
          >
            <div>JOSEPH</div>
            <div>PATRICK</div>
            <div>ROBERTS<span style={{ color: ACCENT }}>.</span></div>
          </div>
        </div>

        {/* Main nav sentence — top set in applyDesktopNavScroll after layout measure */}
        <div
          ref={navWrapRef}
          data-sidebar-main-nav
          data-sidebar-nav-hit
          aria-hidden={usesTopBarNav && !mobileDrawerOpen ? true : undefined}
          style={{
            position: 'absolute',
            transition: 'none',
            pointerEvents: 'auto',
          }}
        >
          <SidebarMainNavSentence
            variant="desktop"
            inkColor={C.ink}
            dimActive={dimActive}
            activeSection={activeSection}
            hoverSectionId={hoverSectionId}
            fadeMainNavSelection={fadeMainNavSelection}
            navKeywordStyle={navKeywordStyle}
            onSelect={scrollToSection}
            onHoverSection={setHoverSectionId}
            onClearChapterHover={() => setHoverChapterId(null)}
          />
        </div>

        {/* Contact — liquid split; mobile overlay stacks divider + close below */}
        {usesTopBarNav && mobileDrawerOpen ? (
          <div className="sidebar-mobile-shell-footer" data-sidebar-nav-hit>
            <div ref={contactRef} className="sidebar-contact">
              <ContactButton />
            </div>
            <div aria-hidden className="sidebar-shell__divider sidebar-shell__divider--horizontal" />
            <SidebarOverlayClose onClose={closeOverlays} variant="mobile-panel" />
          </div>
        ) : (
          <div
            ref={contactRef}
            className="sidebar-contact"
            data-sidebar-nav-hit
            style={{
              position: 'absolute',
              pointerEvents: 'auto',
            }}
          >
            <ContactButton />
          </div>
        )}
        </div>
      </div>

      {/* Sub nav — viewport center (desktop only) */}
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
          gap: 6,
          zIndex: 101,
          pointerEvents: subnavInteractive ? 'auto' : 'none',
        }}
      >
        {currentSection.chapters.map((chapter, i) => {
          const chId      = toChapterId(currentSection.id, chapter.id)
          const isActive  = activeChapter === chId
          const isVisible =
            subnavInteractive &&
            (overlaySubnav || chapterItemsVisible.includes(i))
          const isHoverThis = hoverChapterId === chId
          const chapterFill = isActive && !isHoverThis ? NAV_PILL_1 : 'transparent'
          const chapterRing = isHoverThis ? `0 0 0 1px ${ACCENT}` : 'none'
          return (
            <button
              key={chapter.id}
              type="button"
              className="sidebar-subnav__chapter"
              onClick={() => scrollToChapter(chId)}
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
                transform: reducedMotion || isVisible ? 'translateY(0)' : 'translateY(4px)',
                transition: reducedMotion
                  ? 'background 180ms ease, box-shadow 180ms ease'
                  : `opacity ${TRANSITION_MS}ms ease ${i * 20}ms, filter ${TRANSITION_MS}ms ease ${i * 20}ms, transform ${TRANSITION_MS}ms ease ${i * 20}ms, background 180ms ease, box-shadow 180ms ease`,
                pointerEvents: isVisible ? 'auto' : 'none',
                borderRadius: 9999,
                minHeight: 44,
                padding: '10px 16px',
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
                  lineHeight: 1.5,
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

      {usesTopBarNav && heroNavSlot && createPortal(
        <nav
          ref={mobileHeroRef}
          aria-label="Site navigation"
          className={`sidebar-mobile-hero${showMobileHero ? ' sidebar-mobile-hero--active' : ''}`}
          aria-hidden={showMobileHero ? undefined : true}
        >
          <div className="sidebar-mobile-hero__inner">
            <div
              style={{
                fontFamily: FONT_AHG,
                fontWeight: 700,
                fontSize: 'clamp(12px, 4.2vw, 28px)',
                lineHeight: 1.1,
                textTransform: 'uppercase',
                color: ACCENT,
                marginBottom: 8,
                width: 'min(100%, 380px)',
              }}
            >
              Hello, I am
            </div>
            <h1 className="visually-hidden">Joseph Patrick Roberts</h1>
            <div
              style={{
                fontFamily: FONT_AHG,
                fontWeight: 700,
                fontSize:
                  'clamp(36px, min(13vw, calc((42dvh - 100px) / 2.46)), 132px)',
                lineHeight: 0.82,
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                color: C.ink,
                marginBottom: 16,
                width: 'min(100%, 380px)',
              }}
            >
              <div>JOSEPH</div>
              <div>PATRICK</div>
              <div>
                ROBERTS<span style={{ color: ACCENT }}>.</span>
              </div>
            </div>
            <SidebarMainNavSentence
              variant="mobile-hero"
              onSelect={scrollToSection}
              keywordTabIndex={showMobileHero ? 0 : -1}
            />
          </div>
        </nav>,
        heroNavSlot,
      )}
    </>
  )
}
