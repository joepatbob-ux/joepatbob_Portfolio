export type AsciiParticle = {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  char: '0' | '1'
  order: number
}

const DISSOLVE_BLEND = 0.14
const PHOTO_HIDE_PROGRESS = 0.32
const INTERACTIVE_PROGRESS = 0.92

export const PARTICLE_SAMPLE_GAP = 4
export const PARTICLE_MOUSE_RADIUS = 96
export const PARTICLE_RETURN_SPEED = 0.06

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

/** Sample board pixels into mono ASCII particles (Framer ParticleText pattern). */
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
      if (luminance < 14) continue

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
        order: cellOrder(x, y),
      })
    }
  }

  return particles
}

function particleDissolve(progress: number, order: number): number {
  return Math.max(0, Math.min(1, (progress - order) / DISSOLVE_BLEND))
}

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

export function photoOpacityFromProgress(progress: number): number {
  const t = Math.min(1, Math.max(0, progress) / PHOTO_HIDE_PROGRESS)
  return 1 - easeOutCubic(t)
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
  image: CanvasImageSource
  particles: readonly AsciiParticle[]
  progress: number
  glyphColor: string
  fieldColor: string
  fontFamily: string
  sampleGap: number
}) {
  const {
    ctx,
    image,
    particles,
    progress,
    glyphColor,
    fieldColor,
    fontFamily,
    sampleGap,
  } = options
  const displayW =
    Number(ctx.canvas.style.width.replace('px', '')) || ctx.canvas.width
  const displayH =
    Number(ctx.canvas.style.height.replace('px', '')) || ctx.canvas.height

  ctx.clearRect(0, 0, displayW, displayH)

  const photoOpacity = photoOpacityFromProgress(progress)
  const fieldAlpha = 1 - photoOpacity

  if (fieldAlpha > 0.01) {
    ctx.fillStyle = fieldColor
    ctx.globalAlpha = fieldAlpha
    ctx.fillRect(0, 0, displayW, displayH)
    ctx.globalAlpha = 1
  }

  if (photoOpacity > 0.02) {
    ctx.save()
    ctx.globalAlpha = photoOpacity
    ctx.drawImage(image, 0, 0, displayW, displayH)
    ctx.restore()
  }

  const fontSize = Math.max(4, sampleGap - 1)
  ctx.font = `400 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const particle of particles) {
    const dissolve = particleDissolve(progress, particle.order)
    if (dissolve <= 0) continue

    ctx.save()
    ctx.globalAlpha = dissolve
    ctx.fillText(particle.char, particle.x, particle.y)
    ctx.restore()
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
