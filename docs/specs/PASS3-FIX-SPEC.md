# PulseCity — Pass 3 fix spec (Home panel, mood motion, smoothness)

**For:** Codex
**Date:** 24 Nov 2026

**Inputs compared:**

| | Recording | Device | Notes |
|---|---|---|---|
| **REFERENCE** (target) | 4:34 PM, 48 s | Real iPhone | Approved v2.3 prototype |
| **CURRENT** (your build) | 4:38 PM, 65 s | iPhone 16e simulator | Expo Go |
| **Exact sizes** | — | — | Measured from approved `pulsecity-v2.3.html` at a 390 pt viewport (DOM measurements, not guesses) |

**Method:**
- Frame-by-frame analysis at 30 fps, measuring the change between consecutive frames.
- Close-up strips of every transition, kept in `evidence/`.
- Side-by-side crops of the same screen.

The user reported five problems. Each one is confirmed below with measurements, then the exact fix is given.

The rules stay the same:
- Keep the dirty tree. Do not reset, clean, commit or push.
- Keep the code cross-platform.
- No weather chip, no 112 line, no Health tile on Home.
- Keep the demo labels.
- Do not claim device results you did not measure.

---

## 0. What is already right (do not regress)

- Home order: header → search → Everyday essentials → "This evening" panel → Nearby → events → Collections.
- The Home hero and preview use the mood sets from asset package v2.0.
- City World layout: single-line centred title, mood pill, headline at the top, gradient bottom, district chips, Surprise me and Real map.
- City World opens with **no black frames** (fixed since pass 2).
- The Mood sheet and the district sheet match v2.3.
- Mood taps update the picks list immediately.

---

## 1. "Too slow / laggy" (user issue 1)

### 1a. Mood change: delayed chip, then the scene flickers (P0)

Evidence: `03a_ref_mood_change.jpg` against `03b_current_mood_change_flicker.jpg`. Times are measured from the tap on "Nature".

| Time after tap | REFERENCE | CURRENT |
|---|---|---|
| 0 ms (same frame) | Chip turns white; picks change | Chip still unselected; picks change |
| 100–200 ms | Scene blend already visible (old + new mixed) | Chip turns white about 100–200 ms late. Scene still fully old (Social purple) |
| 350 ms | Blend continues | New scene **flashes on** (green), then **disappears again**, back to purple |
| 450–800 ms | Blend finishes at about 800 ms | Still purple |
| 900–1500 ms | Done | Slow fade to green; settles at about 1.4 s |

**Diagnosis:** the cross-fade starts, gets cancelled or restarted (probably an `onLoad` firing per layer, or a state reset on re-render), then runs again. The chip is waiting for the same render.

**Fix:**
1. **Chip state changes first, on its own.** Keep the selected mood in a lightweight store (Zustand, or a `useSyncExternalStore` atom). The chip row subscribes only to `mood`. On `onPressIn`, set a Reanimated shared value for the highlight, so the chip turns white **in the same frame**. Persist the mood to AsyncStorage *after* the UI update (`InteractionManager.runAfterInteractions`).
2. **One cross-fade controller per scene surface.** It is a small state machine:
   - States: `{ current: setKey, next: setKey | null, progress: SharedValue }`.
   - On mood change: if `next` is already set, **retarget** (the newest wins). Do **not** reset `progress` to 0 while a fade is running. Start a new fade from the current visual state.
   - Start the fade only when **all layers of `next`** have fired `onLoad`. Count them against `asset-manifest.json` → `sets[key].assets.length`. Use a ref counter, not state, so it does not re-render on every layer.
   - Fade: `progress.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.cubic) })`. On finish, use `runOnJS(commit)`: `current = next`, `next = null`, `progress = 0`, all in the same commit. Render order: current underneath, next on top with `opacity: progress`. Never unmount `current` before `next` reaches opacity 1.
   - Keep layer components keyed by set key, so React never remounts a set that is already on screen.
3. **Preload the mood sets so the fade can start immediately:**
   - At launch, after the first frame, prefetch `hero/<theme>/*` and `preview/<theme>/*` for all 6 moods with `expo-image` `Image.prefetch(..., 'memory-disk')`.
   - The reference starts its blend within about 100 ms. Yours must too.
4. **Reduce Motion on:** swap when `next` has loaded. Never show a blank frame or a flash.

**Acceptance:** chip highlight ≤ 16 ms after the tap. Blend visible ≤ 150 ms after the tap. Blend done at about 800–950 ms. Zero flashes.

### 1b. Scroll and gesture hitches (P1)

