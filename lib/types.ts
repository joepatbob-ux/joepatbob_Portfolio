// lib/types.ts

export interface Chapter {
  id: string
  title: string
  subtitle: string
  body: string
  imageAlt: string
  imageSrc?: string          // filled once images are placed in /public/images/
  imageLayout: 'portrait' | 'landscape' | 'full-width'
  imagePosition: 'left' | 'right'
}

export interface Section {
  id: string
  label: string
  eyebrow: string
  headline: string
  overviewBody: string
  pullQuote: string
  lessonTitle: string
  lessonBody: string
  chapters: Chapter[]
}

export interface NavChapter {
  id: string
  label: string
}

export interface NavSection {
  id: string
  label: string
  chapters: NavChapter[]
}
