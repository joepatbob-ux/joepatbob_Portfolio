import { smaSvg } from '@/lib/sma-ios26/figma-assets'

export function ModeSelect() {
  return (
    <button type="button" className="sma-mode-select" aria-label="System mode">
      <span className="sma-mode-select__system" aria-hidden>
        <span className="sma-mode-select__system-cool">
          <img src={smaSvg('symbolCool')} alt="" />
        </span>
        <span className="sma-mode-select__system-heat">
          <img src={smaSvg('symbolHeat')} alt="" />
        </span>
      </span>
      <span className="sma-mode-select__divider" aria-hidden />
      <span className="sma-mode-select__fan" aria-hidden>
        <img className="sma-mode-select__fan-icon" src={smaSvg('fanIcon')} alt="" />
        <span className="sma-mode-select__auto">
          <img src={smaSvg('symbolAuto')} alt="" />
        </span>
      </span>
    </button>
  )
}
