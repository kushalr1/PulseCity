# Match Final Approved City World Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Match the approved 2026-11-24 City World reference, including mood controls, district choices, and live-train preview transition.

**Architecture:** Keep existing Expo Router and feature-based layers. Share mood and transition state through focused providers; retain v1.2 Home preview and v2.0 full-screen art. Use Reanimated for a temporary preview expansion and scene handoff.

**Tech Stack:** Expo SDK 58, React Native, Reanimated 4, Expo Router, Jest.

**Spec:** `docs/superpowers/specs/2026-11-24-city-world-final-approved-design.md`

## Global Constraints

- Preserve the dirty working tree; do not reset, clean, commit, or push.
- Stay on `feature/pulsecity-approved-video`.
- Keep Home and City World on one shared mood.
- Mood affects inspiration and City World only, never Search, Explore, Map, or essentials.
- Keep current Home and full-screen scene asset surfaces; do not recolour art.
- Honor reduced motion, focus pausing, and Home scene unmount after transition.
- Every code behavior change gets a failing regression test before implementation.

## Review Focus

- Rapidly changing mood during an active cross-fade must not leave stale text or a black frame.
- Opening City World while Home preview is off-screen must not expand from stale layout coordinates.
- Back navigation during transition must release overlay and keep mood state.
- Reduced motion must bypass animation while navigating to correct selected mood.
- A mood with no matching districts must not show unrelated district pills.

---

### Task 1: Match full-screen City World controls and layout

**Files:**
- Modify: `src/features/city-world/presentation/city-world-screen.tsx`
- Modify: `src/features/city-world/application/city-world-logic.ts` only if a pure district-selector model is needed
- Test: `tests/features/city-world.behavior.test.tsx`

**Interfaces:**
- Consumes: existing `useCityWorldMood`, `getFullSceneAssets`, `districtPlaces`, and full-screen scene renderer.
- Produces: approved top header and mood sheet; stable intro; bottom district selector with descriptions; fixed Surprise me and Real map actions.

- [x] Step 1: Add regression tests for approved header labels, six-choice mood sheet, district selector content, and selected mood persistence.
- [x] Step 2: Run focused test and confirm it fails because current screen uses bottom mood pills and lacks approved labels/selector.
- [x] Step 3: Implement approved City World composition using existing design tokens and data.
- [x] Step 4: Run focused tests and confirm they pass.
- [x] Step 5: Run full Jest suite, lint, and TypeScript check; report results.

### Task 2: Synchronize Home preview with shared mood

**Files:**
- Modify: `src/features/home/presentation/home-screen.tsx`
- Modify: `src/features/home/presentation/city-scene.tsx`
- Modify: `src/features/home/presentation/city-scene-spec.ts` only for data-driven mood district markers
- Modify: `src/features/home/scene-registry.ts`
- Test: `tests/scene-registry.behavior.test.tsx`
- Test: `tests/features/home-city-world-preview.behavior.test.tsx`

**Interfaces:**
- Consumes: shared `useCityWorldMood`, current Home scene assets, Gurugram place fixtures.
- Produces: mood-aware preview copy, lighting, beams, and district labels, plus three approved districts when matching data exists.

- [x] Step 1: Add failing tests proving Home preview selection and labels follow the shared mood, include Galleria when supported, and omit unmatched districts.
- [x] Step 2: Run focused tests and confirm they fail on current Chill-only registry and fixed copy/labels.
- [x] Step 3: Implement mood-aware Home preview while retaining approved v1.2 artwork and scene motion.
- [x] Step 4: Run focused tests and confirm they pass.
- [x] Step 5: Run full Jest suite, lint, and TypeScript check; report results.

### Task 3: Keep preview train moving through City World opening

**Files:**
- Modify: `src/features/home/presentation/city-scene.tsx`
- Modify: `src/features/home/presentation/home-screen.tsx`
- Modify: `src/features/city-world/presentation/city-world-screen.tsx`
- Modify: shared route/provider only if transition ownership requires it
- Test: `tests/features/city-world-transition.behavior.test.tsx`

**Interfaces:**
- Consumes: measured Home preview bounds, current train animation progress, selected mood/theme, and City World route.
- Produces: transition state that preserves the moving preview until expansion completes, then releases Home scenes and shows full-screen art.

- [x] Step 1: Add a failing test for transition bounds and reduced-motion behavior before implementation.
- [x] Step 2: Run focused test and confirm the transition model is missing.
- [x] Step 3: Implement shared transition overlay/state with Reanimated. Under reduced motion, bypass expansion and navigate directly with mood preserved.
- [x] Step 4: Run focused tests and confirm they pass.
- [x] Step 5: Run full Jest suite, lint, and TypeScript check; report results.

### Task 4: Final visual verification

**Files:**
- Review changed files and approved design spec.

- [x] Step 1: Run iOS asset export and inspect output.
- [ ] Step 2: Launch on iPhone 16e simulator if available; compare Home, mood sheet, City World, district detail, return navigation, and train transition with approved recording. CoreSimulatorService was unavailable.
- [x] Step 3: Report exact checks run, visual gaps, and untested real-device behavior. Do not claim screenshots if simulator capture is unavailable.
