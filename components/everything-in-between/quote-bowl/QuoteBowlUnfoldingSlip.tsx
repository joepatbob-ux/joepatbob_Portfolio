'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import {
  slipTextProgress,
  typedCharCount,
} from '@/lib/everything-in-between/quoteBowl/slipTextProgress'
import type { SlipHomeTransform } from '@/lib/everything-in-between/quoteBowl/types'
import { useTypewriterSlipCanvas } from '@/lib/everything-in-between/quoteBowl/useTypewriterSlipCanvas'
import {
  createCrinkledSlipGeometry,
  PULL_MS,
  sampleSlipUnfold,
  setCrinkleAmplitude,
  slipPullProgress,
  type QuoteSlipLayout,
} from '@/lib/everything-in-between/quotePaper'
import {
  baselineColorMaterial,
  restoreColorMaterial,
} from '@/lib/phone-swap/phoneAccentHover'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

type Props = {
  layout: QuoteSlipLayout
  pullStartedAt: number | null
  bowlTopY: number
  reducedMotion: boolean
  home: SlipHomeTransform
  revealed: boolean
}

function createSlipMaterial(texture: THREE.CanvasTexture) {
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    color: '#ffffff',
    roughness: 0.94,
    metalness: 0,
    side: THREE.DoubleSide,
  })
  mat.userData.paperBaseline = baselineColorMaterial(mat)
  return mat
}

export function QuoteBowlUnfoldingSlip({
  layout,
  pullStartedAt,
  bowlTopY,
  reducedMotion,
  home,
  revealed,
}: Props) {
  const rootRef = useRef<THREE.Group>(null)
  const lastTextChars = useRef(-1)
  const { texture, paint } = useTypewriterSlipCanvas()

  const { width, height, scale, geoSegments } = QUOTE_BOWL.unfold
  const [segmentsX, segmentsY] = geoSegments

  const slipGeo = useMemo(
    () =>
      createCrinkledSlipGeometry(
        width,
        height,
        layout.crinkleSeed,
        segmentsX,
        segmentsY,
      ),
    [height, layout.crinkleSeed, segmentsX, segmentsY, width],
  )

  const mat = useMemo(() => createSlipMaterial(texture), [texture])

  useEffect(() => {
    paint(layout.quote, layout.crinkleSeed, 0)
    lastTextChars.current = 0
  }, [layout.crinkleSeed, layout.quote, paint])

  useEffect(() => {
    return () => {
      slipGeo.dispose()
      mat.dispose()
    }
  }, [mat, slipGeo])

  useFrame(() => {
    const root = rootRef.current
    if (!root) return

    const elapsed =
      pullStartedAt == null ? PULL_MS : performance.now() - pullStartedAt
    const t =
      revealed || reducedMotion ? 1 : slipPullProgress(elapsed, PULL_MS)
    const key = sampleSlipUnfold(t, home.position, home.rotation, bowlTopY)

    root.position.copy(key.position)
    root.rotation.copy(key.rotation)
    root.scale.set(
      key.scaleX * scale,
      key.scaleY * scale,
      key.scaleZ * scale,
    )

    const base = mat.userData.paperBaseline as ReturnType<
      typeof baselineColorMaterial
    >
    if (base) restoreColorMaterial(mat, base)
    mat.opacity = 1
    mat.transparent = false

    setCrinkleAmplitude(slipGeo, key.crinkleAmp)

    const textT = slipTextProgress(t, revealed, reducedMotion)
    const chars = typedCharCount(layout.quote, textT)
    if (chars !== lastTextChars.current) {
      paint(layout.quote, layout.crinkleSeed, textT)
      lastTextChars.current = chars
    }
  })

  return (
    <group ref={rootRef} renderOrder={5}>
      <mesh geometry={slipGeo} material={mat} />
    </group>
  )
}
