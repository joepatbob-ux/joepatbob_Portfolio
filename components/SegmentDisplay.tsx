'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

// ── SEGMENT DEFINITIONS ───────────────────────────────────────────────────────
// Each digit: [top, mid, bot, tl, tr, bl, br]
const SEGS: Record<number, number[]> = {
  0:[1,0,1,1,1,1,1], 1:[0,0,0,0,1,0,1], 2:[1,1,1,0,1,1,0],
  3:[1,1,1,0,1,0,1], 4:[0,1,0,1,1,0,1], 5:[1,1,1,1,0,0,1],
  6:[1,1,1,1,0,1,1], 7:[1,0,0,0,1,0,1], 8:[1,1,1,1,1,1,1],
  9:[1,1,1,1,1,0,1],
}
const SEG_PARTS = ['top','mid','bot','tl','tr','bl','br'] as const

// ── CONSTANTS ─────────────────────────────────────────────────────────────────
const DEADBAND   = 2
const TEMP_MIN   = 50
const TEMP_MAX   = 99
const ROOM_TEMP  = 72
const RETURN_MS  = 3000
const MODES      = ['cool','heat','off'] as const
type Mode = typeof MODES[number]

// ── SEGMENT DIGIT ─────────────────────────────────────────────────────────────
function Digit({ value }: { value: number }) {
  const segs = SEGS[Math.max(0, Math.min(9, value))]
  return (
    <div style={{ position:'relative', width:28, height:52, flexShrink:0 }}>
      {SEG_PARTS.map((part, i) => {
        const on = segs[i] === 1
        const base: React.CSSProperties = {
          position:'absolute',
          background: on ? '#ffffff' : 'rgba(255,255,255,0.07)',
          borderRadius: 2,
          transition: 'background 60ms',
        }
        const styles: Record<string, React.CSSProperties> = {
          top: { top:1,    left:4,  right:4,  height:3 },
          mid: { top:'50%',left:2,  right:2,  height:3, marginTop:-1.5 },
          bot: { bottom:1, left:4,  right:4,  height:3 },
          tl:  { top:4,    left:2,  width:3,  bottom:'calc(50% + 3px)' },
          tr:  { top:4,    right:2, width:3,  bottom:'calc(50% + 3px)' },
          bl:  { bottom:4, left:2,  width:3,  top:'calc(50% + 3px)' },
          br:  { bottom:4, right:2, width:3,  top:'calc(50% + 3px)' },
        }
        return <div key={part} style={{ ...base, ...styles[part] }} />
      })}
    </div>
  )
}

// ── SCREEN ICON ───────────────────────────────────────────────────────────────
function ScreenIcon({
  label, visible, color
}: { label: string; visible: boolean; color?: string }) {
  return (
    <span style={{
      fontSize: 7,
      fontFamily: 'monospace',
      letterSpacing: '0.08em',
      lineHeight: 1.2,
      color: visible ? (color || 'rgba(255,255,255,0.8)') : 'rgba(255,255,255,0.1)',
      transition: 'color 200ms',
      whiteSpace: 'nowrap',
      display: 'block',
    }}>
      {label}
    </span>
  )
}

