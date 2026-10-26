"""Show both runtime appearances at the same gait phase."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/classic-side-walk'
classic=Image.open(ROOT/'assets/characters/classic/shared-walk/walk.webp')
queen=Image.open(ROOT/'assets/characters/queen/v2/walk.webp')
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',32)
frames=[];small=[]
for n in range(72):
 classic.seek(n);queen.seek(n);sheet=Image.new('RGB',(1280,896),(250,248,243));d=ImageDraw.Draw(sheet)
 for image,x,label in [(classic,0,'萝莉 · 侧面行走'),(queen,640,'御姐 · 成年形态')]:
  im=image.convert('RGBA');im.thumbnail((620,768),Image.Resampling.LANCZOS)
  sheet.paste(im,(x+(640-im.width)//2,816-im.height),im);d.text((x+320,856),label,font=font,fill=(77,53,90),anchor='mm')
 frames.append(sheet)
 im=classic.convert('RGBA').resize((320,320),Image.Resampling.LANCZOS);bg=Image.new('RGB',(320,320),(250,248,243));bg.paste(im,(0,0),im);small.append(bg)
frames[0].save(OUT/'shared-gait.png')
frames[0].save(OUT/'shared-gait.webp',save_all=True,append_images=frames[1:],duration=20,loop=0,lossless=True)
frames[0].save(ROOT/'docs/images/ages-side-walk.webp',save_all=True,append_images=frames[1:],duration=20,loop=0,lossless=True)
frames[0].save(ROOT/'docs/images/readme/walk-ages-preview.webp',save_all=True,append_images=frames[1:],duration=20,loop=0,lossless=True)
frames[0].save(ROOT/'docs/images/readme/walk-ages-poster.png')
small[0].save(ROOT/'docs/images/walk-shared.webp',save_all=True,append_images=small[1:],duration=20,loop=0,lossless=True)
for n,label in [(0,'a'),(36,'b')]:
 classic.seek(n);classic.convert('RGBA').save(ROOT/f'docs/images/walk-shared-phase-{label}.png')
print(OUT/'shared-gait.webp')
