/** Canvas wireframe painters for Web Apps scratch reveal (monospace UI chrome). */

const KELVIN = '#F5431B'
const INK = '#1a1a1a'
const MUTED = '#6b6b6b'
const LINE = '#c8c6c0'
const PANEL = '#f5f4f0'

function font(ctx: CanvasRenderingContext2D, size = 10) {
  ctx.font = `${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`
  ctx.textBaseline = 'top'
}

function box(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill = PANEL,
  stroke = LINE,
) {
  ctx.fillStyle = fill
  ctx.fillRect(x, y, w, h)
  ctx.strokeStyle = stroke
  ctx.lineWidth = 1
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
}

export function fillLottoScratchLayer(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  const g = ctx.createLinearGradient(0, 0, w, h)
  g.addColorStop(0, '#c9c7c1')
  g.addColorStop(0.35, '#e8e6e0')
  g.addColorStop(0.55, '#f2f0ea')
  g.addColorStop(1, '#b5b3ad')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)

  const streaks = [
    [0.1, 0.2, 0.9, 0.35],
    [0.05, 0.55, 0.7, 0.75],
    [0.3, 0.85, 0.95, 0.95],
  ]
  ctx.lineWidth = 2
  for (const [x1, y1, x2, y2] of streaks) {
    const lg = ctx.createLinearGradient(x1 * w, y1 * h, x2 * w, y2 * h)
    lg.addColorStop(0, 'rgba(255,255,255,0)')
    lg.addColorStop(0.45, 'rgba(255,255,255,0.45)')
    lg.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.strokeStyle = lg
    ctx.beginPath()
    ctx.moveTo(x1 * w, y1 * h)
    ctx.lineTo(x2 * w, y2 * h)
    ctx.stroke()
  }

  const img = ctx.getImageData(0, 0, w, h)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 22
    d[i] = Math.min(255, Math.max(0, d[i] + n))
    d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n))
    d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n))
  }
  ctx.putImageData(img, 0, 0)
}

function scratchLabel(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  product: string,
) {
  font(ctx, 9)
  ctx.fillStyle = 'rgba(0,0,0,0.45)'
  ctx.textAlign = 'center'
  ctx.fillText('✦ SCRATCH TO REVEAL ✦', w / 2, h * 0.38)
  font(ctx, 11)
  ctx.fillStyle = INK
  ctx.fillText(product, w / 2, h * 0.48)
  ctx.textAlign = 'left'
}

/** Top-left — SENSI MTM: left nav, dense table, blue accent */
export function drawBeforeSensiMtm(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const blue = '#1d4ed8'
  box(ctx, 0, 0, w * 0.22, h, '#dbeafe', blue)
  font(ctx, 8)
  ctx.fillStyle = blue
  ;['Dash', 'Sites', 'Bulk', 'Logs'].forEach((t, i) => {
    ctx.fillText(t, 8, 12 + i * 18)
  })
  box(ctx, w * 0.22, 0, w * 0.78, 28, '#eff6ff', blue)
  ctx.fillStyle = INK
  ctx.fillText('SENSI MTM — Thermostat Manager', w * 0.26, 9)
  const tx = w * 0.24
  const ty = 36
  const tw = w * 0.74
  const th = h - 44
  box(ctx, tx, ty, tw, th)
  ctx.fillStyle = blue
  ctx.fillRect(tx, ty, tw, 16)
  ctx.fillStyle = '#fff'
  font(ctx, 8)
  ;['ID', 'Zone', 'Set°', 'Mode', 'Alert'].forEach((c, i) => {
    ctx.fillText(c, tx + 6 + i * (tw / 5.2), ty + 4)
  })
  for (let r = 0; r < 8; r++) {
    const ry = ty + 20 + r * 14
    ctx.strokeStyle = LINE
    ctx.beginPath()
    ctx.moveTo(tx, ry)
    ctx.lineTo(tx + tw, ry)
    ctx.stroke()
    ctx.fillStyle = MUTED
    ctx.fillText(`T-${104 + r}`, tx + 6, ry + 2)
  }
  scratchLabel(ctx, w, h, 'SENSI MTM')
}

