/**
 * Continuous-desktop stage choreography: a slow full-page drive in BOTH
 * directions must give every stage chapter a fully-opaque artifact that
 * enters at (or converges onto) the viewport-center lock and holds there.
 * This is the regression gate for the center-locked dissolve system
 * (lib/scroll/applyContinuousStageAlign.ts).
 *
 * The drive scrolls and samples on requestAnimationFrame — NOT wall-clock
 * timers. The stage machine itself runs on rAF, so timer-paced scrolling on
 * a slow runner (CI's software rendering) makes the machine see huge scroll
 * jumps between its frames while a wall-clock sampler starves: artifacts
 * that centered perfectly get recorded as "never held the lock". Pacing
 * both on rAF keeps drive, machine, and sampler in lockstep at whatever
 * frame rate the environment can actually deliver.
 */
import { newDrivePage, report, sleep } from './harness.mjs'

const VIEWPORT = { width: 1440, height: 900 }
const CENTER = VIEWPORT.height / 2
/* Paced to the owner-tuned dissolve (560ms fade + 460ms handoff pause):
 * artifacts need ~1s to materialize, so the drive scrolls at a reading pace
 * (~8px/frame ≈ 480px/s) rather than the old 16px/frame sprint. */
const STEP_PX = 8

export async function run({ browser, baseUrl }) {
  const failures = []
  const page = await newDrivePage(browser, VIEWPORT)
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2500)

  // Scroll one step per animation frame and sample the stages on the same
  // frame. Measures what the machine centers: the align box, not the stage
  // column. centeredFrames counts frames the machine REPORTS the artifact
  // shown (stageFx visible) with the align box on the lock — state-machine
  // truth; computed opacity is compositor timing and is asserted separately
  // via maxOp.
  const drive = (dir) =>
    page.evaluate(
      async ({ dir, stepPx }) => {
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
        window.__stats = {}
        const sample = () => {
          for (const { stage, align, id } of stages) {
            if (!stage.dataset.stageFx) continue
            const op = Number(getComputedStyle(stage).opacity)
            const r = align.getBoundingClientRect()
            const cY = Math.round(r.top + r.height / 2)
            const st = (window.__stats[id] ??= {
              maxOp: 0,
              entryCY: null,
              centeredFrames: 0,
            })
            const shown = stage.dataset.stageFx === 'visible'
            if (st.entryCY == null && shown) st.entryCY = cY
            if (op > st.maxOp) st.maxOp = op
            if (shown && Math.abs(cY - window.innerHeight / 2) <= 8)
              st.centeredFrames += 1
          }
        }
        const frame = () => new Promise((r) => requestAnimationFrame(r))
        const total = document.documentElement.scrollHeight - window.innerHeight
        const done = () =>
          dir > 0 ? window.scrollY >= total - 2 : window.scrollY <= 2
        while (!done()) {
          window.scrollTo(
            0,
            Math.max(0, Math.min(total, window.scrollY + dir * stepPx)),
          )
          await frame()
          sample()
        }
        // Let the last fade settle, still sampling.
        for (let i = 0; i < 90; i += 1) {
          await frame()
          sample()
        }
        return window.__stats
      },
      { dir, stepPx: STEP_PX },
    )

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
    const stats = await drive(dir)
    for (const id of expected) {
      const s = stats[id]
      const ok =
        s &&
        s.maxOp >= 0.95 &&
        s.entryCY != null &&
        Math.abs(s.entryCY - CENTER) <= 64 &&
        s.centeredFrames >= 3
      if (!ok) {
        failures.push(
          `[${label}] ${id}: ${
            s
              ? `maxOp=${s.maxOp.toFixed(2)} entryCY=${s.entryCY} centeredFrames=${s.centeredFrames}`
              : 'never appeared'
          }`,
        )
      }
    }
  }

  await page.close()
  return report('choreography', failures)
}
