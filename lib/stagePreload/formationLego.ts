import {
  brickArtSrc,
  brickSelectedArtSrc,
  brickSelectedWithRotateArtSrc,
  legoBoardSrc,
  type BrickColor,
  type BrickPivot,
} from '@/lib/formation/legoBricks'
import { preloadImages } from '@/lib/stagePreload/preloadAssets'
import { preloadOnce } from '@/lib/stagePreload/preloadOnce'

const FORMATION_BRICK_COLORS: readonly BrickColor[] = [
  'black',
  'cyan',
  'magenta',
  'yellow',
]
const FORMATION_PIVOTS: readonly BrickPivot[] = ['left', 'right']

function formationLegoSpriteUrls(theme: 'light' | 'dark'): string[] {
  const urls = new Set<string>()
  urls.add(legoBoardSrc(theme))
  for (const pivot of FORMATION_PIVOTS) {
    urls.add(brickSelectedArtSrc(pivot))
    urls.add(brickSelectedWithRotateArtSrc(pivot))
    for (const color of FORMATION_BRICK_COLORS) {
      urls.add(brickArtSrc(color, pivot, theme))
    }
  }
  return [...urls]
}

/** Board + brick SVG sprites for both themes. */
export function preloadFormationLegoStage(): Promise<void> {
  return preloadOnce('stage:formation-lego', async () => {
    await preloadImages([
      ...formationLegoSpriteUrls('light'),
      ...formationLegoSpriteUrls('dark'),
    ])
  })
}
