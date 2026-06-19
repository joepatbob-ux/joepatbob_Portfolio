/**
 * One-time image optimization migration (completed).
 *
 * Original raster sources were deleted after generating the -optimized.*
 * assets now referenced by the app. Re-run only after adding fresh source files
 * under the paths listed in SOURCE_GROUPS below.
 *
 * Run: node scripts/optimize-images.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

/** Legacy inputs — absent after migration; outputs are source of truth in public/. */
const SOURCE_GROUPS = {
  a: {
    label: 'Group A — Hero portraits (1600px wide, mozjpeg quality 75)',
    inputs: [
      'public/images/PortraitLight_MG_3496.jpg',
      'public/images/PortraitDark_MG_3490.jpg',
    ],
    outputs: [
      'public/images/PortraitLight_MG_3496-optimized.jpg',
      'public/images/PortraitDark_MG_3490-optimized.jpg',
    ],
  },
  b: {
    label: 'Group B — Touch 2 carousel (1200px longest side, quality 82)',
    inputDir: 'public/images/Touch 2',
    inputPattern: /\.jpe?g$/i,
    outputSuffix: '-optimized.webp',
  },
  c: {
    label: 'Group C — Phone assets (quality 85, no resize)',
    pairs: [
      ['public/Phones/cropped/iphoneFront.png', 'public/Phones/cropped/iphoneFront-optimized.webp'],
      ['public/Phones/cropped/iphoneBack.png', 'public/Phones/cropped/iphoneBack-optimized.webp'],
      ['public/Phones/cropped/pixelFront.png', 'public/Phones/cropped/pixelFront-optimized.webp'],
      ['public/Phones/cropped/pixelBack.png', 'public/Phones/cropped/pixelBack-optimized.webp'],
    ],
  },
  d: {
    label: 'Group D — iOS screenshots (quality 85, no resize)',
    inputDir: 'public/Screens/iOS',
    inputPattern: /\.(png|jpe?g)$/i,
    outputSuffix: '-optimized.webp',
  },
  e: {
    label: 'Group E — Android screenshots (quality 85, no resize)',
    inputDir: 'public/Screens/Android',
    inputPattern: /\.jpe?g$/i,
    outputSuffix: '-optimized.webp',
  },
}

function kb(bytes) {
  return (bytes / 1024).toFixed(1)
}

