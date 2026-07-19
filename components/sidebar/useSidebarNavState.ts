// All sidebar nav state + scroll choreography, extracted from SidebarNav:
// - Hero name blurs out proportionally as user scrolls
// - Main nav sentence travels from above email up to top, locks at threshold
// - Divider blurs in when last chapter item of first section appears
// - Sub nav blurs in at viewport center after nav locks, chapters stagger in
// - All keywords start lit, dim to ~22% once nav is stuck (active stays full until exploration hover)
// - Hovering another section fades the active keyword; subnav chapter hover does not dim main

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useBodyScrollLock } from '@/lib/hooks/useBodyScrollLock'
import { useDialogFocusTrap } from '@/lib/hooks/useDialogFocusTrap'
import { usePrefersReducedMotion } from '@/lib/hooks/usePrefersReducedMotion'
import { activeSlideIdPublished } from '@/lib/scroll/chapterSlideshow'
import { usePublishedActiveSlideId } from '@/lib/hooks/useChapterReveal'
import { getDocumentScrollY } from '@/lib/scroll/documentScrollY'
import {
  applySidebarHeroNameFade,
  applySidebarShellFade,
  heroNameBlurPx,
  isInBreatherScrollZone,
  isInHeroScrollZone,
  isInInterludeScrollZone,
  isInOutroScrollZone,
  isTopBarInHeroScrollZone,
  resetSidebarShellFade,
} from '@/lib/scroll/heroScroll'
import { getLayoutViewportHeight } from '@/lib/mobileViewport'
import { NAV_SECTIONS, sectionIdForChapter } from '@/lib/nav'
import { sectionEntryChapterId } from '@/lib/sectionEntryChapter'
import { LAYOUT_MQ } from '@/lib/layout/breakpoints'
import { scheduleScrollFrame } from '@/lib/scroll/scrollFrame'
import { useChapterNav } from '@/components/ChapterNavProvider'
import {
  EMAIL_BOTTOM_PX,
  HERO_NAME_BLUR_PX,
  MOBILE_SIDEBAR_MS,
  NAV_TOP_PX,
  STAGGER_MS,
  SUBNAV_DELAY_MS,
  TRANSITION_MS,
} from '@/components/sidebar/constants'

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

function getScrollTop(): number {
  return getDocumentScrollY()
}

