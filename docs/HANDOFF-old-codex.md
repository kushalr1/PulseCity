# Project: PulseCity

## 1. Goal

PulseCity is a premium Gen-Z city discovery and relocation companion built with React Native and Expo. It is for people exploring places and settling into a city.

The current approved milestone is an incremental native implementation of the PulseCity v2.3 visual direction. It includes Home, Explore, Map, Events, and Profile tabs; Map, Events, and Profile stay labelled placeholders. Existing Saved, Place Details, and save/unsave flows must remain intact. City World currently has a static preview card with layered motion; the full City World and Winter Wonderland experiences are future work.

Finished means the approved milestone screens render faithfully on an iPhone 16e Simulator, core navigation and saved-place behavior work, tests/type checks/lint pass, and the user approves the rendered result. Task 4 still awaits live visual review.

## 2. Tech stack

- TypeScript 6.0.3; strict type checking via `npx tsc --noEmit`.
- Expo SDK `~58.0.26`; Expo Router `~58.0.32`.
- React `19.3.0`; React Native `0.88.1`.
- Reanimated `4.7.1`, Expo Image `~58.0.18`, Expo Symbols `~58.0.5`, Safe Area Context `~5.11.1`, Gesture Handler `~3.3.0`, React Native Screens `~4.30.1`.
- Jest `^30.5.2`, jest-expo `~58.0.15`, React Native Testing Library `^14.1.0`, ESLint `^9.39.5`, eslint-config-expo `~58.0.4`.
- npm and `package-lock.json`; no `bun.lock` was found.
- Database/backend: none implemented. FastAPI and PostgreSQL are deferred.
- Hosting/deployment: none configured or verified.
- Environment variables: no project `.env` variables were found or documented. Do not invent any.
- Native asset resolution uses Metro density variants. Static `require()` paths must use suffix-free asset-family names, while physical files retain `@1x`/`@3x` suffixes.

## 3. How to run the project

Run commands from the actual repository: `/Users/kushalsharma/Desktop/Pulsecity`. The active Codex workspace path `/Users/kushalsharma/Documents/Codex/2026-11-18/desktop-pulsecity` was not a Git repository and did not contain this app. Confirm location with `git rev-parse --show-toplevel` before editing.

