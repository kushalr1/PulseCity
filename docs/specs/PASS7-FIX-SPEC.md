# PulseCity — Pass 7: City World shows the previous mood; Home colour fade still late and out of sync

**For:** Codex
**Date:** 25 Nov 2026

**Device results reviewed (simulator):**

| Check | Result |
|---|---|
| `ramp` | Green, except the **last few columns are red** (`evidence/05`). Those are greys of about 247–255. |
| `DEBUG_ALL` | **Pass.** All windows lit on hero, preview and City World, and **no beige wash.** The v2.2 grey data works. ✅ |
| Normal recording, 12:44 PM, 72 s | Several problems, below |

**About the red ramp columns:** they are harmless for every mood. Window codes that can ever be lit are at most 204 (Social), no-window pixels have `cov = 0`, and coverage is at most 229. Still, log which columns are red, for example by printing `floor(v)` for x = 240…255 once. If the cause is the rect being wider than 256 local units, or clamping at the edge, fix it so the test is fully green.

Same rules as before:
- Keep the dirty tree. Do not reset, clean, commit or push.
- Keep the code cross-platform.
- Do not claim device results you did not see.

---

## 1. City World always renders the PREVIOUS mood (P0)

Evidence: `evidence/03`, `04`. The pill shows the new mood, but the scene shows the one before it, every time.

| Pill after the change | Scene actually shown |
|---|---|
| Chill | **Social** (pink sky, pink moon, dense windows) |
| Nature | **Chill** (slate) |
| Active | **Nature** (green, yellow sun) |
| Social | **Chill** (slate) |
| Chill | **Social** (pink) |

The scene stays like this for as long as I watched: more than 2 s.

**Likely cause:** the City World transition reads the target from stale state. Examples:
- A closure captured before the store update.
- `useEffect` comparing against a ref that is updated in the wrong order.
- `retarget()` using `prevMood` as the target.

**Fix:**
- The Mood sheet handler passes the **new mood value explicitly** to the surface's `startTransition(newMood)`.
- The target set and palette are looked up from that argument, never from component state read inside the same tick.

**Add a unit test:** for any sequence of mood selections on a surface, after the transition completes, the rendered set key equals the last selected mood.

## 2. Home: colour still starts late and jumps; lights run ahead (P0)

Evidence: `evidence/01` (Chill → Social) and `evidence/02` (Nature → Active). Times are from the chip turning white.

| | Target (v2.3) | Current |
|---|---|---|
| Lights start | 0 ms | about 300–400 ms ✗ |
| Colour starts | 0 ms, together with the lights | **about 500 ms**, then **jumps in about 100–200 ms** ✗ |
| Done | about 800 ms | about 500–700 ms, with no smooth fade ✗ |
| Windows during the change | They move only between the two moods' sets | **Nature → Active lights up a whole tower for about 0.4 s**, then it goes dark ✗ |

The lights and the colour are still on **different clocks**, and the colour cross-fade is not following the 800 ms progress.

**Fix, and prove it with logs:**

1. Log once per transition, from the UI thread (`console.log` through `runOnJS`, throttled), at progress 0, 0.25, 0.5, 0.75 and 1.0:
   `surface, fromKey, toKey, e, baseOpacityB, litCode, win`.
   - All values must come from the **same** progress frame.
   - At `e = 0.5`, `baseOpacityB` must be 0.5, and `litCode` must be `interp(lerp(litA, litB, 0.5))`.
2. The base set B opacity must be a Skia prop bound to a derived value of that same progress. It must not be a React state that changes when the transition ends.
3. **Wrong windows during Nature → Active:**
   - `litCode` must stay between `interp(litA)` and `interp(litB)`. For Nature → Active that is 31 → 26. A whole tower can only light if `litCode` jumps high, or if a **baked v2.0 `far`/`mid`** (with lit windows) is drawn for one of the two sets during the fade.
   - Check that **both A and B use the `*_unlit` far/mid** during the cross-fade.
   - Check that the retarget "from" snapshot never starts at `litCode = 255` or from a stale value.
4. Start the progress in the chip's `onPressIn` / `onPress`, in the same tick as the highlight. The press handler should not wait for any state, effect, image or layout.

## 3. City World mood transition (P1)

After §1:
- Changing the mood from the sheet must start the same single-progress transition as on Home: colour and lights together, 800 ms.
- The sheet closes at the same time. Compare with `_reference/v23_full_chill_to_social_mood_change.mp4` in the v2.1 package.

---

## 4. What I will check next

Send one normal-mode recording, `--no-dev --minify` if possible:

1. Home panel on screen, no scrolling: Chill → Social → Nature → Active → Chill, about 1.5 s apart.
2. Open City World, then use the Mood sheet: Social → Chill → Nature, about 2 s apart.
3. Paste the progress logs from §2.1 for one Home change and one City World change.

Targets:
- The colour and lights start in the same frame as the chip or sheet selection, and finish in about 800 ms.
- No tower flashes.
- City World always shows the mood on the pill.
