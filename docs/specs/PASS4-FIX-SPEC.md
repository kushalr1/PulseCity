# PulseCity — Pass 4 fix spec: window-light mood transition + hero delay

**For:** Codex
**Date:** 24 Nov 2026

**Inputs:**
- **CURRENT:** your build, recording of 5:56 PM (25 s, iPhone 16e simulator).
- **REFERENCE:** the approved v2.3 recording (4:34 PM, real iPhone) and the v2.3 source (`scene.js`).
- **New assets:** `pulsecity-scene-assets-v2.1-window-lights.zip`. Read its `README.md` first.

The user reported two problems. Both are confirmed below with measurements.

Same rules as before:
- Keep the dirty tree. Do not reset, clean, commit or push.
- Keep the code cross-platform.
- Do not claim device results you did not measure.

---

## 1. Building lights must switch on and off smoothly on a mood change (P0)

### What v2.3 does

From the source, `scene.js → retarget() / step() / renderLayers()`:
- A mood change interpolates the **whole palette** over **800 ms, easeInOutCubic**: sky, ridge, far, mid, near, haze, window colour, beams, glow, and **`lit`**, the fraction of lit windows.
- Every window has a fixed threshold. It is on while `threshold < lit`.
- So when `lit` rises (Chill 0.24 → Social 0.80), windows **switch on one after another in a scattered order** while the colours shift. When it falls, they switch off one by one.

This is what the user sees in the approved video. Reference clips:
- `_reference/v23_preview_chill_to_social_mood_change.mp4` and `v23_full_chill_to_social_mood_change.mp4` in the asset zip
- Strips in `evidence/02_…` and `evidence/03_…`

### What the current build does

Evidence: `evidence/01_current_panel_mood_change_plain_crossfade_late.jpg`.

- The panel **cross-fades two baked pictures**. Windows dim from one image into the other. **No window switches on.**
- The fade also starts **about 500–600 ms after** the label has already changed to "LATER TODAY · SOCIAL". The scene stays on Chill until about 0.6 s, then fades by about 1.0 s.

### Why you cannot fix it with the v2.0 assets alone

v2.0 bakes the lit windows into each mood's `far`/`mid` PNG. Any cross-fade of two such PNGs gives the current look.

### The fix: use asset add-on v2.1 (window lights)

What the add-on contains:
- `*_far_unlit` / `*_mid_unlit` for all 36 sets. These **replace** the v2.0 `far`/`mid` layers. They are the same size and offset, with windows off.
- `window-lights/<surface>/*_far_lights`, `*_mid_lights`: 16-bit per-window threshold plus alpha data images. They are mood-independent.
- It is verified against the real v2.3 renderer. Static sets reconstruct within max 7/255. Mid-transition frames have a mean error ≤ 1.1/255.

Implementation:
1. **Render each scene surface (hero, preview, full) in one `@shopify/react-native-skia` `<Canvas>`.** Skia is in Expo Go. Put all v2.0 layers in it as Skia `<Image>`s, using the same positions, parallax, cover scale and opacities you have now. Swap `far`/`mid` for the `_unlit` files.
2. Add **two lights layers** directly above `far` and above `mid`. Each is a `<Rect>` filled by the `RuntimeEffect` in the add-on README:
   - The child is an `ImageShader` of the data image with **nearest** sampling.
   - Its local coordinates are the data image's pt space. It uses its own `offsetYPt`, and the same parallax translation and cover scale as its layer.
3. **Mood transition = one Reanimated progress value** `p: 0 → 1`, `withTiming(1, {duration: 800, easing: Easing.inOut(Easing.cubic)})`. Then `e = p` (the easing is already applied), and per frame, with `useDerivedValue` on the UI thread:
   - Base layers: draw set A, then set B on top with `opacity = e`. This is the same cross-fade as before, but with the unlit far/mid.
   - Uniforms:
     - `lit = lerp(litA, litB, e)`
     - `win = lerp(winA, winB, e)`
     - far only: `haze = lerp(hazeA, hazeB, e)` and `hazeAlpha = lerp(hazeAa, hazeAb, e)`
   - All palette values come from each set's v2.0 `<pre>_scene.json → palette`. Divide the colours by 255.
