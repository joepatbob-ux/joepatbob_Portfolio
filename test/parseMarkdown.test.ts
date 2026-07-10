import { describe, expect, it } from 'vitest'
import {
  parseMarkdownFile,
  splitBodySections,
} from '@/lib/content/parseMarkdown'

describe('parseMarkdownFile', () => {
  it('parses JSON frontmatter and trims the body', () => {
    const raw = '---\n{ "id": "x", "n": 1 }\n---\n\nHello body.\n'
    const { meta, body } = parseMarkdownFile<{ id: string; n: number }>(raw)
    expect(meta).toEqual({ id: 'x', n: 1 })
    expect(body).toBe('Hello body.')
  })

  it('returns empty meta when there is no frontmatter fence', () => {
    const { meta, body } = parseMarkdownFile('Just prose, no fence.')
    expect(meta).toEqual({})
    expect(body).toBe('Just prose, no fence.')
  })

  it('throws on an unclosed frontmatter block', () => {
    expect(() =>
      parseMarkdownFile('---\n{ "id": "x" }\nno closing fence'),
    ).toThrow()
  })

  it('throws on invalid JSON in the frontmatter', () => {
    expect(() => parseMarkdownFile('---\n{ not: json, }\n---\nbody')).toThrow()
  })
})

describe('splitBodySections', () => {
  it('returns a single section when there is no horizontal rule', () => {
    expect(splitBodySections('one block')).toEqual(['one block'])
  })

  it('splits on a horizontal rule and trims each section', () => {
    expect(splitBodySections('a\n---\nb')).toEqual(['a', 'b'])
    expect(splitBodySections('a\n\n---\n\nb\n\n---\n\nc')).toEqual([
      'a',
      'b',
      'c',
    ])
  })

  it('filters out empty sections', () => {
    expect(splitBodySections('\n---\na\n---\n')).toEqual(['a'])
  })
})
