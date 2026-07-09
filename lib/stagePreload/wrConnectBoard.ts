import { preloadRasterSource } from '@/lib/effects/loadRasterSource'

/** Warm the WR Connect board source (PDF or PNG) once the chapter nears the viewport. */
export function preloadWrConnectBoard(src: string): void {
  preloadRasterSource(src)
}
