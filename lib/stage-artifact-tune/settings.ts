import {
  DEFAULT_PHONE_STAGE_SIZE,
  PHONE_STAGE_SIZE_MAX,
  PHONE_STAGE_SIZE_MIN,
} from '@/lib/phone-swap/phoneSwapStageSize'

export const STAGE_TUNE_CHANGE = 'stage-tune-change'
export const STAGE_TUNE_STORAGE_KEY = 'stage-artifact-tune'

export type StageArtifactTuneSettings = {
  phoneWidth: number
  phoneHeight: number
  sensiLiteMaxPx: number
  eimMaxPx: number
}

export const DEFAULT_STAGE_ARTIFACT_TUNE: StageArtifactTuneSettings = {
  phoneWidth: DEFAULT_PHONE_STAGE_SIZE,
  phoneHeight: DEFAULT_PHONE_STAGE_SIZE,
  sensiLiteMaxPx: 320,
  eimMaxPx: 280,
}

const SENSI_LITE_MIN = 180
const SENSI_LITE_MAX = 560
const EIM_MIN = 160
const EIM_MAX = 560

function clampPhoneScale(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PHONE_STAGE_SIZE
  return Math.max(PHONE_STAGE_SIZE_MIN, Math.min(PHONE_STAGE_SIZE_MAX, value))
}

function clampPx(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.round(value)))
}

function readStored(): StageArtifactTuneSettings {
  if (typeof window === 'undefined') return DEFAULT_STAGE_ARTIFACT_TUNE

  try {
    const raw = localStorage.getItem(STAGE_TUNE_STORAGE_KEY)
    if (!raw) return DEFAULT_STAGE_ARTIFACT_TUNE
    const parsed = JSON.parse(raw) as Partial<StageArtifactTuneSettings>
    return {
      ...DEFAULT_STAGE_ARTIFACT_TUNE,
      ...parsed,
      phoneWidth: clampPhoneScale(parsed.phoneWidth ?? DEFAULT_PHONE_STAGE_SIZE),
      phoneHeight: clampPhoneScale(parsed.phoneHeight ?? DEFAULT_PHONE_STAGE_SIZE),
      sensiLiteMaxPx: clampPx(
        parsed.sensiLiteMaxPx ?? DEFAULT_STAGE_ARTIFACT_TUNE.sensiLiteMaxPx,
        SENSI_LITE_MIN,
        SENSI_LITE_MAX,
        DEFAULT_STAGE_ARTIFACT_TUNE.sensiLiteMaxPx,
      ),
      eimMaxPx: clampPx(
        parsed.eimMaxPx ?? DEFAULT_STAGE_ARTIFACT_TUNE.eimMaxPx,
        EIM_MIN,
        EIM_MAX,
        DEFAULT_STAGE_ARTIFACT_TUNE.eimMaxPx,
      ),
    }
  } catch {
    return DEFAULT_STAGE_ARTIFACT_TUNE
  }
}

export function getStageArtifactTune(): StageArtifactTuneSettings {
  return readStored()
}

export function saveStageArtifactTune(settings: StageArtifactTuneSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STAGE_TUNE_STORAGE_KEY, JSON.stringify(settings))
  window.dispatchEvent(new CustomEvent(STAGE_TUNE_CHANGE, { detail: settings }))
}

export function patchStageArtifactTune(
  patch: Partial<StageArtifactTuneSettings>,
): StageArtifactTuneSettings {
  const next = { ...getStageArtifactTune(), ...patch }
  saveStageArtifactTune(next)
  return next
}

