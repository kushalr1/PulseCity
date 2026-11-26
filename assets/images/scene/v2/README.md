# PulseCity scene assets v2.0 — every mood, both themes, Home hero, City World preview, full-screen City World, Surprise Me

**What's new in v2.0:**
- All 6 moods (Chill, Social, Nature, Active, Foodie, Explore) for both themes.
- Full-screen City World and the Surprise Me screen (`full` surface, 390 × 844 pt), with cars, streetlights, 5 Winter snowmen and the Surprise searchlight/flash.
- Per-mood glow values and the mood cross-fade spec.

36 sets, 576 files, all exported from the v2.3 renderer with its own seeds; no artwork was redrawn. v1.2 files are unchanged.

## How to find a set

Each set is keyed `"<surface>/<theme>/<mood>"` in `asset-manifest.json → sets`:
- Surfaces: `hero`, `preview`, `full`.
- Themes: `city`, `winter`.
- Moods: `chill`, `social`, `nature`, `active`, `foodie`, `explore`.

Folder = `<surface>[-winter][-<mood>]`, with mood omitted for Chill; e.g. `hero`, `preview-winter`, `full-social`, `full-winter-active`. Every asset lists its `requirePath` for a static `require()`. Use that density-family path (e.g. `require('./full/full_mid.png')`), never the `@3x` filename.

**The Home hero never contains the metro, the train or beams.** This is checked for all 12 hero sets.

## Verification (v2.0)

Every new set was rebuilt from its exported files with plain alpha blending, and compared pixel by pixel with v2.3's own frames:
- 3 frames per set; for full-screen sets, 3 frames plus Surprise search and Surprise lock-on.
- Results are in `_reference/fidelity_report_v2.json`, with a contact sheet at `_reference/contact_sheet_v2.jpg`.

| Sets | Mean abs error (0–255) | Pixels off by > 16 |
|---|---|---|
| Hero, all moods, both themes | 0.63–0.85 | ≤ 0.10 % |
| Preview + full, Winter, all moods | 0.67–0.81 | ≤ 0.29 % |
| Preview + full, City World, all moods | 1.20–1.80 | 1.2–4.0 % (additive glow approximated; Active is the worst) |

City World's beams, car lights and Surprise cone/flash are additive in v2.3. React Native has no additive blending without new dependencies, so they use normal alpha with a per-mood opacity boost fitted against v2.3: Chill, Social and Foodie ×1.5; Nature and Explore ×2.0; Active ×2.5. Winter needs none.

**Memory once loaded:** hero about 6 MB, preview about 6 MB, full-screen about 41 MB (City World) or 53 MB (Winter) at @3x. The full city is 3.1× the screen width. Layers hidden behind the ground were trimmed losslessly. If a device struggles, ask for an @2x full-screen set (about 45 % of that memory).

---

# v1.x notes (still valid)

**Scope:** City World and Winter Wonderland themes, Chill mood. Home hero (v2.3 `band` mode) and the City World preview card on Home (v2.3 `panel` mode).
Full-screen City World, Surprise Me and other moods are **not** included.

**Source:** every PNG was produced by the original v2.3 renderer (`scene.js` → `CityScene`), at @3x. The renderer used its own seeds (buildings and stars `rng(7)`, ridge `rng(3)`), geometry, palette and layer order. No artwork was redrawn or redesigned.

## Folder

```
hero/            8 PNGs (no metro, no train) + hero_scene.json         (City World, artboard 390 × 243 pt)
hero-winter/    16 PNGs (no metro, no train) + hero_winter_scene.json  (Winter Wonderland, same artboard)
preview/        12 PNGs + preview_scene.json                          (City World, artboard 358 × 208 pt)
preview-winter/ 20 PNGs + preview_winter_scene.json                   (Winter Wonderland, same artboard)
asset-manifest.json every file: z-order, role, px/pt size, density, parallax, y-offset, sha256, RN require(), responsive scaling rules, scene contents
INTEGRATION-RN-EXPO.md   React Native + Expo integration notes
_export-manifest.json raw exporter output (asset-manifest.json is built from it)
motion-spec.json    all motion: camera drift, stars, moon, entrance, train, beams, pills, reduced motion, responsive rule
color-tokens.json   full v2.3 palette table (all moods/themes) + geometry + parallax, for later exports
_reference/         v2.3 renderer frames, frames rebuilt from these files, diff images, fidelity_report.json
src/                export + verification scripts (re-run to regenerate)
```

## Layer stack (back → front)

