'use client'

import { PhoneSwap } from '@/components/PhoneSwap'
import { Suspense } from 'react'

/** Full-page 3D test — `?phone-debug=1` or layout capture `?phone-layout=1`. */
export function PhoneDebugPage({ layoutMode = false }: { layoutMode?: boolean }) {
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
      <p style={{ margin: 0, maxWidth: 560, lineHeight: 1.5, textAlign: 'center' }}>
        {layoutMode ? (
          <>
            Layout capture mode — panel above the canvas. Copy output into{' '}
            <code>lib/phone-swap/phoneSwapLayout.ts</code>. Remove{' '}
            <code>?phone-layout=1</code> when done.
          </>
        ) : (
          <>
            Isolated PhoneSwap (no slideshow). Drag to orbit. Remove{' '}
            <code>?phone-debug=1</code> to return to the portfolio.
          </>
        )}
      </p>
      <div style={{ width: 'min(640px, 100%)' }}>
        <Suspense fallback={<p style={{ color: '#aaa' }}>Loading…</p>}>
          <PhoneSwap />
        </Suspense>
      </div>
    </div>
  )
}
