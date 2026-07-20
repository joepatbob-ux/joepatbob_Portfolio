import type { ReactNode } from 'react'

/** Uniform scroll-align surface — measured and transformed by continuous stage align. */
export function ChapterStageAlign({ children }: { children: ReactNode }) {
  return (
    <div className="chapter-stage-align" data-chapter-stage-align>
      {children}
    </div>
  )
}
