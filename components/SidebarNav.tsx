// components/SidebarNav.tsx
// Full scroll choreography:
// - Hero name blurs out proportionally as user scrolls
// - Main nav sentence travels from above email up to top, locks at threshold
// - Divider blurs in when last chapter item of first section appears
// - Sub nav blurs in at viewport center after nav locks, chapters stagger in
// - All keywords start lit, dim to 20% once nav is stuck (active stays full)
// - Email pill is fixed at bottom

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { NAV_SECTIONS } from '@/lib/nav'

// ── FONT STRINGS (CSS vars: --font-ahg / --font-mono from globals + layout) ─
const FONT_AHG  = 'var(--font-ahg)'
const FONT_MONO = 'var(--font-mono)'

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const ACCENT          = '#F2411B'
const STAGGER_MS      = 60
const TRANSITION_MS   = 320
const SUBNAV_DELAY_MS = 280
const BLUR_PX         = 6
const NAV_TOP_PX      = 40
const EMAIL_BOTTOM_PX = 40

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
function toChapterId(sectionId: string, chapter: string): string {
  return `${sectionId}-${chapter.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────
export function SidebarNav() {
  const dark = useDarkMode()
  const C = {
    ink:        dark ? '#f0eeea'                : '#0d0d0d',
    divider:    dark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)',
    chapterDim: dark ? 'rgba(242,65,27,0.3)'   : 'rgba(242,65,27,0.25)',
  }

  const [scrollY,             setScrollY]             = useState(0)
  const [navIsStuck,          setNavIsStuck]          = useState(false)
  const [dividerVisible,      setDividerVisible]      = useState(false)
  const [subNavVisible,       setSubNavVisible]       = useState(false)
  const [chapterItemsVisible, setChapterItemsVisible] = useState<number[]>([])
  const [activeSection,       setActiveSection]       = useState<string | null>(null)
  const [activeChapter,       setActiveChapter]       = useState<string | null>(null)
  const [dimActive,           setDimActive]           = useState(false)

  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([])
  const subNavTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevStuck     = useRef(false)
  const navWrapRef    = useRef<HTMLDivElement>(null)
  const emailRef      = useRef<HTMLAnchorElement>(null)

  const [viewportH,  setViewportH]  = useState(900)
  const [navRestTop, setNavRestTop] = useState(0)
  const NAV_STICK_THRESHOLD = viewportH * 0.72

  useEffect(() => {
    const update = () => setViewportH(window.innerHeight)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  useEffect(() => {
    if (!navWrapRef.current || !emailRef.current) return
    const navH   = navWrapRef.current.clientHeight
    const emailH = emailRef.current.clientHeight
    setNavRestTop(viewportH - EMAIL_BOTTOM_PX - emailH - 12 - navH)
  }, [viewportH])

  const navTop = navIsStuck
    ? NAV_TOP_PX
    : navRestTop + (NAV_TOP_PX - navRestTop) * Math.min(1, scrollY / NAV_STICK_THRESHOLD)

  const heroProgress = Math.min(1, Math.max(0, (scrollY - 20) / (viewportH * 0.6)))

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

  useEffect(() => {
    let ticking = false
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const y = window.scrollY
          setScrollY(y)
          const shouldStick = y >= NAV_STICK_THRESHOLD
          if (shouldStick && !prevStuck.current) {
            prevStuck.current = true
            setNavIsStuck(true)
            setDimActive(true)
            subNavTimer.current = setTimeout(() => {
              setSubNavVisible(true)
              setActiveSection((prev) => {
                const id = prev || NAV_SECTIONS[0].id
                staggerIn(id, id === NAV_SECTIONS[0].id)
                return id
              })
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
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [staggerIn, NAV_STICK_THRESHOLD])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || entry.intersectionRatio < 0.2) return
          const id = (entry.target as HTMLElement).dataset.sectionId
          if (!id) return
          setActiveSection((prev) => {
            if (prev === id) return prev
            if (subNavVisible) {
              staggerOut(() => { setActiveSection(id); staggerIn(id) })
              return prev
            }
            staggerIn(id)
            return id
          })
        })
      },
      { threshold: 0.2 }
    )
    document.querySelectorAll('[data-section-id]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [staggerIn, staggerOut, subNavVisible])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const id = (entry.target as HTMLElement).dataset.chapterId
          if (id) setActiveChapter(id)
        })
      },
      { threshold: 0.5, rootMargin: '-15% 0px -15% 0px' }
    )
    document.querySelectorAll('[data-chapter-id]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [activeSection])

  const scrollToSection = (id: string) =>
    document.querySelector(`[data-section-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth' })

  const scrollToChapter = (id: string) =>
    document.querySelector(`[data-chapter-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth' })

  const currentSection = NAV_SECTIONS.find((s) => s.id === activeSection) || NAV_SECTIONS[0]

  return (
    <>
      {/* Sidebar shell */}
      <div style={{
        position: 'fixed', left: 0, top: 0,
        width: 400, height: '100vh',
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

        {/* Hero name */}
        <div aria-hidden style={{
          position: 'absolute', top: 40, left: 40,
          width: '33vw',
          opacity: 1 - heroProgress,
          filter: `blur(${heroProgress * BLUR_PX}px)`,
          transition: 'none',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          <div style={{ fontFamily: FONT_AHG, fontWeight: 700, fontSize: 'clamp(12px,1.25vw,24px)', lineHeight: '28px', textTransform: 'uppercase', color: ACCENT, marginBottom: 8 }}>
            Hello, I am
          </div>
          <div style={{ fontFamily: FONT_AHG, fontWeight: 700, fontSize: 'clamp(40px,5vw,96px)', lineHeight: 0.82, letterSpacing: '-0.02em', textTransform: 'uppercase', color: C.ink }}>
            <div>JOSEPH</div>
            <div>PATRICK</div>
            <div>ROBERTS<span style={{ color: ACCENT }}>.</span></div>
          </div>
        </div>

        {/* Main nav sentence */}
        <div ref={navWrapRef} style={{
          position: 'absolute', top: navTop, left: 40, right: 40,
          transition: 'none', pointerEvents: 'auto',
        }}>
          <p style={{ fontFamily: FONT_AHG, fontWeight: 700, fontSize: 24, lineHeight: 1.2, letterSpacing: '0.02em', textTransform: 'uppercase', color: C.ink, margin: 0 }}>
            {'I simplify complex systems for '}
            {NAV_SECTIONS.map((sec, i) => {
              const isActive  = activeSection === sec.id
              const connector = i === NAV_SECTIONS.length - 2 ? ', and ' : i < NAV_SECTIONS.length - 1 ? ', ' : '.'
              return (
                <span key={sec.id}>
                  <span onClick={() => scrollToSection(sec.id)} style={{
                    color: ACCENT, cursor: 'pointer',
                    opacity: dimActive && !isActive ? 0.2 : 1,
                    transition: 'opacity 400ms ease', display: 'inline',
                  }}>
                    {sec.label}
                  </span>
                  {connector}
                </span>
              )
            })}
          </p>
        </div>

        {/* Email pill */}
        <a ref={emailRef} href="mailto:me@joepatbob.com" style={{
          position: 'absolute', bottom: EMAIL_BOTTOM_PX, left: 40,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: ACCENT, borderRadius: 24, padding: '0 20px', height: 40,
          fontFamily: FONT_MONO, fontWeight: 700, fontSize: 11, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none',
          pointerEvents: 'auto', transition: 'opacity 200ms ease', userSelect: 'none',
        }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.75')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
        >
          me@joepatbob.com
        </a>
      </div>

      {/* Sub nav — viewport center */}
      <div aria-label="Chapter navigation" style={{
        position: 'fixed', left: 40, top: '50vh',
        transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 4,
        zIndex: 101,
        pointerEvents: subNavVisible ? 'auto' : 'none',
      }}>
        {currentSection.chapters.map((chapter, i) => {
          const chId      = toChapterId(currentSection.id, chapter)
          const isActive  = activeChapter === chId
          const isVisible = subNavVisible && chapterItemsVisible.includes(i)
          return (
            <span key={chapter} onClick={() => scrollToChapter(chId)}
              aria-current={isActive ? 'true' : undefined}
              style={{
                display: 'block', fontFamily: FONT_MONO, fontWeight: 700,
                fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase',
                lineHeight: 1.6, padding: '2px 0',
                color: isActive ? ACCENT : C.chapterDim,
                cursor: 'pointer', userSelect: 'none',
                opacity: isVisible ? 1 : 0,
                filter: isVisible ? 'blur(0)' : `blur(${BLUR_PX}px)`,
                transform: isVisible ? 'translateY(0)' : 'translateY(4px)',
                transition: `opacity ${TRANSITION_MS}ms ease ${i * 20}ms, filter ${TRANSITION_MS}ms ease ${i * 20}ms, transform ${TRANSITION_MS}ms ease ${i * 20}ms, color ${TRANSITION_MS}ms ease`,
                pointerEvents: isVisible ? 'auto' : 'none',
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '0.6' }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              {chapter}
            </span>
          )
        })}
      </div>
    </>
  )
}
