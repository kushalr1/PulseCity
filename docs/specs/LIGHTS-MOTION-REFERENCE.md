# Window lights: exact motion target (measured from the approved v2.3 device recording, 12:46 PM, 60 fps)

**For:** Codex. This is an addendum to Pass 7.

The user wants the room lights to switch exactly like this. These measurements come from the user's own recording of approved v2.3, and they match `scene.js`.

## What happens on a mood change

1. **It starts immediately.**
   - On Home, the sky colour starts moving within **about 50 ms** of the chip press. In the recording, the chip is pressed at 8.00 s and the sky starts changing at 8.05 s.
   - In City World, it starts in the **same frame the Mood sheet closes** (sheet gone at 25.67 s, colour moving at 25.70 s).
2. **There is one smooth curve: 800 ms, easeInOutCubic.** The change is slow at first, fast in the middle and slow at the end.
   - Home, Social → Nature, measured on the sky: 8.05 s start → 8.30 s midpoint → 8.60 s visually done.
   - City World, Active → Foodie: 28.13 s → 28.45 s → 28.77 s.
3. **Lights and colour change TOGETHER, on that same curve.** The windows do not change first and then the colour, or the other way round.
4. **Each window switches individually: an instant on or off, not a fade.** Windows flip in a **scattered, random-looking order**, so the city appears to switch its lights on or off progressively:
   - Few windows change at the start of the curve.
   - Most change in the middle (about 0.25–0.5 s).
   - The last few change near the end.
   - The glass-tower stripes flip line by line in the same way.
   - **Strips:** `approved_home_social_to_nature_20fps.jpg` (lights switching OFF) and `approved_cityworld_active_to_foodie_20fps.jpg` (lights switching ON).
5. **The lit window colour also shifts** along the curve, from the old mood's `win` colour to the new one. Lights that stay on change tint smoothly.
6. Beams, moon or sun, glows and sky all move on the same curve.

## How your implementation produces exactly this

This is the v2.2 shader. Nothing new is needed; it only has to be driven correctly:

- **One** progress value `p`: `withTiming(1, {duration: 800, easing: Easing.inOut(Easing.cubic)})`, started in the press / select handler.
- Per frame, from that same `p`:
  - `litCode = interp(lerp(litA, litB, p))`. Each window's own threshold makes it flip at its own moment, which gives the scattered order.
  - `win = lerp(winA, winB, p)`.
  - Base set B opacity = `p`.
- **Do not** fade window alpha with `p`. Do not use a separate lights timer. Do not ease twice: `p` is already eased.

## Quick self-check against the strips

- Social → Nature (`litCode` 204 → 31) on Home: at about **+0.25 s** roughly half the stripes are gone, and at **+0.55 s** only Nature's sparse windows remain.
- Active → Foodie (26 → 148) in City World: a few windows at **+0.25 s**, most at **+0.45 s**, and complete by about **+0.6 s**.