function pct(original, optimized) {
  if (original === 0) return '0.0'
  return (((original - optimized) / original) * 100).toFixed(1)
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function statSize(filePath) {
  const { size } = await fs.stat(filePath)
  return size
}

async function logResult(inputPath, outputPath, originalBytes, optimizedBytes) {
  const relIn = path.relative(root, inputPath)
  const relOut = path.relative(root, outputPath)
  console.log(`${relIn} (${kb(originalBytes)} KB)`)
  console.log(`  → ${relOut} (${kb(optimizedBytes)} KB, −${pct(originalBytes, optimizedBytes)}%)`)
}

async function writeOutput(inputPath, outputPath, pipeline) {
  const originalBytes = await statSize(inputPath)
  await pipeline.toFile(outputPath)
  const optimizedBytes = await statSize(outputPath)
  await logResult(inputPath, outputPath, originalBytes, optimizedBytes)
  return true
}

async function processHero(inputRel, outputRel) {
  const inputPath = path.join(root, inputRel)
  const outputPath = path.join(root, outputRel)
  const pipeline = sharp(inputPath)
    .resize(1600)
    .jpeg({ quality: 75, progressive: true, mozjpeg: true })
  return writeOutput(inputPath, outputPath, pipeline)
}

async function processTouch2(inputDirRel) {
  const inputDir = path.join(root, inputDirRel)
  if (!(await pathExists(inputDir))) return 0

  const entries = await fs.readdir(inputDir)
  const files = entries.filter((name) => /\.jpe?g$/i.test(name)).sort()
  let processed = 0

  for (const name of files) {
    const inputPath = path.join(inputDir, name)
    const base = name.replace(/\.jpe?g$/i, '')
    const outputPath = path.join(inputDir, `${base}-optimized.webp`)
    const pipeline = sharp(inputPath)
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
    if (await writeOutput(inputPath, outputPath, pipeline)) processed += 1
  }

  return processed
}

async function processPhone(inputRel, outputRel) {
  const inputPath = path.join(root, inputRel)
  const outputPath = path.join(root, outputRel)
  const pipeline = sharp(inputPath).webp({ quality: 85 })
  return writeOutput(inputPath, outputPath, pipeline)
}

async function processScreenshots(inputDirRel, inputPattern) {
  const inputDir = path.join(root, inputDirRel)
  if (!(await pathExists(inputDir))) return 0

  const entries = await fs.readdir(inputDir)
  const files = entries.filter((name) => inputPattern.test(name)).sort()
  let processed = 0

  for (const name of files) {
    const inputPath = path.join(inputDir, name)
    const base = name.replace(/\.(png|jpe?g)$/i, '')
    const outputPath = path.join(inputDir, `${base}-optimized.webp`)
    const pipeline = sharp(inputPath).webp({ quality: 85 })
    if (await writeOutput(inputPath, outputPath, pipeline)) processed += 1
  }

  return processed
}

async function countGroupAInputs() {
  let count = 0
  for (const inputRel of SOURCE_GROUPS.a.inputs) {
    if (await pathExists(path.join(root, inputRel))) count += 1
  }
  return count
}

async function countGroupBInputs() {
  const inputDir = path.join(root, SOURCE_GROUPS.b.inputDir)
  if (!(await pathExists(inputDir))) return 0
  const entries = await fs.readdir(inputDir)
  return entries.filter((name) => SOURCE_GROUPS.b.inputPattern.test(name)).length
}

async function countGroupCInputs() {
  let count = 0
  for (const [inputRel] of SOURCE_GROUPS.c.pairs) {
    if (await pathExists(path.join(root, inputRel))) count += 1
  }
  return count
}

async function countScreenshotInputs(groupKey) {
  const { inputDir, inputPattern } = SOURCE_GROUPS[groupKey]
  const dir = path.join(root, inputDir)
  if (!(await pathExists(dir))) return 0
  const entries = await fs.readdir(dir)
  return entries.filter((name) => inputPattern.test(name)).length
}

async function runGroupA() {
  console.log(SOURCE_GROUPS.a.label)
  let processed = 0
  for (let i = 0; i < SOURCE_GROUPS.a.inputs.length; i += 1) {
    const inputRel = SOURCE_GROUPS.a.inputs[i]
    const outputRel = SOURCE_GROUPS.a.outputs[i]
    if (!(await pathExists(path.join(root, inputRel)))) continue
    if (await processHero(inputRel, outputRel)) processed += 1
  }
  return processed
}

async function main() {
  const group = process.argv[2]?.replace(/^--group=/, '') ?? 'all'
  const groups =
    group === 'all' ? ['a', 'b', 'c', 'd', 'e'] : [group]

  const inputCounts = {
    a: groups.includes('a') ? await countGroupAInputs() : 0,
    b: groups.includes('b') ? await countGroupBInputs() : 0,
    c: groups.includes('c') ? await countGroupCInputs() : 0,
    d: groups.includes('d') ? await countScreenshotInputs('d') : 0,
    e: groups.includes('e') ? await countScreenshotInputs('e') : 0,
  }

  const totalInputs =
    inputCounts.a + inputCounts.b + inputCounts.c + inputCounts.d + inputCounts.e

  if (totalInputs === 0) {
    console.log('Assets already optimized — nothing to do')
    console.log(
      'Current outputs (source of truth): hero -optimized.jpg, Touch 2 / Phones / Screens -optimized.webp',
    )
    return
  }

  console.log('Optimizing images with sharp…\n')
  let processed = 0

  if (groups.includes('a') && inputCounts.a > 0) {
    processed += await runGroupA()
  }

  if (groups.includes('b') && inputCounts.b > 0) {
    console.log(`\n${SOURCE_GROUPS.b.label}`)
    processed += await processTouch2(SOURCE_GROUPS.b.inputDir)
  }

  if (groups.includes('c') && inputCounts.c > 0) {
    console.log(`\n${SOURCE_GROUPS.c.label}`)
    for (const [inputRel, outputRel] of SOURCE_GROUPS.c.pairs) {
      if (!(await pathExists(path.join(root, inputRel)))) continue
      if (await processPhone(inputRel, outputRel)) processed += 1
    }
  }

  if (groups.includes('d') && inputCounts.d > 0) {
    console.log(`\n${SOURCE_GROUPS.d.label}`)
    processed += await processScreenshots(
      SOURCE_GROUPS.d.inputDir,
      SOURCE_GROUPS.d.inputPattern,
    )
  }

  if (groups.includes('e') && inputCounts.e > 0) {
    console.log(`\n${SOURCE_GROUPS.e.label}`)
    processed += await processScreenshots(
      SOURCE_GROUPS.e.inputDir,
      SOURCE_GROUPS.e.inputPattern,
    )
  }

  if (processed === 0) {
    console.log('\nAssets already optimized — nothing to do')
  } else {
    console.log(`\nDone. Processed ${processed} file(s).`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
