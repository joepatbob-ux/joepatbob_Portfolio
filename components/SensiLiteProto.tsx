// components/SensiLiteProto.tsx
// Interactive prototype of the Sensi Lite 32-segment display thermostat
// Visual layer from Figma; navigation logic unchanged.

'use client'

import { useState, useRef, useCallback, type CSSProperties, type ReactNode } from 'react'

const DESIGN_WIDTH = 240
const DESIGN_HEIGHT = 147

// LCD window on the frame (design px → % of stage)
const SCREEN_LEFT = `${(82 / DESIGN_WIDTH) * 100}%`
const SCREEN_TOP = `${(36 / DESIGN_HEIGHT) * 100}%`
const SCREEN_WIDTH = `${(75 / DESIGN_WIDTH) * 100}%`
const SCREEN_HEIGHT = `${(75 / DESIGN_HEIGHT) * 100}%`

// ── LOCAL SVG ASSETS (public/images/sensi-lite/) ───────────────────────────────
const asset = (name: string) => `/images/sensi-lite/${name}.svg`

const imgLiteFrame = asset('lite-frame')
const imgButtons = asset('lite-buttons')
const imgType = asset('lite-type')

// One SVG set per segment (a–g); shared by tens and ones digits
const SEGMENT_SRCS = [
  asset('segment-a'),
  asset('segment-b'),
  asset('segment-c'),
  asset('segment-d'),
  asset('segment-e'),
  asset('segment-f'),
  asset('segment-g'),
]

const imgCool = asset('icon-cool')
const imgHeat = asset('icon-heat')
const imgAux = asset('icon-aux')
const imgOff = asset('icon-off')
const imgOn = asset('icon-on')
const imgFan = asset('icon-fan')
const imgWiFi = asset('icon-wifi')
const imgCloud = asset('icon-cloud')
const imgSensor = asset('icon-sensor')
const imgIndoor = asset('icon-indoor')
const imgOutdoor = asset('icon-outdoor')
const imgCallForService = asset('icon-service')
const imgReplaceBattery = asset('icon-replace-battery')
const imgSavingsEvent = asset('icon-savings-event')
const imgSetTo = asset('icon-set-to')
const imgSetup = asset('icon-setup')
const imgPercent = asset('icon-percent')
const imgLock = asset('icon-lock')

// ── 7-SEGMENT ENCODING ────────────────────────────────────────────────────────
const SEG7: Record<string, boolean[]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
  '-': [false, false, false, false, false, false, true],
  ' ': [false, false, false, false, false, false, false],
  'E': [true, false, false, true, true, true, true],
  'r': [false, false, false, false, true, false, true],
  'n': [false, false, true, false, true, false, true],
  'o': [false, false, true, true, true, false, true],
  'F': [true, false, false, false, true, true, true],
  'H': [false, true, true, false, true, true, true],
  'L': [false, false, false, true, true, true, false],
  'A': [true, true, true, false, true, true, true],
  'C': [true, false, false, true, true, true, false],
  'P': [true, true, false, false, true, true, true],
  'U': [false, true, true, true, true, true, false],
  'd': [false, true, true, true, true, false, true],
}

// Segment positions on 25×47 digit canvas (matches exported SVG artboards)
// a,d,g = 21–22×7 · b,c,e,f = 7×22
const SEGMENT_BOX: CSSProperties[] = [
  { top: '0%', left: '8%', width: '84%', height: '14.9%' }, // a
  { top: '10.6%', left: '72%', width: '28%', height: '46.8%' }, // b
  { top: '53.2%', left: '72%', width: '28%', height: '46.8%' }, // c
  { top: '85.1%', left: '8%', width: '84%', height: '14.9%' }, // d
  { top: '53.2%', left: '0%', width: '28%', height: '46.8%' }, // e
  { top: '10.6%', left: '0%', width: '28%', height: '46.8%' }, // f
  { top: '42.6%', left: '6%', width: '88%', height: '14.9%' }, // g
]

const DIGIT_ASPECT = `${25} / ${47}`
const DIGIT_ROW_HEIGHT = `${(47 / 75) * 100}%` // 47px tall in 75px LCD
const DIGIT_GAP = `${(2 / 52) * 100}%` // 2px gap in ~52px display row

// ── NAVIGATION TYPES (existing logic) ─────────────────────────────────────────
type Mode = 'heat' | 'cool' | 'auto' | 'off'
type Fan = 'auto' | 'on'
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
  setTemp: number
  mode: Mode
  fan: Fan
  schedule: boolean
  hold: boolean
  backlight: number
  heatOffset: number
  coolOffset: number
  swing: number
  unitId: number
}

