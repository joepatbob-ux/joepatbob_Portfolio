'use client'

import { useAtomizeImage } from '@/lib/hooks/useAtomizeImage'

interface Props {
  src: string
  alt: string
  className?: string
}

/** Hover atomize — image dissolves into accent-colored 1s and 0s, then recompiles on leave. */
export function AtomizeImage({ src, alt, className }: Props) {
  const {
    rootRef,
    canvasRef,
    active,
    photoOpacity,
    onPointerEnter,
    onPointerLeave,
  } = useAtomizeImage(src)

  return (
    <div
      ref={rootRef}
      className={[
        'atomize-image',
        'font-mono',
        active ? 'atomize-image--active' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <img
        src={src}
        alt={alt}
        className="atomize-image__fallback"
        decoding="async"
        loading="eager"
        fetchPriority="high"
        style={{
          opacity: photoOpacity,
          visibility: photoOpacity < 0.02 ? 'hidden' : 'visible',
        }}
      />
      <canvas
        ref={canvasRef}
        className="atomize-image__canvas"
        aria-hidden={!active}
      />
    </div>
  )
}
