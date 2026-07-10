import { describe, expect, it } from 'vitest'
import {
  groupChapterBody,
  isSubheadParagraph,
  parseChapterBody,
  subheadText,
} from '@/lib/chapter-slide/parseChapterBody'

describe('parseChapterBody', () => {
  it('splits on blank lines and trims paragraphs', () => {
    expect(parseChapterBody('p1\n\np2\n\n\np3')).toEqual(['p1', 'p2', 'p3'])
  })

  it('returns [] for undefined or empty input', () => {
    expect(parseChapterBody(undefined)).toEqual([])
    expect(parseChapterBody('')).toEqual([])
  })
})

describe('subhead helpers', () => {
  it('detects a fully-bold paragraph as a subhead', () => {
    expect(isSubheadParagraph('**Heading**')).toBe(true)
    expect(isSubheadParagraph('Not **all** bold')).toBe(false)
    expect(isSubheadParagraph('plain')).toBe(false)
  })

  it('strips the bold markers from a subhead', () => {
    expect(subheadText('**Heading**')).toBe('Heading')
  })
})

describe('groupChapterBody', () => {
  it('keeps a leading intro block, then groups under each subhead', () => {
    const groups = groupChapterBody([
      'intro para',
      '**Sub A**',
      'a1',
      'a2',
      '**Sub B**',
      'b1',
    ])
    expect(groups).toEqual([
      { subhead: null, paragraphs: ['intro para'] },
      { subhead: 'Sub A', paragraphs: ['a1', 'a2'] },
      { subhead: 'Sub B', paragraphs: ['b1'] },
    ])
  })

  it('handles a leading subhead with no intro block', () => {
    expect(groupChapterBody(['**Only**', 'x'])).toEqual([
      { subhead: 'Only', paragraphs: ['x'] },
    ])
  })
})
