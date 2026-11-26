# PulseCity handoff

Last updated: 2026-11-26

## Project and working state

PulseCity is a Gurugram near-me discovery app. The current milestone builds Home, Explore, saved places, location selection, full-screen City World, and Surprise Me on Expo Router with feature-based architecture. The backend is deferred; places, events, and suggestions are demo data except for the six owner-supplied verified hospital records.

- Repository: `/Users/kushalsharma/Desktop/PulseCity`
- Branch: `feature/pulsecity-approved-video`
- The working tree is intentionally dirty and contains pre-existing code, asset, and evidence changes. Preserve it. Do not reset, clean, commit, or push.
- Start Metro from the repo root with `npx expo start -c`.
- iPhone 16e simulator UDID used for the latest audit: `09AE1D69-2F61-48F0-8785-B7077E793360` (iOS 26.2).
- Expo Go map spike instructions are in `docs/TASKS.md`; hidden route: `/map-test`.

### Development window-light flags

These flags are read only in development (`__DEV__`). Restart Metro with the flag in its environment, for example `EXPO_PUBLIC_LIGHTS_TEST=red npx expo start -c`.

| Flag | What should appear |
|---|---|
| `EXPO_PUBLIC_LIGHTS_TEST=raw` | Plain Skia image for `preview_mid_lights@3x.png`, without a shader, at the mid-layer placement. It is an opaque magenta data image with the green window pattern, so it should cover the mid-building band. It checks image loading and placement. |
| `EXPO_PUBLIC_LIGHTS_TEST=red` | The normal lights Rect/Group/transform rendered with a constant solid-red shader. A red band over the mid buildings checks Canvas z-order, transforms, and clipping. |
| `EXPO_PUBLIC_LIGHTS_TEST=mask` | The coverage image’s green channel shown as grayscale (`half4(d.g, d.g, d.g, d.g)`). White windows on black check the image shader and local coordinates. |
| `EXPO_PUBLIC_LIGHTS_TEST=ramp` | The v2.2 grayscale calibration ramp and its readback log. Correct calibration is 100% green; the console logs sampled `floor(v)` and any incorrectly decoded columns. |
| `EXPO_PUBLIC_WINDOW_LIGHTS_DEBUG_ALL=1` | Forces every window on (`litCode = 255`) without the old data-image wash. Shows a `LIGHTS DEBUG: all` badge. Use alone for normal shader rendering. |

`raw`, `red`, `mask`, and `ramp` also display their corresponding visible debug badge. If a mode produces no band, use the expected-layer descriptions above to isolate image/placement, draw order, or shader coordinate problems. These are diagnostics, not proof that normal mood rendering is correct.

## Architecture map

Expo routes stay thin; feature logic lives under `src/features` and state/service adapters under `src/providers` and `src/data`.

| Responsibility | Main files |
|---|---|
| Root app, fonts, bootstrap, navigation | `src/app/_layout.tsx`, `src/providers/app-bootstrap-provider.tsx`, `src/providers/app-bootstrap.ts` |
| Home UI and discovery sections | `src/features/home/presentation/home-screen.tsx`; Home selection and visibility logic in `src/features/home/application/`; events and collections in `src/features/home/domain/` |
| City World and Surprise Me | `src/features/city-world/presentation/city-world-screen.tsx`, `src/features/city-world/application/city-world-logic.ts`, route `src/app/city-world.tsx` |
| Skia scene renderer | `src/features/home/presentation/city-scene.tsx`, `winter-city-scene.tsx`, `window-lights-canvas.tsx`, `window-light-shader.ts`, `scene-transition-layer.tsx` |
| Full scene data | `src/features/home/scene-registry.ts`, `src/features/home/scene-assets-v2.ts`, `src/features/city-world/full-scene-assets.ts` |
| Home-to-City-World transition | `src/providers/city-world-transition-provider.tsx`, `src/features/home/application/city-world-transition.ts`, `src/features/home/presentation/city-world-transition-overlay.tsx` |
| Shared mood state and transitions | `src/providers/city-world-mood-provider.tsx`; interpolation and `litCode` in `src/features/home/application/window-light-transition.ts` |
| Transition progress diagnostics | `src/features/home/presentation/use-scene-transition-progress-log.ts` (logs surface, `mountId`, mood keys, progress, opacity, `litCode`, and window colour at 0/.25/.5/.75/1 buckets) |
| Scene preload/cache | `src/features/home/application/scene-preloader.ts`; caches decoded `SkImage`s by static asset source and preloads Home or full sets |
| Window light asset registry | `src/features/home/window-light-assets.ts`; debug mode selection in `src/features/home/application/window-light-debug-mode.ts` |
| Places, Explore, saved state | `src/features/places/`, `src/data/mock-place-repository.ts`, `src/providers/places-provider.tsx`, `src/features/storage/` |
| Health categories and verified hospitals | `src/features/places/application/hospital-search.ts`, `src/features/places/domain/hospital.ts`, `src/data/verified-hospitals.ts` |
| Illustrations | `src/features/places/presentation/place-illustration.tsx`, generated static map in `src/features/home/presentation/home-illustration-assets.ts`; files under `assets/illustrations/` |
| Location and weather services | `src/features/location/`, `src/features/weather/` (weather is intentionally hidden in UI) |

