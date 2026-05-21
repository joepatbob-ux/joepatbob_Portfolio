'use client'

import { HARDWARE_SCROLL_CHAPTERS } from '@/lib/hardware/chapters'
import { useChapterNav } from '@/components/ChapterNavProvider'
import { useCallback, useEffect, useState } from 'react'

interface Props {
  activeChapterId: string
  onSelect: (chapterId: string) => void
}

function useInHardwareSection() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const article = document.querySelector('[data-section-id="hardware"]')
    if (!article) return

    const sync = () => {
      const rect = article.getBoundingClientRect()
      const vh = window.innerHeight
      setActive(rect.top < vh && rect.bottom > 0)
    }

    sync()
    window.addEventListener('scroll', sync, { passive: true })
    window.addEventListener('resize', sync, { passive: true })
    return () => {
      window.removeEventListener('scroll', sync)
      window.removeEventListener('resize', sync)
    }
  }, [])

  return active
}

export function HardwareMobileNav({ activeChapterId, onSelect }: Props) {
  const inHardware = useInHardwareSection()
  const [open, setOpen] = useState(false)
  const { phase } = useChapterNav()

  const activeLabel =
    HARDWARE_SCROLL_CHAPTERS.find((c) => c.id === activeChapterId)?.label ??
    'Hardware'

  const handleSelect = useCallback(
    (id: string) => {
      setOpen(false)
      onSelect(id)
    },
    [onSelect],
  )

  useEffect(() => {
    if (!inHardware) setOpen(false)
  }, [inHardware])

  useEffect(() => {
    document.body.classList.toggle('hardware-mobile-chapters', inHardware)
    return () => document.body.classList.remove('hardware-mobile-chapters')
  }, [inHardware])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!inHardware || phase !== 'idle') return null

  return (
    <nav className="hardware-mobile-nav" aria-label="Hardware chapters">
      <div className="hardware-mobile-nav__bar">
        <button
          type="button"
          className="hardware-mobile-nav__menu"
          aria-expanded={open}
          aria-controls="hardware-chapter-menu"
          aria-label={open ? 'Close chapter menu' : 'Open chapter menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="hardware-mobile-nav__menu-icon" aria-hidden />
        </button>
        <p className="hardware-mobile-nav__title">{activeLabel}</p>
      </div>
      {open ? (
        <ul id="hardware-chapter-menu" className="hardware-mobile-nav__dropdown">
          {HARDWARE_SCROLL_CHAPTERS.map((ch) => (
            <li key={ch.id}>
              <button
                type="button"
                className="hardware-mobile-nav__link"
                aria-current={activeChapterId === ch.id ? 'true' : undefined}
                onClick={() => handleSelect(ch.id)}
              >
                {ch.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </nav>
  )
}
