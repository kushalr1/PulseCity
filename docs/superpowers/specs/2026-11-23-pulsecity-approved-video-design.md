# PulseCity approved-video app design

**Status:** Product-approved design; implementation underway on `feature/pulsecity-approved-video`.

## Intent

Extend the existing React Native and Expo app into the native PulseCity experience shown in the approved screen recordings. PulseCity helps people discover useful places and events around their city. The demo should feel usable day to day while identifying sample listings as demo data; real place and event sources, production authentication, and account sync come later.

The 2026-11-23 5:52 PM recording is the visual reference for Home and Explore typography, light appearance, layout, and navigation flow; it supersedes earlier recordings for those details. The 11:31 AM complete-app recording remains the behavior reference for screens and flows not shown in the newer recording. User decisions in this conversation take precedence over older milestone notes in `HANDOFF.md` where they conflict.

## Goals

- Match the approved recordings closely on iPhone 16e Simulator and make every demonstrated control and flow work.
- Extend the existing app and preserve its feature-based, pragmatic Clean Architecture, Expo Router navigation, Saved, Place Details, and save/unsave behavior.
- Implement Home, interactive City World, Nearby, Home events, Collections, Explore, Map, Events, Profile, onboarding/city selection, demo sign-in, Appearance, and Notifications flows shown in the recordings.
- Start every new demo session at Sector 29, Gurugram, for guest and demo-signed-in users. Do not request location at launch.
- Use real device location only after the user taps **Use my location**. If permission is denied or unavailable, retain the chosen area and show clearly labelled approximate straight-line distances.
- Keep the live Open-Meteo service and never show a fabricated temperature. Current product decision hides all weather from the UI; see `docs/DECISIONS.md`.
- Persist saved places, saved events, and demo sign-in state on device. Load persisted values before the first app screen renders.
- If storage hydration rejects, is invalid, or does not return in time, log the error and start with Sector 29 and empty saves. Storage must never hold startup indefinitely.
- Do not show cross-city listings, invented ratings, or stock photos. Task 5 replaces Home's legacy “Sample places” section with approved Gurugram sections, illustrations, and honest empty states.
- Keep the Home essentials grid at eight tiles and keep Pharmacy pharmacy-only. Add Hospitals, Clinics & Doctors, Diagnostic Labs, and Pet Clinics as Explore-only categories, available under All and through search aliases. No new Home tiles.
- Map these search terms to categories: hospital/emergency; clinic/doctor/dr/physician; lab/diagnostic/test/blood test/pathology; vet/veterinary/pet clinic/pet doctor/animal hospital. Resolve a longer, more specific phrase before a shorter contained term, so “animal hospital” selects Pet Clinics.
- Clinics & Doctors, Diagnostic Labs, and Pet Clinics use fictional listings clearly labelled Demo, with no phone numbers, hours, “open now,” ratings, availability, or directions. They use the existing no-real-address message when directions are requested.
- Hospitals contain the six real, verified Gurugram hospitals supplied on 2026-11-24. Store only the supplied id, name, area, address, directionsQuery, source URLs, and verifiedOn date; do not add phone, hours, rating, “open now,” availability, specialities, bed counts, or photos. Coordinates were not supplied: show these records in Explore lists and search only, with no map pins or km distances until coordinates are verified. Label each “Real place · address verified 24 Nov 2026”. Directions hand off to Apple Maps/Google Maps using that record's supplied directionsQuery. Search “hospital”, “emergency”, and each hospital name must find the records.
- PulseCity is a near-me recommendation app, not an emergency service. Do not show emergency guidance or emergency text on Hospitals, Clinics & Doctors, Diagnostic Labs, or Pet Clinics screens. The word “emergency” remains a Hospitals search alias only.
- Keep the integrated Home hero and preview assets. Use scene package v2.0 for full-screen City World and Surprise Me, following its manifest, motion specification, and Expo integration notes.
- v2.0 provides full-screen art for all six moods × both themes. Register every supplied set and render it directly; do not leave mood/theme gaps or synthesize scenes by recolouring.

## Non-goals

