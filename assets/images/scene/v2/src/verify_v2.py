"""Fidelity check for package v2.0: for every exported set, rebuild each reference frame from ONLY the exported files +
<set>_scene.json (+ per-frame dynamic state recorded from v2.3: fog x, flake x/y, car x, Surprise phase), layered with
plain alpha (what React Native can do with no new dependencies), and compare with the real v2.3 draw()."""
import asyncio, base64, io, json, os, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
ONLY = set(sys.argv[2].split(',')) if len(sys.argv) > 2 and sys.argv[2] else None
BASE = 'http://127.0.0.1:8765/' + os.path.relpath(OUT, '/home/claude') + '/'
BOOST = json.loads(os.environ.get('PC_BOOST', '{"beam": 1.5, "car": 1.0, "cone": 1.0, "flash": 1.0}'))
TAG = os.environ.get('PC_TAG', '')  # normal-blend opacity multipliers for v2.3's additive (city) effects

JS = r"""
async ({base, set, pre, frames, files, BOOST, SMF}) => {
  const D=await (await fetch(base+set+'/'+pre+'_scene.json')).json();
  const load=f=>new Promise((ok,er)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=er; i.src=base+f; });
  const img={}; for(const f of files) img[f.layer||f.sprite]={i:await load(f.file), m:f};
  const W=D.W,H=D.H,S=D.scale,P=D.palette,win=P.winter, ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2, lerp=(a,b,t)=>a+(b-a)*t, out={};
  for(const [key,fr] of Object.entries(frames)){
    const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.setTransform(S,0,0,S,0,0); const cam=fr.cam, T=fr.t, sp=fr.sp||null;
    c.drawImage(img.sky.i,0,0,W,H);
    if(P.stars>.02) for(const s of D.stars){ const a=P.stars*(.35+.65*(.5+.5*Math.sin(T*1.6+s.phase))); c.fillStyle=`rgba(255,255,255,${a*.8})`; c.fillRect(((s.x*W*1.3-cam*.04)%(W*1.3)+W*1.3)%(W*1.3)-W*.15,s.y*H,s.size,s.size); }
    const M=D.moon, mx=M.x-cam*M.parallax; c.drawImage(img.moon_glow.i,mx-M.glowR,M.y-M.glowR,M.glowR*2,M.glowR*2); const md=img.moon.m.pt[0]; c.drawImage(img.moon.i,mx-md/2,M.y-md/2,md,md);
    const lay=n=>{ const L=img[n]; if(!L) return; c.drawImage(L.i,-cam*L.m.parallax,L.m.offsetY_pt,L.m.pt[0],L.m.pt[1]); };
    const fog=(band,a)=>{ for(const b of D.fogs.filter(f=>f.band===band)){ const x0=fr.fogX[b.index]; for(const k of [-1,0]){ c.globalAlpha=b.a*a; c.drawImage(img.fog.i,x0+k*W*2-W*.3,b.y-b.h,b.w,b.h*2); } } c.globalAlpha=1; };
    lay('ridge'); if(win) fog(0,.1); lay('far'); if(win){ lay('farCaps'); fog(1,.12); } lay('mid'); if(win) lay('midCaps');
    const Lm=D.layerWidths.mid, dX=d=>d.x*Lm-cam*.6;
    const tgt = sp ? D.districts.find(d=>d.id===sp.target) : null;
    if(img.beam_column){ const kb=win?1:BOOST.beam;
      for(const d of D.districts){ const x=dX(d); if(x<-40||x>W+40) continue; let it=.12+Math.min(2,d.matches)*.36; if(sp&&tgt.id===d.id&&sp.phase!=='search') it=1.5;
        const top=d.top-4, pulse=.85+.15*Math.sin(T*3+d.x*9);
        c.globalAlpha=Math.min(1,(win?.3:.42)*it*pulse*kb); c.drawImage(img.beam_column.i,x-6,0,12,top); c.globalAlpha=Math.min(1,.7*it*kb); c.drawImage(img.beam_halo.i,x-22,top-22,44,44); c.globalAlpha=1; } }
    if(img.metro){ lay('metro'); const Lt=D.layerWidths.metro; c.drawImage(img.train.i,(fr.trainX%(Lt+200))-100-cam*.8,D.trainY,90,9); }
    lay('near');
    if(win) for(const sm of D.snowmen){ const B={x0:-27,y0:-71,w:54,h:78}, k=sm.scale, x=sm.screenSpace?sm.x:sm.layerX-cam*.6; if(x<-40||x>W+40) continue;
      const tilt=Math.sin(T*1.3+sm.k)*.06, wave=Math.sin(T*2.4+sm.k*2)*.5, w=B.w*k, h=B.h*k;
      c.save(); c.translate(x,sm.y); c.rotate(tilt*.3); const put=n=>c.drawImage(img[n].i,B.x0*k,B.y0*k,w,h);
      put('snowman_body'); c.save(); c.translate(0,-48*k); c.rotate(tilt); c.translate(0,48*k); put('snowman_head'); c.restore();
      put(img.snowman_front? 'snowman_front' : (sm.k? 'snowman_front_blue':'snowman_front_red'));
      c.save(); c.translate(9*k,-33*k); c.rotate(wave); c.translate(-9*k,33*k); put('snowman_arm'); c.restore(); c.restore(); }
    if(D.cars){ const Ln=D.layerWidths.near, op=(win?.6:.95)*BOOST.car;
      D.cars.forEach((k,i)=>{ const x=fr.cars[i]*Ln-cam; if(x<-30||x>W+30) return; const y=H*(k.lane?.9:.87), len=12+20*k.v*P.traffic; c.globalAlpha=Math.min(1,op);
        if(k.lane) c.drawImage(img.car_tail.i,x,y-1,len,2); else { c.save(); c.translate(x,0); c.scale(-1,1); c.drawImage(img.car_head.i,0,y-1,len,2); c.restore(); } }); c.globalAlpha=1; }
    if(fr.dimA){ c.fillStyle=win?`rgba(10,20,45,${fr.dimA*.7})`:`rgba(0,0,10,${fr.dimA})`; c.fillRect(0,0,W,H); }
    if(sp){ const tx=dX(tgt)+(sp.phase==='search'?Math.sin(sp.t*14)*(1-sp.t)*80:0), ty=tgt.top, bx=W/2, by=H+20;
      if(!win && img.surprise_cone){ const ang=Math.atan2(ty-by,tx-bx), len=Math.hypot(tx-bx,ty-by)+30, m=img.surprise_cone.m, s=len/m.pt[0];
        c.save(); c.translate(bx,by); c.rotate(ang); c.globalAlpha=Math.min(1,BOOST.cone); c.drawImage(img.surprise_cone.i,0,-m.apex[1]*s,len,m.pt[1]*s); c.restore(); c.globalAlpha=1; }
      if(sp.phase==='lock'){ const R=16+sp.t*130; c.globalAlpha=Math.min(1,.9*(1-sp.t)*(win?1:BOOST.flash)); c.drawImage(img.surprise_flash.i,tx-R,ty-R,R*2,R*2); c.globalAlpha=1; } }
    if(win){ let tx=null,ty=null,g=0; if(sp){ tx=dX(tgt); ty=tgt.top; g=sp.phase==='search'?ease(Math.min(1,sp.t)):1; }
      D.flakes.forEach((f,i)=>{ let [x,y]=fr.flakes[i]; if(tx!=null){ x=lerp(x,tx+Math.cos(f.phase+T*3)*(10+f.z*24),g*.85); y=lerp(y,ty+Math.sin(f.phase+T*3)*(10+f.z*20),g*.85); }
        const R=f.big?2.6:.6+f.z*1.5; c.globalAlpha=.35+f.z*.55;
        if(f.big){ c.save(); c.translate(x,y); c.rotate(f.phase); c.drawImage(img.flake_big.i,-6,-6,12,12); c.restore(); } else { c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,R,0,6.29); c.fill(); } });
      c.globalAlpha=1; c.drawImage(img.frost.i,0,0,W,H); }
    else c.drawImage(img.vignette.i,0,0,W,H);
    out[key]=cv.toDataURL('image/png'); }
  return out; }
"""
def diff(a, b):
    a = np.asarray(a.convert('RGB'), dtype=np.int16); b = np.asarray(b.convert('RGB'), dtype=np.int16); d = np.abs(a - b).max(2)
    return d, {'meanAbs': round(float(np.abs(a - b).mean()), 3), 'max': int(d.max()), 'pctOver4': round(float((d > 4).mean() * 100), 3), 'pctOver16': round(float((d > 16).mean() * 100), 3)}

