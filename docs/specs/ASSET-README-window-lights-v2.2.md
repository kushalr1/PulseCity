# PulseCity window lights v2.2 (grey data): replaces the v2.1 `*_lights@3x.png`

## Why v2.2

The device test with `DEBUG_ALL` showed lit windows, so the z-order fix works. But it also showed a **beige wash over the whole lights rectangle**, and in normal mode the **wrong windows switch on** (for example, a tower lights up when going from Nature to Active).

**Cause:** Skia on iOS colour-manages images (sRGB → Display P3) when it samples them. That changes the packed RGB data.

| Pixel | Stored (sRGB) | Read back on iOS (P3) | Effect |
|---|---|---|---|
| No-window pixel | magenta (255, 0, 255) | (234, **51**, 247) | 20 % coverage everywhere, which is the wash |
| Window threshold | high and low bytes in R and B | shifted | wrong windows switch on |

**Neutral greys are unchanged by this conversion** (checked: maximum change 0 for every grey 0–255). So v2.2 stores the data as **two opaque grey images per layer**.

The v2.1 `*_unlit` layers stay exactly as they are. Only the `window-lights/` data changes.

## Files

| File | Content |
|---|---|
| `window-lights/<surface>/<surface>_<layer>_thr@3x.png` | Grey threshold code **T**, 0–254. 255 means no window. |
| `window-lights/<surface>/<surface>_<layer>_cov@3x.png` | Grey window coverage × alpha, 0–255. 0 means no window. |
| `window-lights/calibration_ramp_256.png` | 256 × 16 px. Column *i* is grey *i*. Used for the device self-test below. |
| `window-lights/window-lights-v2.2.json` | Sizes, `offsetYPt`, `hazeTopPt`, the knots and the verification results |

- `<surface>` is `hero`, `preview` or `full`. `<layer>` is `far` or `mid`.
- Size, `offsetYPt` and `hazeTopPt` are identical to v2.1. Place the images exactly where the v2.1 lights image was.

## Exact for every mood (knot encoding)

The threshold is 8-bit, but it is placed so that each mood's own `lit` value falls exactly on a code boundary:

| lit | 0 | 0.10 | 0.12 | 0.24 | 0.38 | 0.50 | 0.58 | 0.80 | 1.0 |
|---|---|---|---|---|---|---|---|---|---|
| code K | 0 | 26 | 31 | 61 | 97 | 128 | 148 | 204 | 255 |

A window is on **iff `T < litCode`**, where `litCode = interp(lit, knots)`: piecewise-linear between the knots above, computed in JS or a worklet.

Verified on all 6 layers:
- **0 mismatched window pixels** at every mood's lit value, against v2.3's exact rule.
- Between knots, during the 800 ms animation, at most 1.8 % of window pixels differ in timing. That is a few windows switching one frame early or late, which is invisible.

## Shader (replaces the v2.1 one)

```glsl
uniform shader thr;        // ImageShader of *_thr@3x.png, nearest, no mipmaps
uniform shader cov;        // ImageShader of *_cov@3x.png, nearest, no mipmaps, same rect
uniform float  litCode;    // interp(lit, knots), 0..255, animated
uniform float3 win;        // 0..1
uniform float3 haze;       // 0..1 (far only)
uniform float  hazeAlpha;  // far: lerped palette.hazeA; mid: 0
uniform float  hazeTopPt;  // far: from json; mid: 1e9
half4 main(float2 xy) {
  float g = cov.eval(xy).r;
  if (g <= 0.0) return half4(0);
  float T = floor(thr.eval(xy).r * 255.0 + 0.5);
  if (T >= litCode) return half4(0);
  float3 c = (xy.y >= hazeTopPt) ? mix(win, haze, hazeAlpha) : win;
  return half4(c * g, g);
}
```

## Device self-test (do this once)

1. Draw `calibration_ramp_256.png` through this shader, in a 256 × 16 pt rect with nearest sampling:

   ```glsl
   uniform shader ramp;
   half4 main(float2 xy) {
     float v = floor(ramp.eval(xy).r * 255.0 + 0.5);
     return abs(v - floor(xy.x)) < 0.5 ? half4(0, 1, 0, 1) : half4(1, 0, 0, 1);
   }
   ```

2. The strip must be **100 % green**. Any red column means the greys are still being changed by colour management on that device, and the lights will be wrong.
3. If you see red, use `makeRawShader` / a raw image shader if your Skia version exposes one, or create the images with no colour space, and test again.
