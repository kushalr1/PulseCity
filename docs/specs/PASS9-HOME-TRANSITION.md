# PulseCity — Pass 9: Home mood change is still an instant swap (measured at 60 fps)

**For:** Codex, ideally in a **fresh chat**. This file is self-contained.

## Context, in brief

- Repo: `/Users/kushalsharma/Desktop/PulseCity`, branch `feature/pulsecity-approved-video`.
- Keep the dirty tree. Do not reset, clean, commit or push.
- Scene surfaces are hero, preview (Home "This evening" panel) and full (City World). They are rendered in Skia with the v2.0 sets, the v2.1 `*_unlit` far/mid layers, and the v2.2 grey window-light data (`thr` / `cov`, `litCode` knots).
- A mood change runs **one progress `p`, 800 ms, easeInOutCubic**. From that same `p` per frame:
  - base set B opacity = `p`
  - `litCode = interp(lerp(litA, litB, p))`
  - `win`, `haze` and `hazeAlpha` lerped
- **City World already does this correctly** on device. Home does not.

## Measurement (recording of 3:03 PM)

I sampled the Home panel's sky colour on every frame at 60 fps:

| Change | Frames over which the sky changes | Duration |
|---|---|---|
| Chill → Social | 7.033 → 7.083 s | **3 frames (about 50 ms)** |
| Social → Nature | 10.150 s | **1 frame** |
| Nature → Active | 13.567 s | **1 frame** |
| Active → Nature | 15.517 → 15.533 s | **2 frames** |
| Nature → Foodie | 17.083 s | **1 frame** |

The target is **about 48 frames (800 ms)** of gradual change, as in City World and the approved recording.

So on Home, the change now starts at the right time, but **there is no blend at all**: the new set appears at full opacity almost immediately.

## What to find, using the logs

Run the app (`npx expo start`), keep the Home panel on screen, tap Chill → Social, and read the progress logger output for `surface=preview`:

- **No log lines at e = 0.25 / 0.5 / 0.75 for preview:** the Home surface is not running the timed progress. It is taking an immediate path. Check, in order:
  1. A **reduce-motion** or "static" flag that is true for Home surfaces only.
  2. The **visibility** flag. If preview is considered not visible, the code may apply the target instantly instead of keeping it pending. Log `visible` at tap time.
  3. A `duration: 0` or a missing `withTiming` on the Home call site.
  4. The "pending until visible" path applying `p = 1` directly when the surface becomes visible, instead of animating from 0.
- **Log lines show e going 0 → 1 over about 800 ms, but the screen swaps instantly:** the drawn opacity is not bound to `p`. For example, set B is rendered at opacity 1 and set A unmounted, or the Skia `opacity` prop receives a plain number captured once instead of the derived value.

**Fix it so Home uses literally the same call and the same component as City World.** Then add a unit or integration test that asserts, for the preview surface after a mood change with `visible = true`, that the B opacity at t = 400 ms is between 0.3 and 0.7.

## Acceptance

In a new recording, at 60 fps, each Home mood change must change gradually over **about 40–50 frames**, and the windows must switch during that blend.

**Paste the progress log lines for one Home change in your reply.**
