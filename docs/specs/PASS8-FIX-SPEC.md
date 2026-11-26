# PulseCity — Pass 8: Home mood transition must use the same path as City World

**For:** Codex
**Date:** 25 Nov 2026

**Reviewed:** recording of 1:31 PM (49 s), frame-by-frame at 10 fps.

**City World is now correct** (`evidence/03`):
- It shows the right mood. The off-by-one bug is fixed. ✅
- The colour and lights start as the sheet closes and blend smoothly over about 0.5–0.8 s.
- Windows switch progressively. ✅

**Home is still wrong** (the "This evening" panel, and the hero, which uses the same code):

| Change (Home panel, on screen, no scroll) | Chip highlight | Scene |
|---|---|---|
| Chill → Social (`evidence/01`, 0.3–1.0 s) | 0.4 s ✅ | Unchanged until 0.7 s, then a fast change by 1.0 s |
| Social → Nature (`evidence/01`, 2.0–2.5 s) | 2.1 s ✅ | Windows drop out on the **old pink colours** (2.1–2.4 s), then the colour **jumps to Nature in ONE frame** at 2.5 s |
| Active → Foodie (`evidence/02`) | 0.5 s ✅ | **Blue for 0.4 s, no progressive lights, then orange in ONE frame** at 0.9 s |

**Target:** `evidence/04`, the approved device recording. Colour and lights start within about 50 ms and blend together over the 800 ms curve.

So on Home:
1. Nothing visible happens for about 300–500 ms.
2. Then the base set is **swapped in a single frame**. There is no cross-fade.
3. The lights, where visible, run on the old colours before the swap.

City World does not do any of this.

## Likely cause

The Home scene does not go through the City World transition path. The pattern of a 300–500 ms delay followed by a one-frame swap usually means one of these:

- **The Home scene component remounts on mood change.** For example, a `key` that includes the mood or the set key, a parent that re-creates it when the picks list changes, or `useImage()` being called again with the new set's sources. The new canvas appears only once its images have decoded, which gives the delay, and it appears fully drawn, which gives the jump.
- Or the base opacity of set B on Home comes from React state that is set when the transition **ends**, instead of being bound to `progress`.

## Fix

1. **Use the exact same scene-transition hook and component as City World** for the Home preview panel and the hero. One implementation, three surfaces. Delete the separate Home path.
2. The scene component must **never remount** because of a mood change.
   - No mood or set key in its `key`.
   - It is mounted once per surface, and it is memoised so that picks and chips re-rendering does not re-create it.
   - Images come from the preloaded cache by set key. Do not call `useImage` per mood.
3. In the chip's press handler, call `startTransition(surface, newMood)` for the panel and the hero, passing the new mood explicitly, as you now do for City World.
4. If the hero is off screen, it keeps the pending target and starts the moment it becomes visible (Pass 4 §2).

## Prove it

Log the same per-frame values for **Home preview** and **City World** during one change each, at progress 0, 0.25, 0.5, 0.75 and 1:

```
surface, fromKey, toKey, e, baseOpacityB, litCode, win, mountId
```

- `mountId` is an id created once on mount. **It must not change** during or after a mood change.
- On Home, `baseOpacityB` must be 0.25 / 0.5 / 0.75 at those points, not 0 and then 1.

## Acceptance recording

Home panel on screen, no scrolling: Chill → Social → Nature → Active → Foodie, about 1.5 s apart.

For each change, at 10 fps:
- The colour starts changing within 1–2 frames of the chip highlight.
- There is a visible blend: old and new colours mixed for several frames.
- Windows switch on and off **during** the blend, not before it.
- Done in about 0.8 s.
- It looks like `evidence/04` and like City World (`evidence/03`).

Same rules as before:
- Keep the dirty tree. Do not reset, clean, commit or push.
- Do not claim device results you did not see.
