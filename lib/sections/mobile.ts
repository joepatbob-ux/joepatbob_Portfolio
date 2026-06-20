// lib/sections/mobile.ts
import type { Section } from '../types'

export const mobile: Section = {
  id: 'mobile',
  label: 'Mobile',
  eyebrow: '',
  headline: 'A consumer app people trust and a diagnostic tool technicians rely on.',
  overviewBody: `Sensi is the main story — a consumer thermostat app rated #1 on iOS through a decade of hardware generations, platform shifts, and new features. WR Connect is the counterpoint: a greenfield diagnostic tool for ignition board configuration that earned recognition for making a highly specialized workflow actually usable.

Different users. Different constraints. Same standard for getting the interaction right.`,
  overviewMeta: [
    { label: 'Role', value: 'Principal Product Designer' },
    { label: 'Platform', value: 'iOS + Android' },
    { label: 'Timeline', value: '2018 – Present' },
    {
      label: 'Outcome',
      value:
        '#1 rated smart thermostat app · 4.3 → 4.7 iOS · 4.4 Android · ratings held through migration',
      wide: true,
    },
  ],
  lessonTitle: '',
  lessonBody: '',
  chapters: [
    {
      id: 'sensi',
      title: 'Sensi',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
    {
      id: 'wr-connect',
      title: 'WR Connect',
      subtitle: '',
      body: '',
      imageAlt: '',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
}
