/**
 * CSP conformance against the exact headers vercel.json ships (the harness
 * serves them): zero securitypolicyviolation events across a full desktop
 * drive, a phone pass, and the ?fadeTune=1 lazy chunk — plus synthetic
 * probes for the paths headless can't exercise (the Draco decoder's blob
 * worker + WASM, GLTF blob textures).
 */
import { newDrivePage, report, sleep } from './harness.mjs'

async function violationPage(browser, viewport) {
  const page = await newDrivePage(browser, viewport)
  await page.evaluateOnNewDocument(() => {
    window.__cspViolations = []
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__cspViolations.push(
        `${e.violatedDirective} <- ${e.blockedURI || '(inline)'}`,
      )
    })
  })
  return page
}

export async function run({ browser, baseUrl }) {
  const failures = []

  // Desktop: full drive both directions.
  const page = await violationPage(browser, { width: 1440, height: 900 })
  await page.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2500)
  await page.evaluate(async () => {
    const total = document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= total; y += 60) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 16))
    }
    window.scrollTo(0, 0)
  })
  await sleep(1200)

  const probes = await page.evaluate(async () => {
    const out = {}
    try {
      const url = URL.createObjectURL(
        new Blob(['self.postMessage(42)'], { type: 'text/javascript' }),
      )
      out.blobWorker = await new Promise((resolve) => {
        const w = new Worker(url)
        const t = setTimeout(() => resolve('timeout'), 3000)
        w.onmessage = (e) => {
          clearTimeout(t)
          w.terminate()
          resolve(e.data === 42 ? 'ok' : 'bad')
        }
        w.onerror = () => {
          clearTimeout(t)
          resolve('blocked')
        }
      })
    } catch {
      out.blobWorker = 'blocked'
    }
    try {
      await WebAssembly.instantiate(
        new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
      )
      out.wasm = 'ok'
    } catch {
      out.wasm = 'blocked'
    }
    out.jsonLd = document.querySelector('script[type="application/ld+json"]')
      ? 'present'
      : 'missing'
    return out
  })
  if (probes.blobWorker !== 'ok') failures.push(`blob worker: ${probes.blobWorker}`)
  if (probes.wasm !== 'ok') failures.push(`wasm instantiate: ${probes.wasm}`)
  if (probes.jsonLd !== 'present') failures.push('JSON-LD block missing')

  const desktopViolations = await page.evaluate(() => window.__cspViolations)
  for (const v of desktopViolations) failures.push(`desktop violation: ${v}`)
  await page.close()

  // Phone pass.
  const phone = await violationPage(browser, {
    width: 390,
    height: 844,
    isMobile: true,
    hasTouch: true,
  })
  await phone.goto(baseUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await sleep(2000)
  await phone.evaluate(async () => {
    const total = document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= total; y += 120) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 12))
    }
  })
  await sleep(1000)
  for (const v of await phone.evaluate(() => window.__cspViolations))
    failures.push(`phone violation: ${v}`)
  await phone.close()

  // The dial panel's lazy chunk under the policy.
  const ft = await violationPage(browser, { width: 1440, height: 900 })
  await ft.goto(`${baseUrl}?fadeTune=1`, {
    waitUntil: 'networkidle2',
    timeout: 60_000,
  })
  await sleep(2500)
  const ftState = await ft.evaluate(() => ({
    panel: Boolean(document.querySelector('[data-fade-tune-panel]')),
    violations: window.__cspViolations,
  }))
  if (!ftState.panel) failures.push('fadeTune panel failed to mount')
  for (const v of ftState.violations) failures.push(`fadeTune violation: ${v}`)
  await ft.close()

  return report('csp', failures)
}
