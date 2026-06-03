import {
  getStageArtifactTune,
  type StageArtifactTuneSettings,
} from '@/lib/stage-artifact-tune/settings'

const ROOT_CLASS = 'stage-artifact-tune'

export function syncStageArtifactTuneCss(settings = getStageArtifactTune()) {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  root.classList.add(ROOT_CLASS)
  root.style.setProperty('--stage-tune-phone-width', settings.phoneWidth.toFixed(3))
  root.style.setProperty('--stage-tune-phone-height', settings.phoneHeight.toFixed(3))
  root.style.setProperty('--stage-tune-sensi-lite-max', `${settings.sensiLiteMaxPx}px`)
  root.style.setProperty('--stage-tune-eim-max', `${settings.eimMaxPx}px`)
}

export function clearStageArtifactTuneCss() {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.remove(ROOT_CLASS)
  for (const prop of [
    '--stage-tune-phone-width',
    '--stage-tune-phone-height',
    '--stage-tune-sensi-lite-max',
    '--stage-tune-eim-max',
  ]) {
    root.style.removeProperty(prop)
  }
}

export type { StageArtifactTuneSettings }
