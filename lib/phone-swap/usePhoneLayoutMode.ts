import { useState } from 'react'

function readPhoneLayoutMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('phone-layout')
}

/** True when URL has `?phone-layout=1` — enables transform capture UI. */
export function usePhoneLayoutMode(): boolean {
  const [layoutMode] = useState(readPhoneLayoutMode)
  return layoutMode
}
