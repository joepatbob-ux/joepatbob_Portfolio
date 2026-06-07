'use client'

import { type QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
import { type QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { useCallback, useState } from 'react'

export function useQuoteBowlFlow(_reducedMotion: boolean) {
  const [step, setStep] = useState<QuoteBowlStep>('pick')
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)

  const reset = useCallback(() => {
    setStep('pick')
    setSelectedSlipId(null)
    setAnswer(null)
  }, [])

  const onPickSlip = useCallback(
    (layout: QuoteSlipLayout) => {
      if (step !== 'pick') return
      setSelectedSlipId(layout.id)
      setAnswer(layout.quote)
      setStep('revealed')
    },
    [step],
  )

  return {
    step,
    selectedSlipId,
    answer,
    reset,
    onPickSlip,
    isPick: step === 'pick',
    isRevealed: step === 'revealed',
    showTypedQuote: step === 'revealed',
    isPickTarget: step === 'pick',
  }
}
