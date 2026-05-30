# Pixel 8 Pro — 3ds Max / FBX source

## Files

| File | Role |
|------|------|
| `pixel-8-pro.max` | Original V-Ray Max scene |
| `pixel-8-pro.fbx` | **Web pipeline** — materials + `DiffuseColor` per slot |
| `sceneassets/` | Textures referenced by the FBX (filenames must match export) |

## FBX vs MAX

- **FBX** — Three.js `FBXLoader` reads **26 materials** with embedded **`DiffuseColor`** (RGB) and optional bitmap paths. This is what PhoneSwap uses when `PIXEL8_USE_FBX` is true.
- **MAX** — Not loadable in the browser; use Max only to re-export FBX/OBJ.

## `pixel-8-pro-tex/` (Max `texture/` folder)

| File | Use |
|------|-----|
| `logo_alpha.png` | Google logo on logo mesh |
| `speaker_alpha.png` | Speaker cutout |
| `speaker_grille_alpha.png` | Top grille cutout |
| `body_jade_light.png` | Jade body atlas (optional) |

PhoneSwap loads these on top of FBX colors via `applyPixel8DetailMaps`.

## sceneassets (from your export)

| FBX path | In repo |
|----------|---------|
| `Google-Pixel-8-Pro-Jade-Light.png` | Copy of jade body atlas (active colorway in this FBX) |
| `images (2).png` | Copy of `Android.png` (UI reference) |
| `speeker.png` | Copy of `speaker_alpha.png` |

If you export **Licorice / Bay** from Max, add `Google-Pixel-8-Pro-Licorice-Dark.png` (or your atlas name) here and re-export FBX.

## Re-export FBX from Max

1. Select the correct material variant (Bay / Licorice / Jade).
2. Export FBX to `pixel-8-pro.fbx`.
3. Copy textures into `sceneassets/` keeping **exact filenames** from the FBX (or update copies in this folder).
4. Hard refresh the dev site.

## Inspect materials locally

```bash
# Browser devtools: check debug log `pixel8-fbx` for `fbxMaterials` color list.

# Node (textures may fail without DOM; colors still in file):
node scripts/inspect-pixel8-fbx.mjs public/models/pixel-8-pro-source/pixel-8-pro.fbx
```

## OBJ fallback

Set `PIXEL8_USE_FBX = false` in `lib/phone-swap/pixel8Assets.ts` to use `Google Pixel 8 Pro.obj` + MTL colors instead.
