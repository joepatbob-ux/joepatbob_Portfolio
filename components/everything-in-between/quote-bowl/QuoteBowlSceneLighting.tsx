'use client'

import { QuoteBowlCameraRig } from '@/components/everything-in-between/quote-bowl/QuoteBowlCameraRig'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { Environment } from '@react-three/drei'

type Props = {
  darkSurface: boolean
}

export function QuoteBowlSceneLighting({ darkSurface }: Props) {
  const { environment, lighting } = darkSurface
    ? QUOTE_BOWL.darkSurface
    : QUOTE_BOWL.lightSurface
  const { shadows } = QUOTE_BOWL
  const shadowHalf = shadows.camera.size

  return (
    <>
      <QuoteBowlCameraRig />
      <ambientLight intensity={lighting.ambient} />
      <directionalLight
        position={[...lighting.key.position]}
        intensity={lighting.key.intensity}
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
        position={[...lighting.fill.position]}
        intensity={lighting.fill.intensity}
      />
      {'rim' in lighting && lighting.rim ? (
        <pointLight
          position={[...lighting.rim.position]}
          intensity={lighting.rim.intensity}
          color={lighting.rim.color}
          distance={14}
          decay={2}
        />
      ) : null}
      <hemisphereLight
        args={[
          lighting.hemisphere.sky,
          lighting.hemisphere.ground,
          lighting.hemisphere.intensity,
        ]}
      />
      <Environment
        preset={environment.preset}
        environmentIntensity={environment.intensity}
        resolution={environment.resolution}
      />
    </>
  )
}
