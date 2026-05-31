/** iOS 26 semantic colors from Figma SMA file. */
export const smaColors = {
  background: '#ffffff',
  labelPrimary: '#000000',
  labelSecondary: 'rgba(60, 60, 67, 0.6)',
  labelTertiary: 'rgba(60, 60, 67, 0.3)',
  labelVibrantPrimary: '#1a1a1a',
  labelVibrantControl: '#1a1a1a',
  fillPrimary: 'rgba(120, 120, 120, 0.2)',
  fillVibrantTertiary: '#ededed',
  fillVibrantPrimary: '#cccccc',
  accentBlue: '#0088ff',
  accentPurple: '#cb30e0',
  accentMint: '#00c8b3',
  coolBlue: '#0093c8',
  heatOrange: '#f76707',
  fanPurple: '#c5b1c2',
  separator: 'rgba(0, 0, 0, 0.12)',
  glassFill: 'rgba(255, 255, 255, 0.65)',
  glassShadow: 'rgba(0, 0, 0, 0.12)',
} as const

export type SmaTabId = 'control' | 'schedule' | 'usage' | 'reminders' | 'settings'

export const SMA_TABS: { id: SmaTabId; label: string }[] = [
  { id: 'control', label: 'Control' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'usage', label: 'Usage' },
  { id: 'reminders', label: 'Reminders' },
  { id: 'settings', label: 'Settings' },
]