export interface SensiLiteProtoProps {
  temperature: number
  mode: 'cool' | 'heat' | 'aux' | 'off'
  fanActive?: boolean
  wifiConnected?: boolean
  cloudConnected?: boolean
  sensorActive?: boolean
  replaceBattery?: boolean
  callForService?: boolean
  savingsEvent?: boolean
  onUp?: () => void
  onDown?: () => void
  onMenu?: () => void
}

const HW_SCREENS: Screen[] = ['hw_schedule', 'hw_hold', 'hw_backlight']
const CT_SCREENS: Screen[] = ['ct_heat_offset', 'ct_cool_offset', 'ct_swing', 'ct_id']

// ── RESPONSIVE STAGE ───────────────────────────────────────────────────────────
function ProtoStage({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 480,
        margin: '0 auto',
        aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}`,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>{children}</div>
    </div>
  )
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function inset(top: string, right: string, bottom: string, left: string): CSSProperties {
  return { position: 'absolute', top, right, bottom, left }
}

function Layer({
  src,
  box,
  active = true,
  alt = '',
}: {
  src: string
  box: CSSProperties
  active?: boolean
  alt?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        ...box,
        opacity: active ? 1 : 0.1,
        transition: 'opacity 80ms ease',
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}

function getDisplay(screen: Screen, state: State): { chars: string } {
  switch (screen) {
    case 'home':
      return { chars: String(state.currentTemp).padStart(2, ' ') }
    case 'set_temp':
      return { chars: String(state.setTemp).padStart(2, ' ') }
    case 'mode': {
      const modeChars: Record<Mode, string> = { heat: 'HE', cool: 'Co', auto: 'Au', off: 'oF' }
      return { chars: modeChars[state.mode] }
    }
    case 'fan':
      return { chars: state.fan === 'auto' ? 'FA' : 'Fn' }
    case 'hw_schedule':
      return { chars: state.schedule ? 'on' : 'oF' }
    case 'hw_hold':
      return { chars: state.hold ? 'HL' : 'no' }
    case 'hw_backlight':
      return { chars: ` ${state.backlight}` }
    case 'ct_heat_offset': {
      const ho = state.heatOffset
      return { chars: ho >= 0 ? ` ${ho}` : `-${Math.abs(ho)}` }
    }
    case 'ct_cool_offset': {
      const co = state.coolOffset
      return { chars: co >= 0 ? ` ${co}` : `-${Math.abs(co)}` }
    }
    case 'ct_swing':
      return { chars: ` ${state.swing}` }
    case 'ct_id':
      return { chars: String(state.unitId).padStart(2, '0') }
  }
}

function toScreenMode(mode: Mode): SensiLiteProtoProps['mode'] {
  if (mode === 'auto') return 'aux'
  return mode
}

function Digit({ char, segmentSrcs }: { char: string; segmentSrcs: string[] }) {
  const segs = SEG7[char] ?? SEG7[' ']
  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        aspectRatio: DIGIT_ASPECT,
        flex: '0 0 auto',
      }}
    >
      {segmentSrcs.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            ...SEGMENT_BOX[i],
            opacity: segs[i] ? 1 : 0.1,
            transition: 'opacity 80ms ease',
            objectFit: 'contain',
            objectPosition: 'center',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}

// ── LITE SCREEN ───────────────────────────────────────────────────────────────
export function LiteScreen({
  temperature,
  mode,
  fanActive = false,
  wifiConnected = true,
  cloudConnected = false,
  sensorActive = false,
  replaceBattery = false,
  callForService = false,
  savingsEvent = false,
  displayChars,
  flash = false,
}: SensiLiteProtoProps & { displayChars?: string; flash?: boolean }) {
  const chars = (displayChars ?? String(Math.min(99, Math.max(0, temperature))).padStart(2, ' ')).slice(0, 2)
  const tens = chars[0]
  const ones = chars[1]

  const showSetTo = displayChars !== undefined && !/^\d{2}$/.test(displayChars.trim())
  const showPercent = screenShowsPercent(displayChars)

  return (
    <div
      style={{
        position: 'absolute',
        left: SCREEN_LEFT,
        top: SCREEN_TOP,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        background: '#000',
        borderRadius: '4%',
        boxShadow: 'inset 0px 0px 10px 0px rgba(255,255,255,0.17)',
        overflow: 'hidden',
        opacity: flash ? 0.35 : 1,
        transition: flash ? 'none' : 'opacity 80ms ease',
      }}
    >
      {/* Status icons — always mounted */}
      <Layer src={imgCool} box={inset('32.68%', '2.29%', '55.75%', '87.47%')} active={mode === 'cool'} />
      <Layer src={imgHeat} box={inset('46.62%', '3.24%', '41.76%', '88.27%')} active={mode === 'heat'} />
      <Layer src={imgAux} box={inset('60.16%', '1.51%', '33.29%', '86.93%')} active={mode === 'aux'} />
      <Layer src={imgOff} box={inset('67.68%', '1.51%', '25.77%', '86.93%')} active={mode === 'off'} />
      <Layer src={imgOn} box={inset('76%', '2.67%', '19.2%', '87.73%')} active={mode !== 'off'} />
      <Layer src={imgFan} box={inset('20%', '87.42%', '70.07%', '2.67%')} active={fanActive} />
      <Layer src={imgWiFi} box={inset('43.26%', '86.92%', '49.76%', '3.22%')} active={wifiConnected} />
      <Layer src={imgCloud} box={inset('48%', '95.36%', '48.69%', '1.33%')} active={cloudConnected} />
      <Layer src={imgSensor} box={inset('53.33%', '87.17%', '39.81%', '2.67%')} active={sensorActive} />
      <Layer src={imgLock} box={inset('62%', '87%', '28%', '3%')} active={false} />
      <Layer src={imgIndoor} box={inset('4%', '19.03%', '91.34%', '55.74%')} active={false} />
      <Layer src={imgOutdoor} box={inset('4.01%', '46.35%', '91.33%', '21.33%')} active={false} />
      <Layer
        src={imgCallForService}
        box={inset('86.67%', '66.67%', '4%', '9.33%')}
        active={callForService}
      />
      <Layer
        src={imgReplaceBattery}
        box={inset('86.67%', '9.33%', '4%', '66.67%')}
        active={replaceBattery}
      />
      <Layer src={imgSavingsEvent} box={inset('86.67%', '36%', '4%', '36%')} active={savingsEvent} />
      <Layer src={imgSetTo} box={inset('10.67%', '36%', '83.33%', '37.33%')} active={showSetTo} />
      <Layer src={imgSetup} box={inset('2.67%', '80%', '90.67%', '2.67%')} active={false} />
      <Layer src={imgPercent} box={inset('19.6%', '3%', '71.63%', '88.25%')} active={showPercent} />

      {/* Two-digit 7-segment display (25×47 per digit, 2px gap) */}
      <div
        style={{
          position: 'absolute',
          left: '16%',
          right: '14.67%',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: DIGIT_GAP,
          height: DIGIT_ROW_HEIGHT,
        }}
      >
        <Digit char={tens} segmentSrcs={SEGMENT_SRCS} />
        <Digit char={ones} segmentSrcs={SEGMENT_SRCS} />
      </div>
    </div>
  )
}

function screenShowsPercent(chars?: string): boolean {
  if (!chars) return false
  return chars.includes('%') || chars.trim() === 'FA' || chars.trim() === 'Fn'
}

// ── LITE FRAME ────────────────────────────────────────────────────────────────
function LiteFrame({
  onUp,
  onDown,
  onMenu,
  onMenuLong,
}: {
  onUp?: () => void
  onDown?: () => void
  onMenu?: () => void
  onMenuLong?: () => void
}) {
  const menuTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuFiredRef = useRef(false)

  const menuStart = useCallback(() => {
    menuFiredRef.current = false
    if (onMenuLong) {
      menuTimerRef.current = setTimeout(() => {
        menuFiredRef.current = true
        onMenuLong()
      }, 700)
    }
  }, [onMenuLong])

  const menuEnd = useCallback(() => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current)
    if (!menuFiredRef.current) onMenu?.()
  }, [onMenu])

  const hitBase: CSSProperties = {
    position: 'absolute',
    left: 0,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    padding: 0,
    margin: 0,
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <img
        src={imgLiteFrame}
        alt=""
        draggable={false}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'fill' }}
      />
      <img
        src={imgType}
        alt="Sensi"
        draggable={false}
        style={{
          position: 'absolute',
          top: '5.44%',
          right: '40.44%',
          bottom: '79.32%',
          left: '40.89%',
          objectFit: 'contain',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '26.53%',
          right: '15.42%',
          bottom: '25.85%',
          left: '77.92%',
        }}
      >
        <img
          src={imgButtons}
          alt=""
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <button type="button" aria-label="Up" style={{ ...hitBase, top: 0, height: '33.33%' }} onClick={onUp} />
        <button
          type="button"
          aria-label="Menu"
          style={{ ...hitBase, top: '33.33%', height: '33.34%' }}
          onMouseDown={menuStart}
          onMouseUp={menuEnd}
          onMouseLeave={() => {
            if (menuTimerRef.current) clearTimeout(menuTimerRef.current)
          }}
          onTouchStart={menuStart}
          onTouchEnd={menuEnd}
        />
        <button
          type="button"
          aria-label="Down"
          style={{ ...hitBase, top: '66.67%', height: '33.33%' }}
          onClick={onDown}
        />
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function SensiLiteProto() {
  const [screen, setScreen] = useState<Screen>('home')
  const [navLevel, setNavLevel] = useState<'normal' | 'homeowner' | 'contractor'>('normal')
  const [state, setState] = useState<State>({
    currentTemp: 72,
    setTemp: 70,
    mode: 'cool',
    fan: 'auto',
    schedule: true,
    hold: false,
    backlight: 3,
    heatOffset: 0,
    coolOffset: 0,
    swing: 2,
    unitId: 1,
  })
  const [flash, setFlash] = useState(false)

  const triggerFlash = () => {
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
  }

  const handleUp = useCallback(() => {
    triggerFlash()
    setState((s) => {
      switch (screen) {
        case 'home':
        case 'set_temp':
          return { ...s, setTemp: Math.min(99, s.setTemp + 1) }
        case 'mode': {
          const order: Mode[] = ['heat', 'cool', 'auto', 'off']
          return { ...s, mode: order[(order.indexOf(s.mode) + 1) % order.length] }
        }
        case 'fan':
          return { ...s, fan: s.fan === 'auto' ? 'on' : 'auto' }
        case 'hw_schedule':
          return { ...s, schedule: !s.schedule }
        case 'hw_hold':
          return { ...s, hold: !s.hold }
        case 'hw_backlight':
          return { ...s, backlight: Math.min(5, s.backlight + 1) }
        case 'ct_heat_offset':
          return { ...s, heatOffset: Math.min(9, s.heatOffset + 1) }
        case 'ct_cool_offset':
          return { ...s, coolOffset: Math.min(9, s.coolOffset + 1) }
        case 'ct_swing':
          return { ...s, swing: Math.min(3, s.swing + 1) }
        case 'ct_id':
          return { ...s, unitId: Math.min(99, s.unitId + 1) }
        default:
          return s
      }
    })
  }, [screen])

  const handleDown = useCallback(() => {
    triggerFlash()
    setState((s) => {
      switch (screen) {
        case 'home':
        case 'set_temp':
          return { ...s, setTemp: Math.max(40, s.setTemp - 1) }
        case 'mode': {
          const order: Mode[] = ['heat', 'cool', 'auto', 'off']
          return { ...s, mode: order[(order.indexOf(s.mode) + 3) % order.length] }
        }
        case 'fan':
          return { ...s, fan: s.fan === 'auto' ? 'on' : 'auto' }
        case 'hw_schedule':
          return { ...s, schedule: !s.schedule }
        case 'hw_hold':
          return { ...s, hold: !s.hold }
        case 'hw_backlight':
          return { ...s, backlight: Math.max(1, s.backlight - 1) }
        case 'ct_heat_offset':
          return { ...s, heatOffset: Math.max(-9, s.heatOffset - 1) }
        case 'ct_cool_offset':
          return { ...s, coolOffset: Math.max(-9, s.coolOffset - 1) }
        case 'ct_swing':
          return { ...s, swing: Math.max(1, s.swing - 1) }
        case 'ct_id':
          return { ...s, unitId: Math.max(1, s.unitId - 1) }
        default:
          return s
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
  const screenMode = toScreenMode(state.mode)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        width: '100%',
        userSelect: 'none',
      }}
    >
      <ProtoStage>
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <LiteFrame onUp={handleUp} onDown={handleDown} onMenu={handleMenu} onMenuLong={handleMenuLong} />
          <LiteScreen
            temperature={state.currentTemp}
            mode={screenMode}
            fanActive={state.fan === 'on'}
            wifiConnected
            cloudConnected={navLevel !== 'normal'}
            sensorActive={false}
            replaceBattery={false}
            callForService={false}
            savingsEvent={false}
            displayChars={display.chars}
            flash={flash}
          />
        </div>
      </ProtoStage>

      <div
        style={{
          marginTop: 16,
          alignSelf: 'center',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.25)',
          textAlign: 'center',
          lineHeight: 1.8,
        }}
      >
        <div>▲ ▼ change value · ● advance menu</div>
        <div>hold ● → homeowner settings</div>
        <div>hold ● again → contractor config</div>
      </div>
    </div>
  )
}
