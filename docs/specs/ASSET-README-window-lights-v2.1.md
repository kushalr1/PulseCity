# PulseCity scene assets v2.1 add-on: animated window lights

This add-on gives the React Native app the **v2.3 "lights switching on/off" mood transition**. Use it **together with package v2.0**: it replaces only the `far` and `mid` layers and adds two small data images per surface. Every other v2.0 file stays as it is.

## Why this is needed

In v2.3, a mood change does **not** cross-fade two pictures. `scene.js` interpolates the palette over **0.8 s (easeInOutCubic)**, and that includes the lit-window fraction `lit`:

| Mood | lit |
|---|---|
| Chill | 0.24 |
| Social | 0.80 |
| Nature | 0.12 |
| Active | 0.10 |
| Foodie | 0.58 |
| Explore | 0.38 |
| Winter (all moods) | 0.50 |

Every window has a fixed random threshold `h`. A window is on while `h < lit`; for the far layer the rule is `h < lit × 0.8`. As `lit` moves, for example from Chill 0.24 to Social 0.80, windows **switch on one by one in a scattered order**. Going the other way, they switch off one by one.

The v2.0 package bakes the windows into `far`/`mid` for each mood, so cross-fading two moods only dims one picture into the other. See `_reference/` for the real v2.3 motion:
- `v23_preview_chill_to_social_mood_change.mp4` and `v23_full_chill_to_social_mood_change.mp4`
- The reverse direction, `..._social_to_chill_...`
- `*_strip.jpg`

## Contents

| Path | What it is | Count |
|---|---|---|
| `<set>/<pre>_far_unlit@3x.png`, `<pre>_mid_unlit@3x.png` | v2.0 `far` / `mid` layer of that set with **all windows off**, exactly as v2.3 draws them when unlit: bodies, glass sheen, haze, faint unlit window marks. Same size and `offsetYPt` as the v2.0 file it replaces. | 36 sets × 2 = 72 |
| `window-lights/<surface>/<surface>_far_lights@3x.png`, `_mid_lights@3x.png` | **Data image**, not a picture. Mood- and theme-independent, because the building geometry is seeded and identical in every set. | 3 surfaces × 2 = 6 |
| `_export_window_lights.json` | Every file with `sizePx`, `sizePt`, `offsetYPt`, `parallax`, `replaces`, plus the verification table | |
| `src/export_window_lights.py` | Exporter. Runs the original v2.3 `CityScene` at @3x. | |
| `src/verify_transition_frames.py` | Compares the RN recipe against real v2.3 mid-transition frames | |

Set folders use the same names as v2.0: `hero`, `hero-social`, `hero-winter-foodie`, `preview-…`, `full-…`.

### Data image encoding

The data images are **opaque RGBA**, which avoids premultiplied-alpha loss:

| Channel | Meaning |
|---|---|
| R | High byte of the 16-bit threshold `t` |
| B | Low byte of the 16-bit threshold `t` |
| G | Window coverage × window alpha, 0–255. Far windows are alpha 0.5, glass-tower strips 0.75, grid windows 0.9. Anti-aliased edges are included. `G = 0` means no window. |
| A | Always 255 |

- The threshold is `t = (R × 256 + B) / 65535`. For the far layer it is already stored as `h / 0.8`, so **both layers use the same test: `t < lit`**.
- Windows hidden behind later buildings or trees are already removed.

| Surface | far data | mid data | far `hazeTopPt` (image-local) |
|---|---|---|---|
| hero | 431 × 103 pt, offsetY 140 | 472 × 101.667 pt, offsetY 141.333 | 20.38 |
| preview | 434 × 103 pt, offsetY 105 | 509 × 107 pt, offsetY 101 | 23.96 |
| full | 636 × 291 pt, offsetY 411.667 | 882 × 348.333 pt, offsetY 354.333 | 44.093 |

Place each data image exactly like its `far`/`mid` layer: same parallax, same cover scale, its own `offsetYPt`.

