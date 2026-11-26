"""Builds package v2.0 metadata: asset-manifest.json (all 36 sets: 3 surfaces x 2 themes x 6 moods), motion-spec.json
additions (moods, full-screen City World, Surprise Me, mood cross-fade) and verifies every file. Fails on any problem."""
import hashlib, json, os, sys
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
J = lambda p: json.load(open(os.path.join(ROOT, p)))
v1 = J('_export-manifest.json'); v2 = J('_export_files_v2.json'); mot = J('motion-spec.json')
MOODS = ['chill', 'social', 'nature', 'active', 'foodie', 'explore']; THEMES = ['city', 'winter']; SURF = {'hero': [390, 243], 'preview': [358, 208], 'full': [390, 844]}
BOOST = {'chill': 1.5, 'social': 1.5, 'foodie': 1.5, 'nature': 2.0, 'explore': 2.0, 'active': 2.5}
folder = lambda s, t, m: s + ('-winter' if t == 'winter' else '') + ('' if m == 'chill' else '-' + m)
Z = {'sky': 0, 'stars': 1, 'moon_glow': 2, 'moon': 3, 'ridge': 4, 'fog': 5, 'far': 6, 'farCaps': 7, 'mid': 9, 'midCaps': 10, 'beam_column': 11, 'beam_halo': 12,
     'metro': 13, 'train': 14, 'near': 15, 'snowman_body': 16, 'snowman_head': 16.1, 'snowman_front': 16.2, 'snowman_front_red': 16.2, 'snowman_front_blue': 16.2,
     'snowman_arm': 16.3, 'car_head': 17, 'car_tail': 17, 'surprise_cone': 18.5, 'surprise_flash': 18.6, 'flakes_small': 19, 'flake_big': 19.1,
     'frost': 20, 'vignette': 20, 'shade': 21}
ROLE = {'sky': 'Stretch to artboard (1 pt wide source)', 'ridge': 'Parallax layer', 'far': 'Parallax layer', 'mid': 'Parallax layer (districts, lit windows)',
        'farCaps': 'Winter snow caps on far; same placement; opacity = snowAmt', 'midCaps': 'Winter snow caps + icicles on mid; same placement; opacity = snowAmt',
        'metro': 'Parallax layer: track + pillars', 'near': 'Ground (full: + bushes, streetlights)', 'moon': 'Moon/sun disc', 'moon_glow': 'Radial glow, @1x scaled to glowR*2',
        'vignette': 'City edge darkening, @1x stretched', 'frost': 'Winter frost edge, @1x stretched; opacity = snowAmt', 'fog': 'Fog puff (v2.3 own 128px sprite) per fog band',
        'flake_big': 'Large snowflake 12x12 pt, rotated by phase', 'snowman_body': 'Snowman shadow + body', 'snowman_head': 'Head/hat/face; rotates about head pivot',
        'snowman_front': 'Scarf (red), left arm, buttons', 'snowman_front_red': 'Scarf red (k=0), left arm, buttons', 'snowman_front_blue': 'Scarf blue (k=1), left arm, buttons',
        'snowman_arm': 'Waving right arm; rotates about arm pivot', 'train': 'Moving train sprite', 'beam_column': 'District beam column, opacity animated',
        'beam_halo': 'District beam glow, opacity animated', 'car_head': 'Warm headlight streak, opaque end at x=0; stretch width to len', 'car_tail': 'Red tail-light streak, opaque end at x=0',
        'surprise_cone': 'Surprise searchlight cone (City World only), apex at left-centre, pointing +x', 'surprise_flash': 'Surprise lock-on flash, radial', 'shade': 'Hero top shade (optional native gradient)'}
problems = []
def entry(f, st):
    k = f.get('layer') or f.get('sprite'); p = os.path.join(ROOT, f['file'])
    if not os.path.exists(p): problems.append('missing ' + f['file']); return None
    im = Image.open(p)
    if list(im.size) != list(f.get('px') or f.get('sizePx')): problems.append('size ' + f['file'])
    fam = os.path.join(os.path.dirname(f['file']), os.path.basename(f['file']).split('@')[0] + '.png')
    e = {'id': f'{st}.{k}', 'name': k, 'file': f['file'], 'requirePath': fam, 'zIndex': Z.get(k), 'role': ROLE.get(k, ''), 'sizePx': list(im.size),
         'sizePt': f.get('pt') or f.get('sizePt'), 'density': f.get('density', 3), 'bytes': os.path.getsize(p),
         'decodedBytes': im.size[0] * im.size[1] * 4, 'sha256': hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]}
    if 'parallax' in f: e.update({'parallax': f['parallax'], 'offsetYPt': f.get('offsetY_pt', f.get('offsetYPt')), 'layerWidthPt': f.get('layerWidth_pt', f.get('layerWidthPt'))})
    for x in ('apex', 'halfAngle'):
        if x in f: e[x] = f[x]
    return e
