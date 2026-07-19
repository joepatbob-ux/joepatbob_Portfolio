// Private analytics portal: joepatbob.com/analytics (rewrite → /api/portal).
// Reads the event list written by /api/track and renders a self-contained
// HTML dashboard — no client JS (the site CSP forbids inline scripts), no
// third parties, works on any Vercel plan. Auth: password form → HttpOnly
// cookie; ?key= links also work.
import { EVENTS_KEY, redisEnv } from './track.js'
import {
  COUNTRY_CENTROID,
  US_STATE_CENTROID,
  WORLD_H,
  WORLD_PATH,
  WORLD_W,
} from './world-map.js'

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
  'tab-return',
])

// Self-hosted site fonts (same-origin /fonts/ — allowed by the site CSP's
// font-src 'self'): Alte Haas Grotesk for display, Lato for body, JetBrains
// Mono for numbers and micro-labels. Palette mirrors styles/globals.css.
const PAGE_CSS = `
  @font-face{font-family:'Alte Haas';src:url('/fonts/AlteHaasGroteskBold.woff2') format('woff2');font-weight:700;font-display:swap}
  @font-face{font-family:'Lato';src:url('/fonts/Lato-400-latin.woff2') format('woff2');font-weight:400;font-display:swap}
  @font-face{font-family:'JetBrains Mono';src:url('/fonts/JetBrainsMono-400-latin.woff2') format('woff2');font-weight:400;font-display:swap}
  @font-face{font-family:'JetBrains Mono';src:url('/fonts/JetBrainsMono-700-latin.woff2') format('woff2');font-weight:700;font-display:swap}
  :root{--bg:#f0f0f0;--card:#f8f7f5;--ink:#0d0d0d;--mut:rgba(13,13,13,0.66);--line:rgba(0,0,0,0.11);--row:rgba(0,0,0,0.05);--accent:#c93512;--on-accent:#fff;
    --sans:'Lato',ui-sans-serif,system-ui,sans-serif;--display:'Alte Haas',ui-sans-serif,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace}
  @media (prefers-color-scheme: dark){:root{--bg:#101010;--card:#191919;--ink:#f0eeea;--mut:rgba(240,238,234,0.6);--line:rgba(255,255,255,0.13);--row:rgba(255,255,255,0.05);--accent:#f2411b;--on-accent:#0d0d0d}}
  *{box-sizing:border-box}
  body{font:15px/1.55 var(--sans);margin:0;background:var(--bg);color:var(--ink);padding:32px 30px 72px;-webkit-font-smoothing:antialiased}
  main{max-width:1500px;margin:0 auto}
  h1{font-family:var(--display);font-size:26px;letter-spacing:-.01em;margin:0 0 3px;font-weight:700}
  .sub{color:var(--mut);margin:0 0 26px;font-size:14px}
  a{color:var(--accent)}`

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
<style>${PAGE_CSS}${FORM_CSS}</style></head><body><main>
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

/**
 * Filter dimensions. Each maps a URL param (f_<key>) to a per-visit
 * predicate; clicking any breakdown row scopes the whole page to that
 * value. Single value per dimension, AND across dimensions.
 */
const FILTER_DIMS = {
  country: { label: 'country', test: (v, x) => v.country === x },
  state: { label: 'state', test: (v, x) => v.state === x },
  city: { label: 'city', test: (v, x) => v.city === x },
  source: { label: 'source', test: (v, x) => v.via === x },
  device: { label: 'device', test: (v, x) => v.layout === x },
  theme: { label: 'theme', test: (v, x) => v.theme === x },
  chapter: { label: 'chapter', test: (v, x) => v.chapterSet.has(x) },
  ref: { label: 'referrer', test: (v, x) => v.refHost === x },
  stay: { label: 'stay', test: (v, x) => v.stay === x },
}

/**
 * Breakdown card. Rows are [value, count]; when `dim` is given (and a
 * `flt` link builder is in scope), each row links to scope the page to
 * that value. `fmt` formats the count (e.g. durations).
 */
function barTable(title, rows, opts = {}) {
  const { limit = 12, fmt = (n) => n, dim = null, flt = null } = opts
  const top = rows.slice(0, limit)
  const max = Math.max(1, ...top.map((r) => r[1]))
  const body = top.length
    ? top
        .map(([label, count]) => {
          const cell =
            dim && flt
              ? `<a class="flt" href="${flt(dim, label)}">${esc(label)}</a>`
              : esc(label)
          return `
      <tr>
        <td class="label">${cell}</td>
        <td class="count">${esc(String(fmt(count)))}</td>
        <td class="bar"><div style="width:${Math.max(2, Math.round((count / max) * 100))}%"></div></td>
      </tr>`
        })
        .join('')
    : '<tr><td class="label empty">no data yet</td></tr>'
  return `<section><h2>${esc(title)}</h2><table>${body}</table></section>`
}