## Recipe (per surface, per frame)

```
e      = easeInOutCubic(progress)          // progress 0 -> 1 over 800 ms, from the moment of the mood change
                                           // (or from the moment the surface becomes visible, see the Pass 4 spec)
base   = crossfade(unlitA, unlitB, e)      // the same set cross-fade you already have, but using the *_unlit layers
lit    = lerp(litA, litB, e)
win    = lerp(winA, winB, e)               // palette.win of each set, from the v2.0 <set>_scene.json
haze   = lerp(hazeA_col, hazeB_col, e); hazeAlpha = lerp(hazeAa, hazeAb, e)   // far only
for each lights pixel:  t = (R*256+B)/65535;  o = (t < lit) ? G/255 : 0
  far:  colour = (y >= hazeTopPt) ? mix(win, haze, hazeAlpha) : win     // v2.3 paints its haze over far windows
  mid:  colour = win
  out = premultiplied (colour*o, o)  drawn source-over on top of the base far/mid layer
```

Layer order is unchanged from v2.0. The lights draw immediately above their own layer:

> sky · moon glow · moon · ridge · **far (unlit)** · **far lights** · far caps (winter) · **mid (unlit)** · **mid lights** · mid caps (winter) · beams · metro · train · near · …

All palette values (`win`, `haze`, `hazeA`, `lit`) are in each set's `<pre>_scene.json → palette` in v2.0.

## Verification

All numbers are 0–255 RGB differences, measured on the visible pixels of each layer.

- **Static, all 36 sets × far/mid:** unlit + lights at that set's own `lit` was compared with the v2.0 baked layer. The v2.0 baked layer re-renders byte-identical (max diff 0). Reconstruction error: mean ≤ 0.25, 99th percentile ≤ 3.0, max 7, and **0 pixels above 24**.
- **Mid-transition, against real v2.3 frames** (preview and full; Chill→Social and Social→Nature; e = 0.25 / 0.5 / 0.75): mean ≤ 1.1 and 99th percentile ≤ 4.
  - A few edge pixels go up to about 96. On the preview far layer that is up to about 590 of about 310 k pixels, from 8-bit rounding of the interpolated colours along the haze edge. It is not visible at normal size.

## React Native implementation notes

- Use **@shopify/react-native-skia**. It is included in Expo Go. Draw each scene surface in **one Skia `<Canvas>`**, with all v2.0 layers as `<Image>` and the two lights layers as a `RuntimeEffect` shader. Drive `e`, the camera and the opacities with Reanimated shared values, so everything runs on the UI thread.
- **Sample the data image with nearest filtering**, never linear. Linear filtering mixes the high and low threshold bytes at window edges and gives wrong thresholds. At @3x on a 3× screen it maps about 1:1.
- Data images decode to about 1.6–11 MB each: full mid is the largest, at about 11 MB. Load the full-screen data images only while City World is open.

Example SkSL. Local coordinates are the lights image's own pt space, origin at its top-left:

```glsl
uniform shader lights;      // ImageShader of *_lights@3x.png, rect = (0,0,sizePt), nearest sampling
uniform float  lit;
uniform float3 win;         // 0..1
uniform float3 haze;        // 0..1 (far); any value for mid
uniform float  hazeAlpha;   // far: lerped palette.hazeA; mid: 0
uniform float  hazeTopPt;   // far: from the table above; mid: 1e9
half4 main(float2 xy) {
  half4 d = lights.eval(xy);
  float g = d.g;
  if (g <= 0.0) return half4(0);
  float t = (floor(d.r * 255.0 + 0.5) * 256.0 + floor(d.b * 255.0 + 0.5)) / 65535.0;
  if (t >= lit) return half4(0);
  float3 c = (xy.y >= hazeTopPt) ? mix(win, haze, hazeAlpha) : win;
  return half4(c * g, g);   // premultiplied
}
```
