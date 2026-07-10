import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { LiquidGlassSurface } from '@/components/sma-ios26/chrome/LiquidGlassSurface'
import { SmaFigmaIcon } from '@/components/sma-ios26/icons/SmaFigmaIcon'
import { previewSetpointStep, type ActiveSetpoint } from '@/lib/sma-ios26/state'

const SETPOINT_IDLE_MS = 2500

type SetpointModuleProps = {
  scheduleName: string
  coolSetpoint: number
  heatSetpoint: number
  activeSetpoint: ActiveSetpoint
  onActiveSetpointChange: (value: ActiveSetpoint) => void
  onCoolChange: (value: number) => void
  onHeatChange: (value: number) => void
}

export function SetpointModule({
  scheduleName,
  coolSetpoint,
  heatSetpoint,
  activeSetpoint,
  onActiveSetpointChange,
  onCoolChange,
  onHeatChange,
}: SetpointModuleProps) {
  const [editing, setEditing] = useState(false)
  const [atLimit, setAtLimit] = useState(false)
  const [limitPulse, setLimitPulse] = useState(0)
  const [selection, setSelection] = useState({ left: 0, width: 0 })
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const coolCellRef = useRef<HTMLDivElement>(null)
  const heatCellRef = useRef<HTMLDivElement>(null)

  const armEditing = useCallback(() => {
    setEditing(true)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      setEditing(false)
      idleTimer.current = null
    }, SETPOINT_IDLE_MS)
  }, [])

  useEffect(() => () => {
    if (idleTimer.current) clearTimeout(idleTimer.current)
  }, [])

  const measureSelection = useCallback(() => {
    const track = trackRef.current
    const cell = activeSetpoint === 'cool' ? coolCellRef.current : heatCellRef.current
    if (!track || !cell) return
    setSelection({
      left: cell.offsetLeft,
      width: cell.offsetWidth,
    })
  }, [activeSetpoint])

  useLayoutEffect(() => {
    if (!editing) return
    measureSelection()
  }, [editing, measureSelection, coolSetpoint, heatSetpoint])

  useLayoutEffect(() => {
    if (!editing) return
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(measureSelection)
    ro.observe(track)
    return () => ro.disconnect()
  }, [editing, measureSelection])

  useEffect(() => {
    if (!editing) setAtLimit(false)
  }, [editing])

  const step = (delta: number) => {
    armEditing()
    const next = previewSetpointStep(
      coolSetpoint,
      heatSetpoint,
      activeSetpoint,
      delta,
    )

    if (!next) {
      setAtLimit(true)
      setLimitPulse((n) => n + 1)
      return
    }

    setAtLimit(false)
    if (activeSetpoint === 'heat') onHeatChange(next.heatSetpoint)
    else onCoolChange(next.coolSetpoint)
  }

  const selectSetpoint = (which: ActiveSetpoint) => {
    armEditing()
    setAtLimit(false)
    const next =
      which === activeSetpoint ? (which === 'cool' ? 'heat' : 'cool') : which
    onActiveSetpointChange(next)
  }

  return (
    <div className="sma-setpoint-wrap">
      <LiquidGlassSurface className="sma-setpoint-module" variant="card">
        <div className="sma-setpoint-module__leading">
          <span className="sma-setpoint-module__icon">
            <SmaFigmaIcon name="dumbbell" size={22} />
          </span>
          <span className="sma-setpoint-module__name">{scheduleName}</span>
        </div>
        <div className="sma-setpoint-module__trailing">
          <div
            className={[
              'sma-setpoint-control',
              editing ? 'sma-setpoint-control--editing' : '',
              atLimit ? 'sma-setpoint-control--limit' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <button
              type="button"
              className="sma-setpoint-control__zone sma-setpoint-control__zone--cool"
              aria-label={`Cool setpoint ${coolSetpoint}`}
              aria-pressed={activeSetpoint === 'cool'}
              onPointerDown={() => selectSetpoint('cool')}
            />
            <button
              type="button"
              className="sma-setpoint-control__zone sma-setpoint-control__zone--heat"
              aria-label={`Heat setpoint ${heatSetpoint}`}
              aria-pressed={activeSetpoint === 'heat'}
              onPointerDown={() => selectSetpoint('heat')}
            />

            <span
              className="sma-setpoint-control__label"
              aria-hidden={editing}
            >
              Keep between
            </span>

            <span
              key={limitPulse}
              className="sma-setpoint-control__limit"
              aria-hidden={!atLimit}
              aria-live="polite"
            >
              Limit
            </span>

            <div ref={trackRef} className="sma-setpoint-switcher" aria-hidden>
              <div
                className="sma-setpoint-switcher__selection"
                style={{
                  left: selection.left,
                  width: selection.width,
                  opacity: editing ? 1 : 0,
                }}
              />
              <div
                ref={coolCellRef}
                className={`sma-setpoint-switcher__cell${!editing && activeSetpoint === 'cool' ? ' sma-setpoint-switcher__cell--emphasis' : ''}`}
              >
                {coolSetpoint}
              </div>
              <span className="sma-setpoint-switcher__dot">
                <SmaFigmaIcon name="setpointDot" size={4} />
              </span>
              <div
                ref={heatCellRef}
                className={`sma-setpoint-switcher__cell${!editing && activeSetpoint === 'heat' ? ' sma-setpoint-switcher__cell--emphasis' : ''}`}
              >
                {heatSetpoint}
              </div>
            </div>
          </div>
          <div className="sma-stepper">
            <button
              type="button"
              className="sma-stepper__btn"
              aria-label="Increase setpoint"
              onPointerDown={() => step(1)}
            >
              <SmaFigmaIcon name="stepperPlus" size={22} />
            </button>
            <button
              type="button"
              className="sma-stepper__btn"
              aria-label="Decrease setpoint"
              onPointerDown={() => step(-1)}
            >
              <SmaFigmaIcon name="stepperMinus" size={22} />
            </button>
          </div>
        </div>
      </LiquidGlassSurface>
      <footer className="sma-schedule-footer">
        <div className="sma-schedule-footer__left">
          <span className="sma-schedule-footer__pin">
            <SmaFigmaIcon name="location" size={13} />
          </span>
          <span>
            Until 6:00AM <span className="sma-schedule-footer__or">or Away</span>
          </span>
        </div>
      </footer>
    </div>
  )
}
