import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'

const { textStartT, textEndT } = QUOTE_BOWL.unfold

/** 0–1 typewriter progress synced to the unfold animation timeline. */
export function slipTextProgress(
  t: number,
  revealed: boolean,
  reducedMotion: boolean,
): number {
  if (revealed || reducedMotion) return 1
  if (t <= textStartT) return 0
  if (t >= textEndT) return 1
  return (t - textStartT) / (textEndT - textStartT)
}

export function quotedCopy(text: string): string {
  return text.startsWith('"') ? text : `"${text}"`
}

export function typedCharCount(text: string, textProgress: number): number {
  return Math.floor(quotedCopy(text).length * textProgress)
}
