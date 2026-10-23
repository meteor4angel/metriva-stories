"""Deterministic crops of the user-supplied welcome sheets; no generated artwork.
Run with Pillow and NumPy. Sources remain untouched. See the output manifest.
"""
from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/welcome'
SOURCE = Path('C:/Users/JCASUN~1/AppData/Local/Temp')
SHEETS = {
    'female': '246f8972-5320-4b3e-b70c-89cb2fb38baf',
    'male': 'df4d1071-c91f-49c0-b2ea-0050c62cfe77',
    'biscuit': 'e80a947e-b997-47cd-8492-f90f08d15a8b',
    'cat': '661e227e-9343-459d-9f97-b6a1e7e602cb',
    'bird': '13315b9f-19e7-4a1e-9a3c-b2811405304d',
    'group': '32cc85b3-b5e8-4a2c-acf0-7fde255b2106',
}
CROPS = {
 'female': {'neutral':(15,337,207,641),'wave':(10,8,206,333),'happy':(208,25,407,333),'point':(814,12,1024,333),'surprised':(416,337,610,641),'disappointed':(616,337,815,641),'goodbye':(10,8,206,333)},
 'male': {'neutral':(205,344,408,667),'wave':(0,0,204,344),'happy':(207,14,405,342),'point':(817,0,1024,348),'surprised':(612,344,817,667),'disappointed':(408,668,624,967),'goodbye':(814,677,1024,968)},
 'biscuit': {'sit':(212,15,409,250),'excited':(214,251,415,489),'sad':(214,737,419,966),'run':(615,30,871,248),'rest':(0,970,211,1112)},
 'cat': {'sit':(0,8,207,221),'wave':(416,0,618,221),'unimpressed':(410,863,618,1073),'stretch':(0,223,233,438),'sleep':(820,658,1024,864)},
 'bird': {'perched':(0,0,213,272),'flutter':(204,536,466,801),'curious':(210,274,414,538),'sleep':(0,1080,214,1362)},
}

def load(name):
    return Image.open(SOURCE / f'codex-clipboard-{SHEETS[name]}.png')

def remove_checker(image):
    """Remove only border-connected neutral checker pixels, protecting enclosed highlights."""
    rgb=np.array(image.convert('RGB')).astype(np.int16)
    candidate=(rgb.max(2)-rgb.min(2)<24)&(rgb.min(2)>184)
    h,w=candidate.shape
    bg=np.zeros((h,w),dtype=bool);q=deque()
    for y in range(h):
        for x in (0,w-1):
            if candidate[y,x] and not bg[y,x]:bg[y,x]=True;q.append((x,y))
    for x in range(w):
        for y in (0,h-1):
            if candidate[y,x] and not bg[y,x]:bg[y,x]=True;q.append((x,y))
    while q:
        x,y=q.popleft()
        for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=xx<w and 0<=yy<h and candidate[yy,xx] and not bg[yy,xx]:bg[yy,xx]=True;q.append((xx,yy))
    rgba=np.array(image.convert('RGBA'));rgba[bg,3]=0
    # Neutral antialias fringe bordering the removed checker is softened, not enlarged.
    near=np.array(Image.fromarray((bg*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)))>0
    edge=near&~bg&(rgb.max(2)-rgb.min(2)<32)&(rgb.min(2)>164)
    rgba[edge,3]=0
    return Image.fromarray(rgba)

def isolate_pose(image):
    """Discard disconnected fragments from neighboring poses at crop boundaries."""
    rgba=np.array(image.convert('RGBA'));mask=rgba[:,:,3]>65;h,w=mask.shape;parts=[]
    for y,x in zip(*np.where(mask)):
        if not mask[y,x]:continue
        q=deque([(int(x),int(y))]);mask[y,x]=False;points=[]
        while q:
            xx,yy=q.popleft();points.append((xx,yy))
            for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                if 0<=nx<w and 0<=ny<h and mask[ny,nx]:mask[ny,nx]=False;q.append((nx,ny))
        parts.append(points)
    if not parts:return image
    parts.sort(key=len,reverse=True);main=parts[0];xs,ys=zip(*main);x0,x1,y0=min(xs),max(xs),min(ys)
    chosen=np.zeros((h,w),dtype=np.uint8)
    for i,points in enumerate(parts):
        px,py=zip(*points)
        # Only retain disconnected expression accents above the same character.
        keep=i==0 or (len(points)>20 and min(px)>=x0 and max(px)<=x1 and max(py)<y0+8)
        if keep:chosen[np.array(py),np.array(px)]=255
    expanded=np.array(Image.fromarray(chosen).filter(ImageFilter.MaxFilter(3)))>0
    rgba[~expanded,3]=0
    return Image.fromarray(rgba)

