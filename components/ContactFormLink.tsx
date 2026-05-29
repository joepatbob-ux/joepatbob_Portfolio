'use client'

import { useContactForm } from '@/components/ContactFormProvider'
import type { ReactNode } from 'react'

interface Props {
  className?: string
  children?: ReactNode
}

/** Opens the protected contact form — no mailto or visible address. */
export function ContactFormLink({ className, children }: Props) {
  const { openContact } = useContactForm()

  return (
    <button
      type="button"
      className={className}
      onClick={openContact}
    >
      {children ?? 'Send a message'}
    </button>
  )
}
