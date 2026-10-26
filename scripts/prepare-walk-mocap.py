from pathlib import Path
import numpy as np,json,math
from scipy.ndimage import gaussian_filter1d
from scipy.interpolate import CubicSpline
from PIL import Image,ImageDraw
OUT=Path('artifacts/queen-walk-mocap');d=np.load(OUT/'07_04-joints.npz');names=list(d['names']);idx={n:i for i,n in enumerate(names)};p=d['positions'][139:314].copy();root=p[:,idx['Hips']].copy()
# Remove travel only; retain measured vertical weight transfer.
p[:,:,0]-=root[:,None,0];p[:,:,2]-=root[:,None,2]
t=np.linspace(0,1,len(p));p-=t[:,None,None]*(p[-1]-p[0])[None]
p=gaussian_filter1d(p[:-1],1.2,axis=0,mode='wrap');p=np.concatenate([p,p[:1]],axis=0)
spline=CubicSpline(np.linspace(0,1,len(p)),p,axis=0,bc_type='periodic');motion=spline(np.arange(72)/72)
np.savez(OUT/'walk-cycle.npz',positions=motion,names=names,cycleSeconds=174/120,sourceFrames=[139,313])
contact=Image.new('RGB',(1600,1000),'#faf8f3');dr=ImageDraw.Draw(contact)
for n,frame in enumerate(range(0,72,9)):
 q=motion[frame];origin=np.array([n%4*400+220,n//4*500+250]);hy=np.mean(q[[idx['LeftUpLeg'],idx['RightUpLeg']],1]);meanhip=np.mean(motion[:,[idx['LeftUpLeg'],idx['RightUpLeg']],1],axis=(0,1)) if False else 15
 def xy(j):v=q[idx[j]];return tuple(origin+np.array([v[2]*13,-(v[1]-15)*13]))
 for side,color in [('Left','#548cca'),('Right','#d95a69')]:
  for chain in [[side+'UpLeg',side+'Leg',side+'Foot',side+'ToeBase'],[side+'Arm',side+'ForeArm',side+'Hand']]:
   dr.line([xy(j) for j in chain],fill=color,width=6)
   for j in chain:
    x,y=xy(j);dr.ellipse((x-4,y-4,x+4,y+4),fill=color)
 dr.line([xy('Hips'),xy('Spine1'),xy('Head')],fill='#555555',width=6);dr.text((n%4*400+20,n//4*500+20),str(frame),fill='black')
contact.save(OUT/'captured-walk-contact.png')
for side in ['Right','Left']:
 hip=motion[:,idx[side+'UpLeg']];knee=motion[:,idx[side+'Leg']];ank=motion[:,idx[side+'Foot']];toe=motion[:,idx[side+'ToeBase']]
 flex=[]
 for h,k,a in zip(hip,knee,ank):
  u=h-k;v=a-k;flex.append(180-np.degrees(np.arccos(np.clip(u@v/np.linalg.norm(u)/np.linalg.norm(v),-1,1))))
 print(side,'knee flex range',np.round([min(flex),max(flex)],1),'footy',np.round([ank[:,1].min(),ank[:,1].max()],2),'pitch',np.round(np.degrees(np.arctan2(-(toe-ank)[:,1],(toe-ank)[:,2])).min(),1),np.round(np.degrees(np.arctan2(-(toe-ank)[:,1],(toe-ank)[:,2])).max(),1))
print('saved72-frame measured cycle')
