from pathlib import Path
import json
import numpy as np
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
# Reuse the crop and background-cleanup helpers without regenerating earlier artwork.
helpers=(ROOT/'scripts/prepare-welcome-groups.py').read_text(encoding='utf-8').split("manifest={'canvas'")[0]
ns={"__file__":str(ROOT/'scripts/prepare-welcome-groups.py')};exec(helpers,ns)
clean=ns['checker_cutout'](Image.open(r'C:/Users/JCASUN~1/AppData/Local/Temp/codex-clipboard-03215281-c2eb-4ed2-94af-8788d0e29048.png'))
a=np.array(clean.getchannel('A'));h,w=a.shape
row=ns['seam'](a.T,550,20);yy=np.arange(h)[:,None];xx=np.arange(w)[None,:]
out=ROOT/'public/assets/welcome/waiting-v4';out.mkdir(exist_ok=True)
manifest={'canvas':[640,660],'order':list(range(1,9)),'source':'codex-clipboard-03215281-c2eb-4ed2-94af-8788d0e29048.png','assets':{}}
contact=Image.new('RGB',(1280,700),'#f7ead3');draw=ImageDraw.Draw(contact)
for rownum,centers in enumerate(([384,770,1152],[395,785,1158])):
 rows=yy<row[None,:] if rownum==0 else yy>=row[None,:]
 masked=np.where(rows,a,0);cuts=[np.zeros(h,int)]+[ns['seam'](masked,c,16) for c in centers]+[np.full(h,w)]
 for col in range(4):
  data=np.array(clean);keep=rows&(xx>=cuts[col][:,None])&(xx<cuts[col+1][:,None]);data[:,:,3]=np.where(keep,data[:,:,3],0)
  region=Image.fromarray(data);box=region.getchannel('A').getbbox();crop=ns['keep_group'](region.crop(box));crop=crop.crop(crop.getchannel('A').getbbox())
  scale=min(1.18,600/crop.width,620/crop.height);crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
  canvas=Image.new('RGBA',(640,660));canvas.alpha_composite(crop,((640-crop.width)//2,644-crop.height))
  number=rownum*4+col+1;canvas.save(out/f'waiting-{number}.webp',quality=94,method=6)
  manifest['assets'][str(number)]={'path':f'waiting-v4/waiting-{number}.webp','crop':list(box)}
  canvas.thumbnail((310,320));contact.paste(canvas,(col*320,rownum*350),canvas);draw.text((col*320+12,rownum*350+325),str(number),fill='black')
contact.save(ROOT/'reports/welcome-waiting-v4-contact.jpg',quality=94)
(out/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Prepared eight waiting poses')