| z | Hero | Preview | Moves? |
|---|------|---------|--------|
| 0 | `hero_sky` (stretch) | `preview_sky` (stretch) | no |
| 1 | stars — native squares from `motion-spec.stars.hero` | stars — `motion-spec.stars.preview` | twinkle + slow parallax |
| 2 | `hero_moon_glow@1x` | `preview_moon_glow@1x` | parallax ×0.03 |
| 3 | `hero_moon` | `preview_moon` | parallax ×0.03 |
| 4 | `hero_ridge` | `preview_ridge` | parallax ×0.12 |
| 5 | `hero_far` | `preview_far` | parallax ×0.3 (+ entrance on hero) |
| 6 | `hero_mid` | `preview_mid` | parallax ×0.6 (+ entrance on hero) |
| 7–8 | — | `preview_beam_column`, `preview_beam_halo` × each visible district | opacity pulse, follows mid parallax |
| 9 | — | `preview_metro` | parallax ×0.8 |
| 10 | — | `preview_train` | **60 pt/s**, own transparent sprite |
| 11 | (none: v2.3 hero ground sits below the frame) | `preview_near` | parallax ×1 |
| 12 | `hero_vignette@1x` (stretch) | `preview_vignette@1x` (stretch) | no |
| 13 | `hero_shade` (stretch, optional — may be a native gradient) | — | no |
| UI | native: location, buttons, headline, search | native: overline, title, district pills, buttons | — |

Layer PNGs are cropped to their content. Place each at `x = -cam × parallax`, `y = offsetYPt` (asset-manifest), size = `sizePt`. **The Home hero never contains the metro or the train** — they belong to the City World preview only.

## Winter Wonderland (added in v1.2)

Exported the same way from v2.3 (`theme: winter`, Chill), with the same camera, parallax, stars, moon position, entrance, train and pills. What differs is in `motion-spec.json → winter`:
- **Snow caps + icicles** are separate layers (`farCaps`, `midCaps`). They sit exactly on top of `far` / `mid` and fade in with `snowAmt`.
- **Snowman**: 4 sprites sharing one box. The body is fixed; the head tilts and the right arm waves around the given pivots. He is fixed on screen at 62% size (hero) or 80% (preview); there is one per scene.
- **Snowfall**: screen-space flakes. Small ones are native white circles; large ones use `flake_big`, rotated.
- **Fog**: 4 drifting bands drawn with v2.3's own `fog` sprite, in screen space.
- **Frost edge** replaces the City World vignette. The hero shade uses winter colours.
- **Beams** use plain alpha blending in v2.3's winter theme, so React Native matches them exactly, with no boost.
- **`snowAmt`** fades the snow in over 1.4 s, only right after the user switches to Winter.

## Positioning and motion (summary — `motion-spec.json` is authoritative)

- **Camera drift:** `cam` moves 6 pt/s, linear, ping-pong between 0 and `maxCam`. That is 136.5 pt for the hero and 250.6 pt for the preview.
- **Stars:** `x = (((s.x·W·1.3 − cam·0.04) mod W·1.3) + W·1.3) mod W·1.3 − W·0.15`, `y = s.y·H`, side = `s.size` pt, white. Opacity = `0.8·(0.35 + 0.65·(0.5 + 0.5·sin(t·1.6 + phase)))`.
- **Moon:** centre `(moon.x − cam·0.03, moon.y)`; glow drawn at `glowR·2` square around the same centre.
- **Hero entrance** (first open only): over 1.8 s, `e = t/1.8` (linear), `rise = 1 − easeOutCubic(e)`. Far layer `translateY = rise·20`; mid layer `translateY = rise·36` and `opacity = min(1, 0.15 + 1.2e)`.
- **Train** (preview): `x = (t·60 mod (metroWidth + 200)) − 100 − cam·0.8`, `y = 177.2` pt, size 90 × 9 pt.
- **Beams** (preview): per district `x = d.x·midLayerWidth − cam·0.6`.
  - Column: `[x−6, 0, 12, top−4]`, opacity `0.42·it·pulse`.
  - Halo: 44 pt, centred at `(x, top−4)`, opacity `0.7·it`.
  - Intensity and pulse: `it = 0.12 + 0.36·min(2, matches)`, `pulse = 0.85 + 0.15·sin(3t + 9·d.x)`. `matches` is data-driven; the JSON holds the v2.3 demo values.
  - **v2.3 blends beams additively; React Native can't without new dependencies.** Use normal alpha with both opacities ×1.5 (clamped to 1). That value was fitted against v2.3 frames.
