'use client'

import { QuoteBowlCameraRig } from '@/components/everything-in-between/quote-bowl/QuoteBowlCameraRig'
import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { Environment } from '@react-three/drei'

type Props = {
  darkSurface: boolean
}

export function QuoteBowlSceneLighting({ darkSurface }: Props) {
  const { environment, darkSurface: dark } = QUOTE_BOWL
  const env = darkSurface ? dark.environment : environment
  const lights = darkSurface ? dark.lighting : null

  return (
    <>
      <QuoteBowlCameraRig />
      <ambientLight intensity={lights?.ambient ?? 0.48} />
      <directionalLight
        position={
          lights?.key.position ?? ([3.5, 6, 4.5] as [number, number, number])
        }
        intensity={lights?.key.intensity ?? 0.82}
      />
      <directionalLight
        position={
          lights?.fill.position ?? ([-3.5, 2.5, -2] as [number, number, number])
        }
        intensity={lights?.fill.intensity ?? 0.24}
      />
      {lights?.rim ? (
        <pointLight
          position={[...lights.rim.position]}
          intensity={lights.rim.intensity}
          color={lights.rim.color}
          distance={14}
          decay={2}
        />
      ) : null}
      <hemisphereLight
        args={
          darkSurface
            ? [lights!.hemisphere.sky, lights!.hemisphere.ground, lights!.hemisphere.intensity]
            : ['#faf6eb', '#1a1a1a', 0.22]
        }
      />
      <Environment
        preset={env.preset}
        environmentIntensity={env.intensity}
        resolution={env.resolution}
      />
    </>
  )
}
