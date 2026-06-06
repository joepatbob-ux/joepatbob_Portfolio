'use client'

import { ContactDialog } from '@/components/ContactDialog'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
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
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const openContact = useCallback(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    setOpen(true)
  }, [])
  const closeContact = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ openContact, closeContact }),
    [openContact, closeContact],
  )

  return (
    <ContactFormContext.Provider value={value}>
      {children}
      <ContactDialog
        open={open}
        onClose={closeContact}
        returnFocusRef={returnFocusRef}
      />
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
