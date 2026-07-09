'use client'

import { useWrConnectBoard } from '@/lib/hooks/useWrConnectBoard'

interface Props {
  src: string
  alt: string
}

/** Board image at rest; hover reveals weighted 0s in a soft cursor brush. */
export function WrConnectBoardStage({ src, alt }: Props) {
  const {
    rootRef,
    canvasRef,
    canvasReady,
    hovering,
    aspectRatio,
    onPointerEnter,
    onPointerMove,
    onPointerLeave,
  } = useWrConnectBoard(src)

  return (
    <div
      ref={rootRef}
      role="img"
      aria-label={alt}
      className={[
        'wr-connect-board',
        canvasReady ? 'wr-connect-board--canvas-ready' : '',
        hovering ? 'wr-connect-board--hovering' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ aspectRatio }}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="wr-connect-board__photo"
        decoding="async"
        draggable={false}
      />
      <canvas ref={canvasRef} className="wr-connect-board__canvas" aria-hidden="true" />
    </div>
  )
}
