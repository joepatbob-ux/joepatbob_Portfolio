type CaptureListener = () => void

const listeners = new Set<CaptureListener>()

export function subscribeLiveScreenCapture(listener: CaptureListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function requestLiveScreenCapture(): void {
  for (const listener of listeners) listener()
}
