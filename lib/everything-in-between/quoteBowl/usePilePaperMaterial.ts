'use client'

import { applyPilePaperTint } from '@/lib/everything-in-between/quoteBowl/applyPilePaperTint'
import { useEffect } from 'react'
import type * as THREE from 'three'

/** Accent crumpled wads — flat PBR on baked crumple geometry (no slip texture maps). */
export function usePilePaperMaterial(material: THREE.MeshStandardMaterial) {
  useEffect(() => {
    applyPilePaperTint(material)
  }, [material])
}
