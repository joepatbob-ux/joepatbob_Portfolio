import { SmaToggle } from '@/components/sma-ios26/parts/SmaToggle'

type ScheduleListRowProps =
  | {
      variant: 'toggle'
      label: string
      checked: boolean
      onChange: (checked: boolean) => void
    }
  | {
      variant: 'link'
      label: string
      detail?: string
      showStar?: boolean
      disabled?: boolean
      onPress?: () => void
    }

export function ScheduleListRow(props: ScheduleListRowProps) {
  if (props.variant === 'toggle') {
    return (
      <div className="sma-schedule-row">
        <span className="sma-schedule-row__label">{props.label}</span>
        <SmaToggle
          checked={props.checked}
          onChange={props.onChange}
          label={props.label}
        />
      </div>
    )
  }

  if (props.variant === 'link') {
    return (
      <button
        type="button"
        className={`sma-schedule-row sma-schedule-row--link${props.disabled ? ' sma-schedule-row--disabled' : ''}`}
        disabled={props.disabled}
        onClick={props.onPress}
      >
        <span className="sma-schedule-row__label">{props.label}</span>
        <span className="sma-schedule-row__trailing">
          {props.detail ? (
            <span className="sma-schedule-row__detail">{props.detail}</span>
          ) : null}
          {props.showStar ? (
            <span className="sma-schedule-row__star" aria-hidden>
              ★
            </span>
          ) : null}
          <span className="sma-schedule-row__chevron" aria-hidden>
            ›
          </span>
        </span>
      </button>
    )
  }

  return null
}
