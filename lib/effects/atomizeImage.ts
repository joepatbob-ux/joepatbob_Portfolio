export type AsciiParticle = {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  /** Rest-state opacity for the 0 glyph — maps board luminance to weight. */
  weight: number
  order: number
}

const DISSOLVE_BLEND = 0.12
const INTERACTIVE_PROGRESS = 0.92

export const PARTICLE_SAMPLE_GAP = 2
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

export function hashCell(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) >>> 0
}

export function cellOrder(x: number, y: number): number {
  return (hashCell(x, y) % 1000) / 1000
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

/** Map sampled luminance to a rest-state glyph weight (all 0s at varying opacity). */
export function luminanceToWeight(luminance: number): number {
  const t = Math.min(1, Math.max(0, (luminance - 8) / 165))
  const curved = Math.pow(t, 2.1)
  return 0.04 + curved * 0.96
}

/** Sample board pixels into weighted 0 glyphs that silhouette the board at rest. */
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
        weight: luminanceToWeight(luminance),
        order: cellOrder(x, y),
      })
    }
  }

  return particles
}

function particleFlip(progress: number, order: number): number {
  return Math.max(0, Math.min(1, (progress - order) / DISSOLVE_BLEND))
}

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

export function isParticleInteractive(
  progress: number,
  hovered: boolean,
): boolean {
  return hovered && progress >= INTERACTIVE_PROGRESS
}

export function stepAsciiParticles(
  particles: AsciiParticle[],
  mouse: { x: number; y: number },
  interactive: boolean,
): boolean {
  let settling = false
  const { mouseRadius, returnSpeed } = {
    mouseRadius: PARTICLE_MOUSE_RADIUS,
    returnSpeed: PARTICLE_RETURN_SPEED,
  }

  for (const p of particles) {
    if (interactive) {
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < mouseRadius && dist > 0.5) {
        const force = (mouseRadius - dist) / mouseRadius
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
  particles: readonly AsciiParticle[]
  progress: number
  glyphColor: string
  fontFamily: string
  sampleGap: number
}) {
  const { ctx, particles, progress, glyphColor, fontFamily, sampleGap } =
    options
  const rect = ctx.canvas.getBoundingClientRect()
  const displayW = rect.width
  const displayH = rect.height

  if (displayW < 1 || displayH < 1) return

  ctx.clearRect(0, 0, displayW, displayH)

  const fontSize = Math.max(3, sampleGap + 1)
  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const particle of particles) {
    const flip = easeOutCubic(particleFlip(progress, particle.order))

    if (flip < 1) {
      const restAlpha = particle.weight * (1 - flip)
      if (restAlpha > 0.02) {
        ctx.save()
        ctx.globalAlpha = restAlpha
        ctx.fillText('0', particle.x, particle.y)
        ctx.restore()
      }
    }

    if (flip > 0) {
      ctx.save()
      ctx.globalAlpha = flip
      ctx.fillText('1', particle.x, particle.y)
      ctx.restore()
    }
  }
}

export function stepAtomizeProgress(
  current: number,
  target: number,
  step = 0.085,
): number {
  if (Math.abs(target - current) < 0.008) return target
  return current + (target - current) * step
}

export function resetParticles(particles: AsciiParticle[]): void {
  for (const p of particles) {
    p.x = p.baseX
    p.y = p.baseY
    p.vx = 0
    p.vy = 0
  }
}
