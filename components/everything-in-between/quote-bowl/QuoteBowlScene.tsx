'use client'

import { CrumpledPaperPile } from '@/components/everything-in-between/quote-bowl/CrumpledPaperPile'
import { QuoteBowlDebugOutlines } from '@/components/everything-in-between/quote-bowl/QuoteBowlDebugOutlines'
import { QuoteBowlPileShadowReceiver } from '@/components/everything-in-between/quote-bowl/QuoteBowlPileShadowReceiver'
import { QuoteBowlPickTarget } from '@/components/everything-in-between/quote-bowl/QuoteBowlPickTarget'
import { QuoteBowlRimTracker } from '@/components/everything-in-between/quote-bowl/QuoteBowlRimTracker'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import type { PaperSimBall } from '@/lib/everything-in-between/quoteBowl/paperPilePhysics'
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
import { useCallback, useEffect, useMemo, useRef } from 'react'
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
  pickActionRef,
  debugOutlines = false,
  stackRef,
}: QuoteBowlCanvasProps) {
  const prepared = useGoldfishBowlModel()
  const { bowl, height, innerRadius, topY, pileBottomY, pileTopY, fitRadius, bottomY } =
    prepared
  const { radius: paperMeshRadius, restOffsetY: paperRestOffsetY } =
    usePaperCrumpledModel()
  const paperRadius = paperMeshRadius * 1.1
  const hoverStrength = useRef(0)
  const hoverTarget = useRef(0)
  const groupRef = useRef<THREE.Group>(null)
  const liveBallsRef = useRef<PaperSimBall[]>([])
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
        paperRestOffsetY,
      ),
    [answers, height, innerRadius, pileTopY, pileBottomY, paperRadius, paperRestOffsetY],
  )

  const pileReady = layouts.length > 0

  useEffect(() => {
    updateBowlGlassMaterial(bowl, glassTune, darkSurface)
    invalidate()
  }, [bowl, glassTune, darkSurface, invalidate])

  useEffect(() => {
    invalidate()
  }, [step, selectedSlipId, invalidate])

  useEffect(() => {
    if (step === 'pick') return
    hoverTarget.current = 0
    hoverStrength.current = 0
    const root = groupRef.current
    if (root) {
      root.rotation.x = 0
      root.rotation.y = 0
    }
    applyBowlGlassHover(bowl, 0)
    invalidate()
  }, [bowl, invalidate, step])

  useFrame((state, delta) => {
    const root = groupRef.current
    if (!root) return

    const motionActive = step === 'pick' && pileReady

    const lerpFactor = 1 - Math.pow(0.00001, delta)
    hoverStrength.current = THREE.MathUtils.lerp(
      hoverStrength.current,
      motionActive ? hoverTarget.current : 0,
      lerpFactor,
    )

    const hoverTilt = hoverStrength.current * QUOTE_BOWL.hoverTiltRad
    root.rotation.x = THREE.MathUtils.lerp(
      root.rotation.x,
      motionActive ? hoverTilt : 0,
      lerpFactor,
    )

    const t = state.clock.elapsedTime
    if (motionActive && !reducedMotion && hoverStrength.current < 0.05) {
      root.rotation.y =
        Math.sin(t * QUOTE_BOWL.idleWobbleHz) * QUOTE_BOWL.idleWobbleAmp
    } else {
      root.rotation.y = THREE.MathUtils.lerp(root.rotation.y, 0, 0.06)
    }

    if (motionActive && !reducedMotion && hoverStrength.current > 0.05) {
      root.rotation.z = Math.sin(t * 0.9) * 0.014 * hoverStrength.current
    } else {
      root.rotation.z = THREE.MathUtils.lerp(root.rotation.z, 0, 0.08)
    }

    const showBowlHover =
      motionActive && hoverStrength.current > 0.001
    applyBowlGlassHover(bowl, showBowlHover ? hoverStrength.current : 0)

  })

  const pickable = step === 'pick' && pileReady

  const handlePick = useCallback(() => {
    if (!pickable || step !== 'pick') return
    const liveY = new Map(
      liveBallsRef.current.map((ball) => [ball.layout.id, ball.y]),
    )
    onPickSlip(
      pickSlipFromBowl(layouts, (slip) => liveY.get(slip.id) ?? slip.position[1]),
    )
  }, [layouts, onPickSlip, pickable, step])

  useEffect(() => {
    if (!pickActionRef) return
    pickActionRef.current = handlePick
    return () => {
      pickActionRef.current = null
    }
  }, [handlePick, pickActionRef])

  return (
    <group ref={groupRef}>
      <group position={[0, QUOTE_BOWL.contentYOffset, 0]}>
        <primitive object={bowl} />

        <QuoteBowlPileShadowReceiver
          pileBottomY={pileBottomY}
          innerRadius={innerRadius}
          darkSurface={darkSurface}
        />

        <CrumpledPaperPile
          layouts={layouts}
          step={step}
          selectedSlipId={selectedSlipId}
          dimmed={false}
          darkSurface={darkSurface}
          reducedMotion={reducedMotion}
          bowlRotationRef={groupRef}
          innerRadius={innerRadius}
          pileBottomY={pileBottomY}
          pileTopY={pileTopY}
          paperRadius={paperRadius}
          paperRestOffsetY={paperRestOffsetY}
          liveBallsRef={liveBallsRef}
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

      {debugOutlines ? (
        <QuoteBowlDebugOutlines
          bottomY={bottomY}
          topY={topY}
          fitRadius={fitRadius}
          innerRadius={innerRadius}
          pileBottomY={pileBottomY}
          pileTopY={pileTopY}
        />
      ) : null}

      {stackRef ? <QuoteBowlRimTracker topY={topY} stackRef={stackRef} /> : null}
    </group>
  )
}
