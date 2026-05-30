import { useState } from 'react'

/** `?phone-layout=1` — auto-open design debug tools on load (optional deep link). */
export function readPhoneLayoutMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('phone-layout')
}

/** @deprecated Use readPhoneLayoutMode — kept for PhoneDebugGate. */
export function usePhoneLayoutMode(): boolean {
  const [layoutMode] = useState(() => readPhoneLayoutMode())
  return layoutMode
}
