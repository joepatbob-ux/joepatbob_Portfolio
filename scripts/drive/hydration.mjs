/**
 * Hydration + layout integrity at four breakpoints: the prerendered page must
 * go live with zero recoverable hydration errors, no collapsed stages, one
 * h1, and no horizontal overflow after a full-page scroll.
 */
import { newDrivePage, report, sleep } from './harness.mjs'

const BREAKPOINTS = [
  [390, 844, true, 'phone'],
  [834, 1112, true, 'tablet'],
  [1440, 900, false, 'laptop'],
  [1920, 1080, false, 'desktop'],
]

export async function run({ browser, baseUrl }) {
  const failures = []

  for (const [width, height, mobile, label] of BREAKPOINTS) {
    const page = await newDrivePage(browser, {
      width,
      height,
      isMobile: mobile,
      hasTouch: mobile,
    })
    const hydrationErrs = []
    page.on('console', (m) => {
      if (m.type() === 'error' && /hydration/i.test(m.text())) {
        hydrationErrs.push(m.text())
      }
    })
    await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
    await sleep(2500)
    await page.evaluate(async () => {
      const total = document.documentElement.scrollHeight
      for (let y = 0; y < total; y += 800) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 50))
      }
    })
    await sleep(1200)

    const d = await page.evaluate(() => {
      const collapsed = [
        ...document.querySelectorAll('.hardware-slideshow .chapter-slide__stage'),
      ].filter((s) => s.getBoundingClientRect().height < 40).length
      return {
        collapsed,
        h1s: document.querySelectorAll('h1').length,
        overflowX:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth + 1,
      }
    })

    if (hydrationErrs.length > 0)
      failures.push(`${label}: ${hydrationErrs.length} hydration error(s)`)
    if (d.collapsed > 0) failures.push(`${label}: ${d.collapsed} collapsed stage(s)`)
    if (d.h1s !== 1) failures.push(`${label}: ${d.h1s} h1 elements (want 1)`)
    if (d.overflowX) failures.push(`${label}: horizontal overflow`)

    await page.close()
  }

  return report('hydration', failures)
}
