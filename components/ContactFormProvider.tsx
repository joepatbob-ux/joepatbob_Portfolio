'use client'

import { ContactDialog } from '@/components/ContactDialog'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

type ContactFormContextValue = {
  openContact: () => void
  closeContact: () => void
}

const ContactFormContext = createContext<ContactFormContextValue | null>(null)

export function ContactFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  const openContact = useCallback(() => setOpen(true), [])
  const closeContact = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ openContact, closeContact }),
    [openContact, closeContact],
  )

  return (
    <ContactFormContext.Provider value={value}>
      {children}
      <ContactDialog open={open} onClose={closeContact} />
    </ContactFormContext.Provider>
  )
}

export function useContactForm(): ContactFormContextValue {
  const ctx = useContext(ContactFormContext)
  if (!ctx) {
    throw new Error('useContactForm must be used within ContactFormProvider')
  }
  return ctx
}