```bash
npm install
npm start
npm run ios
npm run android
npm run web
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

The successful iOS Metro export command from this session was:

```bash
./node_modules/.bin/expo export --platform ios --output-dir /private/tmp/pulsecity-ios-bundle-verified
```

It completed with 1 iOS bundle and resolved all 20 scene PNG assets. No production/native simulator build was run in this session. The iPhone 16e Simulator runtime still needs visual verification after the Metro fix.

## 4. Project structure

- `src/app/` — Expo Router route files and navigator layouts; keep routes thin.
- `src/app/(tabs)/_layout.tsx` — five-tab navigation shell: Home, Explore, Map, Events, Profile.
- `src/app/(tabs)/index.tsx` — Home route composition.
- `src/app/(tabs)/explore.tsx` — Explore route composition.
- `src/app/(tabs)/map.tsx` — Map placeholder route.
- `src/app/(tabs)/events.tsx` — Events placeholder route.
- `src/app/(tabs)/profile.tsx` — Profile placeholder route.
- `src/app/_layout.tsx` — root stack/provider composition.
- `src/app/saved.tsx` — Saved route outside the five visible tabs.
- `src/app/place/[id].tsx` — Place Details route with route parameter.
- `src/features/home/presentation/home-screen.tsx` — Home screen UI, existing Home interactions, safe-area and visible-scene tracking.
- `src/features/home/presentation/city-scene.tsx` — native layered Hero/preview renderer and Reanimated motion.
- `src/features/home/presentation/city-scene-spec.ts` — Hero/preview artboard, layer order, asset-family requires, and motion data from the supplied package manifests/specs.
- `src/features/places/domain/place.ts` — Place model and categories.
- `src/features/places/application/place-repository.ts` — repository interface for place data.
- `src/features/places/presentation/` — Explore, Saved, Place Details, and feature-specific PlaceCard UI.
- `src/data/mock-place-repository.ts` — clearly labelled sample data adapter; data is not live.
- `src/providers/places-provider.tsx` — shared place loading and in-memory saved-place state.
- `src/shared/design-system/tokens.ts` — v2.3 visual tokens and compatibility aliases.
- `src/constants/theme.ts` — legacy theme exports retained for compatibility.
- `src/components/ui/` — reusable UI components and placeholder component.
- `assets/images/scene/hero/` — 8 physical Hero PNG layers.
- `assets/images/scene/preview/` — 12 physical City World preview PNG layers, including beams, metro track, and train.
- `assets/images/gurugram-skyline-night.png` — earlier generated composite; retained and no longer referenced by Home scene code.
- `tests/features/home-screen.behavior.test.tsx` — Home category, navigation callback, place selection, and scene-layer behavior tests.
- `tests/navigation/saved-flow.behavior.test.tsx` — test-only screen switcher exercising shared saved state; not a real Expo Router integration test.
- `tests/navigation/navigation-shell.test.mjs` — source-level navigation shell checks.
- `tests/design-system/design-tokens.test.mjs` — design-token tests.
- `tests/mocks/assetMock.js` — Jest PNG mock for density-free Metro asset-family requires.
- `AGENTS.md` — repository instructions; follow version-matched Expo docs before changing Expo/React Native APIs.

## 5. Rules and conventions

- Use feature-based, pragmatic Clean Architecture: domain stays framework-independent; application contracts depend on domain; mock/data adapters implement contracts; presentation owns screen/rendering behavior.
- Keep Expo Router files under `src/app/` thin. Keep Home scene rendering and animation under `src/features/home/presentation/`.
- Preserve the working Expo setup, uncommitted user changes, repository interfaces, shared provider state, Saved, Place Details, and navigation unless the user explicitly approves a change.
- Use the approved v2.3 HTML and screenshots as the visual references. The screenshots captioned 6:20 PM were explicitly marked “CURRENT IMPLEMENTATION — COMPARISON ONLY”; do not treat them as approved designs. The screenshots captioned 6:35 PM were supplied as approved v2.3 references. They may be attachments outside this repository. `pulsecity-v2.3.html` is at `/Users/kushalsharma/Downloads/pulsecity-v2.3.html` if still present.
- The ZIP `/Users/kushalsharma/Downloads/pulsecity-scene-assets-v1.1.zip` was inspected. It lacks `index.html`, which was not a blocker; manifests, README, motion specification, and Expo integration notes were used. Its manifest identifies the original HTML renderer and reports `artworkChanged: false`.
- Do not use unrelated stock art, fabricate replacement art, or copy browser HTML/CSS/Leaflet/WebView code into the native app. Keep the Hero and City World preview assets separate. Hero excludes train and beams; preview includes them.
- Use existing Reanimated and Expo modules. Do not install dependencies or upgrade versions without the user's approval. Do not add Skia just for exact additive glow blending; current beam glow uses normal alpha and is not exact additive blending.
- Use suffix-free static requires such as `require('../../../../assets/images/scene/hero/hero_sky.png')`. Keep physical density files named `hero_sky@3x.png`; Metro selects the variant. Do not require the `@3x`/`@1x` filename directly.
- Keep demo/sample content labelled. Existing place data spans Bengaluru, Hyderabad, and Mumbai; do not present it as verified Gurugram data. Do not invent verified ratings, distances, opening hours, prices, weather, or event facts.
- Follow accessibility, safe-area, responsive layout, and touch-target patterns. Respect reduced motion and pause animated scenes when off-screen or unfocused.
- Work one approved task at a time. Explain exact scope before changes when asked. Run tests, TypeScript, lint, and Metro verification appropriate to each change. Report what was actually verified.
- Never commit or push. Do not reset/clean Git state, bulk-refactor, delete working code, or modify unrelated files without approval.
- At each new or resumed chat, load `caveman` skill in default `full` mode for responses unless the user requests normal mode or stops it. Superpowers skills are available; claim only workflows actually read and followed.

## 6. Done ✅

- Task 1 design tokens were implemented and approved. Legacy theme compatibility is retained in `src/constants/theme.ts` and token aliases in `src/shared/design-system/tokens.ts`.
- Task 2 five-tab shell and placeholders were implemented. Saved remains outside the five tabs. Thin-route Clean Architecture corrections for Home, Explore, and Place Details were accepted as code-complete.
- Task 3 Saved behavior was approved after the user manually verified 8 iPhone 16e Simulator flows: Home to Saved, Explore navigation, save/unsave state, Saved to Place Details, back navigation, placeholders, and tab switching without crashes.
- Task 4 Home presentation uses v2.3-style dark city Hero, Gurugram/Sector 29 demo location, “Coffee ka plan?”, search entry point, eight everyday categories, City World evening preview, and labelled sample places. Home Saved button, Explore entry points, and Place Details selection remain wired.
- Supplied scene package assets were validated: 20 PNGs match manifest filenames, expected pixel dimensions and SHA prefixes; PNG CRC and image data decode checks passed; assets have alpha channels. Hero artboard is 390×243 pt; preview artboard is 358×208 pt.
- Reanimated scene behavior is implemented: slow parallax, star twinkle, Hero entrance, preview train movement, and beam pulse. Scenes pause when the screen is unfocused or scene is outside the Home viewport. Reduced-motion setting leaves a still frame.
- Metro asset-resolution bug was fixed. All 20 density variants resolve in an iOS export.
- Latest fresh checks after the fix: `npx tsc --noEmit` passed; `npm run lint` passed; `npm test -- --runInBand` passed (2 suites, 6 tests); `git diff --check` passed; iOS Expo export passed with 1 bundle and 43 total exported assets.
- No dependencies were installed or upgraded in the Metro fix. No commit or push was made.

## 7. In progress 🔧

- Task 4 is implemented but not visually approved. No live iPhone 16e screenshots could be captured in the prior environment. The user must review real simulator screenshots of Hero, Essentials, City World, and Sample Places before Task 4 is considered accepted.
- The latest Metro path fix is bundle-verified, but this session did not launch the app in the Simulator after the fix. Expo export proves Metro resolution/bundling, not visual runtime rendering.
- The working tree is intentionally dirty. Before the last fix it contained these existing changes; preserve them and inspect Git status before editing:
  - Modified: `package.json`, `package-lock.json`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/explore.tsx`, `src/app/(tabs)/index.tsx`, `src/app/_layout.tsx`, `src/app/place/[id].tsx`, `src/constants/theme.ts`.
  - Deleted as part of existing routing/component moves: `src/app/(tabs)/saved.tsx`, `src/components/ui/place-card.tsx`.
  - Untracked existing work: `assets/images/gurugram-skyline-night.png`, `assets/images/scene/`, `src/app/(tabs)/events.tsx`, `src/app/(tabs)/map.tsx`, `src/app/(tabs)/profile.tsx`, `src/app/saved.tsx`, `src/components/ui/feature-placeholder.tsx`, `src/features/home/`, `src/features/places/presentation/`, `src/shared/`, and `tests/`.
  - This session additionally changed the density-free requires in `src/features/home/presentation/city-scene-spec.ts`, added a PNG Jest mapper in `package.json`, and added `tests/mocks/assetMock.js`.

