import { isPrerenderSnapshot } from '@/lib/isPrerenderSnapshot'

/**
 * Warm the lazy chunks and heavy binary assets after first paint, so scrolling
 * into a section finds them in cache instead of fetching on approach.
 * Everything here is best-effort and low priority — failures are ignored.
 */

/** Model/decoder files the 3D stages request first. */
const PREFETCH_ASSETS = [
  '/draco/draco_wasm_wrapper.js',
  '/draco/draco_decoder.wasm',
  '/models/iphone16-pro.glb',
]

let started = false

function onIdle(fn: () => void, timeout: number): void {
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => fn(), { timeout })
  } else {
    window.setTimeout(fn, timeout)
  }
}

function prefetchAsset(href: string): void {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'fetch'
  link.crossOrigin = 'anonymous'
  link.href = href
  document.head.appendChild(link)
}

function warmLazyChunks(): void {
  // Section chapters (in scroll order) plus the stage chunks they pull in.
  // import() also modulepreloads shared deps (three/fiber/drei chunk).
  void import('@/components/mobile/MobileChapter').catch(() => {})
  void import('@/components/web-apps/WebAppsChapter').catch(() => {})
  void import('@/components/everything-in-between/EverythingInBetweenChapter').catch(
    () => {},
  )
  void import('@/components/PhoneSwap').catch(() => {})
}

export function startIdlePrefetch(): void {
  if (started || typeof window === 'undefined') return
  started = true

  if (isPrerenderSnapshot()) return
  // Respect metered connections — the visitor may never scroll that far.
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean } }
  ).connection
  if (connection?.saveData) return

  const run = () => {
    onIdle(warmLazyChunks, 4_000)
    onIdle(() => {
      PREFETCH_ASSETS.forEach(prefetchAsset)
    }, 10_000)
  }

  if (document.readyState === 'complete') {
    run()
  } else {
    window.addEventListener('load', run, { once: true })
  }
}
