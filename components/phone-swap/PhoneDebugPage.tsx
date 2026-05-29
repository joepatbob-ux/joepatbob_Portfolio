'use client'

import { PhoneSwap } from '@/components/PhoneSwap'
import { Suspense } from 'react'

/** Full-page 3D test — open site with `?phone-debug=1` (no chapter nav / opacity stack). */
export function PhoneDebugPage() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        background: '#1a1a1a',
        color: '#eee',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
      }}
    >
      <p style={{ margin: 0, maxWidth: 520, lineHeight: 1.5, textAlign: 'center' }}>
        Isolated PhoneSwap (no slideshow). You should see a centered Android phone. Drag to
        orbit. Remove <code>?phone-debug=1</code> to return to the portfolio.
      </p>
      <div style={{ width: 'min(640px, 100%)' }}>
        <Suspense fallback={<p style={{ color: '#aaa' }}>Loading…</p>}>
          <PhoneSwap />
        </Suspense>
      </div>
    </div>
  )
}