export function useSidebarNavState() {
  const usesTopBarNav = useTopBarNav()
  const reducedMotion = usePrefersReducedMotion()
  const { navigateToChapter, navigateToSection, phase: chapterNavPhase } =
    useChapterNav()
  const publishedSlideId = usePublishedActiveSlideId()

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

  const [, setNavIsStuck] = useState(false)
  const [dividerVisible, setDividerVisible] = useState(false)
  const [subNavVisible, setSubNavVisible] = useState(false)
  const [chapterItemsVisible, setChapterItemsVisible] = useState<number[]>([])
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeChapter, setActiveChapter] = useState<string | null>(null)
  const [dimActive, setDimActive] = useState(false)
  const [hoverSectionId, setHoverSectionId] = useState<string | null>(null)
  const [hoverChapterId, setHoverChapterId] = useState<string | null>(null)
  const mobileRailRef = useRef<HTMLButtonElement>(null)

  /** Fade main keywords only when hovering a different section (subnav hover does not dim main). */
  const fadeMainNavSelection =
    hoverSectionId != null &&
    activeSection != null &&
    hoverSectionId !== activeSection

  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const subNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Overlay browse-then-commit: taps stage a destination; Close navigates to it.
      Scrim tap / Escape cancel and the highlight resyncs to the real position. */
  const pendingNavRef = useRef<{ kind: 'section' | 'chapter'; id: string } | null>(
    null,
  )
  const prevStuck = useRef(false)
  const wasInInterludeRef = useRef(false)
  const wasInOutroRef = useRef(false)
  /** Set when we scroll out of the interlude into the sections; stays armed until
      the scroll orchestration publishes an active chapter so the subnav reveal
      isn't lost to a one-frame timing gap at the interlude boundary. */
  const subnavRevealArmedRef = useRef(false)
  const subNavVisibleRef = useRef(false)
  const activeSectionRef = useRef<string | null>(null)
  const activeChapterRef = useRef<string | null>(null)
  const overlayOpenRef = useRef(false)
  const dividerPastHeroRef = useRef(false)
  const sidebarShellRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const navWrapRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)
  const mobileHeroRef = useRef<HTMLDivElement>(null)
  const mobileDrawerPanelRef = useRef<HTMLDivElement>(null)
  const subnavRef = useRef<HTMLElement>(null)
  const [heroNavSlot, setHeroNavSlot] = useState<Element | null>(null)

  useEffect(() => {
    setHeroNavSlot(document.getElementById('hero-mobile-nav-slot'))
  }, [])
  const layoutRef = useRef({ viewportH: 900, navRestTop: 0, threshold: 648 })
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

  const staggerIn = useCallback(
    (sectionId: string, _isFirst = false) => {
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
    },
    [reducedMotion],
  )

  const staggerOut = useCallback(
    (cb: () => void) => {
      staggerTimers.current.forEach(clearTimeout)
      staggerTimers.current = []
      setChapterItemsVisible([])
      if (reducedMotion) {
        cb()
        return
      }
      setTimeout(cb, TRANSITION_MS * 0.55)
    },
    [reducedMotion],
  )

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
      pendingNavRef.current = null
      const id = activeSectionRef.current || NAV_SECTIONS[0].id
      setSubNavVisible(true)
      setDividerVisible(true)
      setDimActive(true)
      staggerIn(id, id === NAV_SECTIONS[0].id)
      return
    }
    if (!prevStuck.current) {
      const t = window.setTimeout(() => {
        setSubNavVisible(false)
        syncSidebarDivider(isInHeroScrollZone())
        setDimActive(false)
        setNavIsStuck(false)
        setChapterItemsVisible([])
        staggerTimers.current.forEach(clearTimeout)
        staggerTimers.current = []
      }, MOBILE_SIDEBAR_MS)
      return () => window.clearTimeout(t)
    }
  }, [usesTopBarNav, mobileDrawerOpen, staggerIn, syncSidebarDivider])

  const syncNavFromPublishedChapter = useCallback(
    (chapterId: string) => {
      if (overlayOpenRef.current) return
      if (chapterNavPhase !== 'idle') return

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
    },
    [chapterNavPhase, staggerIn, staggerOut],
  )

  const applyScrollSpy = useCallback(() => {
    const chapterId = publishedSlideId ?? activeSlideIdPublished()
    if (!chapterId) return
    syncNavFromPublishedChapter(chapterId)
  }, [publishedSlideId, syncNavFromPublishedChapter])

  useEffect(() => {
    if (!publishedSlideId) return
    if (chapterNavPhase !== 'idle') return
    if (
      usesTopBarNav
        ? isTopBarInHeroScrollZone()
        : isInBreatherScrollZone() || isInOutroScrollZone()
    )
      return
    syncNavFromPublishedChapter(publishedSlideId)
  }, [
    publishedSlideId,
    chapterNavPhase,
    usesTopBarNav,
    syncNavFromPublishedChapter,
  ])

  const applyStuckState = useCallback(
    (y: number) => {
      const threshold = stickThresholdRef.current
      const shouldStick = y >= threshold

      if (shouldStick && !prevStuck.current) {
        prevStuck.current = true
        setNavIsStuck(true)
        setDimActive(true)
        subNavTimer.current = setTimeout(() => {
          if (isInInterludeScrollZone()) return
          setSubNavVisible(true)
          const chapterId = activeSlideIdPublished()
          const sectionId = chapterId ? sectionIdForChapter(chapterId) : null
          if (!sectionId) return
          activeSectionRef.current = sectionId
          setActiveSection(sectionId)
          if (chapterId) {
            activeChapterRef.current = chapterId
            setActiveChapter(chapterId)
          }
          staggerIn(sectionId, sectionId === NAV_SECTIONS[0].id)
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
    document.documentElement.classList.toggle(
      'mobile-nav-panel-open',
      usesTopBarNav && mobileDrawerOpen,
    )
    return () => {
      document.documentElement.classList.remove('mobile-nav-panel-open')
    }
  }, [usesTopBarNav, mobileDrawerOpen])

  const drawerOpen = usesTopBarNav && mobileDrawerOpen
  useBodyScrollLock(drawerOpen)
  useDialogFocusTrap(mobileDrawerPanelRef, drawerOpen, subnavRef)

  /** Dismiss without navigating — drops any staged pick and resyncs the
      highlight to the chapter actually on screen. */
  const closeOverlays = useCallback(() => {
    pendingNavRef.current = null
    overlayOpenRef.current = false
    setMobileDrawerOpen(false)
    const chapterId = activeSlideIdPublished()
    if (chapterId) syncNavFromPublishedChapter(chapterId)
  }, [syncNavFromPublishedChapter])

  const applyMobileHeroScroll = useCallback((y: number) => {
    const viewportH = getLayoutViewportHeight() || window.innerHeight
    applySidebarShellFade(mobileHeroRef.current, y, viewportH, 0)
  }, [])

  const applyDesktopNavScroll = useCallback((y: number) => {
    const { viewportH, navRestTop, threshold } = layoutRef.current
    const safeThreshold = threshold > 0 ? threshold : 1

    applySidebarHeroNameFade(heroRef.current, y, viewportH, heroNameBlurPx(HERO_NAME_BLUR_PX))

    const travelT = Math.min(1, y / safeThreshold)
    const navTop =
      y >= safeThreshold
        ? NAV_TOP_PX
        : navRestTop + (NAV_TOP_PX - navRestTop) * travelT
    if (navWrapRef.current) {
      navWrapRef.current.style.top = `${navTop}px`
    }
  }, [])

  const setSidebarShellPositioned = useCallback((ready: boolean) => {
    const shell = sidebarShellRef.current
    if (!shell) return
    if (ready) {
      shell.setAttribute('data-nav-positioned', 'true')
    } else {
      shell.removeAttribute('data-nav-positioned')
    }
  }, [])

  /** Position nav before paint — avoids hero flash at `top: 0` while layout/scroll frame init. */
  useLayoutEffect(() => {
    if (usesTopBarNav) {
      if (mobileDrawerOpen) {
        measureLayout()
        resetSidebarShellFade(sidebarShellRef.current)
        applyDesktopNavScroll(getScrollTop())
        setSidebarShellPositioned(true)
        setMobileNavReady(true)
      } else {
        setSidebarShellPositioned(false)
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
    setSidebarShellPositioned(true)
  }, [
    usesTopBarNav,
    mobileDrawerOpen,
    measureLayout,
    applyDesktopNavScroll,
    applyMobileHeroScroll,
    syncSidebarDivider,
    setSidebarShellPositioned,
  ])

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

      if (
        !inHero &&
        !isInInterludeScrollZone() &&
        !isInOutroScrollZone() &&
        !overlayOpenRef.current
      )
        applyScrollSpy()
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
      const inInterlude = isInInterludeScrollZone()
      const inOutro = isInOutroScrollZone()
      // The closing page sits past every chapter, like the interlude sits before
      // them — neither should highlight a section in the nav.
      const inBreather = inInterlude || inOutro
      if (inHero !== lastHtmlHeroClassRef.current) {
        lastHtmlHeroClassRef.current = inHero
        document.documentElement.classList.toggle('in-hero-scroll', inHero)
        document.documentElement.classList.toggle('past-hero-scroll', !inHero)
      }
      syncSidebarDivider(inHero)
      applyDesktopNavScroll(y)
      applyStuckState(y)
      if (inBreather) {
        subnavRevealArmedRef.current = false
        setSubNavVisible(false)
        if (activeSectionRef.current !== null) {
          activeSectionRef.current = null
          setActiveSection(null)
          activeChapterRef.current = null
          setActiveChapter(null)
        }
        setDimActive(false)
      } else {
        // Leaving a breather zone (interlude above, outro below) back into the
        // sections arms the reveal; keep it armed until the orchestration has
        // published an active chapter (it can lag the boundary by a frame or
        // two). Without the retry the one-frame reveal is missed and the chapter
        // list never reappears until a section click.
        if (
          (wasInInterludeRef.current || wasInOutroRef.current) &&
          prevStuck.current
        ) {
          subnavRevealArmedRef.current = true
        }
        if (subnavRevealArmedRef.current) {
          subNavVisibleRef.current = true
          setSubNavVisible(true)
          setDimActive(true)
          const chapterId = activeSlideIdPublished()
          const sectionId = chapterId ? sectionIdForChapter(chapterId) : null
          if (sectionId) {
            activeSectionRef.current = sectionId
            setActiveSection(sectionId)
            activeChapterRef.current = chapterId
            setActiveChapter(chapterId)
            staggerIn(sectionId, sectionId === NAV_SECTIONS[0].id)
            subnavRevealArmedRef.current = false
          }
        }
        if (!inHero && !overlayOpenRef.current) applyScrollSpy()
      }
      wasInInterludeRef.current = inInterlude
      wasInOutroRef.current = inOutro
    })
  }, [
    usesTopBarNav,
    applyStuckState,
    applyScrollSpy,
    measureLayout,
    applyDesktopNavScroll,
    syncSidebarDivider,
    staggerIn,
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

  const scrollToChapter = (chapterId: string) => {
    const overlayBrowse = usesTopBarNav && mobileDrawerOpen
    const sectionId = sectionIdForChapter(chapterId)
    if (sectionId) {
      activeSectionRef.current = sectionId
      setActiveSection(sectionId)
      switchSection(sectionId, { animate: false })
    }
    activeChapterRef.current = chapterId
    setActiveChapter(chapterId)
    if (overlayBrowse) {
      // Overlay taps only stage the destination; Close commits it.
      pendingNavRef.current = { kind: 'chapter', id: chapterId }
      return
    }
    void navigateToChapter(chapterId).then(syncScrollAfterNavigate)
  }

  const scrollToSection = (id: string) => {
    const overlayBrowse = usesTopBarNav && mobileDrawerOpen
    const sec = NAV_SECTIONS.find((s) => s.id === id)
    activeSectionRef.current = id
    setActiveSection(id)
    switchSection(id, { animate: false })
    if (sec) {
      const entryChapterId = sectionEntryChapterId(id)
      activeChapterRef.current = entryChapterId
      setActiveChapter(entryChapterId)
    }
    if (overlayBrowse) {
      pendingNavRef.current = { kind: 'section', id }
      return
    }
    void navigateToSection(id).then(syncScrollAfterNavigate)
  }

  /** Close button in the overlay: dismiss and navigate to the staged pick. */
  const commitOverlaySelection = () => {
    const pending = pendingNavRef.current
    pendingNavRef.current = null
    if (!pending) {
      closeOverlays()
      return
    }
    overlayOpenRef.current = false
    setMobileDrawerOpen(false)
    // Close first so useBodyScrollLock releases before navigation scrolls.
    // Two rAFs: rAF1 fires before paint, useEffect cleanup runs after paint,
    // then rAF2 fires with the body unlocked and scrollTo working.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const run =
          pending.kind === 'chapter'
            ? navigateToChapter(pending.id)
            : navigateToSection(pending.id)
        void run.then(syncScrollAfterNavigate)
      })
    })
  }

  const currentSection =
    NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0]

  const overlaySubnav = usesTopBarNav && mobileDrawerOpen
  const subnavInteractive = subNavVisible || overlaySubnav

  const showMobileRail = usesTopBarNav && !mobileInHero && !mobileDrawerOpen
  const showMobileHero = usesTopBarNav && mobileInHero && !mobileDrawerOpen

  const shellUsesOverlayWidth = usesTopBarNav && mobileDrawerOpen

  return {
    usesTopBarNav,
    reducedMotion,
    mobileDrawerOpen,
    setMobileDrawerOpen,
    mobileNavReady,
    closeOverlays,
    dividerVisible,
    chapterItemsVisible,
    activeSection,
    activeChapter,
    dimActive,
    hoverSectionId,
    setHoverSectionId,
    hoverChapterId,
    setHoverChapterId,
    fadeMainNavSelection,
    heroNavSlot,
    mobileRailRef,
    sidebarShellRef,
    heroRef,
    navWrapRef,
    contactRef,
    mobileHeroRef,
    mobileDrawerPanelRef,
    subnavRef,
    scrollToChapter,
    scrollToSection,
    commitOverlaySelection,
    currentSection,
    overlaySubnav,
    subnavInteractive,
    showMobileRail,
    showMobileHero,
    shellUsesOverlayWidth,
  }
}
