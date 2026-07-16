/**
 * Continuous-desktop stage choreography: a slow full-page drive in BOTH
 * directions must give every stage chapter a fully-opaque artifact that
 * enters at (or converges onto) the viewport-center lock and holds there.
 * This is the regression gate for the center-locked dissolve system
 * (lib/scroll/applyContinuousStageAlign.ts).
 */
import { newDrivePage, report, sleep } from './harness.mjs'

const VIEWPORT = { width: 1440, height: 900 }
const CENTER = VIEWPORT.height / 2

export async function run({ browser, baseUrl }) {
  const failures = []
  const page = await newDrivePage(browser, VIEWPORT)
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2500)

  await page.evaluate(() => {
    window.__stats = {}
    // Measure what the machine centers: the align box, not the stage column.
    const stages = [
      ...document.querySelectorAll(
        '.portfolio-chapter-slot--fill .chapter-slide__stage',
      ),
    ]
      .map((stage) => ({
        stage,
        align: stage.querySelector('[data-chapter-stage-align]'),
        id: stage.closest('[data-chapter-id]')?.dataset.chapterId ?? '?',
      }))
      .filter((s) => s.align)
    window.__statsTimer = setInterval(() => {
      for (const { stage, align, id } of stages) {
        if (!stage.dataset.stageFx) continue
        const op = Number(getComputedStyle(stage).opacity)
        const r = align.getBoundingClientRect()
        const cY = Math.round(r.top + r.height / 2)
        const st = (window.__stats[id] ??= {
          maxOp: 0,
          entryCY: null,
          centeredTicks: 0,
        })
        if (st.entryCY == null && stage.dataset.stageFx === 'visible')
          st.entryCY = cY
        if (op > st.maxOp) st.maxOp = op
        if (op > 0.5 && Math.abs(cY - window.innerHeight / 2) <= 8)
          st.centeredTicks += 1
      }
    }, 50)
  })

  const drive = (dir) =>
    page.evaluate(async (dir) => {
      const total = document.documentElement.scrollHeight - window.innerHeight
      if (dir > 0) {
        while (window.scrollY < total - 2) {
          window.scrollTo(0, Math.min(total, window.scrollY + 22))
          await new Promise((r) => setTimeout(r, 24))
        }
      } else {
        while (window.scrollY > 2) {
          window.scrollTo(0, Math.max(0, window.scrollY - 22))
          await new Promise((r) => setTimeout(r, 24))
        }
      }
    }, dir)

  const expected = await page.evaluate(() =>
    [...document.querySelectorAll('.portfolio-chapter-slot--fill.hardware-slideshow')]
      .filter(
        (el) =>
          el.querySelector('.chapter-slide__stage') &&
          !el.querySelector('.flow-chapter-slide__stage--empty'),
      )
      .map((el) => el.dataset.chapterId),
  )
  if (expected.length === 0) {
    failures.push('no stage chapters found — selector drift?')
  }

  for (const [dir, label] of [
    [1, 'down'],
    [-1, 'up'],
  ]) {
    await page.evaluate(() => {
      window.__stats = {}
    })
    await drive(dir)
    await sleep(1500)
    const stats = await page.evaluate(() => window.__stats)
    for (const id of expected) {
      const s = stats[id]
      const ok =
        s &&
        s.maxOp >= 0.95 &&
        s.entryCY != null &&
        Math.abs(s.entryCY - CENTER) <= 64 &&
        s.centeredTicks >= 3
      if (!ok) {
        failures.push(
          `[${label}] ${id}: ${
            s
              ? `maxOp=${s.maxOp.toFixed(2)} entryCY=${s.entryCY} centeredTicks=${s.centeredTicks}`
              : 'never appeared'
          }`,
        )
      }
    }
  }

  await page.evaluate(() => clearInterval(window.__statsTimer))
  await page.close()
  return report('choreography', failures)
}
