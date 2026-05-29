'use client'

import { useChapterActive } from '@/lib/chapterActiveContext'
import { debugLog } from '@/lib/phone-swap/debugLog'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'

const PIXEL_FRONT = '/Phones/cropped/pixelFront.png'
const PIXEL_BACK = '/Phones/cropped/pixelBack.png'
const IPHONE_FRONT = '/Phones/cropped/iphoneFront.png'
const IPHONE_BACK = '/Phones/cropped/iphoneBack.png'

const labelBase: CSSProperties = {
  fontSize: 12,
  fontWeight: 500,
  letterSpacing: '0.04em',
  padding: '4px 10px',
  borderRadius: 8,
  border: '0.5px solid rgba(0, 0, 0, 0.15)',
  color: '#888',
  background: '#fff',
  cursor: 'pointer',
}

const labelActive: CSSProperties = {
  ...labelBase,
  border: '0.5px solid rgba(0, 0, 0, 0.4)',
  color: '#111',
  cursor: 'default',
}

/** 2D Android / iPhone swap — cropped Present assets, CSS motion. */
export function PhoneSwap2D() {
  const [swapped, setSwapped] = useState(false)
  const [animating, setAnimating] = useState(false)
  const busy = useRef(false)
  const active = useChapterActive()

  useEffect(() => {
    // #region agent log
    debugLog(
      'PhoneSwap2D.tsx:mount',
      'PhoneSwap2D visible',
      { active, swapped },
      '2D',
      'post-fix',
    )
    // #endregion
  }, [active, swapped])

  const doSwap = useCallback(() => {
    if (busy.current) return
    busy.current = true
    setAnimating(true)
    setSwapped((s) => {
      const next = !s
      // #region agent log
      debugLog(
        'PhoneSwap2D.tsx:doSwap',
        'swap triggered',
        { nextSwapped: next },
        '2D-anim',
        'post-fix',
      )
      // #endregion
      return next
    })
    window.setTimeout(() => {
      setAnimating(false)
      busy.current = false
    }, 750)
  }, [])

  if (!active) {
    return (
      <div
        className="phone-swap phone-swap--placeholder"
        aria-hidden
        style={{ minHeight: 500 }}
      />
    )
  }

  return (
    <div className={`phone-swap${animating ? ' phone-swap--animating' : ''}`}>
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
        className={[
          'phone-swap__stage-2d',
          swapped ? 'phone-swap__stage-2d--swapped' : '',
        ]
          .filter(Boolean)
          .join(' ')}
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
        <div className="phone-swap__device phone-swap__device--pixel">
          <div className="phone-swap__device-inner">
            <img
              className="phone-swap__face phone-swap__face--back"
              src={PIXEL_BACK}
              alt=""
              draggable={false}
            />
            <img
              className="phone-swap__face phone-swap__face--front"
              src={PIXEL_FRONT}
              alt="Android phone"
              draggable={false}
            />
          </div>
        </div>
        <div className="phone-swap__device phone-swap__device--iphone">
          <div className="phone-swap__device-inner">
            <img
              className="phone-swap__face phone-swap__face--back"
              src={IPHONE_BACK}
              alt=""
              draggable={false}
            />
            <img
              className="phone-swap__face phone-swap__face--front"
              src={IPHONE_FRONT}
              alt="iPhone"
              draggable={false}
            />
          </div>
        </div>
      </div>

      <button type="button" className="phone-swap__btn" onClick={doSwap}>
        swap ↔
      </button>
    </div>
  )
}
