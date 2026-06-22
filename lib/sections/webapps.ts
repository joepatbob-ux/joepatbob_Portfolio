// lib/sections/webapps.ts
import type { Section } from '../types'

export const webApps: Section = {
  id: 'web-apps',
  label: 'Web Apps',
  eyebrow: '',
  headline: 'Four products. Two domains. One design system.',
  overviewBody: `When companies grow through acquisition, their software tells the story. Different visual languages, different interaction patterns, different component behaviors — each one an artifact of a team that solved their own problem, their own way, without knowing they'd eventually need to work together.

Copeland's web application portfolio was that story. Four products inherited from different companies, serving different industries, built at different times by teams optimizing for shipping rather than coherence. The UI worked — well enough that the business kept running, well enough that nobody wanted to risk touching it.

My job was to change that without breaking anything that mattered.`,
  overviewMeta: [
    { label: 'Role', value: 'Principal Product Designer' },
    { label: 'Design system', value: 'Kelvin' },
    { label: 'Status', value: 'Active, parallel track rollout' },
    {
      label: 'Products',
      value:
        'Sensi MTM · Verdant Thermostat Manager · Copeland Connect+ · Copeland TempTrak 6',
      wide: true,
    },
  ],
  lessonTitle: '',
  lessonBody: '',
  chapters: [
    {
      id: 'kelvin-ds',
      title: 'Kelvin DS',
      subtitle: '',
      body: '',
      imageAlt: 'Kelvin design system scratch-off reveal',
      imageLayout: 'full-width',
      imagePosition: 'left',
    },
  ],
}