Measured freezes (motion stops for 1–8 frames while the finger is still moving):
- **REFERENCE:** 6 in 48 s.
- **CURRENT:** 14 in 65 s, at 10.2, 12.2, 14.1, 36.2, 37.2, 43.6, 43.9, 54.4, 55.2, 55.6 and 58.3 s.

Most of them happen while the Home panel scene or the hero is animating during scroll.

**Fix:**
- **All ambient scene animation runs on the UI thread** (Reanimated `useFrameCallback` or `withRepeat`): stars, beam pulse, train, drift. **No `setState` per frame.**
- **Pause ambient animation for any scene that is off screen.** Use the ScrollView `onScroll` handler with `useAnimatedScrollHandler` and the measured section y-positions, to compute `heroVisible` and `panelVisible` as shared values. This is also what drives the 1c behaviour below.
- Memoize Home sections with `React.memo` and stable props, so a mood change re-renders only the hero, the panel and the collections order.
- Use `expo-image` for all scene layers and place thumbnails, with `recyclingKey` on list items and `cachePolicy="memory-disk"`.
- Do not animate `width`, `height`, `top` or `left`. Animate `opacity` and `transform` only.

### 1c. Measure properly (P1)

The reference is a real iPhone. Your recording is the simulator in Expo Go dev mode, which is slower.

1. For the next recording, use `npx expo start --no-dev --minify`.
2. If possible, record on the user's real iPhone with Expo Go.
3. Turn on the Perf Monitor and report UI and JS FPS for:
   - mood change
   - Home scroll
   - City World open and close
   - City World drag

Targets:
- UI ≥ 55 fps.
- JS ≥ 50 fps during scroll.
- No blank frames.

---

## 2. "Not able to scroll the list of places in the city preview" (user issue 2)

Evidence: `01_panel_ref_vs_current.jpg` and `07_current_picks_not_scrollable.jpg`.

**CURRENT:**
- The picks area inside the panel has a **fixed height**. Only about 2 rows fit and the 3rd is cut off.
- Dragging on it moves the whole page, with stutter. The list never scrolls.
- The rows are far too tall (about 105–115 pt) because of 82 pt thumbnails and an extra "Demo listing" line.

**REFERENCE:** there is **no inner scroll.** All **3 rows are fully visible**, and the panel grows to fit them.

**Fix:**
- Remove the fixed height and any nested ScrollView or FlatList from the picks. Render the up-to-3 rows as plain `View`s.
- Size the panel by its content, using the exact sizes in section 4.
- If a mood has fewer than 3 picks, the panel is shorter. If it has none, show the honest empty state from the design doc, in the same panel style.
- **See all** for more picks lives in the Nearby / Explore flow. The panel never scrolls internally.

---

## 3. Mood chip alignment (user issue 3)

Evidence: `02_mood_chips_ref_top_current_bottom.jpg`. The top half is the reference, the bottom half is the current build.

**CURRENT:**
- The dot and the label sit at the **top** of the chip, not centred.
- The dot has no glow.
- The selected chip looks taller than the others.

**Exact v2.3 chip:**

| Property | Value |
|---|---|
| Row | horizontal ScrollView, `contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}`, `showsHorizontalScrollIndicator={false}` |
| Chip | `height: 40`, `paddingLeft: 10`, `paddingRight: 14`, `borderRadius: 999`, `flexDirection: 'row'`, **`alignItems: 'center'`**, `gap: 7` |
| Unselected | background `rgba(255,255,255,0.08)`, 1 pt inner border `rgba(255,255,255,0.14)`, text `rgba(255,255,255,0.85)` |
| Selected | background `#FFFFFF`, no border, text `#07101A` |
| Dot | 10 × 10, radius 5, mood colour, **glow**: `shadowColor` = mood colour, `shadowRadius 5`, `shadowOpacity 1`, `shadowOffset 0`. On Android, use a slightly larger blurred circle behind it, or skip the glow. |
| Label | Inter Tight SemiBold, 13.5 pt, `lineHeight: 18`. Set `includeFontPadding: false` and `textAlignVertical: 'center'` on Android. |
| Order | Chill, Social, Nature, Active, Foodie, Explore |
| Colours | Chill `#8FE3D0`, Social `#FF7DB0`, Nature `#CFF27F`, Active `#8FD3FF`, Foodie `#FFC46A`, Explore `#C3A8FF` |
| Press | scale 0.95 while pressed (Reanimated) |

Every chip has the same height, selected or not. Do not change padding or border width when a chip is selected, because that shifts the layout.

