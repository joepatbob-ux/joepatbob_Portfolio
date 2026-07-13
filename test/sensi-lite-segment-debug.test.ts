// @vitest-environment jsdom
// These tests exercise real SVG DOM (createElementNS / innerHTML / querySelector),
// so they need a DOM — the suite default stays `node` (vitest.config.ts).
import { describe, expect, it } from 'vitest'
import {
  breakApartSegmentGroup,
  canBreakApartSegment,
  canMergeSegments,
  mergeSegments,
  mergeTargetIdFromSelection,
  toSegmentPick,
  wrapSegmentsWithId,
} from '@/lib/sensi-lite/sensiLiteSegmentDebug'

// jsdom doesn't ship CSS.escape; the source uses it for id selectors.
if (typeof CSS === 'undefined' || typeof CSS.escape !== 'function') {
  ;(globalThis as { CSS?: unknown }).CSS = {
    ...(globalThis as { CSS?: object }).CSS,
    escape: (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`),
  }
}

function mountSvg(markup: string) {
  const root = document.createElement('div')
  root.innerHTML = markup
  return root
}

describe('sensi lite segment debug', () => {
  it('breaks apart a named group into child picks', () => {
    const root = mountSvg(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="label-outdoor" class="lcd-seg-group">
          <path class="lcd-seg" d="M0 0" data-seg-idx="0" />
          <path class="lcd-seg" d="M1 1" data-seg-idx="1" />
        </g>
      </svg>
    `)

    const released = breakApartSegmentGroup(root, 'label-outdoor')
    expect(released).toHaveLength(2)
    expect(root.querySelector('#label-outdoor')).toBeNull()
    expect(root.querySelectorAll('path.lcd-seg')).toHaveLength(2)
  })

  it('can wrap paths and break them apart again', () => {
    const root = mountSvg(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <path class="lcd-seg" d="M0 0" data-seg-idx="0" />
        <path class="lcd-seg" d="M1 1" data-seg-idx="1" />
      </svg>
    `)

    expect(wrapSegmentsWithId(root, ['@idx:0', '@idx:1'], 'label-setto')).toBe(true)
    expect(root.querySelector('#label-setto')).not.toBeNull()

    const released = breakApartSegmentGroup(root, 'label-setto')
    expect(released).toHaveLength(2)
    expect(root.querySelector('#label-setto')).toBeNull()
  })

  it('flags groups as break-apart candidates', () => {
    expect(canBreakApartSegment(toSegmentPick(document.createElementNS('http://www.w3.org/2000/svg', 'g')))).toBe(false)

    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
    group.id = 'icon-fan'
    expect(canBreakApartSegment(toSegmentPick(group))).toBe(true)
  })

  it('merges paths into a named group and flattens source groups', () => {
    const root = mountSvg(`
      <svg xmlns="http://www.w3.org/2000/svg">
        <g id="label-outdoor" class="lcd-seg-group">
          <path class="lcd-seg" d="M0 0" data-seg-idx="0" />
        </g>
        <path class="lcd-seg" d="M1 1" data-seg-idx="1" />
        <path class="lcd-seg" d="M2 2" data-seg-idx="2" />
      </svg>
    `)

    const merged = mergeSegments(root, ['label-outdoor', '@idx:1', '@idx:2'], 'label-outdoor')
    expect(merged?.id).toBe('label-outdoor')
    expect(root.querySelectorAll('#label-outdoor path.lcd-seg')).toHaveLength(3)
    expect(root.querySelectorAll('path.lcd-seg')).toHaveLength(3)
  })

  it('requires two or more picks and a target id to merge', () => {
    const picks = [
      toSegmentPick(document.createElementNS('http://www.w3.org/2000/svg', 'path')),
      toSegmentPick(document.createElementNS('http://www.w3.org/2000/svg', 'path')),
    ]
    expect(canMergeSegments(picks)).toBe(true)
    expect(mergeTargetIdFromSelection(picks, '')).toBeNull()
    expect(mergeTargetIdFromSelection(picks, 'label-setto')).toBe('label-setto')
  })
})
