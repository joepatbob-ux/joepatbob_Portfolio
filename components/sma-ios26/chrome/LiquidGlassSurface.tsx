import type { ReactNode } from 'react'

type LiquidGlassSurfaceProps = {
  children: ReactNode
  className?: string
  variant?: 'pill' | 'card'
  /** Stronger blur + specular for trailing toolbar controls. */
  tone?: 'default' | 'strong'
}

/** iOS 26–style frosted glass shell — swap implementation for texture export later. */
export function LiquidGlassSurface({
  children,
  className = '',
  variant = 'pill',
  tone = 'default',
}: LiquidGlassSurfaceProps) {
  return (
    <div
      className={[
        'sma-glass',
        `sma-glass--${variant}`,
        tone === 'strong' ? 'sma-glass--strong' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="sma-glass__blur" aria-hidden />
      <div className="sma-glass__fill" aria-hidden />
      <div className="sma-glass__edge" aria-hidden />
      <div className="sma-glass__content">{children}</div>
    </div>
  )
}
