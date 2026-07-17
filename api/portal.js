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

/** Heat opacity for n visits, normalized against the busiest hour. */
function heatAlpha(n, max) {
  return (0.3 + 0.7 * (n / max)).toFixed(2)
}

/**
 * The visit map: a pure heat map, one row per day (newest on top), each
 * hour cell tinted by visit count. Each row is a <details> — clicking it
 * expands that day's individual sessions inline (native disclosure, no
 * client JS under the CSP). Paged 7 days at a time via ?week=N links.
 */
function dayGrid(events, visits, now, week, link) {
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
    const active = [...heat.keys()].some((k) => k.startsWith(`${key}|`))
    rows.push(`<details class="dg-details"${i === 0 && active ? ' open' : ''}>
      <summary class="dg-row" title="click for this day's sessions">
        <span class="dg-day">${i === 0 ? '<b>today</b>' : `${esc(weekday)} ${esc(dayLabel(ts))}`}</span>
        <div class="dg-track${weekend ? ' weekend' : ''}">${heatCells(key)}</div>
      </summary>
      <div class="dg-day-detail">${daySessions(events, visits, key)}</div>
    </details>`)
  }
  const head = `<div class="dg-row head"><span class="dg-day"></span>
    <div class="dg-labels"><span>12a</span><span>6a</span><span>12p</span><span>6p</span><span>11p</span></div></div>`
  const legend = `<div class="dg-legend">
    <span class="hint">fewer</span>
    <span><i class="sw heat-sw" style="opacity:${heatAlpha(1, max)}"></i></span>
    <span><i class="sw heat-sw" style="opacity:${heatAlpha(Math.max(1, Math.round(max / 2)), max)}"></i></span>
    <span><i class="sw heat-sw" style="opacity:1"></i></span>
    <span class="hint">more visits per hour</span>
    <span><i class="sw d-desktop f-dark"></i>desktop</span>
    <span><i class="sw d-mobile f-dark"></i>mobile</span>
    <span><i class="sw d-tablet f-dark"></i>tablet</span>
    <span><i class="sw d-cinema f-dark"></i>cinema</span>
    <span><i class="sw d-mode f-dark"></i>dark mode</span>
    <span><i class="sw d-mode f-light"></i>light mode</span>
    <span class="hint">ticks = interactions · click a day to expand its sessions</span></div>`
  const range = `${dayLabel(now - (end - 1) * DAY_MS)} – ${week === 0 ? 'today' : dayLabel(now - start * DAY_MS)}`
  const pager = `<nav class="dg-pager">
    ${week < MAX_WEEK ? `<a href="${link(week + 1)}">‹ older</a>` : '<span class="off">‹ older</span>'}
    <span class="range">${esc(range)}</span>
    ${week > 0 ? `<a href="${link(week - 1)}">newer ›</a>` : '<span class="off">newer ›</span>'}
  </nav>`
  return `<section><div class="sechead"><h2>Visit map <span class="hint">(hour of day, Central · click a day for its sessions)</span></h2>${pager}</div>
    <div class="card">${head}${rows.join('')}${legend}</div></section>`
}

function clockTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
  })
}

function fmtHour(h) {
  const hh = h % 24
  return hh === 0 ? '12a' : hh < 12 ? `${hh}a` : hh === 12 ? '12p' : `${hh - 12}p`
}

/**
 * One day's sessions as swimlanes, zoomed to the day's active hours so
 * short sessions are visible: the line spans the session's real start →
 * last-event time, and each interaction draws a tick at its moment.
 */