### Assets and window-light shader

- Full City World/Winter/Surprise art: `assets/images/scene/v2/`, generated registry in `src/features/home/scene-assets-v2.ts`. Uses the user-provided v2.0 package for all six moods and both themes. Home hero excludes metro, train, and beams; preview and full surfaces use their own layers.
- v2.1 `_unlit` far/mid building layers are the clean bases below the window overlay. They remain in the package, but the v2.1 encoded light-data image is superseded.
- v2.2 grey threshold/coverage images are registered in `src/features/home/window-light-assets.ts`. `_thr` encodes window activation threshold; `_cov` encodes window coverage/alpha. Grey channels avoid the colour-space shifts that broke v2.1 colour-coded data.
- `window-light-shader.ts` samples `thr` and `cov`; a window lights when its decoded threshold is below the current `litCode`, and its alpha uses coverage. `window-light-transition.ts` maps fractional mood `lit` values through knots `[0,.10,.12,.24,.38,.50,.58,.80,1]` to byte codes `[0,26,31,61,97,128,148,204,255]`. This gives each mood its designed light density. Debug-all sets `litCode=255`.
- Illustration export v2.3 is under `assets/illustrations/`: use `places/<theme>/<id>@3x.png` (52×52 pt thumbnail, radius 12, cover), plus `events/city/` and `collections/city/`. Detail hero keeps the exact label “Illustration — not a photo of this place”. Hospitals use their category icon, not a fictional illustration.
- License notices for Syne and Inter Tight are in `assets/licenses/`; fonts are bundled through `@expo-google-fonts` and loaded before first screen.

## Pass 3–9 status

Status is against the spec’s required behavior and the evidence available in this repo. “Simulator verified” means an observed simulator recording/test, not real-device approval.

| Pass | Scope | Status |
|---|---|---|
| 3 | Home panel measurements, mood chips, motion smoothness, visibility-gated hero transition, navigation motion, acceptance flow | **Partial; simulator verified in parts.** Panel composition/chips and major flow were recorded. Opening handoff still has a dark frame; train continuity is not verified as matching the approved recording. |
| 4 | v2.1 unlit/light data, shared 800 ms transition, visibility-aware hero and panel work | **Done, simulator verified in later passes, with v2.1 light data subsequently replaced.** See Pass 6+ for current grey data. |
| 5 | Diagnose/rebuild missing window lights; fix immediate mood updates while panel is visible | **Done, simulator verified in later transition recordings;** superseded shader input corrected in Pass 6. |
| 6 | v2.2 grey `thr`/`cov`, `ramp` calibration, preload and one-clock mood transition | **Implemented and covered by tests; simulator-recorded mood transitions exist.** Latest full-device calibration / every debug mode is not independently re-run for this handoff. |
| 7 | Shared mood consistency, Home timing/tower flash; exact light switching motion reference | **Implemented; simulator recording/log evidence exists.** Review the saved pass7 evidence/spec before claiming every frame is exact. |
| 8 | Home uses same transition component/hook as City World, no mood-change remount | **Implemented; simulator recording and `mountId` progress logging requested and present.** Latest final recording does not establish all timing details by itself. |
| 9 | Home panel and hero transition parity with City World; progress logs | **Implemented; current Jest/type/lint pass.** The final simulator audit still shows a dark frame during City World handoff; reload flash and exact approved hero timing remain open. |

