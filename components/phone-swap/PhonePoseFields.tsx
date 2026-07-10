import type { PhoneDevice, PhonePose } from '@/lib/phone-swap/phoneSwapLayout'

type Props = {
  device: PhoneDevice
  pose: PhonePose
  onChange: (pose: PhonePose) => void
}

function parseNum(value: string, fallback: number): number {
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

export function PhonePoseFields({ device, pose, onChange }: Props) {
  const label = device === 'android' ? 'Android' : 'iPhone'

  function setPosition(axis: 0 | 1 | 2, value: string) {
    const next = [...pose.position] as [number, number, number]
    next[axis] = parseNum(value, next[axis])
    onChange({ ...pose, position: next })
  }

  return (
    <fieldset className="phone-layout-panel__fieldset">
      <legend>{label} coordinates</legend>
      <div className="phone-layout-panel__inputs">
        <label>
          X
          <input
            type="number"
            step="0.01"
            value={pose.position[0]}
            onChange={(e) => setPosition(0, e.target.value)}
          />
        </label>
        <label>
          Y
          <input
            type="number"
            step="0.01"
            value={pose.position[1]}
            onChange={(e) => setPosition(1, e.target.value)}
          />
        </label>
        <label>
          Z
          <input
            type="number"
            step="0.01"
            value={pose.position[2]}
            onChange={(e) => setPosition(2, e.target.value)}
          />
        </label>
        <label>
          Rot X
          <input
            type="number"
            step="0.01"
            value={pose.rotation[0]}
            onChange={(e) => {
              const next = [...pose.rotation] as [number, number, number]
              next[0] = parseNum(e.target.value, next[0])
              onChange({ ...pose, rotation: next })
            }}
          />
        </label>
        <label>
          Rot Y
          <input
            type="number"
            step="0.01"
            value={pose.rotation[1]}
            onChange={(e) => {
              const next = [...pose.rotation] as [number, number, number]
              next[1] = parseNum(e.target.value, next[1])
              onChange({ ...pose, rotation: next })
            }}
          />
        </label>
        <label>
          Rot Z
          <input
            type="number"
            step="0.01"
            value={pose.rotation[2]}
            onChange={(e) => {
              const next = [...pose.rotation] as [number, number, number]
              next[2] = parseNum(e.target.value, next[2])
              onChange({ ...pose, rotation: next })
            }}
          />
        </label>
        <label>
          Scale
          <input
            type="number"
            step="0.01"
            min="0.1"
            value={pose.scale}
            onChange={(e) =>
              onChange({ ...pose, scale: parseNum(e.target.value, pose.scale) })
            }
          />
        </label>
      </div>
    </fieldset>
  )
}
