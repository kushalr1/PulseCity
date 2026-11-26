# PulseCity Approved Video App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend current Expo app into approved PulseCity demo experience, matching recordings and agreed behavior.

**Architecture:** Preserve Expo Router and feature-based Clean Architecture. Add focused domain/application/presentation areas and repository adapters; keep route files thin. Treat visual scene assets, location, weather, persistence, and map camera as replaceable feature services with clear interfaces.

**Tech Stack:** Expo SDK 58, React Native 0.88, Expo Router, Reanimated 4, `react-native-maps`, OpenStreetMap `UrlTile`, AsyncStorage, Expo location/notifications/font, Open-Meteo, `@expo-google-fonts/syne`, `@expo-google-fonts/inter-tight`, Jest.

**Spec:** `docs/superpowers/specs/2026-11-23-pulsecity-approved-video-design.md`

## Global Constraints

- Keep current feature-based architecture and preserve existing Saved, Place Details, and save/unsave behavior.
- Demo starts at Sector 29, Gurugram; no launch location prompt; location prompt only follows **Use my location**.
- No credentials sent or stored; browsing never requires sign-in; sign-in state persists until sign-out; sign-out keeps saves.
- Load saved places/events and demo session before first screen draw. Persist versioned IDs, saved date, and cached display metadata.
- Weather comes from Open-Meteo, cached 15 minutes; never display fabricated current temperature.
- Use OSM demo tiles with visible attribution; do not prefetch or cache tiles.
- Map pans freely; no Sector 29 snap-back; **Search this area** follows user pan only; category changes do not move camera; camera persists across tabs.
- Radius view fits zoom levels 10–16; **Open in Map** uses zoom 16 for landmark and 14 for area.
- Keep pinch zoom enabled. Prevent app-driven map updates during gesture; sheet must not intercept map gestures.
- Every text input is at least 16 pt; every tap target at least 44 pt.
- Storage hydration failure never blocks startup: log error, then start with Sector 29 and empty saves.
- After a hydration timeout, do not write fallback state. Hold edits in memory until the real read resolves, then merge stored saves with in-session saves before writing. If the read fails, keep changes in memory and do not overwrite unknown storage.
- Verify `₹`, `≈`, and `·` glyph coverage. Render all three with Inter Tight; never allow silent system fallback.
- Home search focuses Explore input and opens keyboard on same tap. Carry query Explore ⇄ Map; category shortcuts clear query.
- Mood affects Home inspiration and City World only; never filters Search, Explore, Map, or essentials.
- Search returns places/services first, then up to 2–3 matching upcoming events in separate group.
- Bundle Syne and Inter Tight via approved Expo Google Fonts packages, include SIL OFL 1.1 notices, and use no system fallback.
- Integrate scene package v1.2 now. Design asset selection for future six-mood × two-theme hero/preview, full-screen City World, Surprise Me, and cross-fade package without architecture change.
- Home hero never renders metro or train. Preserve reduced-motion and off-screen pause behavior.
- Keep all sample listings and event records labelled demo. Do not invent weather, ratings, addresses, event changes, or other facts.
- Preserve dirty working tree. Do not reset, clean, commit, or push.
- Work on `feature/pulsecity-approved-video`; keep existing uncommitted changes intact.
- Stop for product review after Tasks 1–3, then after every later task. Each report includes changes, checks run, untested areas, and simulator screenshot.
- Add automated pure-logic tests for search ranking/event grouping, past-event exclusion, distance labels, storage schema/unavailable saves, map zoom clamps, and weather cache/age.

## Review Focus

- Location denied, unavailable, or outside Gurugram; retain chosen area, label estimates, and show Coming soon outside coverage.
- Storage hydration rejection; startup uses safe defaults and logs the error without hanging.
- Offline/expired storage and removed demo records; show saved cached details, age for weather, and explicit unavailable item state.
- Search with event-only matches, past-event matches, and query carried between Explore and Map.
- Map gestures while changing filters/sheets, tab switches, and repeated pan; camera must remain stable and native pinch must work.
- Reduced motion, screen blur, and theme/mood asset gaps before expanded package arrives; keep still state and never fabricate scene art.
- Missing font glyphs or weights; verify rupee, approximate, and middle-dot render from Inter Tight with no system fallback.

---

## File map

