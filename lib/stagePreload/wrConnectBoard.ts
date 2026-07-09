import { preloadBoardImage } from '@/lib/wrConnectBoard'

/** Warm the WR Connect board image once the chapter nears the viewport. */
export function preloadWrConnectBoard(src: string): void {
  preloadBoardImage(src)
}
