// components/SensiLiteProto.tsx
// Interactive prototype of the Sensi Lite 32-segment display thermostat
// Visual layer from Figma; navigation logic unchanged.

'use client'

import { useState, useRef, useCallback, type CSSProperties } from 'react'

// ── FIGMA ASSETS ──────────────────────────────────────────────────────────────
const imgLiteFrame = 'https://www.figma.com/api/mcp/asset/04f7bce2-0077-419e-9f93-44b61e834989'
const imgButtons = 'https://www.figma.com/api/mcp/asset/ed5a3a38-1c69-4949-99ad-5d7b316fe9cc'
const imgType = 'https://www.figma.com/api/mcp/asset/a68bedf5-e422-4779-b4f6-a18786e54789'

const imgVector = 'https://www.figma.com/api/mcp/asset/80e968c6-f3fa-4f99-b187-974c434d328e'
const imgVector1 = 'https://www.figma.com/api/mcp/asset/f80b345e-15e5-4d3f-8eea-17bb7e69bfff'
const imgVector2 = 'https://www.figma.com/api/mcp/asset/b1129319-8503-450b-b8cc-672e2333fcf3'
const imgVector3 = 'https://www.figma.com/api/mcp/asset/827d4293-6154-436e-978e-1ff8c14a3cff'
const imgVector4 = 'https://www.figma.com/api/mcp/asset/779ef75b-5d1b-479f-a3a5-d3b3ff86a7fb'
const imgVector5 = 'https://www.figma.com/api/mcp/asset/67e1fc61-5985-41b6-8032-3fcbbb09aa5b'
const imgVector6 = 'https://www.figma.com/api/mcp/asset/fcccefe9-242c-45d0-a02e-5180b1c458a8'
const imgVector7 = 'https://www.figma.com/api/mcp/asset/775e68e9-4944-4f43-b272-27aa6513cafb'
const imgVector8 = 'https://www.figma.com/api/mcp/asset/c985a3d1-f434-4807-8594-0561c8a47ba5'
const imgVector9 = 'https://www.figma.com/api/mcp/asset/2c667a71-5697-46ce-b96d-87307eacfa9b'
const imgVector10 = 'https://www.figma.com/api/mcp/asset/d0ffa719-ca41-4dea-9cf9-6fd09669d00f'
const imgVector11 = 'https://www.figma.com/api/mcp/asset/1c696ae3-237a-41b3-a829-4dded201150f'
const imgCool = 'https://www.figma.com/api/mcp/asset/12b0424b-406b-4b49-87d9-36e07d5b9838'
const imgHeat = 'https://www.figma.com/api/mcp/asset/7e2c2029-ab9a-49df-a1c2-ce39e530abfc'
const imgAux = 'https://www.figma.com/api/mcp/asset/090baa95-9d1b-442d-acf1-e4285786c1e1'
const imgOff = 'https://www.figma.com/api/mcp/asset/e1e4baf9-f6c6-4b8c-b0ae-6676d9f060be'
const imgOn = 'https://www.figma.com/api/mcp/asset/adf28b6e-6422-4332-9351-29367036c51f'
const imgFan = 'https://www.figma.com/api/mcp/asset/3dde5a85-ca19-41be-8093-92e081f41820'
const imgWiFi = 'https://www.figma.com/api/mcp/asset/1dd3d8a1-384c-437f-812b-0cd4b792d243'
const imgCloud = 'https://www.figma.com/api/mcp/asset/226c2dd3-6d11-4839-bfac-926f6745f161'
const imgSensor = 'https://www.figma.com/api/mcp/asset/7f81a61c-2a32-40ba-8584-5dbf6a4c05de'
const imgIndoor = 'https://www.figma.com/api/mcp/asset/f61e84e1-b9ab-4e4b-a76d-58493c954df2'
const imgOutdoor = 'https://www.figma.com/api/mcp/asset/06733123-3238-4ce8-b8a1-6918210f7bd2'
const imgCallForService = 'https://www.figma.com/api/mcp/asset/d5af332a-0b76-4b2d-abed-2001235fdbb9'
const imgReplaceBattery = 'https://www.figma.com/api/mcp/asset/85f3b41d-7124-4a28-b344-9e6155c11c39'
const imgSavingsEvent = 'https://www.figma.com/api/mcp/asset/d15bb682-c536-4d79-95bd-e88586115764'
const imgSetTo = 'https://www.figma.com/api/mcp/asset/7091b271-fa12-4ccf-8deb-5699ee96837d'
const imgSetup = 'https://www.figma.com/api/mcp/asset/c2a486b1-5642-4566-bc8a-b7adcbbe7b9c'
const imgPercent = 'https://www.figma.com/api/mcp/asset/645ebe82-d960-455a-906b-ea5dff9d2047'

const TENS_SEGMENT_SRCS = [imgVector, imgVector1, imgVector2, imgVector3, imgVector4, imgVector5, imgVector6]
const ONES_SEGMENT_SRCS = [imgVector7, imgVector8, imgVector9, imgVector10, imgVector11, imgVector6, imgVector5]

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

// Segment layout within each 25×47 digit (a–g)
const SEGMENT_BOX: CSSProperties[] = [
  { top: '2%', left: '12%', right: '12%', height: '14%' },
  { top: '16%', right: '2%', width: '14%', bottom: '52%' },
  { bottom: '16%', right: '2%', width: '14%', top: '52%' },
  { bottom: '2%', left: '12%', right: '12%', height: '14%' },
  { bottom: '16%', left: '2%', width: '14%', top: '52%' },
  { top: '16%', left: '2%', width: '14%', bottom: '52%' },
  { top: '46%', left: '12%', right: '12%', height: '12%' },
]

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
    <div style={{ position: 'relative', width: 25, height: 47, flexShrink: 0 }}>
      {segmentSrcs.map((src, i) => (
        <img
          key={i}
          src={src}
          alt=""
          draggable={false}
          style={{
            ...SEGMENT_BOX[i],
            opacity: segs[i] ? 1 : 0.1,
            transition: 'opacity 80ms ease',
            objectFit: 'fill',
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
        left: 82,
        top: 36,
        width: 75,
        height: 75,
        background: '#000',
        borderRadius: 3,
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
      <Layer src={imgIndoor} box={inset('4%', '19.03%', '91.34%', '55.74%')} active={false} />
      <Layer src={imgOutdoor} box={inset('4.01%', '46.35%', '91.33%', '21.33%')} active={false} />
      <Layer src={imgVector11} box={inset('69.33%', '88.7%', '22.94%', '5.33%')} active={false} />
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

      {/* Two-digit display */}
      <div
        style={{
          position: 'absolute',
          left: '16%',
          right: '14.67%',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          gap: 2,
          height: 47,
        }}
      >
        <Digit char={tens} segmentSrcs={TENS_SEGMENT_SRCS} />
        <Digit char={ones} segmentSrcs={ONES_SEGMENT_SRCS} />
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
    <div style={{ position: 'relative', width: 240, height: 147 }}>
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
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', width: 240, height: 147 }}>
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

      <div
        style={{
          marginTop: 16,
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
