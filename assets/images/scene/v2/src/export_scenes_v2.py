"""
PulseCity v2.3 -> React Native scene assets, package v2.0 (all moods, both themes, hero / preview / full-screen,
Surprise Me). Runs the ORIGINAL CityScene renderer from pulsecity-v2.3.html at @3x and saves its own layer canvases,
sprites drawn with the exact scene.js canvas calls, per-set scene data and reference frames from the real draw().

Folder naming keeps v1.2 unchanged:  <surface>[-winter][-<mood>]   (mood omitted for chill)
  hero, hero-winter, hero-social, hero-winter-social, ..., preview..., full, full-winter, full-social, ...
v1.2 sets (hero/preview x chill x city/winter) are NOT re-exported by default (use --include-v12 to compare).

Usage: python3 export_scenes_v2.py [--url ...] [--out ../pulsecity-scene-assets] [--only full-social,...]
"""
import argparse, asyncio, base64, io, json, os
from playwright.async_api import async_playwright
from PIL import Image

SCALE = 3
MOODS = ['chill', 'social', 'nature', 'active', 'foodie', 'explore']
THEMES = ['city', 'winter']
SURFACES = {'hero': ('band', 390, 243), 'preview': ('panel', 358, 208), 'full': ('full', 390, 844)}
SM_BOX = {'x0': -27, 'y0': -71, 'w': 54, 'h': 78}
SM_FULL_SCALE = 1.35   # largest full-screen snowman; app scales the sprite down for the others

def folder(surface, theme, mood):
    return surface + ('-winter' if theme == 'winter' else '') + ('' if mood == 'chill' else '-' + mood)

