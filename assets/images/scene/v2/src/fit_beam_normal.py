"""Fit a beam sprite colour/opacity for plain alpha blending (no additive blend in RN without new deps).
Searches colour = mix(beam, white, m) and opacity multiplier k, minimising error vs the real v2.3 frames
inside the beam regions. Prints the best (m, k) and its error."""
import asyncio, json, os
from playwright.async_api import async_playwright
OUT='/home/claude/assets23/pulsecity-scene-assets'; BASE='http://127.0.0.1:8765/assets23/pulsecity-scene-assets/'
JS=r"""
async ({base, frames, ms, ks}) => {
  const D = await (await fetch(base+'preview/preview_scene.json')).json();
  const F = await (await fetch(base+'_export_files.json')).json();
  const load = f => new Promise((ok,er)=>{ const i=new Image(); i.onload=()=>ok(i); i.onerror=er; i.src=base+f; });
  const img={}; for (const f of F.filter(f=>f.scene==='preview')) img[f.layer||f.sprite]={i:await load(f.file), m:f};
  const W=D.W,H=D.H,S=3,P=D.palette, rgba=(c,a=1)=>`rgba(${c[0]|0},${c[1]|0},${c[2]|0},${a})`, mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  const spr=(m)=>{ const col=mix(P.beam,[255,255,255],m);
    const a=document.createElement('canvas'); a.width=36; a.height=384; let g=a.getContext('2d'); g.setTransform(3,0,0,3,0,0); let gr=g.createLinearGradient(0,0,0,128); gr.addColorStop(0,rgba(col,0)); gr.addColorStop(1,rgba(col,1)); g.fillStyle=gr; g.fillRect(0,0,12,128);
    const b=document.createElement('canvas'); b.width=132; b.height=132; g=b.getContext('2d'); g.setTransform(3,0,0,3,0,0); gr=g.createRadialGradient(22,22,0,22,22,22); gr.addColorStop(0,rgba(col,1)); gr.addColorStop(1,rgba(col,0)); g.fillStyle=gr; g.fillRect(0,0,44,44); return [a,b]; };
  const res=[];
  const refs={}; for (const k of Object.keys(frames)) refs[k]=await load('_reference/preview_ref_'+k+'@3x.png');
  for (const m of ms) { const [col,halo]=spr(m);
    for (const k of ks) { let err=0, n=0;
      for (const [key,fr] of Object.entries(frames)) {
        const cv=document.createElement('canvas'); cv.width=W*S; cv.height=H*S; const c=cv.getContext('2d'); c.setTransform(S,0,0,S,0,0); const cam=fr.cam,T=fr.t;
        c.drawImage(img.sky.i,0,0,W,H);
        if(P.stars>.02) for(const s of D.stars){ const a=P.stars*(.35+.65*(.5+.5*Math.sin(T*1.6+s.phase))); c.fillStyle=`rgba(255,255,255,${a*.8})`; c.fillRect(((s.x*W*1.3-cam*.04)%(W*1.3)+W*1.3)%(W*1.3)-W*.15,s.y*H,s.size,s.size); }
        const mx=D.moon.x-cam*.03,my=D.moon.y; c.drawImage(img.moon_glow.i,mx-D.moon.glowR,my-D.moon.glowR,D.moon.glowR*2,D.moon.glowR*2); const md=img.moon.m.pt[0]; c.drawImage(img.moon.i,mx-md/2,my-md/2,md,md);
        const lay=n=>{const L=img[n]; c.drawImage(L.i,-cam*L.m.parallax,L.m.offsetY_pt,L.m.pt[0],L.m.pt[1]);}; lay('ridge');lay('far');lay('mid');
        const Lm=D.layerWidths.mid; const boxes=[];
        for(const d of D.districts){ const x=d.x*Lm-cam*D.fac.mid; if(x<-40||x>W+40) continue; const it=.12+Math.min(2,d.matches)*.36, top=d.top-4, pulse=.85+.15*Math.sin(T*3+d.x*9);
          c.globalAlpha=Math.min(1,.42*it*pulse*k); c.drawImage(col,x-6,0,12,top); c.globalAlpha=Math.min(1,.7*it*k); c.drawImage(halo,x-22,top-22,44,44); c.globalAlpha=1; boxes.push([x-24,0,48,top+24]); }
        lay('metro'); const Lt=D.layerWidths.metro; c.drawImage(img.train.i,(fr.trainX%(Lt+200))-100-cam*.8,D.trainY,90,9); lay('near'); c.drawImage(img.vignette.i,0,0,W,H);
        const A=c.getImageData(0,0,W*S,H*S).data; const rc=document.createElement('canvas'); rc.width=W*S; rc.height=H*S; const r=rc.getContext('2d'); r.drawImage(refs[key],0,0); const B=r.getImageData(0,0,W*S,H*S).data;
        for(const [bx,by,bw,bh] of boxes){ for(let y=Math.max(0,by*S|0); y<Math.min(H*S,(by+bh)*S|0); y+=2) for(let x=Math.max(0,bx*S|0); x<Math.min(W*S,(bx+bw)*S|0); x+=2){ const i=(y*W*S+x)*4; err+=Math.abs(A[i]-B[i])+Math.abs(A[i+1]-B[i+1])+Math.abs(A[i+2]-B[i+2]); n+=3; } }
      }
      res.push({m,k,err:err/n}); } }
  return res.sort((a,b)=>a.err-b.err);
}"""
async def main():
    fr=json.load(open(OUT+'/_reference/preview_frames.json'))
    async with async_playwright() as p:
        b=await p.chromium.launch(); pg=await b.new_page(); await pg.goto(BASE+'_export_files.json')
        r=await pg.evaluate(JS,{'base':BASE,'frames':fr,'ms':[0,.1,.2,.3,.4,.5,.6],'ks':[1,1.25,1.5,1.75,2,2.25,2.5,3]})
        for x in r[:5]: print(x)
        print('baseline m=0 k=1:', [x for x in r if x['m']==0 and x['k']==1])
        await b.close()
asyncio.run(main())
