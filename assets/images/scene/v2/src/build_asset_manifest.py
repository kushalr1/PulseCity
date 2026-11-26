"""Builds asset-manifest.json (the integration manifest) from manifest.json + motion-spec.json.
Adds per-scene element membership, responsive scaling rules and React Native require() names.
Also verifies: every file exists, sha256 matches, PNG pixel size matches, hero has no train/metro/beam assets."""
import hashlib, json, os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
m = json.load(open(os.path.join(ROOT, '_export-manifest.json')))
mot = json.load(open(os.path.join(ROOT, 'motion-spec.json')))
problems = []
out = {
 'name': 'PulseCity scene assets (City World + Winter Wonderland)', 'version': '1.2.0', 'source': m['source'],
 'themes': m.get('themes'), 'mood': m['mood'], 'referenceDevice': m['referenceDevice'],
 'artworkChanged': False,
 'sceneContents': {
   'hero': {'v23Mode': 'band', 'includes': ['sky', 'stars', 'moon', 'ridge', 'far skyline', 'mid skyline', 'vignette', 'shade'],
            'excludes': {'metro track': 'v2.3 GEOM.band.metro = 0', 'train': 'only in City World preview', 'district beams': 'v2.3 draws beams only in panel/full modes',
                         'ground (near)': 'v2.3 GEOM.band.near = 1.2 places it below the frame'}},
   'preview': {'v23Mode': 'panel', 'includes': ['sky', 'stars', 'moon', 'ridge', 'far skyline', 'mid skyline', 'district beams', 'metro track', 'train', 'ground', 'vignette'], 'excludes': {}},
   'hero-winter': {'v23Mode': 'band', 'theme': 'winter', 'includes': ['sky', 'stars', 'moon', 'ridge', 'fog', 'far skyline + snow caps', 'mid skyline + snow caps/icicles', 'snowman (4 parts)', 'snowfall', 'frost edge', 'shade'],
                   'excludes': {'metro track': 'v2.3 GEOM.band.metro = 0', 'train': 'only in City World preview', 'district beams': 'panel/full modes only', 'ground (near)': 'below the hero frame; snowman stands on the mid baseline'}},
   'preview-winter': {'v23Mode': 'panel', 'theme': 'winter', 'includes': ['sky', 'stars', 'moon', 'ridge', 'fog', 'far skyline + snow caps', 'mid skyline + snow caps/icicles', 'district beams', 'metro track', 'train', 'snowy ground', 'snowman (4 parts)', 'snowfall', 'frost edge'], 'excludes': {}}},
 'responsiveScaling': {
   'artboards': {s: S['artboardPt'] for s, S in m['scenes'].items()},
   'rule': 'Lay each scene out in its fixed artboard (points). Scale the whole artboard uniformly by k = max(containerWidth/artboardWidth, containerHeight/artboardHeight) ("cover"). Anchor bottom-left; overflow is clipped (only sky is lost at the top, extra mid layer at the right).',
   'applyKTo': 'every x, y, width, height and speed in asset-manifest.json and motion-spec.json',
   'aspectRatios': {s: round(S['artboardPt'][0] / S['artboardPt'][1], 4) for s, S in m['scenes'].items()},
   'whyLayersAreWider': 'Each layer is artboardWidth + maxCam*parallax wide, so drifting cam over [0, maxCam] never shows an edge after cover-scaling.',
   'heroHeight': 'v2.3 hero height = top safe-area inset + 196 pt. Artboard uses 47 + 196 = 243 pt. Taller insets -> k grows slightly, sky crops.',
   'previewSize': 'Card is full width minus 16 pt margins each side, 208 pt tall (358 x 208 on a 390 pt phone).',
   'stretchedAssets': 'sky, vignette, shade stretch to the artboard; moon_glow is drawn at glowR*2 square; beam_column stretches vertically to (top-4).',
   'densities': 'Scenery is @3x. moon_glow and vignette are @1x on purpose (smooth gradients; upscaling is visually lossless and saves memory). Re-export with SCALE=2 for an @2x set if memory matters.'},
 'scenes': {}}
for s, S in m['scenes'].items():
    assets = []
    for a in S['assets']:
        e = dict(a)
        if a.get('file'):
            p = os.path.join(ROOT, a['file'])
            if not os.path.exists(p): problems.append(f'missing {a["file"]}'); continue
            if hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16] != a['sha256']: problems.append(f'hash {a["file"]}')
            if list(Image.open(p).size) != list(a['sizePx']): problems.append(f'size {a["file"]}')
            base = os.path.basename(a['file']); e['rnRequire'] = f"require('./{os.path.dirname(a['file'])}/{base}')"
            e['placement'] = ({'x': '-cam * parallax', 'y': a['offsetYPt'], 'width': a['sizePt'][0], 'height': a['sizePt'][1]} if 'parallax' in a else None)
        assets.append(e)
    out['scenes'][s] = {**{k: v for k, v in S.items() if k != 'assets'}, 'maxCamPt': mot['camera']['range'][s.split('-')[0]][1], 'assets': assets}
for hs in ('hero', 'hero-winter'):
    ids = [a['id'] for a in out['scenes'][hs]['assets']]
    for bad in ('train', 'metro', 'beam_column', 'beam_halo'):
        if f'{hs}.{bad}' in ids: problems.append(f'{hs}.{bad} must not be in the hero')
for ps in ('preview', 'preview-winter'):
    if f'{ps}.train' not in [a['id'] for a in out['scenes'][ps]['assets']]: problems.append(f'{ps}.train missing')
out['verification'] = {'filesChecked': sum(1 for s in out['scenes'].values() for a in s['assets'] if a.get('file')), 'problems': problems,
                       'fidelity': {**json.load(open(os.path.join(ROOT, '_reference', 'fidelity_report.json'))), **json.load(open(os.path.join(ROOT, '_reference', 'fidelity_report_winter.json')))}}
json.dump(out, open(os.path.join(ROOT, 'asset-manifest.json'), 'w'), indent=1)
print('checked', out['verification']['filesChecked'], 'problems', problems)
sys.exit(1 if problems else 0)