JS = r"""
async ({mode, W, H, mood, theme, S, BOX, SMF}) => {
  const cv=document.createElement('canvas'); cv.style.cssText=`position:fixed;left:0;top:0;width:${W}px;height:${H}px`; document.body.appendChild(cv);
  const s=new CityScene(cv,{mode, mood, theme, reduced:()=>false, static:false, intro:false});
  s.resize=function(){ this.W=W; this.H=H; this.dpr=S; this.cv.width=Math.round(W*S); this.cv.height=Math.round(H*S);
    this.ctx.setTransform(S,0,0,S,0,0); this.maxCam=this.W*(this.g.world-1); if(this.cam>this.maxCam) this.cam=this.maxCam;
    if(this.mode==='full' && this.cam===0) this.cam=this.camForD('cyber');
    this.build(); this.renderLayers(); this.ready=true; return true; };
  s.resize(); s.entrance=1; s.snowAmt=1;
  const p=s.pal, G=s.g, win=!!p.winter, out={layers:{}, sprites:{}, frames:{}, data:{}}, url=c=>c.toDataURL('image/png');
  const FK={farCaps:'far', midCaps:'mid'};
  for(const n of ['ridge','far','farCaps','mid','midCaps','metro','near']){ const L=s.layers[n]; if(L) out.layers[n]={png:url(L.c), w:L.w, f:FAC[FK[n]||n]}; }
  const mk=(w,h,sc=S)=>{ const c=document.createElement('canvas'); c.width=Math.max(1,Math.round(w*sc)); c.height=Math.max(1,Math.round(h*sc)); const g=c.getContext('2d'); g.setTransform(sc,0,0,sc,0,0); return [c,g]; };
  { const [c,g]=mk(1,H); const sg=g.createLinearGradient(0,0,0,H*G.mid); sg.addColorStop(0,rgba(p.sky[0])); sg.addColorStop(.55,rgba(p.sky[1])); sg.addColorStop(1,rgba(p.sky[2])); g.fillStyle=sg; g.fillRect(0,0,1,H); out.sprites.sky={png:url(c),w:1,h:H}; }
  const mr=Math.max(7,H*.045);
  { const d=Math.ceil(mr*2+2); const [c,g]=mk(d,d); g.fillStyle=rgba(p.glow,win?.9:.95); g.beginPath(); g.arc(d/2,d/2,mr,0,6.29); g.fill(); out.sprites.moon={png:url(c),w:d,h:d,r:mr}; }
  { const R=H*.6, d=Math.ceil(R*2); const [c,g]=mk(d,d,1); const og=g.createRadialGradient(d/2,d/2,0,d/2,d/2,R); og.addColorStop(0,rgba(p.glow,win?.65:.35)); og.addColorStop(1,rgba(p.glow,0)); g.fillStyle=og; g.fillRect(0,0,d,d); out.sprites.moon_glow={png:url(c),w:d,h:d,r:R,scale:1}; }
  if(win){ const [c,g]=mk(W,H,1); const fr=g.createRadialGradient(W/2,H*.5,Math.min(W,H)*.6,W/2,H*.5,Math.max(W,H)*.8); fr.addColorStop(0,'rgba(230,242,255,0)'); fr.addColorStop(1,'rgba(235,245,255,.2)'); g.fillStyle=fr; g.fillRect(0,0,W,H); out.sprites.frost={png:url(c),w:W,h:H,scale:1}; }
  else { const [c,g]=mk(W,H,1); const vg=g.createRadialGradient(W/2,H*.45,H*.3,W/2,H*.5,Math.max(W,H)*.85); vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,.3)'); g.fillStyle=vg; g.fillRect(0,0,W,H); out.sprites.vignette={png:url(c),w:W,h:H,scale:1}; }
  if(win){
    out.sprites.fog={png:url(s.fogSprite),w:128,h:128,scale:1};
    { const R=2.6,B=12; const [c,g]=mk(B,B); g.translate(B/2,B/2); g.strokeStyle='#fff'; g.lineWidth=.9; g.beginPath(); for(let k=0;k<3;k++){ const an=k*Math.PI/3; g.moveTo(-Math.cos(an)*R*1.6,-Math.sin(an)*R*1.6); g.lineTo(Math.cos(an)*R*1.6,Math.sin(an)*R*1.6); } g.stroke(); out.sprites.flake_big={png:url(c),w:B,h:B}; }
    const SC = mode==='band'?.62 : mode==='panel'?.8 : SMF;
    const part=(fn)=>{ const [c,g]=mk(BOX.w*SC,BOX.h*SC); g.scale(SC,SC); g.translate(-BOX.x0,-BOX.y0); fn(g); return url(c); };
    const body=(c,cy,r)=>{ const gg=c.createRadialGradient(-r*.35,cy-r*.4,r*.2,0,cy,r); gg.addColorStop(0,'#FFFFFF'); gg.addColorStop(1,'#C9DAF0'); c.fillStyle=gg; c.beginPath(); c.arc(0,cy,r,0,6.29); c.fill(); };
    const front=(scarf)=>c=>{ c.fillStyle=scarf; c.fillRect(-9,-41,18,4); c.fillRect(3,-41,4,10); c.strokeStyle='#5A3E2A'; c.lineWidth=1.6; c.lineCap='round'; c.beginPath(); c.moveTo(-9,-33); c.lineTo(-22,-40); c.stroke(); c.fillStyle='#1B2236'; [-30,-24,-16,-9].forEach(yy=>{ c.beginPath(); c.arc(0,yy,1.1,0,6.29); c.fill(); }); };
    const dims={w:BOX.w*SC,h:BOX.h*SC};
    out.sprites.snowman_body={...dims, png:part(c=>{ c.fillStyle='rgba(20,40,80,.18)'; c.beginPath(); c.ellipse(0,0,16,4,0,0,6.29); c.fill(); body(c,-12,13); body(c,-32,10); })};
    out.sprites.snowman_head={...dims, png:part(c=>{ c.translate(0,-48); body(c,0,7.5); c.fillStyle='#22283A'; c.fillRect(-6,-12,12,3); c.fillRect(-4,-21,8,10); c.fillStyle='#F08A2E'; c.beginPath(); c.moveTo(1,0); c.lineTo(9,1.5); c.lineTo(1,2.5); c.fill(); c.fillStyle='#1B2236'; c.fillRect(-3.5,-2.5,1.6,1.6); c.fillRect(2,-2.5,1.6,1.6); })};
    if(mode==='full'){ out.sprites.snowman_front_red={...dims, png:part(front('#D9573D'))}; out.sprites.snowman_front_blue={...dims, png:part(front('#3F79BF'))}; }
    else out.sprites.snowman_front={...dims, png:part(front('#D9573D'))};
    out.sprites.snowman_arm={...dims, png:part(c=>{ c.strokeStyle='#5A3E2A'; c.lineWidth=1.6; c.lineCap='round'; c.translate(9,-33); c.rotate(-.6); c.beginPath(); c.moveTo(0,0); c.lineTo(14,0); c.moveTo(10,0); c.lineTo(13,-4); c.stroke(); })};
    out.snowmanScale=SC;
  }
  if(G.metro){
    { const [c,g]=mk(90,9); g.fillStyle=rgba(mix(p.mid,[255,255,255],.14)); g.fillRect(0,0,90,9); g.fillStyle=rgba(p.win,.9); for(let i=0;i<8;i++) g.fillRect(6+i*10,3,6,3); out.sprites.train={png:url(c),w:90,h:9}; }
    { const BH=128; const [c,g]=mk(12,BH); const bg=g.createLinearGradient(0,0,0,BH); bg.addColorStop(0,rgba(p.beam,0)); bg.addColorStop(1,rgba(p.beam,1)); g.fillStyle=bg; g.fillRect(0,0,12,BH); out.sprites.beam_column={png:url(c),w:12,h:BH}; }
    { const [c,g]=mk(44,44); const gl=g.createRadialGradient(22,22,0,22,22,22); gl.addColorStop(0,rgba(p.beam,1)); gl.addColorStop(1,rgba(p.beam,0)); g.fillStyle=gl; g.fillRect(0,0,44,44); out.sprites.beam_halo={png:url(c),w:44,h:44}; }
  }
  if(mode==='full'){
    // car light streaks: unit sprites 64x2 pt, opaque end at x=0 (head of the streak), alpha 1; app stretches to len and sets opacity
    for(const [n,col] of [['car_head',[255,240,215]],['car_tail',[255,70,80]]]){ const [c,g]=mk(64,2); const gr=g.createLinearGradient(0,0,64,0); gr.addColorStop(0,rgba(col,1)); gr.addColorStop(1,rgba(col,0)); g.fillStyle=gr; g.fillRect(0,0,64,2); out.sprites[n]={png:url(c),w:64,h:2}; }
    // Surprise Me: searchlight cone (city only in v2.3), unit length 400 pt pointing right from apex (0, half-height),
    // half-angle 0.07 rad, gradient beam .55 -> .1 along its length; lock-on flash: radial beam colour alpha 1 -> 0, 100 pt radius
    if(!win){ const Lc=400, hw=Math.tan(.07)*Lc; const [c,g]=mk(Lc,hw*2+2); const bg=g.createLinearGradient(0,0,Lc,0); bg.addColorStop(0,rgba(p.beam,.55)); bg.addColorStop(1,rgba(p.beam,.1)); g.fillStyle=bg; g.beginPath(); g.moveTo(0,hw+1); g.lineTo(Lc,1); g.lineTo(Lc,hw*2+1); g.fill(); out.sprites.surprise_cone={png:url(c),w:Lc,h:hw*2+2,apex:[0,hw+1],halfAngle:.07}; }
    { const R=100; const [c,g]=mk(R*2,R*2); const fl=g.createRadialGradient(R,R,0,R,R,R); fl.addColorStop(0,rgba(p.beam,1)); fl.addColorStop(1,rgba(p.beam,0)); g.fillStyle=fl; g.fillRect(0,0,R*2,R*2); out.sprites.surprise_flash={png:url(c),w:R*2,h:R*2}; }
  }
  const yN=H*G.near; const mid=s.lw(FAC.mid);
  const snowmen = !win ? [] : (yN>H-6) ? [{x:W*.9, y:H*G.mid, scale:.62, scarf:'red', k:0, screenSpace:true}]
    : (mode!=='full') ? [{x:W*.86, y:yN+4, scale:.8, scarf:'red', k:0, screenSpace:true}]
    : [['s29',36,1.35,0],['cyber',-70,1.15,1],['galleria',50,1.3,0],['green',-40,1.2,1],['old',40,1.2,1]].map(([id,off,sc,k])=>{ const d=DISTRICTS.find(x=>x.id===id); return {district:id, layerX:d.x*mid+off, y:yN+6, scale:sc, k, scarf:k?'blue':'red', screenSpace:false, x:'layerX - cam*0.6'}; });
  out.data={ mode, W, H, scale:S, theme, mood, world:G.world, maxCam:s.maxCam, initialCam:s.cam, geom:G, fac:FAC,
    palette:{sky:p.sky, ridge:p.ridge, far:p.far, mid:p.mid, near:p.near, haze:p.haze, hazeA:p.hazeA, win:p.win, lit:p.lit, stars:p.stars, glow:p.glow, beam:p.beam, traffic:p.traffic, winter:win},
    moon:{x:W*.8, y:H*G.ridge*.45, r:mr, glowR:H*.6, glowAlpha:win?.65:.35, discAlpha:win?.9:.95, parallax:.03},
    stars:s.stars.map(t=>({x:t.x,y:t.y,size:t.s,phase:t.p})),
    trainY:G.metro?H*G.metro-10:null, metroY:G.metro?H*G.metro:null,
    districts:DISTRICTS.map(d=>({id:d.id,name:d.short,x:d.x,top:s.dY(d.id),matches:s.matches(d.id),camForDistrict:mode==='full'?s.camForD(d.id):null})),
    layerWidths:Object.fromEntries(Object.entries(s.layers).map(([k,L])=>[k,L.w])),
    snowmen, snowmanSpriteScale: out.snowmanScale||null,
    flakes: win? s.flakes.map(f=>({x:f.x,y:f.y,z:f.z,phase:f.ph,big:f.big})) : null,
    fogs: win? s.fogs.map((f,i)=>({index:i,y:f.y,x:f.x,w:f.w,h:f.h,v:f.v,a:f.a,band:i%3===0?0:i%3===1?1:null})) : null,
    cars: mode==='full'? s.cars.map(k=>({x:k.x,lane:k.lane,v:k.v})) : null };
  // reference frames from the real draw(); dynamic state recorded as used by that draw
  const shots = mode==='full' ? [[null,0,0],[.35,1.3,300],[.8,2.7,700]] : [[0,0,0],[.5,1.3,300],[1,2.7,520]];
  for(const [cf,t,tx] of shots){ if(cf!=null) s.cam=s.maxCam*cf; s.t=t; s.trainX=tx; s.draw(0);
    out.frames[`cam${cf==null?'init':cf}_t${t}`]={png:url(cv), cam:s.cam, t, trainX:tx, fogX:win?s.fogs.map(f=>f.x):null, flakes:win?s.flakes.map(f=>[f.x,f.y]):null, cars:mode==='full'?s.cars.map(k=>k.x):null}; }
  // Surprise Me reference frames (full only): mid-search and mid-lock, target Cyber City from Old Gurugram
  if(mode==='full'){
    const runTo=(phase,t)=>{ s.cam=s.camForD('old'); s.dimA=.45; s.sp={phase,t,d:DISTRICTS.find(x=>x.id==='cyber'),from:s.camForD('old'),to:s.camForD('cyber'),fast:false};
      if(phase==='search'){ const e=ease(Math.min(1,t)); s.cam=lerp(s.sp.from,s.sp.to,e)+Math.sin(e*Math.PI)*W*.25*(s.sp.to>=s.sp.from?-1:1); } else s.cam=s.sp.to;
      s.t=1.0; s.draw(0); return {png:url(cv), cam:s.cam, t:1.0, sp:{phase,t,target:'cyber'}, dimA:.45, trainX:s.trainX, fogX:win?s.fogs.map(f=>f.x):null, flakes:win?s.flakes.map(f=>[f.x,f.y]):null, cars:s.cars.map(k=>k.x)}; };
    out.frames['surprise_search']=runTo('search',.5); out.frames['surprise_lock']=runTo('lock',.4); s.sp=null; s.dimA=0;
  }
  cv.remove(); return out;
}
"""

