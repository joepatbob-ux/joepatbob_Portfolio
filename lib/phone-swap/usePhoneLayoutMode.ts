import { useState } from 'react'

function readPhoneLayoutMode(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has('phone-layout')
}

/** Dev build or `?phone-layout=1` — enables position maker UI. */
export function usePhoneLayoutMode(): boolean {
  const [layoutMode] = useState(
    () => import.meta.env.DEV || readPhoneLayoutMode(),
  )
  return layoutMode
}
