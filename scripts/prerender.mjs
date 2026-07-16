/**
 * Post-build prerender — desktop 1440px snapshot of / into dist/index.html.
 * Runs after vite build; uses puppeteer-core + @sparticuz/chromium on CI/Vercel.
 */
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
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

/** Copy markers that must be in the hydrated snapshot (keep in sync with live content). */
const ANCHORS = ['connected experiences', '12,608,066', 'thermostat', 'Kelvin']

function missingAnchors(html, needles) {
  const lower = html.toLowerCase()
  return needles.filter((n) => !lower.includes(n.toLowerCase()))
}

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

  const executablePath =
    process.env.PRERENDER_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH

  if (executablePath) {
    console.log(`[prerender] Launching browser at ${executablePath}…`)
    return puppeteer.launch({
      executablePath,
      headless: true,
      defaultViewport: VIEWPORT,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
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
      'Local prerender requires Google Chrome installed (channel: "chrome") ' +
        'or PRERENDER_EXECUTABLE_PATH/PUPPETEER_EXECUTABLE_PATH pointing at a ' +
        'Chromium binary. Or run the build on Vercel/CI with @sparticuz/chromium. ' +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err },
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
  // detached puts npx AND the vite grandchild in their own process group so
  // killPreview can take out both — SIGTERM to npx alone orphans the actual
  // server, which then squats the port for the next build and holds this
  // process's stdio pipes open (the build used to hang right after "Wrote").
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', 'preview', '--port', String(port), '--host', '127.0.0.1', '--strictPort'],
    {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, PRERENDER: '1' },
      detached: process.platform !== 'win32',
    },
  )

  const rlOut = createInterface({ input: child.stdout })
  const rlErr = createInterface({ input: child.stderr })
  rlOut.on('line', (line) => console.log(`[preview] ${line}`))
  rlErr.on('line', (line) => console.error(`[preview] ${line}`))

  return child
}

async function main() {
  console.log('[prerender] Starting vite preview…')
  const preview = spawnPreview()

  const killPreview = () => {
    if (preview.killed) return
    if (process.platform === 'win32') {
      preview.kill('SIGTERM')
      return
    }
    try {
      process.kill(-preview.pid, 'SIGTERM')
    } catch {
      preview.kill('SIGTERM')
    }
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

      console.log('[prerender] Waiting for anchor text…')
      await page.evaluate(() => {
        window.scrollTo(0, document.documentElement.scrollHeight)
      })
      await page.waitForFunction(
        (needles) => {
          const text = document.documentElement?.innerHTML ?? ''
          const lower = text.toLowerCase()
          return needles.every((n) => lower.includes(n.toLowerCase()))
        },
        { timeout: 90_000, polling: 200 },
        ANCHORS,
      ).catch(async (err) => {
        const html = await page.content()
        const missing = missingAnchors(html, ANCHORS)
        throw new Error(
          `${err instanceof Error ? err.message : String(err)} — missing anchors: ${missing.join(', ') || '(none)'}`,
        )
      })

      console.log('[prerender] Scrolling back to hero for snapshot…')
      // Vite injects <link rel="modulepreload"> for every lazy chunk the crawl
      // touched. Keeping them in the snapshot would make production eagerly
      // fetch the whole 3D stack — strip everything the built HTML didn't ship.
      const builtHtml = readFileSync(path.join(root, 'dist/index.html'), 'utf8')
      const shippedPreloads = [
        ...builtHtml.matchAll(/<link rel="modulepreload"[^>]*href="([^"]+)"/g),
      ].map((m) => m[1])
      await page.evaluate(async (keepPreloads) => {
        window.scrollTo(0, 0)
        await new Promise((resolve) => {
          requestAnimationFrame(() => requestAnimationFrame(resolve))
        })
        document
          .querySelectorAll(
            '.sticker-pile-portal, .sticker-layer, .sticker-layer__drag',
          )
          .forEach((node) => node.remove())
        const keep = new Set(keepPreloads)
        document
          .querySelectorAll('link[rel="modulepreload"]')
          .forEach((link) => {
            const href = link.getAttribute('href')
            if (!href || !keep.has(href)) link.remove()
          })
      }, shippedPreloads)
      await page.waitForFunction(() => window.scrollY <= 4, { timeout: 10_000 })

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

main().then(
  () => process.exit(0),
  (err) => {
    console.error('[prerender] Failed:', err)
    process.exit(1)
  },
)
