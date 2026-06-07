# Hardware polish checklist (reference section)

Use this when auditing **Hardware** first, then copy pass/fail notes to Mobile, Web Apps, and Everything In Between.

**Tokens:** `styles/globals.css`, `styles/case-study-layout-tokens.css`  
**Layout:** `styles/chapter/chapter-slide-hardware.css`, `ChapterViewport` + `ChapterSlideShell` slideshow  
**Nav:** sidebar subnav + `ChapterNavProvider` goto (no flash; muted inactive = `--color-nav-faded-selection`)

## Implemented in code (verify in browser)

- [x] `DESIGN_SPEC.md` synced to layout breakpoints; compact ends at 1023px, desktop copy at 1024+
- [x] Sidebar ink via `var(--color-ink)`; inactive keywords + subnav chapters use muted accent
- [x] Programmatic section goto skips subnav stagger (`switchSection(..., { animate: false })`)
- [x] Kelvin + generic scratch tray inactive copy uses `--color-nav-faded-selection`
- [x] Kelvin tray: take / coin / leave grid areas; ticket–tray gap; stage pointer capture for scratch
- [x] Flow slides (Mobile / Web Apps / EIB): section header margin matches Hardware (`case-study-section-header`)
- [x] EIB principle numbers use muted accent (not accent at 35% opacity)
- [x] Hardware slideshow: 1/3 stage · 2/3 copy grid (1024+); 40px stage–copy gap (160px at 2560+)
- [x] Stage artifacts scale with column (`ResizeObserver` on Touch 2; fluid CSS on other stages)
- [x] Overview meta blocks: borderless shared styling (`case-study-content.css`); Patents band consolidated
- [x] Hardware lessons slide removed (`lessonTitle` empty)
- [x] Scroll orchestration rebinds on viewport resize (top-bar ↔ fixed slideshow)
- [x] Compact More/Less collapses when chapter deactivates or band mode ends
- [ ] Manual pass: slideshow shell, interactives, breakpoints below

## Breakpoints to test

| BP | Width | Notes |
|----|-------|--------|
| Mobile | ≤767px | In-flow chapters, no 100dvh snap; More → sheet |
| Tablet | 768–1023px | Compact More/Less; top-bar nav; resize window — More still clicks |
| Desktop | 1024–2559px | Fixed slideshow snap; 1/3·2/3 grid; inline scrollable copy (no More) |
| Wide | ≥1200px | Copy vertically centered with stage |
| Cinema | ≥2560px | Content column capped; wider gap |

## Slideshow shell (all Hardware slides)

- [ ] `hardware-overview` — full body inline on mobile; meta tiles (Role, Company, Products, Patents)
- [ ] Chapter slides — stage column ~1/3 of content pane; copy scrolls inside column at 1024+
- [ ] Copy column — headline, accent rule, body; gap `--cs-split-gap` (40px desktop)
- [ ] Stage — artifact scales to column; not clipped; active panel `pointer-events: auto`
- [ ] Crossfade — only adjacent chapters blend; no stacked opacity >1
- [ ] Resize across 1023→1024 — compact More gives way to side-by-side copy without dead panels

## Per chapter

### hardware-overview
- [ ] Flow overview layout; Patents band reads cleanly

### hardware-sensi-lite (`SensiLiteProto`)
- [ ] LCD contrast light + dark
- [ ] Touch targets; no layout shift on resize

### hardware-touch-2 (`Touch2Chapter`, `touch2-carousel.css`)
- [ ] Carousel scales in narrow stage; dots align with rail
- [ ] Keyboard focus visible
- [ ] Stage fits `--cs-touch2-*` tokens

### hardware-eim (`EimChapter`, path art)
- [ ] Path reveal order; active chapter panel
- [ ] Nav goto lands on correct slide

### hardware-verdant (`VerdantChapter`, `verdant-interactive.css`)
- [x] Keyboard + character SVG (flex-wrap keypad; themed segment cache)
- [x] Dark mode character/theme colors (`--verdant-label` on `.chapter-slide--verdant`)
- [x] Container queries at 400px split / 340px & 399px stage scale (verify in browser)
- [x] Sketch/Board photos in segment-aspect frame; assets `Segment_Drawing.jpeg`, `hw-verdant.jpg`
- [x] Mobile: copy no longer overlaps keypad (`mobile-chapter-viewport.css` verdant rules)
- [ ] Manual pass: side-by-side desktop, resize narrow→wide, Sketch/Board/character toggles

## Sidebar / goto matrix

- [ ] Overview → Touch 2 → EIM → Sensi Lite → Verdant (forward)
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

_Last updated: post layout polish (`7a6346c`) — Hardware as reference._
