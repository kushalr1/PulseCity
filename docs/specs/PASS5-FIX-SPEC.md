# PulseCity — Pass 5: window lights are missing + mood tap does not change the scene

**For:** Codex
**Date:** 24 Nov 2026

**Reviewed:** recording of 7:55 PM (21 s, simulator), frame-by-frame at 15–30 fps.

**Target:**
- Approved v2.3.
- `_reference/*.mp4` in `pulsecity-scene-assets-v2.1-window-lights.zip`.

Same rules as before:
- Keep the dirty tree. Do not reset, clean, commit or push.
- Keep the code cross-platform.
- Do not claim device results you did not measure.

---

## 1. Building window lights are gone (P0)

Evidence: `evidence/01_…`. On the left is v2.3 Social, on the right your build in Social.

- **Your build:** every building is dark. No window is lit, in any mood.
- **v2.3:** in Social, about 80 % of windows are lit (warm cream). In Chill, about 24 %.

**Diagnosis:** you switched `far`/`mid` to the new `*_unlit` layers, which is correct. But the **lights layers are not being drawn**, or they draw nothing. The user wants exactly these room lights, switching on and off with the mood.

**Do this in order, and report the result of each step:**

1. **Is the data image loaded?**
   - Temporarily draw `window-lights/preview/preview_mid_lights@3x.png` as a normal Skia `<Image>` at its layer position.
   - You should see a green-ish window pattern, because channel G is the window mask.
   - If you see nothing, the require path, the `useImage` call or the position is wrong.
2. **Does the shader compile?**
   - `Skia.RuntimeEffect.Make(SKSL)` returns `null` on a compile error and logs the reason. Assert that it is not null, and print the error.
3. **Force everything on.**
   - Set the uniforms `lit = 1.0`, `win = [1, 0.85, 0.6]`, `hazeAlpha = 0`.
   - Every window must glow. If it does not, the problem is in the shader wiring:
     - Uniform names must match exactly: `lit`, `win`, `haze`, `hazeAlpha`, `hazeTopPt`.
     - `float3` uniforms are passed as 3-element arrays, with values from 0 to 1, not 0 to 255.
     - The child shader `lights` must be the `ImageShader` placed as the only child of `<Shader>`.
     - The `ImageShader` rect must be `{x: 0, y: 0, width: sizePt.w, height: sizePt.h}`, in the same local space as the `<Rect>` you fill.
4. **Sampling must be nearest.**
   - Linear sampling mixes the high and low threshold bytes, so most windows fail the `t < lit` test.
   - Set nearest filtering and no mipmaps on the `ImageShader`. The prop name depends on your Skia version: `fm="nearest"` / `mm="none"` in older versions, `sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }}` in newer ones. Check the installed version and use the correct one.
5. **Real values.**
   - `lit`, `win`, `haze` and `hazeAlpha` come from each set's `<pre>_scene.json → palette`. Divide the colours by 255.
   - Social: `lit 0.80`. Chill: `lit 0.24`.
   - A static frame must now match the v2.0 baked look, because the add-on is verified to reconstruct it within 7/255.
6. **Layer order:** far unlit → **far lights** → (winter far caps) → mid unlit → **mid lights** → (winter mid caps) → beams → …
   - The lights rect uses the **same parallax translateX and cover scale** as its layer, and its **own `offsetYPt`** from `_export_window_lights.json`.

Reference shape for one lights layer. It has not been run in your project, so adapt the prop names to your Skia version:

```tsx
const LIGHTS_SKSL = `
uniform shader lights; uniform float lit; uniform float3 win; uniform float3 haze;
uniform float hazeAlpha; uniform float hazeTopPt;
half4 main(float2 xy){
  half4 d = lights.eval(xy); float g = d.g;
  if (g <= 0.0) return half4(0);
  float t = (floor(d.r*255.0+0.5)*256.0 + floor(d.b*255.0+0.5)) / 65535.0;
  if (t >= lit) return half4(0);
  float3 c = (xy.y >= hazeTopPt) ? mix(win, haze, hazeAlpha) : win;
  return half4(c*g, g);
}`;
const lightsEffect = Skia.RuntimeEffect.Make(LIGHTS_SKSL); // assert not null

function LightsLayer({ image, wPt, hPt, offsetYPt, translateX, scale, uniforms /* SharedValue or derived */ }) {
  return (
    <Group transform={[{ scale }]}>
      <Group transform={[{ translateX }, { translateY: offsetYPt }]}>
        <Rect x={0} y={0} width={wPt} height={hPt}>
          <Shader source={lightsEffect!} uniforms={uniforms}>
            <ImageShader image={image} fit="fill" rect={{ x: 0, y: 0, width: wPt, height: hPt }} /* + nearest sampling */ />
          </Shader>
        </Rect>
      </Group>
    </Group>
  );
}
// mid layer: hazeAlpha = 0, hazeTopPt = 1e9.  far layer: hazeTopPt from the README table, hazeAlpha = lerped palette.hazeA.
```

**Acceptance:**
- Social shows dense warm lit windows, as in `evidence/05_…`.
- Chill shows sparse lit windows.
- Tapping Chill → Social switches windows **on one by one over about 800 ms**. Social → Chill switches them off one by one.
- Compare with `_reference/v23_preview_chill_to_social_mood_change.mp4`.

---

## 2. Tapping a mood does not change the scene while the panel is on screen (P0, the "touch delay")

Evidence: `evidence/02_…`, `03_…`, `04_…`. The panel is fully visible and nothing is scrolling.

| Tap | Chip and label | Scene |
|---|---|---|
| Chill → Social | Chip white and label "SOCIAL" within 1 frame ✅ | **Still Chill teal 0.8 s later.** It only changes after the user scrolls. |
| Social → Nature | Instant ✅ | **Still Social pink** until the user scrolls |
| Nature → Social | Instant ✅ | **Still Nature green for 1.6 s and more**, with the panel fully on screen |

**Diagnosis:** the visibility-gated transition from pass 4 only starts on the *"became visible"* edge, which fires from scroll events. If the surface is **already visible** when the mood changes, no scroll event arrives, so the transition never starts. That is the delay the user feels.

**Fix:**
- Visibility is **state, not only an event.**
  - Measure each surface with `onLayout` / `measure` at mount.
  - Initialise `panelVisible` and `heroVisible` from the current scroll offset.
  - Update them in `useAnimatedScrollHandler`.
- **On a mood change, in the same handler that updates the chip:**
  - **If the surface is visible now,** start its transition immediately: `progress.value = 0; progress.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) })`, with lights `lit` and `win` lerped from the same progress.
  - **If it is not visible,** store it as pending, and start it on the first frame it becomes visible (pass 4 §2).
- Do this on the UI thread, or at least without waiting for re-renders. Target: **scene change starts ≤ 1 frame after the chip highlight.**
- Check the hero the same way. If the hero is partly on screen when the mood changes, it must start at once.

**Acceptance:**
- With the panel fully on screen and no scrolling, tap Chill → Social → Nature → Active about 1 s apart.
- Each tap starts the scene change (colour shift plus windows switching) **immediately**.
- Each change finishes in about 800 ms.
- No change waits for a scroll.

---

## 3. Report back

1. Results of steps 1–5 in §1. Include a screenshot of step 3 (all windows on).
2. One recording, ideally `--no-dev --minify`:
   - Panel on screen, tap Chill → Social → Chill → Nature with no scrolling.
   - Then change the mood and scroll up to the hero.
3. A side-by-side still: your Social panel against `evidence/05_…`.
