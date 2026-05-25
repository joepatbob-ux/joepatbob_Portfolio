/** Round brick placement to whole screen pixels during drag. */
export function roundPlacementPx(
  left: number,
  top: number,
): { left: number; top: number } {
  return { left: Math.round(left), top: Math.round(top) }
}