function fmtSecs(s) {
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`
}

/**
 * Average dwell per chapter, derived from timestamps already stored: the
 * gap between consecutive chapter-views in a session (the last chapter's
 * dwell runs to session-end). Gaps under 5s or over 15m are discarded as
 * scroll-through / walked-away noise.
 */
function dwellRows(events) {
  const bySid = new Map()
  for (const e of events) {
    if (!e.sid || (e.name !== 'chapter-view' && e.name !== 'session-end')) continue
    if (!bySid.has(e.sid)) bySid.set(e.sid, [])
    bySid.get(e.sid).push(e)
  }
  const agg = new Map()
  for (const list of bySid.values()) {
    const sorted = [...list].sort((a, b) => a.ts - b.ts)
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i]
      if (cur.name !== 'chapter-view') continue
      const next = sorted[i + 1]
      if (!next) continue
      const secs = Math.round((next.ts - cur.ts) / 1000)
      if (secs < 5 || secs > 900) continue
      const chapter = cur.props?.chapter ?? '?'
      if (!agg.has(chapter)) agg.set(chapter, { sum: 0, n: 0 })
      const a = agg.get(chapter)
      a.sum += secs
      a.n += 1
    }
  }
  return [...agg.entries()]
    .map(([chapter, { sum, n }]) => [chapter, Math.round(sum / n)])
    .sort((a, b) => b[1] - a[1])
}

/** Where visits end: the last chapter each session viewed. */
function exitRows(events) {
  const lastBySid = new Map()
  for (const e of events) {
    if (!e.sid || e.name !== 'chapter-view') continue
    const prev = lastBySid.get(e.sid)
    if (!prev || e.ts > prev.ts) lastBySid.set(e.sid, e)
  }
  return countBy([...lastBySid.values()], (e) => e.props?.chapter)
}

/** First-timers vs returners: does coming back change behavior? */
function returnSplit(visits) {
  const rows = [
    ['first visit', visits.filter((v) => !v.returning)],
    ['returning', visits.filter((v) => v.returning)],
  ]
    .map(([label, group]) => {
      const deep = group.filter((v) => v.chapters >= 3).length
      const contact = group.filter((v) => v.contact).length
      return `<tr>
      <td class="label">${label}</td>
      <td class="num">${group.length} visit${group.length === 1 ? '' : 's'}</td>
      <td class="num">${deep} deep read${deep === 1 ? '' : 's'}</td>
      <td class="num">${contact} contact${contact === 1 ? '' : 's'}</td>
      <td class="num">${group.length ? Math.round((contact / group.length) * 100) : 0}%</td>
    </tr>`
    })
    .join('')
  return `<section class="wide"><h2>First visit vs returning</h2><table>${rows}</table></section>`
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

/** Heat strength (as a color-mix percentage) for n visits, normalized
 * against the busiest hour in view. */
function heatPct(n, max) {
  return n ? Math.round((0.25 + 0.75 * (n / max)) * 100) : 0
}

/**
 * The visit map: a pure heat map, one row per day (newest on top), each
 * hour cell tinted by visit count. Each row is a <details> — clicking it
 * expands that day's individual sessions inline (native disclosure, no
 * client JS under the CSP). Paged 7 days at a time via ?week=N links.
 */
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
  // One continuous gradient per row: a color stop at every hour center,
  // so activity blooms and fades smoothly instead of stepping per cell.
  // Invisible per-hour cells on top keep the exact counts on hover.
  const heatCells = (key) => {
    const counts = Array.from({ length: 24 }, (_, h) => heat.get(`${key}|${h}`) ?? 0)
    if (!counts.some(Boolean)) return ''
    const stopAt = (n, posPct) =>
      `color-mix(in srgb, var(--accent) ${heatPct(n, max)}%, transparent) ${posPct.toFixed(2)}%`
    const stops = [
      stopAt(counts[0], 0),
      ...counts.map((n, h) => stopAt(n, ((h + 0.5) / 24) * 100)),
      stopAt(counts[23], 100),
    ]
    const hovers = counts
      .map((n, h) =>
        n
          ? `<i class="heat-hover" style="left:${((h / 24) * 100).toFixed(2)}%;width:${(100 / 24).toFixed(2)}%"
            title="${n} visit${n === 1 ? '' : 's'}"></i>`
          : '',
      )
      .join('')
    return `<div class="heatline" style="background:linear-gradient(90deg, ${stops.join(', ')})"></div>${hovers}`
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
    <i class="heat-scale"></i>
    <span class="hint">more visits per hour</span>
    <span class="hint">· click a day to see its sessions</span></div>`
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
 * Day drill-in that replaces the map panel: one swimlane per session,
 * zoomed to the day's active hours. The line spans the session's real
 * start → last-event time with a dot per interaction; clicking a
 * session's "events" reveals a box under the line with its full
 * chronological trail (native <details>, no client JS).
 */
function dayPanel(events, visits, key, now, backLink, dayLink) {
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
          trail: v.trail,
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
        trail: [],
        meta: 'before visit stories',
      })),
  ].sort((a, b) => a.ts - b.ts)

  let body = '<p class="empty-note">no visits this day</p>'
  if (lanes.length) {
    // Zoom window: the day's active hours, padded to hour boundaries and
    // at least an hour wide — this is what makes the dots legible.
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
        const laneRow = `
        <span class="lane-info">${esc(clockTime(l.ts))} · ${esc(l.where)}</span>
        <div class="dg-track zoom">
          <i class="dot ${l.cls}" style="left:${pos(l.start)}%;width:max(8px, ${(((l.end - l.start) / span) * 100).toFixed(2)}%)"
            title="${esc(`${clockTime(l.ts)} · ${l.where} · ${l.meta}`)}"></i>${ticks}
        </div>`
        if (!l.trail.length) {
          return `<div class="lane">${laneRow}<span class="lane-more hint">${esc(l.meta)}</span></div>`
        }
        const box = `<div class="lane-box">
          <p class="lane-sum">${esc(l.meta)}</p>
          ${l.trail.map((t) => `<div class="trail-row"><span>${esc(clockTime(t.ts))}</span>${esc(t.label)}</div>`).join('')}
        </div>`
        return `<details class="lane-d">
          <summary class="lane">${laneRow}<span class="lane-more">${l.trail.length} event${l.trail.length === 1 ? '' : 's'} ▾</span></summary>
          ${box}
        </details>`
      })
      .join('')
    const axis = `<div class="lane head"><span class="lane-info"></span>
      <div class="zoom-axis">${labels.join('')}</div>
      <span class="lane-more"></span></div>`
    body = `<div class="scroll-lanes">${axis}${rows}</div>
      <div class="dg-legend">
        <span><i class="sw d-desktop f-dark"></i>desktop</span>
        <span><i class="sw d-mobile f-dark"></i>mobile</span>
        <span><i class="sw d-tablet f-dark"></i>tablet</span>
        <span><i class="sw d-cinema f-dark"></i>cinema</span>
        <span><i class="sw d-mode f-dark"></i>dark mode</span>
        <span><i class="sw d-mode f-light"></i>light mode</span>
        <span class="hint">line = session span · diamonds = interactions · click a session for its events</span></div>`
  }

  const dayIndex =
    [...Array(WINDOW_DAYS).keys()].find((i) => dayKey(now - i * DAY_MS) === key) ?? 0
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
  return `<section><div class="sechead"><h2>${esc(label)} <span class="hint">· ${lanes.length} session${lanes.length === 1 ? '' : 's'} (Central)</span></h2>${pager}</div>
    <div class="card">${body}</div></section>`
}

