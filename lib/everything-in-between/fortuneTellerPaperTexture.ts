import * as THREE from 'three'

/** Notebook paper — red margin + ruled lines for the origami panels. */
export function createFortuneTellerPaperTexture(): THREE.CanvasTexture {
  const size = 512
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return new THREE.CanvasTexture(canvas)
  }

  ctx.fillStyle = '#faf6eb'
  ctx.fillRect(0, 0, size, size)

  const marginX = size * 0.11
  ctx.fillStyle = 'rgba(229, 115, 115, 0.55)'
  ctx.fillRect(marginX, 0, size * 0.012, size)

  ctx.strokeStyle = 'rgba(42, 42, 42, 0.1)'
  ctx.lineWidth = 1
  const lineStep = size / 22
  for (let y = lineStep; y < size; y += lineStep) {
    ctx.beginPath()
    ctx.moveTo(0, y + 0.5)
    ctx.lineTo(size, y + 0.5)
    ctx.stroke()
  }

  ctx.strokeStyle = 'rgba(42, 42, 42, 0.14)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(1, 1)
  return texture
}