- Production authentication, a backend, account sync, real place/event feeds, and a production map tile provider.
- Presenting sample ratings, addresses, hours, prices, distances, event updates, or weather as verified facts.
- Winter or other mood scenes assembled by tinting or modifying unrelated artwork.
- Offline map tile storage or prefetching.
- Any flow or feature not shown in the approved recordings or agreed separately.

## Approved approach

### Chosen: extend the existing native Expo app

Keep the current feature-based app and add the missing native flows in their feature areas. Reuse the existing router, providers, design tokens, and Reanimated setup. Integrate `react-native-maps` with an OpenStreetMap `UrlTile`, Expo-compatible location and notification modules, AsyncStorage, and Open-Meteo requests. Install Expo-compatible native modules through `npx expo install` after checking Expo SDK 58 documentation.

This approach takes more work than a static visual imitation. It preserves current navigation and saved-place behavior and supports native location, map gestures, local reminders, and offline saved-item details.

### Rejected alternatives

- A WebView or browser-renderer port could copy the prototype quickly, but would not meet native location, map gesture, reminder, and offline requirements. It also conflicts with the repository handoff.
- Replacing the app would discard working Expo setup, feature boundaries, and Saved/Place Details behavior. It adds risk without helping the approved flows.

### Chosen: Explore-only health categories with explicit search aliases

Extend the existing place-category model with Hospitals, Clinics & Doctors, Diagnostic Labs, and Pet Clinics. Keep the Home essentials grid at eight tiles and Pharmacy unchanged. Give each health term an explicit alias-to-category mapping and let the existing relevance ranker order matching places. This preserves direct category filtering, supports common search language, and avoids adding another Home step.

Rejected alternatives: adding health tiles to Home would break the approved eight-tile grid; putting health listings into an untyped “Health” or “Things to do” bucket would weaken category filtering, synonym relevance, demo safeguards, and direction rules.

## Experience and behavior

### Onboarding, area, and location

- Keep Gurugram as the only available launch city in the city picker; cities marked “Coming later” remain unavailable.
- First start defaults to **Sector 29, Gurugram** for guests and demo-signed-in users. Persist a user-selected area on device.
- The location label opens an area picker. Do not show a location prompt when the app launches or when demo sign-in completes.
- **Use my location** requests foreground location permission only after the tap. On success, center nearby features on the device location. On denial or error, retain the selected area and label distances as approximate, straight-line estimates from that area.
- Support Gurugram coverage only. If GPS resolves outside coverage, show the approved **Coming soon** screen; do not fabricate nearby listings.
- Demo behavior differs from the future production onboarding. Production may show a location explanation and request permission on first launch; that prompt is not part of this demo build.

### Demo account and Profile

- Browsing never requires an account. Profile shows guest state, sign-in/create-account entry points, saved summaries, reviews/photos entry, Appearance, and notification settings as shown in the recording.
- Sign-in and create-account screens are demo-only. No real credentials are collected, sent, or saved. **Implementation call:** use a **Continue as demo user** action with a visible “Demo — no account is created” note instead of password fields; this avoids collecting sensitive-looking input while providing the signed-in state needed by the video.
- Persist the demo-signed-in state until sign-out. Sign-out returns to guest mode and preserves saved items. Do not sync across devices.
- Signed-in demo state unlocks the demonstrated review-writing entry points. Reviews remain demo-only and are not published to a server.

### Home

- Rebuild the Home hierarchy and header from the approved recording: current area controls, palette, Saved, Notifications, “Coffee ka plan?” Hero, search, eight Everyday essentials categories, City World preview, Tonight’s picks/Nearby, weekly events, and Collections. The approved Home has no weather chip.
- The Home search opens Explore and advertises places, services, and events. Keep demo content labels visible.
- Tapping Home search opens Explore, focuses its search field, and opens the keyboard in that same interaction. Carry the active query between Explore and Map. Category shortcuts start a fresh query.
- Default mood is Chill. Mood affects Home inspiration only: mood-matched Tonight’s picks (up to three, best match then nearest), collection order, copy/lighting where assets support it, and City World district pills/beams. Label mood-based blocks and include **See all**. If there are no matching nearby records, show an honest empty state.
- Mood never filters Everyday essentials, Search, Explore, or Map.
- Apply input text size of at least 16 pt to every editable field. Use Syne for display typography and Inter Tight for interface/body typography. Bundle through `@expo-google-fonts/syne` and `@expo-google-fonts/inter-tight`; do not use system-font fallback. Both source font families use SIL Open Font License 1.1; include license notices with the bundled font files.
- Inter Tight renders `₹` (U+20B9), `≈` (U+2248), and `·` (U+00B7). Verify these glyphs in every bundled weight used; never silently fall back to the system font.
- Keep the Open-Meteo service for the selected Gurugram area, with 15-minute caching and last-known value age handling. Per the 2026-11-23 decision in `docs/DECISIONS.md`, show no weather in the app UI for now.

