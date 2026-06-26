'use client'

import {
  bowlRimTarget,
  CrumpledPaperPile,
} from '@/components/everything-in-between/quote-bowl/CrumpledPaperPile'
import { QuoteBowlDebugOutlines } from '@/components/everything-in-between/quote-bowl/QuoteBowlDebugOutlines'
import { QuoteBowlPileShadowReceiver } from '@/components/everything-in-between/quote-bowl/QuoteBowlPileShadowReceiver'
import { QuoteBowlPickTarget } from '@/components/everything-in-between/quote-bowl/QuoteBowlPickTarget'
import { QuoteBowlRimTracker } from '@/components/everything-in-between/quote-bowl/QuoteBowlRimTracker'
import { QuoteBowlUnfoldingSlip } from '@/components/everything-in-between/quote-bowl/QuoteBowlUnfoldingSlip'
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
  type QuoteSlipLayout,
} from '@/lib/everything-in-between/quotePaper'
import { useGoldfishBowlModel } from '@/lib/everything-in-between/useGoldfishBowlModel'
import { usePaperCrumpledModel } from '@/lib/everything-in-between/usePaperCrumpledModel'
import { useFrame, useThree } from '@react-three/fiber'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'

export function QuoteBowlScene({
  answers,
  step,
  selectedSlipId,
  pullStartedAt,
  resetStartedAt,
  showSlip,
  pileSeed,
  pendingPick,
  lastQuote,
  reducedMotion,
  darkSurface,
  glassTune,
  onPickSlip,
  onReset,
  onClearPendingPick,
  canRepick,
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
  const dipStrengthRef = useRef(0)
  const lastPullStartRef = useRef<number | null>(null)
  const groupRef = useRef<THREE.Group>(null)
  const liveBallsRef = useRef<PaperSimBall[]>([])
  const pullStartCaptureRef = useRef<{ x: number; y: number; z: number } | null>(null)
  const ballHoverRef = useRef(false)
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
        pileSeed,
      ),
    [
      answers,
      height,
      innerRadius,
      pileTopY,
      pileBottomY,
      paperRadius,
      paperRestOffsetY,
      pileSeed,
    ],
  )

  const selectedLayout = useMemo(
    () => layouts.find((layout) => layout.id === selectedSlipId) ?? null,
    [layouts, selectedSlipId],
  )

  const slipHome = useMemo(() => {
    const start = pullStartCaptureRef.current
    if (start) {
      return {
        position: new THREE.Vector3(start.x, start.y, start.z),
        rotation: new THREE.Euler(0.2, 0, 0.15),
      }
    }
    const layout = selectedLayout ?? layouts[0]
    if (!layout) {
      return {
        position: new THREE.Vector3(0, pileTopY, 0),
        rotation: new THREE.Euler(0, 0, 0),
      }
    }
    const [x, y, z] = layout.position
    const [rx, ry, rz] = layout.rotation
    return {
      position: new THREE.Vector3(x, y, z),
      rotation: new THREE.Euler(rx, ry, rz),
    }
  }, [layouts, pileTopY, pullStartedAt, selectedLayout])

  const pileReady = layouts.length > 0
  const canPick = step === 'pick' && pileReady
  const jarInteractive = canPick || (step === 'revealed' && canRepick)
  const motionActive =
    pileReady && (step === 'pick' || (step === 'revealed' && canRepick))
  const show3DSlip =
    step === 'pulling' && !reducedMotion && !showSlip && selectedLayout != null

  const performPick = useCallback(
    (layout?: QuoteSlipLayout) => {
      if (!canPick) return
      if (layout) {
        onPickSlip(layout)
        return
      }
      const liveY = new Map(
        liveBallsRef.current.map((ball) => [ball.layout.id, ball.y]),
      )
      onPickSlip(
        pickSlipFromBowl(layouts, {
          liveY: (slip) => liveY.get(slip.id) ?? slip.position[1],
          excludeQuote: lastQuote,
        }),
      )
    },
    [canPick, lastQuote, layouts, onPickSlip],
  )

  useEffect(() => {
    if (!pendingPick || step !== 'pick' || !pileReady) return
    onClearPendingPick()
    const timer = window.requestAnimationFrame(() => {
      performPick()
    })
    return () => window.cancelAnimationFrame(timer)
  }, [onClearPendingPick, pendingPick, performPick, pileReady, step])

  useLayoutEffect(() => {
    updateBowlGlassMaterial(bowl, glassTune, darkSurface)
    invalidate()
  }, [bowl, glassTune, darkSurface, invalidate])

  useEffect(() => {
    invalidate()
  }, [step, selectedSlipId, pileSeed, invalidate])

  useEffect(() => {
    if (motionActive) return
    hoverTarget.current = 0
    hoverStrength.current = 0
    const root = groupRef.current
    if (root) {
      root.rotation.x = 0
      root.rotation.y = 0
    }
    applyBowlGlassHover(bowl, 0)
    invalidate()
  }, [bowl, invalidate, motionActive])

  useEffect(() => {
    if (pullStartedAt == null || pullStartedAt === lastPullStartRef.current) return
    lastPullStartRef.current = pullStartedAt
    pullStartCaptureRef.current = null
    dipStrengthRef.current = 1
    invalidate()
  }, [pullStartedAt, invalidate])

  useFrame((state, delta) => {
    const root = groupRef.current
    if (!root) return

    const lerpFactor = 1 - Math.pow(0.00001, delta)
    hoverStrength.current = THREE.MathUtils.lerp(
      hoverStrength.current,
      motionActive ? hoverTarget.current : 0,
      lerpFactor,
    )

    const hoverTilt = hoverStrength.current * QUOTE_BOWL.hoverTiltRad
    let targetRotX = motionActive ? hoverTilt : 0
    if (step === 'pulling' && dipStrengthRef.current > 0.001) {
      targetRotX += QUOTE_BOWL.pull.dipRad * dipStrengthRef.current
      dipStrengthRef.current *= Math.exp(-QUOTE_BOWL.pull.dipDecay * delta)
    }
    root.rotation.x = THREE.MathUtils.lerp(
      root.rotation.x,
      targetRotX,
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
      motionActive && (hoverStrength.current > 0.001 || ballHoverRef.current)
    applyBowlGlassHover(bowl, showBowlHover ? Math.max(hoverStrength.current, 0.35) : 0)
  })

  const handleJarAction = useCallback(() => {
    if (canPick) {
      performPick()
      return
    }
    if (step === 'revealed' && canRepick) {
      onReset({ chainPick: true })
    }
  }, [canPick, canRepick, onReset, performPick, step])

  useEffect(() => {
    if (!pickActionRef) return
    pickActionRef.current = jarInteractive ? handleJarAction : null
    return () => {
      pickActionRef.current = null
    }
  }, [handleJarAction, jarInteractive, pickActionRef])

  const groundY = QUOTE_BOWL.contentYOffset + bottomY - 0.05
  const rim = bowlRimTarget(topY, paperRadius, innerRadius)

  return (
    <>
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
            pullStartedAt={pullStartedAt}
            resetStartedAt={resetStartedAt}
            dimmed={step === 'pulling' || step === 'revealed'}
            darkSurface={darkSurface}
            reducedMotion={reducedMotion}
            bowlRotationRef={groupRef}
            bowlTopY={topY}
            innerRadius={innerRadius}
            pileBottomY={pileBottomY}
            pileTopY={pileTopY}
            paperRadius={paperRadius}
            paperRestOffsetY={paperRestOffsetY}
            ballPickable={canPick}
            onBallPick={performPick}
            onHoverBallChange={(hovering) => {
              ballHoverRef.current = hovering
              invalidate()
            }}
            liveBallsRef={liveBallsRef}
            pullStartCaptureRef={pullStartCaptureRef}
          />

          {show3DSlip && selectedLayout ? (
            <QuoteBowlUnfoldingSlip
              layout={selectedLayout}
              pullStartedAt={pullStartedAt}
              bowlTopY={topY}
              reducedMotion={reducedMotion}
              home={slipHome}
              revealed={false}
            />
          ) : null}

          <QuoteBowlPickTarget
            fitRadius={fitRadius}
            height={height}
            topY={topY}
            pickable={jarInteractive}
            onPick={handleJarAction}
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

        {stackRef ? (
          <QuoteBowlRimTracker topY={topY} rimY={rim.y} stackRef={stackRef} />
        ) : null}
      </group>

      <mesh
        position={[0, groundY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        renderOrder={0}
      >
        <circleGeometry args={[2, 48]} />
        <shadowMaterial transparent opacity={darkSurface ? 0.32 : 0.18} />
      </mesh>
    </>
  )
}
