import { readBowlGlassTune } from '@/lib/everything-in-between/bowlGlassTune'
import { useState } from 'react'

export function useQuoteBowlGlassTune() {
  const [glassTune] = useState(() => readBowlGlassTune())
  return { glassTune }
}