### Home and Explore visual treatment

- Follow the 5:52 PM recording for the light visual treatment, display typography, spacing, controls, and Home-to-Explore sequence on these two screens. Use Syne for display headings and Inter Tight for interface text, using the already bundled and licensed fonts.
- Home retains the approved eight-item essentials grid. Explore follows the recording's compact heading/location/actions, prominent search field, browsable category chips, Popular searches shortcuts, and Collections hierarchy. Keep agreed Gurugram content, honest listing rules, and demo labels.
- On the first Home search tap, navigate to Explore and focus its input after the screen is ready so the user can type immediately. Do not require a second tap on the field.

### City World and appearance

- The Home preview opens the full City World experience. It shows an illustrated, explicitly not-to-scale city, district names/pills, mood choices, district detail, local demo picks, **Surprise me**, and **Real map** actions as shown in the recording.
- Selecting a district opens a detail sheet with its demo description, mood-matched picks, and supported actions. **Surprise me** selects only from valid demo records and must not imply factual recommendations.
- City World preview beams and district pills use mood-tagged demo counts. Only districts with matching items receive labels; beam brightness reflects the matching count.
- Appearance is look-only. City World is the default; Winter Wonderland is selectable once its Home assets are integrated. Keep theme selection available from the Home palette button and Profile → Appearance. Save the choice. Theme must never change places, events, or search results.
- Use separate hero and preview layer sets. Hero uses the 390 × 243 pt artboard; preview uses 358 × 208 pt. Scale each as one fixed artboard using the v1.2 cover, bottom-left anchoring, clipping, layer order, and motion rules.
- **The Home hero must never render metro, train, or district beams.** City World preview may render metro and train. Winter variants add their manifest layers, snowman, fog, frost, and snowfall.
- Use density-family static requires, preserving physical `@1x`/`@3x` files; do not copy manifest examples that directly require a suffixed physical filename if they conflict with the established Metro family-path convention.
- Keep only the active scene set mounted. Preserve reduced-motion still frames, pause animation when off-screen or unfocused, and use existing Reanimated for scene motion. Do not add Skia for additive glow; use the package’s fitted normal-alpha approximation.
- The v2.0 package replaces v1.2 for full-screen City World and Surprise Me. Register all six moods × both themes using `asset-manifest.json`; use `motion-spec.json → fullScreen`, `surpriseMe`, and `moodCrossfade`. Do not recolour artwork at runtime or leave mood/theme placeholders.
- Full-screen City World starts at Cyber City without drift. Drag/inertia use the spec camera equations; selecting a district eases to it; the selected and other beams use the supplied intensities. Show all visible district pills at spec positions, cars, and five Winter snowmen.
- Home and City World share one mood. Cross-fade to the incoming mood set for 800 ms, apply its glow boost, and keep mood scoped to inspiration: picks, district suggestions, and Surprise Me. Never mood-filter Search, Explore, or Map.
- District sheets use Gurugram data and demo descriptions, with no ratings, prices, or hours. **Real map** opens the Map tab.
- Surprise Me follows the exported search/lock timing and uses only valid demo records. Exclude Pharmacy, Hospitals, Clinics & Doctors, Diagnostic Labs, and Pet Clinics. Label results as demo suggestions. Taps skip the animation; reduced motion opens the result immediately.
- Leave about 20 pt along the left edge for iOS back swipe. Unmount Home scenes while full-screen City World or Surprise Me is open, mount only active/incoming full-screen sets, and pause motion when unfocused.

