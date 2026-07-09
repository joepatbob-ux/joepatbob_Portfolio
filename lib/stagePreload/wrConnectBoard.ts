/** Warm the WR Connect board photo once the chapter nears the viewport. */
export function preloadWrConnectBoard(src: string): void {
  const image = new Image()
  image.decoding = 'async'
  image.src = src
}
