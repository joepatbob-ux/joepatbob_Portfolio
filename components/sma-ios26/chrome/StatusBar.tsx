'use client'

import { smaSvg } from '@/lib/sma-ios26/figma-assets'

export function StatusBar({ variant = 'default' }: { variant?: 'default' | 'sheet' }) {
  return (
    <header
      className={`sma-status-bar${variant === 'sheet' ? ' sma-status-bar--sheet' : ''}`}
      aria-hidden
    >
      <div className="sma-status-bar__time">9:41</div>
      <div className="sma-status-bar__levels">
        <img className="sma-status-bar__cellular" src={smaSvg('cellular')} alt="" />
        <img className="sma-status-bar__wifi" src={smaSvg('wifi')} alt="" />
        <img className="sma-status-bar__battery" src={smaSvg('battery')} alt="" />
      </div>
    </header>
  )
}
