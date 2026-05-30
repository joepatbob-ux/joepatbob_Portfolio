'use client'

/** 2D comp guides — container edges + center crosshair (layout mode only). */
export function PhoneLayoutGuides() {
  return (
    <div className="phone-layout-guides" aria-hidden>
      <div className="phone-layout-guides__frame" />
      <div className="phone-layout-guides__line phone-layout-guides__line--v" />
      <div className="phone-layout-guides__line phone-layout-guides__line--h" />
      <span className="phone-layout-guides__corner phone-layout-guides__corner--tl" />
      <span className="phone-layout-guides__corner phone-layout-guides__corner--tr" />
      <span className="phone-layout-guides__corner phone-layout-guides__corner--bl" />
      <span className="phone-layout-guides__corner phone-layout-guides__corner--br" />
      <span className="phone-layout-guides__tag phone-layout-guides__tag--center">center</span>
      <span className="phone-layout-guides__tag phone-layout-guides__tag--top">top</span>
      <span className="phone-layout-guides__tag phone-layout-guides__tag--bottom">bottom</span>
      <span className="phone-layout-guides__tag phone-layout-guides__tag--left">left</span>
      <span className="phone-layout-guides__tag phone-layout-guides__tag--right">right</span>
    </div>
  )
}