4. **Retarget, never restart.** If the mood changes during a transition:
   - Snapshot the current blended state as the new "from". Snapshot `lit`, `win`, `haze` and `hazeAlpha` too. For the base layers, keep A, B and `e` frozen as the "from" composite.
   - Start a new 800 ms progress toward the new mood. A simple, acceptable version: let the running fade finish into its target, then immediately start the next one from there, with the latest mood winning. **There must be no jump, no flash and no restart from 0.**
5. Theme change (City ↔ Winter) uses the same mechanism. Winter `lit` is 0.5 for every mood, so moving between winter moods only shifts colours. That matches v2.3.
6. **Reduce Motion on:** jump to `e = 1`, as v2.3 does.
7. The beams, moon glow, train windows and lamp glows are in the per-mood sprites. Cross-fade them with the same `e`, as now.

Memory:
- The hero and preview data images are 1.6–2 MB decoded each.
- The full-screen data images are 6.7 MB (far) and 11 MB (mid). Load the full ones only while City World is open, and release them on close.

**Acceptance:**
- Record Chill → Social and Social → Chill on the Home panel, the hero and City World.
- Put them next to the reference `.mp4` clips.
- Windows must visibly switch on and off one by one over about 0.8 s, with the colour shift at the same time.
- The transition must start in the same frame as the chip highlight.

---

## 2. The header (hero) takes too long to change mood after scrolling up (P0)

Measured from the moment the hero scene first appears on screen during the scroll-up:

| | REFERENCE (v2.3, real iPhone) | CURRENT |
|---|---|---|
| Hero first visible | t = 0 | t = 0 |
| Fade starts | **about 0–100 ms**, while still scrolling | **about 600 ms**, only after the scroll has settled |
| Fade visually done | about 500–600 ms | about 1.0–1.2 s |

Evidence:
- `evidence/04a_ref_hero_fade_starts_on_appear.jpg` (reference)
- `evidence/04b_current_hero_fade_starts_600ms_late.jpg` (current). Visible at 0.2 s, still purple until 0.8 s, green by 1.1 s.
- `evidence/04c_current_hero_second_case.jpg`: the same delay for Nature → Active.

**Cause (likely):**
- Visibility is detected after the scroll ends (`onScrollEndDrag`, `onMomentumScrollEnd` or a JS timer).
- On top of that, the 150 ms wait from my pass 3 spec is added. **That 150 ms was my mistake: remove it.**
- v2.3 starts the fade on the first frame the hero is visible, because its animation loop resumes as soon as the canvas intersects the viewport.

**Fix:**
- Compute visibility **on the UI thread inside `useAnimatedScrollHandler` on every scroll event**: `heroVisible = scrollY < heroBottomY`, meaning at least 1 pt of the hero scene is on screen. Do the same for the panel with its measured y-range.
- In the same worklet, if a pending mood exists and the surface just became visible, start the progress `withTiming` immediately. **No delay, no scroll-end wait, no `runOnJS` round-trip.**
- While the surface is not visible, keep `p` paused, as v2.3 does. It resumes the moment it is visible. This is also why the user sees the change happen.
- Pending changes: only the newest target counts. The start state is whatever is currently on screen, including a half-finished blend.
- The same rule applies to the Home panel when the mood is changed with its own chips. The panel is visible then, so the transition starts in the same frame as the chip highlight. Your current build waits about 500 ms there too (section 1).

**Acceptance:**
- Change the mood with the panel chips, then scroll up fast.
- The hero must already be blending while the scroll is still moving.
- The fade must start ≤ 100 ms after the hero appears and be visually done by about 600 ms.

---

## 3. Report back

1. The side-by-side recordings from §1 and §2, on the same device and in the same mode as the previous pass. Record with `--no-dev --minify` if possible.
2. Perf Monitor UI and JS FPS during a mood change and during a fast scroll-up. Target: UI ≥ 55 fps.
3. Any place where the Skia version differs from the v2.0 image version you had: positions, parallax, cover scale. Compare one still frame per surface against the v2.0 `_reference` frames before you replace anything.

Priority: §1 and §2 are both P0. Do §2 first, because it is small, then §1.
