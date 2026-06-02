'use client'

import {
  chapterLayoutLayer,
  isChapterLayoutGhostEnabled,
  stageArtifactLayerId,
} from '@/lib/chapter-layout-ghost'
import { useEffect } from 'react'

const ROOT_CLASS = 'chapter-layout-ghost'

function labelStageChildren(chapterId: string, stage: HTMLElement) {
  Array.from(stage.children).forEach((node, index) => {
    if (!(node instanceof HTMLElement)) return
    node.setAttribute('data-chapter-layer', stageArtifactLayerId(chapterId, node, index))
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
    viewport.setAttribute('data-chapter-layer', chapterLayoutLayer(chapterId, 'viewport'))
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

/** Tags every chapter slide shell + stage artifact for layout debug overlays. */
export function ChapterLayoutGhost() {
  useEffect(() => {
    const apply = () => {
      const enabled = isChapterLayoutGhostEnabled()
      syncRootClass(enabled)
      if (enabled) labelAllChapters()
    }

    apply()

    const observer = new MutationObserver(() => {
      if (!isChapterLayoutGhostEnabled()) return
      labelAllChapters()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    const onNav = () => apply()
    window.addEventListener('popstate', onNav)
    window.addEventListener('hashchange', onNav)

    return () => {
      observer.disconnect()
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('hashchange', onNav)
      syncRootClass(false)
    }
  }, [])

  return null
}
