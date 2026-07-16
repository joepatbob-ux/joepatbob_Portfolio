/**
 * Shared harness for the behavioral drive suite (scripts/drive/run.mjs).
 * Launches headless Chromium with the same environment fallbacks as
 * scripts/prerender.mjs, and serves dist/ with the real vercel.json headers
 * so the CSP drive exercises the shipped policy.
 */
import { createServer } from 'node:http'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import chromium from '@sparticuz/chromium'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const root = path.join(__dirname, '..', '..')

export async function launchDriveBrowser() {
  const isServerless = Boolean(process.env.VERCEL || process.env.CI)
  if (isServerless) {
    return puppeteer.launch({
      args: await puppeteer.defaultArgs({
        args: chromium.args,
        headless: 'shell',
      }),
      defaultViewport: { width: 1440, height: 900 },
      executablePath: await chromium.executablePath(),
      headless: 'shell',
    })
  }

  const executablePath =
    process.env.DRIVE_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  if (executablePath) {
    return puppeteer.launch({
      executablePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    })
  }

  return puppeteer.launch({
    channel: 'chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })
}

/** New page with deterministic media state (headless forces reduced motion,
 * which would collapse every transition the drives assert on). */
export async function newDrivePage(browser, viewport) {
  const page = await browser.newPage()
  await page.emulateMediaFeatures([
    { name: 'prefers-reduced-motion', value: 'no-preference' },
  ])
  await page.setViewport(viewport)
  return page
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.glb': 'model/gltf-binary',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
}

/** Serve dist/ with vercel.json's global headers (CSP included). */
export function serveDist(port) {
  const dist = join(root, 'dist')
  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'))
  const headers =
    vercel.headers?.find((h) => h.source === '/(.*)')?.headers ?? []

  const server = createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let file = normalize(join(dist, urlPath))
    if (!file.startsWith(dist)) {
      res.writeHead(403).end()
      return
    }
    if (!existsSync(file) || statSync(file).isDirectory()) {
      file = join(dist, 'index.html')
    }
    for (const { key, value } of headers) res.setHeader(key, value)
    res.setHeader(
      'Content-Type',
      MIME[extname(file)] ?? 'application/octet-stream',
    )
    res.writeHead(200)
    res.end(readFileSync(file))
  })

  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => {
      resolve({
        url: `http://127.0.0.1:${port}/`,
        close: () => new Promise((r) => server.close(r)),
      })
    })
  })
}

/** In-page smooth scroll to a document Y (real scroll events per step). */
export async function smoothScrollTo(page, target, stepPx = 60, delayMs = 20) {
  await page.evaluate(
    async ({ target, stepPx, delayMs }) => {
      const dir = Math.sign(target - window.scrollY) || 1
      while (dir > 0 ? window.scrollY < target : window.scrollY > target) {
        window.scrollTo(0, window.scrollY + dir * stepPx)
        await new Promise((r) => setTimeout(r, delayMs))
      }
      window.scrollTo(0, target)
    },
    { target, stepPx, delayMs },
  )
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

/** Uniform result reporting: returns count of failures. */
export function report(name, failures) {
  if (failures.length === 0) {
    console.log(`drive:${name}: PASS`)
    return 0
  }
  for (const f of failures) console.error(`drive:${name}: FAIL — ${f}`)
  return failures.length
}