/** Bookkeeping events that don't belong in a session's event trail. */
const TRAIL_SKIP = new Set([
  'page-view',
  'session-context',
  'session-return',
  'session-geo',
])

/**
 * Where visits came from, as a rotating globe with a ranked top-locations
 * list. Each page-view is placed by its stored lat/lon (Vercel-derived,
 * precise); older events fall back to a US-state or country centroid.
 *
 * The globe is pure CSS/SVG — two copies of the equirectangular map scroll
 * behind a circular mask with radial sphere shading, so the land and the
 * real data dots rotate together with no client JS. The list restores
 * at-a-glance reading and lets a city be clicked to filter the page.
 */
function worldMap(events, flt = null) {
  const px = (lon) => ((lon + 180) / 360) * WORLD_W
  const py = (lat) => ((90 - lat) / 180) * WORLD_H
  const spots = new Map()
  let located = 0
  let unlocated = 0
  const views = events.filter((e) => e.name === 'page-view')
  for (const e of views) {
    let lat, lon, key, label
    if (typeof e.lat === 'number' && typeof e.lon === 'number') {
      lat = e.lat
      lon = e.lon
      key = `${lat.toFixed(1)},${lon.toFixed(1)}`
      label = e.city ? `${e.city}, ${e.state ?? e.country ?? ''}` : (e.state ?? e.country ?? 'unknown')
    } else if (e.country === 'US' && US_STATE_CENTROID[e.state]) {
      ;[lat, lon] = US_STATE_CENTROID[e.state]
      key = `US-${e.state}`
      label = e.city ? `${e.city}, ${e.state}` : e.state
    } else if (COUNTRY_CENTROID[e.country]) {
      ;[lat, lon] = COUNTRY_CENTROID[e.country]
      key = e.country
      label = e.city ? `${e.city}, ${e.country}` : e.country
    } else {
      unlocated += 1
      continue
    }
    located += 1
    const spot = spots.get(key) ?? { lat, lon, n: 0, label, city: e.city ?? null }
    spot.n += 1
    spot.label = label
    spots.set(key, spot)
  }
  const sorted = [...spots.values()].sort((a, b) => b.n - a.n)
  const maxN = Math.max(1, ...sorted.map((s) => s.n))
  const dots = sorted
    .map((s) => {
      const r = (3.5 + 4 * Math.sqrt((s.n - 1) / maxN)).toFixed(1)
      return `<circle class="world-dot" cx="${px(s.lon).toFixed(1)}" cy="${py(s.lat).toFixed(1)}" r="${r}"><title>${esc(`${s.label} · ${s.n} visit${s.n === 1 ? '' : 's'}`)}</title></circle>`
    })
    .join('')
  // viewBox crops to the inhabited band so it fills the circle; the two SVG
  // copies scroll seamlessly (translateX -50% loops one full map width).
  const mapSvg = `<svg class="globe-map" viewBox="0 55 ${WORLD_W} 360" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path class="world-land" d="${WORLD_PATH}"/>${dots}</svg>`
  const globe = `<div class="globe" role="img" aria-label="Rotating globe of visitor locations">
    <div class="globe-spin">${mapSvg}${mapSvg}</div>
    <div class="globe-shade"></div>
  </div>`
  // Merge spots sharing a label (nearby lat/lon buckets of the same place)
  // so the readout lists each location once.
  const byLabel = new Map()
  for (const s of sorted) {
    const row = byLabel.get(s.label) ?? { label: s.label, city: s.city, n: 0 }
    row.n += s.n
    byLabel.set(s.label, row)
  }
  const list = [...byLabel.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, 8)
    .map((s) => {
      const name =
        flt && s.city
          ? `<a class="flt" href="${flt('city', s.city)}">${esc(s.label)}</a>`
          : esc(s.label)
      return `<li><span class="loc-name">${name}</span><span class="loc-n">${s.n}</span></li>`
    })
    .join('')
  const note = located
    ? `${located} of ${views.length} placed${unlocated ? ` · ${unlocated} unknown` : ''}`
    : 'appears as located visits arrive'
  // Flat map on desktop (room to see every dot at once); rotating globe on
  // mobile (a squished flat map is unreadable). Toggled by CSS media query.
  const flatCard = `<div class="card worldcard flat-only">
    <svg class="worldmap" viewBox="0 18 ${WORLD_W} 392" preserveAspectRatio="xMidYMid meet" role="img" aria-label="World map of visitor locations">
      <path class="world-land" d="${WORLD_PATH}"/>${dots}
    </svg></div>`
  const globeCard = `<div class="card globe-card mobile-only">
      ${globe}
      <ul class="globe-list">${list || '<li class="mut">no located visits yet</li>'}</ul>
    </div>`
  return `<section class="block"><h2>Where visitors are <span class="hint">(${esc(note)})</span></h2>
    ${flatCard}${globeCard}</section>`
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
    const chapterSet = new Set(
      list.filter((e) => e.name === 'chapter-view').map((e) => e.props?.chapter),
    )
    visits.push({
      sid: pv.sid,
      ts: pv.ts,
      where: pv.city
        ? `${pv.city}, ${pv.state ?? pv.country ?? ''}`
        : (pv.state ?? pv.country ?? 'unknown'),
      country: pv.country ?? null,
      state: pv.state ?? null,
      city: pv.city ?? null,
      refHost: refHost(pv.ref),
      layout,
      theme,
      device: [layout, theme].filter(Boolean).join(' · '),
      via: first('arrival')?.props?.source ?? refHost(pv.ref) ?? 'direct',
      returning: first('session-return')?.props?.returning === 'true',
      stay: end?.duration ?? '—',
      chapterSet,
      chapters: chapterSet.size,
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
      // Full chronological story for the per-session events box —
      // everything except the bookkeeping events.
      trail: list
        .filter((e) => !TRAIL_SKIP.has(e.name))
        .map((e) => ({
          ts: e.ts,
          label: [
            e.name,
            e.props?.chapter ??
              e.props?.action ??
              e.props?.source ??
              e.props?.channel ??
              e.props?.duration ??
              // client-error carries its message — surface what broke.
              (e.props?.message != null
                ? String(e.props.message).slice(0, 70)
                : null),
          ]
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
  threads: ['came via threads', (v) => v.via === 'threads'],
  instagram: ['came via instagram', (v) => v.via === 'instagram'],
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
function sourceTable(visits, flt = null) {
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
    .map(([source, r]) => {
      const cell = flt
        ? `<a class="flt" href="${flt('source', source)}">${esc(source)}</a>`
        : esc(source)
      return `<tr>
      <td class="label">${cell}</td>
      <td class="num">${r.visits} visit${r.visits === 1 ? '' : 's'}</td>
      <td class="num">${r.deep} deep</td>
      <td class="num">${r.contact} contact${r.contact === 1 ? '' : 's'}</td>
      <td class="num">${r.visits ? Math.round((r.contact / r.visits) * 100) : 0}%</td>
    </tr>`
    })
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

/**
 * Data-quality audit (?data=1): what's literally stored, and which of it
 * looks off. Three suspect classes — pre-story page-views (no sid),
 * ghost sessions (a sid whose only event is the page-view: a crawler that
 * beaconed once, or an instant bounce), and sessions with no
 * session-context (left before the idle-deferred setup fired — usually a
 * quick human bounce, occasionally a partial bot).
 */
function dataCheckPage(events, visits, backLink, scrubNote) {
  const bySid = new Map()
  for (const e of events) {
    if (!e.sid) continue
    if (!bySid.has(e.sid)) bySid.set(e.sid, [])
    bySid.get(e.sid).push(e)
  }
  const where = (e) =>
    e.city ? `${e.city}, ${e.state ?? ''}` : (e.state ?? e.country ?? '—')
  const suspects = []
  for (const [sid, list] of bySid) {
    const pv = list.find((e) => e.name === 'page-view')
    if (!pv) continue
    if (list.length === 1) {
      suspects.push([pv, sid, 'ghost — page-view only, then silence (crawler or instant bounce)'])
    } else if (!list.some((e) => e.name === 'session-context')) {
      suspects.push([pv, sid, 'no context — left before setup finished (quick bounce, or partial bot)'])
    }
  }
  const preStory = events.filter((e) => e.name === 'page-view' && !e.sid)
  for (const e of preStory) suspects.push([e, '—', 'pre-story page-view (before session ids shipped)'])
  suspects.sort((a, b) => b[0].ts - a[0].ts)

  const tile = (label, value) =>
    `<div class="stat"><strong>${esc(String(value))}</strong><span>${esc(label)}</span></div>`
  const suspectRows = suspects.length
    ? suspects
        .slice(0, 40)
        .map(
          ([e, sid, reason]) => `<tr>
          <td class="when mut">${esc(fmtWhen(e.ts))}</td>
          <td class="label">${esc(where(e))}</td>
          <td class="mut">${esc(sid)}</td>
          <td>${esc(reason)}</td></tr>`,
        )
        .join('')
    : '<tr><td class="label empty">nothing looks suspicious</td></tr>'

  const raw = [...events]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 150)
    .map(
      (e) => `<tr>
      <td class="when mut">${esc(fmtWhen(e.ts))}</td>
      <td class="label">${esc(e.name)}</td>
      <td class="mut">${esc(e.sid ?? '—')}</td>
      <td>${esc(where(e))}</td>
      <td class="mut">${esc(e.device ?? '—')}</td>
      <td class="props mut">${esc(JSON.stringify(e.props ?? {}).slice(0, 80))}</td></tr>`,
    )
    .join('')

  // Client errors grouped by full stored message (not CSS-clipped), so the
  // WebKit "(evaluating '…')" culprit is readable on any device.
  const byMsg = new Map()
  for (const e of events) {
    if (e.name !== 'client-error') continue
    const msg = String(e.props?.message ?? 'unknown')
    if (!byMsg.has(msg)) byMsg.set(msg, { n: 0, last: 0, kind: e.props?.kind ?? '?' })
    const r = byMsg.get(msg)
    r.n += 1
    if (e.ts > r.last) r.last = e.ts
  }
  const errRows = [...byMsg.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .map(
      ([msg, r]) => `<tr>
        <td class="num">${r.n}</td>
        <td class="when mut">${esc(fmtWhen(r.last))}</td>
        <td class="errmsg">${esc(msg)}</td></tr>`,
    )
    .join('')
  const errSection = byMsg.size
    ? `<section class="block"><h2>Client errors <span class="hint">(full message, most frequent first)</span></h2>
      <div class="scroll"><table>
      <tr class="head"><td>Count</td><td>Last seen</td><td>Message (as the browser reported it)</td></tr>
      ${errRows}</table></div></section>`
    : ''

  return `
  <div class="sechead"><h1>Data check</h1>
    <nav class="dg-pager"><a href="${backLink}">‹ back to dashboard</a></nav></div>
  <p class="sub">Everything stored in the last ${WINDOW_DAYS} days, and what looks off.</p>
  ${scrubNote}
  ${errSection}
  <div class="stats">
    ${tile('events stored', events.length)}
    ${tile('sessions with stories', bySid.size)}
    ${tile('suspect entries', suspects.length)}
    ${tile('pre-story page-views', preStory.length)}
  </div>
  <section class="block"><h2>Suspects <span class="hint">(newest first, top 40)</span></h2>
    <div class="scroll"><table>
    <tr class="head"><td>When (Central)</td><td>Where</td><td>Session</td><td>Why it's flagged</td></tr>
    ${suspectRows}</table></div></section>
  <section class="block"><h2>Raw events <span class="hint">(newest 150, exactly as stored)</span></h2>
    <div class="scroll"><table class="raw">
    <tr class="head"><td>When</td><td>Event</td><td>Session</td><td>Where</td><td>Device</td><td>Props</td></tr>
    ${raw || '<tr><td class="label empty">no data yet</td></tr>'}</table></div></section>`
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
  // [city, region, country, lat, lon] — mostly US, a few international so
  // the demo world map spans the globe.
  const CITIES = [
    ['Austin', 'TX', 'US', 30.27, -97.74], ['Dallas', 'TX', 'US', 32.78, -96.8],
    ['New York', 'NY', 'US', 40.71, -74.01], ['Seattle', 'WA', 'US', 47.61, -122.33],
    ['Chicago', 'IL', 'US', 41.88, -87.63], ['Boston', 'MA', 'US', 42.36, -71.06],
    ['Denver', 'CO', 'US', 39.74, -104.99], ['Atlanta', 'GA', 'US', 33.75, -84.39],
    ['Portland', 'OR', 'US', 45.52, -122.68], ['San Francisco', 'CA', 'US', 37.77, -122.42],
    ['Raleigh', 'NC', 'US', 35.78, -78.64], ['Columbus', 'OH', 'US', 39.96, -83.0],
    ['London', 'ENG', 'GB', 51.51, -0.13], ['Toronto', 'ON', 'CA', 43.65, -79.38],
    ['Berlin', 'BE', 'DE', 52.52, 13.4], ['Tokyo', '13', 'JP', 35.68, 139.65],
    ['Sydney', 'NSW', 'AU', -33.87, 151.21], ['São Paulo', 'SP', 'BR', -23.55, -46.63],
    ['Bengaluru', 'KA', 'IN', 12.97, 77.59],
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
      const [city, state, country, clat, clon] = pick(CITIES)
      const layout = pick(LAYOUTS)
      const theme = rnd() < 0.4 ? 'dark' : 'light'
      const source = pick(SOURCES)
      const [dur, durMin, chMax] = DURS[Math.floor(rnd() * DURS.length)]
      // Jitter a little so repeat visits from a city don't stack exactly.
      const base = {
        sid, path: '/', country, state, city,
        lat: Math.round((clat + (rnd() - 0.5) * 0.4) * 100) / 100,
        lon: Math.round((clon + (rnd() - 0.5) * 0.4) * 100) / 100,
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
        push(durMin * 0.97, 'contact', {
          channel: pick(['email', 'email', 'linkedin', 'resume', 'email-copy']),
          engaged: `${dur} · ${nch}ch`,
        })
      }
      if (rnd() < 0.12) push(durMin * 0.5, 'tab-return', {})
    }
  }
  events.push({ ts: now - 4 * DAY_MS, name: 'client-error', props: { message: 'demo: sample error' }, sid: 'demoerr', path: '/', state: 'TX', city: 'Austin', device: 'desktop' })
  return events
}

const FORM_CSS = `
  form{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;max-width:360px;display:flex;flex-direction:column;gap:12px}
  input{font:inherit;padding:9px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
  button{font:inherit;font-weight:600;padding:9px 12px;border:0;border-radius:8px;background:var(--accent);color:#fff;cursor:pointer}
  .error{color:var(--accent);margin:0}`

const DASH_CSS = `
  .stats{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px}
  .stat{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:18px 22px;flex:1;min-width:132px}
  .stat strong{display:block;font-family:var(--display);font-size:32px;line-height:1.1;letter-spacing:-.02em}
  .stat span{color:var(--mut);font-size:11px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.05em}
  section{margin:0;min-width:0}
  .block{margin-bottom:24px}
  .pair{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;align-items:start}
  @media (max-width:860px){.pair{grid-template-columns:1fr}}
  h2{font-family:var(--mono);font-size:11px;margin:0 0 10px;color:var(--mut);text-transform:uppercase;letter-spacing:.09em;font-weight:400}
  .hint{color:var(--mut);font-weight:400;text-transform:none;letter-spacing:0;font-family:var(--sans)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px}
  table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  td{padding:9px 15px;border-top:1px solid var(--line);vertical-align:middle}
  tr:first-child td{border-top:0}
  tr:not(.head):hover td{background:var(--row)}
  tr.head td{color:var(--mut);font-size:10px;font-family:var(--mono);text-transform:uppercase;letter-spacing:.07em}
  .label{max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .label.empty{color:var(--mut)}
  .count,.num{text-align:right;color:var(--mut);font-family:var(--mono);font-variant-numeric:tabular-nums;white-space:nowrap;font-size:13px}
  a.flt{color:inherit;text-decoration:none}
  a.flt:hover{color:var(--accent)}
  td.label a.flt{border-bottom:1px solid transparent}
  td.label a.flt:hover{border-bottom-color:var(--accent)}
  .filterbar{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:-6px 0 24px}
  .fbar-eyebrow{font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--mut)}
  .chip{display:inline-flex;align-items:center;gap:6px;font-family:var(--mono);font-size:12px;color:var(--accent);border:1px solid var(--accent);border-radius:99px;padding:3px 11px;text-decoration:none;background:color-mix(in srgb, var(--accent) 8%, transparent)}
  .chip b{font-weight:400;opacity:.7}
  .chip:hover{background:color-mix(in srgb, var(--accent) 16%, transparent)}
  .chip-clear{color:var(--mut);border-color:var(--line);background:none}
  .fbar-count{font-family:var(--mono);font-size:11px;color:var(--mut);margin-left:2px}
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
  .dg-row{display:flex;align-items:center;gap:12px;height:26px;border-radius:8px;text-decoration:none;color:inherit}
  .dg-row.head{height:24px}
  a.dg-row:hover .dg-day{color:var(--accent)}
  a.dg-row:hover .dg-track{box-shadow:inset 0 0 0 1px var(--accent)}
  .lane-d summary{list-style:none;cursor:pointer}
  .lane-d summary::-webkit-details-marker{display:none}
  .lane-d summary:hover .lane-more{color:var(--accent)}
  .lane-d[open] .lane-more{color:var(--accent)}
  .lane-box{margin:2px 0 12px 172px;padding:10px 14px;background:var(--row);border-radius:10px;font-size:13px;max-width:560px}
  .lane-sum{margin:0 0 8px;color:var(--ink)}
  .trail-row{display:flex;gap:12px;padding:2px 0;color:var(--mut)}
  .trail-row span{width:70px;flex-shrink:0;text-align:right;font-variant-numeric:tabular-nums}
  .tick{position:absolute;top:50%;width:5.5px;height:5.5px;border-radius:1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.25);transform:translate(-50%,-50%) rotate(45deg)}
  .dg-track.zoom{height:16px;background-image:none}
  .zoom .dot{top:3px;height:10px}
  .zoom-axis{position:relative;flex:1;height:14px;font-size:10px;color:var(--mut)}
  .zoom-axis span{position:absolute;top:0;transform:translateX(-50%)}
  .dg-day{width:72px;flex-shrink:0;font-size:12px;color:var(--mut);text-align:right;white-space:nowrap}
  .dg-day b{color:var(--ink)}
  .heatline{position:absolute;inset:0;border-radius:8px}
  .heat-hover{position:absolute;top:0;height:100%}
  .heat-scale{display:inline-block;width:90px;height:8px;border-radius:4px;background:linear-gradient(90deg, transparent, var(--accent));vertical-align:middle}
  .lane{display:flex;align-items:center;gap:12px;height:30px}
  .lane.head{height:24px}
  .lane-info{width:160px;flex-shrink:0;font-size:12px;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .lane-more{width:110px;flex-shrink:0;font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:left}
  .scroll-lanes{min-width:0}
  @media (max-width:720px){.lane-more{display:none}.lane-box{margin-left:0}}
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
  /* Flat map (desktop) vs globe (mobile) — one shown at a time. */
  .flat-only{display:block}
  .mobile-only{display:none}
  @media (max-width:720px){.flat-only{display:none}.mobile-only{display:flex}}
  .worldcard{padding:10px}
  .worldmap{width:100%;height:auto;display:block}
  .worldmap .world-land{fill:var(--row)}
  .worldmap .world-dot{fill:var(--accent);fill-opacity:.7;stroke:var(--card);stroke-width:1}
  .globe-card{gap:26px;align-items:center}
  .globe{position:relative;flex:0 0 auto;width:clamp(230px,34vw,330px);aspect-ratio:1;border-radius:50%;overflow:hidden;cursor:grab;touch-action:pan-y;background:radial-gradient(circle at 38% 32%, color-mix(in srgb, var(--ink) 7%, var(--card)), color-mix(in srgb, var(--ink) 16%, var(--card)))}
  .globe:active{cursor:grabbing}
  .globe-spin{display:flex;height:100%;width:max-content;animation:globe-rot 48s linear infinite;will-change:transform}
  .globe-map{height:100%;width:auto;display:block;flex:0 0 auto}
  @keyframes globe-rot{to{transform:translateX(-50%)}}
  .globe-map .world-land{fill:color-mix(in srgb, var(--ink) 26%, transparent)}
  .globe-map .world-dot{fill:var(--accent);fill-opacity:.9;stroke:var(--card);stroke-width:1.2}
  .globe-shade{position:absolute;inset:0;border-radius:50%;pointer-events:none;
    background:radial-gradient(circle at 36% 30%, rgba(255,255,255,.16), rgba(255,255,255,0) 46%);
    box-shadow:inset -16px -20px 42px rgba(0,0,0,.34), inset 12px 14px 34px rgba(0,0,0,.10), inset 0 0 0 1px var(--line)}
  .globe-list{flex:1;min-width:0;list-style:none;margin:0;padding:0;columns:2;column-gap:26px}
  .globe-list li{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--line);break-inside:avoid}
  .loc-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .loc-n{font-family:var(--mono);font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums}
  @media (prefers-reduced-motion: reduce){.globe-spin{animation:none}}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;align-items:start}
  .grid .wide{grid-column:span 2}
  @media (max-width:720px){.grid .wide{grid-column:span 1}}
  /* ── Mobile ─────────────────────────────────────────────── */
  @media (max-width:640px){
    body{padding:20px 15px 56px}
    h1{font-size:22px}
    .stats{gap:9px}
    .stat{flex:1 1 calc(50% - 5px);min-width:0;padding:12px 14px;border-radius:11px}
    .stat strong{font-size:23px}
    .stat span{font-size:10px}
    .globe-card{flex-direction:column;gap:16px}
    .globe{width:min(76vw,300px)}
    .globe-list{width:100%;columns:2;column-gap:18px}
    .dg-day,.dg-day b{font-size:11px}
    .dg-day{width:56px}
    .lane-info{width:118px}
    .sechead{gap:6px}
  }
  @media (max-width:360px){
    .globe-list{columns:1}
    .stat{flex-basis:100%}
  }
  .raw td{font-size:12.5px}
  .raw .props{font-family:ui-monospace,SFMono-Regular,monospace;font-size:11px;max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .errmsg{font-family:ui-monospace,SFMono-Regular,monospace;font-size:12px;white-space:normal;word-break:break-word;color:var(--accent)}
  .sechead h1{margin:0}`

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
  // Active segment filters (f_<dim>=value): one value per dim, AND across.
  const filters = {}
  for (const dim of Object.keys(FILTER_DIMS)) {
    const val = reqUrl.searchParams.get(`f_${dim}`)
    if (val != null && val !== '') filters[dim] = val
  }
  const dayParam = reqUrl.searchParams.get('day')
  const validDay =
    dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : null
  const dataView = reqUrl.searchParams.get('data') === '1'

  // Single source of truth for portal URLs — every link merges the current
  // view state (week/day/demo/funnel/filters/key) with its overrides.
  const cur = { week, demo, funnel: funnelKeys, filters, key: viaQueryKey ? candidate : null }
  const makeHref = (o) => {
    const parts = []
    if (o.week) parts.push(`week=${o.week}`)
    if (o.day) parts.push(`day=${o.day}`)
    if (o.demo) parts.push('demo=1')
    if (o.funnel?.length) parts.push(`funnel=${o.funnel.join(',')}`)
    for (const [d, v] of Object.entries(o.filters || {})) parts.push(`f_${d}=${encodeURIComponent(v)}`)
    if (o.key) parts.push(`key=${encodeURIComponent(o.key)}`)
    return `/analytics${parts.length ? `?${parts.join('&')}` : ''}`
  }
  const pageLink = (n) => makeHref({ ...cur, week: n })
  const dayLink = (d) => makeHref({ ...cur, day: d })
  const funnelHref = (keys) => makeHref({ ...cur, funnel: keys })
  const filterHref = (dim, val) => makeHref({ ...cur, filters: { ...filters, [dim]: String(val) } })
  const removeFilterHref = (dim) => {
    const f = { ...filters }
    delete f[dim]
    return makeHref({ ...cur, filters: f })
  }
  const hiddenInputs = [
    week ? `<input type="hidden" name="week" value="${week}">` : '',
    demo ? '<input type="hidden" name="demo" value="1">' : '',
    ...Object.entries(filters).map(
      ([d, v]) => `<input type="hidden" name="f_${d}" value="${esc(v)}">`,
    ),
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

  const allVisits = buildVisits(events)
  const activeFilters = Object.entries(filters)
  // Scope the whole dashboard: keep visits matching every active filter,
  // then keep the events belonging to those visits.
  const visits = activeFilters.length
    ? allVisits.filter((v) => activeFilters.every(([d, val]) => FILTER_DIMS[d].test(v, val)))
    : allVisits
  const sids = new Set(visits.map((v) => v.sid))
  const scoped = activeFilters.length
    ? events.filter((e) => e.sid && sids.has(e.sid))
    : events
  const views = scoped.filter((e) => e.name === 'page-view')
  const contacts = scoped.filter((e) => e.name === 'contact')
  const today = dayKey(now)
  const weekAgo = now - 7 * DAY_MS
  const chapterViews = countBy(
    scoped.filter((e) => e.name === 'chapter-view'),
    (e) => e.props?.chapter,
  )
  const chapterDone = new Map(
    countBy(
      scoped.filter((e) => e.name === 'chapter-complete'),
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

  // Active-filter chips: each removes itself; "clear" drops all.
  const filterBar = activeFilters.length
    ? `<div class="filterbar"><span class="fbar-eyebrow">filtered to</span>${activeFilters
        .map(
          ([d, v]) =>
            `<a class="chip" href="${removeFilterHref(d)}" title="remove">${esc(FILTER_DIMS[d].label)} · ${esc(v)} <b>✕</b></a>`,
        )
        .join('')}<a class="chip chip-clear" href="${makeHref({ ...cur, filters: {} })}">clear all</a>
        <span class="fbar-count">${visits.length} visit${visits.length === 1 ? '' : 's'}</span></div>`
    : ''

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
  if (dataView) {
    res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Portfolio analytics — data check</title>
<style>${PAGE_CSS}${DASH_CSS}</style></head><body><main>
${dataCheckPage(events, allVisits, funnelHref(funnelKeys), notices.join(''))}
</main></body></html>`)
    return
  }
  res.status(200).send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Portfolio analytics</title>
<style>${PAGE_CSS}${DASH_CSS}</style></head><body><main>
  <h1>Portfolio analytics${demo ? ' <span class="tag">demo</span>' : ''}</h1>
  <p class="sub">Last ${WINDOW_DAYS} days · ${events.length} events${demo ? '' : ` · <a class="demo-link" href="/analytics?demo=1${keyQS}">demo data</a>`} · <a class="demo-link" href="/analytics?data=1${demo ? '&demo=1' : ''}${keyQS}">data check</a></p>
  ${notices.join('')}
  <div class="stats">
    ${stat('today', views.filter((e) => dayKey(e.ts) === today).length)}
    ${stat('this week', views.filter((e) => e.ts >= weekAgo).length)}
    ${stat(`${WINDOW_DAYS} days`, views.length)}
    ${stat('contact clicks', contacts.length)}
    ${stat('top state', topState)}
  </div>
  ${filterBar}
  <div class="block">${
    validDay
      ? dayPanel(scoped, visits, validDay, now, pageLink(week), dayLink)
      : dayGrid(scoped, visits, now, week, pageLink, dayLink)
  }</div>
  ${worldMap(scoped, filterHref)}
  <div class="pair">
    ${funnelSection(visits, funnelKeys, funnelHref, hiddenInputs)}
    ${sourceTable(visits, filterHref)}
  </div>
  <div class="block">${visitsTable(visits)}</div>
  <div class="grid">
  ${returnSplit(visits)}
  ${barTable('Time in chapter (avg)', dwellRows(scoped), { fmt: fmtSecs, dim: 'chapter', flt: filterHref })}
  ${barTable('Where visits end', exitRows(scoped), { dim: 'chapter', flt: filterHref })}
  ${barTable('Read depth', depthRows(visits))}
  ${barTable('States', countBy(visits, (v) => v.state), { dim: 'state', flt: filterHref })}
  ${barTable('Cities', countBy(visits, (v) => v.city), { dim: 'city', flt: filterHref })}
  ${barTable('Arrived via', countBy(visits, (v) => v.via), { dim: 'source', flt: filterHref })}
  ${barTable('Referrers', countBy(visits, (v) => v.refHost), { dim: 'ref', flt: filterHref })}
  ${barTable('Devices', countBy(visits, (v) => v.layout), { dim: 'device', flt: filterHref })}
  ${barTable('Theme', countBy(visits, (v) => v.theme), { dim: 'theme', flt: filterHref })}
  ${barTable('Time on site', countBy(visits, (v) => v.stay), { dim: 'stay', flt: filterHref })}
  ${barTable('Chapter funnel', funnelRows)}
  ${barTable('Contact', countBy(contacts, (e) => `${e.props?.channel ?? '?'} after ${e.props?.engaged ?? '?'}`))}
  ${barTable('All events', countBy(scoped, (e) => e.name), { limit: 24 })}
  ${barTable('Client errors', countBy(scoped.filter((e) => e.name === 'client-error'), (e) => e.props?.message), { limit: 8 })}
  </div>
</main>
<script src="/portal-globe.js" defer></script>
</body></html>`)
}
