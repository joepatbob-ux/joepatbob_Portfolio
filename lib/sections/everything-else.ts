// lib/sections/everything-else.ts
import sectionRaw from '@/content/everything-in-between/section.md?raw'
import conceptsRaw from '@/content/everything-in-between/concepts.md?raw'
import formationRaw from '@/content/everything-in-between/formation.md?raw'
import practiceRaw from '@/content/everything-in-between/practice.md?raw'
import { sectionFromMarkdown } from '@/lib/content/buildSection'

export const everythingElse = sectionFromMarkdown(sectionRaw, [
  conceptsRaw,
  formationRaw,
  practiceRaw,
])
