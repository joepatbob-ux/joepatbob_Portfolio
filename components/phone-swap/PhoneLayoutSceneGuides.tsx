import { Line } from '@react-three/drei'
import { useMemo } from 'react'

/** 3D center cross at world origin — aligns with CSS comp center when camera is default. */
export function PhoneLayoutSceneGuides() {
  const xLine = useMemo(
    () => [
      [-1.6, 0, 0],
      [1.6, 0, 0],
    ] as [number, number, number][],
    [],
  )
  const yLine = useMemo(
    () => [
      [0, -1.35, 0],
      [0, 1.35, 0],
    ] as [number, number, number][],
    [],
  )
  const frame = useMemo(
    () =>
      [
        [-1.35, -1.05, 0],
        [1.35, -1.05, 0],
        [1.35, 1.05, 0],
        [-1.35, 1.05, 0],
        [-1.35, -1.05, 0],
      ] as [number, number, number][],
    [],
  )

  return (
    <group renderOrder={-1}>
      <Line points={xLine} color="#00aaff" lineWidth={1} transparent opacity={0.7} depthTest={false} />
      <Line points={yLine} color="#ff3ca0" lineWidth={1} transparent opacity={0.7} depthTest={false} />
      <Line points={frame} color="#ff9500" lineWidth={1} transparent opacity={0.55} depthTest={false} />
    </group>
  )
}
