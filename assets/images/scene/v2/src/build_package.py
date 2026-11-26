"""Builds manifest.json, motion-spec.json, color-tokens.json and the hero shade strip from the exporter's output.
Values come from <scene>_scene.json (written by the real v2.3 renderer) and from constants in v2.3 scene.js /
app21.js / style.css, quoted with their source line so they can be re-checked."""
import asyncio, hashlib, json, os
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
URL = 'http://127.0.0.1:8765/pulsecity-v2.3.html'
files = json.load(open(os.path.join(OUT, '_export_files.json')))
scene = {s: json.load(open(os.path.join(OUT, s, f'{s}_scene.json'))) for s in ('hero', 'preview')}

# ---- hero shade (style.css .home-hero .shade, city theme): rgba(7,16,26,.55) 0% -> .05 45% -> 0 70% -> 0 ----
H = scene['hero']['H']; n = H * 3
t = np.arange(n) / (n - 1)
a = np.interp(t, [0, .45, .70, 1], [.55, .05, 0, 0])
strip = np.zeros((n, 3, 4), dtype=np.uint8); strip[..., 0] = 7; strip[..., 1] = 16; strip[..., 2] = 26; strip[..., 3] = np.round(a * 255)[:, None]
Image.fromarray(strip, 'RGBA').save(os.path.join(OUT, 'hero', 'hero_shade@3x.png'), optimize=True)
files.append({'scene': 'hero', 'file': 'hero/hero_shade@3x.png', 'kind': 'sprite', 'sprite': 'shade', 'px': [3, n], 'pt': [1, H],
              'bytes': os.path.getsize(os.path.join(OUT, 'hero', 'hero_shade@3x.png')), 'density': 3})

async def palettes():
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto(URL); await pg.wait_for_timeout(500)
        r = await pg.evaluate("({CW_PAL, GEOM, FAC, DISTRICTS: DISTRICTS.map(d=>({id:d.id,short:d.short,x:d.x}))})"); await b.close(); return r
src = asyncio.run(palettes())

ROLE = {'sky': 'Stretch to scene width x height (1 pt wide source). Bottom of the gradient = palette sky[2].',
        'ridge': 'Parallax layer', 'far': 'Parallax layer (windows + haze baked in)', 'mid': 'Parallax layer (district buildings + lit windows baked in)',
        'metro': 'Parallax layer: track + pillars', 'near': 'Parallax layer: ground strip', 'moon': 'Moon disc, centred on moon position',
        'moon_glow': 'Radial glow behind moon, @1x source scaled to glowR*2 (smooth gradient, upscale is lossless in practice)',
        'vignette': 'Edge darkening over the whole scene, @1x source stretched to scene size', 'train': 'Moving sprite on the metro line',
        'beam_column': 'District beam: stretch to 12 pt x (districtTop-4) pt, anchored at top=0, opacity animated',
        'beam_halo': 'District beam glow at the beam base, 44x44 pt, opacity animated', 'shade': 'Hero top shade over the scene (under the UI). Optional: may be a native gradient instead.'}
Z = {'sky': 0, 'stars': 1, 'moon_glow': 2, 'moon': 3, 'ridge': 4, 'far': 5, 'mid': 6, 'beam_column': 7, 'beam_halo': 8, 'metro': 9, 'train': 10, 'near': 11, 'vignette': 12, 'shade': 13}

manifest = {'name': 'PulseCity City World scene assets', 'source': 'pulsecity-v2.3.html (scene.js CityScene, seeds rng(7) buildings/stars, rng(3) ridge)',
            'theme': 'city', 'mood': 'chill', 'referenceDevice': '390 pt wide phone, @3x', 'scenes': {}}
