import { useLoader } from '@react-three/fiber'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

export function useGlb(path: string) {
  return useLoader(GLTFLoader, path, (loader) => {
    loader.setDRACOLoader(dracoLoader)
  }).scene
}
