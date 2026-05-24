'use client'

import { createContext, useContext } from 'react'

const ChapterActiveContext = createContext(true)

export function ChapterActiveProvider({
  active,
  children,
}: {
  active: boolean
  children: React.ReactNode
}) {
  return (
    <ChapterActiveContext.Provider value={active}>
      {children}
    </ChapterActiveContext.Provider>
  )
}

/** True when this chapter panel is the active scroll target. */
export function useChapterActive(): boolean {
  return useContext(ChapterActiveContext)
}