/** Top-right — VERDANT MGR: top nav, card grid, green accent */
export function drawBeforeVerdantMgr(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const green = '#15803d'
  box(ctx, 0, 0, w, 32, '#dcfce7', green)
  font(ctx, 8)
  ctx.fillStyle = green
  ;['Home', 'Rooms', 'Schedules', 'Alerts', 'Admin'].forEach((t, i) => {
    ctx.fillText(t, 10 + i * 52, 11)
  })
  ctx.fillStyle = INK
  font(ctx, 10)
  ctx.fillText('VERDANT MGR', w - 92, 10)
  const cols = 2
  const rows = 2
  const pad = 10
  const cw = (w - pad * 3) / cols
  const ch = (h - 48 - pad * 3) / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * (cw + pad)
      const y = 44 + r * (ch + pad)
      box(ctx, x, y, cw, ch, '#f0fdf4', green)
      ctx.fillStyle = green
      ctx.fillRect(x, y, cw, 12)
      ctx.fillStyle = INK
      font(ctx, 8)
      ctx.fillText(`Property ${r * 2 + c + 1}`, x + 6, y + 16)
      ctx.fillStyle = MUTED
      ctx.fillText('72°F · 14 rooms', x + 6, y + 30)
    }
  }
  scratchLabel(ctx, w, h, 'VERDANT MGR')
}

/** Bottom-left — CONNECT+: right sidebar, list view, brown accent */
export function drawBeforeConnectPlus(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const brown = '#92400e'
  box(ctx, 0, 0, w * 0.68, 28, '#fef3c7', brown)
  ctx.fillStyle = INK
  font(ctx, 9)
  ctx.fillText('CONNECT+  ·  Retail Cold Chain', 10, 9)
  const lx = 8
  const ly = 36
  const lw = w * 0.64
  for (let i = 0; i < 7; i++) {
    const rowY = ly + i * 22
    box(ctx, lx, rowY, lw, 18, i % 2 ? '#fffbeb' : '#fff', brown)
    ctx.fillStyle = MUTED
    font(ctx, 8)
    ctx.fillText(`Store #${220 + i} — Case ${i + 1}`, lx + 6, rowY + 5)
  }
  box(ctx, w * 0.7, 0, w * 0.3, h, '#fde68a', brown)
  font(ctx, 8)
  ctx.fillStyle = brown
  ;['Filters', 'Cases', 'Alerts', 'Export'].forEach((t, i) => {
    ctx.fillText(t, w * 0.72, 14 + i * 20)
  })
  scratchLabel(ctx, w, h, 'CONNECT+')
}

/** Bottom-right — TEMPTRAK 6: floating misaligned cards, purple accent */
export function drawBeforeTempTrak6(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const purple = '#6d28d9'
  const cards = [
    { x: 0.06, y: 0.12, w: 0.42, h: 0.28 },
    { x: 0.48, y: 0.08, w: 0.44, h: 0.22 },
    { x: 0.12, y: 0.48, w: 0.5, h: 0.26 },
    { x: 0.52, y: 0.52, w: 0.4, h: 0.32 },
  ]
  ctx.fillStyle = '#f5f3ff'
  ctx.fillRect(0, 0, w, h)
  cards.forEach((c, i) => {
    const x = c.x * w
    const y = c.y * h
    const cw = c.w * w
    const ch = c.h * h
    box(ctx, x, y, cw, ch, '#faf5ff', purple)
    ctx.fillStyle = purple
    font(ctx, 8)
    ctx.fillText(`Widget ${i + 1}`, x + 8, y + 8)
    ctx.fillStyle = MUTED
    ctx.fillText('misaligned', x + 8, y + 22)
  })
  font(ctx, 11)
  ctx.fillStyle = purple
  ctx.fillText('TEMPTRAK 6', w * 0.28, h * 0.82)
  scratchLabel(ctx, w, h, 'TEMPTRAK 6')
}

