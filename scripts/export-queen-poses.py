"""Export the approved queen sprite sheets without changing the artwork."""
from pathlib import Path
from PIL import Image
import cv2,numpy as np,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/characters/queen/v2';OUT.mkdir(exist_ok=True)
SHEETS=[('queen-v2-neutral-atlas.png',['idle','blink','tilt','nod']),('queen-v2-gesture-atlas.png',['wave','lift','land','companion'])]
for filename,names in SHEETS:
 im=Image.open(ROOT/'docs/design'/filename).convert('RGBA');cw,ch=im.width//2,im.height//2
 for i,name in enumerate(names):
  a=np.array(im.crop(((i%2)*cw,(i//2)*ch,(i%2+1)*cw,(i//2+1)*ch)))
  num,labels,stats,_=cv2.connectedComponentsWithStats((a[:,:,3]>24).astype(np.uint8),8)
  # Each quadrant contains one complete connected silhouette. Discard pieces
  # bleeding across a neighboring quadrant, not legitimate interior details.
  largest=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA]))
  keep=(labels==largest).astype(np.uint8)
  keep=cv2.dilate(keep,np.ones((3,3),np.uint8));a[:,:,3]*=keep
  tile=Image.fromarray(a);tile=tile.crop(tile.getbbox());tile.thumbnail((720,720),Image.Resampling.LANCZOS)
  result=Image.new('RGBA',(768,768));result.alpha_composite(tile,((768-tile.width)//2,744-tile.height));result.save(OUT/(name+'.png'))
manifest={'version':2,'design':'docs/design/queen-actions-approved.png','poses':{name:name+'.png' for _,names in SHEETS for name in names},'eyeBox':[.512,.277,.075,.045],'walk':{'file':'walk.webp','poster':'walk-poster.png','frames':72,'duration':1440,'width':768,'height':896,'materials':'seated-style-2026-10-24','materialSources':'docs/design/queen-walk-seated-style'},'sourceSheets':['docs/design/'+x[0] for x in SHEETS]}
(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
