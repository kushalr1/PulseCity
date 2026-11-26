"""
PulseCity v2.3 -> React Native assets: WINTER WONDERLAND (Chill), Home hero + City World preview.

Same method as export_scene_assets.py: runs the ORIGINAL CityScene renderer from pulsecity-v2.3.html
at @3x with theme 'winter' and saves its own layer canvases, plus sprites drawn with the exact same
canvas calls as scene.js (snowman parts, snowflake, fog, frost, moon, sky, train, beams, shade),
scene data (stars, flakes, fog bands, snowman placement) and reference frames from the real draw().

Usage: python3 export_winter_assets.py [--url http://127.0.0.1:8765/pulsecity-v2.3.html] [--mood chill] [--out ../pulsecity-scene-assets]
"""
import argparse, asyncio, base64, io, json, os
from playwright.async_api import async_playwright
from PIL import Image

SCALE = 3
SCENES = {'hero': ('band', 390, 243), 'preview': ('panel', 358, 208)}
# snowman local box (scene.js snowman() units, before scale): covers shadow, arms (incl. wave range), hat
SM_BOX = {'x0': -27, 'y0': -71, 'w': 54, 'h': 78}

JS = r"""
async ({mode, W, H, mood, S, BOX}) => {
  const cv = document.createElement('canvas'); cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px`; document.body.appendChild(cv);
  const s = new CityScene(cv, {mode, mood, theme:'winter', reduced:()=>false, static:false, intro:false});
  s.resize = function(){ this.W=W; this.H=H; this.dpr=S; this.cv.width=Math.round(W*S); this.cv.height=Math.round(H*S);
    this.ctx.setTransform(S,0,0,S,0,0); this.maxCam=this.W*(this.g.world-1); if(this.cam>this.maxCam) this.cam=this.maxCam;
    this.build(); this.renderLayers(); this.ready=true; return true; };
  s.resize(); s.entrance=1; s.snowAmt=1;
  const p=s.pal, G=s.g, out={layers:{}, sprites:{}, frames:{}, data:{}}, url=c=>c.toDataURL('image/png');
  for (const n of ['ridge','far','farCaps','mid','midCaps','metro','near']) { const L=s.layers[n]; if(L) out.layers[n]={png:url(L.c), w:L.w, f:FAC[n==='farCaps'?'far':n==='midCaps'?'mid':n]}; }
  const mk=(w,h,sc=S)=>{ const c=document.createElement('canvas'); c.width=Math.round(w*sc); c.height=Math.round(h*sc); const g=c.getContext('2d'); g.setTransform(sc,0,0,sc,0,0); return [c,g]; };
  { const [c,g]=mk(1,H); const sg=g.createLinearGradient(0,0,0,H*G.mid); sg.addColorStop(0,rgba(p.sky[0])); sg.addColorStop(.55,rgba(p.sky[1])); sg.addColorStop(1,rgba(p.sky[2])); g.fillStyle=sg; g.fillRect(0,0,1,H); out.sprites.sky={png:url(c),w:1,h:H}; }
  const mr=Math.max(7,H*.045);
  { const d=Math.ceil(mr*2+2); const [c,g]=mk(d,d); g.fillStyle=rgba(p.glow,.9); g.beginPath(); g.arc(d/2,d/2,mr,0,6.29); g.fill(); out.sprites.moon={png:url(c),w:d,h:d,r:mr}; }
  { const R=H*.6, d=Math.ceil(R*2); const [c,g]=mk(d,d,1); const og=g.createRadialGradient(d/2,d/2,0,d/2,d/2,R); og.addColorStop(0,rgba(p.glow,.65)); og.addColorStop(1,rgba(p.glow,0)); g.fillStyle=og; g.fillRect(0,0,d,d); out.sprites.moon_glow={png:url(c),w:d,h:d,r:R,scale:1}; }
  // frost edge (replaces the city vignette in winter). Alpha baked at snowAmt = 1; app multiplies opacity by snowAmt.
  { const [c,g]=mk(W,H,1); const fr=g.createRadialGradient(W/2,H*.5,Math.min(W,H)*.6,W/2,H*.5,Math.max(W,H)*.8); fr.addColorStop(0,'rgba(230,242,255,0)'); fr.addColorStop(1,'rgba(235,245,255,.2)'); g.fillStyle=fr; g.fillRect(0,0,W,H); out.sprites.frost={png:url(c),w:W,h:H,scale:1}; }
  // fog sprite: the renderer's own 128x128 radial sprite
  out.sprites.fog={png:url(s.fogSprite), w:128, h:128, scale:1, note:'drawn stretched to (b.w, 2*b.h)'};
  // big snowflake at R=2.6, phase 0 (app rotates by flake phase)
  { const R=2.6, B=12; const [c,g]=mk(B,B); g.translate(B/2,B/2); g.strokeStyle='#fff'; g.lineWidth=.9; g.beginPath(); for(let k=0;k<3;k++){ const an=k*Math.PI/3; g.moveTo(-Math.cos(an)*R*1.6,-Math.sin(an)*R*1.6); g.lineTo(Math.cos(an)*R*1.6,Math.sin(an)*R*1.6); } g.stroke(); out.sprites.flake_big={png:url(c),w:B,h:B}; }
  // snowman parts, drawn with scene.js snowman() code split at its transform boundaries, at this scene's scale
  const SC = mode==='band' ? .62 : .8;
  const part = (fn) => { const [c,g]=mk(BOX.w*SC, BOX.h*SC); g.scale(SC,SC); g.translate(-BOX.x0,-BOX.y0); fn(g); return url(c); };
  const body=(c,cy,r)=>{ const gg=c.createRadialGradient(-r*.35,cy-r*.4,r*.2,0,cy,r); gg.addColorStop(0,'#FFFFFF'); gg.addColorStop(1,'#C9DAF0'); c.fillStyle=gg; c.beginPath(); c.arc(0,cy,r,0,6.29); c.fill(); };
  out.sprites.snowman_body={w:BOX.w*SC,h:BOX.h*SC, png:part(c=>{ c.fillStyle='rgba(20,40,80,.18)'; c.beginPath(); c.ellipse(0,0,16,4,0,0,6.29); c.fill(); body(c,-12,13); body(c,-32,10); })};
  out.sprites.snowman_head={w:BOX.w*SC,h:BOX.h*SC, png:part(c=>{ c.translate(0,-48); body(c,0,7.5); c.fillStyle='#22283A'; c.fillRect(-6,-12,12,3); c.fillRect(-4,-21,8,10);
      c.fillStyle='#F08A2E'; c.beginPath(); c.moveTo(1,0); c.lineTo(9,1.5); c.lineTo(1,2.5); c.fill(); c.fillStyle='#1B2236'; c.fillRect(-3.5,-2.5,1.6,1.6); c.fillRect(2,-2.5,1.6,1.6); })};
  out.sprites.snowman_front={w:BOX.w*SC,h:BOX.h*SC, png:part(c=>{ c.fillStyle='#D9573D'; c.fillRect(-9,-41,18,4); c.fillRect(3,-41,4,10);
      c.strokeStyle='#5A3E2A'; c.lineWidth=1.6; c.lineCap='round'; c.beginPath(); c.moveTo(-9,-33); c.lineTo(-22,-40); c.stroke();
      c.fillStyle='#1B2236'; [-30,-24,-16,-9].forEach(yy=>{ c.beginPath(); c.arc(0,yy,1.1,0,6.29); c.fill(); }); })};
  out.sprites.snowman_arm={w:BOX.w*SC,h:BOX.h*SC, png:part(c=>{ c.strokeStyle='#5A3E2A'; c.lineWidth=1.6; c.lineCap='round'; c.translate(9,-33); c.rotate(-.6); c.beginPath(); c.moveTo(0,0); c.lineTo(14,0); c.moveTo(10,0); c.lineTo(13,-4); c.stroke(); })};
  if (G.metro) {
    { const [c,g]=mk(90,9); g.fillStyle=rgba(mix(p.mid,[255,255,255],.14)); g.fillRect(0,0,90,9); g.fillStyle=rgba(p.win,.9); for(let i=0;i<8;i++) g.fillRect(6+i*10,3,6,3); out.sprites.train={png:url(c),w:90,h:9}; }
    { const BH=128; const [c,g]=mk(12,BH); const bg=g.createLinearGradient(0,0,0,BH); bg.addColorStop(0,rgba(p.beam,0)); bg.addColorStop(1,rgba(p.beam,1)); g.fillStyle=bg; g.fillRect(0,0,12,BH); out.sprites.beam_column={png:url(c),w:12,h:BH}; }
    { const [c,g]=mk(44,44); const gl=g.createRadialGradient(22,22,0,22,22,22); gl.addColorStop(0,rgba(p.beam,1)); gl.addColorStop(1,rgba(p.beam,0)); g.fillStyle=gl; g.fillRect(0,0,44,44); out.sprites.beam_halo={png:url(c),w:44,h:44}; }
  }
  // snowman placement, exactly as scene.js snowmen()
  const yN=H*G.near; const sm = (yN>H-6) ? {x:W*.9, y:H*G.mid, scale:.62} : {x:W*.86, y:yN+4, scale:.8};
  out.data = { mode, W, H, scale:S, theme:'winter', mood, world:G.world, maxCam:s.maxCam, geom:G, fac:FAC,
    palette:{sky:p.sky, ridge:p.ridge, far:p.far, mid:p.mid, near:p.near, haze:p.haze, hazeA:p.hazeA, win:p.win, lit:p.lit, stars:p.stars, glow:p.glow, beam:p.beam},
    moon:{x:W*.8, y:H*G.ridge*.45, r:mr, glowR:H*.6, glowAlpha:.65, discAlpha:.9, parallax:.03},
    stars:s.stars.map(t=>({x:t.x,y:t.y,size:t.s,phase:t.p})),
    flakes:s.flakes.map(f=>({x:f.x,y:f.y,z:f.z,phase:f.ph,big:f.big})),
    fogs:s.fogs.map((f,i)=>({index:i,y:f.y,x:f.x,w:f.w,h:f.h,v:f.v,a:f.a,band:i%3===0?0:i%3===1?1:null})),
    snowman:{...sm, box:BOX, pivots:{whole:[0,0], head:[0,-48], arm:[9,-33]}, scarf:'#D9573D'},
    trainY: G.metro? H*G.metro-10 : null, districts: DISTRICTS.map(d=>({id:d.id,name:d.short,x:d.x,top:s.dY(d.id),matches:s.matches(d.id)})),
    layerWidths: Object.fromEntries(Object.entries(s.layers).map(([k,L])=>[k,L.w])) };
  // reference frames from the real draw(); fog/flake/snowman state recorded as used by that draw
  for (const [cf,t,tx] of [[0,0,0],[0.5,1.3,300],[1,2.7,520]]) { s.cam=s.maxCam*cf; s.t=t; s.trainX=tx; s.draw(0);
    out.frames[`cam${cf}_t${t}_train${tx}`]={png:url(cv), cam:s.cam, t, trainX:tx, fogX:s.fogs.map(f=>f.x), flakes:s.flakes.map(f=>[f.x,f.y])}; }
  cv.remove(); return out;
}
"""

