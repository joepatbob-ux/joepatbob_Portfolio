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
  body{font:15px/1.5 ui-sans-serif,system-ui,sans-serif;margin:0;background:var(--bg);color:var(--ink);padding:28px 28px 64px}
  main{max-width:1600px;margin:0 auto}
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

/** Symbolic line length per stay bucket — literal minutes on a 24h axis
 * would be invisible, so longer stay = visibly longer line. */
const STAY_PX = {
  '<10s': 7,
  '10-30s': 11,
  '30-60s': 15,
  '1-3m': 21,
  '3-10m': 29,
  '10m+': 40,
}

function minuteOfDay(ts) {
  const [h, m] = new Date(ts)
    .toLocaleTimeString('en-GB', {
      timeZone: TZ,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    })
    .split(':')
  return Number(h) * 60 + Number(m)
}

const MAP_DAYS = 7
const MAX_WEEK = Math.ceil(WINDOW_DAYS / MAP_DAYS) - 1

/**
 * The visit map: one row per day (newest on top), a 24h track, and each
 * visit drawn at its start time — line length ≈ stay, color = layout,
 * filled = dark mode / outline = light. Pre-story page-views (no sid)
 * render as small neutral ticks so older data still shows. Paged 7 days
 * at a time via plain ?week=N links (no client JS under the CSP).
 */
/** Heat opacity for n visits, normalized against the busiest hour. */
function heatAlpha(n, max) {
  return (0.3 + 0.7 * (n / max)).toFixed(2)
}

function dayGrid(events, visits, now, week, link, dayLink) {
  // Pure heat map: rows carry only per-hour intensity; the individual
  // sessions live one click away in the day drill-in.
  const heat = new Map()
  const warm = (ts) => {
    const key = `${dayKey(ts)}|${Math.floor(minuteOfDay(ts) / 60)}`
    heat.set(key, (heat.get(key) ?? 0) + 1)
  }
  for (const v of visits) warm(v.ts)
  for (const e of events) {
    if (e.name === 'page-view' && !e.sid) warm(e.ts)
  }
  const max = Math.max(1, ...heat.values())
  const heatCells = (key) => {
    const cells = []
    for (let h = 0; h < 24; h++) {
      const n = heat.get(`${key}|${h}`) ?? 0
      if (!n) continue
      cells.push(
        `<i class="heat" style="left:${((h / 24) * 100).toFixed(2)}%;width:${(100 / 24).toFixed(2)}%;opacity:${heatAlpha(n, max)}"
          title="${n} visit${n === 1 ? '' : 's'}"></i>`,
      )
    }
    return cells.join('')
  }
  const dayLabel = (ts) =>
    new Date(ts).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: TZ,
    })
  const start = week * MAP_DAYS
  const end = Math.min(start + MAP_DAYS, WINDOW_DAYS)
  const rows = []
  for (let i = start; i < end; i++) {
    const ts = now - i * DAY_MS
    const weekday = new Date(ts).toLocaleDateString('en-US', {
      weekday: 'short',
      timeZone: TZ,
    })
    const weekend = weekday === 'Sat' || weekday === 'Sun'
    const key = dayKey(ts)
    rows.push(`<a class="dg-row" href="${dayLink(key)}" title="see this day's sessions">
      <span class="dg-day">${i === 0 ? '<b>today</b>' : `${esc(weekday)} ${esc(dayLabel(ts))}`}</span>
      <div class="dg-track${weekend ? ' weekend' : ''}">${heatCells(key)}</div>
    </a>`)
  }
  const head = `<div class="dg-row head"><span class="dg-day"></span>
    <div class="dg-labels"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div></div>`
  const legend = `<div class="dg-legend">
    <span class="hint">fewer</span>
    <span><i class="sw heat-sw" style="opacity:${heatAlpha(1, max)}"></i></span>
    <span><i class="sw heat-sw" style="opacity:${heatAlpha(Math.max(1, Math.round(max / 2)), max)}"></i></span>
    <span><i class="sw heat-sw" style="opacity:1"></i></span>
    <span class="hint">more visits per hour</span>
    <span class="hint">· click a day to see its individual sessions</span></div>`
  const range = `${dayLabel(now - (end - 1) * DAY_MS)} – ${week === 0 ? 'today' : dayLabel(now - start * DAY_MS)}`
  const pager = `<nav class="dg-pager">
    ${week < MAX_WEEK ? `<a href="${link(week + 1)}">‹ older</a>` : '<span class="off">‹ older</span>'}
    <span class="range">${esc(range)}</span>
    ${week > 0 ? `<a href="${link(week - 1)}">newer ›</a>` : '<span class="off">newer ›</span>'}
  </nav>`
  return `<section><div class="sechead"><h2>Visit map <span class="hint">(hour of day, Central · click a day for its sessions)</span></h2>${pager}</div>
    <div class="card">${head}${rows.join('')}${legend}</div></section>`
}

