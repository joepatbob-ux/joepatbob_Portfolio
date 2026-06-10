# Site-wide QA checklist

Audit **all sections** (Hardware · Mobile · Web Apps · Everything In Between) plus site shell. Hardware chapter specifics remain in `HARDWARE_POLISH_CHECKLIST.md`.

**Shared tokens:** `styles/globals.css`, `styles/case-study-layout-tokens.css`  
**Layout modes:** `lib/hooks/useChapterLayoutMode.ts`, `lib/chapter-slide/breakpoints.ts` (compact ends 1023, desktop 1024+)

## Breakpoints to test

| BP | Width | Copy mode | Nav |
|----|-------|-----------|-----|
| Mobile | ≤767 | More → sheet | Mobile rail / drawer |
| Compact | 768–1023 | More/Less in-place | Top-bar nav |
| Desktop | 1024–2559 | Inline copy beside stage | Sidebar fixed |
| Wide | ≥1200 | Copy vertically centered with stage | Sidebar fixed |
| Cinema | ≥2560 | Content column capped; wider gap | Sidebar fixed |

**Resize test:** drag 1023 ↔ 1024 on each section — no dead panels, More/Less vs inline copy handoff.

---

## Site shell

- [x] Skip link present (`#main-content`)
- [x] Sidebar section keywords navigate (Hardware · Mobile · Web Apps · EIB)
- [x] Contact Message button opens dialog
- [x] Nav drawer focus trap (shell + subnav) — `useDialogFocusTrap`
- [x] iOS body scroll lock on drawer + learn-more sheet — `useBodyScrollLock`
- [x] Touch targets ≥44pt — More/Close pills, subnav chips, contact pill
- [x] Reduced motion — scroll blur disabled; subnav stagger instant
- [ ] Hero blur on scroll (manual scroll pass on device)
- [ ] Mobile drawer open/close; backdrop (manual on iPhone)
- [ ] Dark mode full pass (paper/ink/accent)

---

## Shared slideshow / flow shell (all sections)

- [x] All four sections mount and render chapter panels
- [x] Desktop 1024+ — 1/3 · 2/3 grid (e.g. Kelvin grid `224px 448px` at 1024)
- [x] Desktop — no More buttons visible (compact controls hidden)
- [x] Compact 900 — More/Less on flow chapters (Kelvin expand → Less)
- [x] Mobile 390 — More opens full-screen sheet (Close button)
- [x] Compact expand collapses on resize to desktop (Kelvin `--compact-expand` cleared at 1024)
- [x] WR Connect copy-only — empty stage collapses to single column at 1024+
- [ ] Crossfade opacity (adjacent chapters only)
- [ ] Resize drag 1023↔1024 on each section (manual)

---

## Hardware

See `HARDWARE_POLISH_CHECKLIST.md` for per-chapter interactives.

| Chapter | Stage | Status |
|---------|-------|--------|
| Overview | Flow meta tiles | Needs manual pass |
| Sensi Lite | LCD proto | Needs manual pass |
| Touch 2 | Carousel | Needs manual pass |
| EIM | Path art | Needs manual pass |
| Verdant | Keypad + photos | Code done; manual pass |

---

## Mobile (Apple-level audit)

| Chapter | Stage | Status |
|---------|-------|--------|
| Overview | Flow copy + meta | Renders at 1440 |
| Sensi | PhoneSwap 3D | Scales 363×289 @1440 → 224×179 @1024 |
| WR Connect | Copy-only | Empty stage collapsed at desktop |

- [x] PhoneSwap reflows on viewport resize (CSS; no overflow)
- [x] More/Less at 768–1023; sheet at ≤767
- [x] SMA live overlay z-index — interactive layer at `z-mobile-chrome - 1` on ≤767
- [x] PhoneSwap tap-to-swap on ≤1023 — tap back phone; vertical scroll via touch-action + scroll-passthrough
- [ ] Sub-stories / Spotlight manual content pass
- [ ] Physical iPhone Safari pass (hero visualViewport, drawer, sheet scroll lock)

---

## Web Apps

| Chapter | Stage | Status |
|---------|-------|--------|
| Overview | Flow copy + product grid | Renders |
| Kelvin DS | Scratch + coin tray | Stage 224×437 @1024; More/Less @900 |

- [ ] Scratch interaction after resize (manual)
- [x] Tray buttons present (take / leave)
- [ ] Replace SVG quad placeholders with product screenshots

---

## Everything In Between

| Chapter | Stage | Status |
|---------|-------|--------|
| Overview | EIB intro | Renders |
| Concepts | Quote bowl | Stage 363×363 @1440 |
| Formation | Lego board | Stage 363×212 @1440 |
| Practice | Carousel | Stage 363×232 @1440 |

- [ ] Formation board at 1024–1200 (manual)
- [ ] Quote bowl WebGL load (manual)
- [ ] Practice carousel keyboard (manual)

---

## Production readiness

- [ ] OG image 1200×630 (currently portrait photo in `index.html`)
- [ ] Lighthouse on production URL
- [ ] Contact API on deploy
- [x] Build passes (`npm run build`)

---

## QA log

| Date | BP | Section | Issue | Status |
|------|-----|---------|-------|--------|
| 2026-05-30 | 1440 | All | Sections mount; 1/3·2/3 grid; no stage overflow | Pass |
| 2026-05-30 | 1024 | Web Apps | Kelvin grid 224+448; More hidden; expand reset | Pass |
| 2026-05-30 | 900 | Web Apps | Kelvin More → Less expand | Pass |
| 2026-05-30 | 390 | Mobile | Sensi More → sheet with Close | Pass |
| 2026-05-30 | 1440→1024 | Mobile | PhoneSwap viewbox scales down correctly | Pass |
| 2026-05-30 | Shell | Contact | Message opens dialog | Pass |
| 2026-06-07 | Code | Mobile audit | Drawer focus trap + body lock + 44pt targets + reduced motion + SMA z-index | Fixed |

---

_Last updated: mobile Apple-level audit fixes (items 2–6)._
