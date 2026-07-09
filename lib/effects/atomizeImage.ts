export type AsciiParticle = {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  char: '0' | '1'
  /** 0 = embedded in the board image, 1 = fully pulled free as a glyph. */
  pull: number
  /** Per-cell stagger so extraction ripples instead of opening one big hole. */
  stagger: number
}

export const PARTICLE_SAMPLE_GAP = 2
/** Wide progressive extraction zone around the pointer. */
export const PARTICLE_ACTIVATION_RADIUS = 104
export const PARTICLE_PULL_RATE = 0.048
export const PARTICLE_RELEASE_RATE = 0.07
export const PARTICLE_EJECT_FORCE = 0.2
export const PARTICLE_DRIFT_FORCE = 0.038
export const PARTICLE_RETURN_SPEED = 0.065
export const PARTICLE_FRICTION = 0.965
export const PARTICLE_MAX_SPEED = 1.35
/** Minimum influence before a cell can begin pulling (avoids soft-edge mass erase). */
export const PARTICLE_PULL_THRESHOLD = 0.26

export type ViewportBounds = {
  width: number
  height: number
}

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

function cellStagger(x: number, y: number): number {
  return (hashCell(x, y) % 100) / 100
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

/** Sample board pixels into mono 1/0 glyphs embedded in the PDF surface. */
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
        pull: 0,
        stagger: cellStagger(cx, cy),
      })
    }
  }

  return particles
}

export function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - Math.pow(1 - x, 3)
}

/** How strongly the cursor is disturbing a particle still seated on the board. */
export function activationAtBase(
  mouse: { x: number; y: number },
  particle: AsciiParticle,
  radius: number,
  active: boolean,
): number {
  if (!active) return 0
  const dx = mouse.x - particle.baseX
  const dy = mouse.y - particle.baseY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist >= radius) return 0
  const t = 1 - dist / radius
  const core = Math.pow(t, 2.35)
  const gate = particle.stagger * 0.28
  if (core <= gate) return 0
  return (core - gate) / (1 - gate)
}

function driftAngle(particle: AsciiParticle): number {
  return ((hashCell(particle.baseX, particle.baseY) % 360) * Math.PI) / 180
}

function clampSpeed(p: AsciiParticle): void {
  const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
  if (speed > PARTICLE_MAX_SPEED) {
    p.vx = (p.vx / speed) * PARTICLE_MAX_SPEED
    p.vy = (p.vy / speed) * PARTICLE_MAX_SPEED
  }
}

function keepInViewport(p: AsciiParticle, bounds: ViewportBounds, margin: number): void {
  if (p.x < margin) {
    p.x = margin
    p.vx = Math.abs(p.vx) * 0.35
  } else if (p.x > bounds.width - margin) {
    p.x = bounds.width - margin
    p.vx = -Math.abs(p.vx) * 0.35
  }

  if (p.y < margin) {
    p.y = margin
    p.vy = Math.abs(p.vy) * 0.35
  } else if (p.y > bounds.height - margin) {
    p.y = bounds.height - margin
    p.vy = -Math.abs(p.vy) * 0.35
  }
}

export function stepAsciiParticles(
  particles: AsciiParticle[],
  mouse: { x: number; y: number },
  active: boolean,
  bounds: ViewportBounds,
): boolean {
  let settling = false
  const activationRadius = PARTICLE_ACTIVATION_RADIUS
  const margin = 4

  for (const p of particles) {
    const influence = activationAtBase(mouse, p, activationRadius, active)
    const canPull = influence >= PARTICLE_PULL_THRESHOLD

    if (active && canPull) {
      const pullDrive = (influence - PARTICLE_PULL_THRESHOLD) / (1 - PARTICLE_PULL_THRESHOLD)

      const ejectDx = p.baseX - mouse.x
      const ejectDy = p.baseY - mouse.y
      const ejectDist = Math.sqrt(ejectDx * ejectDx + ejectDy * ejectDy)

      if (ejectDist > 0.5 && p.pull < 0.72) {
        const eject = pullDrive * PARTICLE_EJECT_FORCE * (1 - p.pull)
        p.vx += (ejectDx / ejectDist) * eject
        p.vy += (ejectDy / ejectDist) * eject
      }

      p.pull = Math.min(1, p.pull + pullDrive * PARTICLE_PULL_RATE)

      if (p.pull > 0.38) {
        const angle = driftAngle(p)
        const drift = PARTICLE_DRIFT_FORCE * p.pull * pullDrive
        p.vx += Math.cos(angle) * drift
        p.vy += Math.sin(angle) * drift
      }
    } else if (!active) {
      p.pull = Math.max(0, p.pull - PARTICLE_RELEASE_RATE)
    } else if (p.pull < 0.5) {
      p.pull = Math.max(0, p.pull - PARTICLE_RELEASE_RATE * 0.45)
    }

    const homePull = 1 - p.pull
    if (homePull > 0.04 && (!active || p.pull < 0.62)) {
      p.vx += (p.baseX - p.x) * PARTICLE_RETURN_SPEED * homePull
      p.vy += (p.baseY - p.y) * PARTICLE_RETURN_SPEED * homePull
    }

    p.vx *= PARTICLE_FRICTION
    p.vy *= PARTICLE_FRICTION
    clampSpeed(p)
    p.x += p.vx
    p.y += p.vy

    if (p.pull > 0.45) {
      keepInViewport(p, bounds, margin)
    }

    if (
      p.pull > 0.02 ||
      Math.abs(p.x - p.baseX) > 0.35 ||
      Math.abs(p.y - p.baseY) > 0.35 ||
      Math.abs(p.vx) > 0.03 ||
      Math.abs(p.vy) > 0.03
    ) {
      settling = true
    }
  }

  return settling
}

export function hasActivePull(particles: readonly AsciiParticle[]): boolean {
  for (const p of particles) {
    if (p.pull > 0.02) return true
  }
  return false
}

export function drawAtomizeFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  imageFit: ContainRect
  particles: readonly AsciiParticle[]
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

  const fontSize = Math.max(3, sampleGap + 1)
  const maxHoleRadius = fontSize * 0.55
  const anyPulled = hasActivePull(particles)

  if (anyPulled) {
    ctx.save()
    ctx.globalCompositeOperation = 'destination-out'
    for (const particle of particles) {
      if (particle.pull <= 0.14) continue

      const t = easeOutCubic((particle.pull - 0.14) / 0.86)
      const holeRadius = maxHoleRadius * t
      if (holeRadius < 0.35) continue

      ctx.globalAlpha = t * 0.92
      ctx.beginPath()
      ctx.arc(particle.baseX, particle.baseY, holeRadius, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }

  if (!anyPulled) return

  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const particle of particles) {
    if (particle.pull <= 0.22) continue

    const alpha = easeOutCubic((particle.pull - 0.22) / 0.78)
    const lift = easeOutCubic(Math.min(1, (particle.pull - 0.22) / 0.65))

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillText(particle.char, particle.x, particle.y - lift * 0.55)
    ctx.restore()
  }
}

export function resetParticles(particles: AsciiParticle[]): void {
  for (const p of particles) {
    p.x = p.baseX
    p.y = p.baseY
    p.vx = 0
    p.vy = 0
    p.pull = 0
  }
}
