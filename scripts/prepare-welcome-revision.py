"""Normalize the two generated concerned reactions without replacing source sheets."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
source=Path('C:/Users/jcasuncad/.codex/generated_images/01a13766-7c1d-7e62-98ff-996dc75de12a/exec-82824bc4-8fe9-46c9-a805-bf33ae4ef25b.png')
image=Image.open(source).convert('RGBA')
w,h=image.size
for box,name in [((0,0,w//2,h),'female'),((w//2,0,w,h),'male')]:
    crop=image.crop(box)
    bbox=crop.getchannel('A').point(lambda v:255 if v>128 else 0).getbbox()
    art=crop.crop(bbox)
    art.thumbnail((236,340),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(256,360))
    canvas.alpha_composite(art,((256-art.width)//2,350-art.height))
    destination=root/'public/assets/welcome'/name/'disappointed-v2.webp'
    canvas.save(destination,quality=93,method=6)
    print(destination)
