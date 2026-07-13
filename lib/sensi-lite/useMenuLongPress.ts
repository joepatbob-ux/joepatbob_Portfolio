import { useCallback, useRef } from 'react'
import type { Ring } from '@/lib/sensi-lite/flow'
import { HOMEOWNER_LONG_PRESS_MS } from '@/lib/sensi-lite/flow'

type MenuLongPressHandlers = {
  onPointerDown: () => void
  onPointerUp: () => void
  onPointerLeave: () => void
  onPointerCancel: () => void
}

export function useMenuLongPress({
  ring,
  onTap,
  onLongPress,
  onPressStart,
  onPressEnd,
}: {
  ring: Ring
  onTap: () => void
  onLongPress: () => void
  /** Fires when a hold begins (main / homeowner rings only). */
  onPressStart?: (durationMs: number) => void
  /** Fires when the hold ends for any reason. */
  onPressEnd?: () => void
}): MenuLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressFiredRef = useRef(false)
  const pointerDownRef = useRef(false)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const thresholdMs = HOMEOWNER_LONG_PRESS_MS

  const endPress = useCallback(() => {
    onPressEnd?.()
  }, [onPressEnd])

  const onPointerDown = useCallback(() => {
    pointerDownRef.current = true
    longPressFiredRef.current = false
    clearTimer()
    if (ring === 'contractor') return

    onPressStart?.(thresholdMs)
    timerRef.current = setTimeout(() => {
      longPressFiredRef.current = true
      onLongPress()
      timerRef.current = null
    }, thresholdMs)
  }, [clearTimer, onLongPress, onPressStart, ring, thresholdMs])

  const finishPointer = useCallback(() => {
    if (!pointerDownRef.current) return

    clearTimer()
    if (!longPressFiredRef.current) onTap()
    pointerDownRef.current = false
    longPressFiredRef.current = false
    endPress()
  }, [clearTimer, endPress, onTap])

  return {
    onPointerDown,
    onPointerUp: finishPointer,
    onPointerLeave: finishPointer,
    onPointerCancel: () => {
      clearTimer()
      pointerDownRef.current = false
      longPressFiredRef.current = false
      endPress()
    },
  }
}
