import type { ReactNode } from 'react'

/** Render **bold** markers in chapter copy paragraphs. */
export function formatChapterInline(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  if (parts.length === 1) return text

  return parts.map((part, index) =>
    index % 2 === 1 ? <strong key={index}>{part}</strong> : part,
  )
}