for s, (mode, W, Hh) in {'hero': ('band', 390, 243), 'preview': ('panel', 358, 208)}.items():
    items = []
    for f in [f for f in files if f['scene'] == s]:
        k = f.get('layer') or f.get('sprite'); path = os.path.join(OUT, f['file'])
        e = {'id': f'{s}.{k}', 'file': f['file'], 'zIndex': Z[k], 'role': ROLE[k], 'sizePx': f['px'], 'sizePt': f['pt'],
             'density': f.get('density', 3), 'bytes': os.path.getsize(path), 'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest()[:16]}
        if f['kind'] == 'layer': e.update({'parallax': f['parallax'], 'offsetYPt': f['offsetY_pt'], 'layerWidthPt': f['layerWidth_pt'], 'xOriginPt': 0})
        items.append(e)
    items.append({'id': f'{s}.stars', 'file': None, 'zIndex': 1, 'role': 'Native: 70 white squares from motion-spec.json stars[] (no image)'})
    manifest['scenes'][s] = {'v23Mode': mode, 'artboardPt': [W, Hh], 'artboardPx': [W * 3, Hh * 3],
                             'assets': sorted(items, key=lambda x: x['zIndex']), 'totalBytes': sum(i.get('bytes', 0) for i in items),
                             'decodedTextureBytes': sum(i['sizePx'][0] * i['sizePx'][1] * 4 for i in items if i.get('sizePx'))}
manifest['notIncluded'] = {'hero.near': 'Empty in v2.3: GEOM.band.near = 1.2 puts the ground below the hero frame.',
                           'cars, streetlights, snow, snowmen, fog, Surprise searchlight': 'Deferred scope (full-screen City World, Surprise Me, Winter).'}
json.dump(manifest, open(os.path.join(OUT, '_export-manifest.json'), 'w'), indent=1)

def sc(s):
    d = scene[s]; return d
hero, prev = sc('hero'), sc('preview')
motion = {
 'units': 'pt (points) and seconds; positions are in the scene artboard space (hero 390x243, preview 358x208)',
 'clock': 'One shared time t (s) per scene. Pause when the scene is off-screen or the screen is not focused (v2.3 stops drawing when not visible).',
 'easing': {'easeInOutCubic': 't<.5 ? 4t^3 : 1-(-2t+2)^3/2  (data.js ease)', 'easeOutCubic': '1-(1-t)^3  (data.js easeOut)'},
 'camera': {'source': 'scene.js step(): drift', 'speedPtPerS': 6, 'easing': 'linear', 'range': {'hero': [0, hero['maxCam']], 'preview': [0, prev['maxCam']]},
            'loop': 'ping-pong: direction flips to -1 at max, +1 at 0', 'start': {'cam': 0, 'direction': 1},
            'layerOffsetX': 'translateX = -cam * parallax (per layer, see manifest parallax)', 'parallax': src['FAC']},
 'stars': {'source': 'scene.js draw()', 'count': len(hero['stars']), 'colour': '#FFFFFF', 'shape': 'square, side = size pt',
           'x': '(((s.x*W*1.3 - cam*0.04) mod (W*1.3)) + W*1.3) mod (W*1.3) - W*0.15', 'y': 's.y * H',
           'opacity': 'palette.stars * 0.8 * (0.35 + 0.65*(0.5 + 0.5*sin(t*1.6 + s.phase)))', 'periodS': round(2 * 3.14159265 / 1.6, 3),
           'hero': hero['stars'], 'preview': prev['stars']},
 'moon': {'source': 'scene.js draw()', 'hero': hero['moon'], 'preview': prev['moon'], 'x': 'moon.x - cam*0.03', 'y': 'moon.y (fixed)',
          'note': 'In Chill this is a moon; other moods reuse the same disc+glow tinted with palette.glow (a sun in Active/Nature).'},
 'entrance': {'source': 'scene.js step()/draw()', 'appliesTo': 'hero only, on first app open (v2.3 passes entrance only to the Home band)', 'durationS': 1.8,
              'progress': 'e = clamp(t/1.8, 0, 1) (linear)', 'rise': '1 - easeOutCubic(e)',
              'far': {'translateY': 'rise * 20'}, 'mid': {'translateY': 'rise * 36', 'opacity': 'min(1, 0.15 + e*1.2)'}, 'others': 'no entrance motion'},
 'train': {'source': 'scene.js draw()', 'scene': 'preview', 'speedPtPerS': 60, 'easing': 'linear', 'y': prev['trainY'], 'sizePt': [90, 9],
           'x': 'trainX - 100 - cam*0.8, where trainX = (t*60) mod (metroLayerWidth + 200)', 'metroLayerWidthPt': prev['layerWidths']['metro'], 'loop': 'wraps, starts at trainX = 0'},
 'beams': {'source': 'scene.js draw() (mode panel)', 'scene': 'preview', 'perDistrict': prev['districts'],
           'x': 'd.x * midLayerWidth - cam*0.6  (midLayerWidth = %.3f); hide if x < -40 or x > W+40' % prev['layerWidths']['mid'],
           'intensity': 'it = 0.12 + min(2, matches)*0.36   (matches = places in that district matching the mood; data-driven, values above are the v2.3 demo data)',
           'column': {'rectPt': '[x-6, 0, 12, top-4]', 'opacity': '0.42 * it * pulse'}, 'halo': {'centre': '[x, top-4]', 'sizePt': [44, 44], 'opacity': '0.7 * it'},
           'pulse': '0.85 + 0.15*sin(t*3 + d.x*9)', 'pulsePeriodS': round(2 * 3.14159265 / 3, 3),
           'blend': {'v23': 'additive (canvas lighter)',
                     'reactNativeNoNewDeps': 'normal alpha blending with BOTH opacities x1.5 (clamped to 1). Fitted against v2.3 frames; see _reference/fidelity_report.json',
                     'normalBlendOpacityBoost': 1.5},
           'focus': 'Deferred scope (full City World): focused district it=1.6, others 0.08.'},
 'districtPills': {'source': 'app21.js posPills(), style.css .dpill', 'native': True, 'scene': 'preview',
                   'x': 'centre at d.x*midLayerWidth - cam*0.6; left = clamp(x - w/2, 6, W - w - 6)', 'y': 'base = clamp(d.top - 42, 88, H - 70); try base, base-42, base+42, base-84 to avoid overlap (36 pt rows, 6 pt gaps)',
                   'show': 'only districts with matches > 0, and 12 < x < W-12', 'style': 'height 34, radius 999, padding 0 12 0 9, 12.5/650, white text, bg rgba(7,16,26,.55), 1 pt inner border rgba(255,255,255,.16), 7 pt dot in mood colour with 8 pt glow'},
 'reducedMotion': 'No drift, train, twinkle, pulse or entrance: draw one frame at cam=0, t=0 (v2.3 sets dt=0).',
 'moodChange': {'note': 'Only Chill is exported. v2.3 cross-fades palettes over 0.8 s easeInOutCubic and re-renders layers; with baked PNGs, cross-fade two layer sets (opacity) when more moods are exported.'},
 'responsive': {
   'rule': 'Treat each scene as one artboard (hero 390x243 pt, preview 358x208 pt). Scale uniformly by k = max(viewW/artW, viewH/artH) ("cover"), anchor bottom-left, let the top of the sky crop. Apply k to every position, size and speed in this file.',
   'why': 'v2.3 regenerates the skyline per canvas size; freezing it at the reference artboard keeps the approved composition on every phone. Layers are wider than the artboard by maxCam*parallax, so with k >= viewW/artW the drift range [0, maxCam] never shows an edge.',
   'heroHeight': 'v2.3 hero height = safe-area top + 196 pt. The artboard uses 47 + 196 = 243. On devices with a larger inset, cover-scaling crops sky only.'}
}
json.dump(motion, open(os.path.join(OUT, 'motion-spec.json'), 'w'), indent=1)
json.dump({'source': 'scene.js CW_PAL (v2.3) - all moods kept for later exports', 'exported': {'theme': 'city', 'mood': 'chill'},
           'CW_PAL': src['CW_PAL'], 'GEOM': src['GEOM'], 'PARALLAX': src['FAC'], 'DISTRICTS': src['DISTRICTS']},
          open(os.path.join(OUT, 'color-tokens.json'), 'w'), indent=1)
json.dump(files, open(os.path.join(OUT, '_export_files.json'), 'w'), indent=1)
for s, m in manifest['scenes'].items(): print(s, 'files', sum(1 for a in m['assets'] if a.get('file')), 'bytes', m['totalBytes'], 'decoded', m['decodedTextureBytes'])
