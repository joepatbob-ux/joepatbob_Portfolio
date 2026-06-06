/** Cootie-catcher flow: color → pinch count → number → quote index. */

export type FortuneTellerStep =
  | 'pick-color'
  | 'pinching'
  | 'pick-number'
  | 'revealed'

export type FortuneColor = {
  id: string
  label: string
  /** Classic “spell the color” open/close count. */
  spellCount: number
  /** Panel tint on the paper craft. */
  tint: string
}

export const FORTUNE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const

export function fortuneIndex(
  colorIndex: number,
  number: number,
  answerCount: number,
): number {
  if (answerCount <= 0) return 0
  const n = Math.max(1, Math.min(8, number))
  return (colorIndex * 8 + (n - 1)) % answerCount
}

export function pickFortuneAnswer(
  answers: readonly string[],
  previous: string | null,
  colorIndex: number,
  number: number,
): string {
  if (answers.length === 0) return 'Ask again.'
  const start = fortuneIndex(colorIndex, number, answers.length)
  if (answers.length === 1) return answers[0]

  let idx = start
  let guard = 0
  while (answers[idx] === previous && guard++ < answers.length) {
    idx = (idx + 1) % answers.length
  }
  return answers[idx]
}

export function pinchDurationMs(
  spellCount: number,
  reducedMotion: boolean,
): number {
  if (reducedMotion) return 0
  return Math.min(2400, 320 + spellCount * 380)
}