function daySessions(events, visits, key) {
  const KNOWN = new Set(['mobile', 'tablet', 'desktop', 'cinema'])
  const lanes = [
    ...visits
      .filter((v) => dayKey(v.ts) === key)
      .map((v) => {
        const start = minuteOfDay(v.ts)
        let end = minuteOfDay(v.endTs)
        if (end <= start) end = Math.min(start + 1, 1440)
        return {
          ts: v.ts,
          start,
          end,
          where: v.where,
          cls: `d-${KNOWN.has(v.layout) ? v.layout : 'unknown'} ${v.theme === 'dark' ? 'f-dark' : 'f-light'}`,
          marks: v.marks,
          meta: [v.device, v.via, v.stay, `${v.chapters}ch · ${v.played} played`, v.contact ? `✉ ${v.contact}` : null]
            .filter(Boolean)
            .join(' · '),
        }
      }),
    ...events
      .filter((e) => e.name === 'page-view' && !e.sid && dayKey(e.ts) === key)
      .map((e) => ({
        ts: e.ts,
        start: minuteOfDay(e.ts),
        end: Math.min(minuteOfDay(e.ts) + 1, 1440),
        where: e.city ? `${e.city}, ${e.state ?? ''}` : (e.state ?? 'unknown'),
        cls: 'd-unknown f-dark',
        marks: [],
        meta: 'before visit stories',
      })),
  ].sort((a, b) => a.ts - b.ts)
  if (!lanes.length) return '<p class="empty-note">no visits this day</p>'

  // Zoom window: the day's active hours, padded to hour boundaries and at
  // least an hour wide — this is what makes ticks legible.
  const zs = Math.floor(Math.min(...lanes.map((l) => l.start)) / 60) * 60
  let ze = Math.ceil(Math.max(...lanes.map((l) => l.end)) / 60) * 60
  if (ze - zs < 60) ze = Math.min(1440, zs + 60)
  const span = ze - zs
  const pos = (min) => (((min - zs) / span) * 100).toFixed(2)

  const hours = span / 60
  const step = hours <= 4 ? 1 : hours <= 8 ? 2 : hours <= 14 ? 3 : 6
  const labels = []
  for (let h = zs / 60; h <= ze / 60; h += step) {
    labels.push(`<span style="left:${pos(h * 60)}%">${fmtHour(h)}</span>`)
  }

  const rows = lanes
    .map((l) => {
      const ticks = l.marks
        .map((m) => {
          const at = Math.min(Math.max(minuteOfDay(m.ts), l.start), l.end)
          return `<i class="tick" style="left:${pos(at)}%" title="${esc(`${m.label} · ${clockTime(m.ts)}`)}"></i>`
        })
        .join('')
      return `<div class="lane">
      <span class="lane-info">${esc(clockTime(l.ts))} · ${esc(l.where)}</span>
      <div class="dg-track zoom">
        <i class="dot ${l.cls}" style="left:${pos(l.start)}%;width:max(8px, ${(((l.end - l.start) / span) * 100).toFixed(2)}%)"
          title="${esc(`${clockTime(l.ts)} · ${l.where} · ${l.meta}`)}"></i>${ticks}
      </div>
      <span class="lane-meta">${esc(l.meta)}</span>
    </div>`
    })
    .join('')
  const axis = `<div class="lane head"><span class="lane-info"></span>
    <div class="zoom-axis">${labels.join('')}</div>
    <span class="lane-meta hint">line = session span · ticks = interactions</span></div>`
  return `<div class="scroll-lanes">${axis}${rows}</div>`
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
      finished: list.some((e) => e.name === 'chapter-complete'),
      contact: first('contact')?.props?.channel ?? null,
      endTs: Math.max(...list.map((e) => e.ts)),
      marks: list
        .filter((e) => !PASSIVE.has(e.name))
        .map((e) => ({
          ts: e.ts,
          label: [e.name, e.props?.chapter ?? e.props?.action ?? e.props?.channel]
            .filter(Boolean)
            .join(' · '),
        }))
        .sort((a, b) => a.ts - b.ts),
    })
  }
  return visits.sort((a, b) => b.ts - a.ts)
}

/** Duration buckets that count as a real stay (see durationBucket client-side). */
const SHORT_STAYS = new Set(['—', '<10s', '10-30s'])

/**
 * Layers the owner can stack into a funnel. Each is a predicate over a
 * stitched visit; stages apply cumulatively, so every bar is a strict
 * subset of the one above it.
 */
