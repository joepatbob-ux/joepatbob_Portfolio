# Plan — Scroll Centering, Component Smoothness, Component Load Speed

Priorities (in order):
1. **Scroll** — stages stick to the center of the viewport with no stutter ("shutter").
2. **Smoothness** — interactive components run without frame drops.
3. **Load speed** — components appear fast when scrolled to.

## How the system works today (verified in code)

Desktop continuous mode uses native document scroll. Every scroll/resize event is
coalesced into one rAF frame (`lib/scrollFrame.ts`) which runs
`applySlideScrollFromMeasure` → `measureSlideScrollState` →
`applyContinuousCopyFade` + `applyContinuousStageAlign`.

`applyContinuousStageAlign` (`lib/applyContinuousStageAlign.ts`) is a per-frame
state machine per stage: `idle → enter → center (latched) → exit`. During
**enter/exit** the artifact is positioned by a JS `translate3d` recomputed each
frame; during **center** it switches to CSS `position: sticky` with
`top: calc(50dvh - var(--stage-artifact-half))`
(`styles/chapter/chapter-continuous-scroll.css:174-192`).

## Diagnosed stutter sources

| # | Cause | Where |
|---|-------|-------|
| A | `artifactHeight()` walks **every descendant** of the align target calling `offsetHeight` + `getBoundingClientRect` — forced synchronous layout, O(subtree), per stage, **per scroll frame** | `applyContinuousStageAlign.ts:75-87` |
| B | Interleaved layout reads and style writes across the per-stage loop (write transform → next stage reads rects → forced reflow) | `applyContinuousStageAlign.ts:303-433` |
| C | `getComputedStyle(document.documentElement)` per stage per frame for safe-area values that never change during scroll | `:59-66`, `:369-371` |
| D | Enter-phase JS transform trails native scroll by up to a frame; the **enter → center handoff** swaps a JS transform for CSS sticky — any mismatch between the last JS translate and the sticky landing position is a visible snap | `:384-404` + CSS `:184-192` |
| E | `Math.round` on all translates quantizes to 1px; near-stationary artifacts can oscillate ±1px | throughout |
| F | React re-renders mid-scroll: `setReveals` fires on every 0.04 reveal change and re-renders `ChapterNavProvider` (context) and its subtree | `ChapterNavProvider.tsx:119-134`, `lib/chapterReveals.ts` |

Load-speed findings (from the July 2 audit + this pass):

- three.js + drei + react-dom are merged into one **eager 1.12 MB chunk** (broken `manualChunks` under Vite 8/rolldown) — the 3D stack blocks first paint.
- `LazySectionChapter.tsx` is not lazy — it statically imports all three section
  chapters into the entry bundle. Only `PhoneSwap` and `ConceptQuoteBowlCanvas`
  are true dynamic boundaries.
- Stage chunks + GLB/texture fetches start only when the chapter nears the
  viewport (`chapterMount.ts` IntersectionObserver) — cold cache at reveal time.
- Heavy textures: 3.6 MB roughness PNG, 2×2.5 MB normal maps.

---

## Phase 0 — Baseline (½ day)

- Record Chrome Performance traces at 4× CPU throttle for the worst chapters
  (Kelvin scratch, PhoneSwap, QuoteBowl): chapter enter, center hold, exit, fast flick.
- Add a dev-only frame logger behind `?perf=1` (PerformanceObserver `longtask` +
  timing around `applySlideScrollFromMeasure`) so regressions are measurable.
- Acceptance bar: no scripted frame > ~8 ms during steady scroll (leaves budget
  for style/layout/paint); zero visible discontinuity at phase handoff in a
  120 fps screen recording.

## Phase 1 — Sticky-center without shutter (2–3 days) ← top priority

1. **Read/write split.** Restructure `applyContinuousStageAlign` into two passes
   inside the same frame: measure everything for all stages first, then apply all
   style writes. Pass slot rects down from `computeContinuousRevealMaps` instead
   of re-querying (fixes B).
