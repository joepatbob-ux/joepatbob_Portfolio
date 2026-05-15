// components/SensiLiteProto.tsx
// Interactive prototype of the Sensi Lite 32-segment display thermostat
// 3 buttons: UP, DOWN, MENU/ACTION
// Long press MENU → homeowner settings, second long press → contractor config
// Flat cyclical navigation, conditional dependencies in settings order

'use client'

import { useState, useRef, useCallback } from 'react'

// ── SEGMENT DISPLAY ───────────────────────────────────────────────────────────
// Each digit is a 7-segment display
// Segments: a(top) b(top-right) c(bot-right) d(bot) e(bot-left) f(top-left) g(mid)
const SEG7: Record<string, boolean[]> = {
  //         a      b      c      d      e      f      g
  '0': [true,  true,  true,  true,  true,  true,  false],
  '1': [false, true,  true,  false, false, false, false],
  '2': [true,  true,  false, true,  true,  false, true ],
  '3': [true,  true,  true,  true,  false, false, true ],
  '4': [false, true,  true,  false, false, true,  true ],
  '5': [true,  false, true,  true,  false, true,  true ],
  '6': [true,  false, true,  true,  true,  true,  true ],
  '7': [true,  true,  true,  false, false, false, false],
  '8': [true,  true,  true,  true,  true,  true,  true ],
  '9': [true,  true,  true,  true,  false, true,  true ],
  '-': [false, false, false, false, false, false, true ],
  ' ': [false, false, false, false, false, false, false],
  'E': [true,  false, false, true,  true,  true,  true ],
  'r': [false, false, false, false, true,  false, true ],
  'n': [false, false, true,  false, true,  false, true ],
  'o': [false, false, true,  true,  true,  false, true ],
  'F': [true,  false, false, false, true,  true,  true ],
  'H': [false, true,  true,  false, true,  true,  true ],
  'L': [false, false, false, true,  true,  true,  false],
  'A': [true,  true,  true,  false, true,  true,  true ],
  'C': [true,  false, false, true,  true,  true,  false],
  'P': [true,  true,  false, false, true,  true,  true ],
  'U': [false, true,  true,  true,  true,  true,  false],
  'd': [false, true,  true,  true,  true,  false, true ],
}

// ── TYPES ─────────────────────────────────────────────────────────────────────
type Mode = 'heat' | 'cool' | 'auto' | 'off'
type Fan  = 'auto' | 'on'
type Screen =
  | 'home'
  | 'set_temp'
  | 'mode'
  | 'fan'
  | 'hw_schedule'
  | 'hw_hold'
  | 'hw_backlight'
  | 'ct_heat_offset'
  | 'ct_cool_offset'
  | 'ct_swing'
  | 'ct_id'

interface State {
  currentTemp: number
  setTemp:     number
  mode:        Mode
  fan:         Fan
  schedule:    boolean
  hold:        boolean
  backlight:   number   // 1-5
  heatOffset:  number   // -9 to +9
  coolOffset:  number
  swing:       number   // 1-3
  unitId:      number   // 01-99
}

// ── NAVIGATION MAPS ───────────────────────────────────────────────────────────
const HW_SCREENS: Screen[] = ['hw_schedule', 'hw_hold', 'hw_backlight']
const CT_SCREENS: Screen[] = ['ct_heat_offset', 'ct_cool_offset', 'ct_swing', 'ct_id']

