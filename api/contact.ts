import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Resend } from 'resend'
import {
  CONTACT_EMAIL_MAX,
  CONTACT_FORM_MIN_MS,
  CONTACT_MESSAGE_MAX,
  CONTACT_MESSAGE_MIN,
  CONTACT_NAME_MAX,
  type ContactFormPayload,
} from '../lib/contactForm'

const RATE_WINDOW_MS = 60_000
const RATE_MAX_PER_IP = 5

type RateBucket = { count: number; resetAt: number }

const rateByIp = new Map<string, RateBucket>()

function clientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() || 'unknown'
  if (Array.isArray(forwarded)) return forwarded[0] ?? 'unknown'
  return req.socket.remoteAddress ?? 'unknown'
}

function allowRate(ip: string): boolean {
  const now = Date.now()
  const bucket = rateByIp.get(ip)
  if (!bucket || now >= bucket.resetAt) {
    rateByIp.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (bucket.count >= RATE_MAX_PER_IP) return false
  bucket.count += 1
  return true
}

function allowedOrigins(): string[] {
  const list = [
    'https://joepatbob.com',
    'https://www.joepatbob.com',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ]
  if (process.env.VERCEL_URL) {
    list.push(`https://${process.env.VERCEL_URL}`)
  }
  if (process.env.CONTACT_ALLOWED_ORIGIN) {
    list.push(process.env.CONTACT_ALLOWED_ORIGIN)
  }
  return list
}

function isAllowedRequest(req: VercelRequest): boolean {
  const origins = allowedOrigins()
  const origin = req.headers.origin
  if (origin && origins.includes(origin)) return true
  const referer = req.headers.referer
  if (referer && origins.some((o) => referer.startsWith(o))) return true
  return false
}

function isValidEmail(value: string): boolean {
  if (value.length > CONTACT_EMAIL_MAX) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function parseBody(req: VercelRequest): ContactFormPayload | null {
  const body = req.body
  if (!body || typeof body !== 'object') return null
  const raw = body as Record<string, unknown>
  return {
    name: typeof raw.name === 'string' ? raw.name.trim() : '',
    replyEmail:
      typeof raw.replyEmail === 'string' ? raw.replyEmail.trim() : '',
    message: typeof raw.message === 'string' ? raw.message.trim() : '',
    company: typeof raw.company === 'string' ? raw.company.trim() : '',
    formStartedAt:
      typeof raw.formStartedAt === 'number'
        ? raw.formStartedAt
        : Number(raw.formStartedAt) || 0,
  }
}

function validatePayload(payload: ContactFormPayload): string | null {
  if (payload.company.length > 0) return 'Rejected'
  if (!payload.formStartedAt) return 'Invalid form timing'
  if (Date.now() - payload.formStartedAt < CONTACT_FORM_MIN_MS) {
    return 'Please take a moment before sending'
  }
  if (!payload.name || payload.name.length > CONTACT_NAME_MAX) {
    return 'Name is required'
  }
  if (!isValidEmail(payload.replyEmail)) return 'A valid email is required'
  if (
    payload.message.length < CONTACT_MESSAGE_MIN ||
    payload.message.length > CONTACT_MESSAGE_MAX
  ) {
    return `Message must be ${CONTACT_MESSAGE_MIN}–${CONTACT_MESSAGE_MAX} characters`
  }
  return null
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<void> {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!isAllowedRequest(req)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const ip = clientIp(req)
  if (!allowRate(ip)) {
    res.status(429).json({ error: 'Too many requests — try again later' })
    return
  }

  const payload = parseBody(req)
  if (!payload) {
    res.status(400).json({ error: 'Invalid request body' })
    return
  }

  const validationError = validatePayload(payload)
  if (validationError) {
    const status = validationError === 'Rejected' ? 400 : 400
    res.status(status).json({ error: validationError })
    return
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_TO_EMAIL
  const from =
    process.env.CONTACT_FROM_EMAIL ?? 'Portfolio <onboarding@resend.dev>'

  if (!apiKey || !to) {
    res.status(503).json({
      error: 'Contact is not configured on the server yet',
    })
    return
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from,
      to: [to],
      replyTo: payload.replyEmail,
      subject: `Portfolio message from ${payload.name}`,
      text: [
        `Name: ${payload.name}`,
        `Reply-to: ${payload.replyEmail}`,
        '',
        payload.message,
      ].join('\n'),
    })

    if (error) {
      console.error('[contact]', error)
      res.status(502).json({ error: 'Could not send message' })
      return
    }

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[contact]', err)
    res.status(500).json({ error: 'Server error' })
  }
}
