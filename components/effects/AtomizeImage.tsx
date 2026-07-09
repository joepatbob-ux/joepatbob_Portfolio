'use client'

import { useAtomizeImage } from '@/lib/hooks/useAtomizeImage'

interface Props {
  src: string
  alt: string
  className?: string
}

/** PDF at rest; hover reveals weighted 0s in a cursor brush. */
export function AtomizeImage({ src, alt, className }: Props) {
  const {
    rootRef,
    canvasRef,
    ready,
    hovered,
    aspectRatio,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  } = useAtomizeImage(src)

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      className={[
        'atomize-image',
        'font-mono',
        ready ? 'atomize-image--ready' : '',
        hovered ? 'atomize-image--hovered' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={aspectRatio ? { aspectRatio } : undefined}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <canvas
        ref={canvasRef}
        className="atomize-image__canvas"
        aria-hidden="true"
      />
    </div>
  )
}