// ── BUTTON ────────────────────────────────────────────────────────────────────
function PhysicalButton({
  children, onClick, disabled, skewY = 0, skewX = 0,
  ariaLabel,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  skewY?: number
  skewX?: number
  ariaLabel: string
}) {
  const [pressed, setPressed] = useState(false)

  const handleClick = () => {
    if (disabled) return
    setPressed(true)
    setTimeout(() => setPressed(false), 130)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      disabled={disabled}
      style={{
        width: 24, height: 24,
        background: 'rgba(255,255,255,0.1)',
        border: 'none',
        borderRadius: 4,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.75)',
        fontSize: 14,
        lineHeight: 1,
        userSelect: 'none',
        opacity: disabled ? 0.2 : 1,
        transition: 'background 100ms, opacity 150ms, transform 60ms ease-out',
        transform: pressed
          ? `scale(0.88) skewY(${skewY}deg) skewX(${skewX}deg)`
          : 'scale(1) skewY(0) skewX(0)',
      }}
    >
      {children}
    </button>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function SegmentDisplay() {
  const [modeIdx, setModeIdx]   = useState<number>(1)    // start: heat
  const [heatSP,  setHeatSP]    = useState<number>(68)
  const [coolSP,  setCoolSP]    = useState<number>(74)
  const [display, setDisplay]   = useState<number>(ROOM_TEMP)
  const [adjusting, setAdjusting] = useState<boolean>(false)
  const [midPressed, setMidPressed] = useState<boolean>(false)
  const returnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const mode: Mode = MODES[modeIdx]
  const isOff = mode === 'off'
  const heatCycleActive = mode === 'heat'
  const coolCycleActive = mode === 'cool'

  const exitAdjust = useCallback(() => {
    setAdjusting(false)
    setDisplay(ROOM_TEMP)
  }, [])

  const resetTimer = useCallback(() => {
    if (returnTimer.current) clearTimeout(returnTimer.current)
    returnTimer.current = setTimeout(exitAdjust, RETURN_MS)
  }, [exitAdjust])

  useEffect(() => {
    return () => { if (returnTimer.current) clearTimeout(returnTimer.current) }
  }, [])

  const handleUp = useCallback(() => {
    if (isOff) return
    setAdjusting(true)
    if (mode === 'heat') {
      setHeatSP(prev => {
        const next = Math.min(TEMP_MAX, prev + 1)
        setCoolSP(c => c < next + DEADBAND ? Math.min(TEMP_MAX, next + DEADBAND) : c)
        setDisplay(next)
        return next
      })
    } else {
      setCoolSP(prev => {
        const next = Math.min(TEMP_MAX, prev + 1)
        setDisplay(next)
        return next
      })
    }
    resetTimer()
  }, [isOff, mode, resetTimer])

  const handleDown = useCallback(() => {
    if (isOff) return
    setAdjusting(true)
    if (mode === 'cool') {
      setCoolSP(prev => {
        const next = Math.max(TEMP_MIN, prev - 1)
        setHeatSP(h => h > next - DEADBAND ? Math.max(TEMP_MIN, next - DEADBAND) : h)
        setDisplay(next)
        return next
      })
    } else {
      setHeatSP(prev => {
        const next = Math.max(TEMP_MIN, prev - 1)
        setDisplay(next)
        return next
      })
    }
    resetTimer()
  }, [isOff, mode, resetTimer])

  const handleMode = useCallback(() => {
    setMidPressed(true)
    setTimeout(() => setMidPressed(false), 130)
    if (adjusting) {
      if (returnTimer.current) clearTimeout(returnTimer.current)
      exitAdjust()
    }
    setModeIdx(i => (i + 1) % MODES.length)
  }, [adjusting, exitAdjust])

  const tens = Math.floor(display / 10)
  const ones = display % 10

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
      padding: '32px 0',
      userSelect: 'none',
    }}>

      {/* ── DEVICE ── */}
      <div style={{
        position: 'relative',
        width: 320,
        height: 196,
        background: '#0e0e0e',
        borderRadius: 14,
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)',
      }}>

        {/* Logo */}
        <div style={{
          position: 'absolute',
          top: 11,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 11,
          letterSpacing: '0.2em',
          color: 'rgba(255,255,255,0.4)',
          whiteSpace: 'nowrap',
          fontFamily: 'sans-serif',
        }}>
          sen|si
        </div>

        {/* Screen */}
        <div style={{
          position: 'absolute',
          left: 'calc(50% - 52px)',
          top: 32,
          width: 104,
          height: 104,
          background: '#000',
          borderRadius: 5,
          boxShadow: 'inset 0 0 16px rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}>

          {/* SET TO label */}
          <div style={{
            position: 'absolute',
            top: 9,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 7.5,
            fontFamily: 'monospace',
            letterSpacing: '0.14em',
            color: 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap',
            opacity: adjusting ? 1 : 0,
            transition: 'opacity 150ms',
          }}>
            SET TO
          </div>

          {/* Left icons — mode indicators */}
          <div style={{
            position: 'absolute',
            left: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <ScreenIcon
              label="COOL"
              visible={coolCycleActive}
              color="#4A9FD4"
            />
            <ScreenIcon
              label="HEAT"
              visible={heatCycleActive}
              color="#F2411B"
            />
          </div>

          {/* Right icons — connectivity */}
          <div style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
            alignItems: 'flex-end',
          }}>
            <ScreenIcon label="WiFi" visible={true} />
            <ScreenIcon label="SNS"  visible={true} />
          </div>

          {/* Digits */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            gap: 4,
            marginTop: 2,
          }}>
            <Digit value={tens} />
            <Digit value={ones} />
          </div>

          {/* Bottom icons — system state */}
          <div style={{
            position: 'absolute',
            bottom: 7,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 12,
          }}>
            <ScreenIcon label="OFF" visible={isOff} />
            <ScreenIcon label="ON"  visible={!isOff} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          position: 'absolute',
          right: -36,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'center',
        }}>
          <PhysicalButton
            onClick={handleUp}
            disabled={isOff}
            skewY={-4}
            ariaLabel="Increase setpoint"
          >
            &#8743;
          </PhysicalButton>

          {/* Middle button — mode cycle */}
          <div
            onClick={handleMode}
            role="button"
            tabIndex={0}
            aria-label="Cycle mode"
            onKeyDown={e => { if (e.key==='Enter'||e.key===' ') handleMode() }}
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 3.5,
              alignItems: 'center',
              padding: '3px 0',
              transition: 'transform 60ms ease-out',
              transform: midPressed
                ? 'scale(0.85) skewX(3deg)'
                : 'scale(1) skewX(0)',
            }}
          >
            {[0,1,2].map(i => (
              <div key={i} style={{
                width: 3.5, height: 3.5,
                background: 'rgba(255,255,255,0.35)',
                borderRadius: '50%',
              }} />
            ))}
          </div>

          <PhysicalButton
            onClick={handleDown}
            disabled={isOff}
            skewY={4}
            ariaLabel="Decrease setpoint"
          >
            &#8744;
          </PhysicalButton>
        </div>
      </div>

      {/* ── STATUS ROW ── */}
      <div style={{ display:'flex', alignItems:'center', gap:16 }}>

        {/* Mode pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '4px 12px',
          borderRadius: 20,
          border: `0.5px solid ${
            mode==='heat' ? 'rgba(242,65,27,0.35)' :
            mode==='cool' ? 'rgba(74,159,212,0.35)' :
            'rgba(128,128,128,0.25)'
          }`,
          fontSize: 11,
          fontFamily: 'monospace',
          letterSpacing: '0.07em',
          color: mode==='heat' ? '#F2411B' : mode==='cool' ? '#4A9FD4' : 'rgba(128,128,128,0.6)',
          background: 'transparent',
          transition: 'border-color 200ms, color 200ms',
        }}>
          <div style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: 'currentColor',
          }} />
          {mode}
        </div>

        {/* Setpoints */}
        <div style={{ display:'flex', gap:16 }}>
          {[
            { label:'heat', val:heatSP, color:'#F2411B', dimmed: mode==='cool'||mode==='off' },
            { label:'cool', val:coolSP, color:'#4A9FD4', dimmed: mode==='heat'||mode==='off' },
          ].map(sp => (
            <div key={sp.label} style={{
              display: 'flex', flexDirection:'column',
              alignItems:'center', gap:2,
              opacity: sp.dimmed ? 0.25 : 1,
              transition: 'opacity 200ms',
            }}>
              <div style={{ fontSize:10, fontFamily:'monospace', letterSpacing:'0.08em', color:'rgba(128,128,128,0.6)', textTransform:'uppercase' }}>
                {sp.label}
              </div>
              <div style={{ fontSize:13, fontFamily:'monospace', fontWeight:500, color:sp.color }}>
                {sp.val}°
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HINT ── */}
      <p style={{
        fontSize: 11,
        color: 'rgba(128,128,128,0.5)',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.6,
        fontFamily: 'monospace',
        letterSpacing: '0.04em',
        margin: 0,
      }}>
        {isOff
          ? '··· to change mode · up/down inactive in off'
          : adjusting
          ? `adjusting ${mode} setpoint · returns automatically`
          : '∧ ∨ adjust setpoint · ··· cycle mode'
        }
      </p>
    </div>
  )
}
