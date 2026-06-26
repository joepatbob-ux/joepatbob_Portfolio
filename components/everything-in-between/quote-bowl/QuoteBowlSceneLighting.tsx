'use client'

import { QuoteBowlCameraRig } from '@/components/everything-in-between/quote-bowl/QuoteBowlCameraRig'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { Environment } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { useLayoutEffect, useRef } from 'react'
import type { AmbientLight, DirectionalLight, HemisphereLight, PointLight } from 'three'

type Props = {
  darkSurface: boolean
}

/** Single stable env map — avoids HDR reload flash when the page theme toggles. */
const BOWL_ENV_PRESET = 'studio' as const

export function QuoteBowlSceneLighting({ darkSurface }: Props) {
  const scene = useThree((s) => s.scene)
  const invalidate = useThree((s) => s.invalidate)
  const ambientRef = useRef<AmbientLight>(null)
  const keyRef = useRef<DirectionalLight>(null)
  const fillRef = useRef<DirectionalLight>(null)
  const rimRef = useRef<PointLight>(null)
  const hemiRef = useRef<HemisphereLight>(null)
  const light = QUOTE_BOWL.lightSurface.lighting

  useLayoutEffect(() => {
    const surface = darkSurface ? QUOTE_BOWL.darkSurface : QUOTE_BOWL.lightSurface
    const { lighting, environment } = surface

    scene.environmentIntensity = environment.intensity

    if (ambientRef.current) {
      ambientRef.current.intensity = lighting.ambient
    }
    if (keyRef.current) {
      keyRef.current.position.set(
        lighting.key.position[0],
        lighting.key.position[1],
        lighting.key.position[2],
      )
      keyRef.current.intensity = lighting.key.intensity
      if ('color' in lighting.key) {
        keyRef.current.color.set(lighting.key.color)
      }
    }
    if (fillRef.current) {
      fillRef.current.position.set(
        lighting.fill.position[0],
        lighting.fill.position[1],
        lighting.fill.position[2],
      )
      fillRef.current.intensity = lighting.fill.intensity
      if ('color' in lighting.fill) {
        fillRef.current.color.set(lighting.fill.color)
      }
    }
    if (rimRef.current) {
      const rim = 'rim' in lighting ? lighting.rim : null
      if (rim) {
        rimRef.current.position.set(
          rim.position[0],
          rim.position[1],
          rim.position[2],
        )
        rimRef.current.intensity = rim.intensity
        rimRef.current.color.set(rim.color)
      } else {
        rimRef.current.intensity = 0
      }
    }
    if (hemiRef.current) {
      hemiRef.current.color.set(lighting.hemisphere.sky)
      hemiRef.current.groundColor.set(lighting.hemisphere.ground)
      hemiRef.current.intensity = lighting.hemisphere.intensity
    }

    invalidate()
  }, [darkSurface, invalidate, scene])

  const { shadows } = QUOTE_BOWL
  const shadowHalf = shadows.camera.size

  return (
    <>
      <QuoteBowlCameraRig />
      <ambientLight ref={ambientRef} intensity={light.ambient} />
      <directionalLight
        ref={keyRef}
        position={[...light.key.position]}
        intensity={light.key.intensity}
        color={light.key.color}
        castShadow
        shadow-mapSize-width={shadows.mapSize}
        shadow-mapSize-height={shadows.mapSize}
        shadow-camera-near={shadows.camera.near}
        shadow-camera-far={shadows.camera.far}
        shadow-camera-left={-shadowHalf}
        shadow-camera-right={shadowHalf}
        shadow-camera-top={shadowHalf}
        shadow-camera-bottom={-shadowHalf}
        shadow-bias={shadows.bias}
        shadow-normalBias={shadows.normalBias}
      />
      <directionalLight
        ref={fillRef}
        position={[...light.fill.position]}
        intensity={light.fill.intensity}
        color={light.fill.color}
      />
      <pointLight ref={rimRef} position={[0, 3, -4]} intensity={0} distance={14} decay={2} />
      <hemisphereLight
        ref={hemiRef}
        args={[light.hemisphere.sky, light.hemisphere.ground, light.hemisphere.intensity]}
      />
      <Environment
        preset={BOWL_ENV_PRESET}
        environmentIntensity={QUOTE_BOWL.lightSurface.environment.intensity}
        resolution={QUOTE_BOWL.environment.resolution}
      />
    </>
  )
}