// ── DISPLAY LOGIC ─────────────────────────────────────────────────────────────
function getDisplay(screen: Screen, state: State): { chars: string; label: string; sub: string } {
  switch (screen) {
    case 'home':
      return {
        chars: String(state.currentTemp).padStart(2, ' '),
        label: `SET ${state.setTemp}°`,
        sub: `${state.mode.toUpperCase()} · FAN ${state.fan.toUpperCase()}`,
      }
    case 'set_temp':
      return { chars: String(state.setTemp).padStart(2, ' '), label: 'SET TEMP', sub: 'UP/DN TO CHANGE · MENU TO CONFIRM' }
    case 'mode': {
      const modeChars: Record<Mode, string> = { heat: 'HE', cool: 'Co', auto: 'Au', off: 'oF' }
      return { chars: modeChars[state.mode], label: 'MODE', sub: 'UP/DN TO CHANGE · MENU TO CONFIRM' }
    }
    case 'fan':
      return { chars: state.fan === 'auto' ? 'FA' : 'Fn', label: 'FAN', sub: 'UP/DN TO CHANGE · MENU TO CONFIRM' }
    case 'hw_schedule':
      return { chars: state.schedule ? 'on' : 'oF', label: 'SCHEDULE', sub: 'HOMEOWNER SETTINGS' }
    case 'hw_hold':
      return { chars: state.hold ? 'HL' : 'no', label: 'HOLD', sub: 'HOMEOWNER SETTINGS' }
    case 'hw_backlight':
      return { chars: ` ${state.backlight}`, label: 'BACKLIGHT', sub: 'HOMEOWNER SETTINGS' }
    case 'ct_heat_offset': {
      const ho = state.heatOffset
      return { chars: ho >= 0 ? ` ${ho}` : `-${Math.abs(ho)}`, label: 'HEAT OFFSET', sub: 'CONTRACTOR CONFIG' }
    }
    case 'ct_cool_offset': {
      const co = state.coolOffset
      return { chars: co >= 0 ? ` ${co}` : `-${Math.abs(co)}`, label: 'COOL OFFSET', sub: 'CONTRACTOR CONFIG' }
    }
    case 'ct_swing':
      return { chars: ` ${state.swing}`, label: 'SWING', sub: 'CONTRACTOR CONFIG' }
    case 'ct_id':
      return { chars: String(state.unitId).padStart(2, '0'), label: 'UNIT ID', sub: 'CONTRACTOR CONFIG' }
  }
}

// ── SEGMENT SVG ───────────────────────────────────────────────────────────────
function Digit({ char, color, dimColor }: { char: string; color: string; dimColor: string }) {
  const segs = SEG7[char] || SEG7[' ']
  const W = 28; const H = 48; const T = 4; const G = 1.5

  const segPaths = [
    `M${T},${G} L${W - T},${G} L${W - T - T * 0.5},${T + G} L${T + T * 0.5},${T + G} Z`,
    `M${W - G},${T} L${W - G},${H / 2 - G} L${W - T - G},${H / 2 - T - G} L${W - T - G},${T + T * 0.5} Z`,
    `M${W - G},${H / 2 + G} L${W - G},${H - T} L${W - T - G},${H - T - T * 0.5} L${W - T - G},${H / 2 + T + G} Z`,
    `M${T},${H - G} L${W - T},${H - G} L${W - T - T * 0.5},${H - T - G} L${T + T * 0.5},${H - T - G} Z`,
    `M${G},${H / 2 + G} L${G},${H - T} L${T + G},${H - T - T * 0.5} L${T + G},${H / 2 + T + G} Z`,
    `M${G},${T} L${G},${H / 2 - G} L${T + G},${H / 2 - T - G} L${T + G},${T + T * 0.5} Z`,
    `M${T + T * 0.3},${H / 2} L${W - T - T * 0.3},${H / 2} L${W - T},${H / 2 + T * 0.35} L${W - T - T * 0.3},${H / 2 + T * 0.7} L${T + T * 0.3},${H / 2 + T * 0.7} L${T},${H / 2 + T * 0.35} Z`,
  ]

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
      {segPaths.map((d, i) => (
        <path key={i} d={d} fill={segs[i] ? color : dimColor} style={{ transition: 'fill 80ms ease' }} />
      ))}
    </svg>
  )
}

function SegDisplay({ chars, color }: { chars: string; color: string }) {
  const dimColor = color + '22'
  const c = chars.padStart(2, ' ').slice(0, 2)
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <Digit char={c[0]} color={color} dimColor={dimColor} />
      <Digit char={c[1]} color={color} dimColor={dimColor} />
    </div>
  )
}

