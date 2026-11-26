# City World Final Approved Design

## Intent

Match PulseCity's approved 12:32 PM recording from 2026-11-24. Home mood and City World must stay in sync, and opening the Home preview must feel continuous because the preview train keeps moving through the transition.

## Goals

- Match the approved City World header, mood picker, intro copy, district selector, and actions.
- Keep selected mood shared between Home and City World. Mood changes scene artwork and inspiration while the interface stays stable.
- Keep Home preview copy, selected mood, matching district labels, and scene glow in sync; include Sector 29, Cyber City, and Galleria when supported by current mood data.
- Animate the Home preview into full-screen City World while the train continues moving. Preserve Home state until transition completes, then show full-screen scene.
- Return from City World with selected mood preserved.
- Keep all existing accessibility, reduced-motion, scene-pause, and no-fabricated-data rules.

## Non-goals

- Replacing the six-mood/two-theme full-screen assets or changing Surprise Me behavior.
- Showing the blue Expo development control as part of app UI. Source search confirms it is not an app component; it belongs to the development host. Use a clean preview/release run for visual sign-off.
- Changing Map, Explore, account, or other unrelated features.

## Approved behavior and visual details

### Home preview

- Keep the approved Home hero, eight essentials, and discovery sections.
- City World preview uses the shared selected mood for its eyebrow, scene lighting, district labels/beams, and inspiration list.
- Show only districts supported by mood-matched Gurugram data; expected reference labels include Sector 29, Cyber City, and Galleria when applicable.
- Home and City World show the same selected mood after navigation in either direction.

### Full-screen City World

- Header: close button, title **Explore the city**, mood picker at upper right.
- Intro: **ILLUSTRATED CITY · NOT TO SCALE** and **Pick a district. See what’s happening.**
- Mood picker opens a sheet with six moods and their descriptions. Selecting a mood updates artwork and suggestions without changing the screen layout or intro headline.
- District labels remain on the scene. A bottom district selector shows district names and short descriptions above the fixed **Surprise me** and **Real map** actions.
- Selecting a district opens its existing detail sheet. The chosen mood remains selected when returning Home.

### Preview-to-City-World transition

- Tapping the Home City World preview animates that preview into the full-screen scene.
- Keep the preview scene mounted and its train animation running during the transition. Do not replace the preview with a still frame.
- After the morph, hand off to the active full-screen mood/theme set and release the Home scene. Preserve reduced-motion behavior with a direct state change and no forced animation.

## Approaches

1. **Route-only replacement:** navigate to City World and animate its entrance. Rejected because it drops the moving Home train and reads as a different scene replacing the preview.
2. **Replace Home preview assets with full-screen assets:** rejected because the approved package keeps distinct Home preview and full-screen surfaces, and this changes approved Home artwork.
3. **Shared preview transition overlay (selected):** retain the live preview as a temporary overlay while it expands to the City World viewport, then cross-fade into the existing full-screen set. This preserves train motion and keeps both asset surfaces intact. Cost: a short-lived transition layer and explicit handoff state.

## Constraints and implementation calls

- Keep Expo Router and feature-based architecture.
- Use existing Reanimated; add no dependency.
- Preserve all dirty working-tree changes. Do not reset, clean, commit, or push.
- Work on existing `feature/pulsecity-approved-video` branch.
- Hide no host-level Expo UI through app code. Confirm visual screenshots in a clean preview/release run if the host overlay remains.
- Add regression tests before implementation and run tests, lint, typecheck, and Expo export where available.

## Acceptance

- Home preview mood, copy, labels, and picks match selected mood.
- Full-screen controls and hierarchy match the approved recording.
- Mood changes cross-fade without a black gap or duplicated interface copy.
- Home preview train keeps moving through opening transition.
- Home scene unmounts after transition; full-screen scenes pause when unfocused.
- Returning Home retains selected mood.
- Reduced motion skips animated transition without losing state.
