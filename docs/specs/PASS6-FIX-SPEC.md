# PulseCity — Pass 6: correct window lights (colour-safe data) + make mood change instant and in sync

**For:** Codex
**Date:** 25 Nov 2026

**Device results reviewed:**
- `red` test: **pass**. The z-order is fixed and the lights sit above `mid`, at the correct `offsetYPt`.
- `DEBUG_ALL`: windows light up, but there is a **beige wash** over the whole lights rectangle, on Home and in City World. See `evidence/04`, `05`.
- Normal-mode recording, 12:08 PM, 67 s:
  - Illustrations now show in the pick rows. ✅
  - Scroll smoothness is now close to the reference: 7 short freezes in 67 s, against 6 in 48 s for v2.3.
  - **Mood change is still slow, out of sync, and lights the wrong windows** (§2).

Same rules as before:
- Keep the dirty tree. Do not reset, clean, commit or push.
- Keep the code cross-platform.
- Do not claim device results you did not see.

---

## 1. Replace the v2.1 data images with v2.2 grey data (P0)

**Root cause of the wash and the wrong windows:** iOS Skia colour-manages images (sRGB → Display P3) when it samples them.
- The v2.1 data packs numbers into R, G and B.
- A no-window pixel, stored as (255, 0, 255), reads back as (234, **51**, 247). That gives 20 % coverage everywhere: the wash.
- The threshold bytes are shifted the same way, so the wrong windows switch on.

This was a flaw in my v2.1 encoding, not in your shader logic.

**Fix:** use `pulsecity-window-lights-v2.2-gray.zip`. Read its `README.md`.
- There are two **grey** images per layer: `_thr` (threshold code) and `_cov` (coverage). Greys survive sRGB↔P3 unchanged.
- Same sizes, `offsetYPt` and `hazeTopPt` as v2.1.
- The new shader takes two child shaders, `thr` and `cov`, plus the uniform `litCode`.
- `litCode = interp(lit, [0,.10,.12,.24,.38,.50,.58,.80,1], [0,26,31,61,97,128,148,204,255])`. This makes every mood's own lit state exact. Verified: 0 mismatched pixels.
- **Run the calibration self-test in the README once on device** (`calibration_ramp_256.png` → must be 100 % green). Add it as `EXPO_PUBLIC_LIGHTS_TEST=ramp` with a badge.
- Keep `DEBUG_ALL`. In v2.2 it means `litCode = 255`. Every window must be lit, with **no wash** anywhere outside the windows.
- Remove the v2.1 `*_lights@3x.png` requires. Keep the v2.1 `*_unlit` layers.

## 2. Mood change: start instantly, run lights and colour on one clock (P0)

Measured on the Home panel (`evidence/01`–`03`), times from the chip turning white:

| | Target (v2.3, `evidence/06_target…mp4`) | Current |
|---|---|---|
| Chip and picks | Same frame | Same frame ✅ |
| Lights start switching | Same frame | about 300–400 ms later |
| Colour (sky and buildings) starts changing | Same frame | **about 600–700 ms later** |
| Done | about 800 ms | **about 1.2–1.3 s** |
| Lights and colour in sync | Yes, one interpolation | **No.** Lights change first on the old colours, then the colour fades separately. |
| Correct windows | Yes | **No.** Nature → Active lit up a whole tower, because of the §1 data corruption. |

**Causes and fixes:**

1. **The colour fade waits for images to load.**
   - Skia `useImage()` decodes asynchronously, so a set's layers are only ready about 0.6 s after the mood changes.
   - **Pre-decode every Home set at startup:** hero and preview × 6 moods × the current theme. That is about 6 MB decoded per set, as in the v2.0 manifest memory notes.
   - Keep them in a module-level cache, a `Map<setKey, SkImage[]>` built with `Skia.Image.MakeImageFromEncoded(await Skia.Data.fromURI(uri))`, before the first mood tap is possible. Load the lights `thr`/`cov` images for hero and preview at the same time.
   - City World full sets: pre-decode the current mood on `onPressIn` of the buttons that open it. Pre-decode the other moods lazily after the screen opens.
   - Never start a transition with images that are not ready. Because everything is preloaded, none will be missing.
2. **One progress value drives everything.**
   - Each surface has a single Reanimated `progress` (`withTiming(1, {duration: 800, easing: Easing.inOut(Easing.cubic)})`).
   - **In the same `useDerivedValue`**, derive:
     - the base opacity of set B
     - `litCode = interp(lerp(litA, litB, e))`
     - `win`, `haze` and `hazeAlpha`
     - beams, glow and sprite opacities
   - Do not use a second timer, a JS `setState`, or a separate lights animation.
3. **Start in the chip's press handler.**
   - On `onPressIn` / `onPress`, set the mood in the store **and** call `progress.value = withTiming(...)` for every visible surface in the same tick.
   - Do not wait for a React re-render, an effect or an image-ready callback.
4. **Retarget correctly.**
   - If a new mood arrives during a transition, freeze the current blended palette values and the current base pair as the new "from", then animate to the new target from there.
   - Never jump, never restart from 0, never flash.

## 3. City World check (P1)

After §1, check the full surface in `DEBUG_ALL` and in normal mode.

**DEBUG_ALL:**
- No wash.
- Lamps, trees and railing visible at the bottom.

**Normal mode:**

| Mood | Expected windows |
|---|---|
| Social | Dense (about 80 %) |
| Foodie | About 58 % |
| Explore | About 38 % |
| Chill | About 24 % |
| Nature | About 12 % |
| Active | About 10 % |

Changing the mood from the Mood sheet must look like `_reference/v23_full_chill_to_social_mood_change.mp4` in the v2.1 package.

## 4. What I will check next (send these)

1. `EXPO_PUBLIC_LIGHTS_TEST=ramp`: screenshot of the calibration strip. It must be all green.
2. `EXPO_PUBLIC_WINDOW_LIGHTS_DEBUG_ALL=1`: Home card and City World. All windows lit, with no beige wash.
3. Normal mode recording, panel on screen, no scrolling: Chill → Social → Nature → Active → Chill, about 1.5 s apart. Then open City World and change the mood once there.

Targets:
- The colour and lights change starts in the same frame as the chip highlight.
- Done in about 800 ms.
- Windows switch on and off progressively, in sync with the colour change.
- No wrong windows.
