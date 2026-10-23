from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
helpers=(ROOT/'scripts/prepare-welcome-groups.py').read_text(encoding='utf-8').split("manifest={'canvas'")[0]
ns={"__file__":str(ROOT/'scripts/prepare-welcome-groups.py')};exec(helpers,ns)
im=ns['keep_group'](ns['checker_cutout'](Image.open(r'C:/Users/JCASUN~1/AppData/Local/Temp/codex-clipboard-0459bf9a-38c3-4308-838f-49298c160e43.png')))
im=im.crop(im.getchannel('A').getbbox());scale=min(600/im.width,620/im.height);im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
canvas=Image.new('RGBA',(640,660));canvas.alpha_composite(im,((640-im.width)//2,644-im.height));canvas.save(ROOT/'public/assets/welcome/waiting-v4/hover.webp',quality=95,method=6)
print('Prepared transparent hover artwork')