- `src/app/_layout.tsx`, `src/app/(tabs)/*.tsx`: thin providers and route composition for approved flows.
- `src/features/home/`: Home composition, scene registry, theme selection, City World entry points.
- `src/features/places/`: place data, Explore, Nearby, Saved and details.
- `src/features/map/`: map screen, camera state, markers, OSM tiles, directions.
- `src/features/events/`: event domain, filters, cards and persistence hooks.
- `src/features/location/`: selected area, permission, coverage, and distance labels.
- `src/features/weather/`: Open-Meteo client and cache.
- `src/features/account/`, `src/features/profile/`, `src/features/notifications/`: demo session, profile, appearance, inbox and reminders.
- `src/providers/`: app bootstrap hydration and shared repositories.
- `src/shared/design-system/`, `src/constants/theme.ts`: font and sizing tokens.
- `assets/`: scene assets, fonts, and license notices.
- Add feature files only when their task starts; retain existing naming conventions discovered in the current source.

### Task 1: Bootstrap dependencies, fonts, and app readiness

**Files:** `package.json`, lockfile, `app.json` or `app.config.*`, `src/app/_layout.tsx`, `src/shared/design-system/tokens.ts`, `src/constants/theme.ts`, `assets/fonts/`, `assets/licenses/`

- Install Expo-compatible AsyncStorage, location, notifications, maps, and Google Font packages with `npx expo install`; do not upgrade unrelated dependencies.
- Verify Syne and Inter Tight SIL OFL 1.1 files and package-provided weights. Bundle needed weights and license notices.
- Inspect selected Inter Tight font files for `₹` (U+20B9), `≈` (U+2248), and `·` (U+00B7). Use Inter Tight for these glyphs and all app text; no system fallback. Confirm rendered output on iOS and Android.
- Add font tokens and block first screen presentation until bundled fonts and persistence hydration finish. Use app fonts on every app text style; no system fallback.
- Set shared input text minimum to 16 pt and interactive target minimum to 44 pt.
- Preserve existing Reanimated configuration and support Metro family-path static image requires.
- Check Expo SDK 58 configuration for native module setup; document any required development build.
- **Automated check:** add `tests/app-bootstrap.behavior.test.tsx` covering storage hydration rejection resolving to Sector 29 and empty saved collections while recording the error.
- **Manual check:** app launches on iPhone 16e simulator with both font families visible, verified glyphs, and no unstyled/system-font flash.

### Map spike: OSM tile and native-build feasibility

**Timing:** Immediately after Task 1, before Home implementation.

**Files:** isolated temporary spike under `src/features/map/` or `scripts/`; retain only production-ready findings/configuration.

- Mount minimal `react-native-maps` screen with OSM `UrlTile`; confirm attribution, free pan, and pinch.
- Check Expo Go support versus development-build requirement for Expo SDK 58 and selected `react-native-maps` package. Do not assume Expo Go support.
- Report setup, device/simulator result, tile behavior, gesture behavior, and any build constraint before continuing Home work.
- **Manual check:** launch spike on iPhone 16e simulator and capture screenshot. If required dev build is unavailable, report blocker without claiming pass.

**Spike result (2026-11-23):** `react-native-maps@1.29.11` matches Expo SDK 58 and Expo documents it as included in Expo Go. A temporary `MapView` + `UrlTile` route exported successfully for iOS. The spike configured OSM as base replacement (`shouldReplaceMapContent` on iOS, `mapType="none"` on Android) with native pan/pinch enabled and no controlled region state. Expo documentation says no development build is needed to try this package in Expo Go. The installed simulator service is unavailable and the Simulator app is missing, so live tile rendering and pan/pinch were not verified; screenshot remains blocked. Public OSM tiles remain demo-only due service limits.

**User verification route:** Keep `src/app/map-test.tsx` as a hidden, development-only root route until the user confirms Expo Go testing on iPhone. Run `npx expo start --go --lan`, scan the QR in Expo Go, then open `exp://<LAN-IP>:8081/--/map-test` on the iPhone. The route shows OSM tiles, attribution, and native pan/pinch gestures; it is not a tab.

### Task 2: Persisted app state and demo session

**Files:** `src/providers/places-provider.tsx`, `src/providers/` new bootstrap/storage provider, `src/features/account/`, `src/features/places/application/`, `src/features/places/domain/`, `src/features/events/`

- Introduce a versioned AsyncStorage schema for saved place/event IDs, `savedAt`, cached name/category/area metadata, demo session, selected area, theme, and notification preferences.
- Hydrate all stored state before first screen draw; keep one source of truth for saved state.
- Write after each save/unsave and session/area/theme change. Do not rely on app exit.
- Retain cached item details when fixture disappears; expose **No longer available** and remove action.
- Keep storage parsing and unavailable-item resolution pure. Add `tests/saved-state.behavior.test.tsx` for versioned schema parse/validation and unavailable item state with remove action.
- Keep past saved events in Past and cancel their local reminders.
- Sign-out clears demo session only; never clears saved data.
- **Automated check:** `saved-state.behavior.test.tsx` passes for valid/invalid versioned payloads and stale saved item state.
- **Manual check:** restart app with guest and signed-in sessions; verify saved items and selected area remain, and sign-out preserves saves.

