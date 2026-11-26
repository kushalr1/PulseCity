"""Fidelity check for Winter Wonderland: rebuild each reference frame from ONLY the exported winter files +
<scene>_winter_scene.json (+ the per-frame fog/flake positions v2.3 used), layered the way an app would, and
compare with the real v2.3 draw() output. In winter v2.3 blends beams normally, so no blend approximation is needed."""
import asyncio, base64, io, json, os, sys
import numpy as np
from PIL import Image
from playwright.async_api import async_playwright
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
BASE = 'http://127.0.0.1:8765/' + os.path.relpath(OUT, '/home/claude') + '/'
JS = r"""
async ({base, scene, frames, files}) => {
  const D = await (await fetch(base+scene+'-winter/'+scene+'_winter_scene.json')).json();
  const load=f=>new Promise((ok,er)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=er; i.src=base+f; });
  const img={}; for(const f of files) img[f.layer||f.sprite]={i:await load(f.file), m:f};
  const W=D.W,H=D.H,S=D.scale,P=D.palette, out={};
  for (const [key,fr] of Object.entries(frames)) {
    const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.setTransform(S,0,0,S,0,0); const cam=fr.cam, T=fr.t;
    c.drawImage(img.sky.i,0,0,W,H);
    for(const s of D.stars){ const a=P.stars*(.35+.65*(.5+.5*Math.sin(T*1.6+s.phase))); c.fillStyle=`rgba(255,255,255,${a*.8})`; c.fillRect(((s.x*W*1.3-cam*.04)%(W*1.3)+W*1.3)%(W*1.3)-W*.15,s.y*H,s.size,s.size); }
    const M=D.moon, mx=M.x-cam*M.parallax; c.drawImage(img.moon_glow.i,mx-M.glowR,M.y-M.glowR,M.glowR*2,M.glowR*2); const md=img.moon.m.pt[0]; c.drawImage(img.moon.i,mx-md/2,M.y-md/2,md,md);
    const lay=n=>{ const L=img[n]; if(!L) return; c.drawImage(L.i,-cam*L.m.parallax,L.m.offsetY_pt,L.m.pt[0],L.m.pt[1]); };
    const fog=(band,a)=>{ for(const b of D.fogs.filter(f=>f.band===band)){ const x0=fr.fogX[b.index]; for(const k of [-1,0]){ c.globalAlpha=b.a*a; c.drawImage(img.fog.i, x0+k*W*2-W*.3, b.y-b.h, b.w, b.h*2); } } c.globalAlpha=1; };
    lay('ridge'); fog(0,.1); lay('far'); lay('farCaps'); fog(1,.12); lay('mid'); lay('midCaps');
    if(img.beam_column){ const Lm=D.layerWidths.mid; for(const d of D.districts){ const x=d.x*Lm-cam*D.fac.mid; if(x<-40||x>W+40) continue;
        const it=.12+Math.min(2,d.matches)*.36, top=d.top-4, pulse=.85+.15*Math.sin(T*3+d.x*9);
        c.globalAlpha=.3*it*pulse; c.drawImage(img.beam_column.i,x-6,0,12,top); c.globalAlpha=Math.min(1,.7*it); c.drawImage(img.beam_halo.i,x-22,top-22,44,44); c.globalAlpha=1; } }
    lay('metro'); if(img.train){ const Lt=D.layerWidths.metro; c.drawImage(img.train.i,(fr.trainX%(Lt+200))-100-cam*.8,D.trainY,90,9); }
    lay('near');
    { const sm=D.snowman, B=sm.box, k=sm.scale, tilt=Math.sin(T*1.3)*.06, wave=Math.sin(T*2.4)*.5, w=B.w*k, h=B.h*k;
      c.save(); c.translate(sm.x,sm.y); c.rotate(tilt*.3);
      const put=(n)=>c.drawImage(img['snowman_'+n].i, B.x0*k, B.y0*k, w, h);
      put('body');
      c.save(); c.translate(0,-48*k); c.rotate(tilt); c.translate(0,48*k); put('head'); c.restore();
      put('front');
      c.save(); c.translate(9*k,-33*k); c.rotate(wave); c.translate(-9*k,33*k); put('arm'); c.restore();
      c.restore(); }
    D.flakes.forEach((f,i)=>{ const [x,y]=fr.flakes[i]; const R=f.big?2.6:.6+f.z*1.5; c.globalAlpha=.35+f.z*.55;
      if(f.big){ c.save(); c.translate(x,y); c.rotate(f.phase); c.drawImage(img.flake_big.i,-6,-6,12,12); c.restore(); }
      else { c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,R,0,6.29); c.fill(); } });
    c.globalAlpha=1; c.drawImage(img.frost.i,0,0,W,H);
    out[key]=cv.toDataURL('image/png'); }
  return out; }
"""
def diff(a,b):
    a=np.asarray(a.convert('RGB'),dtype=np.int16); b=np.asarray(b.convert('RGB'),dtype=np.int16); d=np.abs(a-b).max(2)
    return d,{'meanAbs':round(float(np.abs(a-b).mean()),3),'max':int(d.max()),'pctOver4':round(float((d>4).mean()*100),3),'pctOver16':round(float((d>16).mean()*100),3)}
async def main():
    files=json.load(open(os.path.join(OUT,'_export_files_winter.json'))); rep={}
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); await pg.goto(BASE+'_export_files_winter.json')
        for scene in ['hero','preview']:
            frames=json.load(open(os.path.join(OUT,'_reference',f'{scene}_winter_frames.json')))
            res=await pg.evaluate(JS,{'base':BASE,'scene':scene,'frames':frames,'files':[f for f in files if f['scene']==scene]})
            for k,u in res.items():
                comp=Image.open(io.BytesIO(base64.b64decode(u.split(',',1)[1]))); ref=Image.open(os.path.join(OUT,'_reference',f'{scene}_winter_ref_{k}@3x.png'))
                d,st=diff(comp,ref); comp.save(os.path.join(OUT,'_reference',f'{scene}_winter_composite_{k}@3x.png'))
                Image.fromarray(np.clip(d*8,0,255).astype('uint8')).save(os.path.join(OUT,'_reference',f'{scene}_winter_diff_{k}.png'))
                rep[f'{scene}-winter/normal/{k}']=st; print(f'{scene:8s} winter {k:28s} {st}')
        await b.close()
    json.dump(rep,open(os.path.join(OUT,'_reference','fidelity_report_winter.json'),'w'),indent=1)
asyncio.run(main())
