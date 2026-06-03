'use client'

import {
  chapterLayoutLayer,
  isChapterLayoutGhostEnabled,
  stageArtifactLayerId,
} from '@/lib/chapter-layout-ghost'
import { useCallback, useEffect, useState } from 'react'

const ROOT_CLASS = 'chapter-layout-ghost'

function labelStageChildren(chapterId: string, stage: HTMLElement) {
  Array.from(stage.children).forEach((node, index) => {
    if (!(node instanceof HTMLElement)) return
    node.setAttribute(
      'data-chapter-layer',
      stageArtifactLayerId(chapterId, node, index),
    )
  })
}

function labelChapterSlot(section: HTMLElement) {
  const chapterId = section.getAttribute('data-chapter-id')
  if (!chapterId) return

  const panel = section.querySelector('.portfolio-chapter-panel')
  if (panel instanceof HTMLElement) {
    panel.setAttribute('data-chapter-layer', chapterLayoutLayer(chapterId, 'panel'))
  }

  const viewport = section.querySelector('.chapter-slide__viewport')
  if (viewport instanceof HTMLElement) {
    viewport.setAttribute(
      'data-chapter-layer',
      chapterLayoutLayer(chapterId, 'viewport'),
    )
  }

  const inner = section.querySelector('.chapter-slide__inner')
  if (inner instanceof HTMLElement) {
    inner.setAttribute('data-chapter-layer', chapterLayoutLayer(chapterId, 'inner'))
  }

  const stage = section.querySelector('.chapter-slide__stage')
  if (stage instanceof HTMLElement) {
    stage.setAttribute('data-chapter-layer', chapterLayoutLayer(chapterId, 'stage'))
    labelStageChildren(chapterId, stage)
  }

  const copy = section.querySelector(
    '.chapter-slide__copy, .flow-chapter-slide__copy',
  )
  if (copy instanceof HTMLElement) {
    copy.setAttribute('data-chapter-layer', chapterLayoutLayer(chapterId, 'copy'))
  }
}

function labelAllChapters() {
  document
    .querySelectorAll<HTMLElement>('[data-chapter-id]')
    .forEach(labelChapterSlot)
}

function syncRootClass(enabled: boolean) {
  document.documentElement.classList.toggle(ROOT_CLASS, enabled)
}

/** Dev layout overlays: blue = shell/stage, orange = copy. */
export function ChapterLayoutGhost() {
  const [enabled, setEnabled] = useState(() => isChapterLayoutGhostEnabled())

  const apply = useCallback((next: boolean) => {
    setEnabled(next)
    syncRootClass(next)
    if (next) labelAllChapters()
  }, [])

  useEffect(() => {
    const initial = isChapterLayoutGhostEnabled()
    apply(initial)
  }, [apply])

  useEffect(() => {
    if (!enabled) return

    labelAllChapters()

    const observer = new MutationObserver(() => labelAllChapters())
    observer.observe(document.body, { childList: true, subtree: true })

    const onNav = () => labelAllChapters()
    window.addEventListener('popstate', onNav)
    window.addEventListener('hashchange', onNav)

    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('hashchange', onNav)
    }
  }, [enabled])

  useEffect(() => () => syncRootClass(false), [])

  if (!import.meta.env.DEV) return null

  return (
    <button
      type="button"
      className="chapter-layout-ghost-fab"
      aria-pressed={enabled}
      aria-label={enabled ? 'Hide layout guides' : 'Show layout guides'}
      onClick={() => apply(!enabled)}
    >
      {enabled ? 'Layout on' : 'Layout'}
    </button>
  )
}
