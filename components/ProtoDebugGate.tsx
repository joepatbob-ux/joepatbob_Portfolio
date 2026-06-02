'use client'

import { SmaIos26DebugPage } from '@/components/sma-ios26/SmaIos26DebugPage'
import { PhoneDebugPage } from '@/components/phone-swap/PhoneDebugPage'
import { Touch2PlaygroundPage } from '@/components/touch-2-playground/Touch2PlaygroundPage'
import {
  readProtoDebugMode,
  readProtoDebugSearchParams,
  resolveProtoDebugMode,
  type ProtoDebugMode,
} from '@/lib/protoDebugMode'
import { type ReactNode, useEffect, useState } from 'react'

/** Routes debug query params to isolated lab pages before the portfolio shell. */
export function ProtoDebugGate({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ProtoDebugMode>(() => readProtoDebugMode().mode)
  const [layoutMode, setLayoutMode] = useState(
    () => readProtoDebugMode().layoutMode,
  )

  useEffect(() => {
    const sync = () => {
      const next = resolveProtoDebugMode(readProtoDebugSearchParams())
      setMode(next.mode)
      setLayoutMode(next.layoutMode)
    }
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('hashchange', sync)
    }
  }, [])

  if (mode === 'sma-proto') return <SmaIos26DebugPage />
  if (mode === 'touch2-playground') return <Touch2PlaygroundPage />
  if (mode === 'phone-debug') {
    return <PhoneDebugPage layoutMode={layoutMode} />
  }
  return children
}
