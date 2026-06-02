# Hardware polish checklist (reference section)

Use this when auditing **Hardware** first, then copy pass/fail notes to Mobile, Web Apps, and Everything In Between.

**Tokens:** `styles/globals.css`, `styles/case-study-layout-tokens.css`  
**Layout:** `styles/hardware-layout.css`, `Chapter` + `ChapterViewport` slideshow  
**Nav:** sidebar subnav + `ChapterNavProvider` goto (no flash; muted inactive = `--color-nav-faded-selection`)

## Implemented in code (verify in browser)

- [x] `DESIGN_SPEC.md` synced to `globals.css`; `--color-chapter-dim` aliases `--color-nav-faded-selection`
- [x] Sidebar ink via `var(--color-ink)`; inactive keywords + subnav chapters use muted accent
- [x] Programmatic section goto skips subnav stagger (`switchSection(..., { animate: false })`)
- [x] Kelvin + generic scratch tray inactive copy uses `--color-nav-faded-selection`
- [x] Flow slides (Mobile / Web Apps / EIB): section header margin matches Hardware (`case-study-section-header`)
- [x] EIB principle numbers use muted accent (not accent at 35% opacity)
- [ ] Manual pass: slideshow shell, interactives, breakpoints below

## Breakpoints to test

| BP | Width | Notes |
|----|-------|--------|
| Mobile | ≤767px | In-flow chapters, no 100dvh snap |
| Tablet | 768–1023px | Slideshow band, sidebar overlay |
| Desktop | 1024–2559px | 280px sidebar, 1fr/2fr copy/stage |
| Wide | 2560px+ | `--cs-band-max` caps |

## Slideshow shell (all Hardware slides)

- [ ] `hardware-overview` — 900px column centered in content area; mobile body inline (no More sheet)
- [ ] Chapter slides — `chapter-slide__viewport` band centered; `--hw-band-max-w`
- [ ] Copy column — eyebrow mono, title AHG, body muted; gap `--hw-copy-gap`
- [ ] Stage — min/max width; artifact not clipped; active panel `pointer-events`
- [ ] Crossfade — only adjacent chapters blend; no stacked opacity >1
- [ ] Closing quote (if visible) — fill viewport, typography

## Per chapter

### hardware-overview
- [ ] Flow overview layout matches other sections’ overview rhythm

### hardware-sensi-lite (`SensiLiteProto`)
- [ ] LCD contrast light + dark
- [ ] Touch targets; no layout shift on resize

### hardware-touch-2 (`Touch2Chapter`, `touch2-carousel.css`)
- [ ] Carousel snap and dots
- [ ] Keyboard focus visible
- [ ] Stage fits `--cs-touch2-*` tokens

### hardware-eim (`EimChapter`, path art)
- [ ] Path reveal order; active chapter panel
- [ ] Nav goto lands on correct slide

### hardware-verdant (`VerdantChapter`, `verdant-interactive.css`)
- [ ] Keyboard + character SVG
- [ ] Dark mode character/theme colors
- [ ] Container queries at 400px / 280px

## Sidebar / goto matrix

- [ ] Overview → Sensi → Touch 2 → EIM → Verdant (forward)
- [ ] Verdant → Overview (backward)
- [ ] Hardware keyword → Mobile overview (cross-section)
- [x] Inactive subnav labels use muted accent (code)
- [x] Section change via click: no subnav stagger delay (code)

## Dark mode (`prefers-color-scheme: dark`)

- [ ] Paper `#101010`, ink cream, accent readable
- [ ] Verdant / stages: light objects on dark page where designed
- [ ] Hero + sidebar ink via CSS vars (not hardcoded hex)

## Rollout to other sections (Phase 4)

| Section | Layout CSS | Checklist focus |
|---------|------------|-----------------|
| Mobile | `flow-chapter-slide.css`, `mobile-chapter-viewport.css` | Overview, WR Connect, Sensi, Spotlight phone |
| Web Apps | `web-apps-kelvin-chapter.css`, `kelvin-scratch.css` | Kelvin stage, tray tokens, flow slides |
| Everything In Between | `eib-chapter.css`, `formation-lego-board.css` | Formation white board on dark, practice carousel |

---

_Last updated: polish sprint — Hardware as reference._