/**
 * Day drill-in: one swimlane per session on a full-width 24h axis, sorted
 * by start time — simultaneous sessions read as stacked overlapping lines.
 */
function dayDetail(events, visits, dayStr, now, backLink, dayLink) {
  const KNOWN = new Set(['mobile', 'tablet', 'desktop', 'cinema'])
  const lanes = [
    ...visits
      .filter((v) => dayKey(v.ts) === dayStr)
      .map((v) => ({
        ts: v.ts,
        where: v.where,
        cls: `d-${KNOWN.has(v.layout) ? v.layout : 'unknown'} ${v.theme === 'dark' ? 'f-dark' : 'f-light'}`,
        w: Math.round((STAY_PX[v.stay] ?? 8) * 1.6),
        meta: [v.device, v.via, v.stay, `${v.chapters}ch · ${v.played} played`, v.contact ? `✉ ${v.contact}` : null]
          .filter(Boolean)
          .join(' · '),
      })),
    ...events
      .filter((e) => e.name === 'page-view' && !e.sid && dayKey(e.ts) === dayStr)
      .map((e) => ({
        ts: e.ts,
        where: e.city ? `${e.city}, ${e.state ?? ''}` : (e.state ?? 'unknown'),
        cls: 'd-unknown f-dark',
        w: 13,
        meta: 'before visit stories',
      })),
  ].sort((a, b) => a.ts - b.ts)

  const time = (ts) =>
    new Date(ts).toLocaleTimeString('en-US', {
      timeZone: TZ,
      hour: 'numeric',
      minute: '2-digit',
    })
  const rows = lanes
    .map((l) => {
      const pct = ((minuteOfDay(l.ts) / 1440) * 100).toFixed(1)
      return `<div class="lane">
      <span class="lane-info">${esc(time(l.ts))} · ${esc(l.where)}</span>
      <div class="dg-track"><i class="dot ${l.cls}" style="left:min(${pct}%, calc(100% - ${l.w}px));width:${l.w}px"
        title="${esc(`${time(l.ts)} · ${l.where} · ${l.meta}`)}"></i></div>
      <span class="lane-meta">${esc(l.meta)}</span>
    </div>`
    })
    .join('')
  const head = `<div class="lane head"><span class="lane-info"></span>
    <div class="dg-labels"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div>
    <span class="lane-meta"></span></div>`
  const dayIndex = Math.max(
    0,
    [...Array(WINDOW_DAYS).keys()].find((i) => dayKey(now - i * DAY_MS) === dayStr) ?? 0,
  )
  const label = new Date(now - dayIndex * DAY_MS).toLocaleDateString('en-US', {
    timeZone: TZ,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  })
  const neighbor = (offset) => {
    const i = dayIndex + offset
    return i >= 0 && i < WINDOW_DAYS
      ? `<a href="${dayLink(dayKey(now - i * DAY_MS))}">${offset > 0 ? '‹ prev day' : 'next day ›'}</a>`
      : `<span class="off">${offset > 0 ? '‹ prev day' : 'next day ›'}</span>`
  }
  const pager = `<nav class="dg-pager">${neighbor(1)}<a href="${backLink}">week view</a>${neighbor(-1)}</nav>`
  const legend = `<div class="dg-legend">
    <span><i class="sw d-desktop f-dark"></i>desktop</span>
    <span><i class="sw d-mobile f-dark"></i>mobile</span>
    <span><i class="sw d-tablet f-dark"></i>tablet</span>
    <span><i class="sw d-cinema f-dark"></i>cinema</span>
    <span><i class="sw d-desktop f-dark"></i>dark mode</span>
    <span><i class="sw d-desktop f-light"></i>light mode</span>
    <span class="hint">line length ≈ time on page</span></div>`
  return `<section><div class="sechead"><h2>${esc(label)} <span class="hint">· ${lanes.length} session${lanes.length === 1 ? '' : 's'} (Central)</span></h2>${pager}</div>
    <div class="card">${lanes.length ? `<div class="scroll-lanes">${head}${rows}</div>${legend}` : '<p class="empty-note">no visits this day</p>'}</div></section>`
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
    const layout = ctx?.layout ?? pv.device
    const theme = ctx?.theme
    visits.push({
      ts: pv.ts,
      where: pv.city
        ? `${pv.city}, ${pv.state ?? pv.country ?? ''}`
        : (pv.state ?? pv.country ?? 'unknown'),
      layout,
      theme,
      device: [layout, theme].filter(Boolean).join(' · '),
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
  const reqUrl = new URL(req.url, 'http://x')
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
    candidate = reqUrl.searchParams.get('key')
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

  const week = Math.min(
    MAX_WEEK,
    Math.max(0, Math.trunc(Number(reqUrl.searchParams.get('week')) || 0)),
  )
  // Keep ?key= access working across pager links; cookie users get clean URLs.
  const viaQueryKey = reqUrl.searchParams.get('key') != null
  const keyQS = viaQueryKey ? `&key=${encodeURIComponent(candidate)}` : ''
  const pageLink = (n) => `/analytics?week=${n}${keyQS}`
  const dayLink = (d) => `/analytics?day=${d}${keyQS}`
  const dayParam = reqUrl.searchParams.get('day')
  const validDay =
    dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : null

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
  .stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 22px;flex:1;min-width:130px}
  .stat strong{display:block;font-size:28px;line-height:1.2}
  .stat span{color:var(--mut);font-size:13px}
  section{margin:0;min-width:0}
  .block{margin-bottom:24px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;align-items:start}
  @media (max-width:860px){.pair{grid-template-columns:1fr}}
  h2{font-size:12.5px;margin:0 0 8px;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;font-weight:600}
  .hint{color:var(--mut);font-weight:400;text-transform:none;letter-spacing:0}
  .card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:14px}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden}
  td{padding:8px 14px;border-top:1px solid var(--row);vertical-align:middle}
  tr:first-child td{border-top:0}
  tr:not(.head):hover td{background:var(--row)}
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
  .sechead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap}
  .sechead h2{margin:0}
  .dg-pager{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mut)}
  .dg-pager a{color:var(--accent);text-decoration:none;border:1px solid var(--line);border-radius:8px;padding:3px 10px;background:var(--card)}
  .dg-pager a:hover{border-color:var(--accent)}
  .dg-pager .off{opacity:.4;padding:3px 10px}
  .dg-pager .range{font-variant-numeric:tabular-nums}
  .dg-row{display:flex;align-items:center;gap:12px;height:26px;text-decoration:none;color:inherit;border-radius:8px}
  .dg-row.head{height:24px}
  a.dg-row:hover .dg-day{color:var(--accent)}
  a.dg-row:hover .dg-track{box-shadow:inset 0 0 0 1px var(--accent)}
  .dg-day{width:72px;flex-shrink:0;font-size:12px;color:var(--mut);text-align:right;white-space:nowrap}
  .dg-day b{color:var(--ink)}
  .heat{position:absolute;top:0;height:100%;background:var(--accent)}
  .heat-sw{background:var(--accent);margin-right:0}
  .lane{display:flex;align-items:center;gap:12px;height:30px}
  .lane.head{height:24px}
  .lane-info{width:160px;flex-shrink:0;font-size:12px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lane-meta{width:310px;flex-shrink:0;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .scroll-lanes{overflow-x:auto;min-width:0}
  @media (max-width:720px){.lane-meta{display:none}}
  .dg-track{position:relative;flex:1;height:16px;border-radius:8px;background:var(--row);background-image:linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:25% 100%}
  .dg-track.weekend{background-color:color-mix(in srgb, var(--row) 55%, var(--card))}
  .dg-labels{flex:1;display:flex;justify-content:space-between;font-size:10px;color:var(--mut)}
  .dot{position:absolute;top:3px;height:10px;border-radius:5px;box-sizing:border-box}
  .d-desktop{--c:var(--accent)}
  .d-mobile{--c:#3f82f6}
  .d-tablet{--c:#0f9d6d}
  .d-cinema{--c:#8b5cf6}
  .d-unknown{--c:var(--mut)}
  .f-dark{background:var(--c)}
  .f-light{background:transparent;border:2px solid var(--c)}
  .dg-legend{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:12px;font-size:12px;color:var(--mut)}
  .sw{display:inline-block;width:14px;height:8px;border-radius:4px;box-sizing:border-box;margin-right:5px;vertical-align:middle}
  .funnel{display:flex;flex-direction:column;align-items:center;gap:5px}
  .fbar{background:var(--accent);color:#fff;border-radius:6px;text-align:center;font-size:13px;padding:6px 12px;white-space:nowrap;min-width:fit-content}
  .fbar.zero{background:var(--row);color:var(--mut)}
  .empty-note{color:var(--mut);margin:0;text-align:center}
  .scroll{overflow-x:auto}
  .scroll table{min-width:720px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;align-items:start}
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
  <div class="block">${
    validDay
      ? dayDetail(events, visits, validDay, now, pageLink(week), dayLink)
      : dayGrid(events, visits, now, week, pageLink, dayLink)
  }</div>
  <div class="pair">
    ${funnelSection(visits)}
    ${sourceTable(visits)}
  </div>
  <div class="block">${visitsTable(visits)}</div>
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
