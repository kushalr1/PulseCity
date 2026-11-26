"""Adds Winter Wonderland to the package: hero winter shade strip, winter scenes in _export-manifest.json,
a 'winter' section in motion-spec.json. Values come from <scene>_winter_scene.json (written by the v2.3 renderer)
and from v2.3 scene.js / style.css (line references in the text)."""
import hashlib, json, os
import numpy as np
from PIL import Image
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
files = json.load(open(os.path.join(OUT, '_export_files_winter.json')))
sc = {s: json.load(open(os.path.join(OUT, f'{s}-winter', f'{s}_winter_scene.json'))) for s in ('hero', 'preview')}

# hero shade, winter (style.css last rule wins): rgba(8,16,36,.55) 0% -> .05 55% -> 0 70%
H = sc['hero']['H']; n = H * 3; t = np.arange(n) / (n - 1); a = np.interp(t, [0, .55, .70, 1], [.55, .05, 0, 0])
st = np.zeros((n, 3, 4), np.uint8); st[..., 0], st[..., 1], st[..., 2] = 8, 16, 36; st[..., 3] = np.round(a * 255)[:, None]
p = os.path.join(OUT, 'hero-winter', 'hero_winter_shade@3x.png'); Image.fromarray(st, 'RGBA').save(p, optimize=True)
if not any(f['file'].endswith('hero_winter_shade@3x.png') for f in files):
    files.append({'scene': 'hero', 'theme': 'winter', 'file': 'hero-winter/hero_winter_shade@3x.png', 'kind': 'sprite', 'sprite': 'shade', 'px': [3, n], 'pt': [1, H], 'bytes': os.path.getsize(p), 'density': 3})
json.dump(files, open(os.path.join(OUT, '_export_files_winter.json'), 'w'), indent=1)

Z = {'sky': 0, 'stars': 1, 'moon_glow': 2, 'moon': 3, 'ridge': 4, 'fog_band0': 5, 'far': 6, 'farCaps': 7, 'fog_band1': 8, 'mid': 9, 'midCaps': 10,
     'beam_column': 11, 'beam_halo': 12, 'metro': 13, 'train': 14, 'near': 15, 'snowman_body': 16, 'snowman_head': 16.1, 'snowman_front': 16.2, 'snowman_arm': 16.3,
     'flakes_small': 17, 'flake_big': 17.1, 'frost': 18, 'shade': 19}
ROLE = {'sky': 'Stretch to scene size (1 pt wide source)', 'ridge': 'Parallax layer', 'far': 'Parallax layer', 'mid': 'Parallax layer',
        'farCaps': 'Snow caps for far layer; same placement as far; opacity = snowAmt', 'midCaps': 'Snow caps + icicles for mid layer; same placement as mid; opacity = snowAmt',
        'metro': 'Parallax layer: track + pillars', 'near': 'Ground with snow drifts', 'moon': 'Moon disc', 'moon_glow': 'Radial glow, @1x scaled to glowR*2',
        'frost': 'Frost edge over whole scene (replaces the City World vignette); opacity = snowAmt', 'fog': 'Fog puff sprite (v2.3 own 128px sprite) stretched per fog band; used for fog_band0 and fog_band1',
        'flake_big': 'Large snowflake, 12x12 pt, rotated by flake phase', 'snowman_body': 'Snowman shadow + body (shared box with the other 3 parts)',
        'snowman_head': 'Snowman head + hat + face; rotates around head pivot', 'snowman_front': 'Scarf, left arm, buttons', 'snowman_arm': 'Waving right arm; rotates around arm pivot',
        'train': 'Moving sprite on the metro line', 'beam_column': 'District beam column (normal blend in winter)', 'beam_halo': 'District beam glow', 'shade': 'Hero top shade (winter colours), optional native gradient'}