---

## 4. Exact card length and spacing (user issue 4)

Measured from v2.3 at a 390 pt viewport with mood Chill and 3 picks. Evidence: `08_approved_panel_390pt.png`.

**Panel ("This evening" card):**

| Part | Value |
|---|---|
| Outer | x 16 → **width 358**, **height 581.5** with 3 picks, radius **24**, background `#07101A`, overflow hidden |
| Gap above (Everyday essentials grid bottom → panel top) | **28** |
| Gap below (panel bottom → "Nearby" header top) | **30** |
| **Scene** | height **208**. Preview set, cover-scaled, anchored bottom-left. |
| Overline | "LATER TODAY · CHILL": left 18, top 16, Inter Tight 12 / 650, letter-spacing about 1.2, `rgba(255,255,255,0.75)` |
| Title | "This evening": 6 below the overline, **Syne Bold 23**, line height 24, letter-spacing −0.46, white, text shadow `0 1 16 rgba(0,0,0,0.35)` |
| District pills | 34 high, inside the scene. Only districts with mood matches. No overlaps. |
| **Body** | padding top **14**, bottom **14** |
| Mood chip row | 40 high (section 3) |
| Picks block | padding top **6**, left/right **16**. **3 rows × about 70 = 212** (total 218). |
| Pick row | grid `52 | flex | 40`, column gap **12**, padding vertical **9**, `alignItems: center`. Divider `1 px rgba(255,255,255,0.10)` above every row except the first. |
| Thumbnail | **52 × 52**, radius **12**. **The place's own illustration**, the same art the place detail page uses. Not a generic category icon on a brown square. |
| Name | Inter Tight Bold 15, line height 21, white, one line, ellipsis |
| Meta | 2 below the name. Inter Tight 12.5, line height 17.5, `rgba(255,255,255,0.72)`, one line, ellipsis. Format: `Category · Area · ≈ distance[ · ₹…]` |
| No third line | Remove "Demo listing" from the panel rows. The demo status stays on the place detail page and in the global "Demo data" badge, as in v2.3. |
| Bookmark | **40 × 40**, radius 12, background `rgba(255,255,255,0.08)`, icon 20 white. When saved, the icon is filled `#8FE3D0`. |
| Buttons row | padding top **14**, left/right **16**, gap **8**, two equal buttons, **height 46**, radius **14** |
| Surprise me | background `#8FE3D0`, text `#07101A`, Inter Tight 15 / 650, spark icon 18 on the left |
| Explore the city | background `rgba(255,255,255,0.12)`, 1 pt inner border `rgba(255,255,255,0.18)`, white text, chevron-right on the right |
| Caption | "Pick a district. Discover what's happening.": **10** below the buttons, Inter Tight 12.5, line height 17.5, `rgba(255,255,255,0.70)`, centred |

**Check the total:** 208 + 14 + 40 + 218 + 60 + 10 + 17.5 + 14 = **581.5**.

**Other Home sizes from the same measurement, for consistency:**

| Element | Value |
|---|---|
| Hero | height 196 + safe-area top |
| Greeting | Syne Bold 28 at safe-top + 64, left 20 |
| Location button | radius 14, padding 6 / 10 / 6 / 6, **map-pin icon**. Your build still shows a different icon. |
| Header icon buttons | 44 × 44, radius 14, `rgba(7,16,26,0.38)` |
| Search | 358 × 54, radius 16, overlaps the hero bottom by 27 |
| "Everyday essentials" header | 22 below the search |
| Essentials grid | 4 columns, gap 14 vertical and 6 horizontal, side padding 14 |
| Essential tile icon box | 56 × 56, radius 18, white with a 9 % tone tint, 1 pt line border, shadow `sh-1`. Icon 24. Label 12 / 600. |
| Nearby row | 64 high, icon box 44 / radius 14 |

---

## 5. Header (hero) background must change smoothly when you scroll back up (user issue 5)

Evidence: `04a_ref_hero_crossfade_on_scroll.jpg` against `04b_current_hero_no_crossfade.jpg`.

**REFERENCE behaviour:**
1. The user changes the mood in the panel while the hero is **off screen**.
2. When the user scrolls up and the hero enters the viewport, it still shows the **previous** mood (Social purple).
3. Then it **cross-fades** to the new mood (Nature green) **while visible**.
4. The fade runs from about 0.5 s to 1.0 s after the hero appears: about 500–800 ms, easeInOutCubic.
5. This is what the user wants to see.

**CURRENT:** the hero swapped while off screen, so on scroll-up it is already the new mood. There is no visible transition.