- **District pills:** native views. Their placement and overlap-avoidance rules are in `motion-spec.districtPills` (from v2.3 `posPills`).
- **Reduced motion:** a single frame at `cam = 0, t = 0`, with no animation at all.
- **Pause** when the scene is off-screen or the screen loses focus; v2.3 stops drawing when not visible.

All movement is translate/opacity only, so it can run with React Native's built-in `Animated` + `useNativeDriver: true`. **No new native dependency is required** (`Image`, `View`, `Animated` only).

## Responsive scaling

Treat each scene as one fixed artboard (hero 390 × 243 pt, preview 358 × 208 pt):

1. Scale uniformly by `k = max(viewWidth / artboardWidth, viewHeight / artboardHeight)` ("cover").
2. Anchor bottom-left; extra height crops the top of the sky.
3. Multiply every position, size and speed in `motion-spec.json` by `k`.

Each layer is wider than the artboard by `maxCam × parallax`, so drifting over `[0, maxCam]` never exposes an edge. v2.3 regenerates the skyline for every canvas size. Freezing it at the artboard keeps the approved composition identical on every phone. The hero artboard assumes a 47 pt top inset (v2.3 hero = inset + 196 pt); larger insets only crop sky.

## Verification (done, results in `_reference/fidelity_report.json`)

Frames were rebuilt from these files only and compared pixel-by-pixel with the real v2.3 `CityScene.draw()` output. The check ran at @3x, at three camera, time and train positions.

| Scene | Blending | Mean abs error (0–255) | Pixels off by > 16 |
|---|---|---|---|
| Hero | normal | 0.87 | ≤ 0.014 % |
| Preview | additive (v2.3 mode) | 0.95–1.01 | ≤ 0.39 % (hairline beam edges) |
| Preview | normal ×1.5 (RN, no new deps) | 1.46–1.50 | ≤ 1.5 % (inside beam glows) |
| Hero, Winter | normal (exact in RN) | 0.65–0.69 | ≤ 0.11 % (hairline edges of rotated sprites) |
| Preview, Winter | normal (exact in RN) | 0.79–0.85 | ≤ 0.28 % |

The preview page also re-checks the scenes laid out as plain positioned `<img>`/`<div>` elements, the way React Native would draw them. Against v2.3 the hero comes to 2.03 mean / 0.74 % > 16 (shade overlay hidden; stars are sub-pixel squares). The preview comes to 2.50 / 1.53 %. Your approved board screenshots were used as a visual reference only. They are rendered at a different scale with UI on top, so they were not pixel-diffed.

## Not verified / limitations

- **Not run in React Native.** There is no React Native app in this environment, so on-device appearance and performance are untested.
- **Decoded texture memory** is about 5.8 MB (hero) and 6.3 MB (preview), mostly the wide @3x mid layers. Load @2x on lower-end devices if needed: re-run the export with `SCALE = 2`.
- **Decoded texture memory, Winter:** about 8.1 MB (hero) and 9.0 MB (preview). Only load the active theme's set.
- **Colours are baked in.** Another mood or theme needs a re-export (`--mood`, `--theme`); it is not a runtime tint. `color-tokens.json` keeps every palette.
- **Additive glow is approximated**, so beams are slightly less luminous than v2.3.
- `hero_near` is deliberately absent: v2.3 has no ground in the hero frame.

## Regenerating

Serve the v2.3 HTML over http (`python3 -m http.server`). Then run these with Python 3, `playwright` (Chromium) and Pillow:

```
python3 src/export_scene_assets.py --url http://127.0.0.1:8765/pulsecity-v2.3.html --out ./pulsecity-scene-assets
python3 src/build_package.py
python3 src/verify_composite.py ./pulsecity-scene-assets
python3 src/export_winter_assets.py --out ./pulsecity-scene-assets   # Winter Wonderland
python3 src/build_winter_package.py
python3 src/verify_winter.py ./pulsecity-scene-assets
python3 src/export_scenes_v2.py --out ./pulsecity-scene-assets       # v2.0: all moods, full screen, Surprise
python3 src/trim_hidden.py ./pulsecity-scene-assets
PC_BOOST='{"beam":1.5,"car":1.5,"cone":1.5,"flash":1.5}' python3 src/verify_v2.py ./pulsecity-scene-assets full,full-social   # per mood boost
python3 src/build_v2_package.py      # writes asset-manifest.json v2.0 + motion-spec additions; fails on any problem
python3 src/fit_beam_normal.py        # optional: re-fit the normal-blend beam boost
```

Paths inside the scripts assume the working layout used here (`/home/claude`); adjust `OUT`/`BASE_URL` if you move them.

Licence: original procedural artwork from the PulseCity v2.3 prototype. No third-party assets.
