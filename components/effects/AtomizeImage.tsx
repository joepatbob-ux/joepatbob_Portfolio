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
    ready,
    live,
    aspectRatio,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  } = useAtomizeImage(src)

  return (
    <div
      ref={rootRef}
      className={[
        'atomize-image',
        'font-mono',
        ready ? 'atomize-image--ready' : '',
        live ? 'atomize-image--live' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={aspectRatio ? { aspectRatio } : undefined}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
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
          opacity: live ? 0 : 1,
          visibility: live ? 'hidden' : 'visible',
        }}
      />
      <canvas
        ref={canvasRef}
        className="atomize-image__canvas"
        aria-hidden={!live}
      />
    </div>
  )
}
