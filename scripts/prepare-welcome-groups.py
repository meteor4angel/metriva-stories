"""Extract complete composed groups from the two latest user sheets."""
from pathlib import Path
from collections import deque
import json
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/assets/welcome/group-v3';OUT.mkdir(parents=True,exist_ok=True)
TEMP=Path('C:/Users/JCASUN~1/AppData/Local/Temp')

def checker_cutout(image):
    rgb=np.array(image.convert('RGB')).astype(np.int16)
    neutral=(rgb.max(2)-rgb.min(2)<18)&(rgb.min(2)>176)
    h,w=neutral.shape;seen=np.zeros((h,w),bool);q=deque()
    for y in range(h):
        for x in (0,w-1):
            if neutral[y,x] and not seen[y,x]:seen[y,x]=True;q.append((x,y))
    for x in range(w):
        for y in (0,h-1):
            if neutral[y,x] and not seen[y,x]:seen[y,x]=True;q.append((x,y))
    while q:
        x,y=q.popleft()
        for xx,yy in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
            if 0<=xx<w and 0<=yy<h and neutral[yy,xx] and not seen[yy,xx]:seen[yy,xx]=True;q.append((xx,yy))
    rgba=np.array(image.convert('RGBA'));rgba[seen,3]=0
    near=np.array(Image.fromarray((seen*255).astype('uint8')).filter(ImageFilter.MaxFilter(3)))>0
    rgba[near&(rgb.max(2)-rgb.min(2)<25)&(rgb.min(2)>170),3]=0
    return Image.fromarray(rgba)

def seam(alpha,center,radius=20):
    lo=max(0,center-radius);hi=min(alpha.shape[1],center+radius)
    energy=alpha[:,lo:hi].astype(float)+(np.arange(lo,hi)[None,:]-center)**2*.04
    cost=energy.copy();back=np.zeros(cost.shape,dtype=np.int16)
    for y in range(1,len(cost)):
        for x in range(hi-lo):
            first=max(0,x-2);last=min(hi-lo,x+3);k=first+np.argmin(cost[y-1,first:last]);cost[y,x]+=cost[y-1,k];back[y,x]=k
    result=np.zeros(len(cost),int);k=int(np.argmin(cost[-1]))
    for y in range(len(cost)-1,-1,-1):result[y]=lo+k;k=int(back[y,k])
    return result

def keep_group(image):
    """Keep principal group and its bird/accents; remove tiny neighbor scraps at the sides."""
    rgba=np.array(image);mask=rgba[:,:,3]>65;h,w=mask.shape;parts=[]
    for y,x in zip(*np.where(mask)):
        if not mask[y,x]:continue
        q=deque([(int(x),int(y))]);mask[y,x]=False;points=[]
        while q:
            xx,yy=q.popleft();points.append((xx,yy))
            for nx,ny in ((xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)):
                if 0<=nx<w and 0<=ny<h and mask[ny,nx]:mask[ny,nx]=False;q.append((nx,ny))
        parts.append(points)
    parts.sort(key=len,reverse=True);chosen=np.zeros((h,w),np.uint8)
    for i,points in enumerate(parts):
        xs,ys=zip(*points)
        side=min(xs)<2 or max(xs)>w-3
        if i==0 or (len(points)>30 and not(side and len(points)<len(parts[0])*.06)):
            chosen[np.array(ys),np.array(xs)]=255
    expanded=np.array(Image.fromarray(chosen).filter(ImageFilter.MaxFilter(3)))>0;rgba[~expanded,3]=0
    return Image.fromarray(rgba)

manifest={'canvas':[640,660],'waitingOrder':[1,2,3,4],'assets':{},'notes':'Complete group crops. All five characters stay together. Originals and prior assets are preserved.'}
pieces=[]
first=Image.open(TEMP/'codex-clipboard-eee53f7f-2ed0-4707-986b-f5cf3a2fd4b8.png').convert('RGBA')
a=np.array(first.getchannel('A'));h,w=a.shape
row=seam(a.T,648,22)
for top,centers,names in [(True,[230,615,940,1265],['peek','greet','invite','disappointed','door']),
                           (False,[436,807,1170],['waiting-1','waiting-2','waiting-3','waiting-4'])]:
    yy=np.arange(h)[:,None];xx=np.arange(w)[None,:]
    rows=yy<row[None,:] if top else yy>=row[None,:]
    masked=np.where(rows,a,0);cuts=[np.zeros(h,int)]+[seam(masked,c,22) for c in centers]+[np.full(h,w)]
    for i,name in enumerate(names):
        data=np.array(first);keep=rows&(xx>=cuts[i][:,None])&(xx<cuts[i+1][:,None]);data[:,:,3]=np.where(keep,data[:,:,3],0)
        region=Image.fromarray(data);bbox=region.getchannel('A').point(lambda v:255 if v>80 else 0).getbbox()
        crop=keep_group(region.crop(bbox));pieces.append((name,crop,'sheet-1',list(bbox)))

second=Image.open(TEMP/'codex-clipboard-0005c690-0bdc-4724-a274-272d67bfded0.png')
boxes={
 'return-run':(345,0,885,365),
 'return-greet':(887,0,1310,365),
 'return-invite':(1728,0,2172,365),
 'hug':(520,365,1020,724),
 'curious':(1530,365,2172,724),
}
for name,box in boxes.items():pieces.append((name,keep_group(checker_cutout(second.crop(box))),'sheet-2',list(box)))

for name,crop,source,box in pieces:
    bbox=crop.getchannel('A').point(lambda v:255 if v>90 else 0).getbbox();crop=crop.crop(bbox)
    # Keep source scale consistent; extra canvas space protects wings/hair/feet.
    scale=min(1.02,600/crop.width,628/crop.height)
    crop=crop.resize((round(crop.width*scale),round(crop.height*scale)),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(640,660));canvas.alpha_composite(crop,((640-crop.width)//2,644-crop.height))
    canvas.save(OUT/(name+'.webp'),quality=93,method=6)
    manifest['assets'][name]={'source':source,'crop':box,'path':'group-v3/'+name+'.webp'}

sheet=Image.new('RGB',(5*240,3*270),'#eee1cb');draw=ImageDraw.Draw(sheet)
for i,name in enumerate(manifest['assets']):
    im=Image.open(OUT/(name+'.webp'));im.thumbnail((230,245));x=(i%5)*240+(240-im.width)//2;y=(i//5)*270+245-im.height
    sheet.paste(im,(x,y),im);draw.text(((i%5)*240+8,(i//5)*270+249),name,fill='#244532')
sheet.save(ROOT/'reports/welcome-composed-contact.jpg',quality=93)
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print('Prepared',len(pieces),'complete group images')