### Task 3: Gurugram location and weather services

**Files:** `src/features/location/`, `src/features/weather/`, `src/features/home/presentation/home-screen.tsx`, location/area picker route components

- Model Sector 29 as first-install selected area. Keep selected area on relaunch and sign-out.
- Add area picker and **Use my location** action. Request foreground permission only on tap.
- On permission denial/error, retain chosen area and label straight-line distances approximate/from chosen area. Outside Gurugram coverage, show Coming soon.
- Implement Open-Meteo current weather for selected in-coverage area, 15-minute cache, stale value plus age offline, hidden state before first successful fetch.
- Add `tests/weather-cache.behavior.test.tsx` for cache validity, stale age, offline last-known value, and hidden-before-first-success state.
- **Automated checks:** `location.behavior.test.tsx` verifies distance labels; `weather-cache.behavior.test.tsx` verifies 15-minute expiry and stale age.
- **Manual check:** first launch causes no permission dialog; tapped action requests it; deny and outside-coverage paths are honest; offline weather never invents a current value.

### Task 4: Scene registry, Home artwork, and appearance

**Files:** `src/features/home/presentation/city-scene.tsx`, `src/features/home/presentation/city-scene-spec.ts`, new scene registry/controller in `src/features/home/`, `src/features/home/presentation/home-screen.tsx`, `assets/`

- Import v1.2 package using manifest, motion spec, and integration guide. Add City and Winter Home hero/preview layers with density-family image requires.
- Define stable scene selection contract keyed by surface, mood, and theme. Use current v1.2 assets for available surfaces; allow future package to supply remaining variants without routing or architecture changes.
- Keep Home hero free of metro/train/beams. Keep preview layers per manifest.
- Apply existing Reanimated setup, reduced-motion still frame, off-screen/focus pause, fixed artboard scaling, anchoring, clipping, and layer order.
- Add palette button and Appearance sheet; persist City/Winter theme. Theme changes visuals only.
- **Manual check:** compare Home hero/preview with approved recording on iPhone 16e; check City/Winter and reduced-motion modes.

### Task 5: Home discovery composition and search handoff

**Files:** `src/features/home/presentation/home-screen.tsx`, new Home section components in `src/features/home/presentation/`, `src/app/(tabs)/index.tsx`, `src/app/(tabs)/explore.tsx`

- Build approved header, weather, search, eight essentials, City World preview, mood-based picks, Nearby, events, and Collections hierarchy.
- Replace cross-city fixtures with Gurugram sample data and clear demo labels.
- Make Home search navigate to Explore, focus its input, and open keyboard in the same interaction.
- Category shortcuts open Explore with fresh query. Ensure mood never filters essentials/search.
- Add mood labels, See all links, honest empty state, ordering for picks and collections.
- **Manual check:** Home layout and controls against recording; tap search once and verify keyboard is open with focused field.

### Task 6: Places, Explore search, and query handoff

**Files:** `src/features/places/domain/place.ts`, `src/data/mock-place-repository.ts`, `src/features/places/application/`, `src/features/places/presentation/explore-screen.tsx`, `src/features/places/presentation/place-card.tsx`, `src/app/(tabs)/explore.tsx`

- Expand Gurugram demo fixtures and represent fictional versus real landmark navigation capability explicitly.
- Keep place/service results primary. Add up to 2–3 matching upcoming events in separate group with date/time and **See all in Events**.
- Extract pure `rankPlaces(query, places)` and `selectSearchEvents(query, events, limit = 3)`. Add `tests/explore-search.behavior.test.tsx` for relevance order, separate event group cap, event-only matches, and query carry; add `tests/events.behavior.test.tsx` for past-event exclusion.
- Exclude past event search results. If only events match, retain ordinary no-places message beside event group.
- Carry query Explore ⇄ Map. Category shortcuts clear query. Mood does not affect results.
- Preserve Saved/Place Details routes and existing save/unsave behavior with new storage source.
- **Automated checks:** `explore-search.behavior.test.tsx` and `events.behavior.test.tsx` pass for relevance, event cap, and past-event exclusion.
- **Manual check:** utility search ranking, event-only query, past-event exclusion, category reset, query carry both directions.

### Task 7: Full City World and Surprise Me

