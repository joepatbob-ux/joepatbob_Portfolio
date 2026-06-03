import { publicAssetUrl } from '@/lib/phone-swap/publicAssetUrl'

const BASE = '/models/Magic8Ball_OBJ'

function asset(path: string, label: string): string {
  if (!path) throw new Error(`[Magic8Ball] Missing asset URL: ${label}`)
  return publicAssetUrl(path)
}

export const MAGIC8_BALL_URLS = {
  ball: {
    obj: asset(`${BASE}/Magic8Ball.obj`, 'ball.obj'),
    mtl: asset(`${BASE}/Magic8Ball.mtl`, 'ball.mtl'),
  },
  die: {
    obj: asset(`${BASE}/Dice.obj`, 'die.obj'),
    mtl: asset(`${BASE}/Dice.mtl`, 'die.mtl'),
  },
} as const
