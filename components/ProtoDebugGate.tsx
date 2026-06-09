'use client'

import {
  readProtoDebugMode,
  readProtoDebugSearchParams,
  resolveProtoDebugMode,
  type ProtoDebugMode,
} from '@/lib/protoDebugMode'
import dynamic from 'next/dynamic'
import { type ReactNode, useEffect, useState } from 'react'

const SmaIos26DebugPage = dynamic(
  () =>
    import('@/components/sma-ios26/SmaIos26DebugPage').then((m) => ({
      default: m.SmaIos26DebugPage,
    })),
  { loading: () => null },
)

const Touch2PlaygroundPage = dynamic(
  () =>
    import('@/components/touch-2-playground/Touch2PlaygroundPage').then(
      (m) => ({ default: m.Touch2PlaygroundPage }),
    ),
  { loading: () => null },
)

const PhoneDebugPage = dynamic(
  () =>
    import('@/components/phone-swap/PhoneDebugPage').then((m) => ({
      default: m.PhoneDebugPage,
    })),
  { loading: () => null },
)

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