def crop_save(data_url, path):
    im = Image.open(io.BytesIO(base64.b64decode(data_url.split(',', 1)[1]))).convert('RGBA'); bb = im.getchannel('A').getbbox()
    if not bb: return None, None
    top = bb[1]; im = im.crop((0, top, im.width, bb[3])); os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True); return im, top

def save(data_url, path):
    im = Image.open(io.BytesIO(base64.b64decode(data_url.split(',', 1)[1]))).convert('RGBA'); os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True); return im

async def main(a):
    only = set(a.only.split(',')) if a.only else None
    jobs = [(s, t, m) for s in SURFACES for t in THEMES for m in MOODS
            if (a.include_v12 or not (s in ('hero', 'preview') and m == 'chill')) and (not only or folder(s, t, m) in only)]
    files = []
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(viewport={'width': 600, 'height': 900})
        await pg.goto(a.url); await pg.wait_for_timeout(800)
        for (surf, theme, mood) in jobs:
            mode, W, H = SURFACES[surf]; fo = folder(surf, theme, mood); pre = fo.replace('-', '_'); base = os.path.join(a.out, fo)
            r = await pg.evaluate(JS, {'mode': mode, 'W': W, 'H': H, 'mood': mood, 'theme': theme, 'S': SCALE, 'BOX': SM_BOX, 'SMF': SM_FULL_SCALE})
            for n, L in r['layers'].items():
                fn = f'{pre}_{n}@3x.png'; im, top = crop_save(L['png'], os.path.join(base, fn))
                if im is None: continue
                files.append({'set': fo, 'surface': surf, 'theme': theme, 'mood': mood, 'file': f'{fo}/{fn}', 'kind': 'layer', 'layer': n, 'px': list(im.size),
                              'pt': [round(im.width / SCALE, 3), round(im.height / SCALE, 3)], 'offsetY_pt': round(top / SCALE, 4), 'layerWidth_pt': L['w'],
                              'bytes': os.path.getsize(os.path.join(base, fn)), 'parallax': L['f']})
            for n, S_ in r['sprites'].items():
                sc = S_.get('scale', SCALE); fn = f'{pre}_{n}@{sc}x.png'; im = save(S_['png'], os.path.join(base, fn))
                e = {'set': fo, 'surface': surf, 'theme': theme, 'mood': mood, 'file': f'{fo}/{fn}', 'kind': 'sprite', 'sprite': n, 'px': list(im.size),
                     'pt': [S_['w'], S_['h']], 'bytes': os.path.getsize(os.path.join(base, fn)), 'density': sc}
                for k in ('apex', 'halfAngle'):
                    if k in S_: e[k] = S_[k]
                files.append(e)
            rd = os.path.join(a.out, '_reference', 'v2')
            for n, F in r['frames'].items(): save(F['png'], os.path.join(rd, f'{pre}_ref_{n}@3x.png'))
            json.dump(r['data'], open(os.path.join(base, f'{pre}_scene.json'), 'w'), indent=1)
            json.dump({k: {kk: vv for kk, vv in v.items() if kk != 'png'} for k, v in r['frames'].items()}, open(os.path.join(rd, f'{pre}_frames.json'), 'w'), indent=1)
            print(f'{fo:28s} {sum(1 for f in files if f["set"]==fo):3d} files {sum(f["bytes"] for f in files if f["set"]==fo)/1024:8.1f} KB', flush=True)
        await b.close()
    prev = []
    pth = os.path.join(a.out, '_export_files_v2.json')
    if only and os.path.exists(pth): prev = [f for f in json.load(open(pth)) if f['set'] not in {f['set'] for f in files}]
    json.dump(prev + files, open(pth, 'w'), indent=1)

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--url', default='http://127.0.0.1:8765/pulsecity-v2.3.html')
    ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
    ap.add_argument('--only', default=''); ap.add_argument('--include-v12', action='store_true')
    asyncio.run(main(ap.parse_args()))