## 8. To do 📋

1. Verify Simulator availability without resetting devices or changing global settings. Earlier `xcrun simctl list devices available` failed with CoreSimulatorService connection errors; current status is UNSURE.
2. Launch the updated app on the iPhone 16e Simulator and capture actual screenshots of Home Hero, Essentials, City World, and Sample Places. Compare against approved 6:35 PM v2.3 screenshots and `/Users/kushalsharma/Downloads/pulsecity-v2.3.html` if present. Do not substitute ZIP/browser previews for app screenshots.
3. Ask the user for visual acceptance of Task 4. Do not start Task 5 before approval.
4. Plan remaining milestones only after user approval. Task 5's exact scope and acceptance criteria are UNSURE in this handoff; consult the user's approved five-task plan or ask before implementation.
5. Address Gurugram-specific mock listings in the appropriate later approved task. Current Home explicitly labels its sample places “Cross-city demo listings; not verified Gurugram picks.”
6. Later integrations such as real FastAPI/PostgreSQL, verified place sources, maps/GPS/location permission, weather, and real events are not part of current Task 4 and require their own approval/plan.
7. Full City World interaction, Winter Wonderland, and custom Syne/Inter Tight font files are not implemented. Verify font licensing and Expo compatibility and get approval before adding font files.

## 9. Key decisions

