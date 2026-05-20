'use client'

interface Props {
  count: number
  activeIndex: number
  slideKeys: readonly string[]
  onSelect: (index: number) => void
}

export function Touch2CarouselDots({
  count,
  activeIndex,
  slideKeys,
  onSelect,
}: Props) {
  return (
    <div className="touch2-carousel__dots" role="tablist" aria-label="Choose photo">
      {slideKeys.map((key, i) => {
        const active = i === activeIndex
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Photo ${i + 1} of ${count}`}
            className={[
              'touch2-carousel__dot',
              active ? 'touch2-carousel__dot--active' : '',
            ]
              .filter(Boolean)
              .join(' ')}
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
