/** Figma-exported SVG assets for SMA iOS26 (node 1142:7210). */
export const SMA_SVG = {
  back: 'back.svg',
  help: 'help.svg',
  dumbbell: 'dumbbell.svg',
  stepperPlus: 'stepper-plus.svg',
  stepperMinus: 'stepper-minus.svg',
  setpointDot: 'setpoint-dot.svg',
  location: 'location.svg',
  humidity: 'humidity.svg',
  sun: 'sun.svg',
  tabControl: 'tab-control.png',
  tabSchedule: 'tab-schedule.png',
  tabUsage: 'tab-usage.svg',
  tabReminders: 'tab-reminders.svg',
  tabSettings: 'tab-settings.svg',
  symbolCool: 'symbol-cool.svg',
  symbolHeat: 'symbol-heat.svg',
  modeDivider: 'mode-divider.svg',
  fanIcon: 'fan-icon.svg',
  symbolAuto: 'symbol-auto.svg',
  cellular: 'cellular.svg',
  wifi: 'wifi.svg',
  battery: 'battery.svg',
} as const

export type SmaSvgName = keyof typeof SMA_SVG

export const smaSvg = (name: SmaSvgName) => `/images/sma-ios26/svg/${SMA_SVG[name]}`
