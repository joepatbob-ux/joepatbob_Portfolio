export type AsciiParticle = {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  char: '0' | '1'
}

export const PARTICLE_SAMPLE_GAP = 2
export const PARTICLE_REVEAL_RADIUS = 76
export const PARTICLE_MOUSE_RADIUS = 88
export const PARTICLE_RETURN_SPEED = 0.06

export type ContainRect = {
  x: number
  y: number
  w: number
  h: number
}

/** Letterbox content inside a container — matches CSS object-fit: contain. */
export function containRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): ContainRect {
  if (contentW <= 0 || contentH <= 0) {
    return { x: 0, y: 0, w: containerW, h: containerH }
  }

  const scale = Math.min(containerW / contentW, containerH / contentH)
  const w = contentW * scale
  const h = contentH * scale

  return {
    x: (containerW - w) / 2,
    y: (containerH - h) / 2,
    w,
    h,
  }
}

function sampleLuminance(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
  y: number,
  w: number,
  h: number,
): number {
  let r = 0
  let g = 0
  let b = 0
  let count = 0
  const xEnd = Math.min(x + w, width)
  const yEnd = Math.min(y + h, height)

  for (let py = y; py < yEnd; py += 1) {
    for (let px = x; px < xEnd; px += 1) {
      const i = (py * width + px) * 4
      const alpha = (data[i + 3] ?? 255) / 255
      if (alpha < 0.04) continue
      r += (data[i] ?? 0) * alpha
      g += (data[i + 1] ?? 0) * alpha
      b += (data[i + 2] ?? 0) * alpha
      count += 1
    }
  }

  return count === 0 ? 0 : (r + g + b) / count
}

/** Sample board pixels into mono 1/0 glyphs revealed on cursor hover. */
export function buildAsciiParticles(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  gap: number,
): AsciiParticle[] {
  const particles: AsciiParticle[] = []

  for (let y = 0; y < height; y += gap) {
    const h = Math.min(gap, height - y)
    for (let x = 0; x < width; x += gap) {
      const w = Math.min(gap, width - x)
      const luminance = sampleLuminance(data, width, height, x, y, w, h)
      if (luminance < 8) continue

      const cx = x + w / 2
      const cy = y + h / 2
      particles.push({
        baseX: cx,
        baseY: cy,
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        char: luminance > 108 ? '1' : '0',
      })
    }
  }

  return particles
}

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

function cursorRevealStrength(
  mouse: { x: number; y: number },
  particle: AsciiParticle,
  radius: number,
  active: boolean,
): number {
  if (!active) return 0
  const dx = mouse.x - particle.x
  const dy = mouse.y - particle.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= radius) return 0
  const t = 1 - dist / radius
  return easeOutCubic(t)
}

export function stepAsciiParticles(
  particles: AsciiParticle[],
  mouse: { x: number; y: number },
  active: boolean,
): boolean {
  let settling = false
  const revealRadius = PARTICLE_REVEAL_RADIUS
  const scatterRadius = PARTICLE_MOUSE_RADIUS
  const returnSpeed = PARTICLE_RETURN_SPEED

  for (const p of particles) {
    const revealed = cursorRevealStrength(mouse, p, revealRadius, active)

    if (active && revealed > 0.12) {
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < scatterRadius && dist > 0.5) {
        const force = (scatterRadius - dist) / scatterRadius
        const angle = Math.atan2(dy, dx)
        p.vx -= Math.cos(angle) * force * 2.2
        p.vy -= Math.sin(angle) * force * 2.2
      }
    }

    p.vx += (p.baseX - p.x) * returnSpeed
    p.vy += (p.baseY - p.y) * returnSpeed
    p.vx *= 0.94
    p.vy *= 0.94
    p.x += p.vx
    p.y += p.vy

    if (
      Math.abs(p.x - p.baseX) > 0.4 ||
      Math.abs(p.y - p.baseY) > 0.4 ||
      Math.abs(p.vx) > 0.05 ||
      Math.abs(p.vy) > 0.05
    ) {
      settling = true
    }
  }

  return settling
}

export function drawAtomizeFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  imageFit: ContainRect
  particles: readonly AsciiParticle[]
  mouse: { x: number; y: number }
  hovered: boolean
  glyphColor: string
  fontFamily: string
  sampleGap: number
}) {
  const {
    ctx,
    image,
    imageFit,
    particles,
    mouse,
    hovered,
    glyphColor,
    fontFamily,
    sampleGap,
  } = options
  const rect = ctx.canvas.getBoundingClientRect()
  const displayW = rect.width
  const displayH = rect.height

  if (displayW < 1 || displayH < 1) return

  ctx.clearRect(0, 0, displayW, displayH)

  ctx.save()
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, imageFit.x, imageFit.y, imageFit.w, imageFit.h)
  ctx.restore()

  if (!hovered) return

  const fontSize = Math.max(3, sampleGap + 1)
  const revealRadius = PARTICLE_REVEAL_RADIUS
  const glyphRadius = fontSize * 0.58

  ctx.save()
  ctx.globalCompositeOperation = 'destination-out'
  for (const particle of particles) {
    const reveal = cursorRevealStrength(mouse, particle, revealRadius, true)
    if (reveal <= 0.04) continue

    ctx.globalAlpha = reveal
    ctx.beginPath()
    ctx.arc(particle.x, particle.y, glyphRadius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const particle of particles) {
    const reveal = cursorRevealStrength(mouse, particle, revealRadius, true)
    if (reveal <= 0.04) continue

    ctx.save()
    ctx.globalAlpha = reveal
    ctx.fillText(particle.char, particle.x, particle.y)
    ctx.restore()
  }
}

export function resetParticles(particles: AsciiParticle[]): void {
  for (const p of particles) {
    p.x = p.baseX
    p.y = p.baseY
    p.vx = 0
    p.vy = 0
  }
}