// ── BUTTON ────────────────────────────────────────────────────────────────────
function Button({
  label, sub, onPress, onLongPress, active,
}: {
  label: string; sub?: string; onPress: () => void; onLongPress?: () => void; active?: boolean
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)

  const start = useCallback(() => {
    firedRef.current = false
    if (onLongPress) {
      timerRef.current = setTimeout(() => {
        firedRef.current = true
        onLongPress()
      }, 700)
    }
  }, [onLongPress])

  const end = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!firedRef.current) onPress()
  }, [onPress])

  return (
    <button
      type="button"
      onMouseDown={start}
      onMouseUp={end}
      onMouseLeave={() => { if (timerRef.current) clearTimeout(timerRef.current) }}
      onTouchStart={start}
      onTouchEnd={end}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        background: active ? 'rgba(242,65,27,0.15)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? 'rgba(242,65,27,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 6,
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'all 120ms ease',
        minWidth: 56,
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      onMouseOut={e => (e.currentTarget.style.background = active ? 'rgba(242,65,27,0.15)' : 'rgba(255,255,255,0.04)')}
    >
      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: active ? '#F2411B' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
        {label}
      </span>
      {sub && (
        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 9, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>
          {sub}
        </span>
      )}
    </button>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function SensiLiteProto() {
  const [screen, setScreen] = useState<Screen>('home')
  const [navLevel, setNavLevel] = useState<'normal' | 'homeowner' | 'contractor'>('normal')
  const [state, setState] = useState<State>({
    currentTemp: 72,
    setTemp:     70,
    mode:        'heat',
    fan:         'auto',
    schedule:    true,
    hold:        false,
    backlight:   3,
    heatOffset:  0,
    coolOffset:  0,
    swing:       2,
    unitId:      1,
  })
  const [flash, setFlash] = useState(false)

  const triggerFlash = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
  }

  const handleUp = useCallback(() => {
    triggerFlash()
    setState(s => {
      switch (screen) {
        case 'home':
        case 'set_temp':   return { ...s, setTemp: Math.min(99, s.setTemp + 1) }
        case 'mode': {
          const order: Mode[] = ['heat', 'cool', 'auto', 'off']
          return { ...s, mode: order[(order.indexOf(s.mode) + 1) % order.length] }
        }
        case 'fan':        return { ...s, fan: s.fan === 'auto' ? 'on' : 'auto' }
        case 'hw_schedule': return { ...s, schedule: !s.schedule }
        case 'hw_hold':    return { ...s, hold: !s.hold }
        case 'hw_backlight': return { ...s, backlight: Math.min(5, s.backlight + 1) }
        case 'ct_heat_offset': return { ...s, heatOffset: Math.min(9, s.heatOffset + 1) }
        case 'ct_cool_offset': return { ...s, coolOffset: Math.min(9, s.coolOffset + 1) }
        case 'ct_swing':   return { ...s, swing: Math.min(3, s.swing + 1) }
        case 'ct_id':      return { ...s, unitId: Math.min(99, s.unitId + 1) }
        default:           return s
      }
    })
  }, [screen])

  const handleDown = useCallback(() => {
    triggerFlash()
    setState(s => {
      switch (screen) {
        case 'home':
        case 'set_temp':   return { ...s, setTemp: Math.max(40, s.setTemp - 1) }
        case 'mode': {
          const order: Mode[] = ['heat', 'cool', 'auto', 'off']
          return { ...s, mode: order[(order.indexOf(s.mode) + 3) % order.length] }
        }
        case 'fan':        return { ...s, fan: s.fan === 'auto' ? 'on' : 'auto' }
        case 'hw_schedule': return { ...s, schedule: !s.schedule }
        case 'hw_hold':    return { ...s, hold: !s.hold }
        case 'hw_backlight': return { ...s, backlight: Math.max(1, s.backlight - 1) }
        case 'ct_heat_offset': return { ...s, heatOffset: Math.max(-9, s.heatOffset - 1) }
        case 'ct_cool_offset': return { ...s, coolOffset: Math.max(-9, s.coolOffset - 1) }
        case 'ct_swing':   return { ...s, swing: Math.max(1, s.swing - 1) }
        case 'ct_id':      return { ...s, unitId: Math.max(1, s.unitId - 1) }
        default:           return s
      }
    })
  }, [screen])

  const handleMenu = useCallback(() => {
    triggerFlash()
    if (navLevel === 'normal') {
      const normalScreens: Screen[] = ['home', 'set_temp', 'mode', 'fan']
      const idx = normalScreens.indexOf(screen)
      if (idx >= 0) {
        setScreen(normalScreens[(idx + 1) % normalScreens.length])
      } else {
        setScreen('home')
        setNavLevel('normal')
      }
    } else if (navLevel === 'homeowner') {
      const idx = HW_SCREENS.indexOf(screen)
      if (idx >= 0) {
        setScreen(HW_SCREENS[(idx + 1) % HW_SCREENS.length])
      }
    } else if (navLevel === 'contractor') {
      const idx = CT_SCREENS.indexOf(screen)
      if (idx >= 0) {
        if (idx === CT_SCREENS.length - 1) {
          setScreen('home')
          setNavLevel('normal')
        } else {
          setScreen(CT_SCREENS[(idx + 1) % CT_SCREENS.length])
        }
      }
    }
  }, [screen, navLevel])

  const handleMenuLong = useCallback(() => {
    triggerFlash()
    if (navLevel === 'normal') {
      setNavLevel('homeowner')
      setScreen(HW_SCREENS[0])
    } else if (navLevel === 'homeowner') {
      setNavLevel('contractor')
      setScreen(CT_SCREENS[0])
    } else {
      setNavLevel('normal')
      setScreen('home')
    }
  }, [navLevel])

  const display = getDisplay(screen, state)

  const segColor = state.mode === 'heat' ? '#F2411B'
                 : state.mode === 'cool' ? '#4A90D9'
                 : '#e8e0d0'

  const levelColor = navLevel === 'contractor' ? '#F2411B'
                   : navLevel === 'homeowner'  ? 'rgba(255,255,255,0.5)'
                   : 'rgba(255,255,255,0.15)'

  return (
    <div style={{
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0,
      userSelect: 'none',
    }}>
      <div style={{
        background: '#0a0a0a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '28px 32px 24px',
        width: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
        boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 24px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
          borderRadius: 16,
        }} />

        <div style={{
          background: '#050505',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 8,
          padding: '16px 20px 14px',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10,
          boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.8)',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: levelColor,
            transition: 'color 300ms ease',
            height: 14,
          }}>
            {display.label}
          </div>

          <div style={{
            opacity: flash ? 0.3 : 1,
            transition: flash ? 'none' : 'opacity 80ms ease',
          }}>
            <SegDisplay chars={display.chars} color={segColor} />
          </div>

          {(screen === 'home' || screen === 'set_temp') && (
            <div style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: 10,
              color: segColor + '88',
              letterSpacing: '0.06em',
              marginTop: -6,
            }}>
              °F
            </div>
          )}

          <div style={{
            fontFamily: 'var(--font-mono, monospace)',
            fontSize: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.2)',
            textAlign: 'center',
            lineHeight: 1.5,
          }}>
            {display.sub}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {(['heat', 'cool', 'auto', 'off'] as Mode[]).map(m => (
            <div key={m} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: state.mode === m
                ? (m === 'cool' ? '#4A90D9' : '#F2411B')
                : 'rgba(255,255,255,0.1)',
              transition: 'background 200ms ease',
              boxShadow: state.mode === m
                ? `0 0 6px ${m === 'cool' ? '#4A90D9' : '#F2411B'}`
                : 'none',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, width: '100%' }}>
          <Button label="▲" sub="UP" onPress={handleUp} />
          <Button label="▼" sub="DN" onPress={handleDown} />
          <Button
            label="●"
            sub={navLevel === 'normal' ? 'MENU' : navLevel === 'homeowner' ? 'H.SET' : 'C.CFG'}
            onPress={handleMenu}
            onLongPress={handleMenuLong}
            active={navLevel !== 'normal'}
          />
        </div>

        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['normal', 'homeowner', 'contractor'].map(l => (
            <div key={l} style={{
              width: navLevel === l ? 16 : 4,
              height: 2,
              borderRadius: 1,
              background: navLevel === l
                ? (l === 'contractor' ? '#F2411B' : 'rgba(255,255,255,0.5)')
                : 'rgba(255,255,255,0.1)',
              transition: 'all 300ms ease',
            }} />
          ))}
        </div>
      </div>

      <div style={{
        marginTop: 16,
        fontFamily: 'var(--font-mono, monospace)',
        fontSize: 9,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'center',
        lineHeight: 1.8,
      }}>
        <div>▲ ▼ change value · ● advance menu</div>
        <div>hold ● → homeowner settings</div>
        <div>hold ● again → contractor config</div>
      </div>
    </div>
  )
}
