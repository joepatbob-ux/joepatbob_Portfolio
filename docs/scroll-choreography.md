# Scroll choreography

How the continuous-desktop scroll experience works: the center-locked stage
dissolve, the sticker fades that ride on it, sidebar-nav landings, and the
prerender ghost. Read this before touching anything in `lib/scroll/` — the
behaviors interlock, and most of the constants below exist because a specific
regression forced them.

Everything here applies to **continuous desktop** (viewports >1023px without
the top bar). On top-bar viewports (phones/tablets) the stage machine
early-returns and chapters use plain in-flow layout.

## The stage dissolve state machine

`lib/scroll/applyContinuousStageAlign.ts` runs on every scroll frame and owns
each chapter's stage artifact (the 3D object / board / carousel column). Each
stage carries `dataset.stageFx`:

```
(hidden) ──engaged──▶ visible ──displaced──▶ out ──scrolled away──▶ (hidden)
                         ▲                     │
                         └──── re-entry ◀──────┘  (after 100px of new scroll)
```

- **hidden → visible**: the chapter's stage reveal crosses
  `STAGE_PIN_REVEAL` (0.22) *and* the artifact's alignment box is within
  `STAGE_ENTRY_NEAR_PX` (56px) of the viewport-center lock. Entry is pure
  engagement geometry — there is deliberately no "reveal is high so show it
  anyway" fallback; that fallback made artifacts pop in below center.
- **visible**: the artifact is opacity-1 and center-locked. Centering is
  sticky-native: the machine sets `data-stage-pinned` / `data-stage-centered`
  and `--stage-artifact-half`, and CSS `position: sticky` does the per-frame
  work (no JS transform on the hot path).
