# Portfolio copy

All case-study editorial content lives here. TypeScript loaders discover these files at build time — edit markdown only; no component changes needed for copy updates.

## Layout

Each section folder contains:

| File | Purpose |
|------|---------|
| `section.md` | Section nav label, overview headline, overview blocks, `chapterOrder` |
| `overview.md` | Overview chapter body (the `{section}-overview` slide) |
| `{chapter-id}.md` | Single-file chapter (hardware products, WR Connect) |
| `{chapter-id}/chapter.md` | Multi-part chapter nav manifest |
| `{chapter-id}/*.md` | Sub-stories and chapter-specific data for that chapter |

### Section folders

| Folder | Chapters |
|--------|----------|
| `hardware/` | `touch-2`, `eim`, `sensi-lite`, `verdant` (one `.md` each) |
| `mobile/` | `sensi/` (intro + sub-stories), `wr-connect.md` |
| `web-apps/` | `kelvin-ds/` (intro + four sub-stories) |
| `everything-in-between/` | `concepts/` (+ `bowl-quotes.md`), `formation/`, `practice/` |

Chapter order in the sidebar comes from `chapterOrder` in `section.md`.

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

### Multi-part chapter folders

For chapters with sub-stories (Sensi, Kelvin DS), `chapter.md` holds nav metadata and `subStoryOrder`:

```markdown
---
{
  "id": "sensi",
  "title": "Sensi",
  "imageAlt": "...",
  "subStoryOrder": ["color-mode", "install-flow", "spotlight"]
}
---
```

Sibling files in the same folder hold the copy:

- `intro.md` — chapter headline + opening prose
- `color-mode.md`, `install-flow.md`, … — sub-stories (each with its own frontmatter)

### Multi-part bodies

Use a horizontal rule on its own line to split body sections where loaders expect multiple blocks (e.g. Sensi Spotlight intro / testing / close, Kelvin stakes intro / callout / close):

```markdown
Intro paragraphs...

---

Middle section...

---

Closing section...
```

## After editing

```bash
npm run dev          # preview
npm run lint         # typecheck loaders
npm run audit:assets # if you add image paths
```

## Not in this folder

- Hero / site chrome copy (`components/Hero.tsx`, `index.html`)
- Asset alt text for carousels, stickers, phone screenshots (`lib/stickers.ts`, etc.)
- Interactive demo labels (quote bowl actions, Kelvin scratch UI chrome)
