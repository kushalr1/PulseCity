# Product decisions

## 2026-11-23 — Explore health and pet-clinic categories

- Keep Home's approved eight-item essentials grid unchanged. Add no Hospital, Health, clinic, lab, or vet Home tile. Pharmacy remains pharmacy-only.
- Add Hospitals, Clinics & Doctors, Diagnostic Labs, and Pet Clinics as Explore categories. They are available under All and through search aliases.
- Search aliases: `hospital`, `emergency` → Hospitals; `clinic`, `doctor`, `dr`, `physician` → Clinics & Doctors; `lab`, `diagnostic`, `test`, `blood test`, `pathology` → Diagnostic Labs; `vet`, `veterinary`, `pet clinic`, `pet doctor`, `animal hospital` → Pet Clinics.
- Resolve the longest, most specific phrase before its shorter words. For example, “animal hospital” maps to Pet Clinics rather than Hospitals.
- Clinics & Doctors, Diagnostic Labs, and Pet Clinics use fictional listings clearly labelled Demo. Do not show phone numbers, opening hours, “open now,” ratings, or availability for these listings.
- Hospitals must use real, verified Gurugram hospitals only; do not create fictional hospital listings. The verified user-supplied list was added on 2026-11-24. Coordinates are still pending, so the category has no map pins or distance values.
- The initially proposed emergency line was removed by the owner decision recorded below. Do not show emergency guidance on any health or pet-health category screen.

## 2026-11-24 — Hospital records and health directions

- Each hospital record contains only the supplied id, name, area, address, directionsQuery, source URLs, and verifiedOn date. There are no coordinates yet. Do not add phone, hours, rating, “open now,” availability, specialities, bed counts, or photos.
- Show the six supplied hospitals in Explore lists and search only. Hide map pins and km distances until verified coordinates are supplied.
- Label each as “Real place · address verified 24 Nov 2026”. Hospital directions hand off to Apple Maps or Google Maps using the supplied directionsQuery. Do not hand off directions for fictional Clinics & Doctors, Diagnostic Labs, or Pet Clinics listings; use the existing no-real-address message.
- This refines the 2026-11-23 health-category decision: hospital listings are verified real records, while the other three categories use clearly labelled fictional Demo listings.
- Search terms “hospital”, “emergency”, and each supplied hospital name find the matching real records. The word “emergency” is a search alias only, not emergency guidance.

## 2026-11-24 — Remove emergency copy from health screens

- Owner decision: remove “In an emergency, call 112.” from Hospitals and every other health-category screen. Do not replace it with other emergency text.
- PulseCity is a near-me recommendation app, not an emergency service. Keep this scope clear in the UI.
- Preserve hospital records, real-place verification labels, addresses, missing-coordinate behavior, and `directionsQuery` handoff. Keep “emergency” as a hospital search term; it does not produce emergency guidance.

## 2026-11-24 — Task 7 full-screen City World and Surprise Me

- Use `pulsecity-scene-assets-v2.0.zip` for the `full` surface. All six moods × both themes are integrated from the manifest; no full-screen mood/theme placeholders remain. Keep Home hero and preview on their already integrated assets.
- Keep Home and City World on one shared mood state. City World mood/theme changes cross-fade for 800 ms with the supplied mood glow boost; reduced motion swaps instantly.
- Full City World opens at Cyber City without drift. Horizontal panning follows the supplied 1:1 mid-layer camera maths and inertia; district selection eases to it, district pills follow manifest positions, and mood-specific beams use Gurugram listing counts.
- Winter snow amount fades over 1.4 seconds, uses five supplied snowmen and the full snowfall set. City and Winter scenes pause while unfocused; Home scenes unmount while City World is open.
- District detail uses Gurugram data and demo descriptions, with no ratings, prices, or hours. “Real map” opens the Map tab.
- Surprise Me uses only valid demo records, excludes all health categories, labels its result a demo suggestion, and follows the supplied search/lock sequence. Reduced motion shows the result immediately.
- While City World is open, Home scenes are unmounted; only the active full-screen set is mounted, plus the incoming set during a cross-fade. Pause scene clocks when unfocused.
- Manifest decoded-image estimates: 41.0 MB per City set and 52.6 MB per Winter set; a same-theme mood cross-fade can temporarily mount about 82.0 MB or 105.2 MB. These are package estimates, not runtime device measurements. Do not export @2x variants until the iPhone memory check shows pressure.

## 2026-11-23 — Home and Explore visual reference

- Use the 5:52 PM screen recording as the new visual reference for Home and Explore typography, light appearance, layout, and navigation flow. It supersedes earlier Home/Explore recordings where those visual details conflict.
- Keep prior product/content rules unless explicitly changed: Home remains an eight-tile grid, Pharmacy remains pharmacy-only, demo starts in Sector 29, Gurugram, and listings remain honest and clearly labelled.
- Home search must take the user to Explore with its field already focused and ready for typing after one tap; no second tap on the field.
- This reference decision does not change approved behavior for screens the recording does not show.

## 2026-11-23 — Hide weather in the UI

- Remove the weather/temperature chip from Home. It is absent from the approved Home design and currently overlaps the scene/search area.
- Show no weather anywhere in the app UI for now.
- Keep the Open-Meteo service, cache, and data-honesty rules in code for later re-enablement.
- This replaces the earlier decision to display a live Home weather chip.

## 2026-11-23 — Gurugram-only place content

- Do not show cross-city listings or invented ratings anywhere in the app.
- Use illustrations for place imagery; do not use stock photos.
- Task 5 replaces Home's legacy “Sample places” section with Gurugram “Tonight's picks”, Nearby, events, and Collections sections.
- Use only supplied or verified Gurugram data. Keep an honest empty state when suitable data is unavailable.
