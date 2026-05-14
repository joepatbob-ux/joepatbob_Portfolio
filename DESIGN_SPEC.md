# Design Spec — joepatbob.com
> Source of truth for Cursor. Reference this before making any design or layout decisions.

---

## Stack
- **Framework**: Next.js 14, App Router
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
```css
--color-ink:         #0d0d0d        /* body text, headlines */
--color-paper:       #f9f8f6        /* background */
--color-accent:      #F2411B        /* orange-red: keywords, email pill, periods */
--color-rule:        rgba(0,0,0,0.1)/* dividers */
--color-muted:       rgba(13,13,13,0.45) /* body text, subtitles */
--color-chapter-dim: rgba(242,65,27,0.25) /* inactive chapter items */
```

Dark mode (prefers-color-scheme: dark):
```css
--color-ink:         #f0eeea
--color-paper:       #111110
--color-rule:        rgba(255,255,255,0.1)
--color-muted:       rgba(240,238,234,0.45)
--color-chapter-dim: rgba(242,65,27,0.3)
```

---

## Layout
- **Sidebar**: 400px fixed left, full viewport height, z-index 100
- **Content**: `margin-left: 400px`
- **Gutter**: 72px left/right padding inside content area
- **Max content column**: `calc(100vw - 400px - 144px)`

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
- `dimActive` becomes true — inactive section keywords dim to 20% opacity
- After 280ms delay: sub nav blurs in
  - Chapters stagger in one by one, 60ms apart
  - Each item: opacity 0→1, blur 6px→0, translateY 4px→0, 320ms ease
  - When last chapter of first section appears: divider blurs in (600ms ease)

### Section changes
- Active section keyword in nav sentence stays full opacity
- Inactive keywords dim to 20%
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
- **Period**: accent color `#F2411B`
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
Two-column grid: `380px | 1fr`, gap 64px
- Left: "Overview" label (AHG 22px) + body text (14px, muted, pre-line)
- Right: pull quote (AHG 28px, color rgba(13,13,13,0.45))
Border bottom rule.

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

## Interactive Components (Hardware section)

### Sensi Lite — Segment Display Prototype
Located in chapter `hardware-sensi-lite`.
A React component simulating the 32-segment display with 3-button navigation.
- Displays 2-digit temperature, mode icons, navigation state
- Three clickable buttons: UP, DOWN, MENU/ACTION
- Long press on MENU enters homeowner settings mode
- Uses the custom character set from the Verdant chapter
- See `/components/SegmentDisplay.tsx` (stub — to be built)

### Verdant — Character Set Cycler
Located in chapter `hardware-verdant`.
Cycles through the full character set image at different scales or states.
- Click/tap to advance through states
- States: full character set → zoomed detail → rendered on PCB display
- See `/components/CharacterSetCycler.tsx` (stub — to be built)

### Mobile Color — Before/After Slider
Located in chapter `mobile-color`.
Drag handle reveals before (legacy full-bleed orange) vs after (orange number on dark).
- See `/components/BeforeAfterSlider.tsx` (stub — to be built)

### Web Apps — Lord Kelvin Mouseover
Located at top of Web Apps section.
Image starts desaturated (black and white engraving).
On mouseover: color bleeds in radially from cursor position (blue and orange bloom).
- See `/components/KelvinReveal.tsx` (stub — to be built)

### Web Apps — Fragmentation Demo
Between Context and Stakes chapters.
Four UI cards animate from fragmented styles → unified Kelvin style.
- See `/components/FragmentationDemo.tsx` (stub — to be built)

### Everything Else — Sticker Pile
Draggable sticker images scattered around the section.
- See `/components/StickerPile.tsx` (stub — to be built)

---

## Component Stubs to Build
```
components/
  SidebarNav.tsx         ✅ built
  Hero.tsx               ✅ built
  CaseStudy.tsx          ✅ built
  Chapter.tsx            ✅ built
  SegmentDisplay.tsx     🔲 stub
  CharacterSetCycler.tsx 🔲 stub
  BeforeAfterSlider.tsx  🔲 stub
  KelvinReveal.tsx       🔲 stub
  FragmentationDemo.tsx  🔲 stub
  StickerPile.tsx        🔲 stub
```

---

## Images
Place in `/public/images/`:
```
portrait.jpg            ← hero portrait
hw-touch2.jpg           ← ID evaluation session
hw-eim.jpg              ← contractor discussion
hw-sensilite.jpg        ← Sensi Lite PCB display
hw-verdant.jpg          ← character set (full spread)
hw-trane.jpg            ← Verdant VX4 PCB + display
hw-icon-testing.jpg     ← icon testing session
mob-foundation.jpg      ← current light mode UI
mob-color-before.jpg    ← legacy full-bleed orange
mob-color-after.jpg     ← dark mode orange number
mob-install.jpg         ← wirepicker before/after
mob-spotlight.jpg       ← Spotlight UI
ee-smallstuff.jpg       ← demo kit
ee-team.jpg             ← Little Bit Foundation
hw-kelvin.jpg           ← Lord Kelvin illustration (color)
```

---

## Responsive Breakpoints (to be implemented)
| Breakpoint | Width | Notes |
|---|---|---|
| Mobile | < 768px | Single column, no sidebar, top nav |
| Tablet | 768–1280px | Simplified sidebar or collapsed |
| Desktop | 1280–1920px | Full layout |
| Ultra-wide | > 1920px | Max-width container, edge-to-edge images |

Mobile and tablet breakpoints: build after desktop is complete.

---

## Accessibility
- All interactive components keyboard-navigable
- `data-chapter-id` elements are landmark regions
- Image placeholders have `role="img"` and `aria-label`
- Color is never the sole conveyor of information
- Decorative elements marked `aria-hidden`
- Minimum touch target: 44×44px
