import type { ReactNode } from 'react'

/** Collapse target for compact More/Less — keeps stage fade on one surface. */
export function ChapterCompactStageFill({ children }: { children: ReactNode }) {
  return <div className="chapter-compact-view__stage-fill">{children}</div>
}