def save_png(data_url, path):
    im = Image.open(io.BytesIO(base64.b64decode(data_url.split(',', 1)[1]))).convert('RGBA')
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True); return im

async def main(a):
    files = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 600, 'height': 900})
        await pg.goto(a.url); await pg.wait_for_timeout(800)
        for name, (mode, W, H) in SCENES.items():
            r = await pg.evaluate(JS, {'mode': mode, 'W': W, 'H': H, 'mood': a.mood, 'S': SCALE, 'BOX': SM_BOX})
            folder = f'{name}-winter'; base = os.path.join(a.out, folder)
            for n, L in r['layers'].items():
                im = Image.open(io.BytesIO(base64.b64decode(L['png'].split(',', 1)[1]))).convert('RGBA'); bb = im.getchannel('A').getbbox()
                if not bb: print(f'skip empty layer {folder}/{n}'); continue
                top = bb[1]; im = im.crop((0, top, im.width, bb[3])); fn = f'{name}_winter_{n}@3x.png'; path = os.path.join(base, fn)
                os.makedirs(base, exist_ok=True); im.save(path, optimize=True)
                files.append({'scene': name, 'theme': 'winter', 'file': f'{folder}/{fn}', 'kind': 'layer', 'layer': n, 'px': list(im.size),
                              'pt': [round(im.width / SCALE, 3), round(im.height / SCALE, 3)], 'offsetY_pt': round(top / SCALE, 4),
                              'layerWidth_pt': L['w'], 'bytes': os.path.getsize(path), 'parallax': L['f']})
            for n, S_ in r['sprites'].items():
                sc = S_.get('scale', SCALE); fn = f'{name}_winter_{n}@{sc}x.png'; im = save_png(S_['png'], os.path.join(base, fn))
                files.append({'scene': name, 'theme': 'winter', 'file': f'{folder}/{fn}', 'kind': 'sprite', 'sprite': n, 'px': list(im.size),
                              'pt': [S_['w'], S_['h']], 'bytes': os.path.getsize(os.path.join(base, fn)), 'density': sc})
            for n, F in r['frames'].items():
                save_png(F['png'], os.path.join(a.out, '_reference', f'{name}_winter_ref_{n}@3x.png'))
            json.dump(r['data'], open(os.path.join(base, f'{name}_winter_scene.json'), 'w'), indent=1)
            json.dump({k: {kk: vv for kk, vv in v.items() if kk != 'png'} for k, v in r['frames'].items()}, open(os.path.join(a.out, '_reference', f'{name}_winter_frames.json'), 'w'), indent=1)
        await b.close()
    json.dump(files, open(os.path.join(a.out, '_export_files_winter.json'), 'w'), indent=1)
    for f in files: print(f"{f['file']:52s} {str(f['px']):>14s} {f['bytes']/1024:7.1f} KB")

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://127.0.0.1:8765/pulsecity-v2.3.html'); ap.add_argument('--mood', default='chill')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
    asyncio.run(main(ap.parse_args()))
