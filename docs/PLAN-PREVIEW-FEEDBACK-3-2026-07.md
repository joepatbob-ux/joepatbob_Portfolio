# Plan — Preview Feedback Round 3

Five items, all diagnosed against the branch build. Suggested order: bowl (bug)
→ phone jump (bug) → scratcher crop (my regression) → Touch 2 size → sticker
pile (design).

## 1. Concepts bowl not loading — root cause found

`QuoteBowlSceneLighting` uses drei `<Environment preset>`, which **fetches an
HDR environment map from a third-party CDN at runtime**, inside the scene's
Suspense boundary. If that CDN is slow or unreachable, suspense never resolves
and the "Loading bowl…" spinner spins forever — and even when it succeeds it's
now the largest remaining load cost (the local textures are already fixed).

**Fix:** replace the preset with three.js's procedural `RoomEnvironment`
(generated on-device, zero network) or a self-hosted HDR under `/public`.
Verify: bowl reaches `sceneReady` with the network blocked to third parties.

## 2. Phones load then jump to mid-viewport

The phone chunk + GLB mount after the chapter is already on screen; the
artifact's height changes from the small loading shell to the real 442px
canvas, which moves the sticky center line — the whole artifact visibly jumps
to its new center.

**Fix:** reserve the final box during load — the loading shell must have the
same dimensions as the loaded canvas (the width cap is known: 400px; aspect
960/1060). Zero height delta at canvas mount = zero jump. Same pattern for any
other late-mounting stage.

## 3. Scratcher ticket art oversized/cropped (my regression)

The height cap I added (40dvh) crops rather than scales: the ticket stack's
width stays at 28vw (403px) while `overflow: hidden` chops the aspect-ratio
art (805.73 × 1274.34) at 360px — measured 403×360, true aspect would be
403×637. The tray ("coin area") sits outside the crop, which is why it looks
right.

**Fix:** derive the width cap from the height cap through the aspect ratio
(`--scratch-ticket-w-max: min(current, calc(h-max × 805.73 / 1274.34))`) so
the whole ticket scales; align `.kelvin-scratch--placeholder` with the final
size so it doesn't flash large-then-shrink.

## 4. Touch 2 photo too small

The artifact box is at the 459px gallery width, but the photo column inside is
`--cs-touch2-slide-w-ref: 387px` — the carousel doesn't fill its own stage.

**Fix:** scale the carousel to the full gallery width at ≥1024 (photo
~459×510 ≈ 57dvh — top of the shared band). If that crowds the copy column,
trim the dot-rail gap instead of the photo.

## 5. Sticker pile — larger, messier

Design tweak in `StickerPile`: bigger footprint, wider scale range, more
rotation variance and overlap so it reads as a real pile rather than an
arrangement. Implement, screenshot at 1440, iterate on your eye.

## Verification (every step)

tsc + build; zero-jump trajectory probe (all 10 chapters); per-item probes:
bowl `sceneReady` offline, phone mount height-delta = 0, kelvin ticket aspect
correct at 1440×900 / 1920×800, Touch 2 ≥ gallery width; push to the branch
preview after each item so you can judge visually.
