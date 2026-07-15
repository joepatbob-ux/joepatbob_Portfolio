import { deckRequested } from '@/lib/deck/deckMode'
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

  // In deck mode every chapter is one wheel-flick away — warm eagerly instead
  // of waiting on the idle timeout, since a `?deck=1` visit is a deliberate
  // desktop demo that can afford it.
  if (deckRequested()) {
    warmLazyChunks()
    PREFETCH_ASSETS.forEach(prefetchAsset)
    return
  }

  const run = () => {
    onIdle(warmLazyChunks, 4_000)
    // The 3D binaries (~1.8MB of GLB + Draco) only pay off if the visitor
    // heads toward the chapters — warm them on the first scroll instead of a
    // blind idle timer, so a bounce never downloads them.
    const warmBinaries = () => {
      onIdle(() => {
        PREFETCH_ASSETS.forEach(prefetchAsset)
      }, 2_000)
    }
    if (window.scrollY > 0) {
      warmBinaries()
    } else {
      window.addEventListener('scroll', warmBinaries, { once: true, passive: true })
    }
  }

  if (document.readyState === 'complete') {
    run()
  } else {
    window.addEventListener('load', run, { once: true })
  }
}
