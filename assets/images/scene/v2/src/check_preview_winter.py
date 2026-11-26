import asyncio, numpy as np
from playwright.async_api import async_playwright
from PIL import Image
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(); pg=await b.new_page(viewport={'width':1000,'height':1400},device_scale_factor=3); errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e))); pg.on('console',lambda m: m.type=='error' and errs.append(m.text))
    await pg.goto('http://127.0.0.1:8765/assets23/preview_site/index.html'); await pg.wait_for_timeout(1500)
    await pg.click('#theme'); await pg.click('#rm'); await pg.wait_for_timeout(600)
    await pg.evaluate("document.querySelectorAll('img[src*=shade]').forEach(i=>i.style.visibility='hidden')")
    for s in ['hero','preview']:
      await pg.locator(f'#{s}-winter').screenshot(path=f'/tmp/domw_{s}.png')
      a=np.asarray(Image.open(f'/tmp/domw_{s}.png').convert('RGB'),dtype=np.int16); r=np.asarray(Image.open(f'pulsecity-scene-assets/_reference/{s}_winter_ref_cam0_t0_train0@3x.png').convert('RGB'),dtype=np.int16)
      h=min(a.shape[0],r.shape[0]); w=min(a.shape[1],r.shape[1]); d=np.abs(a[:h,:w]-r[:h,:w]).max(2); m=np.ones_like(d,bool); m[:60,:60]=m[:60,-60:]=m[-60:,:60]=m[-60:,-60:]=False
      print(s,'winter DOM vs v2.3: mean',round(float(d[m].mean()),2),'>16:',round(float((d[m]>16).mean()*100),2),'%')
    await pg.click('#rm'); await pg.wait_for_timeout(2500); await pg.screenshot(path='/tmp/preview_w.png')
    print('errors',errs); await b.close()
asyncio.run(main())
