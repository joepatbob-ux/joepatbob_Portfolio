// Private analytics portal: joepatbob.com/analytics (rewrite → /api/portal).
// Reads the event list written by /api/track and renders a self-contained
// HTML dashboard — no client JS (the site CSP forbids inline scripts), no
// third parties, works on any Vercel plan. Auth: password form → HttpOnly
// cookie; ?key= links also work.
import { EVENTS_KEY, redisEnv } from './track.js'

const WINDOW_DAYS = 30
const AUTH_COOKIE = 'pa_key'
const TZ = 'America/Chicago'
const DAY_MS = 86_400_000

// Events a visitor doesn't actively trigger — the complement is "playing
// with things". Mirrors PASSIVE_EVENTS in lib/analytics.ts plus the
// portal-only page-view marker.
const PASSIVE = new Set([
  'page-view',
  'arrival',
  'session-geo',
  'session-context',
  'session-return',
  'session-end',
  'chapter-view',
  'chapter-complete',
  'client-error',
])

const PAGE_CSS = `
  :root{--bg:#faf7f2;--card:#fff;--ink:#1d1a16;--mut:#6b6459;--line:#e6e0d6;--row:#f0ebe2;--accent:#c93512}
  @media (prefers-color-scheme: dark){:root{--bg:#191613;--card:#211d19;--ink:#f0ebe2;--mut:#a49a8b;--line:#38322b;--row:#2b2620;--accent:#f2411b}}
  body{font:15px/1.5 ui-sans-serif,system-ui,sans-serif;margin:0;background:var(--bg);color:var(--ink);padding:32px 20px 64px}
  main{max-width:880px;margin:0 auto}
  h1{font-size:22px;margin:0 0 4px}
  .sub{color:var(--mut);margin:0 0 24px}`

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
  form{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;max-width:360px;display:flex;flex-direction:column;gap:12px}
  input{font:inherit;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
  button{font:inherit;font-weight:600;padding:9px 12px;border:0;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}
  .error{color:var(--accent);margin:0}
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
  const max = Math.max(1, ...top.map((r) => r[1]))
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

/** YYYY-MM-DD in the dashboard's home timezone. */
function dayKey(ts) {
  return new Date(ts).toLocaleDateString('en-CA', { timeZone: TZ })
}

function hourOf(ts) {
  return Number(
    new Date(ts).toLocaleString('en-US', {
      timeZone: TZ,
      hour12: false,
      hour: 'numeric',
    }),
  )
}

function fmtWhen(ts) {
  return new Date(ts).toLocaleString('en-US', {
    timeZone: TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function refHost(ref) {
  try {
    const host = ref ? new URL(ref).hostname : null
    return host && !host.endsWith('joepatbob.com') ? host : null
  } catch {
    return null
  }
}

/** One column per day across the window, tooltips carry the exact date. */
function columnChart(views, now) {
  const perDay = new Map(countBy(views, (e) => dayKey(e.ts)))
  const days = []
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const ts = now - i * DAY_MS
    const key = dayKey(ts)
    const date = new Date(ts)
    days.push({
      key,
      count: perDay.get(key) ?? 0,
      label:
        i % 5 === 0
          ? date.toLocaleDateString('en-US', { timeZone: TZ, day: 'numeric' })
          : '',
    })
  }
  const max = Math.max(1, ...days.map((d) => d.count))
  const cols = days
    .map(
      (d) => `<div class="col" title="${d.key}: ${d.count}">
        <div style="height:${d.count ? Math.max(4, Math.round((d.count / max) * 100)) : 0}%"></div>
        <span>${d.label}</span></div>`,
    )
    .join('')
  return `<section><h2>Visits by day</h2><div class="card"><div class="cols">${cols}</div></div></section>`
}

/** 24-cell heat strip of visit start times, in home-timezone hours. */
function hourStrip(views) {
  const perHour = new Map(countBy(views, (e) => hourOf(e.ts)))
  const max = Math.max(1, ...perHour.values())
  const cells = []
  for (let h = 0; h < 24; h++) {
    const count = perHour.get(h) ?? 0
    const alpha = count ? 0.15 + 0.85 * (count / max) : 0
    cells.push(
      `<div class="hour" title="${h}:00 — ${count} visit${count === 1 ? '' : 's'}"
        style="background:${count ? `color-mix(in srgb, var(--accent) ${Math.round(alpha * 100)}%, transparent)` : 'transparent'}"></div>`,
    )
  }
  return `<section><h2>Time of day <span class="hint">(Central)</span></h2>
    <div class="card"><div class="hours">${cells.join('')}</div>
    <div class="hourlabels"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div></div></section>`
}

/** Stitch each session id's events into one visit story. */
function buildVisits(events) {
  const bySid = new Map()
  for (const event of events) {
    if (!event.sid) continue
    if (!bySid.has(event.sid)) bySid.set(event.sid, [])
    bySid.get(event.sid).push(event)
  }
  const visits = []
  for (const list of bySid.values()) {
    const pv = list.find((e) => e.name === 'page-view')
    if (!pv) continue
    const first = (name) => list.find((e) => e.name === name)
    const ctx = first('session-context')?.props
    const end = first('session-end')?.props
    visits.push({
      ts: pv.ts,
      where: pv.city
        ? `${pv.city}, ${pv.state ?? pv.country ?? ''}`
        : (pv.state ?? pv.country ?? 'unknown'),
      device: [pv.device, ctx?.theme].filter(Boolean).join(' · '),
      via: first('arrival')?.props?.source ?? refHost(pv.ref) ?? 'direct',
      returning: first('session-return')?.props?.returning === 'true',
      stay: end?.duration ?? '—',
      chapters: new Set(
        list.filter((e) => e.name === 'chapter-view').map((e) => e.props?.chapter),
      ).size,
      played: list.filter((e) => !PASSIVE.has(e.name)).length,
      contact: first('contact')?.props?.channel ?? null,
    })
  }
  return visits.sort((a, b) => b.ts - a.ts)
}

/** Duration buckets that count as a real stay (see durationBucket client-side). */
const SHORT_STAYS = new Set(['—', '<10s', '10-30s'])

/**
 * Visit → contact funnel over the stitched visits. Stages aren't strict
 * subsets of each other (someone can contact in 20 seconds) — each bar is
 * simply the share of visits that reached that behavior.
 */
function funnelSection(visits) {
  const total = visits.length
  const stages = [
    ['Visited', total],
    [
      'Engaged — 30s+ or started reading',
      visits.filter((v) => v.chapters >= 1 || !SHORT_STAYS.has(v.stay)).length,
    ],
    ['Deep read — 3+ chapters', visits.filter((v) => v.chapters >= 3).length],
    ['Hands-on — played with something', visits.filter((v) => v.played > 0).length],
    ['Contact clicked', visits.filter((v) => v.contact).length],
  ]
  const bars = stages
    .map(([label, count], i) => {
      const pct = total ? Math.round((count / total) * 100) : 0
      const width = total ? Math.max(22, (count / total) * 100) : 22
      return `<div class="fbar${count ? '' : ' zero'}" style="width:${width}%">
        ${esc(label)} · ${count}${i ? ` (${pct}%)` : ''}</div>`
    })
    .join('')
  return `<section><h2>Visit funnel <span class="hint">(visits with stories)</span></h2>
    <div class="card"><div class="funnel">${total ? bars : '<p class="empty-note">appears as new visits arrive</p>'}</div></div></section>`
}

/** Which arrival channels produce readers and contacts, not just clicks. */
function sourceTable(visits) {
  const bySource = new Map()
  for (const v of visits) {
    if (!bySource.has(v.via)) {
      bySource.set(v.via, { visits: 0, deep: 0, contact: 0 })
    }
    const row = bySource.get(v.via)
    row.visits += 1
    if (v.chapters >= 3) row.deep += 1
    if (v.contact) row.contact += 1
  }
  const rows = [...bySource.entries()]
    .sort((a, b) => b[1].visits - a[1].visits)
    .map(
      ([source, r]) => `<tr>
      <td class="label">${esc(source)}</td>
      <td class="num">${r.visits} visit${r.visits === 1 ? '' : 's'}</td>
      <td class="num">${r.deep} deep read${r.deep === 1 ? '' : 's'}</td>
      <td class="num">${r.contact} contact${r.contact === 1 ? '' : 's'}</td>
      <td class="num">${r.visits ? Math.round((r.contact / r.visits) * 100) : 0}%</td>
    </tr>`,
    )
    .join('')
  return `<section><h2>Conversion by source</h2><table>
    ${rows || '<tr><td class="label empty">no visits with stories yet</td></tr>'}</table></section>`
}

function depthRows(visits) {
  const buckets = [
    ['0 chapters', (v) => v.chapters === 0],
    ['1–2 chapters', (v) => v.chapters >= 1 && v.chapters <= 2],
    ['3–4 chapters', (v) => v.chapters >= 3 && v.chapters <= 4],
    ['5+ chapters', (v) => v.chapters >= 5],
  ]
  return buckets.map(([label, test]) => [label, visits.filter(test).length])
}

function visitsTable(visits, limit = 20) {
  if (!visits.length) {
    return `<section><h2>Recent visits</h2><table><tr><td class="label empty">no visits with stories yet — they appear as new traffic arrives</td></tr></table></section>`
  }
  const rows = visits
    .slice(0, limit)
    .map(
      (v) => `<tr>
      <td class="when">${esc(fmtWhen(v.ts))}${v.returning ? ' <span class="tag">return</span>' : ''}</td>
      <td>${esc(v.where)}</td>
      <td class="mut">${esc(v.device)}</td>
      <td>${esc(v.via)}</td>
      <td class="mut">${esc(v.stay)}</td>
      <td class="num">${v.chapters}ch · ${v.played} played</td>
      <td>${v.contact ? `<span class="contact">✉ ${esc(v.contact)}</span>` : ''}</td>
    </tr>`,
    )
    .join('')
  return `<section><h2>Recent visits</h2><div class="scroll"><table>
    <tr class="head"><td>When (Central)</td><td>Where</td><td>Context</td><td>Via</td><td>Stay</td><td>Depth</td><td></td></tr>
    ${rows}</table></div></section>`
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
  const raw = listRes.ok ? ((await listRes.json()).result ?? []) : []
  const now = Date.now()
  const cutoff = now - WINDOW_DAYS * DAY_MS
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
  const visits = buildVisits(events)
  const today = dayKey(now)
  const weekAgo = now - 7 * DAY_MS
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
  .stat{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:12px 18px;min-width:110px}
  .stat strong{display:block;font-size:22px}
  .stat span{color:var(--mut);font-size:13px}
  section{margin-bottom:26px}
  h2{font-size:15px;margin:0 0 8px}
  .hint{color:var(--mut);font-weight:400}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  td{padding:7px 12px;border-top:1px solid var(--row);vertical-align:middle}
  tr:first-child td{border-top:0}
  tr.head td{color:var(--mut);font-size:12px;text-transform:uppercase;letter-spacing:.04em}
  .label{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .label.empty{color:var(--mut)}
  .count,.num{text-align:right;color:var(--mut);font-variant-numeric:tabular-nums;white-space:nowrap}
  .count{width:48px}
  .mut{color:var(--mut)}
  .when{white-space:nowrap}
  .tag{font-size:11px;color:var(--accent);border:1px solid var(--accent);border-radius:99px;padding:0 6px;margin-left:4px}
  .contact{color:var(--accent);font-weight:600;white-space:nowrap}
  .bar{width:40%}
  .bar div{height:10px;border-radius:5px;background:var(--accent);min-width:2px}
  .funnel{display:flex;flex-direction:column;align-items:center;gap:5px}
  .fbar{background:var(--accent);color:#fff;border-radius:6px;text-align:center;font-size:13px;padding:6px 10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .fbar.zero{background:var(--row);color:var(--mut)}
  .empty-note{color:var(--mut);margin:0;text-align:center}
  .cols{display:flex;align-items:flex-end;gap:3px;height:96px}
  .col{flex:1;display:flex;flex-direction:column;justify-content:flex-end;height:100%;position:relative}
  .col div{background:var(--accent);border-radius:3px 3px 0 0}
  .col span{position:absolute;top:100%;left:0;right:0;text-align:center;font-size:10px;color:var(--mut)}
  .cols{margin-bottom:16px}
  .hours{display:flex;gap:3px}
  .hour{flex:1;height:26px;border:1px solid var(--row);border-radius:4px}
  .hourlabels{display:flex;justify-content:space-between;color:var(--mut);font-size:11px;margin-top:4px}
  .scroll{overflow-x:auto}
  .scroll table{min-width:720px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:0 20px}
  @media (max-width:640px){.grid{grid-template-columns:1fr}}
</style></head><body><main>
  <h1>Portfolio analytics</h1>
  <p class="sub">Last ${WINDOW_DAYS} days · ${events.length} events</p>
  <div class="stats">
    ${stat('today', views.filter((e) => dayKey(e.ts) === today).length)}
    ${stat('this week', views.filter((e) => e.ts >= weekAgo).length)}
    ${stat(`${WINDOW_DAYS} days`, views.length)}
    ${stat('contact clicks', contacts.length)}
    ${stat('top state', topState)}
  </div>
  ${funnelSection(visits)}
  ${columnChart(views, now)}
  ${hourStrip(views)}
  ${visitsTable(visits)}
  ${sourceTable(visits)}
  <div class="grid">
  ${barTable('Read depth (per visit)', depthRows(visits))}
  ${barTable('States', countBy(views, (e) => (e.state ? `${e.state}${e.country && e.country !== 'US' ? ` (${e.country})` : ''}` : null)))}
  ${barTable('Cities', countBy(views, (e) => e.city))}
  ${barTable('Arrived via', countBy(events.filter((e) => e.name === 'arrival'), (e) => e.props?.source))}
  ${barTable('Referrers', countBy(views, (e) => refHost(e.ref)))}
  ${barTable('Experience', countBy(events.filter((e) => e.name === 'session-context'), (e) => `${e.props?.theme ?? '?'} · ${e.props?.layout ?? '?'}`))}
  ${barTable('Devices', countBy(views, (e) => e.device))}
  ${barTable('Time on site', countBy(events.filter((e) => e.name === 'session-end'), (e) => e.props?.duration))}
  ${barTable('Chapter funnel (viewed → finished)', funnelRows)}
  ${barTable('Contact', countBy(contacts, (e) => `${e.props?.channel ?? '?'} after ${e.props?.engaged ?? '?'}`))}
  ${barTable('All events', countBy(events, (e) => e.name), 24)}
  ${barTable('Client errors', countBy(events.filter((e) => e.name === 'client-error'), (e) => e.props?.message), 8)}
  </div>
</main></body></html>`)
}