sets = {}
for s in SURF:
    for t in THEMES:
        for m in MOODS:
            st = folder(s, t, m); key = f'{s}/{t}/{m}'
            if s in ('hero', 'preview') and m == 'chill':   # v1.2 sets, unchanged
                old = v1['scenes'][s + ('-winter' if t == 'winter' else '')]['assets']
                fl = [{'file': a['file'], 'layer' if 'parallax' in a else 'sprite': a['id'].split('.')[1], 'px': a['sizePx'], 'pt': a['sizePt'], 'density': a.get('density', 3),
                       **({'parallax': a['parallax'], 'offsetY_pt': a['offsetYPt'], 'layerWidth_pt': a['layerWidthPt']} if 'parallax' in a else {})} for a in old if a.get('file')]
                scene_json = f"{st}/{s}{'_winter' if t == 'winter' else ''}_scene.json"; since = '1.1/1.2'
            else:
                fl = [f for f in v2 if f['set'] == st]; scene_json = f"{st}/{st.replace('-', '_')}_scene.json"; since = '2.0'
            if not fl: problems.append('no files for ' + key); continue
            assets = [e for e in (entry(f, st) for f in fl) if e]
            names = {a['name'] for a in assets}
            if s == 'hero' and names & {'train', 'metro', 'beam_column', 'beam_halo'}: problems.append(f'{key}: hero must not contain train/metro/beams')
            if s != 'hero' and 'train' not in names: problems.append(f'{key}: train missing')
            if s == 'full' and t == 'city' and 'surprise_cone' not in names: problems.append(f'{key}: surprise cone missing')
            if not os.path.exists(os.path.join(ROOT, scene_json)): problems.append('missing ' + scene_json)
            sets[key] = {'key': key, 'folder': st, 'surface': s, 'theme': t, 'mood': m, 'since': since, 'artboardPt': SURF[s], 'sceneData': scene_json,
                         'glowBoost': 1.0 if t == 'winter' else BOOST[m], 'files': len(assets), 'bytes': sum(a['bytes'] for a in assets),
                         'decodedBytes': sum(a['decodedBytes'] for a in assets), 'assets': sorted(assets, key=lambda a: (a['zIndex'] if a['zIndex'] is not None else 99))}
fid = {**J('_reference/fidelity_report.json'), **J('_reference/fidelity_report_winter.json'), **J('_reference/fidelity_report_v2.json')}
man = {'name': 'PulseCity scene assets', 'version': '2.0.0', 'source': 'pulsecity-v2.3.html scene.js CityScene (seeds rng 7/3/11/31), exported at @3x; artwork unchanged',
       'lookup': 'sets["<surface>/<theme>/<mood>"]  surfaces: hero | preview | full; themes: city | winter; moods: ' + ' | '.join(MOODS),
       'surfaces': {'hero': 'Home hero (v2.3 band)', 'preview': 'Home City World preview card (v2.3 panel)', 'full': 'Full-screen City World AND Surprise Me screen (v2.3 full, 390x844 pt)'},
       'requireNote': 'Use requirePath with a static require (Metro density family): require("./hero/hero_mid.png") resolves hero_mid@3x.png. Do not require the @Nx filename.',
       'heroRule': 'Hero sets never contain metro, train or beams (checked).',
       'responsiveScaling': {'rule': 'Lay each set out in its artboard (pt). Scale uniformly by k = max(viewW/artW, viewH/artH), anchor bottom-left, clip overflow. Apply k to every position, size and speed.',
                             'full': 'Full-screen artboard is 390x844 (iPhone 16e). Other aspect ratios crop sky (top) or the right edge after cover-scaling.'},
       'memory': {'note': 'decodedBytes = width*height*4 of each image once loaded. Mount only the active set; during a mood cross-fade two sets are mounted for 0.8 s.',
                  'fullScreenCityMB': round(sets['full/city/chill']['decodedBytes'] / 1e6, 1), 'fullScreenWinterMB': round(sets['full/winter/chill']['decodedBytes'] / 1e6, 1),
                  'previewMB': round(sets['preview/city/social']['decodedBytes'] / 1e6, 1), 'heroMB': round(sets['hero/city/social']['decodedBytes'] / 1e6, 1),
                  'trim': 'Layers behind the opaque ground (preview/full) are cropped below the ground line: lossless.'},
       'sets': sets,
       'verification': {'sets': len(sets), 'filesChecked': sum(v['files'] for v in sets.values()), 'problems': problems, 'fidelity': fid}}
