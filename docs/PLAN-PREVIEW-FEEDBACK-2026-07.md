# Plan — Preview Feedback Round 2

Three items reported on the branch preview. Two were diagnosable bugs and are
**already fixed and pushed** (details below, kept for the record); the third —
content layout — is design work planned here and decided together.

## 1. Sensi Lite not loading — FIXED (pushed)

Root cause (present on main too): the CSS rule sizing the Sensi Lite artifact
never matched — its selector wrote `.hardware-slideshow .chapter-slide--sensi-lite`
as ancestor → descendant, but both classes sit on the same element. Without a
definite width, the `fit-content` align box and its `width:100%` children
collapsed to 0×0 and the proto never painted. Fixes:

- Compound selector + `aspect-ratio: 240/147` so the box reserves space
  (`styles/chapter/chapter-continuous-scroll.css`).
- The align engine re-measures while a cached artifact height is below the
  48px minimum — a collapsed box can't fire the ResizeObserver when deep
  content grows (`lib/applyContinuousStageAlign.ts`).

Verified headless: the proto now renders 459×281, sticks at exact viewport
center, and the all-chapter trajectory probe still reports zero jumps.

## 2. Concepts bowl slow load — dominant cause FIXED (pushed)

The bowl fetched **5.3 MB of 4096² PNG textures** on mount (roughness 3.6 MB,
basecolor 1.7 MB) while its normal map was already a 37 KB webp. Re-encoded to
2048²/1024² webp — **128 KB total, a 40× cut** — and added all three to the
idle-prefetch list so they're usually cached before the chapter is reached.
Verified: all maps load with no material errors.

Follow-ups if it still feels slow on the rebuilt preview (ordered):
1. Measure again on the Vercel preview (real GPU — this container's software
   GL can't time it meaningfully).
2. Perceived-load polish: replace the spinner with a static bowl image that
   crossfades to the live canvas when `sceneReady` fires.
3. Fix the hydration mismatches (React #418/#425 in console): the prerendered
   snapshot re-renders on the client, which delays every stage's interactivity
   slightly. Diagnosis tooling is already in `src/main.tsx` (readable component
   stacks in a non-minified build).
4. If scene setup itself is the cost: defer the paper-pile physics settle to
   post-first-paint frames (budgeted stepping) instead of settling before ready.

## 3. Content layout improvements — TO DECIDE, then implement

"The content can have an improved layout" needs your direction; here's the
menu I'd propose, from what the current layout does today (two-column grid,
stage 5fr / copy 6fr, copy blocks reveal on scroll):

**A. Reading measure & rhythm (lowest risk, do first)**
- Cap body copy at ~62–68ch; today long lines stretch with the column.
- Consistent vertical rhythm: one spacing token for headline→body→list gaps
  (they visibly differ between chapters right now).
- Slightly larger first paragraph (lede) per chapter for hierarchy.

**B. Copy pacing & scannability**
- Split long paragraphs into more reveal blocks so the crossfade rhythm
  matches scroll distance.
- Pull key facts (patent number, years, shipped platforms) out of prose into
  mono-face stat chips under the headline — scannable, on-brand with the
  JetBrains Mono accents.

**C. Stage/copy balance**
- Rebalance the 5fr/6fr split per artifact type (phones want a narrower
  column than the wide Kelvin ticket); could key off the same chapter modifier
  classes.
- Align the copy's first headline baseline with the artifact's vertical
  center at the stick point, so the pair reads as one composition.

**D. Section overviews**
- Scope / patents / award blocks as a scannable grid of cards instead of
  stacked rows; tighter runway into the first chapter.

Process: pick a bucket (or order them) and I implement on this branch, one
commit per bucket, so the Vercel preview updates and you judge each on the
real site. A/B against production stays possible since main is untouched.

## Verification per change

Every layout commit re-runs: `tsc`, build + prerender, the trajectory probe
(zero-jump gate), and the sensi/bowl probes — all scripted from this session.