const FUNNEL_LAYERS = {
  stay30: ['stayed 30s+', (v) => !SHORT_STAYS.has(v.stay)],
  ch1: ['read a chapter', (v) => v.chapters >= 1],
  ch3: ['read 3+ chapters', (v) => v.chapters >= 3],
  finished: ['finished a chapter', (v) => v.finished],
  played: ['played with a component', (v) => v.played > 0],
  return: ['returning visitor', (v) => v.returning],
  mobile: ['on mobile', (v) => v.layout === 'mobile'],
  desktop: ['on desktop', (v) => v.layout === 'desktop'],
  dark: ['in dark mode', (v) => v.theme === 'dark'],
  resume: ['came via resume', (v) => v.via === 'resume'],
  linkedin: ['came via linkedin', (v) => v.via === 'linkedin'],
  application: ['came via application', (v) => v.via === 'application'],
  contact: ['clicked contact', (v) => Boolean(v.contact)],
}
const MAX_LAYERS = 6

/**
 * User-built funnel: starts from all visits, and every layer the owner
 * adds filters the pool that survived the previous layer. Built with GET
 * links and a plain form — no client JS under the CSP.
 */
function funnelSection(visits, keys, hrefFor, hiddenInputs) {
  const total = visits.length
  let pool = visits
  let prev = total
  const bars = [`<div class="fbar" style="width:100%">All visits · ${total}</div>`]
  for (const key of keys) {
    const [label, test] = FUNNEL_LAYERS[key]
    pool = pool.filter(test)
    const pctAll = total ? Math.round((pool.length / total) * 100) : 0
    const pctPrev = prev ? Math.round((pool.length / prev) * 100) : 0
    const width = total ? Math.max(18, (pool.length / total) * 100) : 18
    bars.push(`<div class="fbar${pool.length ? '' : ' zero'}" style="width:${width}%">
      ${esc(label)} · ${pool.length} (${pctAll}%${keys.length > 1 ? ` · ${pctPrev}% of prev` : ''})
      <a class="fx" href="${hrefFor(keys.filter((k) => k !== key))}" title="remove this layer">×</a></div>`)
    prev = pool.length
  }
  const unused = Object.entries(FUNNEL_LAYERS).filter(([k]) => !keys.includes(k))
  const form =
    keys.length >= MAX_LAYERS || !unused.length
      ? ''
      : `<form class="fadd" method="GET" action="/analytics">${hiddenInputs}
        <input type="hidden" name="funnel" value="${keys.join(',')}">
        <select name="add">${unused.map(([k, [label]]) => `<option value="${k}">${esc(label)}</option>`).join('')}</select>
        <button>add layer</button>
        ${keys.length ? `<a class="fclear" href="${hrefFor([])}">clear</a>` : ''}</form>`
  const hint = keys.length
    ? ''
    : `<p class="fhint">Stack layers to build a funnel — each one filters the visits that made it through the layer above.
      Try <a href="${hrefFor(['stay30', 'ch3', 'contact'])}">engaged&nbsp;→ deep&nbsp;read&nbsp;→ contact</a>.</p>`
  return `<section><h2>Visit funnel <span class="hint">(each layer filters the previous)</span></h2>
    <div class="card"><div class="funnel">${bars.join('')}</div>${hint}${form}</div></section>`
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

// Vercel's preview/screenshot crawlers (California datacenters) polluted the
// stats until the ingest bot filter shipped on Jul 17 2026. Anything from CA
// before this cutoff is crawler traffic — the owner's real visitors weren't
// in CA in that window. One-time cleanup via ?scrub=ca-bots.
const SCRUB_BEFORE = Date.UTC(2026, 6, 18)

function isVercelBot(e) {
  return e.state === 'CA' && typeof e.ts === 'number' && e.ts < SCRUB_BEFORE
}

/** Tiny deterministic PRNG so ?demo=1 renders the same dataset every load. */
function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Generated 30-day dataset for ?demo=1 — validates the dashboard design at
 * realistic volume without touching stored data. Mirrors the stored event
 * shape exactly (props are strings, sids stitch into visit stories).
 */
function demoEvents(now) {
  const rnd = mulberry32(42)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]
  const CITIES = [
    ['Austin', 'TX'], ['Dallas', 'TX'], ['New York', 'NY'], ['Seattle', 'WA'],
    ['Chicago', 'IL'], ['Boston', 'MA'], ['Denver', 'CO'], ['Atlanta', 'GA'],
    ['Portland', 'OR'], ['San Francisco', 'CA'], ['Raleigh', 'NC'], ['Columbus', 'OH'],
  ]
  const LAYOUTS = ['desktop', 'desktop', 'desktop', 'mobile', 'mobile', 'tablet', 'cinema']
  const SOURCES = [null, null, null, 'resume', 'linkedin', 'application']
  const CHAPTERS = ['verdant', 'formation', 'sma', 'eim', 'wr', 'about']
  const COMPONENTS = ['scratch', 'phone-swap', 'carousel', 'wr-board', 'sticker-place', 'verdant']
  const DURS = [
    ['<10s', 0.15, 0], ['10-30s', 0.4, 0], ['30-60s', 0.9, 1],
    ['1-3m', 2.2, 2], ['3-10m', 6.5, 3], ['10m+', 16, 5],
  ]
  const events = []
  let sidN = 0
  for (let d = 0; d < WINDOW_DAYS; d++) {
    const dayTs = now - d * DAY_MS
    const weekday = new Date(dayTs).toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ })
    const isWeekend = weekday === 'Sat' || weekday === 'Sun'
    const count = d === 0 ? 5 : Math.floor(rnd() * (isWeekend ? 4 : 6))
    for (let v = 0; v < count; v++) {
      const sid = `demo${++sidN}`
      let targetMin = (8 + Math.floor(rnd() * 14)) * 60 + Math.floor(rnd() * 60)
      // Keep today's demo sessions in the past so lanes read naturally.
      if (d === 0) targetMin = Math.max(0, Math.min(targetMin, minuteOfDay(now) - 20))
      const start = dayTs + (targetMin - minuteOfDay(dayTs)) * 60_000
      const [city, state] = pick(CITIES)
      const layout = pick(LAYOUTS)
      const theme = rnd() < 0.4 ? 'dark' : 'light'
      const source = pick(SOURCES)
      const [dur, durMin, chMax] = DURS[Math.floor(rnd() * DURS.length)]
      const base = {
        sid, path: '/', country: 'US', state, city,
        device: layout === 'mobile' ? 'mobile' : 'desktop',
        ref: source === 'linkedin' ? 'https://www.linkedin.com/' : rnd() < 0.12 ? 'https://www.google.com/' : '',
      }
      const push = (offMin, name, props = {}) =>
        events.push({ ...base, ts: Math.round(start + offMin * 60_000), name, props })
      push(0, 'page-view')
      if (source) push(0.02, 'arrival', { source })
      push(0.03, 'session-context', { theme, layout })
      if (rnd() < 0.15) push(0.04, 'session-return', { returning: 'true', gap: pick(['<1d', '1-2d', '2-7d']) })
      const nch = Math.min(CHAPTERS.length, Math.floor(rnd() * (chMax + 2.2)))
      let plays = 0
      for (let c = 0; c < nch; c++) {
        const at = ((c + 1) / (nch + 1)) * durMin
        push(at, 'chapter-view', { chapter: CHAPTERS[c] })
        if (rnd() < 0.5) push(at + durMin * 0.05, 'chapter-complete', { chapter: CHAPTERS[c] })
        if (rnd() < 0.7) {
          push(at + durMin * 0.03, pick(COMPONENTS), { action: 'play' })
          plays++
        }
      }
      push(durMin, 'session-end', { duration: dur, engagement: `${nch}ch · ${plays}int` })
      if (nch >= 2 && rnd() < 0.3) {
        push(durMin * 0.97, 'contact', { channel: rnd() < 0.6 ? 'email' : 'linkedin', engaged: `${dur} · ${nch}ch` })
      }
    }
  }
  events.push({ ts: now - 4 * DAY_MS, name: 'client-error', props: { message: 'demo: sample error' }, sid: 'demoerr', path: '/', state: 'TX', city: 'Austin', device: 'desktop' })
  return events
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
  const demo = reqUrl.searchParams.get('demo') === '1'
  // Funnel layers come from ?funnel=a,b,c plus an optional ?add= from the
  // add-layer form; validate against the known set (Object.hasOwn guards
  // against prototype keys) and cap the depth.
  const funnelKeys = [
    ...new Set(
      `${reqUrl.searchParams.get('funnel') ?? ''},${reqUrl.searchParams.get('add') ?? ''}`
        .split(',')
        .map((k) => k.trim())
        .filter((k) => Object.hasOwn(FUNNEL_LAYERS, k)),
    ),
  ].slice(0, MAX_LAYERS)
  const funnelQS = funnelKeys.length ? `&funnel=${funnelKeys.join(',')}` : ''
  const pageLink = (n) => `/analytics?week=${n}${demo ? '&demo=1' : ''}${funnelQS}${keyQS}`
  const funnelHref = (keys) => {
    const parts = []
    if (week) parts.push(`week=${week}`)
    if (demo) parts.push('demo=1')
    if (keys.length) parts.push(`funnel=${keys.join(',')}`)
    if (viaQueryKey) parts.push(`key=${encodeURIComponent(candidate)}`)
    return `/analytics${parts.length ? `?${parts.join('&')}` : ''}`
  }
  const hiddenInputs = [
    week ? `<input type="hidden" name="week" value="${week}">` : '',
    demo ? '<input type="hidden" name="demo" value="1">' : '',
    viaQueryKey ? `<input type="hidden" name="key" value="${esc(candidate)}">` : '',
  ].join('')

  const now = Date.now()
  const cutoff = now - WINDOW_DAYS * DAY_MS
  let events = []
  let scrubbed = 0
  let botCount = 0
  if (demo) {
    events = demoEvents(now)
  } else {
    const listRes = await fetch(`${store.url}/lrange/${EVENTS_KEY}/0/-1`, {
      headers: { Authorization: `Bearer ${store.token}` },
    })
    const raw = listRes.ok ? ((await listRes.json()).result ?? []) : []
    const doScrub = reqUrl.searchParams.get('scrub') === 'ca-bots'
    const kept = []
    for (const item of raw) {
      try {
        const event = JSON.parse(item)
        if (!event) continue
        if (isVercelBot(event)) {
          botCount += 1
          if (doScrub) {
            scrubbed += 1
            continue
          }
        }
        kept.push(item)
        if (typeof event.ts === 'number' && event.ts >= cutoff) {
          events.push(event)
        }
      } catch {
        // Skip malformed entries.
      }
    }
    if (doScrub && scrubbed > 0) {
      // Rewrite the list without the crawler events (kept is head→tail
      // order, so RPUSH rebuilds it identically).
      botCount = 0
      await fetch(`${store.url}/pipeline`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${store.token}` },
        body: JSON.stringify([
          ['DEL', EVENTS_KEY],
          ...(kept.length ? [['RPUSH', EVENTS_KEY, ...kept]] : []),
        ]),
      })
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

  const realLink = `/analytics${viaQueryKey ? `?key=${encodeURIComponent(candidate)}` : ''}`
  const notices = []
  if (demo) {
    notices.push(
      `<p class="notice">Generated demo data for design validation — nothing here is real. <a href="${realLink}">Back to real data</a></p>`,
    )
  } else if (scrubbed > 0) {
    notices.push(
      `<p class="notice">Scrubbed ${scrubbed} Vercel preview-bot event${scrubbed === 1 ? '' : 's'} (CA, pre-filter). They're gone for good.</p>`,
    )
  } else if (botCount > 0) {
    notices.push(
      `<p class="notice">${botCount} stored event${botCount === 1 ? ' looks' : 's look'} like Vercel preview bots (California, from before the bot filter) —
        <a href="/analytics?scrub=ca-bots${keyQS}">scrub them</a></p>`,
    )
  }

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
  .notice{background:var(--card);border:1px solid var(--accent);border-radius:10px;padding:10px 14px;margin:0 0 20px;font-size:14px}
  .notice a{color:var(--accent)}
  .demo-link{color:var(--mut)}
  .sechead{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap}
  .sechead h2{margin:0}
  .dg-pager{display:flex;align-items:center;gap:10px;font-size:12px;color:var(--mut)}
  .dg-pager a{color:var(--accent);text-decoration:none;border:1px solid var(--line);border-radius:8px;padding:3px 10px;background:var(--card)}
  .dg-pager a:hover{border-color:var(--accent)}
  .dg-pager .off{opacity:.4;padding:3px 10px}
  .dg-pager .range{font-variant-numeric:tabular-nums}
  .dg-row{display:flex;align-items:center;gap:12px;height:26px;border-radius:8px}
  .dg-row.head{height:24px}
  summary.dg-row{cursor:pointer;list-style:none}
  summary.dg-row::-webkit-details-marker{display:none}
  summary.dg-row:hover .dg-day{color:var(--accent)}
  summary.dg-row:hover .dg-track{box-shadow:inset 0 0 0 1px var(--accent)}
  .dg-details[open]>summary .dg-track{box-shadow:inset 0 0 0 1px var(--accent)}
  .dg-day-detail{padding:6px 0 12px}
  .tick{position:absolute;top:50%;width:5px;height:5px;border-radius:50%;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);transform:translate(-50%,-50%)}
  .dg-track.zoom{height:16px;background-image:none}
  .zoom .dot{top:3px;height:10px}
  .zoom-axis{position:relative;flex:1;height:14px;font-size:10px;color:var(--mut)}
  .zoom-axis span{position:absolute;top:0;transform:translateX(-50%)}
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
  .d-mode{--c:var(--ink)}
  .f-dark{background:var(--c)}
  .f-light{background:transparent;border:2px solid var(--c)}
  .dg-legend{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:12px;font-size:12px;color:var(--mut)}
  .sw{display:inline-block;width:14px;height:8px;border-radius:4px;box-sizing:border-box;margin-right:5px;vertical-align:middle}
  .funnel{display:flex;flex-direction:column;align-items:center;gap:5px}
  .fbar{background:var(--accent);color:#fff;border-radius:6px;text-align:center;font-size:13px;padding:6px 12px;white-space:nowrap;min-width:fit-content}
  .fbar.zero{background:var(--row);color:var(--mut)}
  .fx{color:inherit;text-decoration:none;opacity:.65;margin-left:6px;font-weight:600}
  .fx:hover{opacity:1}
  .fadd{display:flex;gap:8px;align-items:center;justify-content:center;margin-top:14px;flex-wrap:wrap}
  .fadd select,.fadd button{font:inherit;font-size:13px;color:var(--ink);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:5px 10px}
  .fadd button{cursor:pointer;color:var(--accent);border-color:var(--accent)}
  .fclear{font-size:12px;color:var(--mut)}
  .fhint{color:var(--mut);font-size:13px;text-align:center;margin:12px 0 0}
  .fhint a{color:var(--accent)}
  .empty-note{color:var(--mut);margin:0;text-align:center}
  .scroll{overflow-x:auto}
  .scroll table{min-width:720px}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;align-items:start}
</style></head><body><main>
  <h1>Portfolio analytics${demo ? ' <span class="tag">demo</span>' : ''}</h1>
  <p class="sub">Last ${WINDOW_DAYS} days · ${events.length} events${demo ? '' : ` · <a class="demo-link" href="/analytics?demo=1${keyQS}">demo data</a>`}</p>
  ${notices.join('')}
  <div class="stats">
    ${stat('today', views.filter((e) => dayKey(e.ts) === today).length)}
    ${stat('this week', views.filter((e) => e.ts >= weekAgo).length)}
    ${stat(`${WINDOW_DAYS} days`, views.length)}
    ${stat('contact clicks', contacts.length)}
    ${stat('top state', topState)}
  </div>
  <div class="block">${dayGrid(events, visits, now, week, pageLink)}</div>
  <div class="pair">
    ${funnelSection(visits, funnelKeys, funnelHref, hiddenInputs)}
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
