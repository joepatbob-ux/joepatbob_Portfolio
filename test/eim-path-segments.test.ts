import {
  EIM_TIMING_DEFAULTS,
  EIM_TIMING_RANGE,
  readEimTiming,
  splitPathSubpaths,
  subpathStartPoint,
} from '@/lib/eimPathSegments'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('splitPathSubpaths', () => {
  it('splits a multi-subpath d on M boundaries, preserving order', () => {
    const d = 'M1,2 L3,4M5,6 C7,8 9,10 11,12M13,14 Z'
    expect(splitPathSubpaths(d)).toEqual([
      'M1,2 L3,4',
      'M5,6 C7,8 9,10 11,12',
      'M13,14 Z',
    ])
  })

  it('returns a single segment for a single-subpath d', () => {
    expect(splitPathSubpaths('M0,0 L10,10')).toEqual(['M0,0 L10,10'])
  })

  it('trims whitespace and drops empty segments', () => {
    expect(splitPathSubpaths('  M1,1 L2,2  M3,3 ')).toEqual([
      'M1,1 L2,2',
      'M3,3',
    ])
    expect(splitPathSubpaths('')).toEqual([])
    expect(splitPathSubpaths('   ')).toEqual([])
  })

  it('splits the real eimpath.svg orange path into the expected 70 dashes', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const svg = readFileSync(
      resolve(process.cwd(), 'public/images/devices/eimpath.svg'),
      'utf8',
    )
    // Same selection EimPathArt makes: the meander path with the accent fill.
    const match = svg.match(/<path[^>]*fill="#F5431B"[^>]*\sd="([^"]+)"/)
      ?? svg.match(/<path[^>]*\sd="([^"]+)"[^>]*fill="#F5431B"/)
    expect(match, 'orange meander path missing from eimpath.svg').toBeTruthy()
    const segments = splitPathSubpaths(match![1])
    expect(segments.length).toBe(70)
    for (const segment of segments) {
      expect(segment.startsWith('M')).toBe(true)
    }
  })
})

describe('subpathStartPoint', () => {
  it('parses comma- and space-separated move-to coordinates', () => {
    expect(subpathStartPoint('M10,20 L30,40')).toEqual({ x: 10, y: 20 })
    expect(subpathStartPoint('M10 20 L30 40')).toEqual({ x: 10, y: 20 })
  })

  it('parses negative and decimal coordinates', () => {
    expect(subpathStartPoint('M-1.5,2.25 Z')).toEqual({ x: -1.5, y: 2.25 })
  })

  it('returns null when the subpath does not begin with a move-to', () => {
    expect(subpathStartPoint('L10,20')).toBeNull()
    expect(subpathStartPoint('garbage')).toBeNull()
    expect(subpathStartPoint('')).toBeNull()
  })
})

describe('readEimTiming', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const stubSearch = (search: string) => {
    vi.stubGlobal('window', { location: { search } })
  }

  it('returns the defaults when no window exists (SSR/prerender)', () => {
    expect(readEimTiming()).toEqual(EIM_TIMING_DEFAULTS)
  })

  it('returns the defaults when no params are set', () => {
    stubSearch('')
    expect(readEimTiming()).toEqual(EIM_TIMING_DEFAULTS)
  })

  it('seeds values from the URL params', () => {
    stubSearch('?eimDraw=1000&eimHold=500&eimFade=300')
    expect(readEimTiming()).toEqual({ drawMs: 1000, holdMs: 500, fadeMs: 300 })
  })

  it('clamps URL values into the published tuner range', () => {
    stubSearch('?eimDraw=99999&eimFade=0&eimHold=-5')
    expect(readEimTiming()).toEqual({
      drawMs: EIM_TIMING_RANGE.drawMs.max,
      holdMs: EIM_TIMING_RANGE.holdMs.min,
      fadeMs: EIM_TIMING_RANGE.fadeMs.min,
    })
  })

  it('falls back to the default for non-numeric values', () => {
    stubSearch('?eimDraw=abc&eimFade=NaN')
    expect(readEimTiming()).toEqual(EIM_TIMING_DEFAULTS)
  })

  it('leaves unrelated params alone and mixes seeded with defaults', () => {
    stubSearch('?eimTiming=1&eimDraw=800')
    expect(readEimTiming()).toEqual({
      ...EIM_TIMING_DEFAULTS,
      drawMs: 800,
    })
  })
})
