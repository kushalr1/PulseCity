"""
PulseCity v2.3 -> React Native asset export (Home hero + City World preview, City World / Chill).

Runs the ORIGINAL CityScene renderer from pulsecity-v2.3.html in headless Chromium,
at @3x, and saves:
  * the renderer's own off-screen layer canvases (ridge, far, mid, metro, near) as PNGs
  * small sprites drawn with the exact same canvas calls (sky strip, moon, moon glow,
    vignette, train, beam column, beam halo, hero shade)
  * scene data (stars, district beam anchors, layer widths, parallax) as JSON
  * reference frames rendered by the real CityScene.draw() for verification

Nothing here invents artwork: every pixel comes from scene.js code paths with seed 7 / 3 / 11.

Usage:  python3 export_scene_assets.py  [--url http://127.0.0.1:8765/pulsecity-v2.3.html]
         [--mood chill] [--theme city] [--out ../out]
Needs:  playwright (python) + chromium, Pillow. Page must be served over http(s).
"""
import argparse, asyncio, base64, io, json, os
from playwright.async_api import async_playwright
from PIL import Image

SCALE = 3
SCENES = {
    # name: (CityScene mode, width pt, height pt)  -- sizes from v2.3 CSS at a 390 pt phone
    'hero':    ('band', 390, 243),   # .home-hero height = --top (47) + 196
    'preview': ('panel', 358, 208),  # .cw-panel margin 0 16px -> 358 wide; .cwp-scene height 208
}

JS = r"""
async ({mode, W, H, mood, theme, S}) => {
  // --- build a CityScene exactly like v2.3 does, but force device scale S (v2.3 caps at 2) ---
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px`;
  document.body.appendChild(cv);
  const s = new CityScene(cv, {mode, mood, theme, reduced:()=>false, static:false});
  s.resize = function(){ // identical to scene.js resize(), with dpr = S
    this.W=W; this.H=H; this.dpr=S; this.cv.width=Math.round(W*S); this.cv.height=Math.round(H*S);
    this.ctx.setTransform(S,0,0,S,0,0); this.maxCam=this.W*(this.g.world-1); if(this.cam>this.maxCam) this.cam=this.maxCam;
    this.build(); this.renderLayers(); this.ready=true; return true; };
  s.resize(); s.entrance=1; s.snowAmt=1;
  const p = s.pal, G = s.g, out = {layers:{}, sprites:{}, frames:{}, data:{}};
  const url = c => c.toDataURL('image/png');
  for (const n of ['ridge','far','mid','metro','near']) { const L=s.layers[n]; if(L) out.layers[n]={png:url(L.c), w:L.w, f:FAC[n]}; }
  const mk = (w,h,sc=S) => { const c=document.createElement('canvas'); c.width=Math.round(w*sc); c.height=Math.round(h*sc); const g=c.getContext('2d'); g.setTransform(sc,0,0,sc,0,0); return [c,g]; };

  // sky: same gradient as draw(): 0 -> H*mid, stops 0/.55/1, constant below
  { const [c,g]=mk(1,H); const sg=g.createLinearGradient(0,0,0,H*G.mid); sg.addColorStop(0,rgba(p.sky[0])); sg.addColorStop(.55,rgba(p.sky[1])); sg.addColorStop(1,rgba(p.sky[2])); g.fillStyle=sg; g.fillRect(0,0,1,H); out.sprites.sky={png:url(c), w:1, h:H}; }
  // moon disc
  const mr=Math.max(7,H*.045);
  { const d=Math.ceil(mr*2+2); const [c,g]=mk(d,d); g.fillStyle=rgba(p.glow,p.winter?.9:.95); g.beginPath(); g.arc(d/2,d/2,mr,0,6.29); g.fill(); out.sprites.moon={png:url(c), w:d, h:d, r:mr}; }
  // moon glow (radial, radius H*.6). Smooth gradient -> exported at @1x, scaled up in app.
  { const R=H*.6, d=Math.ceil(R*2); const [c,g]=mk(d,d,1); const og=g.createRadialGradient(d/2,d/2,0,d/2,d/2,R); og.addColorStop(0,rgba(p.glow,p.winter?.65:.35)); og.addColorStop(1,rgba(p.glow,0)); g.fillStyle=og; g.fillRect(0,0,d,d); out.sprites.moon_glow={png:url(c), w:d, h:d, r:R, scale:1}; }
  // vignette (city theme only), full scene, @1x
  { const [c,g]=mk(W,H,1); const vg=g.createRadialGradient(W/2,H*.45,H*.3,W/2,H*.5,Math.max(W,H)*.85); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.3)'); g.fillStyle=vg; g.fillRect(0,0,W,H); out.sprites.vignette={png:url(c), w:W, h:H, scale:1}; }
  if (G.metro) {
    // train: 90x9 body + 8 windows, exactly as draw()
    { const [c,g]=mk(90,9); g.fillStyle=rgba(mix(p.mid,[255,255,255],.14)); g.fillRect(0,0,90,9); g.fillStyle=rgba(p.win,.9); for(let i=0;i<8;i++) g.fillRect(6+i*10,3,6,3); out.sprites.train={png:url(c), w:90, h:9}; }
    // beam column: 12 pt wide, transparent at top -> beam colour at bottom, alpha 1 (app applies opacity)
    { const BH=128; const [c,g]=mk(12,BH); const bg=g.createLinearGradient(0,0,0,BH); bg.addColorStop(0,rgba(p.beam,0)); bg.addColorStop(1,rgba(p.beam,1)); g.fillStyle=bg; g.fillRect(0,0,12,BH); out.sprites.beam_column={png:url(c), w:12, h:BH}; }
    // beam halo: radial 22 pt radius, alpha 1 at centre
    { const [c,g]=mk(44,44); const gl=g.createRadialGradient(22,22,0,22,22,22); gl.addColorStop(0,rgba(p.beam,1)); gl.addColorStop(1,rgba(p.beam,0)); g.fillStyle=gl; g.fillRect(0,0,44,44); out.sprites.beam_halo={png:url(c), w:44, h:44}; }
  }
  // data
  out.data = { mode, W, H, scale:S, world:G.world, maxCam:s.maxCam, geom:G, fac:FAC,
    palette:{sky:p.sky, ridge:p.ridge, far:p.far, mid:p.mid, near:p.near, haze:p.haze, hazeA:p.hazeA, win:p.win, lit:p.lit, stars:p.stars, glow:p.glow, beam:p.beam},
    moon:{x:W*.8, y:H*G.ridge*.45, r:mr, glowR:H*.6, glowAlpha:p.winter?.65:.35, discAlpha:p.winter?.9:.95, parallax:.03},
    stars: s.stars.map(t=>({x:t.x, y:t.y, size:t.s, phase:t.p})),
    trainY: G.metro? H*G.metro-10 : null, metroY: G.metro? H*G.metro : null,
    districts: DISTRICTS.map(d=>({id:d.id, name:d.short, x:d.x, top:s.dY(d.id), matches:s.matches(d.id)})),
    layerWidths: Object.fromEntries(Object.entries(s.layers).map(([k,L])=>[k,L.w])) };

  // reference frames from the REAL draw(): several cameras / times / train positions
  const shots = [[0,0,0],[0.5,1.3,300],[1,2.7,520]];
  for (const [cf,t,tx] of shots) { s.cam=s.maxCam*cf; s.t=t; s.trainX=tx; s.draw(0); out.frames[`cam${cf}_t${t}_train${tx}`]={png:url(cv), cam:s.cam, t, trainX:tx}; }
  cv.remove(); return out;
}
"""

