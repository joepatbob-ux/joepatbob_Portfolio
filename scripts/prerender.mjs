/**
 * Post-build prerender — desktop 1440px snapshot of / into dist/index.html.
 * Runs after vite build; uses puppeteer-core + @sparticuz/chromium on CI/Vercel.
 */
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const port = Number(process.env.PRERENDER_PORT ?? 3456)
const url = `http://127.0.0.1:${port}/`
const snapshotUrl = `${url}?prerender=1`
const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 1 }

const ANCHORS = ['complex systems', '12,608,066', 'thermostat', 'Kelvin']

async function launchBrowser() {
  const isServerlessBuild = Boolean(process.env.VERCEL || process.env.CI)

  if (isServerlessBuild) {
    console.log('[prerender] Launching @sparticuz/chromium (Vercel/CI)…')
    // Keep Sparticuz default graphics (SwiftShader). setGraphicsMode = false adds
    // --disable-webgl, which prevents R3F stages from mounting and stalls anchors.
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({
        args: chromium.args,
        headless: 'shell',
      }),
      defaultViewport: VIEWPORT,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    })
  }

  console.log('[prerender] Launching local Chrome (channel: chrome)…')
  try {
    return await puppeteer.launch({
      channel: 'chrome',
      headless: true,
      defaultViewport: VIEWPORT,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  } catch (err) {
    throw new Error(
      'Local prerender requires Google Chrome installed (channel: "chrome"). ' +
        'Install Chrome or run the build on Vercel/CI with @sparticuz/chromium. ' +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
}
function waitForUrl(target, timeoutMs = 60_000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    const tick = async () => {
      try {
        const res = await fetch(target, { redirect: 'follow' })
        if (res.ok) {
          resolve(undefined)
          return
        }
      } catch {
        /* retry */
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Preview server did not start at ${target}`))
        return
      }
      setTimeout(tick, 250)
    }
    tick()
  })
}

function spawnPreview() {
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1', '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PRERENDER: '1' },
    },
  )

  const rlOut = createInterface({ input: child.stdout })
  const rlErr = createInterface({ input: child.stderr })
  rlOut.on('line', (line) => console.log(`[preview] ${line}`))
  rlErr.on('line', (line) => console.error(`[preview] ${line}`))

  return child
}

async function scrollToBottom(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let y = 0
      const step = () => {
        const max = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
        )
        if (y >= max) {
          window.scrollTo(0, 0)
          resolve(undefined)
          return
        }
        y += Math.max(window.innerHeight * 0.75, 400)
        window.scrollTo(0, y)
        window.setTimeout(step, 200)
      }
      step()
    })
  })
}

async function main() {
  console.log('[prerender] Starting vite preview…')
  const preview = spawnPreview()

  const killPreview = () => {
    if (!preview.killed) preview.kill('SIGTERM')
  }
  process.on('exit', killPreview)
  process.on('SIGINT', () => {
    killPreview()
    process.exit(1)
  })

  try {
    await waitForUrl(url)
    console.log(`[prerender] Preview ready at ${url}`)

    const browser = await launchBrowser()

    try {
      const page = await browser.newPage()
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 })
      await page.emulateMediaFeatures([
        { name: 'prefers-color-scheme', value: 'light' },
      ])

      page.on('console', (msg) => {
        const type = msg.type()
        if (type === 'warning' || type === 'error') {
          console.log(`[prerender:console:${type}] ${msg.text()}`)
        }
      })
      page.on('pageerror', (err) => {
        console.error(`[prerender:pageerror] ${err.message}`)
      })

      await page.evaluateOnNewDocument(() => {
        window.__PRERENDER = true
      })

      console.log('[prerender] Navigating…')
      await page.goto(snapshotUrl, { waitUntil: 'networkidle0', timeout: 120_000 })

      console.log('[prerender] Scrolling to load deferred content…')
      await scrollToBottom(page)
      await new Promise((r) => setTimeout(r, 500))
      await scrollToBottom(page)

      console.log('[prerender] Waiting for anchor text…')
      await page.waitForFunction(
        (needles) => {
          const text = document.documentElement?.innerHTML ?? ''
          const lower = text.toLowerCase()
          return needles.every((n) => lower.includes(n.toLowerCase()))
        },
        { timeout: 90_000 },
        ANCHORS,
      )

      const html = await page.content()
      const outPath = path.join(root, 'dist/index.html')
      writeFileSync(outPath, html, 'utf8')
      console.log(`[prerender] Wrote ${outPath} (${html.length} bytes)`)
    } finally {
      await browser.close()
    }
  } finally {
    killPreview()
  }
}

main().catch((err) => {
  console.error('[prerender] Failed:', err)
  process.exit(1)
})
