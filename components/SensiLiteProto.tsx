// components/SensiLiteProto.tsx
// Sensi Lite — setpoint prototype (heat / cool / off, 2° deadband)

'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { FRAME_HEIGHT, FRAME_LOGO, FRAME_WIDTH, type FrameRect } from '@/lib/sensi-lite/frame-layout'
import { LCD_DIGITS, LCD_ICONS, LCD_SIZE, type LcdRect } from '@/lib/sensi-lite/lcd-layout'

const DESIGN_WIDTH = 240
const DESIGN_HEIGHT = 147

const SCREEN_LEFT = `${(82 / DESIGN_WIDTH) * 100}%`
const SCREEN_TOP = `${(36 / DESIGN_HEIGHT) * 100}%`
const SCREEN_WIDTH = `${(75 / DESIGN_WIDTH) * 100}%`
const SCREEN_HEIGHT = `${(75 / DESIGN_HEIGHT) * 100}%`

const DEADBAND = 2
const TEMP_MIN = 40
const TEMP_MAX = 99
const DISPLAY_TEMP = 72
const SETPOINT_IDLE_MS = 3000

const ICON_INACTIVE = 0.05

const asset = (name: string) => `/images/sensi-lite/${name}.svg`

const imgLiteFrame = asset('lite-frame')
const imgButtons = asset('lite-buttons')
const imgType = asset('lite-type')
const imgScreen = asset('screen')

const imgCool = asset('icon-cool')
const imgHeat = asset('icon-heat')
const imgOff = asset('icon-off')
const imgOn = asset('icon-on')
const imgSetTo = asset('icon-set-to')

const DIGIT_SRC: Record<number, string> = {
  0: asset('digit-0'),
  1: asset('digit-1'),
  2: asset('digit-2'),
  3: asset('digit-3'),
  4: asset('digit-4'),
  5: asset('digit-5'),
  6: asset('digit-6'),
  7: asset('digit-7'),
  8: asset('digit-8'),
  9: asset('digit-9'),
}

type Mode = 'heat' | 'cool' | 'off'
const MODES: Mode[] = ['heat', 'cool', 'off']

interface ThermostatState {
  mode: Mode
  heatTo: number
  coolTo: number
}

function clampTemp(value: number): number {
  return Math.min(TEMP_MAX, Math.max(TEMP_MIN, Math.round(value)))
}

/** coolTo must stay at least DEADBAND above heatTo (within TEMP_MIN..TEMP_MAX) */
function enforceDeadband(
  heatTo: number,
  coolTo: number,
  preferred: 'heat' | 'cool',
): Pick<ThermostatState, 'heatTo' | 'coolTo'> {
  let heat = clampTemp(heatTo)
  let cool = clampTemp(coolTo)

  if (cool >= heat + DEADBAND) {
    return { heatTo: heat, coolTo: cool }
  }

  if (preferred === 'heat') {
    cool = clampTemp(heat + DEADBAND)
    if (cool < heat + DEADBAND) {
      heat = clampTemp(cool - DEADBAND)
    }
  } else {
    heat = clampTemp(cool - DEADBAND)
    if (cool < heat + DEADBAND) {
      cool = clampTemp(heat + DEADBAND)
    }
  }

  return { heatTo: heat, coolTo: cool }
}

function adjustHeatSetpoint(
  heatTo: number,
  coolTo: number,
  delta: number,
): Pick<ThermostatState, 'heatTo' | 'coolTo'> {
  return enforceDeadband(clampTemp(heatTo + delta), coolTo, 'heat')
}

function adjustCoolSetpoint(
  heatTo: number,
  coolTo: number,
  delta: number,
): Pick<ThermostatState, 'heatTo' | 'coolTo'> {
  return enforceDeadband(heatTo, clampTemp(coolTo + delta), 'cool')
}

function nextMode(mode: Mode): Mode {
  const i = MODES.indexOf(mode)
  return MODES[(i + 1) % MODES.length]
}

function lcdRectStyle(rect: LcdRect): CSSProperties {
  return {
    position: 'absolute',
    left: `${(rect.x / LCD_SIZE) * 100}%`,
    top: `${(rect.y / LCD_SIZE) * 100}%`,
    width: `${(rect.w / LCD_SIZE) * 100}%`,
    height: `${(rect.h / LCD_SIZE) * 100}%`,
  }
}

function frameRectStyle(rect: FrameRect): CSSProperties {
  return {
    position: 'absolute',
    left: `${(rect.x / FRAME_WIDTH) * 100}%`,
    top: `${(rect.y / FRAME_HEIGHT) * 100}%`,
    width: `${(rect.w / FRAME_WIDTH) * 100}%`,
    height: `${(rect.h / FRAME_HEIGHT) * 100}%`,
  }
}

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