### Nearby, Explore, and Map

- Nearby uses Gurugram demo records and compact rows with category, area, straight-line estimate, and an action. The current cross-city Bengaluru/Hyderabad/Mumbai fixtures must not appear as Gurugram picks.
- Explore searches places and services first. When the query matches, show at most two or three events in a separate group, with date/time and **See all in Events** carrying the query. Never show past events. If no places match but events do, show the event group beside the ordinary no-place message.
- Explore adds Hospitals, Clinics & Doctors, Diagnostic Labs, and Pet Clinics. These are available through All and search only; Home stays at eight tiles and Pharmacy remains pharmacy-only. Support the approved aliases, including multi-word health and pet-health terms, with the most specific phrase winning over a shorter contained term.
- Clinics & Doctors, Diagnostic Labs, and Pet Clinics show fictional listings labelled Demo and never offer directions, phone numbers, hours, “open now,” ratings, or availability. The no-real-address message explains why directions are unavailable.
- Hospitals are only real, verified Gurugram records supplied by the user. The current six records have no coordinates, so show no pins or distance and include them only in Explore lists/search. Preserve their supplied id, name, area, address, directionsQuery, source URLs, and verifiedOn date; add no other fields. Label each “Real place · address verified 24 Nov 2026” and hand off directions using the supplied directionsQuery. If the list is unavailable, show an honest empty state without emergency messaging.
- Do not show emergency guidance on any health-category screen, including empty states. “Emergency” remains a search alias for Hospitals.
- Mood does not affect Explore. Keep category filters, search, and list behavior independent of Home mood.
- Map is a native `react-native-maps` screen with an OpenStreetMap `UrlTile`, visible “© OpenStreetMap contributors” attribution, search, category filters, map-area search, nearby radius controls (5/10/20 km), user location when granted, markers, and the list/detail sheet shown in the recording.
- Map camera pans freely and never snaps back to Sector 29. Show **Search this area** only after a user pans. Category changes never move the camera. Preserve camera state across tab switches.
- Clamp map zoom to the approved rules: radius view fits the selected radius using zoom levels 10–16; **Open in Map** uses zoom 16 for a landmark and zoom 14 for an area. Keep pinch zoom enabled.
- During a map gesture, do not trigger app-driven re-renders or camera movement. Design sheets and overlays so they do not intercept map gestures. Keep every tap target at least 44 pt.
- Do not prefetch or cache map tiles. The OpenStreetMap tile layer is demo-only; production uses a later-approved provider.
- Directions may open system maps only for real landmarks. Fictional demo listings show the v2.3 no-real-address message and never launch a maps app. Use Apple Maps on iOS; on Android use Google Maps when installed, otherwise the system maps handler.
- A real iPhone review is required for map drag, pinch, zoom, and My Location.
- Never disable pinch zoom. Verify map movement, sheet interaction, and camera persistence on device.

### Events and Notifications

- Events tab includes the location heading, demo disclosure, filters shown in the recording (Today, This weekend, Free, Under ₹500, and event categories), featured event, dated event rows, and save controls.
- Keep event fixtures labelled as demo data. Exclude past events from Home and search; move saved past events to a Past section and cancel their reminders.
- Notifications inbox has Updates and For you tabs, unread indicator, and settings entry. For you is off until the user opts in and chooses interests.
- Ask for notification permission only after an action that needs it, such as saving an event or enabling For you. Do not prompt at launch.
- Local reminders for saved events are real. Do not invent changed/cancelled event updates without a real event source. Recommendations remain distinct from changes to a saved plan.

### Saved data and offline behavior

- Use AsyncStorage for local saved places/events and demo session state. Store a versioned format with item ID, saved date, and cached name/category/area needed for offline Saved views.
- Hydrate before rendering the first screen to avoid bookmark flicker. Write after each save/unsave; do not depend on app exit.
- If a stored item is absent from current demo data, show **No longer available** with a remove action rather than silently deleting it.
- Preserve saved items at sign-out. Do not implement cross-device sync until a backend exists.
- Keep the handoff’s current working Saved and Place Details flows intact while changing their storage adapter.

