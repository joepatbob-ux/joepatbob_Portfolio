'use client'

import { FitCamera } from '@/components/phone-swap/FitCamera'
import { OrbitControls } from '@react-three/drei'
import { useEffect } from 'react'
import { debugLog } from '@/lib/phone-swap/debugLog'
import { usePixel8SceneGraph } from '@/lib/phone-swap/usePixel8SceneGraph'

/** One Pixel 8 Pro — authored textures + stock wallpaper screen. */
export function SingleAndroidDebugScene() {
  const { scene, fitRadius } = usePixel8SceneGraph()

  // #region agent log
  useEffect(() => {
    debugLog(
      'SingleAndroidDebugScene.tsx:mount',
      'single Pixel 8 scene mounted',
      { fitRadius },
      'S',
      'pixel8-tex-materials',
    )
  }, [fitRadius])
  // #endregion

  return (
    <>
      <color attach="background" args={['#d8d8d8']} />
      <ambientLight intensity={0.75} />
      <directionalLight position={[5, 8, 6]} intensity={1.4} />
      <directionalLight position={[-4, 2, -4]} intensity={0.4} />
      <primitive object={scene} />
      <OrbitControls makeDefault enablePan={false} target={[0, 0, 0]} />
      <FitCamera subject={scene} />
    </>
  )
}