**Files:** new `src/features/city-world/` feature area; `src/app/` route(s) only if needed; scene registry from Task 4; place repository contracts

- Register v2.0 full-screen City World and Surprise Me artwork for all six moods × both themes from `asset-manifest.json`; mount only active and incoming cross-fade sets.
- Follow `motion-spec.json` section 0, `fullScreen`, `surpriseMe`, and `moodCrossfade`: Cyber City initial camera, 1:1 mid-layer pan/inertia, district focus/beam intensities, all district pills, traffic, Winter fog/snow/caps/five snowmen, Surprise search/lock sequence, and reduced-motion behavior.
- Keep Home and City World on shared mood state. Mood affects only inspiration and City World. District sheets use mood-matched Gurugram data, demo descriptions, no ratings/prices/hours, and Real map opens Map.
- Surprise Me selects only valid demo listings, excludes all health categories, labels result as demo suggestion, and supports tap skip.
- Keep Home scenes unmounted on City World and pause animation when unfocused. Estimate active-set and cross-fade decoded memory from the asset manifest; confirm device memory on iPhone.
- **Automated checks:** all 12 set selection, health exclusion, shared mood/cross-fade timing, reduced motion, and Surprise timing.
- **Manual check:** district selection, mood changes, Surprise Me, Real map handoff, and accessibility motion state.

### Task 8: Native map and camera behavior

**Files:** `src/features/map/`, `src/app/(tabs)/map.tsx`, `src/app/(tabs)/_layout.tsx`, place detail action integration

- Add native `react-native-maps` with OSM `UrlTile`, visible attribution, markers, filters, radius options, user location, list/detail sheet, and query input.
- Keep map camera state in the map feature across tab switches. Initialize from selected area once; never snap back during later pans.
- Show **Search this area** only after user pan. Category changes update markers/list only.
- Implement zoom rules: selected radius fits at zoom 10–16; Open in Map landmark zoom 16 and area zoom 14.
- Extract pure `clampMapZoom(zoom)` and `resolveRadiusZoom(radiusKm, bounds)` helpers. Add `tests/map-zoom.behavior.test.tsx` for min/max clamps, radius-fit range, landmark 16, and area 14.
- Preserve pinch zoom. Prevent app state updates from moving/recreating map during gestures. Make sheet gesture-safe.
- Directions use Apple Maps on iOS and Google Maps when available on Android, only for real landmarks. Fictional entries show v2.3 no-real-address message.
- **Automated check:** `map-zoom.behavior.test.tsx` covers zoom clamp and radius/open-in-map levels.
- **Manual check:** simulator map controls, then real iPhone pan/pinch/zoom/sheet interaction/camera persistence and directions behavior.

### Task 9: Events, notifications, profile, and demo auth flows

**Files:** `src/features/events/`, `src/features/notifications/`, `src/features/profile/`, `src/features/account/`, `src/app/(tabs)/events.tsx`, `src/app/(tabs)/profile.tsx`, notification/profile routes

- Build Events filters, featured and dated cards, bookmark actions, and demo labels from recording.
- Build profile guest and demo-signed-in states, Continue as demo user, sign-out, saved summaries, review entry points, Appearance and notification settings.
- Build Updates/For you inbox. Keep For you opt-in and separate suggestions from plan changes.
- Request notification permission only on an action requiring it. Schedule local reminders for saved events only; cancel when event passes or is unsaved.
- **Manual check:** guest browsing, demo sign-in persistence, sign-out save retention, event filters/bookmarks, inbox opt-in and reminder permission timing.

### Task 10: Integration pass and approval review

**Files:** affected files from Tasks 1–9; `docs/` only for updated implementation notes if required

- Review every video-demonstrated flow against the approved design; correct visual hierarchy, spacing, labels, assets, and target sizes.
- Check all input font sizes, all tap targets, no system fallback, reduced motion, no fabricated weather/listing facts, and no map gesture interference.
- Run repository lint, TypeScript validation, Expo asset resolution/export, then simulator review. Do not claim checks not run.
- Present iPhone 16e simulator result for product approval. Record real iPhone follow-up required for map and animated scenes; final sign-off waits for that device review.
- Stop and report changed areas, checks/results, untested conditions, and simulator screenshot. Continue only after user review.

## Execution order

Complete Task 1, then run the map spike before Home work. Complete Tasks 2–3 next and stop for product review. Then complete Tasks 4–10 one at a time, stopping after every task. Do not batch past a review gate.

## Product review gates

- After Tasks 1–3 and map spike, stop. Report changes, checks actually run, untested areas, and simulator screenshot.
- After each Task 4–10, stop for review with the same four items. Continue only after user review/approval.