function LcdIcon({
  src,
  rect,
  active = false,
  alt = '',
}: {
  src: string
  rect: LcdRect
  active?: boolean
  alt?: string
}) {
  return (
    <img
      src={src}
      alt={alt}
      draggable={false}
      style={{
        ...lcdRectStyle(rect),
        opacity: active ? 1 : ICON_INACTIVE,
        transition: 'opacity 80ms ease',
        objectFit: 'fill',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  )
}

function TempDigits({ value }: { value: number }) {
  const clamped = clampTemp(value)
  const tens = Math.floor(clamped / 10)
  const ones = clamped % 10
  const digitBase: CSSProperties = {
    objectFit: 'fill',
    pointerEvents: 'none',
  }

  return (
    <>
      <img
        src={DIGIT_SRC[tens]}
        alt=""
        draggable={false}
        style={{ ...lcdRectStyle(LCD_DIGITS.tens), ...digitBase }}
      />
      <img
        src={DIGIT_SRC[ones]}
        alt=""
        draggable={false}
        style={{ ...lcdRectStyle(LCD_DIGITS.ones), ...digitBase }}
      />
    </>
  )
}

export function LiteScreen({
  mode,
  lcdTemp,
  showSetTo,
  onActive,
  flash = false,
}: {
  mode: Mode
  lcdTemp: number
  showSetTo: boolean
  onActive: boolean
  flash?: boolean
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: SCREEN_LEFT,
        top: SCREEN_TOP,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        background: 'transparent',
        overflow: 'visible',
        opacity: flash ? 0.35 : 1,
        transition: flash ? 'none' : 'opacity 80ms ease',
      }}
    >
      <img
        src={imgScreen}
        alt=""
        draggable={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />

      <TempDigits value={lcdTemp} />

      <LcdIcon src={imgSetTo} rect={LCD_ICONS.setTo} active={showSetTo} />
      <LcdIcon src={imgCool} rect={LCD_ICONS.cool} active={mode === 'cool'} />
      <LcdIcon src={imgHeat} rect={LCD_ICONS.heat} active={mode === 'heat'} />
      <LcdIcon src={imgOff} rect={LCD_ICONS.off} active={mode === 'off'} />
      <LcdIcon src={imgOn} rect={LCD_ICONS.on} active={onActive} />
    </div>
  )
}

function LiteFrame({
  onUp,
  onDown,
  onMenu,
}: {
  onUp?: () => void
  onDown?: () => void
  onMenu?: () => void
}) {
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
          ...frameRectStyle(FRAME_LOGO),
          objectFit: 'fill',
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
        <button type="button" aria-label="Menu" style={{ ...hitBase, top: '33.33%', height: '33.34%' }} onClick={onMenu} />
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

export function SensiLiteProto() {
  const [state, setState] = useState<ThermostatState>({
    mode: 'cool',
    heatTo: 68,
    coolTo: 75,
  })
  const [editingSetpoint, setEditingSetpoint] = useState(false)
  const [flash, setFlash] = useState(false)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearIdleTimer = useCallback(() => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current)
      idleTimerRef.current = null
    }
  }, [])

  const startSetpointIdleTimer = useCallback(() => {
    clearIdleTimer()
    idleTimerRef.current = setTimeout(() => {
      setEditingSetpoint(false)
      idleTimerRef.current = null
    }, SETPOINT_IDLE_MS)
  }, [clearIdleTimer])

  const beginSetpointEdit = useCallback(() => {
    setEditingSetpoint(true)
    startSetpointIdleTimer()
  }, [startSetpointIdleTimer])

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer])

  const triggerFlash = useCallback(() => {
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
  }, [])

  const handleUp = useCallback(() => {
    if (state.mode === 'off') return
    triggerFlash()
    beginSetpointEdit()
    setState((s) => {
      if (s.mode === 'heat') {
        const next = adjustHeatSetpoint(s.heatTo, s.coolTo, 1)
        return { ...s, ...next }
      }
      if (s.mode === 'cool') {
        const next = adjustCoolSetpoint(s.heatTo, s.coolTo, 1)
        return { ...s, ...next }
      }
      return s
    })
  }, [state.mode, triggerFlash, beginSetpointEdit])

  const handleDown = useCallback(() => {
    if (state.mode === 'off') return
    triggerFlash()
    beginSetpointEdit()
    setState((s) => {
      if (s.mode === 'heat') {
        const next = adjustHeatSetpoint(s.heatTo, s.coolTo, -1)
        return { ...s, ...next }
      }
      if (s.mode === 'cool') {
        const next = adjustCoolSetpoint(s.heatTo, s.coolTo, -1)
        return { ...s, ...next }
      }
      return s
    })
  }, [state.mode, triggerFlash, beginSetpointEdit])

  const handleMenu = useCallback(() => {
    triggerFlash()
    setState((s) => ({ ...s, mode: nextMode(s.mode) }))
  }, [triggerFlash])

  const showSetTo = editingSetpoint && state.mode !== 'off'

  const lcdTemp =
    showSetTo && state.mode === 'heat'
      ? state.heatTo
      : showSetTo && state.mode === 'cool'
        ? state.coolTo
        : DISPLAY_TEMP

  const onActive =
    state.mode === 'heat'
      ? state.heatTo > DISPLAY_TEMP
      : state.mode === 'cool'
        ? state.coolTo < DISPLAY_TEMP
        : false

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
          <LiteFrame onUp={handleUp} onDown={handleDown} onMenu={handleMenu} />
          <LiteScreen
            mode={state.mode}
            lcdTemp={lcdTemp}
            showSetTo={showSetTo}
            onActive={onActive}
            flash={flash}
          />
        </div>
      </ProtoStage>

      <p
        style={{
          marginTop: 16,
          alignSelf: 'center',
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 9,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--color-muted)',
          textAlign: 'center',
          lineHeight: 1.8,
        }}
      >
        <span style={{ display: 'block' }}>▲ ▼ setpoint · ● heat / cool / off</span>
        <span style={{ display: 'block' }}>
          Room {DISPLAY_TEMP}° · Heat {state.heatTo}° · Cool {state.coolTo}° · {DEADBAND}° min gap
        </span>
      </p>
    </div>
  )
}
