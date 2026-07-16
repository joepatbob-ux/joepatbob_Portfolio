/**
 * Sidebar-nav landings on continuous desktop: every jump must settle with
 * the chapter copy centered in the viewport, the stage artifact present, and
 * NO corrective scroll after settling (the "lurch"). Re-entries must land
 * identically. Guards lib/scroll/chapterSnapScroll.ts's target math and the
 * stage machine's nav mode.
 */
import { newDrivePage, report, sleep } from './harness.mjs'

const CENTER_TOLERANCE_PX = 24

async function clickPill(page, label) {
  return page.evaluate((label) => {
    const el = [...document.querySelectorAll('button, a')].find(
      (b) =>
        (b.textContent || '').trim().toLowerCase() === label.toLowerCase() &&
        b.offsetParent,
    )
    if (!el) return false
    el.click()
    return true
  }, label)
}

async function landing(page, chapterId) {
  await sleep(2200)
  return page.evaluate((chapterId) => {
    const slot = document.querySelector(`[data-chapter-id="${chapterId}"]`)
    const copy = slot?.querySelector('.chapter-slide__copy')
    const stage = slot?.querySelector('.chapter-slide__stage')
    const cr = copy?.getBoundingClientRect()
    return {
      scrollY: Math.round(window.scrollY),
      copyCenterOff: cr
        ? Math.round(cr.top + cr.height / 2 - window.innerHeight / 2)
        : null,
      stageFx: stage?.dataset.stageFx ?? null,
      stageOp: stage ? Number(getComputedStyle(stage).opacity) : null,
    }
  }, chapterId)
}

export async function run({ browser, baseUrl }) {
  const failures = []
  const page = await newDrivePage(browser, { width: 1440, height: 900 })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2500)

  if (!(await clickPill(page, 'everything in between'))) {
    failures.push('section pill "everything in between" not found')
    await page.close()
    return report('nav', failures)
  }
  await sleep(2000)

  const hops = [
    ['coherence', 'everything-else-formation'],
    ['beyond the screen', 'everything-else-practice'],
    ['coherence', 'everything-else-formation'],
    ['beyond the screen', 'everything-else-practice'],
  ]
  const landings = []
  for (const [pill, chapterId] of hops) {
    if (!(await clickPill(page, pill))) {
      failures.push(`pill "${pill}" not found`)
      continue
    }
    const l = await landing(page, chapterId)
    landings.push({ pill, chapterId, ...l })

    if (l.copyCenterOff == null || Math.abs(l.copyCenterOff) > CENTER_TOLERANCE_PX)
      failures.push(`${pill}: copy off-center by ${l.copyCenterOff}px`)
    if (l.stageFx !== 'visible' || (l.stageOp ?? 0) < 0.95)
      failures.push(
        `${pill}: artifact not shown (fx=${l.stageFx}, op=${l.stageOp})`,
      )

    // No corrective scroll after the landing settles.
    const yBefore = l.scrollY
    await sleep(1000)
    const yAfter = await page.evaluate(() => Math.round(window.scrollY))
    if (Math.abs(yAfter - yBefore) > 8)
      failures.push(`${pill}: post-landing scroll moved ${yAfter - yBefore}px`)
  }

  // Re-entries must land where the first entries did.
  for (const chapterId of new Set(hops.map(([, id]) => id))) {
    const ys = landings.filter((l) => l.chapterId === chapterId).map((l) => l.scrollY)
    if (ys.length > 1 && Math.max(...ys) - Math.min(...ys) > 8)
      failures.push(`${chapterId}: inconsistent landings (${ys.join(', ')})`)
  }

  // Practice chapter must have its pile at the landing.
  const pileOp = await page.evaluate(() =>
    Number(
      getComputedStyle(document.querySelector('.sticker-pile-portal')).opacity,
    ),
  )
  if (pileOp < 0.95) failures.push(`practice landing: pile at ${pileOp}`)

  await page.close()
  return report('nav', failures)
}
