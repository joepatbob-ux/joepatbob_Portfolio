export type BoardParticle = {
  baseX: number
  baseY: number
  x: number
  y: number
  vx: number
  vy: number
  char: '0' | '1'
  order: number
}

export type FitRect = {
  x: number
  y: number
  w: number
  h: number
}

export type BoardTransition = {
  from: number
  to: number
  startedAt: number
}

export const BOARD_ASPECT = '2044 / 1476'
export const PARTICLE_GAP = 2
export const PARTICLE_MOUSE_RADIUS = 88
export const PARTICLE_RETURN_SPEED = 0.055

/** Dissolve in — quick but soft landing into the glyph field. */
export const TRANSITION_ENTER_MS = 820
/** Dissolve out — slightly longer so the photo can breathe back in. */
export const TRANSITION_LEAVE_MS = 980

/** Stagger window for per-cell dissolve (wider = softer handoff). */
const DISSOLVE_BLEND = 0.2
const PHOTO_HIDE_END = 0.44
const FIELD_RAMP_END = 0.58
const INTERACTIVE_AT = 0.68
const INTERACTIVE_RAMP = 0.16

export function containRect(
  containerW: number,
  containerH: number,
  contentW: number,
  contentH: number,
): FitRect {
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

function hashCell(x: number, y: number): number {
  let h = x * 374761393 + y * 668265263
  h = (h ^ (h >> 13)) * 1274126177
  return (h ^ (h >> 16)) >>> 0
}

function cellOrder(x: number, y: number): number {
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
  let sum = 0
  let count = 0
  const xEnd = Math.min(x + w, width)
  const yEnd = Math.min(y + h, height)

  for (let py = y; py < yEnd; py += 1) {
    for (let px = x; px < xEnd; px += 1) {
      const i = (py * width + px) * 4
      const alpha = (data[i + 3] ?? 255) / 255
      if (alpha < 0.04) continue
      sum +=
        (data[i] ?? 0) * alpha +
        (data[i + 1] ?? 0) * alpha +
        (data[i + 2] ?? 0) * alpha
      count += 1
    }
  }

  return count === 0 ? 0 : sum / count
}

export function buildBoardParticles(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  gap = PARTICLE_GAP,
): BoardParticle[] {
  const particles: BoardParticle[] = []

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
        order: cellOrder(x, y),
      })
    }
  }

  return particles
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

export function easeInOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2
}

/** Ease-out quint — gentle deceleration into the settled glyph state. */
export function easeOutQuint(t: number): number {
  const x = Math.max(0, Math.min(1, t))
  return 1 - (1 - x) ** 5
}

function particleDissolve(progress: number, order: number): number {
  const linear = (progress - order) / DISSOLVE_BLEND
  return smoothstep(0, 1, linear)
}

export function photoOpacityFromProgress(progress: number): number {
  return 1 - smoothstep(0, PHOTO_HIDE_END, progress)
}

function fieldStrength(progress: number): number {
  return smoothstep(0.05, FIELD_RAMP_END, progress)
}

/** Ramp cursor physics in/out instead of a hard on/off. */
export function physicsStrength(progress: number, hovered: boolean): number {
  if (!hovered) return 0
  if (progress < INTERACTIVE_AT) return 0
  return smoothstep(INTERACTIVE_AT, INTERACTIVE_AT + INTERACTIVE_RAMP, progress)
}

export function progressFromTransition(
  transition: BoardTransition,
  now: number,
): number {
  const duration =
    transition.to > transition.from ? TRANSITION_ENTER_MS : TRANSITION_LEAVE_MS
  const elapsed = now - transition.startedAt
  const t = Math.min(1, elapsed / duration)
  const eased =
    transition.to > transition.from ? easeOutQuint(t) : easeInOutCubic(t)
  return transition.from + (transition.to - transition.from) * eased
}

export function isTransitionComplete(
  transition: BoardTransition,
  now: number,
): boolean {
  const duration =
    transition.to > transition.from ? TRANSITION_ENTER_MS : TRANSITION_LEAVE_MS
  return now - transition.startedAt >= duration
}

export function resetParticles(particles: BoardParticle[]): void {
  for (const p of particles) {
    p.x = p.baseX
    p.y = p.baseY
    p.vx = 0
    p.vy = 0
  }
}

export function stepBoardParticles(
  particles: BoardParticle[],
  mouse: { x: number; y: number },
  physics: number,
  settle: number,
): boolean {
  let settling = false
  const returnSpeed = PARTICLE_RETURN_SPEED + settle * 0.1
  const damping = 0.94 - settle * 0.07

  for (const p of particles) {
    if (physics > 0.01) {
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < PARTICLE_MOUSE_RADIUS && dist > 0.5) {
        const force = ((PARTICLE_MOUSE_RADIUS - dist) / PARTICLE_MOUSE_RADIUS) * physics
        const angle = Math.atan2(dy, dx)
        p.vx -= Math.cos(angle) * force * 1.75
        p.vy -= Math.sin(angle) * force * 1.75
      }
    }

    p.vx += (p.baseX - p.x) * returnSpeed
    p.vy += (p.baseY - p.y) * returnSpeed
    p.vx *= damping
    p.vy *= damping
    p.x += p.vx
    p.y += p.vy

    if (
      Math.abs(p.x - p.baseX) > 0.3 ||
      Math.abs(p.y - p.baseY) > 0.3 ||
      Math.abs(p.vx) > 0.03 ||
      Math.abs(p.vy) > 0.03
    ) {
      settling = true
    }
  }

  return settling
}

export function drawWrConnectBoardFrame(options: {
  ctx: CanvasRenderingContext2D
  image: CanvasImageSource
  imageFit: FitRect
  particles: readonly BoardParticle[]
  progress: number
  glyphColor: string
  fontFamily: string
  sampleGap: number
}) {
  const { ctx, image, imageFit, particles, progress, glyphColor, fontFamily, sampleGap } =
    options
  const { width: displayW, height: displayH } = ctx.canvas.getBoundingClientRect()
  if (displayW < 1 || displayH < 1) return

  ctx.clearRect(0, 0, displayW, displayH)

  const photoOpacity = photoOpacityFromProgress(progress)
  if (photoOpacity > 0.008) {
    ctx.save()
    ctx.globalAlpha = photoOpacity
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(image, imageFit.x, imageFit.y, imageFit.w, imageFit.h)
    ctx.restore()
  }

  const field = fieldStrength(progress)
  if (field <= 0.008) return

  const fontSize = Math.max(3, sampleGap + 1)
  ctx.font = `500 ${fontSize}px ${fontFamily}`
  ctx.fillStyle = glyphColor
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const particle of particles) {
    const dissolve = particleDissolve(progress, particle.order)
    if (dissolve <= 0) continue

    const alpha = dissolve * field
    if (alpha <= 0.01) continue

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillText(particle.char, particle.x, particle.y)
    ctx.restore()
  }
}

export function loadBoardImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

export function preloadBoardImage(src: string): void {
  void loadBoardImage(src)
}
