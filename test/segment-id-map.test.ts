import segmentIdMap from '@/lib/sensi-lite/segment-id-map.json'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('segment id map', () => {
  it('matches annotated ids in screen.svg', () => {
    const svg = readFileSync(
      resolve(process.cwd(), 'public/images/sensi-lite/screen.svg'),
      'utf8',
    )

    for (const id of Object.keys(segmentIdMap)) {
      expect(svg, `missing #${id}`).toContain(`id="${id}"`)
    }
  })
})