- **visible → out**: displacement, direction-aware. Scrolling **up**, the
  copy pushes the artifact off the lock (`STAGE_PUSH_OFF_PX`, 24px). Scrolling
  **down**, the artifact rides away below the lock (`STAGE_RIDE_AWAY_PX`,
  96px). Direction comes from `lastAlignTopByStage` (a WeakMap of the previous
  frame's align top). Both must be direction-gated: an un-gated push-off fired
  during downward re-entries, and the ride-away exit exists because reverse
  scrolling used to carry the artifact along with the text instead of
  dissolving it.
- **out → hidden**: after the fade completes. Re-entry from `out` is latched:
  the scroll position must move `STAGE_REENTRY_SCROLL_PX` (100px) from where
  the exit happened, otherwise boundary jitter strobes the artifact
  (observed: 15 visible/out flips at one boundary before the latch existed).
- `PIN_HYSTERESIS` (0.12) keeps the *active* stage stable when two chapters'
  reveals are close; `STAGE_EXIT_MARGIN` (0.08) keeps a just-engaged stage
  from disengaging on the same boundary.
- `STAGE_HANDOFF_PAUSE_MS` (240) inserts a beat between one chapter's fade-out
  and the next one's fade-in so handoffs read as two events.

### Nav mode

When a sidebar-nav jump is in flight, `applyContinuousStageAlign` receives a
`navTargetId`. For that chapter it bypasses the latch, the engagement
geometry, and the handoff gate (the landing must always materialize the
artifact); every *other* stage is instant-finalized so a mid-flight artifact
can't be left stranded. `navTargetId` is derived in
`lib/scroll/applySlideScrollFromMeasure.ts` from the nav guard set by
`ChapterNavProvider`.

## The stage-fx bus

`lib/scroll/stageFxBus.ts` publishes each chapter's stage visibility
(`publishChapterStageFx` / `chapterStageFxVisible` /
`subscribeChapterStageFx`). It exists so content that *belongs to* a stage but
lives outside it (the sticker pile portal, placed stickers) fades on the
stage's beat instead of obeying raw scroll reveal — obeying reveal made the
pile appear early and snap.

**The bus is a desktop-only signal.** On top-bar viewports the release path
publishes `hidden` for every stage, so consumers must check `topBarNav`
*first* and fall back to reveal/active-slide there — consulting the bus on
mobile is how the pile went invisible on phones. See `sync()` in
`components/StickerPile.tsx` for the canonical branch order.

Consumers that need fresh values on programmatic jumps must subscribe to
**both** the scroll frame scheduler and `subscribeChapterScrollState` — child
effects register scroll callbacks before the provider's spy, so a single
subscription sees stale state after a one-shot `scrollTo`.

## Sidebar-nav landings

`lib/scroll/chapterSnapScroll.ts` (`chapterSlotScrollTop`) computes targets:

- Stage chapters center the **copy column**, not the band — the band inflates
  to ~viewport height when the stage materializes, so band-centering lands
  the text low.
- Overviews center the band; targets past document end clamp to `maxScroll`.

`components/ChapterNavProvider.tsx` (continuous branch) sequences a landing:
set the nav guard **before** scrolling → instant jump (`asyncSettle: false`)
→ run `applySlideScrollFromMeasure` once (resolves all stage min-height
reflows in a single frame) → re-aim → settle. Re-aiming before the apply step
is what caused the old post-landing lurch.

## Stickers

Two writers set sticker visibility (a rAF scroll writer and React state);
both key off `CHAPTER_STICKER_SCROLL_VISIBILITY` =
`CHAPTER_STAGE_PAINT_VISIBILITY` (0.22) so they can't disagree. CSS applies
`visibility` immediately on show but defers it on hide until the opacity
transition ends.

- The pile portal is **always mounted** (`data-pile-visible` + CSS fade +
  `inert`); mount/unmount caused a flash at the viewport origin.
- Placed stickers deselect on scroll-away (`PlacedStickerControl.tsx`) —
  placement auto-selects, the writers skip selected stickers, and trackpad
  scrolling never fires the pointerdown that would deselect, so without this
  a placed sticker outlived every fade.

## Fade tuning

Exit/entry fades read the `--ghost-fade-*` / `--sticker-exit-*` /
`--stage-exit-*` custom properties (320ms / 8–12px defaults). Visit
`?fadeTune=1` for a live dial panel; values persist in localStorage under
`fade-tune`. To change shipped defaults, bake the panel's Copy-values JSON
into the CSS tokens.

## Prerender ghost

`src/main.tsx` keeps the prerendered markup visible while React boots
(desktop: clone; phone: move), then cross-fades. Two hard-won rules:

- Ghost **removal is chained off the fade's own timeout**, never a parallel
  wall-clock timer — hydration blocks the main thread and a parallel timer
  fires late, yanking the ghost with no fade.
- The baked sidebar nav position is viewport-dependent, so the clone path
  recomputes it for the visitor's viewport (`fixGhostNavRest`), anchored the
  same way the live nav is (email baseline 24px + contact block + gaps).

## Build pipeline

`npm run build` = `vite build` → `check-bundle` → `prerender` →
`strip-deploy-assets` → `check-csp-hash` → `stamp-sitemap`.

- Prerender needs Chromium. On CI/Vercel it uses `@sparticuz/chromium`
  (`VERCEL || CI`); locally set `PUPPETEER_EXECUTABLE_PATH` (or install
  Chrome). `scripts/prerender.mjs` spawns vite detached and kills the process
  group — SIGTERM to npx used to orphan the server and squat the port.
- `check-csp-hash` fails the build if the inline bootstrap script drifts from
  the hash pinned in `vercel.json`'s CSP.

## The drive suite (`npm run check:drive`)

`scripts/drive/` drives the **built** site in headless Chromium and asserts
the behaviors above. It caught every regression in this document's history.
Requires a full prerendered build first.

| Drive | Guards |
| --- | --- |
| `hydration` | 0 hydration errors, no collapsed stages, one h1, no overflow-x at 4 breakpoints |
| `choreography` | both-direction full drive: every stage artifact reaches opacity ≥0.95, enters within 64px of center, holds the lock ≥3 ticks |
| `stickers` | pile + placed-sticker fade lifecycle on desktop (including a real drag placement and a fade *ramp* assertion), pile presence on a mobile one-shot jump |
| `nav` | pill landings: copy centered ±24px, artifact visible, no post-landing corrective scroll, consistent re-entry positions |
| `csp` | zero `securitypolicyviolation` events across desktop/phone/`?fadeTune=1` drives, plus blob-worker and WASM probes (the Draco paths headless can't exercise) |

Run a subset with `npm run check:drive -- nav csp`. In CI it runs as the
report-only `drive` job.

Two headless gotchas the harness handles — keep them in mind when writing new
probes:

1. Headless Chrome forces `prefers-reduced-motion: reduce`, which collapses
   every transition the assertions depend on. `newDrivePage` emulates
   `no-preference`.
2. There is no GPU/WebGL in the sandbox, so 3D content can't render — WebGL
   paths get synthetic probes (see `csp.mjs`), not visual assertions.
3. Pace drives and samplers on `requestAnimationFrame`, not wall-clock
   timers. The stage machine runs on rAF; on a slow runner (CI's software
   rendering) timer-paced scrolling makes the machine see huge jumps between
   its frames while an interval sampler starves — artifacts that centered
   perfectly get recorded as never holding the lock (see `choreography.mjs`).
