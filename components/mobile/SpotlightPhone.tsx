'use client'

import { useCallback, useState } from 'react'
import { Touch2CarouselDots } from '@/components/touch2/Touch2CarouselDots'

export type SpotlightPreset = {
  id: string
  partnerName: string
  partnerColor: string
  headline: string
  programType: string
  showExpiration: boolean
  expiration: string
}

const PRESETS: readonly SpotlightPreset[] = [
  {
    id: 'dr',
    partnerName: 'Ameren',
    partnerColor: '#0060A9',
    headline: 'Save on cooling this summer',
    programType: 'Demand response',
    showExpiration: true,
    expiration: 'Ends Aug 31',
  },
  {
    id: 'solar',
    partnerName: 'Xcel Energy',
    partnerColor: '#ED1C24',
    headline:
      'Enroll in Solar Rewards and earn bill credits when you shift usage',
    programType: 'Solar',
    showExpiration: false,
    expiration: '',
  },
  {
    id: 'efficiency',
    partnerName: 'Duke Energy',
    partnerColor: '#003366',
    headline: 'Free smart thermostat upgrade',
    programType: 'Efficiency',
    showExpiration: true,
    expiration: 'Limited time',
  },
  {
    id: 'battery',
    partnerName: 'PG&E',
    partnerColor: '#F9A01B',
    headline:
      'Battery storage incentives — stack federal credits with utility rebates for home backup',
    programType: 'Battery',
    showExpiration: true,
    expiration: 'Dec 15',
  },
]

export function SpotlightPhone() {
  const [index, setIndex] = useState(0)
  const preset = PRESETS[index]
  const count = PRESETS.length

  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % count)
  }, [count])

  return (
    <div
      className="spotlight-phone"
      role="region"
      aria-roledescription="carousel"
      aria-label="Spotlight card presets"
    >
      <div className="spotlight-phone__frame">
        <div className="spotlight-phone__bezel">
          <button
            type="button"
            className="spotlight-phone__card"
            onClick={advance}
            aria-label={`Next Spotlight preset, ${index + 1} of ${count}`}
          >
            <p className="spotlight-phone__section-label">Spotlight</p>

            <div className="spotlight-phone__logo-row">
              <span
                className="spotlight-phone__logo-mark"
                style={{ backgroundColor: preset.partnerColor }}
                aria-hidden
              />
              <span className="spotlight-phone__partner">
                {preset.partnerName}
              </span>
            </div>

            <p className="spotlight-phone__program">{preset.programType}</p>
            <h3 className="spotlight-phone__headline">{preset.headline}</h3>

            {preset.showExpiration ? (
              <p className="spotlight-phone__expires">{preset.expiration}</p>
            ) : (
              <p className="spotlight-phone__expires spotlight-phone__expires--empty" />
            )}

            <span className="spotlight-phone__cta">Learn More</span>

            <span className="spotlight-phone__arrow" aria-hidden>
              →
            </span>
          </button>
        </div>
      </div>

      <Touch2CarouselDots
        count={count}
        activeIndex={index}
        slideKeys={PRESETS.map((p) => p.id)}
        onSelect={setIndex}
      />
      <p className="spotlight-phone__hint">
        Tap the card or dots to preview partner scenarios
      </p>
    </div>
  )
}
