"""Build a registered, motion-interpolated preview from the approved walk keys."""
from pathlib import Path
import json, math
import cv2
import numpy as np
from PIL import Image
from scipy.interpolate import RBFInterpolator
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/queen-walk-preview'
W,H=384,480
BG=np.array([250,248,242],dtype=np.uint8)
keys=[]
landmarks=[]
for i in range(8):
    rgb=np.array(Image.open(OUT/f'frame-{i+1:02}.png').convert('RGB'))
    # Isolate the main connected figure, excluding numbering and adjacent-cell fragments.
    hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV)
    mask=((hsv[:,:,1]>27)&(hsv[:,:,2]<248)).astype(np.uint8)
    mask=cv2.morphologyEx(mask,cv2.MORPH_CLOSE,np.ones((5,5),np.uint8))
    count,labels,stats,_=cv2.connectedComponentsWithStats(mask)
    k=1+np.argmax(stats[1:,cv2.CC_STAT_AREA])
    main=(labels==k).astype(np.uint8)
    main=cv2.dilate(main,np.ones((7,7),np.uint8))
    alpha=cv2.GaussianBlur(main.astype(np.float32),(5,5),.8)
    clean=rgb*alpha[:,:,None]+BG*(1-alpha[:,:,None])
    ys,xs=np.where(main>0)
    top=int(ys.min());bottom=int(ys.max())
    scale=450/max(1,bottom-top)
    # A common height and ground plane remove sheet-layout jitter.
    matrix=np.float32([[scale,0,242*(1-scale)],[0,scale,470-bottom*scale]])
    clean=cv2.warpAffine(clean.astype(np.uint8),matrix,(W,H),borderValue=tuple(map(int,BG)))
    keys.append(clean)
    # The two colored ankle ties provide stable per-leg correspondences.
    colored=cv2.cvtColor(clean,cv2.COLOR_RGB2HSV)
    anchors=[]
    for leg in range(2):
        if leg==0: m=((colored[:,:,0]<8)|(colored[:,:,0]>173))&(colored[:,:,1]>160)
        else: m=(colored[:,:,0]>100)&(colored[:,:,0]<130)&(colored[:,:,1]>110)
        m[:310]=False;m[:,:80]=False
        yy,xx=np.where(m);ankle=np.array([np.median(xx),np.median(yy)])
        hip=np.array([242-8*leg,225.])
        knee=hip*.48+ankle*.52+np.array([13.,0.])
        anchors.extend([hip,knee,(knee+ankle)/2,ankle,ankle+[28,25],ankle+[-12,22]])
    landmarks.append(np.array(anchors))
ygrid,xgrid=np.mgrid[0:H,0:W].astype(np.float32)
flow=cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
frames=[]
for i,a in enumerate(keys):
    b=keys[(i+1)%8]
    ag=cv2.cvtColor(a,cv2.COLOR_RGB2GRAY);bg=cv2.cvtColor(b,cv2.COLOR_RGB2GRAY)
    forward=flow.calc(ag,bg,None);backward=flow.calc(bg,ag,None)
    for j in range(6):
        t=j/6
        # Use one warped source per output to avoid double-exposure extra legs.
        if t<.5:
            rgb=cv2.remap(a,xgrid-t*forward[:,:,0],ygrid-t*forward[:,:,1],cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT,borderValue=tuple(map(int,BG)))
        else:
            rgb=cv2.remap(b,xgrid-(1-t)*backward[:,:,0],ygrid-(1-t)*backward[:,:,1],cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT,borderValue=tuple(map(int,BG)))
        phase=(i+t)/8*2*math.pi
        body_weight=np.clip((470-ygrid)/120,0,1)
        fabric_weight=np.clip((230-xgrid)/100,0,1)*np.clip((ygrid-20)/100,0,1)
        dx=1.4*math.sin(phase-.6)*fabric_weight
        dy=1.5*math.cos(phase*2)*body_weight
        rgb=cv2.remap(rgb,xgrid-dx,ygrid-dy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT,borderValue=tuple(map(int,BG)))
        frames.append(Image.fromarray(rgb))
# One palette across the entire cycle prevents palette flicker.
mosaic=Image.new('RGB',(W*8,H))
for i in range(8):mosaic.paste(frames[i*6],(i*W,0))
palette=mosaic.quantize(colors=256)
indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
indexed[0].save(OUT/'lunelle-dark-moon-walk-smooth.gif',save_all=True,append_images=indexed[1:],duration=30,loop=0,disposal=2,optimize=False)
frames[0].save(OUT/'lunelle-dark-moon-walk-smooth.webp',save_all=True,append_images=frames[1:],duration=30,loop=0,lossless=True)
frames[9].save(OUT/'smooth-frame-10.png')
frames[21].save(OUT/'smooth-frame-22.png')
check=Image.open(OUT/'lunelle-dark-moon-walk-smooth.gif')
assert check.n_frames==48
print(json.dumps({'frames':check.n_frames,'cycleMs':1440,'size':[W,H]}))
