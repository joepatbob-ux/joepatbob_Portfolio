'use client'

import { useAtomizeImage } from '@/lib/hooks/useAtomizeImage'

interface Props {
  src: string
  alt: string
  className?: string
}

/** PDF settles into weighted 0s; hover reveals 1/0 digits around the cursor. */
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
      role="img"
      aria-label={alt}
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
      <canvas
        ref={canvasRef}
        className="atomize-image__canvas"
        aria-hidden="true"
      />
    </div>
  )
}
