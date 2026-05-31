'use client'

import { SmaIos26DebugPage } from '@/components/sma-ios26/SmaIos26DebugPage'
import { PhoneDebugPage } from '@/components/phone-swap/PhoneDebugPage'
import { type ReactNode, useEffect, useState } from 'react'

/** Routes debug query params to isolated lab pages before the portfolio shell. */
export function ProtoDebugGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'portfolio' | 'sma-proto' | 'phone-debug'>(
    'portfolio',
  )
  const [layoutMode, setLayoutMode] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.has('sma-proto')) {
      setMode('sma-proto')
      return
    }
    if (params.has('phone-debug') || params.has('phone-layout')) {
      setMode('phone-debug')
      setLayoutMode(params.has('phone-layout'))
      return
    }
    setMode('portfolio')
  }, [])

  if (mode === 'sma-proto') return <SmaIos26DebugPage />
  if (mode === 'phone-debug') {
    return <PhoneDebugPage layoutMode={layoutMode} />
  }
  return children
}