async def main():
    files = json.load(open(os.path.join(OUT, '_export_files_v2.json'))); sets = sorted({f['set'] for f in files}); rep = {}
    rd = os.path.join(OUT, '_reference', 'v2')
    async with async_playwright() as p:
        b = await p.chromium.launch(); pg = await b.new_page(); await pg.goto(BASE + '_export_files_v2.json')
        for st in sets:
            if ONLY and st not in ONLY: continue
            pre = st.replace('-', '_'); frames = json.load(open(os.path.join(rd, f'{pre}_frames.json')))
            res = await pg.evaluate(JS, {'base': BASE, 'set': st, 'pre': pre, 'frames': frames, 'files': [f for f in files if f['set'] == st], 'BOOST': BOOST, 'SMF': 1.35})
            for k, u in res.items():
                comp = Image.open(io.BytesIO(base64.b64decode(u.split(',', 1)[1]))); ref = Image.open(os.path.join(rd, f'{pre}_ref_{k}@3x.png'))
                d, s = diff(comp, ref); rep[f'{st}/{k}'] = s
                if not TAG:
                    comp.save(os.path.join(rd, f'{pre}_composite_{k}@3x.png'))
                    Image.fromarray(np.clip(d * 8, 0, 255).astype('uint8')).save(os.path.join(rd, f'{pre}_diff_{k}.png'))
            worst = max((v for kk, v in rep.items() if kk.startswith(st + '/')), key=lambda v: v['pctOver16'])
            print(f'{st:26s} frames={len(res)} worst: mean {worst["meanAbs"]:5.2f}  >16 {worst["pctOver16"]:6.3f}%', flush=True)
        await b.close()
    old = {}
    pth = os.path.join(OUT, '_reference', f'fidelity_report_v2{TAG}.json')
    if ONLY and os.path.exists(pth): old = json.load(open(pth))
    old.update(rep); json.dump(old, open(pth, 'w'), indent=1)
asyncio.run(main())
