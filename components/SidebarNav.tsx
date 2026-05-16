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
  const C = {
    ink:     dark ? '#f0eeea' : '#0d0d0d',
    divider: 'var(--color-rule)',
  }

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
    measureLayout()
    window.addEventListener('resize', measureLayout)
    const ro = new ResizeObserver(measureLayout)
    if (navWrapRef.current) ro.observe(navWrapRef.current)
    if (contactRef.current) ro.observe(contactRef.current)
    return () => {
      window.removeEventListener('resize', measureLayout)
      ro.disconnect()
    }
  }, [measureLayout])

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

  // Scroll-linked hero blur + nav travel: rAF + direct DOM (not batched React state).
  useEffect(() => {
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
  }, [applyStuckState, measureLayout])

  const syncScrollAfterNavigate = useCallback(() => {
    applyStuckState(getScrollTop())
    applyScrollSpy()
  }, [applyStuckState, applyScrollSpy])

  const scrollToSection = (id: string) => {
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

  return (
    <>
      {/* Sidebar shell */}
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
            {'I simplify complex systems for '}
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
    </>
  )
}
