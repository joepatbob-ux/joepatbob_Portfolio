'use client'

import { PhoneSwapScene } from '@/components/phone-swap/PhoneSwapScene'
import { Html } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { debugLog } from '@/lib/phone-swap/debugLog'
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

const labelBase: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.04em',
  padding: '4px 10px',
  borderRadius: 8,
  border: '0.5px solid rgba(0,0,0,0.15)',
  color: '#888',
  background: '#fff',
  cursor: 'pointer',
}

const labelActive: CSSProperties = {
  ...labelBase,
  border: '0.5px solid rgba(0,0,0,0.4)',
  color: '#111',
  cursor: 'default',
}

/** 3D Pixel / iPhone swap — React Three Fiber, lerp animation in useFrame. */
export function PhoneSwap() {
  const [swapped, setSwapped] = useState(false)
  const busy = useRef(false)

  useEffect(() => {
    // #region agent log
    const canvas = document.querySelector<HTMLCanvasElement>(
      '.phone-swap__canvas-hit canvas',
    )
    const hit = document.querySelector('.phone-swap__canvas-hit')
    debugLog(
      'PhoneSwap.tsx:mount',
      'PhoneSwap mounted',
      {
        canvasFound: !!canvas,
        canvasWidth: canvas?.clientWidth ?? 0,
        canvasHeight: canvas?.clientHeight ?? 0,
        hitWidth: hit?.clientWidth ?? 0,
        hitHeight: hit?.clientHeight ?? 0,
      },
      'E',
    )
    // #endregion
  }, [])

  const doSwap = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setSwapped((s) => {
      const next = !s
      // #region agent log
      debugLog(
        'PhoneSwap.tsx:doSwap',
        '3D swap',
        { nextSwapped: next },
        '3D',
        'post-fix',
      )
      // #endregion
      return next
    })
    window.setTimeout(() => {
      busy.current = false
    }, 750)
  }, [])

  return (
    <div className="phone-swap">
      <div className="phone-swap__labels">
        <span
          role="button"
          tabIndex={swapped ? 0 : -1}
          style={!swapped ? labelActive : labelBase}
          onClick={() => swapped && doSwap()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && swapped) {
              e.preventDefault()
              doSwap()
            }
          }}
        >
          Android
        </span>
        <span className="phone-swap__sep">·</span>
        <span
          role="button"
          tabIndex={!swapped ? 0 : -1}
          style={swapped ? labelActive : labelBase}
          onClick={() => !swapped && doSwap()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !swapped) {
              e.preventDefault()
              doSwap()
            }
          }}
        >
          iPhone
        </span>
      </div>

      <div
        className="phone-swap__canvas-hit"
        onClick={doSwap}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            doSwap()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={
          swapped
            ? 'Phone models: iPhone in front. Activate to show Android in front.'
            : 'Phone models: Android in front. Activate to show iPhone in front.'
        }
      >
        <Canvas
          camera={{ position: [0, 0, 3.2], fov: 42, near: 0.05, far: 50 }}
          style={{ width: '100%', height: '100%' }}
          gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          frameloop="always"
          onCreated={({ gl, size }) => {
            // #region agent log
            debugLog(
              'PhoneSwap.tsx:onCreated',
              'WebGL canvas created',
              {
                sizeWidth: size.width,
                sizeHeight: size.height,
                rendererWidth: gl.domElement.width,
                rendererHeight: gl.domElement.height,
                contextLost: gl.getContext()?.isContextLost?.() ?? false,
              },
              'E',
              'post-fix',
            )
            requestAnimationFrame(() => {
              const el = gl.domElement
              const rect = el.getBoundingClientRect()
              debugLog(
                'PhoneSwap.tsx:canvasRect',
                'canvas layout after frame',
                {
                  clientWidth: el.clientWidth,
                  clientHeight: el.clientHeight,
                  rectWidth: rect.width,
                  rectHeight: rect.height,
                  rectTop: rect.top,
                  rectLeft: rect.left,
                },
                'K',
                'post-fix',
              )
            })
            // #endregion
          }}
        >
          <Suspense
            fallback={
              <Html center className="phone-swap__fallback">
                Loading phones…
              </Html>
            }
          >
            <PhoneSwapScene swapped={swapped} />
          </Suspense>
        </Canvas>
      </div>

      <button type="button" className="phone-swap__btn" onClick={doSwap}>
        swap ↔
      </button>
    </div>
  )
}