/** Full-card unified Kelvin system (after) */
export function drawAfterKelvinSystem(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#fafaf8'
  ctx.fillRect(0, 0, w, h)

  box(ctx, 0, 0, w, 36, '#fff', LINE)
  font(ctx, 10)
  ctx.fillStyle = INK
  ctx.fillText('Kelvin', 48, 12)
  ctx.fillStyle = KELVIN
  ctx.fillRect(12, 10, 24, 16)
  font(ctx, 8)
  ctx.fillStyle = '#fff'
  ctx.fillText('K', 19, 13)
  ;['Overview', 'Devices', 'Alarms', 'Reports'].forEach((t, i) => {
    ctx.fillStyle = i === 0 ? KELVIN : MUTED
    ctx.fillText(t, 100 + i * 72, 14)
  })

  const sideW = Math.max(44, w * 0.07)
  box(ctx, 0, 36, sideW, h - 36, '#fff', LINE)
  const icons = ['▣', '◇', '△', '◎', '◆']
  icons.forEach((ic, i) => {
    ctx.fillStyle = i === 0 ? KELVIN : MUTED
    font(ctx, 12)
    ctx.fillText(ic, sideW / 2 - 6, 52 + i * 32)
  })

  const mainX = sideW + 12
  const mainW = w - mainX - 12
  const kpiH = 56
  const kpiW = (mainW - 24) / 4
  for (let i = 0; i < 4; i++) {
    const kx = mainX + i * (kpiW + 8)
    box(ctx, kx, 48, kpiW, kpiH)
    ctx.fillStyle = MUTED
    font(ctx, 8)
    ctx.fillText(['Sites', 'Alarms', 'Compliance', 'Sensors'][i], kx + 8, 56)
    ctx.fillStyle = i === 1 ? KELVIN : INK
    font(ctx, 11)
    ctx.fillText(['128', '3', '99.2%', '1.4k'][i], kx + 8, 72)
  }

  const tableY = 48 + kpiH + 12
  const tableH = h - tableY - 48
  const detailW = mainW * 0.32
  const tableW = mainW - detailW - 8
  box(ctx, mainX, tableY, tableW, tableH)
  ctx.fillStyle = '#eeede8'
  ctx.fillRect(mainX, tableY, tableW, 18)
  font(ctx, 8)
  ctx.fillStyle = INK
  ;['Asset', 'Status', 'Temp', 'Zone'].forEach((c, i) => {
    ctx.fillText(c, mainX + 8 + i * (tableW / 4.5), tableY + 5)
  })
  for (let r = 0; r < 6; r++) {
    const ry = tableY + 22 + r * 16
    ctx.strokeStyle = LINE
    ctx.beginPath()
    ctx.moveTo(mainX, ry)
    ctx.lineTo(mainX + tableW, ry)
    ctx.stroke()
    ctx.fillStyle = MUTED
    ctx.fillText(`Unit ${r + 1}`, mainX + 8, ry + 3)
    if (r === 1) {
      ctx.fillStyle = KELVIN
      ctx.fillText('●', mainX + tableW * 0.28, ry + 3)
    }
  }

  box(ctx, mainX + tableW + 8, tableY, detailW, tableH)
  font(ctx, 8)
  ctx.fillStyle = INK
  ctx.fillText('Detail', mainX + tableW + 16, tableY + 8)
  ctx.fillStyle = MUTED
  ctx.fillText('Unified panel', mainX + tableW + 16, tableY + 24)
  ctx.strokeStyle = KELVIN
  ctx.strokeRect(mainX + tableW + 16, tableY + 40, detailW - 24, 48)

  font(ctx, 9)
  ctx.fillStyle = MUTED
  ctx.textAlign = 'center'
  ctx.fillText('KELVIN DESIGN SYSTEM', w / 2, h - 18)
  ctx.textAlign = 'left'
}

export const BEFORE_DRAWERS = [
  drawBeforeSensiMtm,
  drawBeforeVerdantMgr,
  drawBeforeConnectPlus,
  drawBeforeTempTrak6,
] as const
