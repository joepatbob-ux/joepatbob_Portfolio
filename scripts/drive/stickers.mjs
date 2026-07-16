/**
 * Sticker choreography: on continuous desktop the pile and placed stickers
 * fade on the stage's beat (stage-fx bus); on phones the pile must simply be
 * reachable at the practice chapter. Guards the regressions found while
 * building the dissolve system: pile invisible on mobile, placed sticker
 * outliving the pile, fade-ins popping instead of ramping.
 */
import { newDrivePage, report, sleep, smoothScrollTo } from './harness.mjs'

async function practiceTop(page) {
  return page.evaluate(() => {
    const el = document.querySelector(
      '[data-chapter-id="everything-else-practice"]',
    )
    return Math.round(el.getBoundingClientRect().top + window.scrollY)
  })
}

async function desktopChecks({ browser, baseUrl }, failures) {
  const page = await newDrivePage(browser, { width: 1440, height: 900 })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2500)
  const top = await practiceTop(page)

  // Ride into practice until the pile materializes with the stage.
  let pileVisible = false
  for (let extra = 200; extra <= 1100; extra += 150) {
    await smoothScrollTo(page, top + extra)
    await sleep(700)
    pileVisible = await page.evaluate(
      () =>
        document.querySelector('.sticker-pile-portal')?.dataset.pileVisible ===
        'true',
    )
    if (pileVisible) break
  }
  if (!pileVisible) {
    failures.push('desktop: pile never materialized in the practice chapter')
    await page.close()
    return
  }
  await sleep(600)

  // Place a sticker by dragging off the pile — placement selects it.
  const grab = await page.evaluate(() => {
    const g = document.querySelector('.sticker-pile__grab')
    if (!g) return null
    const r = g.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  if (!grab) {
    failures.push('desktop: pile grab button missing')
    await page.close()
    return
  }
  await page.mouse.move(grab.x, grab.y)
  await page.mouse.down()
  await page.mouse.move(grab.x + 200, grab.y - 120, { steps: 12 })
  await page.mouse.up()
  await sleep(600)

  const placed = await page.evaluate(() => {
    const s = document.querySelector('.sticker-placed')
    return s
      ? {
          selected: s.classList.contains('sticker-placed--selected'),
          op: Number(getComputedStyle(s).opacity),
        }
      : null
  })
  if (!placed) failures.push('desktop: drag-placement produced no sticker')
  else if (placed.op < 0.95)
    failures.push(`desktop: placed sticker opacity ${placed.op} after drop`)

  // Scroll away: the placed sticker must deselect and fade fully out, and
  // the fade must RAMP (at least one intermediate opacity sample).
  await page.evaluate(() => {
    window.__placedOps = []
    const s = document.querySelector('.sticker-placed')
    window.__placedTimer = setInterval(() => {
      if (s) window.__placedOps.push(Number(getComputedStyle(s).opacity))
    }, 50)
  })
  await smoothScrollTo(page, top - 1400)
  await sleep(900)
  const away = await page.evaluate(() => {
    clearInterval(window.__placedTimer)
    const s = document.querySelector('.sticker-placed')
    return {
      ops: window.__placedOps,
      finalOp: s ? Number(getComputedStyle(s).opacity) : null,
      pileOp: Number(
        getComputedStyle(document.querySelector('.sticker-pile-portal'))
          .opacity,
      ),
    }
  })
  if (away.finalOp == null || away.finalOp > 0.05)
    failures.push(`desktop: placed sticker still at ${away.finalOp} after leaving`)
  if (!away.ops.some((o) => o > 0.1 && o < 0.9))
    failures.push('desktop: placed sticker exit had no fade ramp (hard cut)')
  if (away.pileOp > 0.05)
    failures.push(`desktop: pile still at ${away.pileOp} after leaving`)

  // Return: both fade back in. Visibility is a function of scroll position
  // (the stage engages at a geometry line), so scan the same way entry did
  // rather than betting on one landing spot.
  let back = { placedOp: 0, pileOp: 0 }
  for (let extra = 200; extra <= 1100; extra += 150) {
    await smoothScrollTo(page, top + extra)
    await sleep(800)
    back = await page.evaluate(() => ({
      placedOp: Number(
        getComputedStyle(document.querySelector('.sticker-placed')).opacity,
      ),
      pileOp: Number(
        getComputedStyle(document.querySelector('.sticker-pile-portal'))
          .opacity,
      ),
    }))
    if (back.placedOp >= 0.95 && back.pileOp >= 0.95) break
  }
  if (back.placedOp < 0.95)
    failures.push(`desktop: placed sticker only ${back.placedOp} after return`)
  if (back.pileOp < 0.95)
    failures.push(`desktop: pile only ${back.pileOp} after return`)

  await page.close()
}

async function mobileChecks({ browser, baseUrl }, failures) {
  const page = await newDrivePage(browser, {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2000)
  const top = await practiceTop(page)

  // Single programmatic jump — the strictest arrival path (no scroll stream).
  await page.evaluate((y) => window.scrollTo(0, y), top + 100)
  await sleep(900)
  const atPractice = await page.evaluate(() => ({
    wrapOp: Number(
      getComputedStyle(document.querySelector('.sticker-pile-wrap')).opacity,
    ),
    cards: document.querySelectorAll('.sticker-pile__card').length,
  }))
  if (atPractice.wrapOp < 0.95 || atPractice.cards === 0)
    failures.push(
      `mobile: pile not visible at practice (opacity ${atPractice.wrapOp}, ${atPractice.cards} cards)`,
    )

  await page.evaluate(() => window.scrollTo(0, 0))
  await sleep(900)
  const atTop = await page.evaluate(() =>
    Number(getComputedStyle(document.querySelector('.sticker-pile-wrap')).opacity),
  )
  if (atTop > 0.05) failures.push(`mobile: pile still at ${atTop} after leaving`)

  await page.close()
}

export async function run(ctx) {
  const failures = []
  await desktopChecks(ctx, failures)
  await mobileChecks(ctx, failures)
  return report('stickers', failures)
}
