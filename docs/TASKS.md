# Implementation tasks and remaining work

Updated: 2026-11-26. Status reflects repo and recorded evidence; remaining work is explicit below.

## Task 1 — Bootstrap, fonts, readiness, map spike

**Status: Partial.** Expo SDK/dependencies, bundled Syne and Inter Tight, licensing, bootstrap readiness, safe-area, and hidden map spike route are present. OSM spike exported, but live tile rendering and pan/pinch were not verified in simulator or by user on iPhone.

**Remaining acceptance:** verify glyphs `₹`, `≈`, `·` visually on iOS and Android; verify inputs ≥16 pt and targets ≥44 pt on both; run `map-test` in Expo Go on physical iPhone and confirm OSM attribution, tiles, pan and pinch. Do not remove the hidden route until user confirms.

## Task 2 — Persisted state and demo session

**Status: Done, automated coverage present; physical restart/session review not fully evidenced in the latest audit.** AsyncStorage state covers saved places/events, saved-at/cache metadata, demo session, chosen area, appearance theme, and notification preferences. Hydration timeout uses defaults and late hydration must merge without writing empty fallback over stored saves.

**Acceptance:** cold start never hangs; verify saves/area/theme/demo session survive app restart; sign-out clears only session and preserves saved items; stale records show “No longer available” with remove action.

## Task 3 — Gurugram location and weather services

**Status: Partial.** Sector 29 default, area picker, on-demand location permission, outside-coverage “Coming soon”, fallback labels, and Open-Meteo cached weather service are in code. Owner later removed weather from all UI; service remains hidden.

**Acceptance:** test permission prompt only after tap, denied/unavailable fallback and outside-Gurugram flow on device; confirm distance estimate language. Confirm weather service cache/15-minute age and honest hidden state in tests; keep weather chip absent.

## Task 4 — Scene registry, Home artwork, appearance

**Status: Done; simulator Home evidence exists, but visual sign-off remains partial.** City/Winter art and theme switch, scene registry, asset preload, reduced-motion path, Home hero/preview, Appearance sheet, animation focus handling are present.

**Acceptance still open:** compare hero scale and preview/train against approved recording; check reload for white flash; verify both themes and reduced motion on physical iPhone.

## Task 5 — Home discovery composition and search handoff

**Status: Done; simulator flow recorded.** Approved eight-tile essentials, “This evening”, Nearby, events, Collections, mood inspiration, Gurugram data and one-tap Home search handoff are implemented. No cross-city fixtures, stock photos, invented ratings, or extra health tile.

**Acceptance still open:** recheck exact visual measurements and current header location icon against approved v2.3; ensure search opens Explore with keyboard ready on physical iPhone.

## Task 6 — Places, Explore search, query handoff

**Status: Done; automated tests and simulator flow evidence.** Search ranking and separate event group, past-event exclusion, query handoff, category reset, saved places/details, four Explore-only health categories, and six user-supplied coordinate-free verified hospitals are implemented.

**Acceptance:** recheck search/category/query flows and hospital list/directions on device; verify no hospital pins/km and no emergency guidance on health screens.

## Task 7 — Full City World and Surprise Me

**Status: Partial.** Full v2.0 mood/theme scenes, shared mood, 800 ms cross-fade/progressive window lights, camera pan/inertia, district selection, Winter content, Surprise candidate exclusion/timing, result card, and reduced-motion handling are implemented and covered by tests. Simulator recording contains Surprise search/result/skip and City World interactions. Opening handoff still has a dark frame; exact scene/train continuity and all Surprise timing/Try Again details are not signed off. Physical iPhone animated-scene review remains open.

**Acceptance criteria:** follow the remaining QA list below; record full flows with simulator; compare to approved v2.3 clips; then have user review animated scenes on physical iPhone. Confirm mood cross-fade remains 800 ms with progressive window switching and no remount.

## Task 8 — Map and camera behavior

**Status: Not started.** Current tab says “Map discovery arrives in a later PulseCity milestone.”

**Acceptance criteria:** OSM UrlTile with visible attribution; Gurugram real/fictional marker rules and hospital pin exclusion; free pan with no snap-back; “Search this area” only after user pan; category filter never moves camera; camera persists across tab switches; radius zoom fits at 10–16; Open in Map uses landmark 16 / area 14; pinch remains enabled; no rerender/camera movement mid-gesture; gesture-safe sheet; real landmark directions open system maps using correct query; fictional listings show no-real-address message. Cover pure zoom rules with automated tests. Verify gestures and map handoff on physical iPhone and Android.

## Task 9 — Events, notifications, profile, demo auth

**Status: Not started.** Events/Profile tabs are placeholders; Home bell has no working inbox.

**Acceptance criteria:** Events browsing/filtering and bookmarks use honest demo listings; profile supports guest and demo-signed-in states, appearance, notification settings, saved summary and sign-out; no real credentials stored/sent; sign-in persists to sign-out and sign-out preserves saves. Notifications inbox separates Updates from opt-in For you; request permission only on an action that needs it; schedule/cancel local reminders only for saved events. No fabricated event changes/cancellations.

## Task 10 — Integration and product acceptance

**Status: Partial / not accepted.** Simulator audit and automated checks exist, but listed visual differences and real-device review remain.

**Acceptance criteria:** every recording flow matches approved reference closely; no errors; all content/data-honesty rules pass; fonts/glyphs, reduced motion and tap/input sizes checked; run lint/typecheck/tests/Expo export; capture simulator recording and screenshots; user approves simulator result. Final map and animated-scene sign-off happens on a real iPhone.

## Remaining QA list

1. **Surprise Me:** compare search sweep, lock, result, Skip and Try Again timing/visuals to approved recording; capture a fresh recording.
2. **City World open/close:** verify slide-up and slide-down, Home scroll preservation, no blank/dark frame, and continuous preview-to-full train/scene handoff.
3. **Place detail push/back:** verify rightward push and Back return to same Home position.
4. **District sheet camera glide:** verify camera glides to selected district and selected/other beam strengths match spec.
5. **Map-pin location icon:** compare current header location icon with approved reference.
6. **Hero skyline scale:** compare same-sized simulator/reference frames.
7. **White flash on reload:** cold restart and record first frame; confirm no white flash.
8. Physical iPhone review: animated scenes and, after Task 8, map gestures.

The latest saved full simulator audit is `review-evidence/pass9-self-audit/final-self-audit.mov` (~112 sec). It is evidence, not a claim that every item above passed.

## Android follow-ups

- Verify Syne/Inter Tight weights and `₹`, `≈`, `·` glyphs render without system fallback.
- Verify all text inputs are ≥16 pt and touch targets ≥44 pt; `includeFontPadding: false` and vertical centering for mood chip labels.
- Mood-chip glow may use a larger blurred circle or be skipped if native shadow differs.
- Confirm `react-native-maps` OSM tile setup uses `mapType="none"`, native pan/pinch, visible attribution, correct z-order, and no map gesture interference.
- Directions should open Google Maps when installed, otherwise the Android system map handler; test real hospital `directionsQuery` only.
- Verify runtime notification permission timing and local reminder behavior on supported Android versions.
- Confirm app links/routes, Android back behavior, reduced-motion setting, and gesture back equivalent for City World/detail.
- Validate density-family illustration/scene loading and memory on a representative Android device; the supplied @3x scene set may require an @2x export if measured memory pressure occurs.
- The map spike finding only established package/Expo Go compatibility and route export; Android live tile/pan/pinch verification remains open.
