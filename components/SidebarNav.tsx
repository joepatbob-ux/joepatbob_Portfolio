// components/SidebarNav.tsx
// Full scroll choreography:
// - Hero name blurs out proportionally as user scrolls
// - Main nav sentence travels from above email up to top, locks at threshold
// - Divider blurs in when last chapter item of first section appears
// - Sub nav blurs in at viewport center after nav locks, chapters stagger in
// - All keywords start lit, dim to ~22% once nav is stuck (active stays full until exploration hover)
// - Hovering another section fades the active keyword; subnav chapter hover does not dim main
// - Subnav: selected = muted-accent fill; any hover = muted-accent outline ring (selected never dimmed)
// - Email pill is fixed at bottom

'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { pickHardwareChapterFromScroll } from '@/lib/hardware/chapters'
import { applySidebarHeroNameFade, applySidebarShellFade, hideSidebarShell, isInHeroScrollZone, resetSidebarShellFade } from '@/lib/heroScroll'
import { NAV_SECTIONS, sectionIdForChapter } from '@/lib/nav'
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
const NAV_OUTLINE = 'var(--color-nav-pill-outline)'
const STAGGER_MS      = 60
const TRANSITION_MS   = 320
const SUBNAV_DELAY_MS = 280
const BLUR_PX         = 6
const NAV_TOP_PX      = 40
const EMAIL_BOTTOM_PX = 40

/** Phone overlay nav — keep in sync with `LAYOUT_MQ.mobile` / globals.css */
const MOBILE_MAX = LAYOUT_MQ.mobile


function readIsMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(MOBILE_MAX).matches
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(readIsMobile)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MAX)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return isMobile
}

function readIsTablet(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia(LAYOUT_MQ.tablet).matches
}

