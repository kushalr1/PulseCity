# PulseCity scenes — React Native + Expo integration notes

These notes are for building the Home hero and the City World preview from this asset package. They describe how to assemble the scenes, not a finished component. The app code itself is yours to write.

**No new native dependency is needed.** Use only `Image`, `View`, `Animated` and `Easing` from `react-native`. Optional: `expo-linear-gradient` instead of `hero_shade@3x.png`, if the app already has it.

## 1. Files to copy

Copy `hero/` and `preview/` into the app, e.g. `assets/scene/hero/…`. The `*_scene.json`, `asset-manifest.json` and `motion-spec.json` files are data. Import the two JSON files, or copy the needed numbers into a typed constants file.

Metro bundler resolves density suffixes. `require('./hero/hero_mid.png')` picks `hero_mid@3x.png`; the `@1x` files resolve the same way. Each manifest entry has an `rnRequire` string. Always give `Image` an explicit `width`/`height` in points from `sizePt`, so the displayed size never depends on file density.

## 2. Scene structure

The scene is a fixed artboard in points: hero 390 × 243, preview 358 × 208. Scale it as one unit.

```
<View style={{ width: containerW, height: containerH, overflow: 'hidden' }}>          // clip
  <View style={{ position: 'absolute', left: 0, bottom: 0,
                 width: ART_W, height: ART_H,
                 transform: [{ scale: k }], transformOrigin: 'left bottom' }}>       // RN ≥ 0.74; else translate-scale-translate
    …layers in zIndex order, each position: 'absolute'…
  </View>
  …native UI (copy, buttons, district pills) on top…
</View>
```

- `k = max(containerW / ART_W, containerH / ART_H)` (cover).
- Bottom-left anchoring keeps the skyline baseline fixed; extra height only crops sky.
- On RN < 0.74, without `transformOrigin`, wrap the artboard in `translate → scale → translate` instead.
- Overlay UI is laid out in container points, not artboard points. Convert district pill positions with `k` (section 5).

## 3. Layer order and placement

Order back to front comes from `asset-manifest.json` (`zIndex`).

| Element | Hero | Preview | Placement (artboard pt) |
|---|---|---|---|
| sky | ✓ | ✓ | `0,0`, stretched to artboard |
| stars (Views) | ✓ | ✓ | `motion-spec.stars` |
| moon_glow | ✓ | ✓ | centre `(moon.x − cam·0.03, moon.y)`, size `glowR·2` |
| moon | ✓ | ✓ | same centre, `sizePt` |
| ridge, far, mid | ✓ | ✓ | `left = −cam·parallax`, `top = offsetYPt`, `sizePt` |
| beam column + halo, per district | — | ✓ | `motion-spec.beams` |
| metro | — | ✓ | `left = −cam·0.8`, `top = offsetYPt` |
| **train** | **— never** | ✓ | `motion-spec.train` |
| near | — | ✓ | `left = −cam·1`, `top = offsetYPt` |
| vignette | ✓ | ✓ | `0,0`, stretched |
| shade | ✓ | — | `0,0`, stretched (or a native gradient) |

**The hero must not render the metro, the train or beams.** None of those files exist for the hero, and the manifest lists them under `sceneContents.hero.excludes`.

## 4. Animation (all values from `motion-spec.json`, unchanged from v2.3)

Drive everything from **one clock per scene** (`t` in seconds) and a camera value `cam`. Only `transform` and `opacity` animate, so `useNativeDriver: true` works for all of it.

| Motion | Spec | RN approach |
|---|---|---|
| Camera drift | 6 pt/s linear, ping-pong 0 ↔ `maxCam` (hero 136.5, preview 250.6) | `Animated.loop(Animated.sequence([timing 0→maxCam, timing maxCam→0]))`, each `duration = maxCam/6 s`, `Easing.linear`. Each layer's `translateX = cam.interpolate(× −parallax)` |
| Stars | opacity `0.8·(0.35 + 0.65·(0.5+0.5·sin(1.6t + phase)))`, period 3.93 s; x drifts ×0.04 with wrap | One looping `t` value; per-star opacity from a precomputed sine table via `interpolate`. Wrap is only needed for the full drift range (stars move ≤ 10 pt) |
| Moon | `translateX = −cam·0.03` | interpolate from `cam` |
| Hero entrance (first open only) | 1.8 s; `e` linear 0→1; `rise = 1 − easeOutCubic(e)`; far `translateY = 20·rise`; mid `translateY = 36·rise`, `opacity = min(1, 0.15 + 1.2e)` | `Animated.timing(e, {toValue:1, duration:1800, easing: Easing.linear})`, then interpolate with the easing curve sampled into input/output ranges |
| Train (preview) | 60 pt/s linear, `x = (t·60 mod (metroWidth+200)) − 100 − cam·0.8`, `y = 177.2`, 90 × 9 pt | `Animated.loop(timing 0→metroWidth+200, duration = (metroWidth+200)/60 s, linear)`, then `Animated.subtract(trainX, cam·0.8 + 100)` |
| Beams (preview) | column opacity `0.42·it·pulse`, halo `0.7·it`, `pulse = 0.85 + 0.15·sin(3t + 9·d.x)` (2.09 s period), `x = d.x·midWidth − cam·0.6` | per district: translateX from `cam`, opacity from a looping sine. **Multiply both opacities by `normalBlendOpacityBoost` = 1.5 (clamp ≤ 1)** — v2.3 blends beams additively, RN cannot |
| Reduced motion | no animation: render `cam = 0, t = 0` | `AccessibilityInfo.isReduceMotionEnabled()` — skip starting loops |
| Visibility | v2.3 stops drawing off-screen | stop loops when the screen is blurred (`useIsFocused`/navigation focus) or the card is scrolled out of view; restart on return |