- Reuse the existing Expo project and incrementally refactor; do not create a replacement project. This preserves working Expo Go setup and current user changes.
- Use feature-based Clean Architecture with thin Expo Router routes. Saved and Place Details remain functional while Map, Events, and Profile stay explicit placeholders.
- Use shared `PlacesProvider` state for saved IDs; do not create a second bookmark store.
- Use the supplied original layered PNG artwork rather than inventing or substituting images. Hero and preview use independent layer stacks and preserve aspect ratio with cover scaling.
- Metro requires asset-family paths without density suffixes. Physical files keep `@1x`/`@3x`; Metro locates all variants. This fixed the runtime-reported module resolution error without changing image content.
- Jest does not resolve Metro's suffix-free density families the same way. A test-only PNG mapper (`tests/mocks/assetMock.js`) keeps Jest independent of physical base-name files; Metro bundle remains the authoritative asset-resolution check.
- Reuse installed Reanimated `4.7.1`; no new animation dependency. Use ordinary alpha for beams; exact additive blending would need another renderer and is not claimed.
- Keep Home's available place cards labelled as cross-city sample data. Existing repository contents are not verified Gurugram recommendations.
- Do not install/unlock fonts or change typefaces beyond compatible system fonts until approved files/licensing are checked.

## 10. Known bugs and problems

- Resolved: iPhone runtime reported `Unable to resolve module '../../../../assets/images/scene/hero/hero_sky@3x.png' from 'src/features/home/presentation/city-scene-spec.ts'`. Metro skipped density-suffixed require basenames. The 20 paths now omit `@1x`/`@3x`, and Expo iOS export resolves all 20 scene layers.
- Open verification gap: no live Simulator run or post-fix screenshots. Prior environment diagnostics showed `CoreSimulatorService connection became invalid`, `simdiskimaged` unavailable, and CUA Simulator access timed out. These may be environment-specific; current status is UNSURE.
- Open product-data gap: mock listings are cross-city, not Gurugram-specific. Home labels them as unverified demo content. `src/data/mock-place-repository.ts` includes Bengaluru, Hyderabad, and Mumbai listings, with sample ratings, prices, distances, and remote Unsplash image URLs.
- Saved state lives in provider memory only and uses starter IDs `slow-bloom` and `green-mile`; persistence/auth/backend are not implemented.
- Automated Saved/navigation test uses a test-only screen switcher; it does not prove Expo Router runtime navigation. The user manually verified those flows previously on iPhone 16e.
- Beam glow uses alpha blending approximation, not additive blending.
- Home City World is a static product preview with scene animation only; no full City World interaction, live district data, or Winter Wonderland.

## 11. Things that went wrong

- Requiring physical names such as `hero_sky@3x.png` directly fails Metro's resolver even though the file exists. Use density-free `hero_sky.png` family paths in static requires.
- After changing to density-free paths, Jest initially failed because no physical `hero_sky.png` base file exists. The fix is the Jest PNG mapper plus `tests/mocks/assetMock.js`; do not create duplicate base PNGs or rename artwork.
- A first Metro export before the path fix reproduced the reported error. After the fix, export completed and listed all 20 scene assets.
- Earlier `xcrun simctl list devices available` could not connect to CoreSimulatorService and reported simdiskimaged errors. Do not reinstall Xcode, reset devices, kill unrelated processes, download runtimes, or modify global settings without approval.
- The active Codex working directory `/Users/kushalsharma/Documents/Codex/2026-11-18/desktop-pulsecity` was not the PulseCity Git repo. The actual app is `/Users/kushalsharma/Desktop/Pulsecity` (macOS path output sometimes capitalized it as `/Users/kushalsharma/Desktop/PulseCity`). Verify repo root before work.

## 12. Next step

1. Read this handoff and inspect `/Users/kushalsharma/Desktop/Pulsecity/AGENTS.md`.
2. Confirm the actual repo with `cd /Users/kushalsharma/Desktop/Pulsecity && git rev-parse --show-toplevel`; inspect `git status --short` and preserve every dirty file.
3. Do not edit code yet. Check Simulator/service access non-destructively. If available, run `npm start` or `npm run ios` using the current bundle and capture the four requested Home screenshots.
4. If Simulator remains unavailable, tell the user exact error and request their post-fix screenshots or an accessible Simulator session. Do not call Task 4 visually accepted.
5. Compare screenshots to approved references, report any remaining visual mismatches, and wait for user acceptance before Task 5.

## 13. Instructions for the next AI

- Read this whole file before writing any code.
- Start by summarizing the goal and next step in your own words.
- Do not change working code unless the task requires it.
- Ask before changing the structure, the database schema, or dependencies.
- Always give complete files when editing, not partial snippets.