## Current known differences and open bugs

1. **City World opening continuity:** latest full flow contains a dark/mostly blank frame during the transition (around 00:65 in `review-evidence/pass9-self-audit/final-self-audit.mov`); city art appears by about 00:66–00:67. The route is configured for slide-from-bottom, but the approved preview-to-full train/scene continuity is not verified. Relevant code: `src/features/home/presentation/home-screen.tsx` around lines 131–149 (measure and start transition), `src/features/home/presentation/city-world-transition-overlay.tsx`, and `src/features/city-world/presentation/city-world-screen.tsx` around lines 161–172 and 324–333.
2. **Close motion:** final recording shows Home’s prior scroll position restored, but only a short handoff sample. City World close uses `router.back()` at `src/features/city-world/presentation/city-world-screen.tsx:324`; confirm the full slide-down motion and no remount on a fresh device recording.
3. **Surprise Me:** search, skip, and a result card are visible in the final simulator audit. Exact timing/motion against the approved strip and Try Again loop still need review. Implementation is in `src/features/city-world/presentation/city-world-screen.tsx` around lines 222–291, with the candidate/timing logic in `src/features/city-world/application/city-world-logic.ts`.
4. **District sheet camera glide:** district selection and sheet appeared in the audit; measure camera glide/beam response against approved recording again. `city-world-screen.tsx` owns focus and modal sheet behavior.
5. **Hero location icon:** current screenshot shows a pin-in-ellipse treatment; compare against approved v2.3 and adjust if still different. `src/features/home/presentation/home-screen.tsx` `HeroHeader` implementation (search for `HeroHeader`).
6. **Hero skyline scale:** looked close in latest recording but not confirmed against a matched reference frame. Renderer/spec: `src/features/home/presentation/city-scene.tsx`, `src/features/home/presentation/city-scene-spec.ts`.
7. **White flash on reload:** not verified on a cold app reload. Root readiness/preload flow is `src/app/_layout.tsx:26–69` and `src/features/home/application/scene-preloader.ts`.
8. **Map, Events, Profile tabs:** intentionally placeholders, not failures for the earlier milestone. Routes are `src/app/(tabs)/map.tsx`, `events.tsx`, `profile.tsx`. Map implementation belongs to Task 8; events inbox/profile to Task 9.
9. **Real device acceptance:** map pan/pinch and animated-scene final approval on a physical iPhone remain outstanding.

## Verification commands and latest known results

Run from repo root:

```sh
npm test -- --runInBand
npx tsc --noEmit
npm run lint
xcodebuild test -project PulseCityAudit.xcodeproj -scheme PulseCityAudit -destination 'platform=iOS Simulator,id=09AE1D69-2F61-48F0-8785-B7077E793360' -only-testing:PulseCityAuditUITests/AuditTests/testFullApprovedFlow -quiet
```

Latest available results: Jest **20 suites / 117 tests passed**; TypeScript `npx tsc --noEmit` passed; `npm run lint` passed without warnings; focused iPhone 16e XCUITest `testFullApprovedFlow` passed **1 test**. Simulator evidence includes `review-evidence/pass9-self-audit/final-self-audit.mov` (about 112 seconds) and other clips in that directory. Results were gathered during the previous implementation turn, not rerun while writing this handoff. The XCUITest is an automated flow, not visual sign-off. The ongoing dirty worktree may contain later edits; rerun these commands before relying on the result.

`npm test -- --runInBand` duplicates the script’s serial option but works; canonical script is `npm test`. For a current result, use `npm test`, `npx tsc --noEmit`, and `npm run lint`.
