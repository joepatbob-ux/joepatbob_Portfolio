// components/SensiLiteProto.tsx
// Sensi Lite — segment LCD prototype (home / homeowner rings)

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { SegmentLcd } from '@/components/sensi-lite/SegmentLcd'
import {
  buildHomeComposition,
  buildSettingsComposition,
} from '@/lib/sensi-lite/build-composition'
import {
  INITIAL_FLOW_STATE,
  advanceMenuTap,
  adjustFanDuty,
  currentHomeownerScreen,
  enterHomeownerRing,
  returnToMain,
  adjustTempUnit,
  type FlowState,
} from '@/lib/sensi-lite/flow'
import {
  adjustFahrenheitByDisplayDelta,
  displayTemperature,
} from '@/lib/sensi-lite/temperature'
import { useMenuLongPress } from '@/lib/sensi-lite/useMenuLongPress'
import { useMenuLongPressIndicator } from '@/lib/sensi-lite/interactiveTouchContext'
import { FRAME_HEIGHT, FRAME_LOGO, FRAME_WIDTH, type FrameRect } from '@/lib/sensi-lite/frame-layout'

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

const asset = (name: string) => `/images/sensi-lite/${name}.svg`

const imgLiteFrame = asset('lite-frame')
const imgButtons = asset('lite-buttons')
const imgType = asset('lite-type')

const MODES = ['heat', 'cool', 'off'] as const
type Mode = (typeof MODES)[number]

function clampTemp(value: number): number {
  return Math.min(TEMP_MAX, Math.max(TEMP_MIN, Math.round(value)))
}

function enforceDeadband(
  heatTo: number,
  coolTo: number,
  preferred: 'heat' | 'cool',
): Pick<FlowState, 'heatTo' | 'coolTo'> {
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
  unit: FlowState['tempUnit'],
) {
  const nextHeat = clampTemp(adjustFahrenheitByDisplayDelta(heatTo, delta, unit))
  return enforceDeadband(nextHeat, coolTo, 'heat')
}

function adjustCoolSetpoint(
  heatTo: number,
  coolTo: number,
  delta: number,
  unit: FlowState['tempUnit'],
) {
  const nextCool = clampTemp(adjustFahrenheitByDisplayDelta(coolTo, delta, unit))
  return enforceDeadband(heatTo, nextCool, 'cool')
}

function nextMode(mode: Mode): Mode {
  const i = MODES.indexOf(mode)
  return MODES[(i + 1) % MODES.length]
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
    <div className="sensi-lite-proto__stage">
      <div className="sensi-lite-proto__stage-inner">{children}</div>
    </div>
  )
}

function LiteFrame({
  onUp,
  onDown,
  menuHandlers,
  hideNativeCursor = false,
}: {
  onUp?: () => void
  onDown?: () => void
  menuHandlers: ReturnType<typeof useMenuLongPress>
  hideNativeCursor?: boolean
}) {
  const hitBase: CSSProperties = {
    position: 'absolute',
    left: 0,
    width: '100%',
    border: 'none',
    background: 'transparent',
    cursor: hideNativeCursor ? 'none' : 'pointer',
    padding: 0,
    margin: 0,
    touchAction: 'none',
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
        <button
          type="button"
          aria-label="Up"
          data-lite-hit=""
          style={{ ...hitBase, top: 0, height: '33.33%' }}
          onClick={onUp}
        />
        <button
          type="button"
          aria-label="Menu"
          data-lite-hit=""
          style={{ ...hitBase, top: '33.33%', height: '33.34%' }}
          onPointerDown={menuHandlers.onPointerDown}
          onPointerUp={menuHandlers.onPointerUp}
          onPointerLeave={menuHandlers.onPointerLeave}
          onPointerCancel={menuHandlers.onPointerCancel}
        />
        <button
          type="button"
          aria-label="Down"
          data-lite-hit=""
          style={{ ...hitBase, top: '66.67%', height: '33.33%' }}
          onClick={onDown}
        />
      </div>
    </div>
  )
}

function computeLit(
  state: FlowState,
  lcdTemp: number,
  onActive: boolean,
  showSetTo: boolean,
) {
  if (state.ring === 'main') {
    return buildHomeComposition({
      temp: lcdTemp,
      mode: state.mode,
      onActive,
      showSetTo,
    })
  }

  if (state.ring === 'homeowner') {
    const screen = currentHomeownerScreen(state)
    if (screen === 'fan') {
      return buildSettingsComposition('fan', 'homeowner', null, {
        fanDuty: state.fanDuty ?? 10,
      })
    }
    if (screen === 'units') {
      return buildSettingsComposition('units', 'homeowner', null, {
        tempUnit: state.tempUnit ?? 'f',
      })
    }
    return buildSettingsComposition(screen, 'homeowner', null)
  }

  return buildHomeComposition({
    temp: lcdTemp,
    mode: state.mode,
    onActive,
    showSetTo,
  })
}