function useIsTablet() {
  const [isTablet, setIsTablet] = useState(readIsTablet)
  useEffect(() => {
    const mq = window.matchMedia(LAYOUT_MQ.tablet)
    const sync = () => setIsTablet(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return isTablet
}

function SidebarOverlayClose({
  onClose,
  variant,
}: {
  onClose: () => void
  variant: 'tablet' | 'mobile-panel'
}) {
  return (
    <button
      type="button"
      className={[
        'sidebar-overlay-close',
        `sidebar-overlay-close--${variant}`,
        'sidebar-action--secondary',
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
    </button>
  )
}


/** Main nav section keywords: orange + opacity dimming when stuck. */
function navKeywordStyle(opts: {
  dimActive: boolean
  isActive: boolean
  isHoverThis: boolean
  selectionExploringElsewhere: boolean
}): { color: string; opacity: number } {
  const { dimActive, isActive, isHoverThis, selectionExploringElsewhere } = opts
  if (!dimActive) return { color: ACCENT, opacity: 1 }
  if (isActive) {
    return {
      color: selectionExploringElsewhere ? NAV_FADED : ACCENT,
      opacity: 1,
    }
  }
  return {
    color: ACCENT,
    opacity: isHoverThis ? 1 : 0.22,
  }
}

// ── DARK MODE ─────────────────────────────────────────────────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return dark
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function toChapterId(sectionId: string, chapterId: string): string {
  return `${sectionId}-${chapterId}`
}

function getScrollTop(): number {
  return document.scrollingElement?.scrollTop ?? window.scrollY
}

/** Viewport band aligned with sub-nav spy (matches former IO rootMargin). */
const SPY_BAND_TOP = 0.15
const SPY_BAND_BOTTOM = 0.15
const SPY_MIN_SCORE = 0.02

function visibleBandScore(rect: DOMRect, vh: number): number {
  const bandTop = vh * SPY_BAND_TOP
  const bandBottom = vh * (1 - SPY_BAND_BOTTOM)
  const bandHeight = bandBottom - bandTop
  const visibleTop = Math.max(rect.top, bandTop)
  const visibleBottom = Math.min(rect.bottom, bandBottom)
  const visible = Math.max(0, visibleBottom - visibleTop)
  if (visible <= 0) return 0
  return visible / Math.min(rect.height, bandHeight)
}

function pickActiveSpyTarget(): { chapterId: string | null; sectionId: string | null } {
  const vh = window.innerHeight

  let bestChapterId: string | null = null
  let bestChapterScore = 0
  document.querySelectorAll<HTMLElement>('.portfolio-chapter-slot[data-chapter-id]').forEach((el) => {
    const id = el.dataset.chapterId
    if (!id) return
    const score = visibleBandScore(el.getBoundingClientRect(), vh)
    if (score > bestChapterScore) {
      bestChapterScore = score
      bestChapterId = id
    }
  })

  if (bestChapterId && bestChapterScore >= SPY_MIN_SCORE) {
    return { chapterId: bestChapterId, sectionId: sectionIdForChapter(bestChapterId) }
  }

  let bestSectionId: string | null = null
  let bestSectionScore = 0
  document.querySelectorAll<HTMLElement>('[data-section-id]').forEach((el) => {
    const id = el.dataset.sectionId
    if (!id) return
    const score = visibleBandScore(el.getBoundingClientRect(), vh)
    if (score > bestSectionScore) {
      bestSectionScore = score
      bestSectionId = id
    }
  })

  if (bestSectionId && bestSectionScore >= SPY_MIN_SCORE) {
    const sec = NAV_SECTIONS.find((s) => s.id === bestSectionId)
    const first = sec?.chapters[0]
    return {
      sectionId: bestSectionId,
      chapterId: first ? toChapterId(bestSectionId, first.id) : null,
    }
  }

  return { chapterId: null, sectionId: null }
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function SidebarNav() {
  const dark = useDarkMode()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { navigateToChapter, navigateToSection } = useChapterNav()
  const C = {
    ink:     dark ? '#f0eeea' : '#0d0d0d',
    divider: 'var(--color-rule)',
  }

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileInHero, setMobileInHero] = useState(() =>
    typeof window !== 'undefined' ? isInHeroScrollZone() : true,
  )
  const mobileInHeroRef = useRef(mobileInHero)
  const [tabletSidebarOpen, setTabletSidebarOpen] = useState(false)
  const [tabletInHero, setTabletInHero] = useState(() =>
    typeof window !== 'undefined' ? isInHeroScrollZone() : true,
  )
  const tabletInHeroRef = useRef(tabletInHero)

  const [navIsStuck,          setNavIsStuck]          = useState(false)
  const [dividerVisible,      setDividerVisible]      = useState(false)
  const [subNavVisible,       setSubNavVisible]       = useState(false)
  const [chapterItemsVisible, setChapterItemsVisible] = useState<number[]>([])
  const [activeSection,       setActiveSection]       = useState<string | null>(null)
  const [activeChapter,       setActiveChapter]       = useState<string | null>(null)
  const [dimActive,           setDimActive]           = useState(false)
  const [hoverSectionId, setHoverSectionId] = useState<string | null>(null)
  const [hoverChapterId, setHoverChapterId] = useState<string | null>(null)

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
  const [desktopNavReady, setDesktopNavReady] = useState(false)
  const sidebarShellRef = useRef<HTMLDivElement>(null)
  const heroRef       = useRef<HTMLDivElement>(null)
  const navWrapRef    = useRef<HTMLDivElement>(null)
  const contactRef    = useRef<HTMLDivElement>(null)
  const mobileHeroRef = useRef<HTMLDivElement>(null)
  const layoutRef     = useRef({ viewportH: 900, navRestTop: 0, threshold: 648 })
  const stickThresholdRef = useRef(648)

  const measureLayout = useCallback(() => {
    const vh = window.innerHeight
    let navRest = 0
    if (navWrapRef.current && contactRef.current) {
      navRest =
        vh -
        EMAIL_BOTTOM_PX -
        contactRef.current.clientHeight -
        12 -
        navWrapRef.current.clientHeight
    }
    layoutRef.current = { viewportH: vh, navRestTop: navRest, threshold: vh * 0.72 }
    stickThresholdRef.current = vh * 0.72
  }, [])

  useEffect(() => {
    if (
      isMobile
        ? !mobileDrawerOpen
        : isTablet && !tabletSidebarOpen && !tabletInHero
    ) {
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
  }, [isMobile, isTablet, mobileDrawerOpen, tabletSidebarOpen, tabletInHero, measureLayout])

  const staggerIn = useCallback((sectionId: string, isFirst = false) => {
    staggerTimers.current.forEach(clearTimeout)
    staggerTimers.current = []
    setChapterItemsVisible([])
    const sec = NAV_SECTIONS.find((s) => s.id === sectionId)
    if (!sec) return
    sec.chapters.forEach((_, i) => {
      const t = setTimeout(() => {
        setChapterItemsVisible((prev) => [...prev, i])
        if (isFirst && i === sec.chapters.length - 1) setDividerVisible(true)
      }, i * STAGGER_MS)
      staggerTimers.current.push(t)
    })
  }, [])

  const staggerOut = useCallback((cb: () => void) => {
    staggerTimers.current.forEach(clearTimeout)
    staggerTimers.current = []
    setChapterItemsVisible([])
    setTimeout(cb, TRANSITION_MS * 0.55)
  }, [])

  const switchSection = useCallback(
    (id: string) => {
      setActiveSection((prev) => {
        if (prev === id) return prev
        if (subNavVisibleRef.current) staggerOut(() => staggerIn(id))
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
    overlayOpenRef.current = mobileDrawerOpen || tabletSidebarOpen
  }, [mobileDrawerOpen, tabletSidebarOpen])

  /** Expanded overlay panel: reveal chapter subnav even before scroll-lock threshold. */
  useEffect(() => {
    const overlayOpen =
      (isTablet && tabletSidebarOpen) || (isMobile && mobileDrawerOpen)
    if (!isTablet && !isMobile) return
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
      setDividerVisible(false)
      setDimActive(false)
      setNavIsStuck(false)
      setChapterItemsVisible([])
      staggerTimers.current.forEach(clearTimeout)
      staggerTimers.current = []
    }
  }, [isTablet, isMobile, tabletSidebarOpen, mobileDrawerOpen, staggerIn])

  const applyScrollSpy = useCallback(() => {
    if (overlayOpenRef.current) return

    const hardwareArticle = document.querySelector('[data-section-id="hardware"]')
    if (hardwareArticle) {
      const rect = hardwareArticle.getBoundingClientRect()
      const vh = window.innerHeight
      if (rect.top < vh * 0.85 && rect.bottom > vh * 0.15) {
        const chapterId = pickHardwareChapterFromScroll()
        if (activeChapterRef.current !== chapterId) {
          activeChapterRef.current = chapterId
          setActiveChapter(chapterId)
        }
        if (activeSectionRef.current !== 'hardware') {
          activeSectionRef.current = 'hardware'
          setActiveSection('hardware')
          if (subNavVisibleRef.current) staggerOut(() => staggerIn('hardware'))
        }
        return
      }
    }

    const { chapterId, sectionId } = pickActiveSpyTarget()
    if (!sectionId) return

    if (chapterId && activeChapterRef.current !== chapterId) {
      activeChapterRef.current = chapterId
      setActiveChapter(chapterId)
    }

    if (activeSectionRef.current !== sectionId) {
      activeSectionRef.current = sectionId
      setActiveSection(sectionId)
      if (subNavVisibleRef.current) staggerOut(() => staggerIn(sectionId))
    }
  }, [staggerIn, staggerOut])

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
          const { sectionId, chapterId } = pickActiveSpyTarget()
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
        setDividerVisible(false)
        setDimActive(false)
        setChapterItemsVisible([])
        if (subNavTimer.current) clearTimeout(subNavTimer.current)
        staggerTimers.current.forEach(clearTimeout)
      }
    },
    [staggerIn],
  )

  useEffect(() => {
    if (isMobile && mobileInHero && mobileDrawerOpen) {
      setMobileDrawerOpen(false)
    }
  }, [isMobile, mobileInHero, mobileDrawerOpen])

  useEffect(() => {
    document.documentElement.classList.toggle('mobile-top-nav-active', isMobile && !mobileInHero)
    document.documentElement.classList.toggle('mobile-nav-panel-open', isMobile && mobileDrawerOpen)
    return () => {
      document.documentElement.classList.remove('mobile-top-nav-active', 'mobile-nav-panel-open')
    }
  }, [isMobile, mobileInHero, mobileDrawerOpen])

  useEffect(() => {
    if (!isMobile || !mobileDrawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, mobileDrawerOpen])

  const closeOverlays = useCallback(() => {
    setMobileDrawerOpen(false)
    setTabletSidebarOpen(false)
  }, [])

  const applyMobileHeroScroll = useCallback((y: number) => {
    applySidebarShellFade(mobileHeroRef.current, y, window.innerHeight, BLUR_PX)
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

  const applyTabletHeroSidebarScroll = useCallback((y: number) => {
    const { viewportH, navRestTop, threshold } = layoutRef.current
    const safeThreshold = threshold > 0 ? threshold : 1

    applySidebarShellFade(sidebarShellRef.current, y, viewportH, BLUR_PX)

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
    if (isMobile) {
      if (mobileDrawerOpen) {
        measureLayout()
        resetSidebarShellFade(sidebarShellRef.current)
        applyDesktopNavScroll(getScrollTop())
        setDesktopNavReady(true)
      } else {
        setDesktopNavReady(false)
        const y = getScrollTop()
        if (mobileInHero) {
          applyMobileHeroScroll(y)
        } else {
          resetSidebarShellFade(mobileHeroRef.current)
        }
      }
      return
    }

    if (isTablet) {
      if (tabletSidebarOpen || tabletInHero) {
        measureLayout()
        const y = getScrollTop()
        if (tabletInHero && !tabletSidebarOpen) {
          applyTabletHeroSidebarScroll(y)
        } else if (tabletSidebarOpen) {
          resetSidebarShellFade(sidebarShellRef.current)
          applyDesktopNavScroll(y)
        } else {
          hideSidebarShell(sidebarShellRef.current)
        }
        setDesktopNavReady(true)
      } else {
        hideSidebarShell(sidebarShellRef.current)
        setDesktopNavReady(false)
      }
      return
    }

    measureLayout()
    applyDesktopNavScroll(getScrollTop())
    setDesktopNavReady(true)
  }, [isMobile, isTablet, mobileInHero, mobileDrawerOpen, tabletSidebarOpen, tabletInHero, measureLayout, applyDesktopNavScroll, applyTabletHeroSidebarScroll, applyMobileHeroScroll])

  /** Mobile: hero intro fades on scroll; pill + drawer overlay after hero. */
  useEffect(() => {
    if (!isMobile) return

    return scheduleScrollFrame(() => {
      const y = getScrollTop()
      const inHero = isInHeroScrollZone()

      if (inHero !== mobileInHeroRef.current) {
        mobileInHeroRef.current = inHero
        setMobileInHero(inHero)
      }

      if (inHero && !mobileDrawerOpen) {
        applyMobileHeroScroll(y)
      } else {
        resetSidebarShellFade(mobileHeroRef.current)
      }

      if (!inHero && !overlayOpenRef.current) applyScrollSpy()
    })
  }, [isMobile, mobileDrawerOpen, applyScrollSpy, applyMobileHeroScroll])

  useEffect(() => {
    if ((!isMobile && !isTablet) || !(mobileDrawerOpen || tabletSidebarOpen)) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeOverlays()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile, isTablet, mobileDrawerOpen, tabletSidebarOpen, closeOverlays])

  useEffect(() => {
    if (!isTablet || !tabletSidebarOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isTablet, tabletSidebarOpen])

  useEffect(() => {
    if (!isTablet) return
    const active = tabletInHero && !tabletSidebarOpen
    document.documentElement.classList.toggle('sidebar-tablet-hero-active', active)
    return () => {
      document.documentElement.classList.remove('sidebar-tablet-hero-active')
    }
  }, [isTablet, tabletInHero, tabletSidebarOpen])

  // Scroll-linked sidebar hero name + nav travel — one shared scroll frame (no idle rAF loop).
  useEffect(() => {
    if (isMobile) return

    const tabletSidebarLive =
      isTablet && (tabletSidebarOpen || tabletInHero)

    if (!isTablet || tabletSidebarLive) measureLayout()

    return scheduleScrollFrame(() => {
      const y = getScrollTop()

      if (isTablet) {
        const inHero = isInHeroScrollZone()
        if (inHero !== tabletInHeroRef.current) {
          tabletInHeroRef.current = inHero
          setTabletInHero(inHero)
        }

        if (tabletSidebarOpen) {
          resetSidebarShellFade(sidebarShellRef.current)
          applyDesktopNavScroll(y)
        } else if (inHero) {
          applyTabletHeroSidebarScroll(y)
        } else {
          hideSidebarShell(sidebarShellRef.current)
        }
      } else {
        applyDesktopNavScroll(y)
      }

      applyStuckState(y)
      if ((isTablet || prevStuck.current) && !overlayOpenRef.current) applyScrollSpy()
    })
  }, [
    isMobile,
    isTablet,
    tabletSidebarOpen,
    tabletInHero,
    applyStuckState,
    applyScrollSpy,
    measureLayout,
    applyDesktopNavScroll,
    applyTabletHeroSidebarScroll,
  ])

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

  const scrollToSection = (id: string) => {
    const closeAfter = mobileDrawerOpen || tabletSidebarOpen
    const sec = NAV_SECTIONS.find((s) => s.id === id)
    activeSectionRef.current = id
    switchSection(id)
    if (sec) {
      activeChapterRef.current = toChapterId(id, sec.chapters[0].id)
      setActiveChapter(activeChapterRef.current)
    }
    void navigateToSection(id).then(() => finishNavigate(closeAfter))
  }

  const scrollToChapter = (chapterId: string) => {
    const closeAfter = mobileDrawerOpen || tabletSidebarOpen
    const sectionId = sectionIdForChapter(chapterId)
    if (sectionId) {
      activeSectionRef.current = sectionId
      switchSection(sectionId)
    }
    activeChapterRef.current = chapterId
    setActiveChapter(chapterId)
    void navigateToChapter(chapterId).then(() => finishNavigate(closeAfter))
  }

  const currentSection = NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0]

  const tabletOverlaySubnav = isTablet && tabletSidebarOpen
  const mobileOverlaySubnav = isMobile && mobileDrawerOpen
  const overlaySubnav = tabletOverlaySubnav || mobileOverlaySubnav
  const subnavInteractive = subNavVisible || overlaySubnav

  const showMobileRail = isMobile && !mobileInHero && !mobileDrawerOpen
  const showMobileHero = isMobile && mobileInHero && !mobileDrawerOpen

  const showTabletRail = isTablet && !tabletSidebarOpen && !tabletInHero

  const shellUsesOverlayWidth =
    (isMobile && mobileDrawerOpen) ||
    (isTablet && (tabletSidebarOpen || tabletInHero))

  const shellClass = [
    'sidebar-desktop-shell',
    tabletSidebarOpen ? 'sidebar-tablet-expanded' : '',
    mobileDrawerOpen ? 'sidebar-mobile-expanded' : '',
    tabletInHero && !tabletSidebarOpen ? 'sidebar-tablet-hero' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const subnavClass = [
    'sidebar-desktop-subnav',
    tabletSidebarOpen ? 'sidebar-tablet-expanded' : '',
    mobileDrawerOpen ? 'sidebar-mobile-expanded' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      {/* Mobile: hero intro → top rail (tablet pattern) → expand panel + scrim */}
      <div className="sidebar-mobile-nav">
        <div
          className={`sidebar-mobile-backdrop${mobileDrawerOpen ? ' sidebar-mobile-backdrop--visible' : ''}`}
          role="presentation"
          aria-hidden={mobileDrawerOpen ? undefined : true}
          onClick={closeOverlays}
        />

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
              <p
                style={{
                  fontFamily: FONT_AHG,
                  fontWeight: 700,
                  fontSize: 'clamp(18px, 6vw, 24px)',
                  lineHeight: 1.2,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  color: C.ink,
                  margin: 0,
                  width: 'min(100%, 380px)',
                }}
              >
                {'I simplify complex systems across '}
                {NAV_SECTIONS.map((sec, i) => {
                  const connector =
                    i === NAV_SECTIONS.length - 2
                      ? ', and '
                      : i < NAV_SECTIONS.length - 1
                        ? ', '
                        : '.'
                  return (
                    <span key={sec.id}>
                      <button
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
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
                        {sec.label}
                      </button>
                      {connector}
                    </span>
                  )
                })}
              </p>
          </div>
        </nav>

        <button
          type="button"
          className={[
            'sidebar-mobile-rail',
            showMobileRail ? 'sidebar-mobile-rail--visible' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-expanded={mobileDrawerOpen}
          aria-controls="sidebar-tablet-panel"
          aria-hidden={showMobileRail ? undefined : true}
          tabIndex={showMobileRail ? 0 : -1}
          onClick={() => setMobileDrawerOpen(true)}
        >
          <span className="sidebar-mobile-rail__blur" aria-hidden />
          <p className="sidebar-mobile-rail__label">
            <span className="sidebar-mobile-rail__copy sidebar-mobile-rail__copy--long">
              I simplify complex systems for{' '}
              <span className="sidebar-mobile-rail__label-accent">{currentSection.label}</span>
            </span>
            <span className="sidebar-mobile-rail__copy sidebar-mobile-rail__copy--short">
              I simplify systems for{' '}
              <span className="sidebar-mobile-rail__label-accent">{currentSection.label}</span>
            </span>
          </p>
        </button>
      </div>

      {/* Tablet: vertical rail → full desktop sidebar overlay */}
      {isTablet ? (
        <button
          type="button"
          className={`sidebar-tablet-rail${showTabletRail && !tabletSidebarOpen ? ' sidebar-tablet-rail--visible' : ''}`}
          aria-expanded={tabletSidebarOpen}
          aria-controls="sidebar-tablet-panel"
          aria-hidden={showTabletRail && !tabletSidebarOpen ? undefined : true}
          tabIndex={showTabletRail && !tabletSidebarOpen ? 0 : -1}
          onClick={() => setTabletSidebarOpen(true)}
        >
          <p className="sidebar-tablet-rail__label">
            I simplify complex systems for{' '}
            <span className="sidebar-tablet-rail__label-accent">{currentSection.label}</span>
          </p>
        </button>
      ) : null}
      {isTablet ? (
        <div
          className={`sidebar-tablet-backdrop${tabletSidebarOpen ? ' sidebar-tablet-backdrop--visible' : ''}`}
          role="presentation"
          aria-hidden={tabletSidebarOpen ? undefined : true}
          onClick={closeOverlays}
        >
          {tabletSidebarOpen ? (
            <div className="sidebar-tablet-backdrop__content">
              <SidebarOverlayClose onClose={closeOverlays} variant="tablet" />
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Sidebar shell — desktop; tablet expands as overlay */}
      <div
        id="sidebar-tablet-panel"
        className={shellClass}
        role={mobileDrawerOpen ? 'dialog' : undefined}
        aria-modal={mobileDrawerOpen ? true : undefined}
        aria-label={mobileDrawerOpen ? 'Navigation menu' : undefined}
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
            zIndex: 100,
            pointerEvents:
              (isTablet && tabletSidebarOpen) || (isMobile && mobileDrawerOpen)
                ? 'auto'
                : 'none',
          }}
          onClick={(e) => {
            if ((e.target as Element).closest('[data-sidebar-nav-hit]')) return
            if (isTablet && tabletSidebarOpen) setTabletSidebarOpen(false)
            if (isMobile && mobileDrawerOpen) setMobileDrawerOpen(false)
          }}
        >
        {!(isMobile && mobileDrawerOpen) ? (
          <div
            aria-hidden
            className="sidebar-shell__divider"
            style={{
              opacity: dividerVisible ? 1 : 0,
              filter: dividerVisible ? 'blur(0)' : `blur(${BLUR_PX}px)`,
              transition: 'opacity 600ms ease, filter 600ms ease',
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
            top: 40,
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
          style={{
            position: 'absolute',
            transition: 'none',
            pointerEvents: 'auto',
          }}
        >
          <p className="sidebar-main-nav__sentence" style={{ color: C.ink }}>
            {'I simplify complex systems across '}
            {NAV_SECTIONS.map((sec, i) => {
              const isActive  = activeSection === sec.id
              const connector = i === NAV_SECTIONS.length - 2 ? ', and ' : i < NAV_SECTIONS.length - 1 ? ', ' : '.'
              const isHoverThis = hoverSectionId === sec.id
              const { color: mainColor, opacity: mainOpacity } = navKeywordStyle({
                dimActive,
                isActive,
                isHoverThis,
                selectionExploringElsewhere: fadeMainNavSelection,
              })
              return (
                  <span key={sec.id}>
                  <span
                    onClick={() => scrollToSection(sec.id)}
                    style={{
                      color: mainColor,
                      cursor: 'pointer',
                      opacity: mainOpacity,
                      transition: 'opacity 220ms ease, color 200ms ease',
                      display: 'inline',
                    }}
                    onMouseEnter={() => {
                      setHoverSectionId(sec.id)
                      setHoverChapterId(null)
                    }}
                    onMouseLeave={() => {
                      setHoverSectionId((prev) => (prev === sec.id ? null : prev))
                    }}
                  >
                    {sec.label}
                  </span>
                  {connector}
                </span>
              )
            })}
          </p>
        </div>

        {/* Contact — liquid split; mobile overlay stacks divider + close below */}
        {isMobile && mobileDrawerOpen ? (
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
              bottom: EMAIL_BOTTOM_PX,
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
      <div
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
          const chapterFill = isActive ? NAV_PILL_1 : 'transparent'
          const chapterRing = isHoverThis ? `0 0 0 1px ${NAV_OUTLINE}` : 'none'
          return (
            <span key={chapter.id} onClick={() => scrollToChapter(chId)}
              aria-current={isActive ? 'true' : undefined}
              style={{
                display: 'inline-flex',
                alignSelf: 'flex-start',
                alignItems: 'center',
                cursor: 'pointer',
                userSelect: 'none',
                opacity: isVisible ? 1 : 0,
                filter: isVisible ? 'blur(0)' : `blur(${BLUR_PX}px)`,
                transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity ${TRANSITION_MS}ms ease ${i * 20}ms, filter ${TRANSITION_MS}ms ease ${i * 20}ms, transform ${TRANSITION_MS}ms ease ${i * 20}ms, background 180ms ease, box-shadow 180ms ease`,
                pointerEvents: isVisible ? 'auto' : 'none',
                borderRadius: 9999,
                padding: '5px 14px',
                background: chapterFill,
                boxShadow: chapterRing,
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
                  color: ACCENT,
                }}
              >
                {chapter.label}
              </span>
            </span>
          )
        })}
      </div>
      </div>
    </>
  )
}
