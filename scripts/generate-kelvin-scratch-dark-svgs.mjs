/**
 * Dark-mode Kelvin scratch SVGs — aligned with site + Formation LEGO theming:
 * dark page → white base (hero canvas / board), dark ink on that base.
 *
 * Run: node scripts/generate-kelvin-scratch-dark-svgs.mjs
 */
import fs from 'node:fs'
import path from 'node:path'

const DIR = path.join('public', 'images', 'web-apps', 'scratch-ticket')

/** Matches HERO_CANVAS_BG.light / white Lego board on dark theme. */
const TICKET_FRAME_DARK = '#f4f4f4'
/** Ticket line art + site ink on the white base. */
const TICKET_ART_DARK = '#10110f'

/** Dark frame + dark art on white (inverse of light ticket, white not cream). */
function ticketDarkFromLight(svg) {
  const frameToken = '__KELVIN_TICKET_FRAME__'
  return svg
    .replace(/#10110f/gi, frameToken)
    .replace(/#f0ead2/gi, TICKET_ART_DARK)
    .replace(new RegExp(frameToken, 'g'), TICKET_FRAME_DARK)
}

function writeDarkFromLight(name, transform = (s) => s) {
  const src = path.join(DIR, name)
  const dest = path.join(DIR, name.replace('.svg', '-dark.svg'))
  const svg = fs.readFileSync(src, 'utf8')
  fs.writeFileSync(dest, transform(svg))
  console.log(`wrote ${dest}`)
}

writeDarkFromLight('ticket.svg', ticketDarkFromLight)
// Scratch panel + reveal: same as light (dark foil panel, light DS preview).
writeDarkFromLight('cover.svg')
writeDarkFromLight('reveal.svg')
