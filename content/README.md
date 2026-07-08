# Portfolio copy

All case-study editorial content lives here. TypeScript loaders discover these files at build time — edit markdown only; no component changes needed for copy updates.

## Layout

Each section folder contains:

| File | Purpose |
|------|---------|
| `section.md` | Section nav label, overview headline, overview blocks, `chapterOrder` |
| `overview.md` | Overview chapter body (the `{section}-overview` slide) |
| `{chapter-id}.md` | Single-file chapter (hardware products, WR Connect) |
| `{chapter-id}/chapter.md` | Chapter nav manifest (folder-based chapters) |
| `{chapter-id}/intro.md` | Chapter headline + body for folder-based chapters |

### Section folders

| Folder | Chapters |
|--------|----------|
| `hardware/` | `touch-2`, `eim`, `sensi-lite`, `verdant` (one `.md` each) |
| `mobile/` | `sensi/` (chapter + intro), `wr-connect.md` |
| `web-apps/` | `kelvin-ds/` (chapter + intro) |
| `everything-in-between/` | `formation/`, `practice/` |

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

**Bold** via markdown asterisks works inside paragraphs.
```

### Expandable facts

A paragraph that is *entirely* bold becomes a collapsed accordion trigger, and the
paragraphs under it become the detail revealed on expand (one fact open at a time
per chapter — see `components/chapter-slide/ExpandableFacts.tsx`):

```markdown
Visible intro paragraph(s)...

**Collapsed fact header**

Detail paragraph revealed on expand.
```

### Multi-part bodies

Use a horizontal rule on its own line to split body sections where a loader expects
multiple blocks (e.g. Kelvin DS: visible prose, then facts, with the always-visible
NDA note from frontmatter rendered between them):

```markdown
Visible paragraphs...

---

**Fact header**

Fact detail...
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
