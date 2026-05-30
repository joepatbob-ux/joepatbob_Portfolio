'use client'

import { PhoneDebugPage } from '@/components/phone-swap/PhoneDebugPage'
import { type ReactNode, useEffect, useState } from 'react'

export function PhoneDebugGate({ children }: { children: ReactNode }) {
  const [debugPage, setDebugPage] = useState(false)

  useEffect(() => {
    setDebugPage(
      new URLSearchParams(window.location.search).has('phone-debug'),
    )
  }, [])

  if (debugPage) {
    const layoutMode = new URLSearchParams(window.location.search).has(
      'phone-layout',
    )
    return <PhoneDebugPage layoutMode={layoutMode} />
  }
  return children
}
