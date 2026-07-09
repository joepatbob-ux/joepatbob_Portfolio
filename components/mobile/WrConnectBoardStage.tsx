'use client'

import { AtomizeImage } from '@/components/effects/AtomizeImage'

interface Props {
  src: string
  alt: string
}

export function WrConnectBoardStage({ src, alt }: Props) {
  return (
    <div className="wr-connect-board-stage">
      <AtomizeImage
        src={src}
        alt={alt}
        className="wr-connect-board-stage__atomize"
      />
    </div>
  )
}