manifest={'sources':SHEETS,'individualCanvas':[256,360],'groupCanvas':[600,660],'waitingOrder':[1,2,3,4],'crops':{},'notes':[
 'Original thoughtful/confused host crops are retained; the runtime selects generated disappointed-v2 variants documented in reports/welcome-art-revision.md.',
 'Groups 3 and 4 touch at the cat paw / skirt boundary. A minimum-alpha seam separates the touching silhouettes without rectangular neighbor strips.',
 'Voice clips remain unavailable. A generated illustrated oak door is now used for the entry and exit.'
]}
previews=[]
for name,expressions in CROPS.items():
    source=load(name);target=OUT/name;target.mkdir(parents=True,exist_ok=True)
    manifest['crops'][name]={}
    # One scale per character preserves the relative sizes of expressions.
    extracted={}
    for expression,box in expressions.items():
        im=source.crop(box)
        if source.mode!='RGBA':im=remove_checker(im)
        im=isolate_pose(im)
        alpha=im.getchannel('A');bbox=alpha.point(lambda v:255 if v>100 else 0).getbbox()
        extracted[expression]=im.crop(bbox) if bbox else im
    scale=min(236/max(im.width for im in extracted.values()),340/max(im.height for im in extracted.values()))
    for expression,im in extracted.items():
        im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
        canvas=Image.new('RGBA',(256,360));canvas.alpha_composite(im,((256-im.width)//2,350-im.height))
        canvas.save(target/f'{expression}.webp',quality=91,method=6)
        manifest['crops'][name][expression]=list(expressions[expression])
        previews.append((name+'/'+expression,canvas))

group=load('group').convert('RGBA');a=np.array(group.getchannel('A'))
# Seam follows the narrow transparent gap, including the single touching boundary.
lo,hi=1620,1740;energy=a[:,lo:hi].astype(float)
energy+=(np.arange(lo,hi)[None,:]-1668)**2*.005
cost=energy.copy();back=np.zeros(cost.shape,dtype=np.int16)
for y in range(1,len(cost)):
    for x in range(hi-lo):
        first=max(0,x-3);last=min(hi-lo,x+4);k=first+np.argmin(cost[y-1,first:last]);cost[y,x]+=cost[y-1,k];back[y,x]=k
seam=np.zeros(group.height,dtype=int);k=int(np.argmin(cost[-1]))
for y in range(group.height-1,-1,-1):seam[y]=lo+k;k=int(back[y,k])
for number in range(1,5):
    rgba=np.array(group);xx=np.arange(group.width)[None,:]
    keep=xx<559 if number==1 else (xx>=559)&(xx<1116) if number==2 else (xx>=1116)&(xx<seam[:,None]) if number==3 else xx>=seam[:,None]
    rgba[:,:,3]=np.where(keep,rgba[:,:,3],0)
    im=Image.fromarray(rgba);bbox=im.getchannel('A').point(lambda v:255 if v>70 else 0).getbbox();im=im.crop(bbox)
    # Shared source scale and baseline, rather than stretching every frame independently.
    im=im.resize((round(im.width*.97),round(im.height*.97)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(600,660));canvas.alpha_composite(im,((600-im.width)//2,646-im.height))
    (OUT/'group').mkdir(exist_ok=True);canvas.save(OUT/f'group/waiting-{number}.webp',quality=92,method=6)
    manifest['crops'][f'group-{number}']=list(bbox);previews.append((f'group/waiting-{number}',canvas))
OUT.mkdir(parents=True,exist_ok=True);(OUT/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
# QA contact sheet only; never consumed by the site.
cols=7;cw,ch=180,235
sheet=Image.new('RGB',(cols*cw,((len(previews)+cols-1)//cols)*ch),'#e9ddc8');d=ImageDraw.Draw(sheet)
for i,(label,im) in enumerate(previews):
    thumb=im.copy();thumb.thumbnail((170,208));x=(i%cols)*cw+(cw-thumb.width)//2;y=(i//cols)*ch+218-thumb.height
    sheet.paste(thumb,(x,y),thumb);d.text(((i%cols)*cw+5,(i//cols)*ch+220),label,fill='#234334')
(ROOT/'reports').mkdir(exist_ok=True);sheet.save(ROOT/'reports/welcome-asset-contact-sheet.jpg',quality=92)
print(f'Prepared {len(previews)} transparent WebP assets in {OUT}')