export function SensiLiteProto({
  showControlsLegend = true,
  useDotCursor = false,
}: {
  showControlsLegend?: boolean
  useDotCursor?: boolean
}) {
  const [flow, setFlow] = useState<FlowState>(INITIAL_FLOW_STATE)
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
      setFlow((s) => ({ ...s, editingSetpoint: false }))
      idleTimerRef.current = null
    }, SETPOINT_IDLE_MS)
  }, [clearIdleTimer])

  const beginSetpointEdit = useCallback(() => {
    setFlow((s) => ({ ...s, editingSetpoint: true }))
    startSetpointIdleTimer()
  }, [startSetpointIdleTimer])

  useEffect(() => () => clearIdleTimer(), [clearIdleTimer])

  const triggerFlash = useCallback(() => {
    setFlash(true)
    setTimeout(() => setFlash(false), 120)
  }, [])

  const handleUp = useCallback(() => {
    triggerFlash()

    if (flow.ring === 'homeowner') {
      setFlow((s) => {
        const screen = currentHomeownerScreen(s)
        if (screen === 'fan') return adjustFanDuty(s, 1)
        if (screen === 'units') return adjustTempUnit(s, 1)
        return s
      })
      return
    }

    if (flow.ring !== 'main' || flow.mode === 'off') return

    beginSetpointEdit()
    setFlow((s) => {
      if (s.mode === 'heat') {
        const next = adjustHeatSetpoint(s.heatTo, s.coolTo, 1, s.tempUnit ?? 'f')
        return { ...s, ...next }
      }
      if (s.mode === 'cool') {
        const next = adjustCoolSetpoint(s.heatTo, s.coolTo, 1, s.tempUnit ?? 'f')
        return { ...s, ...next }
      }
      return s
    })
  }, [beginSetpointEdit, flow.mode, flow.ring, triggerFlash])

  const handleDown = useCallback(() => {
    triggerFlash()

    if (flow.ring === 'homeowner') {
      setFlow((s) => {
        const screen = currentHomeownerScreen(s)
        if (screen === 'fan') return adjustFanDuty(s, -1)
        if (screen === 'units') return adjustTempUnit(s, -1)
        return s
      })
      return
    }

    if (flow.ring !== 'main' || flow.mode === 'off') return

    beginSetpointEdit()
    setFlow((s) => {
      if (s.mode === 'heat') {
        const next = adjustHeatSetpoint(s.heatTo, s.coolTo, -1, s.tempUnit ?? 'f')
        return { ...s, ...next }
      }
      if (s.mode === 'cool') {
        const next = adjustCoolSetpoint(s.heatTo, s.coolTo, -1, s.tempUnit ?? 'f')
        return { ...s, ...next }
      }
      return s
    })
  }, [beginSetpointEdit, flow.mode, flow.ring, triggerFlash])

  const handleMenuTap = useCallback(() => {
    triggerFlash()
    setFlow((s) => {
      if (s.ring === 'main') {
        return { ...s, mode: nextMode(s.mode) }
      }
      return advanceMenuTap(s)
    })
  }, [triggerFlash])

  const handleMenuLongPress = useCallback(() => {
    triggerFlash()
    setFlow((s) => {
      if (s.ring === 'main') return enterHomeownerRing(s)
      return returnToMain(s)
    })
  }, [triggerFlash])

  const menuLongPressIndicator = useMenuLongPressIndicator()

  const menuHandlers = useMenuLongPress({
    ring: flow.ring,
    onTap: handleMenuTap,
    onLongPress: handleMenuLongPress,
    onPressStart: (durationMs) => {
      menuLongPressIndicator?.setState({ active: true, durationMs })
    },
    onPressEnd: () => {
      menuLongPressIndicator?.setState({ active: false, durationMs: 0 })
    },
  })

  const showSetTo = flow.editingSetpoint && flow.mode !== 'off' && flow.ring === 'main'

  const rawLcdTemp =
    showSetTo && flow.mode === 'heat'
      ? flow.heatTo
      : showSetTo && flow.mode === 'cool'
        ? flow.coolTo
        : DISPLAY_TEMP

  const tempUnit = flow.tempUnit ?? 'f'

  const lcdTemp = displayTemperature(rawLcdTemp, tempUnit)

  const displayRoomTemp = displayTemperature(DISPLAY_TEMP, tempUnit)
  const displayHeatTo = displayTemperature(flow.heatTo, tempUnit)
  const displayCoolTo = displayTemperature(flow.coolTo, tempUnit)
  const unitSuffix = tempUnit === 'c' ? '°C' : '°F'

  const onActive =
    flow.ring === 'main' &&
    (flow.mode === 'heat'
      ? flow.heatTo > DISPLAY_TEMP
      : flow.mode === 'cool'
        ? flow.coolTo < DISPLAY_TEMP
        : false)

  const lit = useMemo(
    () => computeLit(flow, lcdTemp, onActive, showSetTo),
    [flow, lcdTemp, onActive, showSetTo],
  )

  const ringHint =
    flow.ring === 'main'
      ? 'Hold menu 1.2s → settings'
      : currentHomeownerScreen(flow) === 'fan'
        ? 'Fan: ▲/▼ cycles duty · tap menu to advance · hold 1.2s → home'
        : 'Units: ▲/▼ toggles unit · tap menu to advance · hold 1.2s → home'

  return (
    <div
      className={useDotCursor ? 'sensi-lite-proto--dot-cursor' : undefined}
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
          <LiteFrame
            onUp={handleUp}
            onDown={handleDown}
            menuHandlers={menuHandlers}
            hideNativeCursor={useDotCursor}
          />
          <SegmentLcd
            lit={lit}
            flash={flash}
            style={{
              left: SCREEN_LEFT,
              top: SCREEN_TOP,
              width: SCREEN_WIDTH,
              height: SCREEN_HEIGHT,
            }}
          />
        </div>
      </ProtoStage>

      {showControlsLegend ? (
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
          <span style={{ display: 'block' }}>▲ ▼ setpoint / adjust · ● menu</span>
          <span style={{ display: 'block' }}>{ringHint}</span>
          <span style={{ display: 'block' }}>
            Room {displayRoomTemp}{unitSuffix} · Heat {displayHeatTo}{unitSuffix} · Cool{' '}
            {displayCoolTo}
            {unitSuffix} · {DEADBAND}° gap
          </span>
        </p>
      ) : null}
    </div>
  )
}
