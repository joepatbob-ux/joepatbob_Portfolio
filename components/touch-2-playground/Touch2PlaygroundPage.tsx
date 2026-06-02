'use client'

import { Touch2MasterScene } from '@/components/touch-2-playground/Touch2MasterScene'
import { Html } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Component, type ReactNode, Suspense } from 'react'

class Touch2PlaygroundErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <p style={{ margin: 0, color: '#f5a89a', maxWidth: 560, lineHeight: 1.5 }}>
          Failed to load model: {this.state.error.message}. Ensure{' '}
          <code>public/models/touch-2-master/Touch 2 Master.obj</code> exists
          (run <code>scripts/copy-touch2-master-model.sh</code>).
        </p>
      )
    }
    return this.props.children
  }
}

/** Full-page Touch 2 KeyShot OBJ lab — `?touch2-playground=1` or `?touch2=1`. */
export function Touch2PlaygroundPage() {
  return (
    <div
      className="touch2-playground"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        background: '#141416',
        color: '#e8e8ec',
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 12,
        position: 'relative',
        zIndex: 9999,
      }}
    >
      <h1
        style={{
          margin: 0,
          fontSize: 14,
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: '#DE3E18',
        }}
      >
        Touch 2 playground
      </h1>
      <p style={{ margin: 0, maxWidth: 640, lineHeight: 1.55, textAlign: 'center' }}>
        KeyShot OBJ + flat-color MTL. Drag to orbit. First load parses ~70&nbsp;MB.
        Remove <code>?touch2-playground=1</code> (or <code>?touch2=1</code>) to return.
      </p>
      <Touch2PlaygroundErrorBoundary>
        <div
          style={{
            width: 'min(960px, 100%)',
            height: 'min(78dvh, 720px)',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #3a3a44',
            background: '#2a2a2e',
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 4], fov: 42, near: 0.02, far: 200 }}
            style={{ width: '100%', height: '100%' }}
            dpr={[1, 2]}
            gl={{ antialias: true, powerPreference: 'high-performance' }}
          >
            <Suspense
              fallback={
                <Html center>
                  <p
                    style={{
                      margin: 0,
                      color: '#e8e8ec',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Loading ~70&nbsp;MB model…
                  </p>
                </Html>
              }
            >
              <Touch2MasterScene />
            </Suspense>
          </Canvas>
        </div>
      </Touch2PlaygroundErrorBoundary>
      <p style={{ margin: 0, color: '#9a9aa8', textAlign: 'center' }}>
        Dev URL: <code>http://localhost:3000/?touch2-playground=1</code>
      </p>
    </div>
  )
}
