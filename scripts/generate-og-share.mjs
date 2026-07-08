/**
 * Render scripts/og-share-template.html → public/og-share.jpg (1200×630).
 * Run: npm run generate:og-share
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const templatePath = path.join(__dirname, 'og-share-template.html')
const outputPath = path.join(root, 'public', 'og-share.jpg')
const WIDTH = 1200
const HEIGHT = 630

async function launchBrowser() {
  const executablePath =
    process.env.PRERENDER_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH

  if (executablePath) {
    return puppeteer.launch({
      executablePath,
      headless: true,
      defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
  }

  return puppeteer.launch({
    channel: 'chrome',
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
}

async function main() {
  const browser = await launchBrowser()
  try {
    const page = await browser.newPage()
    await page.setViewport({
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 1,
    })
    await page.goto(pathToFileURL(templatePath).href, { waitUntil: 'networkidle0' })
    await page.evaluate(async () => {
      if (document.fonts?.ready) await document.fonts.ready
    })
    const jpeg = await page.screenshot({
      type: 'jpeg',
      quality: 88,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    })
    writeFileSync(outputPath, jpeg)
    console.log(`[generate-og-share] wrote ${outputPath} (${WIDTH}×${HEIGHT})`)
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error('[generate-og-share]', err instanceof Error ? err.message : err)
  process.exit(1)
})
