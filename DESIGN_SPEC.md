# Design Spec — joepatbob.com
> Source of truth for Cursor. Reference this before making any design or layout decisions.

---

## Stack
- **Framework**: Vite 8 + React 18 (SPA, `dist/` static deploy)
- **Styling**: Tailwind CSS + CSS custom properties for design tokens
- **Language**: TypeScript
- **Deployment**: Vercel, domain joepatbob.com

---

## Fonts
| Font | Weight | Usage |
|---|---|---|
| Alte Haas Grotesk Bold | 700 | All headlines, nav sentence, hero name |
| JetBrains Mono | 400, 700 | Chapter labels, eyebrows, email pill, sub nav |

Font files go in `/public/fonts/`. CSS `@font-face` declarations are in `styles/globals.css`.

---

## Color Tokens

Canonical values live in `styles/globals.css`. Legacy names are noted where they differ.

```css
/* Light (:root) */
--color-ink:              #0d0d0d     /* body text, headlines */
--color-paper:            #f0f0f0     /* page canvas */
--color-hero-canvas:      #f4f4f4     /* hero band only (.hero-pin) */
--color-accent:           #DE3E18     /* keywords, pill, periods — darker than legacy #F2411B for contrast */
--color-accent-hover:     #B73412     /* links / nav hovers */
--color-rule:             rgba(0, 0, 0, 0.1)
--color-muted:            rgba(13, 13, 13, 0.72)   /* subtitles — ~4.5:1 on paper */
--color-nav-faded-selection: rgba(222, 62, 24, 0.4) /* inactive nav keywords + chapter labels */
--color-nav-pill-muted-accent-1: rgba(222, 62, 24, 0.12) /* subnav selected fill, tray drop mode */
--color-nav-pill-outline: rgba(222, 62, 24, 0.42)       /* subnav / contact item hover ring */
--color-accent-nav-hover: #5a2410
```

```css
/* Dark (@media prefers-color-scheme: dark) */
--color-ink:              #f0eeea
--color-paper:            #101010
--color-hero-canvas:      #040404
--color-rule:             rgba(255, 255, 255, 0.12)
--color-muted:            rgba(240, 238, 234, 0.78)
--color-nav-faded-selection: rgba(222, 62, 24, 0.45)
--color-nav-pill-muted-accent-1: rgba(222, 62, 24, 0.16)
--color-nav-pill-outline: rgba(222, 62, 24, 0.48)
--color-accent-nav-hover: #ff9a7a
```

**Aliases (do not add new usages):**

- `--color-chapter-dim` → use `--color-nav-faded-selection` for inactive chapter / tray copy.

**Theming note:** OS dark mode drives CSS tokens above. `ThemeProvider` additionally sets hero portrait, Formation Lego board, and Kelvin scratch assets via `useTheme()`. A future manual toggle should set `data-theme` on `<html>` and mirror these token blocks.

---

## Layout
- **Sidebar**: 280px fixed left at desktop (1024+); tablet overlay 280px; mobile full-width drawer — see `styles/globals.css` breakpoints
- **Content**: `margin-left: var(--sidebar-width)`
- **Gutter**: `--gutter` 72px; horizontal inset `--content-pad-x` 24px
- **Case-study band/stage**: `--cs-*` tokens in `styles/case-study-layout-tokens.css` (Hardware reference layout)

---

## Sidebar — Scroll Choreography

### Initial state (y = 0)
- "HELLO, I AM / JOSEPH PATRICK ROBERTS." visible at top-left, full opacity
- Main nav sentence ("I simplify complex systems for...") positioned just above the email pill
- Email pill fixed at bottom-left (40px from bottom)
- Divider invisible
- Sub nav invisible

### Scrolling begins (y > 0)
- Hero name **blurs out proportionally** — no CSS transition, driven by scroll position
  - Fade formula: `heroProgress = (y - 20) / (viewportH * 0.6)`, clamped 0–1
  - opacity = `1 - heroProgress`, filter = `blur(heroProgress * 6px)`
- Divider stays hidden until sub nav appears

