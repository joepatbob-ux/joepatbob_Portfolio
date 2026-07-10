import { SmaFigmaIcon } from '@/components/sma-ios26/icons/SmaFigmaIcon'

type WeatherHeaderProps = {
  location: string
  temp: number
  high: number
  low: number
}

export function WeatherHeader({ location, temp, high, low }: WeatherHeaderProps) {
  return (
    <div className="sma-weather">
      <div className="sma-weather__location">{location}</div>
      <div className="sma-weather__row">
        <SmaFigmaIcon name="sun" size={28} />
        <div className="sma-weather__temp-wrap">
          <span className="sma-weather__temp">{temp}</span>
          <div className="sma-weather__hi-lo">
            <span>H: {high}</span>
            <span>L: {low}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
