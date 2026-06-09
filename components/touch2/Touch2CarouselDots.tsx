'use client'

interface Props {
  count: number
  activeIndex: number
  slideKeys: readonly string[]
  /** 0 = full pill, 1 = elapsed (countdown). Defaults to full. */
  activeProgress?: number
  onSelect: (index: number) => void
  className?: string
  ariaLabel?: string
  itemAriaLabel?: (index: number, count: number) => string
}

export function Touch2CarouselDots({
  count,
  activeIndex,
  slideKeys,
  activeProgress = 0,
  onSelect,
  className,
  ariaLabel = 'Choose photo',
  itemAriaLabel = (i, total) => `Photo ${i + 1} of ${total}`,
}: Props) {
  return (
    <div
      className={['touch2-carousel__dots', className].filter(Boolean).join(' ')}
      role="tablist"
      aria-label={ariaLabel}
    >
      {slideKeys.map((key, i) => {
        const active = i === activeIndex
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={itemAriaLabel(i, count)}
            className={[
              'touch2-carousel__dot',
              active ? 'touch2-carousel__dot--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={
              active
                ? ({
                    ['--touch2-dot-progress' as string]: activeProgress,
                  } as React.CSSProperties)
                : undefined
            }
            onClick={() => onSelect(i)}
          >
            <span className="touch2-carousel__dot-ring" aria-hidden />
            <span className="touch2-carousel__dot-fill" aria-hidden />
            <span className="touch2-carousel__dot-indicator" aria-hidden />
          </button>
        )
      })}
    </div>
  )
}
