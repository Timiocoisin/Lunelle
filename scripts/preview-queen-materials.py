"""Export a side-by-side view of the actual seated and walking runtime art."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/queen-walk-seated-style';OUT.mkdir(exist_ok=True)
RUNTIME=ROOT/'assets/characters/queen/v2'
idle=Image.open(RUNTIME/'idle.png').convert('RGBA')
walk=Image.open(RUNTIME/'walk.webp')
font=ImageFont.truetype('C:/Windows/Fonts/msyh.ttc',22)
frames=[]
for n in range(walk.n_frames):
 walk.seek(n)
 sheet=Image.new('RGB',(800,560),(250,248,243))
 d=ImageDraw.Draw(sheet)
 for image,x,label in [(idle,0,'坐姿材质参考'),(walk.convert('RGBA'),400,'统一材质后的散步')]:
  image=image.copy();image.thumbnail((390,480),Image.Resampling.LANCZOS)
  sheet.paste(image,(x+(400-image.width)//2,510-image.height),image)
  d.text((x+200,535),label,font=font,fill=(77,53,90),anchor='mm')
 frames.append(sheet)
frames[0].save(OUT/'material-comparison.png')
frames[0].save(OUT/'material-comparison.webp',save_all=True,append_images=frames[1:],duration=20,loop=0,lossless=True)
print(OUT/'material-comparison.webp')