json.dump(man, open(os.path.join(ROOT, 'asset-manifest.json'), 'w'), indent=1)

# ---------- motion spec additions ----------
full = J('full/full_scene.json')
mot['version'] = '2.0.0'
mot['moods'] = {'list': MOODS, 'default': 'chill', 'assets': 'one set per surface/theme/mood (asset-manifest lookup); colours are baked, never tint at runtime',
                'glowBoost': {'city': BOOST, 'winter': 'none (v2.3 blends beams normally in winter)', 'appliesTo': 'normal-blend opacity multiplier for v2.3 additive effects in City World: beam column, beam halo, car streaks, Surprise cone and flash. Clamp opacity to 1. Fitted per mood against v2.3 frames.'},
                'beamMatches': 'district matches per mood are in each set\'s scene JSON (districts[].matches); recompute from live data in the app'}
mot['moodCrossfade'] = {'source': 'scene.js setMood()/retarget()/step(): palette lerp over 0.8 s with easeInOutCubic, layers re-rendered each frame',
                        'reactNative': 'mount the new mood set above the old one and fade it in: opacity 0 -> 1 over 800 ms, easeInOutCubic; then unmount the old set. Data-driven values (beam intensity, traffic, pill visibility) switch to the new mood at the start.',
                        'difference': 'v2.3 blends palettes; an image cross-fade blends pixels. Start and end frames are identical; mid-transition colours differ slightly.',
                        'theme': 'theme switch City <-> Winter uses the same 0.8 s cross-fade, plus snowAmt 0 -> 1 over 1.4 s on entering Winter',
                        'reducedMotion': 'swap instantly'}
mot['fullScreen'] = {
  'source': 'scene.js mode full; app21.js City World (r_cityworld) + Surprise (r_surprise)', 'artboardPt': [390, 844], 'world': full['world'], 'maxCam': full['maxCam'],
  'camera': {'initial': {'pt': full['initialCam'], 'rule': 'camForDistrict("cyber") = clamp((cyber.x*midWidth - W/2)/0.6, 0, maxCam)'},
             'drift': 'none on City World; Surprise screen drifts like the hero (6 pt/s ping-pong) until Surprise starts',
             'drag': 'horizontal drag: cam -= dx/0.6 (mid layer follows the finger 1:1), clamp 0..maxCam; on release, velocity camV = -dx/0.6/dt',
             'inertia': 'cam += camV*dt; camV *= 0.05^dt until |camV| < 0.5',
             'focusDistrict': 'camTarget = camForDistrict(id); each frame cam = lerp(cam, camTarget, 1 - 0.003^dt); stop when within 0.5 pt',
             'camForDistrict': {d['id']: d['camForDistrict'] for d in full['districts']}},
  'entrance': 'same as hero (1.8 s, far +20 pt, mid +36 pt and fade from 15%) when the screen opens with motion on',
  'beams': {'normal': 'as preview: it = 0.12 + 0.36*min(2, matches)', 'focused': 'when a district is selected: it = 1.6 for it, 0.08 for the others', 'surpriseTarget': 'it = 1.5 after the search phase'},
  'pills': {'native': True, 'show': 'all districts (not only matches) when 12 < x < W-12', 'order': 'focused first, then by matches', 'x': 'centre d.x*midWidth - cam*0.6; left = clamp(x - w/2, 6, W - w - 6)',
            'y': 'base = clamp(d.top - 42, H*0.34, H - 70); try base, base-42, base+42, base-84 avoiding overlaps (36 pt rows, 6 pt gaps)'},
  'cars': {'source': 'scene.js draw() mode full', 'count': 30, 'lanes': {'0': 'warm headlights (car_head), moving right, y = H*0.87, streak extends LEFT of x (flip car_head horizontally)', '1': 'red tail lights (car_tail), moving left, y = H*0.9, streak extends RIGHT of x'},
           'x': 'car.x * nearLayerWidth - cam (screen pt); hide if x < -30 or x > W+30', 'motion': 'car.x = (car.x + dir*car.v*traffic*dt*0.03 + 1) mod 1, dir = +1 lane 0, -1 lane 1',
           'length': '12 + 20*car.v*traffic pt (traffic per palette, in scene JSON)', 'height': '2 pt centred on y', 'opacity': 'City 0.95, Winter 0.6, times glowBoost in City',
           'blend': 'v2.3 additive in both themes; React Native normal alpha', 'initial': 'cars[] in the full set scene JSON'},
  'snowmen': {'count': 5, 'positions': 'full winter scene JSON snowmen[] (layerX, y, scale, k). screen x = layerX - cam*0.6; hide if outside [-40, W+40]',
              'sprites': 'parts exported at scale 1.35 (largest); draw each snowman at its own scale by sizing the parts to box*scale (downscale only)',
              'scarf': 'k=0 -> snowman_front_red, k=1 -> snowman_front_blue', 'motion': 'tilt = 0.06*sin(1.3t + k), wave = 0.5*sin(2.4t + 2k); otherwise as hero'},
  'snowfall': '110 flakes (full winter scene JSON), same rules as hero'}
