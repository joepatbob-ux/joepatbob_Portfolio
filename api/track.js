// First-party event sink for the private portal (/api/portal). Events are
// LPUSHed to an Upstash Redis list (free marketplace add-on), capped so the
// list can never grow unbounded. Until a store is connected this drops
// events with a 204 — the site never notices.
export const EVENTS_KEY = 'pa:events'
export const EVENTS_CAP = 49_999

export function redisEnv() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token =
    process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
  return url && token ? { url, token } : null
}

function geoHeader(req, name) {
  const value = req.headers[name]
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return undefined
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }
  const store = redisEnv()
  if (!store) {
    res.status(204).end()
    return
  }

  let data = req.body
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      data = null
    }
  }
  if (!data || typeof data.name !== 'string' || data.name.length > 64) {
    res.status(400).end()
    return
  }

  const props = {}
  if (data.props && typeof data.props === 'object') {
    for (const [key, value] of Object.entries(data.props).slice(0, 8)) {
      if (['string', 'number', 'boolean'].includes(typeof value)) {
        props[String(key).slice(0, 32)] = String(value).slice(0, 255)
      }
    }
  }

  const ua = String(req.headers['user-agent'] || '')
  const event = {
    ts: Date.now(),
    name: data.name,
    props,
    sid: typeof data.sid === 'string' ? data.sid.slice(0, 16) : undefined,
    path: typeof data.path === 'string' ? data.path.slice(0, 128) : undefined,
    ref: typeof data.ref === 'string' ? data.ref.slice(0, 128) : undefined,
    country: geoHeader(req, 'x-vercel-ip-country'),
    state: geoHeader(req, 'x-vercel-ip-country-region'),
    city: geoHeader(req, 'x-vercel-ip-city'),
    device: /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop',
  }
  const payload = JSON.stringify(event)
  if (payload.length > 2000) {
    res.status(413).end()
    return
  }

  await fetch(`${store.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${store.token}` },
    body: JSON.stringify([
      ['LPUSH', EVENTS_KEY, payload],
      ['LTRIM', EVENTS_KEY, '0', String(EVENTS_CAP)],
    ]),
  }).catch(() => {})

  res.status(204).end()
}
