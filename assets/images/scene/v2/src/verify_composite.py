"""
Fidelity check: rebuild each reference frame using ONLY the exported PNGs + <scene>_scene.json
(the way an app would layer them), then compare pixel-by-pixel with the frame produced by the
real v2.3 CityScene.draw() at the same camera / time / train position.

Beams are composited two ways:
  additive  - same 'lighter' blending as v2.3 (proves the beam sprites are correct)
  normal    - plain alpha blending, i.e. what React Native <Image>/<View> can do without new deps
Writes diff heat-maps + a JSON report to <out>/_reference/.
"""
import asyncio, json, os, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright

OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
BASE_URL = 'http://127.0.0.1:8765/' + os.path.relpath(OUT, '/home/claude') + '/'

JS = r"""
async ({base, scene, frames, files, blend}) => {
  const D = await (await fetch(base+scene+'/'+scene+'_scene.json')).json();
  const load = f => new Promise((ok,er)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=er; i.src=base+f; });
  const img = {}; for (const f of files) img[f.layer||f.sprite] = {i: await load(f.file), m: f};
  const W=D.W, H=D.H, S=D.scale, P=D.palette, rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`;
  const out = {};
  for (const [key, fr] of Object.entries(frames)) {
    const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.setTransform(S,0,0,S,0,0);
    const cam=fr.cam, T=fr.t;
    c.drawImage(img.sky.i, 0, 0, W, H);                                                      // sky strip, stretched
    if (P.stars>.02) for (const s of D.stars) { const a=P.stars*(.35+.65*(.5+.5*Math.sin(T*1.6+s.phase)));
      c.fillStyle=`rgba(255,255,255,${a*.8})`; c.fillRect(((s.x*W*1.3-cam*.04)%(W*1.3)+W*1.3)%(W*1.3)-W*.15, s.y*H, s.size, s.size); }
    const mx=D.moon.x-cam*D.moon.parallax, my=D.moon.y;
    c.drawImage(img.moon_glow.i, mx-D.moon.glowR, my-D.moon.glowR, D.moon.glowR*2, D.moon.glowR*2);
    const md=img.moon.m.pt[0]; c.drawImage(img.moon.i, mx-md/2, my-md/2, md, md);
    const lay = n => { const L=img[n]; if(!L) return; c.drawImage(L.i, -cam*L.m.parallax, L.m.offsetY_pt, L.m.pt[0], L.m.pt[1]); };
    lay('ridge'); lay('far'); lay('mid');
    if (img.beam_column) { c.globalCompositeOperation = blend==='additive'?'lighter':'source-over';
      const Lm = D.layerWidths.mid;
      for (const d of D.districts) { const x=d.x*Lm-cam*D.fac.mid; if(x<-40||x>W+40) continue;
        const it=.12+Math.min(2,d.matches)*.36, top=d.top-4, pulse=(.85+.15*Math.sin(T*3+d.x*9));
        const k = blend==='additive'?1:1.5;  // normal-blend opacity boost (fit_beam_normal.py)
        c.globalAlpha=Math.min(1,.42*it*pulse*k); c.drawImage(img.beam_column.i, x-6, 0, 12, top);
        c.globalAlpha=Math.min(1,.7*it*k); c.drawImage(img.beam_halo.i, x-22, top-22, 44, 44); c.globalAlpha=1; }
      c.globalCompositeOperation='source-over'; }
    lay('metro');
    if (img.train) { const Lm=D.layerWidths.metro; const tx=(fr.trainX%(Lm+200))-100-cam*D.fac.metro; c.drawImage(img.train.i, tx, D.trainY, 90, 9); }
    lay('near');
    c.drawImage(img.vignette.i, 0, 0, W, H);
    out[key]=cv.toDataURL('image/png');
  }
  return out;
}
"""

def diff(a, b):
    a = np.asarray(a.convert('RGB'), dtype=np.int16); b = np.asarray(b.convert('RGB'), dtype=np.int16)
    d = np.abs(a - b).max(axis=2)
    return d, {'meanAbs': round(float(np.abs(a - b).mean()), 3), 'max': int(d.max()),
               'pctOver4': round(float((d > 4).mean() * 100), 3), 'pctOver16': round(float((d > 16).mean() * 100), 3)}

async def main():
    import base64, io
    files = json.load(open(os.path.join(OUT, '_export_files.json')))
    report = {}
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto(BASE_URL + '_export_files.json')
        for scene in ['hero', 'preview']:
            frames = json.load(open(os.path.join(OUT, '_reference', f'{scene}_frames.json')))
            fl = [f for f in files if f['scene'] == scene]
            for blend in (['additive', 'normal'] if scene == 'preview' else ['normal']):
                res = await pg.evaluate(JS, {'base': BASE_URL, 'scene': scene, 'frames': frames, 'files': fl, 'blend': blend})
                for k, url in res.items():
                    comp = Image.open(io.BytesIO(base64.b64decode(url.split(',', 1)[1])))
                    ref = Image.open(os.path.join(OUT, '_reference', f'{scene}_ref_{k}@3x.png'))
                    d, st = diff(comp, ref)
                    comp.save(os.path.join(OUT, '_reference', f'{scene}_composite_{blend}_{k}@3x.png'))
                    Image.fromarray(np.clip(d * 8, 0, 255).astype('uint8')).save(os.path.join(OUT, '_reference', f'{scene}_diff_{blend}_{k}.png'))
                    report[f'{scene}/{blend}/{k}'] = st; print(f'{scene:8s} {blend:9s} {k:28s} {st}')
        await b.close()
    json.dump(report, open(os.path.join(OUT, '_reference', 'fidelity_report.json'), 'w'), indent=1)

asyncio.run(main())
