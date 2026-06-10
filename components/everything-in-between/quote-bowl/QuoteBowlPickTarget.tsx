'use client'

import { useEffect } from 'react'

type Props = {
  fitRadius: number
  height: number
  topY: number
  pickable: boolean
  onPick: () => void
  onHoverChange: (hovering: boolean) => void
}

export function QuoteBowlPickTarget({
  fitRadius,
  height,
  topY,
  pickable,
  onPick,
  onHoverChange,
}: Props) {
  const centerY = topY - height * 0.38

  useEffect(() => {
    const resetCursor = () => {
      document.body.style.cursor = ''
    }
    window.addEventListener('blur', resetCursor)
    return () => {
      window.removeEventListener('blur', resetCursor)
      resetCursor()
    }
  }, [])

  return (
    <mesh
      position={[0, centerY, 0]}
      renderOrder={4}
      onPointerOver={
        pickable
          ? (e) => {
              e.stopPropagation()
              onHoverChange(true)
              document.body.style.cursor = 'pointer'
            }
          : undefined
      }
      onPointerOut={
        pickable
          ? (e) => {
              e.stopPropagation()
              onHoverChange(false)
              document.body.style.cursor = ''
            }
          : undefined
      }
      onPointerMissed={
        pickable
          ? () => {
              onHoverChange(false)
              document.body.style.cursor = ''
            }
          : undefined
      }
      onPointerDown={
        pickable
          ? (e) => {
              e.stopPropagation()
              // Touch Safari: pointerdown is more reliable than click for 3D picks.
              if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                onPick()
              }
            }
          : undefined
      }
      onClick={
        pickable
          ? (e) => {
              e.stopPropagation()
              const native = e.nativeEvent
              if (
                native instanceof PointerEvent &&
                (native.pointerType === 'touch' || native.pointerType === 'pen')
              ) {
                return
              }
              onPick()
            }
          : undefined
      }
    >
      <sphereGeometry args={[fitRadius * 0.92, 24, 18]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
