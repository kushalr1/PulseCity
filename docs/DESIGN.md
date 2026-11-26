# PulseCity approved design, as built

Updated: 2026-11-26. This document combines the approved v2.3 recordings, later owner decisions, and current implementation. Owner decisions in `docs/DECISIONS.md` override earlier conflicting design copy.

## Product and location

- PulseCity helps people find nearby places and events in Gurugram. The demo start area is **Sector 29, Gurugram** for guests and signed-in demo users. No location prompt appears at launch.
- The area control opens an area picker. “Use my location” requests permission only after a tap. If denied or unavailable, retain the selected area and label distances as approximate/from that area. Outside coverage, show **Coming soon**.
- Sign-in is demo-only. Never send or store real credentials. Browsing never requires login; the demo session persists until sign-out. Signing out does not delete saved places/events.
- Places/events and scene suggestions stay clearly identified as demo, except the six supplied verified real hospitals. Never fabricate ratings, hours, prices, live event facts, addresses, availability, or travel times.
- The Open-Meteo service and 15-minute cache remain implemented for later use, but owner decision removes the weather chip: **show no weather in the UI**.

## Home

- Home uses the 5:52 PM recording as its current visual reference for typography, light appearance, layout, and flow. Earlier reference images are superseded where they conflict.
- The hero is 390 pt wide by **196 pt plus the safe-area top inset**. Greeting uses Syne Bold at 28 pt; hero headline follows approved copy. Hero contains no metro, train, or beams.
- Header shows Gurugram and selected area, with Appearance palette, Saved bookmark, and Notifications bell controls. The area line “Starting area” and weather chip are absent.
- Search is **358×54 pt**, radius 16, overlaps the hero bottom by 27 pt, and reads “Search places, services, events…”. One tap opens Explore with the field focused and keyboard ready. Query carries Explore ⇄ Map; category shortcuts start a fresh query.
- Everyday essentials has exactly eight tiles: Pharmacy, Grocery, Cafés, Salons, Markets, Mobile repair, Gyms, Parks. Pharmacy remains pharmacy-only. No health/hospital tile is added.
- Home order after essentials: “This evening” inspiration panel, Nearby, Happening this week, Collections. There is no “Sample places” section, cross-city fixture, stock photo, or invented rating.

### “This evening” panel and mood chips

For a 390 pt viewport with three picks, the measured card is **x=16, width=358, height=581.5 pt**, radius 24, background `#07101A`, clipped overflow. Gap from essentials grid to panel is 28 pt; panel to Nearby header is 30 pt.

| Panel part | Approved measurement/style |
|---|---|
| Scene preview | 358×208 pt, cover scaled, bottom-left anchored |
| Overline | “LATER TODAY · {MOOD}”, x=18, top=16; Inter Tight 12/650, tracking about 1.2 |
| Headline | “This evening”, Syne Bold 23 pt, line height 24, 6 pt after overline |
| Body | 14 pt top and bottom padding |
| Mood row | 40 pt high |
| Pick block | 218 pt total; 3 rows about 70 pt each; 52×52 pt illustration, radius 12, 12 pt gap; bookmark 40×40 pt |
| Actions | 46 pt high, 14 pt radius, 8 pt gap, equal widths |
| Caption | 10 pt below actions; Inter Tight 12.5/17.5, centered |

Height accounting from Pass 3: scene 208 + body gap 14 + mood row 40 + pick block 218 + action row 60 (including vertical spacing) + caption gap 10 + caption 17.5 + bottom 14 = **581.5 pt**.

Mood chips order: Chill, Social, Nature, Active, Foodie, Explore. Each is 40 pt tall, pill radius, 10 pt left/14 pt right padding, 7 pt dot-to-label gap. Selected: white background and dark text; unselected: translucent white fill and border. Dot is 10×10 with mood colour and glow. Label: Inter Tight SemiBold, 13.5 pt/18. The six colours are Chill `#8FE3D0`, Social `#FF7DB0`, Nature `#CFF27F`, Active `#8FD3FF`, Foodie `#FFC46A`, Explore `#C3A8FF`. Press scale is 0.95. On Android, use font padding off and centered text; glow may use a blurred circle or be omitted.

Mood ranks Home picks and collections and shapes City World district suggestions/beams only. It never filters essentials, Explore, Search, or Map. Empty mood results must be honest and label mood-selected sections.

## Scenes, mood transitions, and navigation

