'use client'

import { QUOTE_BOWL } from '@/lib/everything-in-between/quoteBowl/constants'
import { type QuoteBowlStep } from '@/lib/everything-in-between/quoteBowl/types'
import { type QuoteSlipLayout } from '@/lib/everything-in-between/quotePaper'
import { useCallback, useEffect, useState } from 'react'

const INITIAL_PILE_SEED = 1464

export function useQuoteBowlFlow(reducedMotion: boolean) {
  const [step, setStep] = useState<QuoteBowlStep>('pick')
  const [selectedSlipId, setSelectedSlipId] = useState<number | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [pullStartedAt, setPullStartedAt] = useState<number | null>(null)
  const [resetStartedAt, setResetStartedAt] = useState<number | null>(null)
  const [showSlip, setShowSlip] = useState(false)
  const [slipExiting, setSlipExiting] = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [hasPickedOnce, setHasPickedOnce] = useState(false)
  const [pendingPick, setPendingPick] = useState(false)
  const [pileSeed, setPileSeed] = useState(INITIAL_PILE_SEED)
  const [lastQuote, setLastQuote] = useState<string | null>(null)

  const onPickSlip = useCallback(
    (layout: QuoteSlipLayout) => {
      if (step !== 'pick') return
      setHasPickedOnce(true)
      setSelectedSlipId(layout.id)
      setAnswer(layout.quote)
      setLastQuote(layout.quote)
      setShowReset(false)
      setSlipExiting(false)
      setResetStartedAt(null)
      setPendingPick(false)

      if (reducedMotion) {
        setShowSlip(true)
        setStep('revealed')
        setShowReset(true)
        return
      }

      setPullStartedAt(performance.now())
      setShowSlip(false)
      setStep('pulling')
    },
    [reducedMotion, step],
  )

  useEffect(() => {
    if (step !== 'pulling' || pullStartedAt == null) return

    const { durationMs, slipRevealProgress } = QUOTE_BOWL.pull
    const revealAt = durationMs * slipRevealProgress + QUOTE_BOWL.revealDelayMs

    const revealTimer = window.setTimeout(() => setShowSlip(true), revealAt)
    const completeTimer = window.setTimeout(() => {
      setStep('revealed')
    }, durationMs)

    return () => {
      window.clearTimeout(revealTimer)
      window.clearTimeout(completeTimer)
    }
  }, [pullStartedAt, step])

  useEffect(() => {
    if (step !== 'resetting' || resetStartedAt == null) return

    const timer = window.setTimeout(() => {
      setPileSeed((seed) => seed + 1)
      setStep('pick')
      setSelectedSlipId(null)
      setAnswer(null)
      setPullStartedAt(null)
      setResetStartedAt(null)
      setShowSlip(false)
      setSlipExiting(false)
    }, QUOTE_BOWL.reset.ballReturnMs)

    return () => window.clearTimeout(timer)
  }, [resetStartedAt, step])

  const onTypewriterComplete = useCallback(() => {
    setShowReset(true)
  }, [])

  const clearPendingPick = useCallback(() => {
    setPendingPick(false)
  }, [])

  const reset = useCallback(
    (options?: { chainPick?: boolean }) => {
      if (step !== 'revealed' || !showReset) return

      setShowReset(false)
      const chainPick = options?.chainPick ?? false

      if (reducedMotion) {
        setPileSeed((seed) => seed + 1)
        setStep('pick')
        setSelectedSlipId(null)
        setAnswer(null)
        setPullStartedAt(null)
        setShowSlip(false)
        if (chainPick) setPendingPick(true)
        return
      }

      setSlipExiting(true)
      setShowSlip(false)
      if (chainPick) setPendingPick(true)

      window.setTimeout(() => {
        setSlipExiting(false)
        setResetStartedAt(performance.now())
        setStep('resetting')
      }, QUOTE_BOWL.reset.slipExitMs)
    },
    [reducedMotion, showReset, step],
  )

  return {
    step,
    selectedSlipId,
    answer,
    pullStartedAt,
    resetStartedAt,
    showSlip,
    slipExiting,
    showReset,
    hasPickedOnce,
    pendingPick,
    pileSeed,
    lastQuote,
    reset,
    onPickSlip,
    onTypewriterComplete,
    clearPendingPick,
    isPick: step === 'pick',
    isPickTarget: step === 'pick' || (step === 'revealed' && showReset),
    isRevealed: step === 'revealed',
    showTypedQuote: showSlip && answer != null,
  }
}