mot['surpriseMe'] = {
  'source': 'scene.js surprise()/step()/draw()/snowfall(), app21.js r_surprise', 'surface': 'full (same assets as full-screen City World of the current theme/mood)',
  'sequence': [
    {'phase': 'search', 'durationS': 1.5, 'durationRepeatS': 0.7, 'camera': 'e = easeInOutCubic(p); cam = lerp(from, to, e) + sin(e*pi) * W*0.25 * (to >= from ? -1 : 1)  (overshoot)',
     'dim': 'dimA rises at 1.2/s to max 0.45', 'cone': 'City only: from apex (W/2, H+20) to target (tx, ty); tx = targetX + sin(p*14)*(1-p)*80 (wobble), ty = district top',
     'snow': 'Winter only (no cone): flakes pulled toward an orbit around the target: x = lerp(x, tx + cos(phase+3t)*(10+24z), g*0.85), y = lerp(y, ty + sin(phase+3t)*(10+20z), g*0.85), g = easeInOutCubic(p)'},
    {'phase': 'lock', 'durationS': 0.45, 'flash': 'radius R = 16 + 130*p pt, opacity 0.9*(1-p) (City times glowBoost), surprise_flash sprite sized 2R centred on target',
     'cone': 'City: stays on target (no wobble)', 'beam': 'target district it = 1.5', 'snow': 'Winter: flakes stay in the orbit (g = 1)'},
    {'phase': 'done', 'event': 'onLock(x, y): show the result card at the target', 'dim': 'stays 0.45 while the card is open; after clearing, falls at 1.5/s'}],
  'cone': {'sprite': 'surprise_cone (400 pt long, apex at left-centre)', 'place': 'translate to apex, rotate by atan2(ty-by, tx-bx), size = (len, spriteH*len/400) with len = hypot(tx-bx, ty-by) + 30',
           'opacity': '1 * glowBoost (clamp 1)', 'blend': 'v2.3 additive; normal alpha in React Native'},
  'dimColour': {'city': 'rgba(0,0,10, dimA)', 'winter': 'rgba(10,20,45, dimA*0.7)'},
  'targets': 'a random district that has a valid demo pick (app logic); targetX = d.x*midWidth - cam*0.6, targetY = d.top (scene JSON)',
  'skip': 'tap skips to the end of lock: cam = to, phase done', 'reducedMotion': 'jump to the target camera, dimA = 0.45, no cone/flash animation, fire onLock immediately',
  'knownDifference': 'At lock-on, v2.3 additive halos clip into a slightly square glow; the exported sprites render it round.'}
json.dump(mot, open(os.path.join(ROOT, 'motion-spec.json'), 'w'), indent=1)
print('sets', len(sets), 'files', man['verification']['filesChecked'], 'problems', problems)
sys.exit(1 if problems else 0)
