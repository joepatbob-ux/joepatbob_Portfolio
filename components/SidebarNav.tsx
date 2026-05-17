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

import { useEffect, useRef, useState, useCallback } from 'react'
import { NAV_SECTIONS, sectionIdForChapter } from '@/lib/nav'
import { ContactButton } from '@/components/ContactButton'
import { useHandedness } from '@/components/HandednessProvider'

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

/** Phone overlay nav; keep in sync with `globals.css` (`max-width: 767px`). Tablet layout TODO. */
const MOBILE_MAX = '(max-width: 767px)'

const MOBILE_BAR_H = 52
const MOBILE_MORPH_BOTTOM_PAD = 28
/** Scroll distance (fraction of viewport) over which the hero nav travels into the top bar */
const MOBILE_MORPH_SCROLL_RATIO = 0.54

function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MAX)
    const sync = () => setIsMobile(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return isMobile
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
  document.querySelectorAll<HTMLElement>('[data-chapter-id]').forEach((el) => {
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
  const { handedness } = useHandedness()
  const C = {
    ink:     dark ? '#f0eeea' : '#0d0d0d',
    divider: 'var(--color-rule)',
  }

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

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
  const heroRef       = useRef<HTMLDivElement>(null)
  const navWrapRef    = useRef<HTMLDivElement>(null)
  const contactRef    = useRef<HTMLDivElement>(null)
  const mobileMorphShellRef = useRef<HTMLDivElement>(null)
  const mobileExpandedLayerRef = useRef<HTMLDivElement>(null)
  const mobileExpandedHRef = useRef(MOBILE_BAR_H + 96)
  const mobileCompactBtnRef = useRef<HTMLButtonElement>(null)
  const mobileDrawerHostRef = useRef<HTMLDivElement>(null)
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
    if (isMobile) return
    measureLayout()
    window.addEventListener('resize', measureLayout)
    const ro = new ResizeObserver(measureLayout)
    if (navWrapRef.current) ro.observe(navWrapRef.current)
    if (contactRef.current) ro.observe(contactRef.current)
    return () => {
      window.removeEventListener('resize', measureLayout)
      ro.disconnect()
    }
  }, [isMobile, measureLayout])

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

  const applyScrollSpy = useCallback(() => {
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
    if (!isMobile || !mobileDrawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isMobile, mobileDrawerOpen])

  /** Mobile: hero nav travels upward and morphs into the accent bar (scroll-linked, no CSS transition). */
  useEffect(() => {
    if (!isMobile) return
    let rafId = 0

    const accentRgb = { r: 222, g: 62, b: 24 }

    const frame = () => {
      const y = getScrollTop()
      const vh = window.innerHeight
      const threshold = Math.max(96, vh * MOBILE_MORPH_SCROLL_RATIO)
      const travelT = Math.min(1, Math.max(0, y / threshold))

      if (mobileExpandedLayerRef.current && travelT < 0.14) {
        const measured = mobileExpandedLayerRef.current.offsetHeight
        if (measured > MOBILE_BAR_H + 24) {
          mobileExpandedHRef.current = measured
        }
      }

      const H0 = Math.max(mobileExpandedHRef.current, MOBILE_BAR_H + 48)
      const hMorph = smoothstep(0.38, 1, travelT)
      const hInterp = H0 + (MOBILE_BAR_H - H0) * hMorph

      const topPx = Math.max(
        0,
        (vh - MOBILE_MORPH_BOTTOM_PAD - hInterp) * (1 - travelT),
      )

      const gutter =
        16 * (1 - smoothstep(0.82, 0.995, travelT))

      /* Hero copy sits flush on the photo — no frosted panel; accent fills in only as we pin the bar */
      const tSolid = smoothstep(0.58, 0.9, travelT)
      const rr = accentRgb.r
      const gg = accentRgb.g
      const bb = accentRgb.b

      const shell = mobileMorphShellRef.current
      if (shell) {
        shell.style.position = 'fixed'
        shell.style.left = `${gutter}px`
        shell.style.right = `${gutter}px`
        shell.style.top = `${topPx}px`
        shell.style.width = 'auto'
        shell.style.height = `${hInterp}px`
        shell.style.boxSizing = 'border-box'
        shell.style.borderRadius = '0'
        shell.style.backgroundColor =
          tSolid < 0.008 ? 'transparent' : `rgba(${rr},${gg},${bb},${tSolid})`
        shell.style.boxShadow =
          travelT >= 0.96 && mobileDrawerOpen
            ? '0 8px 28px rgba(0,0,0,0.18)'
            : 'none'
        shell.style.overflow = 'hidden'
        shell.style.pointerEvents = 'auto'
      }

      const expandedOp = 1 - smoothstep(0.18, 0.68, travelT)
      const expandedLayer = mobileExpandedLayerRef.current
      if (expandedLayer) {
        expandedLayer.style.opacity = String(expandedOp)
        expandedLayer.style.pointerEvents = expandedOp > 0.28 ? 'auto' : 'none'
      }

      const compactOp = smoothstep(0.48, 0.88, travelT)
      const compactBtn = mobileCompactBtnRef.current
      if (compactBtn) {
        compactBtn.style.opacity = String(compactOp)
        compactBtn.style.pointerEvents =
          compactOp > 0.82 ? 'auto' : 'none'
      }

      const drawerHost = mobileDrawerHostRef.current
      if (drawerHost) {
        drawerHost.style.position = 'fixed'
        drawerHost.style.left = `${gutter}px`
        drawerHost.style.right = `${gutter}px`
        drawerHost.style.top = `${topPx + hInterp}px`
        drawerHost.style.zIndex = '110'
        drawerHost.style.pointerEvents = mobileDrawerOpen ? 'auto' : 'none'
      }

      applyScrollSpy()

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [isMobile, applyScrollSpy, mobileDrawerOpen])

  useEffect(() => {
    if (!isMobile || !mobileDrawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isMobile, mobileDrawerOpen])

  // Scroll-linked hero blur + nav travel: rAF + direct DOM (not batched React state).
  useEffect(() => {
    if (isMobile) return
    let rafId = 0

    const frame = () => {
      const y = getScrollTop()
      const { viewportH, navRestTop, threshold } = layoutRef.current
      const safeThreshold = threshold > 0 ? threshold : 1

      const heroProgress = Math.min(1, Math.max(0, (y - 20) / (viewportH * 0.6)))
      const travelT = Math.min(1, y / safeThreshold)
      const navTop =
        y >= safeThreshold
          ? NAV_TOP_PX
          : navRestTop + (NAV_TOP_PX - navRestTop) * travelT

      if (heroRef.current) {
        heroRef.current.style.opacity = String(1 - heroProgress)
        heroRef.current.style.filter = `blur(${heroProgress * BLUR_PX}px)`
      }
      if (navWrapRef.current) {
        navWrapRef.current.style.top = `${navTop}px`
      }

      applyStuckState(y)
      if (prevStuck.current) applyScrollSpy()
      rafId = requestAnimationFrame(frame)
    }

    measureLayout()
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [isMobile, applyStuckState, applyScrollSpy, measureLayout])

  const syncScrollAfterNavigate = useCallback(() => {
    applyStuckState(getScrollTop())
    applyScrollSpy()
  }, [applyStuckState, applyScrollSpy])

  const scrollToSection = (id: string) => {
    setMobileDrawerOpen(false)
    document
      .querySelector(`[data-section-id="${id}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const sec = NAV_SECTIONS.find((s) => s.id === id)
    if (sec) {
      const chId = toChapterId(id, sec.chapters[0].id)
      activeChapterRef.current = chId
      setActiveChapter(chId)
    }
    activeSectionRef.current = id
    switchSection(id)
    syncScrollAfterNavigate()
  }

  const scrollToChapter = (chapterId: string) => {
    setMobileDrawerOpen(false)
    document
      .querySelector(`[data-chapter-id="${chapterId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const sectionId = sectionIdForChapter(chapterId)
    if (sectionId) {
      activeSectionRef.current = sectionId
      switchSection(sectionId)
    }
    activeChapterRef.current = chapterId
    setActiveChapter(chapterId)
    syncScrollAfterNavigate()
  }

  const currentSection = NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0]

  const drawerMaxH = `min(72dvh, calc(100dvh - ${MOBILE_BAR_H}px))`

  /** Right-handed (default): hero copy + menus bias toward the trailing edge; swipe hero left→`left`. */
  const thumbTrailing = handedness === 'right'

  return (
    <>
      {/* Mobile: hero intro + full nav morph into pinned accent bar + drawer */}
      {isMobile && (
        <>
          {mobileDrawerOpen && (
            <div
              role="presentation"
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 108,
                background: 'rgba(0,0,0,0.38)',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            />
          )}
          <nav
            ref={mobileMorphShellRef}
            aria-label="Site navigation"
            style={{
              position: 'fixed',
              left: 16,
              right: 16,
              top: 'calc(100dvh - 140px)',
              height: MOBILE_BAR_H,
              zIndex: 100,
              overflow: 'hidden',
              pointerEvents: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div
              ref={mobileExpandedLayerRef}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                paddingTop: 18,
                paddingBottom: 22,
                paddingLeft: 'max(16px, env(safe-area-inset-left))',
                paddingRight: 'max(16px, env(safe-area-inset-right))',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: thumbTrailing ? 'flex-end' : 'flex-start',
                textAlign: thumbTrailing ? 'right' : 'left',
              }}
            >
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
            <button
              ref={mobileCompactBtnRef}
              type="button"
              aria-expanded={mobileDrawerOpen}
              aria-controls="mobile-nav-drawer"
              onClick={() => setMobileDrawerOpen((o) => !o)}
              style={{
                position: 'absolute',
                inset: 0,
                margin: 0,
                padding: '12px 14px 12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxSizing: 'border-box',
                opacity: 0,
                pointerEvents: 'none',
                flexDirection: handedness === 'left' ? 'row-reverse' : 'row',
              }}
            >
              <span
                style={{
                  fontFamily: FONT_AHG,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.92)',
                  flexShrink: 0,
                }}
              >
                I design for…
              </span>
              <span
                style={{
                  fontFamily: FONT_AHG,
                  fontWeight: 700,
                  fontSize: 13,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#fff',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: thumbTrailing ? 'right' : 'left',
                }}
              >
                {currentSection.label}
              </span>
              <span
                aria-hidden
                style={{
                  flexShrink: 0,
                  color: '#fff',
                  fontSize: 12,
                  lineHeight: 1,
                  transform: mobileDrawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.28s ease',
                }}
              >
                ▼
              </span>
            </button>
          </nav>

          <div ref={mobileDrawerHostRef}>
            <div
              id="mobile-nav-drawer"
              style={{
                maxHeight: mobileDrawerOpen ? drawerMaxH : 0,
                overflow: 'hidden',
                transition: 'max-height 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
                background: ACCENT,
              }}
            >
              <div
                style={{
                  overflowY: 'auto',
                  maxHeight: drawerMaxH,
                  padding: '8px 16px 24px',
                  boxSizing: 'border-box',
                  borderTop: '1px solid rgba(255,255,255,0.22)',
                  textAlign: thumbTrailing ? 'right' : 'left',
                }}
              >
                <p
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.75)',
                    margin: '4px 0 12px',
                  }}
                >
                  Sections
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 22,
                    justifyContent: thumbTrailing ? 'flex-end' : 'flex-start',
                  }}
                >
                  {NAV_SECTIONS.map((sec) => {
                    const on = activeSection === sec.id
                    return (
                      <button
                        key={sec.id}
                        type="button"
                        onClick={() => scrollToSection(sec.id)}
                        style={{
                          fontFamily: FONT_AHG,
                          fontWeight: 700,
                          fontSize: 12,
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          padding: '8px 14px',
                          borderRadius: 9999,
                          border: on ? '2px solid #fff' : '1px solid rgba(255,255,255,0.45)',
                          background: on ? 'rgba(255,255,255,0.18)' : 'transparent',
                          color: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        {sec.label}
                      </button>
                    )
                  })}
                </div>
                <p
                  style={{
                    fontFamily: FONT_MONO,
                    fontWeight: 700,
                    fontSize: 10,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.75)',
                    margin: '0 0 12px',
                  }}
                >
                  In this section
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginBottom: 28,
                    alignItems: thumbTrailing ? 'flex-end' : 'flex-start',
                  }}
                >
                  {currentSection.chapters.map((chapter) => {
                    const chId = toChapterId(currentSection.id, chapter.id)
                    const on = activeChapter === chId
                    return (
                      <button
                        key={chapter.id}
                        type="button"
                        aria-current={on ? 'true' : undefined}
                        onClick={() => scrollToChapter(chId)}
                        style={{
                          alignSelf: thumbTrailing ? 'flex-end' : 'flex-start',
                          fontFamily: FONT_MONO,
                          fontWeight: 700,
                          fontSize: 11,
                          letterSpacing: '0.07em',
                          textTransform: 'uppercase',
                          lineHeight: 1.45,
                          padding: '8px 14px',
                          borderRadius: 9999,
                          border: 'none',
                          background: on ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: thumbTrailing ? 'right' : 'left',
                        }}
                      >
                        {chapter.label}
                      </button>
                    )
                  })}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: thumbTrailing ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div className="contact-liquid contact-liquid--on-accent">
                    <ContactButton />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Sidebar shell — hidden on small viewports; kept mounted for scroll/sync refs */}
      <div hidden={isMobile}>
        <div style={{
          position: 'fixed', left: 0, top: 0,
          width: 400, height: '100dvh',
          zIndex: 100, pointerEvents: 'none',
        }}>
        {/* Divider */}
        <div aria-hidden style={{
          position: 'absolute', right: 0, top: 40,
          width: 1, height: 'calc(100% - 80px)',
          background: C.divider,
          opacity: dividerVisible ? 1 : 0,
          filter: dividerVisible ? 'blur(0)' : `blur(${BLUR_PX}px)`,
          transition: 'opacity 600ms ease, filter 600ms ease',
        }} />

        {/* Hero name — opacity/blur driven by scroll rAF */}
        <div ref={heroRef} aria-hidden style={{
          position: 'absolute', top: 40, left: 40,
          width: 'min(42vw, calc(var(--sidebar-width) - 80px))',
          opacity: 1,
          filter: 'blur(0px)',
          transition: 'none',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          <div style={{ fontFamily: FONT_AHG, fontWeight: 700, fontSize: 'clamp(12px, 1.35vw, 28px)', lineHeight: 1.1, textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
            Hello, I am
          </div>
          <div style={{
            fontFamily: FONT_AHG,
            fontWeight: 700,
            /* Preferred scales with width; vh ceiling ≈ half viewport minus eyebrow (3 lines × lh 0.82). */
            fontSize: 'clamp(40px, min(7.5vw, calc((50dvh - 56px) / 2.46)), 240px)',
            lineHeight: 0.82,
            letterSpacing: '-0.02em',
            textTransform: 'uppercase',
            color: C.ink,
          }}>
            <div>JOSEPH</div>
            <div>PATRICK</div>
            <div>ROBERTS<span style={{ color: ACCENT }}>.</span></div>
          </div>
        </div>

        {/* Main nav sentence */}
        <div ref={navWrapRef} style={{
          position: 'absolute',
          top: layoutRef.current.navRestTop,
          left: 40,
          right: 40,
          transition: 'none',
          pointerEvents: 'auto',
        }}>
          <p style={{ fontFamily: FONT_AHG, fontWeight: 700, fontSize: 24, lineHeight: 1.2, letterSpacing: '0.02em', textTransform: 'uppercase', color: C.ink, margin: 0 }}>
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

        {/* Contact — liquid split to Email / LinkedIn on hover */}
        <div
          ref={contactRef}
          style={{
            position: 'absolute',
            bottom: EMAIL_BOTTOM_PX,
            left: 40,
            pointerEvents: 'auto',
          }}
        >
          <ContactButton />
        </div>
      </div>

      {/* Sub nav — viewport center */}
      <div aria-label="Chapter navigation" style={{
        position: 'fixed', left: 40, top: '50vh',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 6,
        width: 'min(300px, calc(var(--sidebar-width) - 80px))',
        zIndex: 101,
        pointerEvents: subNavVisible ? 'auto' : 'none',
      }}>
        {currentSection.chapters.map((chapter, i) => {
          const chId      = toChapterId(currentSection.id, chapter.id)
          const isActive  = activeChapter === chId
          const isVisible = subNavVisible && chapterItemsVisible.includes(i)
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
