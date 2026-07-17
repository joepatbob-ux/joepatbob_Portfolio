// Private analytics portal: /api/portal?key=<STATS_KEY>. Reads the event
// list written by /api/track and renders a self-contained HTML dashboard —
// no client JS (the site CSP allows inline styles but not inline scripts),
// no third parties, works on any Vercel plan.
import { EVENTS_KEY, redisEnv } from './track.js'

const WINDOW_DAYS = 30
const AUTH_COOKIE = 'pa_key'

const PAGE_CSS = `
  body{font:15px/1.5 ui-sans-serif,system-ui,sans-serif;margin:0;background:#faf7f2;color:#1d1a16;padding:32px 20px 64px}
  main{max-width:760px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:#6b6459;margin:0 0 24px}`

function parseCookies(req) {
  const cookies = {}
  for (const part of String(req.headers.cookie || '').split(';')) {
    const eq = part.indexOf('=')
    if (eq > 0) {
      try {
        cookies[part.slice(0, eq).trim()] = decodeURIComponent(
          part.slice(eq + 1).trim(),
        )
      } catch {
        // Skip undecodable cookie values.
      }
    }
  }
  return cookies
}

/** Password form served at /analytics — POST keeps the key out of URLs. */
function loginPage(showError) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Portfolio analytics</title>
<style>${PAGE_CSS}
  form{background:#fff;border:1px solid #e6e0d6;border-radius:10px;padding:20px;max-width:360px;display:flex;flex-direction:column;gap:12px}
  input{font:inherit;padding:9px 12px;border:1px solid #e6e0d6;border-radius:8px}
  button{font:inherit;font-weight:600;padding:9px 12px;border:0;border-radius:8px;background:#c93512;color:#fff;cursor:pointer}
  .error{color:#c93512;margin:0}
</style></head><body><main>
  <h1>Portfolio analytics</h1>
  <p class="sub">Private dashboard — enter the password to continue.</p>
  <form method="post" action="/analytics">
    ${showError ? '<p class="error">That password didn’t match.</p>' : ''}
    <input type="password" name="key" placeholder="Password" autocomplete="current-password" autofocus>
    <button type="submit">View analytics</button>
  </form>
</main></body></html>`
}

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function countBy(items, pick) {
  const counts = new Map()
  for (const item of items) {
    const key = pick(item)
    if (key == null || key === '') continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

function barTable(title, rows, limit = 12) {
  const top = rows.slice(0, limit)
  const max = top[0]?.[1] ?? 1
  const body = top.length
    ? top
        .map(
          ([label, count]) => `
      <tr>
        <td class="label">${esc(label)}</td>
        <td class="count">${count}</td>
        <td class="bar"><div style="width:${Math.max(2, Math.round((count / max) * 100))}%"></div></td>
      </tr>`,
        )
        .join('')
    : '<tr><td class="label empty">no data yet</td></tr>'
  return `<section><h2>${esc(title)}</h2><table>${body}</table></section>`
}

export default async function handler(req, res) {
  const statsKey = process.env.STATS_KEY
  const store = redisEnv()
  res.setHeader('Cache-Control', 'private, no-store')
  res.setHeader('X-Robots-Tag', 'noindex')
  if (!statsKey || !store) {
    res
      .status(503)
      .send(
        'Portal not configured yet: connect an Upstash Redis store and set a STATS_KEY environment variable in Vercel, then redeploy.',
      )
    return
  }
  // Accept the key from the login form (POST), a ?key= link, or the cookie
  // set on a previous successful login.
  let candidate
  let fromForm = false
  if (req.method === 'POST') {
    fromForm = true
    let body = req.body
    if (typeof body === 'string') {
      body = Object.fromEntries(new URLSearchParams(body))
    }
    candidate = typeof body?.key === 'string' ? body.key : ''
  } else {
    candidate = new URL(req.url, 'http://x').searchParams.get('key')
    if (candidate == null) candidate = parseCookies(req)[AUTH_COOKIE] ?? null
  }

  if (candidate !== statsKey) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(401).send(loginPage(candidate != null && candidate !== ''))
    return
  }
  if (fromForm) {
    // Post/redirect/get: remember the login, then land on the clean URL.
    res.setHeader(
      'Set-Cookie',
      `${AUTH_COOKIE}=${encodeURIComponent(candidate)}; Path=/; Max-Age=7776000; HttpOnly; Secure; SameSite=Lax`,
    )
    res.setHeader('Location', '/analytics')
    res.status(303).end()
    return
  }

  const listRes = await fetch(`${store.url}/lrange/${EVENTS_KEY}/0/-1`, {
    headers: { Authorization: `Bearer ${store.token}` },
  })
  const raw = listRes.ok ? (await listRes.json()).result ?? [] : []
  const cutoff = Date.now() - WINDOW_DAYS * 86_400_000
  const events = []
  for (const item of raw) {
    try {
      const event = JSON.parse(item)
      if (event && typeof event.ts === 'number' && event.ts >= cutoff) {
        events.push(event)
      }
    } catch {
      // Skip malformed entries.
    }
  }

  const views = events.filter((e) => e.name === 'page-view')
  const contacts = events.filter((e) => e.name === 'contact')
  const byDay = countBy(views, (e) =>
    new Date(e.ts).toISOString().slice(0, 10),
  ).sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const chapterViews = countBy(
    events.filter((e) => e.name === 'chapter-view'),
    (e) => e.props?.chapter,
  )
  const chapterDone = new Map(
    countBy(
      events.filter((e) => e.name === 'chapter-complete'),
      (e) => e.props?.chapter,
    ),
  )
  const funnelRows = chapterViews.map(([chapter, viewed]) => [
    `${chapter} — ${chapterDone.get(chapter) ?? 0}/${viewed} finished`,
    viewed,
  ])

  const stat = (label, value) =>
    `<div class="stat"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`
  const topState = countBy(views, (e) => e.state)[0]?.[0] ?? '—'

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Portfolio analytics</title>
<style>${PAGE_CSS}
  .stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:28px}
  .stat{background:#fff;border:1px solid #e6e0d6;border-radius:10px;padding:12px 18px;min-width:120px}
  .stat strong{display:block;font-size:22px}
  .stat span{color:#6b6459;font-size:13px}
  section{margin-bottom:26px}
  h2{font-size:15px;margin:0 0 8px;color:#3d382f}
  table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e6e0d6;border-radius:10px;overflow:hidden}
  td{padding:7px 12px;border-top:1px solid #f0ebe2;vertical-align:middle}
  tr:first-child td{border-top:0}
  .label{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .label.empty{color:#a49a8b}
  .count{width:48px;text-align:right;color:#6b6459;font-variant-numeric:tabular-nums}
  .bar{width:40%}
  .bar div{height:10px;border-radius:5px;background:#c93512;min-width:2px}
</style></head><body><main>
  <h1>Portfolio analytics</h1>
  <p class="sub">Last ${WINDOW_DAYS} days · ${events.length} events</p>
  <div class="stats">
    ${stat('visits', views.length)}
    ${stat('contact clicks', contacts.length)}
    ${stat('top state', topState)}
  </div>
  ${barTable('Visits by day', byDay, WINDOW_DAYS)}
  ${barTable('States', countBy(views, (e) => (e.state ? `${e.state}${e.country && e.country !== 'US' ? ` (${e.country})` : ''}` : null)))}
  ${barTable('Cities', countBy(views, (e) => e.city))}
  ${barTable('Arrived via', countBy(events.filter((e) => e.name === 'arrival'), (e) => e.props?.source))}
  ${barTable('Referrers', countBy(views, (e) => { try { return e.ref ? new URL(e.ref).hostname : null } catch { return null } }))}
  ${barTable('Chapter funnel (viewed → finished)', funnelRows)}
  ${barTable('Time on site', countBy(events.filter((e) => e.name === 'session-end'), (e) => e.props?.duration))}
  ${barTable('Contact', countBy(contacts, (e) => `${e.props?.channel ?? '?'} after ${e.props?.engaged ?? '?'}`))}
  ${barTable('Devices', countBy(views, (e) => e.device))}
  ${barTable('All events', countBy(events, (e) => e.name), 24)}
  ${barTable('Client errors', countBy(events.filter((e) => e.name === 'client-error'), (e) => e.props?.message), 8)}
</main></body></html>`)
}
