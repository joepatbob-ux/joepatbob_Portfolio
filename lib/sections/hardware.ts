// lib/sections/hardware.ts — editorial copy lives in content/hardware/
import sectionRaw from '@/content/hardware/section.md?raw'
import touch2Raw from '@/content/hardware/touch-2.md?raw'
import eimRaw from '@/content/hardware/eim.md?raw'
import sensiLiteRaw from '@/content/hardware/sensi-lite.md?raw'
import verdantRaw from '@/content/hardware/verdant.md?raw'
import { sectionFromMarkdown } from '@/lib/content/buildSection'

export const hardware = sectionFromMarkdown(sectionRaw, [
  touch2Raw,
  eimRaw,
  sensiLiteRaw,
  verdantRaw,
])
