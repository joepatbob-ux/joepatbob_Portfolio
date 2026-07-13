import fs from 'node:fs'
import path from 'node:path'

const screenPath = path.resolve('public/images/sensi-lite/screen.svg')
let svg = fs.readFileSync(screenPath, 'utf8')

// Rename bottom-band labels to semantic ids
svg = svg.replace(/id="label-band-a"/g, 'id="label-service"')
svg = svg.replace(/id="label-band-b"/g, 'id="label-battery"')
svg = svg.replace(/id="label-band-c"/g, 'id="label-savings"')

// Wi-Fi row: disconnected + service split from old fan group
svg = svg.replace(/id="icon-x"/g, 'id="icon-disconnected"')

const fanGroupMatch = svg.match(/<g id="icon-fan"[\s\S]*?<\/g>/)
const heatPathMatch = svg.match(
  /<g id="icon-heat"[\s\S]*?(<path class="lcd-seg"[\s\S]*?\/>)[\s\S]*?<\/g>/,
)
const heatPath = heatPathMatch?.[1]

if (fanGroupMatch && heatPath) {
  const fanPaths = [...fanGroupMatch[0].matchAll(/<path class="lcd-seg"[^>]*\/>/g)].map((m) => m[0])
  const serviceGroup = `<g id="icon-service" class="lcd-seg-group" opacity="0.95">\n${fanPaths.join('\n')}\n</g>`
  const fanGroup = `<g id="icon-fan" class="lcd-seg-group" opacity="0.95">\n${heatPath}\n</g>`
  svg = svg.replace(fanGroupMatch[0], `${serviceGroup}\n${fanGroup}`)
}

// Remove duplicate icon-heat group (flame now lives in icon-fan)
svg = svg.replace(/<g id="icon-heat" class="lcd-seg-group" opacity="0.95">[\s\S]*?<\/g>\n?/, '')

// label-wifi-text → label-aux
svg = svg.replace(/id="label-wifi-text"/g, 'id="label-aux"')

// label-aux-top + degree path → label-setup group
const auxTopMatch = svg.match(/<path id="label-aux-top"[\s\S]*?fill-opacity="0.05"\/>/)
const setupAccentMatch = svg.match(
  /<path class="lcd-seg" d="M12.8285 3.73317[\s\S]*?fill-opacity="0.05"\/>/,
)
if (auxTopMatch && setupAccentMatch) {
  const setupGroup = `<g id="label-setup" class="lcd-seg-group" opacity="0.95">\n${auxTopMatch[0].replace(' id="label-aux-top"', '')}\n${setupAccentMatch[0]}\n</g>`
  svg = svg.replace(auxTopMatch[0], '')
  svg = svg.replace(setupAccentMatch[0], setupGroup)
}

// Strip atlas/debug attrs if present
svg = svg.replace(/\s*data-seg-idx="[^"]*"/g, '')
svg = svg.replace(/\s*lcd-seg--atlas-[a-z-]+/g, '')
svg = svg.replace(/class="lcd-seg "/g, 'class="lcd-seg"')

fs.writeFileSync(screenPath, svg)
console.log('Migrated', screenPath)
