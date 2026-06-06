'use client'

import { CrumpledPaperPile } from '@/components/everything-in-between/quote-bowl/CrumpledPaperPile'
import { QuoteBowlPickTarget } from '@/components/everything-in-between/quote-bowl/QuoteBowlPickTarget'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import type { QuoteBowlCanvasProps } from '@/lib/everything-in-between/quoteBowl/types'
import {
  applyBowlGlassHover,
  updateBowlGlassMaterial,
} from '@/lib/everything-in-between/prepareGoldfishBowl'
import {
  buildInsideBowlLayouts,
  pickSlipFromBowl,
} from '@/lib/everything-in-between/quotePaper'
import { useGoldfishBowlModel } from '@/lib/everything-in-between/useGoldfishBowlModel'
import { usePaperCrumpledModel } from '@/lib/everything-in-between/usePaperCrumpledModel'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export function QuoteBowlScene({
  answers,
  step,
  selectedSlipId,
  reducedMotion,
  darkSurface,
  glassTune,
  onPickSlip,
  onReset,
}: QuoteBowlCanvasProps) {
  const prepared = useGoldfishBowlModel()
  const { bowl, height, innerRadius, topY, pileBottomY, pileTopY, fitRadius } =
    prepared
  const { radius: paperMeshRadius } = usePaperCrumpledModel()
  const paperRadius = paperMeshRadius * 1.1
  const hoverStrength = useRef(0)
  const hoverTarget = useRef(0)
  const groupRef = useRef<THREE.Group>(null)
  const invalidate = useThree((s) => s.invalidate)

  const layouts = useMemo(
    () =>
      buildInsideBowlLayouts(
        answers,
        QUOTE_BOWL.slipCount,
        height,
        innerRadius,
        pileTopY,
        pileBottomY,
        paperRadius,
      ),
    [answers, height, innerRadius, pileTopY, pileBottomY, paperRadius],
  )

  const pileReady = layouts.length > 0

  useEffect(() => {
    updateBowlGlassMaterial(bowl, glassTune, darkSurface)
    invalidate()
  }, [bowl, glassTune, darkSurface, invalidate])

  useEffect(() => {
    invalidate()
  }, [step, selectedSlipId, invalidate])

  useFrame((state, delta) => {
    const root = groupRef.current
    if (!root) return

    const lerpFactor = 1 - Math.pow(0.001, delta)
    hoverStrength.current = THREE.MathUtils.lerp(
      hoverStrength.current,
      hoverTarget.current,
      lerpFactor,
    )

    const hoverTilt = hoverStrength.current * QUOTE_BOWL.hoverTiltRad
    root.rotation.x = THREE.MathUtils.lerp(
      root.rotation.x,
      pileReady && step === 'pick' ? hoverTilt : 0,
      lerpFactor,
    )

    if (
      step === 'pick' &&
      !reducedMotion &&
      pileReady &&
      hoverStrength.current < 0.05
    ) {
      const t = state.clock.elapsedTime
      root.rotation.y =
        Math.sin(t * QUOTE_BOWL.idleWobbleHz) * QUOTE_BOWL.idleWobbleAmp
    } else if (step !== 'pick' || hoverStrength.current >= 0.05) {
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0, 0.06)
    }

    const showBowlHover =
      (step === 'pick' || step === 'revealed') && hoverStrength.current > 0.001
    applyBowlGlassHover(bowl, showBowlHover ? hoverStrength.current : 0)

    invalidate()
  })

  const pickable = (step === 'pick' && pileReady) || step === 'revealed'

  const handlePick = () => {
    if (step === 'revealed') {
      onReset()
      return
    }
    if (!pickable || step !== 'pick') return
    onPickSlip(pickSlipFromBowl(layouts))
  }

  return (
    <group ref={groupRef}>
      <group position={[0, QUOTE_BOWL.contentYOffset, 0]}>
        <primitive object={bowl} />

        <CrumpledPaperPile
          layouts={layouts}
          step={step}
          selectedSlipId={selectedSlipId}
          dimmed={false}
        />

        <QuoteBowlPickTarget
          fitRadius={fitRadius}
          height={height}
          topY={topY}
          pickable={pickable}
          onPick={handlePick}
          onHoverChange={(hovering) => {
            hoverTarget.current = hovering ? 1 : 0
            invalidate()
          }}
        />
      </group>
    </group>
  )
}