- v2.0 scene package supplies all six moods × City/Winter themes for hero, preview, full-screen City World, and Surprise Me. Home hero never has metro/train. The City World preview/full scene includes train and motion from the supplied manifest/spec.
- Mood is one shared Home/City World state. Mood transition uses one progress value, **800 ms, `easeInOutCubic`**. Scene colours, opacity and window-light state derive from that same progress. Lights switch progressively, not as an instant density swap. Latest mood wins without restarting from a blank frame. Reduced motion jumps to the destination state.
- The hero and panel are visibility-gated: an off-screen surface keeps the pending mood; when it becomes visible, transition starts promptly. A surface already visible starts immediately on the mood tap. No scroll-end wait. Home scene clocks pause when unfocused; Home scene surfaces unmount while City World is open.
- Full City World starts at Cyber City, with no camera drift. Horizontal drag follows the finger 1:1 on the mid layer and has release inertia. Selecting a district glides camera to it, raises its beam to 1.6, dims others to 0.08; all district pills follow the manifest. City World includes cars and near foreground; Winter has five snowmen and winter layers. Keep about 20 pt on the left edge available for iOS swipe-back.
- Tapping the preview opens City World as a **slide-up from the bottom**; close slides down and returns Home at its previous scroll position. Scene transition overlay should expand the same preview scene so the train motion feels continuous. The current recording still has a dark handoff frame and does not prove this continuity matches the approved recording.
- Mood changes cross-fade City World sets over 800 ms and use the supplied `glowBoost`. Only active and incoming sets are mounted during a cross-fade; off-focus animations pause.
- District details use Gurugram records and demo descriptions, no ratings/prices/hours. “Real map” opens the Map tab.
- Surprise Me searches for 1.5 s (0.7 s on repeat), locks for 0.45 s, then shows a result card. City uses the searchlight cone; Winter uses swirling snowflakes. Tap skips; reduced motion jumps to the result. Pick only valid demo records, never health categories, and label as a demo suggestion.
- Place detail pushes from the right; Back returns to prior Home position. Detail image is the exported illustration with exact tag **“Illustration — not a photo of this place”**.

## Assets, illustrations, and data honesty

- City/Winter scenes: package v2.0 in `assets/images/scene/v2/`; generated static scene registry. v2.1 `_unlit` far/mid layers remain the building bases; v2.2 grey `_thr`/`_cov` data drives the Skia shader. v2.2 replaced colour-coded v2.1 light data because colour conversion caused haze and threshold errors.
- `litCode` uses knots `lit=[0,.10,.12,.24,.38,.50,.58,.80,1]` and byte code `[0,26,31,61,97,128,148,204,255]`. The shader lights a window when its threshold is below this code and uses coverage for alpha. This calibration yields mood-specific density; debug-all uses 255.
- Places use `assets/illustrations/places/<theme>/<id>@3x.png`, 52×52 pt, radius 12, cover. Events and collections use the city exports. Hospitals retain a category icon.
- Search shows place/service results first, then at most 2–3 matching upcoming events in a separate group; “See all in Events” carries the query. Past events never appear in search.
- Home city content uses Gurugram data only. Saved IDs and cached name/category/area persist in AsyncStorage; hydrate before first screen; if storage hydration fails or times out, defaults are Sector 29 and empty saves, log error, and do not overwrite real stored saves when late hydration completes.

## Explore health categories and hospitals

Explore categories, reachable through All and search only: Hospitals, Clinics & Doctors, Diagnostic Labs, Pet Clinics. Search aliases: hospital/emergency; clinic/doctor/dr/physician; lab/diagnostic/test/blood test/pathology; vet/veterinary/pet clinic/pet doctor/animal hospital. Specific pet phrases take precedence over “hospital”.

No health or pet-health screen displays emergency guidance, including “In an emergency, call 112.” Human and pet health demo listings have no phone, hours, “open now”, rating, availability, or directions. Clinics, labs and pet clinics are fictional, labelled Demo.

Hospitals are only these six user-supplied real records: Medanta – The Medicity (Sector 38), Fortis Memorial Research Institute (Sector 44), Artemis Hospital (Sector 51), Max Hospital, Gurugram (Sector 43 / Sushant Lok 1), Paras Hospitals, Gurugram (Sector 43 / Sushant Lok Phase 1), Civil Hospital, Sector 10 (Government) (Sector 10). Each has only supplied name, area, address, source URLs, verifiedOn, and `directionsQuery` (plus internal id). Label “Real place · address verified 24 Nov 2026”. No coordinates are supplied: list/search only, no map pins, no km distance; show area. Directions hand off using the supplied `directionsQuery`. Do not add other hospital records or fields.

## Map and platform rules

Map is still a placeholder tab. Approved implementation is `react-native-maps` with OSM `UrlTile` and visible © OpenStreetMap contributors attribution, demo only, no tile prefetch/offline caching. Free pan; no snap-back to Sector 29. Only a user pan reveals “Search this area”; category changes never move camera; camera persists across tab switches. Radius-fit zoom clamps 10–16; Open in Map is zoom 16 for a landmark and 14 for an area. Never disable pinch zoom or rerender/move the map mid-gesture; sheet must not block map gestures. Directions hand off to Apple Maps on iOS / Google Maps when available on Android for real landmarks only; fictional listings show the no-real-address message.

All inputs are at least 16 pt; tap targets are at least 44 pt. Syne and Inter Tight are bundled from Expo Google Fonts with OFL licenses. Inter Tight renders `₹`, `≈`, and `·` explicitly; no system font fallback.

## Differences from approved v2.3 / not yet accepted

- City World opening still shows a dark handoff frame before full art appears; the approved continuous train/scene morph is not verified.
- Exact Surprise Me timing and Try Again loop need a fresh comparison recording.
- City World close slide, district sheet camera glide, and place-detail push/back were seen in simulator evidence but require timestamped comparison against approved clips.
- Pin location icon treatment and cold-reload white flash remain open comparisons. Hero skyline scale looked close but has not been confirmed with a same-frame overlay.
- Map, Events, Profile tabs remain placeholders; real map gesture, marker, OSM and directions behavior has not been completed or accepted.
- Final sign-off for animated scenes and map gestures waits on a physical iPhone review.

For work status, acceptance criteria, and Android follow-ups, see `docs/TASKS.md`. Owner decisions are recorded in `docs/DECISIONS.md`.