`it = 0.12 + 0.36·min(2, matches)`. `matches` = places in the district that fit the current mood. That is app data: the JSON holds v2.3's demo values, so recompute it from your listings.

Easing definitions are in `motion-spec.easing`: easeOutCubic `1−(1−t)³`, easeInOutCubic for future mood cross-fades.

## 5. District pills (native)

Pills are native views over the preview; they appear only for districts with `matches > 0`. Rules are from v2.3 `posPills`, in artboard pt; multiply by `k` for container pt:

- **centre x:** `d.x·midWidth − cam·0.6`, with `left = clamp(x − w/2, 6, W − w − 6)`.
- **y:** `base = clamp(d.top − 42, 88, H − 70)`. Try `base`, `base−42`, `base+42`, `base−84`; take the first that doesn't overlap an earlier pill (36 pt rows, 6 pt gaps).
- **Visibility:** hidden when `x ≤ 12` or `x ≥ W − 12`.
- **Style:** see `motion-spec.districtPills.style`.

Pill positions follow `cam`. Either update them with a light listener at about 10 Hz, or drive `translateX` from the same `cam` animated value per pill.

## 6. Performance

- Decoded image memory is about 5.8 MB (hero) and 6.3 MB (preview), mostly the wide @3x mid layers. Both scenes are on Home, so load them once.
- Do not add full-scene flattened images; every element is already a separate layer.
- If memory is tight on low-end Android, re-export at @2x (`SCALE = 2` in `src/export_scene_assets.py`).
- 70 star Views per scene are cheap with native-driver opacity. If profiling shows otherwise, group stars by phase into a few Views, a small, measurable visual deviation from v2.3.
- Keep `resizeMode="stretch"` only for sky / vignette / shade / beam_column; everything else is shown at its `sizePt`.

## 7. Winter Wonderland theme

Use the `hero-winter/` and `preview-winter/` sets when the theme is Winter. Mount only the active theme's images (about 8–9 MB decoded per winter scene). Everything in sections 2–5 applies unchanged; the additions are listed below, with all numbers in `motion-spec.json → winter`.

**Layer order (back → front):** sky, stars, moon glow, moon, ridge, **fog band 0**, far, **farCaps**, **fog band 1**, mid, **midCaps**, beams (preview), metro + train (preview), near (preview), **snowman** (body, head, front, arm), **snowfall**, **frost**, shade (hero).

| Element | How to build it | Motion |
|---|---|---|
| farCaps / midCaps | `Image`, same placement and parallax as `far` / `mid` | opacity = `snowAmt` |
| Fog (4 bands) | `fog@1x` stretched to `fog.w × 2·fog.h`, two copies 2·W apart, at `x = fog.x + k·2W − 0.3W` (k = −1, 0) | `translateX` at `fog.v · 0.96` pt/s, wrapping every 2·W; opacity `fog.a × 0.1` (band 0) or `× 0.12` (band 1). Not affected by the camera |
| Snowman | 4 `Image`s in one container at the snowman origin, each at `box.x0·scale, box.y0·scale`, size `box·scale` | container rotate `0.3·tilt`; head rotate `tilt` around (0, −48·scale); arm rotate `wave` around (9·scale, −33·scale). `tilt = 0.06·sin(1.3t)` (4.83 s period), `wave = 0.5·sin(2.4t)` (2.62 s period). Opacity `snowAmt`. Fixed on screen |
| Snowfall | 46 (hero) / 60 (preview) flakes: small = native white circle, radius `0.6 + 1.5z`; big = `flake_big` 12 × 12 pt rotated by `phase` | fall at `14 + 34z` pt/s, sideways `sin(0.8t + phase)·8z` pt/s, respawn at top with random x; opacity `(0.35 + 0.55z)·snowAmt` |
| Frost | `frost@1x` stretched over the scene | opacity `snowAmt` |
| Beams | same sprites/maths as City World, winter colours | column `0.3·it·pulse`, halo `0.7·it`; **no ×1.5 boost** (v2.3 winter is not additive) |

`snowAmt` runs from 0 to 1 over 1.4 s (linear), only right after the user switches to Winter. Otherwise it is 1, and with reduced motion it is 1 immediately. Under reduced motion, set fog, snowfall, tilt and wave all still.

For performance, 60 animated flakes are the heaviest part. Drive them from one shared clock with native-driver transforms. If profiling on a low-end device shows a problem, reduce the count; that's a visible deviation from v2.3, so note it.

## 8. Extending later (out of current scope)

- **Another mood or theme:** colours are baked into the PNGs. Re-run the exporter with `--mood` / `--theme`; `color-tokens.json` has every v2.3 palette. Cross-fade between two layer sets for mood changes (0.8 s easeInOutCubic in v2.3).
- **Full-screen City World and Surprise Me:** not exported. v2.3 has cars, streetlights, five snowmen and the searchlight for those.

## 9. What was verified, and what was not

- **Verified (here):**
  - Every file in `asset-manifest.json` exists, its sha256 matches, and its pixel size matches.
  - Frames rebuilt from these files match v2.3's renderer: hero mean error 0.87/255; preview 1.5/255 with the ×1.5 beam boost.
  - Winter frames rebuilt from these files match v2.3: hero mean error 0.65–0.69/255, preview 0.79–0.85/255.
  - Neither hero (City World or Winter) contains train, metro or beam assets.
- **Not verified:** rendering inside React Native/Expo on a device. There is no app in this environment.
