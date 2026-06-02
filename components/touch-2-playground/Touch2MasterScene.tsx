'use client'

import { FitCamera } from '@/components/phone-swap/FitCamera'
import { OrbitControls } from '@react-three/drei'
import { useTouch2MasterScene } from '@/lib/touch-2-playground/useTouch2MasterScene'

/** KeyShot Touch 2 Master — flat MTL colors, orbit + auto frame. */
export function Touch2MasterScene() {
  const { scene } = useTouch2MasterScene()

  return (
    <>
      <color attach="background" args={['#2a2a2e']} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={1.25} />
      <directionalLight position={[-3, 2, -4]} intensity={0.35} />
      <hemisphereLight args={['#e8ecf4', '#3a3a42', 0.35]} />
      <primitive object={scene} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
      <FitCamera subject={scene} margin={1.42} />
    </>
  )
}
