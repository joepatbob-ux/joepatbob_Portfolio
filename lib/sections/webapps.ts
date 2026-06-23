// lib/sections/webapps.ts
import sectionRaw from '@/content/web-apps/section.md?raw'
import kelvinDsRaw from '@/content/web-apps/kelvin-ds.md?raw'
import { sectionFromMarkdown } from '@/lib/content/buildSection'

export const webApps = sectionFromMarkdown(sectionRaw, [kelvinDsRaw])
