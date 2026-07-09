'use client'

import { useAtomizeImage } from '@/lib/hooks/useAtomizeImage'

interface Props {
  src: string
  alt: string
  className?: string
}

/** PDF on load → weighted 0s → hover distorts to 1s around the cursor. */
export function AtomizeImage({ src, alt, className }: Props) {
  const {
    rootRef,
    canvasRef,
    ready,
    settled,
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
        settled ? 'atomize-image--settled' : '',
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