def save_png(data_url, path, optimize=True):
    raw = base64.b64decode(data_url.split(',', 1)[1])
    im = Image.open(io.BytesIO(raw)); im.load()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, optimize=optimize)
    return im.size, os.path.getsize(path)

async def main(a):
    files = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 600, 'height': 900})
        await pg.goto(a.url); await pg.wait_for_timeout(800)
        for name, (mode, W, H) in SCENES.items():
            r = await pg.evaluate(JS, {'mode': mode, 'W': W, 'H': H, 'mood': a.mood, 'theme': a.theme, 'S': SCALE})
            base = os.path.join(a.out, name)
            for n, L in r['layers'].items():
                # crop fully transparent rows (texture memory); keep x origin so parallax maths stay exact
                im = Image.open(io.BytesIO(base64.b64decode(L['png'].split(',', 1)[1]))).convert('RGBA')
                bb = im.getchannel('A').getbbox()
                if not bb:  # e.g. hero 'near': v2.3 places ground below the hero frame (GEOM.band.near = 1.2)
                    print(f'skip empty layer {name}/{n}'); continue
                top, bot = bb[1], bb[3]; im = im.crop((0, top, im.width, bot))
                fn = f'{name}_{n}@3x.png'; path = os.path.join(base, fn); os.makedirs(base, exist_ok=True); im.save(path, optimize=True)
                files.append({'scene': name, 'file': f'{name}/{fn}', 'kind': 'layer', 'layer': n, 'px': list(im.size),
                              'pt': [round(im.width / SCALE, 3), round(im.height / SCALE, 3)], 'offsetY_pt': round(top / SCALE, 4),
                              'layerWidth_pt': L['w'], 'bytes': os.path.getsize(path), 'parallax': L['f']})
            for n, S_ in r['sprites'].items():
                sc = S_.get('scale', SCALE); fn = f'{name}_{n}@{sc}x.png'; sz, by = save_png(S_['png'], os.path.join(base, fn))
                files.append({'scene': name, 'file': f'{name}/{fn}', 'kind': 'sprite', 'sprite': n, 'px': sz, 'pt': [S_['w'], S_['h']], 'bytes': by, 'density': sc})
            for n, F in r['frames'].items():
                fn = f'{name}_ref_{n}@3x.png'; save_png(F['png'], os.path.join(a.out, '_reference', fn))
            json.dump(r['data'], open(os.path.join(base, f'{name}_scene.json'), 'w'), indent=1)
            json.dump({k: {kk: vv for kk, vv in v.items() if kk != 'png'} for k, v in r['frames'].items()}, open(os.path.join(a.out, '_reference', f'{name}_frames.json'), 'w'), indent=1)
        await b.close()
    json.dump(files, open(os.path.join(a.out, '_export_files.json'), 'w'), indent=1)
    for f in files: print(f"{f['file']:42s} {str(f['px']):>14s} {f['bytes']/1024:7.1f} KB")

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://127.0.0.1:8765/pulsecity-v2.3.html')
    ap.add_argument('--mood', default='chill'); ap.add_argument('--theme', default='city')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'out'))
    asyncio.run(main(ap.parse_args()))