### Nav travel (0 < y < threshold)
- Main nav sentence travels **upward proportionally** with scroll
  - Start: `viewportH - 40 - emailHeight - 12 - navHeight`
  - End: `40px` from top
  - Formula: `navRestTop + (40 - navRestTop) * Math.min(1, y / threshold)`
  - **No CSS transition** — purely scroll-driven
- Threshold = `viewportH * 0.72`

### Nav locks (y >= threshold)
- Main nav sentence locks to `top: 40px`
- `dimActive` becomes true — inactive section keywords use `--color-nav-faded-selection` (active keyword stays `--color-accent`)
- After 280ms delay: sub nav blurs in
  - Chapters stagger in one by one, 60ms apart
  - Each item: opacity 0→1, blur 6px→0, translateY 4px→0, 320ms ease
  - When last chapter of first section appears: divider blurs in (600ms ease)

### Section changes
- Active section keyword in nav sentence stays `--color-accent`
- Inactive keywords use `--color-nav-faded-selection`; subnav chapter pills match (active = accent + pill fill)
- **Main nav keyword hover only** (`[data-sidebar-main-nav]`): transparent glyph fill + `--color-accent` text stroke (hero canvas shows through). Subnav + contact use solid accent labels and pill/ring hovers — no outline text.
- Sub nav chapters blur out, new section chapters blur in staggered

### Scrolling back to top (y < threshold)
- Nav unsticks, travels back down proportionally
- Sub nav blurs out immediately
- Divider blurs out
- Keywords all return to full opacity

---

## Hero Section
- **Height**: 100vh
- **Layout**: name stack bottom-left, portrait photo right half
- **Eyebrow**: "HELLO, I AM" — Alte Haas Grotesk Bold, ~24px, accent color
- **Name**: "JOSEPH PATRICK ROBERTS." — Alte Haas Grotesk Bold, clamp(48px, 6.5vw, 120px), line-height 0.88
- **Period**: accent color `var(--color-accent)` (`#DE3E18`)
- **Portrait**: `/public/images/portrait.jpg`, objectFit cover, right 55% of hero

---

## Case Study Layout

### Header
```
Case Study — {label}    ← JetBrains Mono, 11px, muted, uppercase
{headline}              ← Alte Haas Grotesk Bold, clamp(32px,3vw,56px)
```
Border bottom rule.

### Overview
Centered header: eyebrow (optional) + headline + accent rule.
Body below (muted, pre-line); two columns on wide viewports (≥1200px).

### Chapters
Each chapter has `data-chapter-id="{sectionId}-{chapterId}"`.

Three image layout types:
1. **portrait** — 360×560px, side by side with text
2. **landscape** — 520×380px, side by side with text
3. **full-width** — 100% width × 460px, image above text

Image position: left or right (for side-by-side layouts).

Chapter structure:
```
{num}  {TITLE}              ← number (JetBrains Mono 11px muted) + title (AHG 32px)
{subtitle}                  ← JetBrains Mono 13px bold muted
[image]  [body text]        ← layout depends on imageLayout + imagePosition
```

### Lessons
Two-column: `320px | 1fr`, gap 64px
- Left: lesson title (AHG 28px, pre-line)
- Right: lesson body (14px, muted, pre-line)

---

## Interactive Components

> Status note: the interactive concepts below have all shipped, though several
> were redesigned away from their original working names during build. Paths
> reflect what is actually in `components/` today.

### Sensi Lite — Segment Display Prototype
Located in chapter `hardware-sensi-lite`.
Interactive segment-toggled LCD prototype with homeowner and contractor menu rings.
- Single annotated `screen.svg` with per-segment IDs; lit state driven in React
- Home setpoint demo (heat / cool / off), then 1.2s / 2s long-press menu rings
- Contractor path: Outdoor (HP) → AUX Lockout → Balance Point with ▲/▼ adjust
- **Built:** `/components/sensi-lite/SegmentLcd.tsx`, `/components/SensiLiteProto.tsx`, `/components/SensiLiteChapter.tsx`, `/lib/sensi-lite/flow.ts`
- **Legacy (unused in chapter):** `/components/SegmentDisplay.tsx`

### Verdant — Character Set
Located in chapter `hardware-verdant`.
Interactive exploration of the full character set at different scales/states.
- **Built (redesigned as a character selector):** `/components/VerdantCharacterSelector.tsx`, `/components/VerdantInteractive.tsx`, `/components/VerdantPreviewStage.tsx`, `/components/VerdantChapter.tsx`

