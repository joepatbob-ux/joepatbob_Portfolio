export type RasterSource = {
  canvas: HTMLCanvasElement
  width: number
  height: number
}

const cache = new Map<string, Promise<RasterSource | null>>()

function loadImageSource(src: string): Promise<RasterSource | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }
      ctx.drawImage(image, 0, 0)
      resolve({
        canvas,
        width: image.naturalWidth,
        height: image.naturalHeight,
      })
    }
    image.onerror = () => resolve(null)
    image.src = src
  })
}

async function loadPdfSource(src: string): Promise<RasterSource | null> {
  try {
    const [pdfjs, worker] = await Promise.all([
      import('pdfjs-dist'),
      import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
    ])
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default

    const task = pdfjs.getDocument(src)
    const pdf = await task.promise
    const page = await pdf.getPage(1)
    const base = page.getViewport({ scale: 1 })
    const scale = Math.max(2, 2044 / base.width)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.round(viewport.width)
    canvas.height = Math.round(viewport.height)
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    await page.render({ canvasContext: ctx, viewport }).promise
    return { canvas, width: canvas.width, height: canvas.height }
  } catch {
    return null
  }
}

async function loadRasterSourceInner(src: string): Promise<RasterSource | null> {
  if (src.toLowerCase().endsWith('.pdf')) {
    const fromPdf = await loadPdfSource(src)
    if (fromPdf) return fromPdf
    return loadImageSource(src.replace(/\.pdf$/i, '.png'))
  }
  return loadImageSource(src)
}

/** Load a board photo from PNG or vector PDF (page 1) for atomize sampling. */
export function loadRasterSource(src: string): Promise<RasterSource | null> {
  const cached = cache.get(src)
  if (cached) return cached

  const pending = loadRasterSourceInner(src)
  cache.set(src, pending)
  return pending
}

export function preloadRasterSource(src: string): void {
  void loadRasterSource(src)
}
