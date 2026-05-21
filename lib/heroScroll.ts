import { blurOutFromReveal } from '@/lib/scrollBlur'

/** True while the viewport is still in the hero band (skip chapter slideshow work). */
export function isInHeroScrollZone(): boolean {
  if (typeof window === 'undefined') return false

  const firstSection = document.querySelector<HTMLElement>('[data-section-id]')
  if (!firstSection) return false

  const sectionTop =
    firstSection.getBoundingClientRect().top + window.scrollY
  const releaseY = sectionTop - window.innerHeight * 0.35

  return window.scrollY < releaseY
}

const HERO_BLUR_PX = 10

/** Blur + fade the hero portrait on scroll (stays in frame). */
export function applyHeroViewportFade(scrollY: number, viewportH: number): void {
  const hero = document.getElementById('hero')
  if (!hero) return

  const progress = Math.min(1, Math.max(0, (scrollY - 16) / (viewportH * 0.55)))
  const reveal = 1 - progress
  const { opacity, filter } = blurOutFromReveal(reveal, HERO_BLUR_PX)

  hero.style.opacity = String(opacity)
  hero.style.filter = filter
  hero.style.pointerEvents = opacity > 0.12 ? 'auto' : 'none'

  const portrait = hero.querySelector<HTMLElement>('.hero-portrait')
  if (portrait) {
    portrait.style.filter = 'none'
  }
}
