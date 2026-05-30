import { useState } from 'react'

function readPhoneLayoutMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('phone-layout')
}

/** `?phone-layout=1` — enables position / animation maker UI (hidden by default). */
export function usePhoneLayoutMode(): boolean {
  const [layoutMode] = useState(() => readPhoneLayoutMode())
  return layoutMode
}
