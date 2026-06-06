'use client'

type Props = {
  pileBottomY: number
  innerRadius: number
  darkSurface: boolean
}

/** Invisible disc — catches paper-ball shadows inside the bowl. */
export function QuoteBowlPileShadowReceiver({
  pileBottomY,
  innerRadius,
  darkSurface,
}: Props) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, pileBottomY + 0.004, 0]}
      receiveShadow
      renderOrder={1}
    >
      <circleGeometry args={[innerRadius * 0.68, 40]} />
      <shadowMaterial
        transparent
        opacity={darkSurface ? 0.38 : 0.26}
        color="#000000"
      />
    </mesh>
  )
}
