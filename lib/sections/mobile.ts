// lib/sections/mobile.ts — section shell in content/mobile/; chapter copy in lib/mobile/content.ts
import sectionRaw from '@/content/mobile/section.md?raw'
import sensiRaw from '@/content/mobile/sensi.md?raw'
import wrConnectRaw from '@/content/mobile/wr-connect.md?raw'
import { sectionFromMarkdown } from '@/lib/content/buildSection'

export const mobile = sectionFromMarkdown(sectionRaw, [sensiRaw, wrConnectRaw])