## Architecture and likely touch points

- Keep route files under `src/app/` thin. Add route composition only for screens demonstrated in the recordings.
- Extend `src/features/home/` for Home sections, appearance selection, and scene rendering. Keep City World implementation in its own feature presentation/application area if it grows beyond Home composition.
- Extend `src/features/places/` contracts and domain types for Gurugram demo area, mood tags, cached saved metadata, and real-vs-fictional location capability. Keep mock fixtures behind existing repository contracts.
- Add feature areas for events, location/area selection, notifications, weather, onboarding/demo account, and profile only where flows require them; keep UI out of route files.
- Extend `PlacesProvider` or replace its storage responsibility with a focused persisted state provider/repository. Use one source of truth for saved IDs.
- Keep existing design tokens as the visual baseline; add approved v2.3 tokens and font files only when their source/license is established.
- Bundle approved Syne and Inter Tight Google Fonts through `@expo-google-fonts/syne` and `@expo-google-fonts/inter-tight`, with SIL OFL 1.1 notices. Use app font tokens for all text; no system fallback.
- Map `₹`, `≈`, and `·` to Inter Tight font assets. Current verification confirms glyph coverage in Inter Tight weights 400, 500, 600, 700, and 800.
- Keep map camera and gesture state owned by the map feature and stable across tab focus. Isolate marker/list/category updates from the map gesture path. Keep overlays outside the map's gesture hit area where practical.
- Select scene assets by `{ surface, mood, theme }`; v1.2 supplies the integrated Home hero and preview, and v2.0 supplies all full-screen mood/theme sets and Surprise Me art.
- Likely add Expo-compatible modules for maps, foreground location, local notifications, and AsyncStorage. Do not upgrade existing packages. Follow repository `AGENTS.md`: check Expo SDK 58 docs and use `npx expo install` for native dependencies.

## Constraints and implementation calls

- Preserve the intentionally dirty working tree. Inspect status before implementation; do not reset, clean, commit, or push.
- Do not show cross-city listings, invented ratings, or stock photos. Task 5 replaces the legacy Home “Sample places” section with the approved Gurugram sections using illustrations and honest empty states.
- Keep v1.2 for the currently integrated Home hero and preview. The user supplied v2.0 for full-screen City World and Surprise Me; all six moods and both themes exist for those surfaces. Keep the scene architecture asset-swappable for future Home art.
- The asset package recommends React Native `Animated`; this design retains already-installed Reanimated and its existing visibility/reduced-motion handling while applying manifest/motion-spec values. This is an implementation call for approval.
- Syne and Inter Tight are listed in Google Fonts and their font source repositories publish SIL OFL 1.1 licenses. Bundle via `@expo-google-fonts/syne` and `@expo-google-fonts/inter-tight`; include their license notices. Expo documents the Google Fonts packages and font embedding/loading paths. No system fallback is allowed.
- Reanimated motion and Metro family-path image requires are approved. Preserve reduced-motion and visibility behavior.
- User acceptance is visual closeness, not pixel identity. Simulator approval comes first; final map/scene approval needs a real iPhone.

## Approved asset delivery plan

- Keep the Home hero and preview on their integrated v1.2 sets.
- Use v2.0’s 12 full-screen mood/theme sets for City World and Surprise Me, with the supplied cross-fade specification.
- Keep the scene API asset-driven and support package replacement without changing architecture. Do not approximate moods by recolouring artwork.
- The Home hero never shows the metro or train. Preview/full-screen scenes may show them when specified by the asset manifest.

## Approved search, map, and mobile quality rules

- Home search tap focuses Explore’s field and opens the keyboard immediately.
- Carry query between Explore and Map. Category shortcuts start with an empty query.
- Map pans freely without snapping to Sector 29. **Search this area** appears only after user pan. Category changes do not move camera. Camera persists across tab switches.
- Radius view fits zoom levels 10–16. **Open in Map** uses zoom 16 for landmarks and 14 for areas.
- Keep pinch zoom enabled. Prevent app-driven map re-render/camera movement during gestures. Sheets must not interfere with map gestures.
- All text inputs use at least 16 pt. All tap targets use at least 44 pt.
- Keep approved Syne and Inter Tight fonts bundled, with no system fallback.
- Use the 5:52 PM recording as the Home/Explore visual authority; it supersedes earlier recordings for these screens only.

