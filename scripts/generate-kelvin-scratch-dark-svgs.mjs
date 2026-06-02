/**
 * Build inverted Kelvin scratch SVGs (ticket, cover, reveal) for dark mode.
 * Run: node scripts/generate-kelvin-scratch-dark-svgs.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.join('public', 'images', 'web-apps', 'scratch-ticket')

function expandHex(hex) {
  const h = hex.slice(1)
  if (h.length === 3) {
    return `#${h
      .split('')
      .map((c) => c + c)
      .join('')}`
  }
  return hex.toLowerCase()
}

function invertHex(hex) {
  const full = expandHex(hex)
  const r = 255 - parseInt(full.slice(1, 3), 16)
  const g = 255 - parseInt(full.slice(3, 5), 16)
  const b = 255 - parseInt(full.slice(5, 7), 16)
  return `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`
}

function invertRgbFunction(match) {
  const parts = match.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+))?\s*\)/i,
  )
  if (!parts) return match
  const r = Math.round(255 - Number(parts[1]))
  const g = Math.round(255 - Number(parts[2]))
  const b = Math.round(255 - Number(parts[3]))
  const a = parts[4] !== undefined ? parts[4] : null
  const fn = match.startsWith('rgba') ? 'rgba' : 'rgb'
  if (a !== null) return `${fn}(${r}, ${g}, ${b}, ${a})`
  return `${fn}(${r}, ${g}, ${b})`
}

function swapTicketColors(svg) {
  const token = '__KELVIN_TICKET_SWAP__'
  return svg
    .replace(/#10110f/gi, token)
    .replace(/#f0ead2/gi, '#10110f')
    .replace(new RegExp(token, 'g'), '#f0ead2')
}

function invertSvgColors(svg, { ticketSwap = false } = {}) {
  let out = svg

  if (ticketSwap) {
    return swapTicketColors(svg)
  }

  out = out.replace(/#([0-9a-f]{3}|[0-9a-f]{6})\b/gi, (hex) => invertHex(hex))
  out = out.replace(/rgba?\([^)]+\)/gi, invertRgbFunction)
  return out
}

function writeDark(name, options) {
  const src = path.join(DIR, name)
  const dest = path.join(DIR, name.replace('.svg', '-dark.svg'))
  const svg = fs.readFileSync(src, 'utf8')
  fs.writeFileSync(dest, invertSvgColors(svg, options))
  console.log(`wrote ${dest}`)
}

writeDark('ticket.svg', { ticketSwap: true })
writeDark('cover.svg')
writeDark('reveal.svg')
