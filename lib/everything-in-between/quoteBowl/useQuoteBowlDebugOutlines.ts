'use client'

import { readQuoteBowlOutlinesEnabled } from '@/lib/everything-in-between/quoteBowl/debugOutlines'
import { useEffect, useState } from 'react'

export function useQuoteBowlDebugOutlines() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    setEnabled(readQuoteBowlOutlinesEnabled())
  }, [])

  return enabled
}
