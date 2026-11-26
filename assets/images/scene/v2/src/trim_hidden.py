"""Lossless memory trim: in preview/full scenes the ground ('near') layer is opaque from yN = H*GEOM.near down to the
bottom across its whole width, so anything in ridge/far/farCaps/mid/midCaps/metro below yN is never visible.
Crop those rows (keep 2 pt margin). Top offset is unchanged, so placement maths stay the same. Hero sets have no
ground in frame and are left alone. Updates _export_files_v2.json (px, pt, bytes)."""
import json, os, sys
import numpy as np
from PIL import Image
OUT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'pulsecity-scene-assets'))
pth = os.path.join(OUT, '_export_files_v2.json'); files = json.load(open(pth))
for st in sorted({f['set'] for f in files}):
    if st.startswith('hero'): continue
    D = json.load(open(os.path.join(OUT, st, st.replace('-', '_') + '_scene.json')))
    near = next((f for f in files if f['set'] == st and f.get('layer') == 'near'), None)
    yN = D['H'] * D['geom']['near']
    nim = np.asarray(Image.open(os.path.join(OUT, near['file'])))
    # confirm the ground really is opaque below yN for the full layer width
    r0 = int(round((yN + 1 - near['offsetY_pt']) * 3))
    assert nim[r0:, :, 3].min() == 255, f'{st}: near layer not opaque below yN'
    cut_pt = yN + 2
    for f in [f for f in files if f['set'] == st and f.get('layer') in ('ridge', 'far', 'farCaps', 'mid', 'midCaps', 'metro')]:
        p = os.path.join(OUT, f['file']); im = Image.open(p); keep = int(round((cut_pt - f['offsetY_pt']) * 3))
        if keep < im.height:
            before = im.width * im.height * 4; im = im.crop((0, 0, im.width, keep)); im.save(p, optimize=True)
            f.update({'px': list(im.size), 'pt': [round(im.width / 3, 3), round(im.height / 3, 3)], 'bytes': os.path.getsize(p), 'trimmedBelowGroundPt': round(cut_pt, 3)})
            print(f"{f['file']:48s} decoded {before/1e6:5.1f} -> {im.width*im.height*4/1e6:5.1f} MB")
json.dump(files, open(pth, 'w'), indent=1)
