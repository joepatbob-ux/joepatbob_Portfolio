import { PhoneScreenViewport } from '@/components/sma-ios26/PhoneScreenViewport'
import { SmaIos26Proto } from '@/components/sma-ios26/SmaIos26Proto'
import type { DisplayScreenRect } from '@/lib/sma-ios26/displayScreenRect'
import { requestLiveScreenCapture } from '@/lib/sma-ios26/live-screen-capture'
import {
  SMA_LOGICAL_HEIGHT,
  SMA_LOGICAL_WIDTH,
} from '@/lib/sma-ios26/screen-spec'
import { createPortal } from 'react-dom'
import { useCallback, useEffect, useRef, useState } from 'react'

type SmaPhoneScreenOverlayProps = {
  rect: DisplayScreenRect | null
  visible: boolean
  interactive: boolean
}

/** Invisible DOM layer over the 3D display — drives capture + native pointer input. */
export function SmaPhoneScreenOverlay({
  rect,
  visible,
  interactive,
}: SmaPhoneScreenOverlayProps) {
  const [mounted, setMounted] = useState(false)
  const [touching, setTouching] = useState(false)
  const touchCount = useRef(0)
  const active = visible && interactive && rect

  useEffect(() => {
    setMounted(true)
  }, [])

  const bumpCapture = useCallback(() => {
    requestLiveScreenCapture()
  }, [])

  const handlePointerDown = useCallback(() => {
    touchCount.current += 1
    setTouching(true)
    bumpCapture()
  }, [bumpCapture])

  const handlePointerUp = useCallback(() => {
    touchCount.current = Math.max(0, touchCount.current - 1)
    if (touchCount.current === 0) setTouching(false)
    bumpCapture()
  }, [bumpCapture])

  if (!mounted) return null

  const scaleX = rect ? rect.width / SMA_LOGICAL_WIDTH : 1
  const scaleY = rect ? rect.height / SMA_LOGICAL_HEIGHT : 1

  return createPortal(
    <div
      className={`sma-phone-overlay${active ? ' sma-phone-overlay--interactive' : ''}${touching ? ' sma-phone-overlay--touching' : ''}`}
      style={{
        position: 'fixed',
        left: rect?.left ?? -9999,
        top: rect?.top ?? 0,
        width: rect?.width ?? SMA_LOGICAL_WIDTH,
        height: rect?.height ?? SMA_LOGICAL_HEIGHT,
        visibility: visible && rect ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
        touchAction: active ? 'manipulation' : 'none',
      }}
      aria-hidden
      onPointerDown={active ? handlePointerDown : undefined}
      onPointerUp={active ? handlePointerUp : undefined}
      onPointerCancel={active ? handlePointerUp : undefined}
      onClick={active ? bumpCapture : undefined}
      onWheel={active ? bumpCapture : undefined}
    >
      <div
        className="sma-phone-overlay__scale"
        style={{
          width: SMA_LOGICAL_WIDTH,
          height: SMA_LOGICAL_HEIGHT,
          transform: `scale(${scaleX}, ${scaleY})`,
          transformOrigin: 'top left',
        }}
      >
        <PhoneScreenViewport>
          <SmaIos26Proto />
        </PhoneScreenViewport>
      </div>
    </div>,
    document.body,
  )
}