2. **Kill per-frame layout work.**
   - Replace the `artifactHeight()` descendant walk with a `ResizeObserver`-cached
     height per align target, refreshed on resize/content change only (fixes A).
   - Cache safe-area insets once; refresh on resize/orientation (fixes C).
3. **Make CSS sticky the single centering mechanism.** Keep the artifact in its
   sticky wrapper full-time; re-express enter/exit as short blends *relative to
   the stuck position* driven by the cached reveal value. This removes the
   JS-transform ↔ sticky handoff entirely (fixes D). If the copy-tracking enter
   look must stay, fallback: compute the handoff analytically so the final enter
   frame equals the sticky landing exactly (same reference, same rounding), and
   latch it once.
4. **Sub-pixel transforms.** Drop `Math.round` on translates (2-decimal
   precision); dedupe writes at 0.5 px instead (fixes E).
5. **Guard-rails.** Unit-test `pickStagePinId` hysteresis and the
   enter/center/exit latch transitions; re-run
   `docs/HARDWARE_POLISH_CHECKLIST.md` since the CSS
   (`chapter-continuous-scroll.css`) is tightly coupled to the JS data
   attributes. Formation LEGO's headline-pair special case
   (`prefersHeadlinePairAlign`) keeps its own latch test.
   Optional enhancement after parity: CSS scroll-driven animations
   (`animation-timeline: view()`) for enter/exit fades where supported.

## Phase 2 — Component runtime smoothness (2 days)

1. **No React renders on the scroll path.** Move `reveals` out of
   `ChapterNavProvider` state; consumers already have
   `useSyncExternalStore`-based `useChapterReveal` — make that the only
   subscription so the provider stops re-rendering its subtree every 0.04 step
   (fixes F).
2. **Frameloop discipline.** `ConceptQuoteBowl` runs `frameloop="always"` while
   active — switch to `demand` + `invalidate()` on interaction/animation ticks;
   pause on `visibilitychange`; cap canvas DPR at 2. Verify no R3F scene renders
   while its stage opacity is below the interactive threshold.
3. **Compositor hygiene.** `will-change: transform` only while enter/exit is
   active (it's currently permanent on pinned stages —
   `chapter-continuous-scroll.css:166-172`); add `contain: layout style paint`
   to chapter panels where layout allows.
4. Re-trace against the Phase 0 baseline before/after each change.

## Phase 3 — Component load speed (2 days)

1. **Fix vendor chunking** (rolldown `advancedChunks` or remove `manualChunks`):
   react stays eager; three/drei/r3f live only behind the lazy stage boundaries.
   Success: entry chunk imports nothing from 3D chunks; initial JS drops
   ~380 KB → ~100 KB gzip.
2. **True lazy sections.** Convert `LazySectionChapter` to dynamic imports with
   sized shells (existing `StageSpinner` pattern) so section code leaves the
   entry bundle.
3. **Idle prefetch.** After first paint, `requestIdleCallback`-prefetch stage
   chunks and first-needed GLB/textures in scroll order, so the existing
   near-viewport mount (`CHAPTER_PRELOAD_ROOT_MARGIN`) hits a warm cache —
   chapters appear instantly instead of fetching on approach.
4. **Asset diet.** Re-encode the 3.6 MB roughness PNG and 2.5 MB normal maps
   (downscale / KTX2); confirm all GLBs are draco-compressed; keep sized
   placeholders so stage mount causes zero layout shift.
5. Measure per-chapter "scrolled into view → stage painted" before/after.

## Phase 4 — Verification & rollout (1 day)

- Headless trace runs on the built site + manual QA matrix: Chrome/Safari/Firefox
  × 1440 px/laptop/ultrawide, reduced-motion on/off, `?continuous=0` legacy mode.
- Confirm the Vercel prerender anchors still render (`scripts/prerender.mjs`
  `ANCHORS`) after lazier section mounting.
- Ship as three independent PRs in priority order: scroll (Phase 1) → runtime
  (Phase 2) → load (Phase 3), each with its own trace evidence.

**Estimated total: ~7–8 working days.**
