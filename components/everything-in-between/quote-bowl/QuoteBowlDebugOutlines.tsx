'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { Html, Line } from '@react-three/drei'
import { useMemo } from 'react'

type Props = {
  bottomY: number
  topY: number
  fitRadius: number
  innerRadius: number
  pileBottomY: number
  pileTopY: number
}

function ringPoints(y: number, radius: number, segments = 48) {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= segments; i += 1) {
    const t = (i / segments) * Math.PI * 2
    pts.push([Math.cos(t) * radius, y, Math.sin(t) * radius])
  }
  return pts
}

function bboxPoints(
  bottomY: number,
  topY: number,
  radius: number,
): [number, number, number][] {
  const r = radius * 0.98
  const corners: [number, number, number][] = [
    [-r, bottomY, -r],
    [r, bottomY, -r],
    [r, bottomY, r],
    [-r, bottomY, r],
    [-r, bottomY, -r],
  ]
  const topCorners: [number, number, number][] = [
    [-r, topY, -r],
    [r, topY, -r],
    [r, topY, r],
    [-r, topY, r],
    [-r, topY, -r],
  ]
  const verticals: [number, number, number][] = [
    [-r, bottomY, -r],
    [-r, topY, -r],
    [r, bottomY, -r],
    [r, topY, -r],
    [r, bottomY, r],
    [r, topY, r],
    [-r, bottomY, r],
    [-r, topY, r],
  ]
  return [...corners, ...topCorners, ...verticals]
}

function DebugLabel({
  position,
  children,
  color,
}: {
  position: [number, number, number]
  children: string
  color: string
}) {
  return (
    <Html
      position={position}
      center
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        color,
        background: 'color-mix(in srgb, var(--color-paper, #faf6eb) 82%, transparent)',
        padding: '2px 5px',
        borderRadius: '3px',
        border: `1px solid ${color}`,
      }}
    >
      {children}
    </Html>
  )
}

export function QuoteBowlDebugOutlines({
  bottomY,
  topY,
  fitRadius,
  innerRadius,
  pileBottomY,
  pileTopY,
}: Props) {
  const bbox = useMemo(
    () => bboxPoints(bottomY, topY, fitRadius),
    [bottomY, fitRadius, topY],
  )
  const rimRing = useMemo(
    () => ringPoints(topY, innerRadius * 1.02),
    [innerRadius, topY],
  )
  const pileTopRing = useMemo(
    () => ringPoints(pileTopY, innerRadius * 0.72),
    [innerRadius, pileTopY],
  )
  const pileBottomRing = useMemo(
    () => ringPoints(pileBottomY, innerRadius * 0.55),
    [innerRadius, pileBottomY],
  )
  const pickCenterY = topY - (topY - bottomY) * 0.38
  const pickRing = useMemo(
    () => ringPoints(pickCenterY, fitRadius * 0.92, 32),
    [fitRadius, pickCenterY],
  )

  const lineProps = {
    lineWidth: 1,
    transparent: true,
    depthTest: false,
    renderOrder: 10,
  } as const

  return (
    <group position={[0, QUOTE_BOWL.contentYOffset, 0]}>
      <Line points={bbox} color="#ff9500" opacity={0.75} {...lineProps} />
      <Line points={rimRing} color="#ff3b30" opacity={0.95} {...lineProps} />
      <Line points={pileTopRing} color="#34c759" opacity={0.8} {...lineProps} />
      <Line
        points={pileBottomRing}
        color="#34c759"
        opacity={0.45}
        {...lineProps}
      />
      <Line points={pickRing} color="#007aff" opacity={0.55} {...lineProps} />

      <DebugLabel position={[fitRadius * 0.55, topY + 0.08, 0]} color="#ff3b30">
        topY / rim
      </DebugLabel>
      <DebugLabel position={[fitRadius * 0.55, topY + 0.28, 0]} color="#ff9500">
        bbox top
      </DebugLabel>
      <DebugLabel position={[fitRadius * 0.55, pileTopY, 0]} color="#34c759">
        pile top
      </DebugLabel>
      <DebugLabel position={[fitRadius * 0.55, pickCenterY, 0]} color="#007aff">
        pick hit
      </DebugLabel>
    </group>
  )
}
