import { toCanvas } from 'html-to-image'
import {
  SMA_LOGICAL_HEIGHT,
  SMA_LOGICAL_WIDTH,
} from '@/lib/sma-ios26/screen-spec'

export const SMA_PHONE_SCREEN_CAPTURE_ID = 'sma-phone-screen'

export type PhoneScreenCaptureOptions = {
  width?: number
  height?: number
}

export async function capturePhoneScreenElement(
  root: HTMLElement,
  options?: PhoneScreenCaptureOptions,
): Promise<HTMLCanvasElement | null> {
  const width = options?.width ?? SMA_LOGICAL_WIDTH
  const height = options?.height ?? SMA_LOGICAL_HEIGHT

  root.classList.add('sma-capture-snapshot')
  try {
    return await toCanvas(root, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      skipAutoScale: true,
    })
  } catch {
    return null
  } finally {
    root.classList.remove('sma-capture-snapshot')
  }
}

export async function capturePhoneScreenById(
  id = SMA_PHONE_SCREEN_CAPTURE_ID,
): Promise<HTMLCanvasElement | null> {
  const root = document.getElementById(id)
  if (!root) return null
  return capturePhoneScreenElement(root)
}
