import { MAGIC8_BALL_URLS } from '@/lib/everything-in-between/magic8BallUrls'
import { prepareMagic8BallScene } from '@/lib/everything-in-between/prepareMagic8BallScene'
import { useMagic8BallPbrTextures } from '@/lib/everything-in-between/useMagic8BallPbrTextures'
import { useObjMtl } from '@/lib/phone-swap/useObjMtl'
import { useMemo } from 'react'

export function useMagic8BallModels() {
  const textures = useMagic8BallPbrTextures()
  const ballRaw = useObjMtl(MAGIC8_BALL_URLS.ball.obj, MAGIC8_BALL_URLS.ball.mtl)
  const dieRaw = useObjMtl(MAGIC8_BALL_URLS.die.obj, MAGIC8_BALL_URLS.die.mtl)

  return useMemo(
    () => prepareMagic8BallScene(ballRaw, dieRaw, textures),
    [ballRaw, dieRaw, textures],
  )
}
