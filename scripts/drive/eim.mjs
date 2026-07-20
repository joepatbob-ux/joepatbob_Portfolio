/**
 * EIM dash-art gate: driving into the hardware-eim chapter must inject the
 * split-path dashes AND actually light them (group reaches data-phase="on"
 * with a dash reaching computed opacity) — on continuous desktop and on the
 * top-bar mobile flow. Regression gate for the draw trigger wiring
 * (EimChapter present/drawSettled + the stage-fx bus's undefined-vs-false
 * contract): a mobile regression where the cascade never drew shipped green
 * before this drive existed, because no check watched the dashes.
 *
 * Scrolling and sampling are rAF-paced like choreography.mjs — the stage
 * machine runs on rAF, so wall-clock pacing on a slow runner desynchronizes
 * the drive from what the machine actually saw.
 */
import { newDrivePage, report, sleep } from './harness.mjs'

const VIEWPORTS = [
  { label: 'desktop', viewport: { width: 1440, height: 900 } },
  {
    label: 'mobile',
    viewport: { width: 390, height: 844, isMobile: true, hasTouch: true },
  },
]

const STEP_PX = 16
/* The cascade sweep is ~2.2s + fade; parking must outlast one full draw so
 * the "lit" sample can't race the stagger. */
const PARKED_FRAMES = 240

export async function run({ browser, baseUrl }) {
  const failures = []

  for (const { label, viewport } of VIEWPORTS) {
    const page = await newDrivePage(browser, viewport)
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
    await sleep(2500)

    const result = await page.evaluate(
      async ({ stepPx, parkedFrames }) => {
        const frame = () => new Promise((r) => requestAnimationFrame(r))
        const slot = document.querySelector(
          '.portfolio-chapter-slot[data-chapter-id="hardware-eim"]',
        )
        if (!slot) return { error: 'hardware-eim slot not found' }

        const stats = { dashCount: 0, sawOn: false, sawLit: false }
        const sample = () => {
          const dashes = document.querySelectorAll('.eim-path-art__dash')
          if (dashes.length > stats.dashCount) stats.dashCount = dashes.length
          const group = document.querySelector('.eim-path-art__dashes')
          if (group?.getAttribute('data-phase') === 'on') stats.sawOn = true
          if (
            !stats.sawLit &&
            dashes.length > 0 &&
            Number(getComputedStyle(dashes[0]).opacity) > 0.5
          ) {
            stats.sawLit = true
          }
        }

        // Drive from above the chapter to a parked position inside it, one
        // step per animation frame, sampling on the same frame.
        const slotTop = slot.getBoundingClientRect().top + window.scrollY
        const start = Math.max(0, slotTop - 1200)
        const park = slotTop + 200
        window.scrollTo(0, start)
        await frame()
        let y = start
        while (y < park) {
          y = Math.min(park, y + stepPx)
          window.scrollTo(0, y)
          await frame()
          sample()
        }

        // Hold parked through at least one full draw cycle.
        for (let i = 0; i < parkedFrames; i += 1) {
          await frame()
          sample()
        }

        return stats
      },
      { stepPx: STEP_PX, parkedFrames: PARKED_FRAMES },
    )

    if (result.error) {
      failures.push(`${label}: ${result.error}`)
    } else {
      if (result.dashCount < 1) {
        failures.push(
          `${label}: no .eim-path-art__dash injected (SVG fetch/split failed?)`,
        )
      }
      if (!result.sawOn) {
        failures.push(
          `${label}: dash group never reached data-phase="on" (dashCount=${result.dashCount})`,
        )
      }
      if (!result.sawLit) {
        failures.push(
          `${label}: no dash ever reached lit opacity (dashCount=${result.dashCount}, sawOn=${result.sawOn})`,
        )
      }
    }

    await page.close()
  }

  return report('eim', failures)
}