## Startup and font verification

- App waits for local font loading and storage hydration before first screen. Storage read failure, invalid schema, or timeout logs an error and releases startup with Sector 29 and empty saved lists.
- Syne and Inter Tight SIL OFL 1.1 license notices ship with bundled font files.
- Inter Tight renders `₹`, `≈`, and `·` in weights 400, 500, 600, 700, and 800. These glyphs never fall back to system fonts.
- Short map spike found `react-native-maps@1.29.11` matches SDK 58 and Expo Go docs mark it included. Temporary OSM `UrlTile` iOS export succeeded. Live pan/pinch and tiles remain unverified because CoreSimulatorService is unavailable and Simulator app is absent. The limitation and evidence are recorded in the execution plan.

## Acceptance

- Every screen and control demonstrated in the approved recordings works in the Expo app; features not shown remain out of scope unless separately approved.
- Home, City World, Explore, Map, Events, Profile, Appearance, Notifications, demo sign-in, location fallback, persistent saves, and weather behavior match this document.
- Home keeps exactly eight essentials tiles. Explore includes the four health/pet categories and aliases. The six verified hospitals have no map pins or distance until coordinates arrive; they display as real places and directions use their supplied queries. Non-hospital health fixtures stay Demo-labelled with the agreed restrictions.
- Home search opens Explore ready for typing after one tap. Home and Explore follow the newer recording's approved typography and visual structure.
- City World and Winter Home scenes use supplied v1.2 assets and preserve its layer/motion/reduced-motion rules; the hero has no metro/train/beams.
- The scene architecture supports the promised expanded six-mood/two-theme/full-screen/Surprise Me package without structural change; v1.2 is not treated as final Chill-only scope.
- Search focus/query handoff and map camera/zoom/pan rules above work as specified.
- Inputs are at least 16 pt, tap targets at least 44 pt, and pinch zoom stays enabled.
- Syne and Inter Tight are bundled with OFL notices and render without system fallback.
- iPhone 16e Simulator review is visually close to the recordings. User approves from Simulator.
- Real iPhone review confirms map gestures/My Location and animated scene behavior before final sign-off.
- Implementation verification includes behavior tests, TypeScript, lint, Expo asset resolution/export, and appropriate simulator/device review. Report only checks actually run.

## References

- Approved Home recording: `/Users/kushalsharma/Desktop/Screen Recording 2026-11-23 at 10.44.51 AM.mov`
- Approved complete app recording: `/Users/kushalsharma/Desktop/Screen Recording 2026-11-23 at 11.31.38 AM.mov`
- New Home/Explore visual reference: `/var/folders/ky/dtyptgr97z5f5r682rflkmqr0000gn/T/TemporaryItems/NSIRD_screencaptureui_FPXfst/Screen Recording 2026-11-23 at 5.52.39 PM.mov`
- Verified Gurugram hospital list was supplied by the user on 2026-11-24; coordinates remain pending.
- Earlier approved visual captures: supplied 2026-11-23 screenshots.
- Scene package v1.2: `/Users/kushalsharma/Downloads/pulsecity-scene-assets-v1.2.zip`; use `asset-manifest.json`, `motion-spec.json`, and `INTEGRATION-RN-EXPO.md`.
- Font license sources: [Syne SIL OFL 1.1](https://github.com/google/fonts/blob/main/ofl/syne/OFL.txt), [Inter Tight SIL OFL 1.1](https://github.com/googlefonts/inter-gf-tight/blob/main/OFL.txt). Expo font packages: [`@expo-google-fonts/syne`](https://www.npmjs.com/package/@expo-google-fonts/syne), [`@expo-google-fonts/inter-tight`](https://www.npmjs.com/package/@expo-google-fonts/inter-tight). Expo font setup: [Expo documentation](https://docs.expo.dev/develop/user-interface/fonts/).
- Existing app rules and status: `HANDOFF.md`, `AGENTS.md`, and current project source.
