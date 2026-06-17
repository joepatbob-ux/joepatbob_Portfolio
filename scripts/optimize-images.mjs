/**
 * Generate -optimized.webp variants alongside raster assets in public/.
 * Run: node scripts/optimize-images.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

function kb(bytes) {
  return (bytes / 1024).toFixed(1)
}

function pct(original, optimized) {
  if (original === 0) return '0.0'
  return (((original - optimized) / original) * 100).toFixed(1)
}

async function statSize(filePath) {
  const { size } = await fs.stat(filePath)
  return size
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function warnSkipMissing(inputPath) {
  if (await pathExists(inputPath)) return false
  console.warn(`warn: skip — missing input ${path.relative(root, inputPath)}`)
  return true
}

async function logResult(inputPath, outputPath, originalBytes, optimizedBytes) {
  const relIn = path.relative(root, inputPath)
  const relOut = path.relative(root, outputPath)
  console.log(`${relIn} (${kb(originalBytes)} KB)`)
  console.log(`  → ${relOut} (${kb(optimizedBytes)} KB, −${pct(originalBytes, optimizedBytes)}%)`)
}

async function writeOutput(inputPath, outputPath, pipeline) {
  if (await warnSkipMissing(inputPath)) return
  const originalBytes = await statSize(inputPath)
  await pipeline.toFile(outputPath)
  const optimizedBytes = await statSize(outputPath)
  await logResult(inputPath, outputPath, originalBytes, optimizedBytes)
}

async function processHero(inputRel, outputRel) {
  const inputPath = path.join(root, inputRel)
  const outputPath = path.join(root, outputRel)
  const pipeline = sharp(inputPath)
    .resize(1600)
    .jpeg({ quality: 75, progressive: true, mozjpeg: true })
  await writeOutput(inputPath, outputPath, pipeline)
}

async function processTouch2(inputDirRel) {
  const inputDir = path.join(root, inputDirRel)
  if (!(await pathExists(inputDir))) {
    console.warn(`warn: skip — missing directory ${path.relative(root, inputDir)}`)
    return
  }
  const entries = await fs.readdir(inputDir)
  const files = entries.filter((name) => /\.jpe?g$/i.test(name)).sort()

  if (files.length === 0) {
    console.warn(`warn: skip — no JPEG inputs in ${path.relative(root, inputDir)}`)
    return
  }

  for (const name of files) {
    const inputPath = path.join(inputDir, name)
    const base = name.replace(/\.jpe?g$/i, '')
    const outputPath = path.join(inputDir, `${base}-optimized.webp`)
    const pipeline = sharp(inputPath)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
    await writeOutput(inputPath, outputPath, pipeline)
  }
}

async function processPhone(inputRel, outputRel) {
  const inputPath = path.join(root, inputRel)
  const outputPath = path.join(root, outputRel)
  const pipeline = sharp(inputPath).webp({ quality: 85 })
  await writeOutput(inputPath, outputPath, pipeline)
}

async function processScreenshots(inputDirRel) {
  const inputDir = path.join(root, inputDirRel)
  if (!(await pathExists(inputDir))) {
    console.warn(`warn: skip — missing directory ${path.relative(root, inputDir)}`)
    return
  }
  const entries = await fs.readdir(inputDir)
  const files = entries.filter((name) => /\.png$/i.test(name)).sort()

  if (files.length === 0) {
    console.warn(`warn: skip — no PNG inputs in ${path.relative(root, inputDir)}`)
    return
  }

  for (const name of files) {
    const inputPath = path.join(inputDir, name)
    const base = name.replace(/\.png$/i, '')
    const outputPath = path.join(inputDir, `${base}-optimized.webp`)
    const pipeline = sharp(inputPath).webp({ quality: 85 })
    await writeOutput(inputPath, outputPath, pipeline)
  }
}

async function runGroupA() {
  console.log('Group A — Hero portraits (1600px wide, mozjpeg quality 75)')
  await processHero(
    'public/images/PortraitLight_MG_3496.jpg',
    'public/images/PortraitLight_MG_3496-optimized.jpg',
  )
  await processHero(
    'public/images/PortraitDark_MG_3490.jpg',
    'public/images/PortraitDark_MG_3490-optimized.jpg',
  )
}

async function main() {
  const group = process.argv[2]?.replace(/^--group=/, '') ?? 'all'
  console.log('Optimizing images with sharp…\n')

  if (group === 'a' || group === 'all') {
    await runGroupA()
  }

  if (group === 'b' || group === 'all') {
    console.log('\nGroup B — Touch 2 carousel (1200px longest side, quality 82)')
    await processTouch2('public/images/Touch 2')
  }

  if (group === 'c' || group === 'all') {
    console.log('\nGroup C — Phone assets (quality 85, no resize)')
    const phones = [
      ['public/Phones/cropped/iphoneFront.png', 'public/Phones/cropped/iphoneFront-optimized.webp'],
      ['public/Phones/cropped/iphoneBack.png', 'public/Phones/cropped/iphoneBack-optimized.webp'],
      ['public/Phones/cropped/pixelFront.png', 'public/Phones/cropped/pixelFront-optimized.webp'],
      ['public/Phones/cropped/pixelBack.png', 'public/Phones/cropped/pixelBack-optimized.webp'],
    ]
    for (const [inputRel, outputRel] of phones) {
      await processPhone(inputRel, outputRel)
    }
  }

  if (group === 'd' || group === 'all') {
    console.log('\nGroup D — iOS screenshots (quality 85, no resize)')
    await processScreenshots('public/Screens/iOS')
  }

  console.log('\nDone.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
