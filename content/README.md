# Portfolio copy

All case-study editorial content lives here. TypeScript loaders in `lib/sections/` and `lib/*/content.ts` import these files at build time — edit markdown only; no component changes needed for copy updates.

## Layout

| Folder | What to edit |
|--------|----------------|
| `hardware/` | Section overview + one file per chapter (Touch 2, EIM, Sensi Lite, Verdant) |
| `mobile/` | Section overview, chapter stubs (`sensi.md`, `wr-connect.md`), Sensi long-form (`sensi-intro.md`, `sensi-*.md`) |
| `web-apps/` | Section overview, Kelvin chapter stub, Kelvin story files (`kelvin-intro.md`, `kelvin-01`–`04`) |
| `everything-in-between/` | Section overview, Concepts / Formation / Practice chapters, `bowl-quotes.md` (live bowl slips) |

## File format

Each file uses **JSON frontmatter** between `---` fences, then the body in markdown.

```markdown
---
{
  "id": "touch-2",
  "title": "Touch 2",
  "subtitle": "On-slide headline",
  "imageAlt": "Accessibility description"
}
---

First paragraph of body copy.

**Bold** via markdown asterisks (rendered on hardware chapters).
```

### Multi-part bodies

Use a horizontal rule on its own line to split body sections where loaders expect multiple blocks (e.g. Sensi Spotlight intro / testing / close, Kelvin stakes intro / callout / close):

```markdown
Intro paragraphs...

---

Middle section...

---

Closing section...
```

## Section overviews

`section.md` in each folder holds nav label, headline, overview meta grid, and overview body paragraphs.

## After editing

```bash
npm run dev          # preview
npm run lint         # typecheck loaders
npm run audit:assets # if you add image paths
```

To re-export from legacy TS (one-time migration helper):

```bash
node scripts/export-content-markdown.mjs
```

## Not in this folder

- Hero / site chrome copy (`components/Hero.tsx`, `index.html`)
- Asset alt text for carousels, stickers, phone screenshots (`lib/stickers.ts`, etc.)
- Interactive demo labels (quote bowl actions, Kelvin scratch UI chrome)
