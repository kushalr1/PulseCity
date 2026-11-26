# PulseCity illustrations (exported from the approved v2.3 prototype)

These are the per-place, per-event and per-collection illustrations from `pulsecity-v2.3.html`. They are rendered from its `artSVG()` generator **unchanged**, so they are the same pictures as in the approved recording. For example, Galleria Market shows market stalls and Kettle & Kulhad shows a café counter.

They are **illustrations, not photos of the real places**. Wherever one is shown large (the place detail hero), keep the label **"Illustration — not a photo of this place"**, as v2.3 does.

## Contents

| Folder | Files | Used for |
|---|---|---|
| `places/city/` | 26 | "This evening" pick thumbnails (52×52, radius 12), Nearby/Explore cards, place detail hero, Surprise result card, map preview card |
| `places/winter/` | 26 | The same, when the Winter Wonderland theme is on (v2.3 uses a winter variant of each illustration) |
| `events/city/` | 9 | Event cards and the featured event |
| `collections/city/` | 5 | Collection cards |

- Every file is `<id>@3x.png`: **1200 × 780 px**, which is **400 × 260 pt @3x**.
- The `id` is the same id as in the app's demo data (`PLACES`, `EVENTS`, `COLLECTIONS`), for example `kettle`, `galleria`, `leisure-valley`.
- `illustrations-manifest.json` lists every file with its id, name, category, theme and `kind` (real place or demo listing for places).

## How to display

- Use `expo-image` with `contentFit="cover"` and `contentPosition="center"`. This matches v2.3's `preserveAspectRatio="xMidYMid slice"`.
- **Pick-row thumbnail:** 52×52 pt, `borderRadius: 12`, cover. It shows the centre crop of the illustration.
- **Detail hero:** full width, cover, with the "Illustration — not a photo of this place" tag at the bottom-right.
- **Choose the theme folder from the current appearance.** Fall back to `city` if a winter file is missing.
- Bundle them with static `require()`: build a generated map file `{ [id]: { city: require(...), winter: require(...) } }`. Metro cannot do dynamic requires.

## Not included

- The 6 verified hospitals added after v2.3 have no illustration in v2.3. Keep their category icon. Do not invent a picture.
- The extra gallery variants on the detail page (`<id>ed0…`, review photos) are not included. Use the main illustration only.