**Fix: a visibility-gated cross-fade, applied to both scene surfaces (hero and panel).**
- Each surface knows `visible`, from the animated scroll handler and its measured y-range (section 1b).
- On mood change:
  - **If visible:** cross-fade now (section 1a).
  - **If not visible:** set `pendingKey = newSetKey`, preload it, and **keep showing the old set**.
- When `visible` becomes true and `pendingKey` is set, wait **150 ms**, then cross-fade `old → pending` over **800 ms** (easeInOutCubic). The user then sees the change.
- Several mood changes while off screen: only the latest `pendingKey` counts.
- Reduce Motion: swap instantly when it becomes visible.
- The greeting text and header controls never fade. Only the scene layers do.

---

## 6. Navigation motion must match the reference (P1)

| Action | REFERENCE | CURRENT | Fix |
|---|---|---|---|
| Open City World (Explore the city / pill) | **Slides up from the bottom** over Home, about 450–500 ms, iOS spring/ease-out. The scene is fully drawn from the first frame. | Cross-dissolve, about 150 ms | Use a full-screen modal with `animation: 'slide_from_bottom'` (Expo Router / native-stack `presentation: 'fullScreenModal'`). Keep the scene preloading from pass 2. |
| Close City World (✕) | **Slides down**, about 200–250 ms. Home underneath is unchanged and keeps its scroll position. | Cross-dissolve, about 150–250 ms | Same modal, native dismiss. Do not re-render or remount Home on dismiss. |
| Open place detail (tap a pick row) | **Push from the right**, about 150–200 ms | not recorded | Native stack push (`animation: 'default'` on iOS) |
| Back from detail | Slides out to the right, about 200 ms. Home keeps its scroll, mood and panel state. | not recorded | Native back. Swipe-back gesture enabled. |
| Tab bar | Visible on Home and detail. Hidden in City World. | OK | — |

---

## 7. City World details still different (P2)

Evidence: `09_cityworld_approved_vs_current.jpg`.

- **Initial camera:** in v2.3 the Cyber City pill is centred-left (about x 210 of 390), with the tall Cyber City towers centred below it. In your build the camera sits further right, and the tall towers are off centre. Use `camForDistrict("cyber") = 409.5 pt` from `motion-spec.json → fullScreen.camera.initial`.
- **Bottom spacing:** your chips and buttons sit noticeably higher than in v2.3, and your buttons are about 52 pt tall instead of 46. Together these hide the foreground layer (lamps, trees, railing). In v2.3 the bottom block has 16 pt top padding, the chips row is 48 high, there is a 12 pt gap, the buttons are 46 high, and there is 28 pt bottom padding plus the safe area. Use the 46 pt button height, not 52.
- Keep the gradient from transparent to rgba(7,16,26,0.85) at 40 %.

## 8. Small items (P2)

- **Place illustrations:** pick-row thumbnails and the detail hero must use the per-place illustration, as in the reference: a market stall for Galleria Market, a café interior for Kettle & Kulhad, a park scene for Leisure Valley Park. Never a generic category glyph. If these illustrations are not in the RN app yet, **ask the user**: they can be exported from v2.3 as PNGs.
- **Reload flash:** after a dev reload the recording shows about 2 s of white, then black, before Home. Set the splash `backgroundColor` to `#07101A`, and keep the splash up until fonts and the first hero set have loaded (`SplashScreen.preventAutoHideAsync` / `hideAsync`). There must be no white flash in a release build.
- The blue ⚙ button is the Expo Go dev-tools button, not app UI.

---

## 9. Acceptance recording (send this next)

Record with `--no-dev --minify`, on the real iPhone if possible, otherwise the simulator. Show:

1. Home: scroll to the panel. All 3 pick rows are fully visible and the panel is 581.5 pt tall. Show it on screen for 2 s.
2. Tap Social, then Nature, then Active. The chip responds instantly. The blend starts ≤ 150 ms after each tap. No flash.
3. Scroll up to the hero. The hero cross-fades from the previously shown mood to Active while visible.
4. Tap Explore the city. City World slides up. Drag it. Tap a district chip. Close with ✕: it slides down to the same scroll position.
5. Tap a pick row. The detail pushes from the right. Go back.
6. Report the Perf Monitor UI and JS FPS for steps 2–5.
7. Add a side-by-side screenshot of the panel against `08_approved_panel_390pt.png`.

Priority order: **§1a, §2, §3, §4** (P0) → **§5, §1b, §6** (P1) → **§7, §8** (P2).