### Sensi — Color Mode Before/After
Drag handle reveals before (legacy full-bleed orange) vs after (color on the temperature number).
- **Built (redesigned):** the before/after scrubber now lives in the Sensi `color-mode` sub-story — see `content/mobile/sensi/color-mode.md` (`scrubber`). The broader Mobile section is the `PhoneSwap` / `sma-ios26` prototype, not a standalone slider chapter.

### Web Apps — Kelvin Reveal
Kelvin's value is revealed through direct interaction rather than a hover bloom.
- **Built (redesigned as a scratch-off reveal):** `/components/web-apps/kelvin-scratch/` (+ `lib/kelvin-scratch/`)

### Web Apps — Fragmentation Demo
Four UI cards animate from fragmented styles → unified Kelvin style.
- **Not built / dropped** — no component or successor exists. Remove or re-scope if still desired.

### Everything Else — Sticker Pile
Draggable sticker images scattered around the section.
- **Built:** `/components/StickerPile.tsx` (+ `Sticker.tsx`, `StickerLayer.tsx`, `StickerProvider.tsx`, `PlacedStickerControl.tsx`)

---

## Images
Active assets live under `/public/images/` (kebab-case folders). Reference-only photos are in `/public/images/_archive/` (not loaded by the app).

```
portrait.jpg            ← legacy name; hero uses PortraitLight_MG_3496-optimized.jpg
hw-touch2.jpg           ← ID evaluation session
_archive/hw-eim.jpg     ← contractor discussion (archived)
hw-sensilite.jpg        ← Sensi Lite PCB display
hw-verdant.jpg          ← character set (full spread)
_archive/hw-trane.jpg     ← Verdant VX4 PCB + display (archived)
hw-icon-testing.jpg     ← icon testing session
mob-foundation.jpg      ← current light mode UI
mob-color-before.jpg    ← legacy full-bleed orange
mob-color-after.jpg     ← dark mode orange number
_archive/mobile-wirepicker-before-after.png  ← wirepicker before/after (archived)
_archive/mobile-spotlight-example.png        ← Spotlight UI (archived)
ee-smallstuff.jpg       ← demo kit
ee-team.jpg             ← Little Bit Foundation
hw-kelvin.jpg           ← Lord Kelvin illustration (color)
```

---

## Responsive Breakpoints
| Tier | Width | Shell | Chapter slides |
|---|---|---|---|
| Mobile | ≤767px | No sidebar; morphing top nav | 1 column — centered stack + **More** sheet |
| Tablet | 768–1023px | Collapsed sidebar (52px) | **Compact band** — centered stack + **More/Less** expand |
| Desktop | 1024–2559px | 280px sidebar | Fixed slideshow — **1/3 stage · 2/3 copy**, scrollable copy |
| Wide | ≥1200px | 280px sidebar | Same grid — copy vertically centered with stage |
| Cinema | ≥2560px | Max-width content column | Wider stage–copy gap (160px) |

### Chapter copy modes
| Mode | Width | Hook | UX |
|---|---|---|---|
| `mobile` | ≤767 | `useLayoutMobile()` / `useChapterLayoutMode()` | Headline + **More** → full-screen sheet |
| `compact` | 768–1023 | `useLayoutCompactBand()` / `useChapterLayoutMode()` | Headline + **More/Less** in-place expand |
| `desktop` | ≥1024 | `useChapterLayoutMode()` → `'desktop'` | Inline copy column beside stage |

Shell: `components/chapter-slide/ChapterSlideShell.tsx`. CSS: `styles/chapter/` (compact, hardware, mobile, artifacts). Class: `chapter-slide__copy--compact-teaser`.

Source of truth: `lib/layout/breakpoints.ts`, `lib/chapter-slide/breakpoints.ts`.

---

## Accessibility
- All interactive components keyboard-navigable
- `data-chapter-id` elements are landmark regions
- Image placeholders have `role="img"` and `aria-label`
- Color is never the sole conveyor of information
- Decorative elements marked `aria-hidden`
- Minimum touch target: 44×44px
