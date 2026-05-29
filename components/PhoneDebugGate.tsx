'use client'

import { PhoneDebugPage } from '@/components/phone-swap/PhoneDebugPage'
import { type ReactNode, useEffect, useState } from 'react'

export function PhoneDebugGate({ children }: { children: ReactNode }) {
  const [phoneDebug, setPhoneDebug] = useState(false)

  useEffect(() => {
    setPhoneDebug(
      new URLSearchParams(window.location.search).has('phone-debug'),
    )
  }, [])

  if (phoneDebug) return <PhoneDebugPage />
  return children
}
