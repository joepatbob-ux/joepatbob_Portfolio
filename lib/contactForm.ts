export const CONTACT_FORM_MIN_MS = 3_000
export const CONTACT_NAME_MAX = 120
export const CONTACT_EMAIL_MAX = 254
export const CONTACT_MESSAGE_MIN = 10
export const CONTACT_MESSAGE_MAX = 5_000

export type ContactFormPayload = {
  name: string
  replyEmail: string
  message: string
  /** Honeypot — must be empty. */
  company: string
  formStartedAt: number
}

export type ContactFormStatus = 'idle' | 'sending' | 'sent' | 'error'
