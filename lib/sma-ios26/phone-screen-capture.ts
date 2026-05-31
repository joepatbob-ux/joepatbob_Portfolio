/**
 * Future hook: rasterize `#sma-phone-screen` → THREE.CanvasTexture for iPhone16 display.
 * Live interaction path — not wired yet; proto runs on debug page first.
 */
export const SMA_PHONE_SCREEN_CAPTURE_ID = 'sma-phone-screen'

export type PhoneScreenCaptureOptions = {
  width?: number
  height?: number
}

/** Stub — implement when plugging into PhoneSwapScene. */
export function capturePhoneScreenElement(
  _root: HTMLElement,
  _options?: PhoneScreenCaptureOptions,
): HTMLCanvasElement | null {
  return null
}
