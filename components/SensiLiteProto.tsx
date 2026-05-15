// components/SensiLiteProto.tsx
// Sensi Lite — setpoint prototype (heat / cool / off, 2° deadband)

'use client'

import { useState, useCallback, type CSSProperties, type ReactNode } from 'react'

const DESIGN_WIDTH = 240
const DESIGN_HEIGHT = 147

const SCREEN_LEFT = `${(82 / DESIGN_WIDTH) * 100}%`
const SCREEN_TOP = `${(36 / DESIGN_HEIGHT) * 100}%`
const SCREEN_WIDTH = `${(75 / DESIGN_WIDTH) * 100}%`
const SCREEN_HEIGHT = `${(75 / DESIGN_HEIGHT) * 100}%`

const LCD_W = 75
const DIGIT_W_PCT = `${(25 / LCD_W) * 100}%`
const DIGIT_H_PCT = `${(47 / LCD_W) * 100}%`
const DIGIT_TENS_LEFT = `${(12 / LCD_W) * 100}%`
const DIGIT_ONES_LEFT = `${(39 / LCD_W) * 100}%`
const DIGIT_TOP = `${(14 / LCD_W) * 100}%`

const DEADBAND = 2
const TEMP_MIN = 40
const TEMP_MAX = 99

const asset = (name: string) => `/images/sensi-lite/${name}.svg`

const imgLiteFrame = asset('lite-frame')
const imgButtons = asset('lite-buttons')
const imgType = asset('lite-type')
const imgFullScreenChrome = asset('full-screen-chrome')

const imgCool = asset('icon-cool')
const imgHeat = asset('icon-heat')
const imgOff = asset('icon-off')
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

const ICON_INACTIVE = 0.1

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

/** coolTo must stay at least DEADBAND above heatTo */
function adjustHeatSetpoint(
  heatTo: number,
  coolTo: number,
  delta: number,
): Pick<ThermostatState, 'heatTo' | 'coolTo'> {
  const nextHeat = clampTemp(heatTo + delta)
  let nextCool = coolTo
  if (nextCool < nextHeat + DEADBAND) {
    nextCool = clampTemp(nextHeat + DEADBAND)
  }
  return { heatTo: nextHeat, coolTo: nextCool }
}

function adjustCoolSetpoint(
  heatTo: number,
  coolTo: number,
  delta: number,
): Pick<ThermostatState, 'heatTo' | 'coolTo'> {
  const nextCool = clampTemp(coolTo + delta)
  let nextHeat = heatTo
  if (nextCool < nextHeat + DEADBAND) {
    nextHeat = clampTemp(nextCool - DEADBAND)
  }
  return { heatTo: nextHeat, coolTo: nextCool }
}

function nextMode(mode: Mode): Mode {
  const i = MODES.indexOf(mode)
  return MODES[(i + 1) % MODES.length]
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
        opacity: active ? 1 : ICON_INACTIVE,
        transition: 'opacity 80ms ease',
        objectFit: 'contain',
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
  const digitStyle: CSSProperties = {
    position: 'absolute',
    top: DIGIT_TOP,
    width: DIGIT_W_PCT,
    height: DIGIT_H_PCT,
    objectFit: 'contain',
    pointerEvents: 'none',
  }

  return (
    <>
      <img src={DIGIT_SRC[tens]} alt="" draggable={false} style={{ ...digitStyle, left: DIGIT_TENS_LEFT }} />
      <img src={DIGIT_SRC[ones]} alt="" draggable={false} style={{ ...digitStyle, left: DIGIT_ONES_LEFT }} />
    </>
  )
}

export function LiteScreen({
  mode,
  setpoint,
  flash = false,
}: {
  mode: Mode
  setpoint: number | null
  flash?: boolean
}) {
  const showSetpoint = setpoint !== null

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
        src={imgFullScreenChrome}
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

      {showSetpoint && <TempDigits value={setpoint} />}

      <Layer src={imgCool} box={inset('32.68%', '2.29%', '55.75%', '87.47%')} active={mode === 'cool'} />
      <Layer src={imgHeat} box={inset('46.62%', '3.24%', '41.76%', '88.27%')} active={mode === 'heat'} />
      <Layer src={imgOff} box={inset('67.68%', '1.51%', '25.77%', '86.93%')} active={mode === 'off'} />
      <Layer src={imgSetTo} box={inset('10.67%', '36%', '83.33%', '37.33%')} active={showSetpoint} />
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
    coolTo: 72,
  })
  const [flash, setFlash] = useState(false)

  const triggerFlash = useCallback(() => {
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
  }, [])

  const handleUp = useCallback(() => {
    if (state.mode === 'off') return
    triggerFlash()
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
  }, [state.mode, triggerFlash])

  const handleDown = useCallback(() => {
    if (state.mode === 'off') return
    triggerFlash()
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
  }, [state.mode, triggerFlash])

  const handleMenu = useCallback(() => {
    triggerFlash()
    setState((s) => ({ ...s, mode: nextMode(s.mode) }))
  }, [triggerFlash])

  const setpoint =
    state.mode === 'heat' ? state.heatTo : state.mode === 'cool' ? state.coolTo : null

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
          <LiteScreen mode={state.mode} setpoint={setpoint} flash={flash} />
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
          Heat {state.heatTo}° · Cool {state.coolTo}° · {DEADBAND}° min gap
        </span>
      </p>
    </div>
  )
}