man = json.load(open(os.path.join(OUT, '_export-manifest.json')))
for s, (mode, W, Hh) in {'hero': ('band', 390, 243), 'preview': ('panel', 358, 208)}.items():
    items = []
    for f in [f for f in files if f['scene'] == s]:
        k = f.get('layer') or f.get('sprite'); path = os.path.join(OUT, f['file'])
        e = {'id': f'{s}-winter.{k}', 'file': f['file'], 'zIndex': Z.get(k, Z.get('fog_band0') if k == 'fog' else None), 'role': ROLE[k], 'sizePx': f['px'], 'sizePt': f['pt'],
             'density': f.get('density', 3), 'bytes': os.path.getsize(path), 'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest()[:16]}
        if f['kind'] == 'layer': e.update({'parallax': f['parallax'], 'offsetYPt': f['offsetY_pt'], 'layerWidthPt': f['layerWidth_pt'], 'xOriginPt': 0})
        items.append(e)
    items.append({'id': f'{s}-winter.stars', 'file': None, 'zIndex': 1, 'role': 'Native white squares from motion-spec.winter.stars'})
    items.append({'id': f'{s}-winter.flakes_small', 'file': None, 'zIndex': 17, 'role': 'Native white circles from motion-spec.winter.snowfall'})
    man['scenes'][f'{s}-winter'] = {'v23Mode': mode, 'theme': 'winter', 'artboardPt': [W, Hh], 'artboardPx': [W * 3, Hh * 3],
        'assets': sorted(items, key=lambda x: x['zIndex']), 'totalBytes': sum(i.get('bytes', 0) for i in items),
        'decodedTextureBytes': sum(i['sizePx'][0] * i['sizePx'][1] * 4 for i in items if i.get('sizePx'))}
man['themes'] = {'city': ['hero', 'preview'], 'winter': ['hero-winter', 'preview-winter']}
man['notIncluded']['hero-winter.near'] = 'Empty in v2.3 (ground below the hero frame); the hero snowman stands on the mid baseline instead.'
json.dump(man, open(os.path.join(OUT, '_export-manifest.json'), 'w'), indent=1)

h, pv = sc['hero'], sc['preview']
mot = json.load(open(os.path.join(OUT, 'motion-spec.json')))
mot['winter'] = {
 'source': 'scene.js CityScene with theme winter (draw(), snowman(), snowfall(), fog()); values unchanged from v2.3',
 'sameAsCity': ['camera drift', 'stars (palette.stars = 0.55)', 'moon position/parallax', 'hero entrance', 'train', 'district pills', 'responsive rule', 'reduced motion'],
 'differences': {
   'beams': {'blend': 'normal (v2.3 uses source-over in winter) - matches exactly in React Native, NO opacity boost', 'columnOpacity': '0.3 * it * pulse', 'haloOpacity': '0.7 * it'},
   'moon': {'glowAlpha': 0.65, 'discAlpha': 0.9, 'note': 'baked into the winter sprites'},
   'vignette': 'none in winter; the frost edge replaces it',
   'heroShade': 'rgba(8,16,36,.55) 0% -> .05 55% -> 0 70% (hero_winter_shade@3x.png)'},
 'snowAmt': {'what': 'Snow intro amount 0..1. Multiplies opacity of farCaps, midCaps, snowman (whole), every snowflake and the frost edge.',
             'when': 'Only right after the user switches to Winter Wonderland (v2.3 winterIntro). Otherwise starts at 1.',
             'animation': 'linear 0 -> 1 over 1.4 s', 'reducedMotion': 'jump to 1'},
 'fog': {'sprite': 'fog@1x (white radial puff)', 'screenSpace': True, 'note': 'not affected by camera drift',
         'bands': {'band0': {'fogIndices': [0, 3], 'drawnAfter': 'ridge', 'alphaMultiplier': 0.1}, 'band1': {'fogIndices': [1, 4], 'drawnAfter': 'farCaps', 'alphaMultiplier': 0.12}},
         'unusedIndex': 'fog[2] exists in v2.3 data but is never drawn; kept out deliberately',
         'draw': 'for k in {-1, 0}: x = fog.x + k*2*W - 0.3*W, y = fog.y - fog.h, size fog.w x 2*fog.h, opacity fog.a * bandAlpha',
         'motion': 'fog.x += fog.v * 0.016 every animation frame in v2.3 (frame-based). At 60 fps that is fog.v * 0.96 pt/s; wrap fog.x modulo 2*W. Use the per-second value so speed does not depend on frame rate.',
         'hero': h['fogs'], 'preview': pv['fogs']},
 'snowfall': {'screenSpace': True, 'count': {'hero': len(h['flakes']), 'preview': len(pv['flakes'])},
              'small': 'white circle, radius 0.6 + 1.5*z pt', 'big': 'z > 0.93: flake_big sprite 12x12 pt centred on the flake, rotated by phase (radians)',
              'opacity': '(0.35 + 0.55*z) * snowAmt', 'vy': '14 + 34*z pt/s (down)', 'vx': 'sin(0.8*t + phase) * 8 * z pt/s',
              'respawn': 'when y > H + 6: y = -6, x = random(0..W)  (v2.3 uses Math.random here)', 'wrapX': 'x < -6 -> W + 6; x > W + 6 -> -6',
              'reducedMotion': 'flakes stay at their initial positions', 'hero': h['flakes'], 'preview': pv['flakes']},
 'snowman': {'screenSpace': True, 'note': 'fixed on screen (no camera parallax), exactly as v2.3 band/panel modes',
             'hero': h['snowman'], 'preview': pv['snowman'],
             'parts': 'snowman_body, snowman_head, snowman_front, snowman_arm share one box. Place each at left = x + box.x0*scale, top = y + box.y0*scale, size box.w*scale x box.h*scale; draw in that order.',
             'motion': {'wholeRotation': '0.3 * tilt around (x, y)', 'headRotation': 'tilt around (x + 0, y - 48*scale) (on top of the whole rotation)',
                        'armRotation': 'wave around (x + 9*scale, y - 33*scale) (arm sprite already includes its -0.6 rad rest angle)',
                        'tilt': '0.06 * sin(1.3*t)', 'tiltPeriodS': round(2 * 3.14159265 / 1.3, 3), 'wave': '0.5 * sin(2.4*t)', 'wavePeriodS': round(2 * 3.14159265 / 2.4, 3),
                        'opacity': 'snowAmt', 'reducedMotion': 'tilt = wave = 0'}},
 'frost': {'opacity': 'snowAmt', 'note': 'frost@1x stretched to the scene'}}
mot['sceneMembership']['hero-winter'] = ['camera', 'stars', 'moon', 'entrance', 'fog', 'snowfall', 'snowman', 'snowAmt']
mot['sceneMembership']['preview-winter'] = ['camera', 'stars', 'moon', 'train', 'beams', 'districtPills', 'fog', 'snowfall', 'snowman', 'snowAmt']
json.dump(mot, open(os.path.join(OUT, 'motion-spec.json'), 'w'), indent=1)
print('winter scenes added:', [k for k in man['scenes']], {k: (v['totalBytes'], v['decodedTextureBytes']) for k, v in man['scenes'].items()})
