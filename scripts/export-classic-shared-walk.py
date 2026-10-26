"""Retarget the queen's measured walk onto the original pastel chibi costume."""
from pathlib import Path
import json,math,hashlib,argparse
import cv2,numpy as np
from scipy.ndimage import gaussian_filter1d
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--preview-only',action='store_true');parser.add_argument('--source',type=Path,default=ROOT/'docs/design/classic-side-walk');args=parser.parse_args()
SOURCE=args.source
RIG=json.loads((SOURCE/'rig.json').read_text(encoding='utf-8'))
OUT=ROOT/'artifacts/classic-side-walk';OUT.mkdir(exist_ok=True)
RUNTIME=ROOT/'assets/characters/classic/shared-walk';RUNTIME.mkdir(parents=True,exist_ok=True)
W=H=768;SCALE=1.2;N=72;DT=20;GROUND=620.;HIPX=400.
THIGH=76.;SHIN=80.;BODY_SCALE=RIG['bodyScale']
HIP=np.array(RIG['hip']);CHEST=np.array(RIG['chest']);NECK=np.array(RIG['neck'])
SH,SK,SA=map(np.array,[[490.,40.],[520.,650.],[530.,1250.]])
AS,AE,AW=map(np.array,[[490.,80.],[600.,750.],[535.,1120.]])
HAND_TIP=np.array([550.,1440.]);HAND_LENGTH=35.
HAND_WIDTH=HAND_LENGTH/np.linalg.norm(HAND_TIP-AW)
hand_scale_ratios=[];hand_determinants={'Left':[],'Right':[]}
HEEL=np.array([-22.,43.]);TOE=np.array([47.,43.])

def load(name):
 a=cv2.imread(str(SOURCE/(name+'.png')),cv2.IMREAD_UNCHANGED)
 a=cv2.cvtColor(a,cv2.COLOR_BGRA2RGBA).astype(np.float32)/255
 a[:,:,:3]*=a[:,:,3:4];return a

body,hair,leg=map(load,['body','hair','leg-profile'])
# Fixed rest-shape registration to the full side-profile reference. This is
# static geometry; animated hair is still transformed as one intact layer.
ry,rx=np.mgrid[0:hair.shape[0],0:hair.shape[1]].astype(np.float32)
source_y=np.where(ry>RIG['hairTailFrom'],RIG['hairTailFrom']+(ry-RIG['hairTailFrom'])/RIG['hairTailScale'],ry)
hair=cv2.remap(hair,rx,source_y.astype(np.float32),cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
# Scalp, bangs and the ahoge are owned by the body texture. Keep only the
# rear curl mass here so there can be no duplicate scalp/front fringe.
root_y=np.clip((ry-420)/100,0,1);root_y=root_y*root_y*(3-2*root_y)
root_x=np.clip((rx-480)/100,0,1);root_x=root_x*root_x*(3-2*root_x)
front=np.clip((rx-850)/60,0,1);front=front*front*(3-2*front)
hair*= (np.maximum(root_y,1-root_x)*(1-front))[:,:,None]
arm_art={'Right':load('arm-right'),'Left':load('arm-left')}
sy,sx=np.where((leg[:,:,3]>.9)&(np.indices(leg.shape[:2])[0]>1300))
sole=(cv2.convexHull(np.column_stack([sx,sy]).astype(np.float32))[:,0,:]-SA)*.18
# The original dress already owns the puff sleeves; only the connected bare
# arm below its cuff is needed from the arm layer.
for side,art in arm_art.items():
 fade=np.clip((np.arange(art.shape[0],dtype=np.float32)-RIG['armFade'][0])/RIG['armFade'][1],0,1)
 arm_art[side]=art*((fade*fade*(3-2*fade))[:,None,None])

def rot(a):return np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
def smooth(v):v=np.clip(v,0,1);return v*v*(3-2*v)
def over(a,b):return b+a*(1-b[:,:,3:4])
def pivot(p,a):
 m=np.eye(3);m[:2,:2]=rot(a);m[:2,2]=p-rot(a)@p;return m
def bone(s0,s1,t0,t1,width):
 v=s1-s0;n=np.array([v[1],-v[0]])/np.linalg.norm(v)
 v=t1-t0;tn=np.array([v[1],-v[0]])/np.linalg.norm(v)
 return cv2.getAffineTransform(np.float32([s0,s1,s0+100*n]),np.float32([t0,t1,t0+100*width*tn]))

class Texture:
 def __init__(self,art,xs,ys):
  self.art=art
  self.uv=np.array([[(float(x),float(y)) for x in xs] for y in ys],np.float32)
  self.h=np.concatenate([self.uv,np.ones((*self.uv.shape[:2],1),np.float32)],axis=2)
  self.triangles=[]
  for y in range(len(ys)-1):
   for x in range(len(xs)-1):
    if art[ys[y]:ys[y+1]+1,xs[x]:xs[x+1]+1,3].max()<.001:continue
    self.triangles.extend([((y,x),(y,x+1),(y+1,x)),((y,x+1),(y+1,x+1),(y+1,x))])
 def render(self,dest):
  dest=dest*SCALE
  mx=np.full((H,W),-1,np.float32);my=mx.copy()
  for ids in self.triangles:
   sp=np.float32([self.uv[a,b] for a,b in ids]);dp=np.float32([dest[a,b] for a,b in ids])
   x0=max(0,int(np.floor(dp[:,0].min())));x1=min(W,int(np.ceil(dp[:,0].max()))+1)
   y0=max(0,int(np.floor(dp[:,1].min())));y1=min(H,int(np.ceil(dp[:,1].max()))+1)
   if x1<=x0 or y1<=y0:continue
   a,b,c=dp;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
   if abs(den)<1e-6:continue
   yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32);ex=xx+.5;ey=yy+.5
   u=((b[1]-c[1])*(ex-c[0])+(c[0]-b[0])*(ey-c[1]))/den
   v=((c[1]-a[1])*(ex-c[0])+(a[0]-c[0])*(ey-c[1]))/den
   mask=(u>=-1e-5)&(v>=-1e-5)&(u+v<=1.00001)
   inv=cv2.getAffineTransform(dp,sp)
   sx=inv[0,0]*xx+inv[0,1]*yy+inv[0,2];sy=inv[1,0]*xx+inv[1,1]*yy+inv[1,2]
   mx[y0:y1,x0:x1][mask]=sx[mask];my[y0:y1,x0:x1][mask]=sy[mask]
  return np.clip(cv2.remap(self.art,mx,my,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT),0,1)

capture=np.load(ROOT/'docs/design/shared-walk-cycle.npz')
motion=capture['positions'];names=list(capture['names']);jid={name:i for i,name in enumerate(names)}
assert len(motion)==N
def vec(q,a,b):v=q[jid[b]]-q[jid[a]];return np.array([v[2],-v[1]])
def limb(q,side):
 thigh=vec(q,side+'UpLeg',side+'Leg');thigh=thigh/np.linalg.norm(thigh)*THIGH
 shin=vec(q,side+'Leg',side+'Foot');shin=shin/np.linalg.norm(shin)*SHIN
 foot=vec(q,side+'Foot',side+'ToeBase');delta=math.atan2(foot[1],foot[0])-.27
 limit=.50 if delta>=0 else .20
 return thigh,shin,limit*math.tanh(delta/limit)

# Identical arm filtering, elbow flex, wrist lag, and trunk angles to the queen.
arms={}
for side in ['Left','Right']:
 def angles(a,b):
  v=motion[:,jid[side+b]]-motion[:,jid[side+a]]
  return np.unwrap(np.arctan2(v[:,2],-v[:,1]))
 upper=angles('Arm','ForeArm');lower=angles('ForeArm','Hand')
 flex=lower-upper;flex-=flex.mean();centered=upper-upper.mean()
 gain=float(np.clip(.11/max(.01,np.std(centered)),.7,1.5))
 upper=gaussian_filter1d(centered*gain-.04,1.2,mode='wrap')
 fore=upper+gaussian_filter1d(.24+.18*np.tanh(flex*.8/.18),1.2,mode='wrap')
 wrist=np.roll(gaussian_filter1d(fore,1.5,mode='wrap'),2)+.04
 arms[side]=(upper,fore,wrist)
leans=np.array([math.atan2(vec(q,'Hips','Spine1')[0],-vec(q,'Hips','Spine1')[1]) for q in motion]);leans=leans-leans.mean()+.025
hv=motion[:,jid['Head']]-motion[:,jid['Neck1']]
head=np.unwrap(np.arctan2(hv[:,2],hv[:,1]));head=(head-head.mean())*.65
def roll(left,right):
 v=motion[:,jid[left]]-motion[:,jid[right]]
 a=np.unwrap(np.arctan2(v[:,1],v[:,0]));return gaussian_filter1d(a-a.mean(),1.,mode='wrap')
pelvis=roll('LeftUpLeg','RightUpLeg')*.23;shoulders=roll('LeftArm','RightArm')*.5
chest=(leans-leans.mean())*.4+(shoulders-pelvis)*.6;head-=.25*chest

lt=Texture(leg,[250,550,950],sorted(set(list(range(0,1536,40))+[600,650,700,1200,1250,1300,1535])))
at={side:Texture(art,[250,550,850],sorted(set(list(range(0,1536,40))+[690,750,810,1070,1120,1170,1440,1535]))) for side,art in arm_art.items()}
bt=Texture(body,sorted(set(list(range(0,body.shape[1],70))+[630,815,960,body.shape[1]-1])),sorted(set(list(range(0,body.shape[0],50))+[650,710,780,850,920,980,1020,body.shape[0]-1])))
body_rest=bt.h.copy()
body_rest[:,:,1]=np.where(body_rest[:,:,1]>RIG['bodyHemFrom'],RIG['bodyHemFrom']+(body_rest[:,:,1]-RIG['bodyHemFrom'])*RIG['bodyHemScale'],body_rest[:,:,1])

def render_leg(origin,knee,ankle,pitch,near):
 mt=bone(SH,SK,origin,knee,.18);ms=bone(SK,SA,knee,ankle,.18)
 mf=np.zeros((2,3));mf[:,:2]=rot(pitch)*.18;mf[:,2]=ankle-rot(pitch)@SA*.18
 y=lt.uv[:,:,1];k=smooth((y-600)/100)[:,:,None];f=smooth((y-1200)/100)[:,:,None]
 dest=((lt.h@mt.T)*(1-k)+(lt.h@ms.T)*k)*(1-f)+(lt.h@mf.T)*f
 result=lt.render(dest)
 if not near:result[:,:,:3]*=.88
 return result
def render_arm(shoulder,n,side,near):
 u,f,w=(v[n] for v in arms[side]);handedness=1.;texture=at[side]
 elbow=shoulder+np.array([math.sin(u),math.cos(u)])*32
 wrist=elbow+np.array([math.sin(f),math.cos(f)])*29;tip=wrist+np.array([math.sin(w),math.cos(w)])*HAND_LENGTH
 # True profile uses independently painted near-right and far-left hands.
 # Both thumbs face forwards; their palm/back occlusion differs by side.
 mt=bone(AS,AE,shoulder,elbow,.10*handedness);ms=bone(AE,AW,elbow,wrist,.10*handedness);mf=bone(AW,HAND_TIP,wrist,tip,HAND_WIDTH*handedness)
 singular=np.linalg.svd(mf[:,:2],compute_uv=False);hand_scale_ratios.append(float(singular.max()/singular.min()))
 assert hand_scale_ratios[-1]<1.00001,'Hand texture became compressed or stretched'
 hand_determinants[side].append(float(np.linalg.det(mf[:,:2])))
 assert hand_determinants[side][-1]>0,'Side-view hand was mirrored backwards'
 y=texture.uv[:,:,1];k=smooth((y-690)/120)[:,:,None];f=smooth((y-1070)/100)[:,:,None]
 result=texture.render(((texture.h@mt.T)*(1-k)+(texture.h@ms.T)*k)*(1-f)+(texture.h@mf.T)*f)
 if not near:result[:,:,:3]*=.88
 if args.preview_only:
  a=np.clip(result[:,:,3:4],0,1);rgb=np.clip(result[:,:,:3]/np.maximum(a,1e-6),0,1)
  Image.fromarray(np.uint8(np.concatenate([rgb,a],axis=2)*255)).save(OUT/f'arm-{side.lower()}-{n:02}.png')
 return result

frames=[];audit=[];root_coverage=[]
rootcurve=[]
for x in range(350,700,4):
 rows=np.where(leg[:120,x,3]>.75)[0]
 if len(rows) and rows[0]<100:rootcurve.append([float(x),float(rows[0]+1),1.])
rootcurve=np.array(rootcurve)
# Filter torso height independently; knees absorb support exchange while feet
# retain the original contact trajectory. Filtering wraps across the loop seam.
poses=[];raw_hips=[]
for q in motion:
 relative=[]
 for side in ['Left','Right']:
  thigh,shin,pitch=limb(q,side)
  off=np.array([7. if side=='Right' else -7.,0. if side=='Right' else -5.])
  knee=off+thigh;ankle=knee+shin
  bottom=ankle[1]+float((sole@rot(pitch).T)[:,1].max())
  relative.append((off,knee,ankle,pitch,bottom))
 bottoms=[v[4]+(5. if i==0 else 0.) for i,v in enumerate(relative)]
 peak=max(bottoms);support=peak+.65*math.log(sum(math.exp((v-peak)/.65) for v in bottoms))
 poses.append(relative);raw_hips.append(GROUND-support)
filtered=gaussian_filter1d(raw_hips,3.,mode='wrap')
torso_heights=max(raw_hips)+.3+.4*(filtered-filtered.min())

def contact_knee(origin,ankle):
 v=ankle-origin;distance=float(np.linalg.norm(v));axis=v/distance
 along=(THIGH**2-SHIN**2+distance**2)/(2*distance)
 height=math.sqrt(max(0.,THIGH**2-along**2))
 normal=np.array([-axis[1],axis[0]])
 candidates=[origin+axis*along+normal*height,origin+axis*along-normal*height]
 # Keep the anatomical knee-bend branch consistent, including straight poses.
 return max(candidates,key=lambda p:p[0])

for n,q in enumerate(motion):
 if args.preview_only and n not in [0,18,36,54]:continue
 raw_hip=np.array([HIPX,raw_hips[n]]);hip=np.array([HIPX,torso_heights[n]])
 corrected=[]
 for off,k,a,pitch,bottom in poses[n]:
  ankle=raw_hip+a
  knee=contact_knee(hip+off,ankle)
  corrected.append((off,knee-hip,ankle-hip,pitch,bottom))
 relative=corrected
 r=rot(.025+pelvis[n]);bm=np.eye(3);bm[:2,:2]=r*BODY_SCALE;bm[:2,2]=hip-r@HIP*BODY_SCALE
 cm=bm@pivot(CHEST,chest[n]);hm=cm@pivot(NECK,head[(n-2)%N])
 cw=1-smooth((bt.uv[:,:,1]-RIG['chestBlend'][0])/RIG['chestBlend'][1]);hw=1-smooth((bt.uv[:,:,1]-RIG['headBlend'][0])/RIG['headBlend'][1])
 dest=(body_rest@bm[:2].T)*(1-cw[:,:,None])+(body_rest@cm[:2].T)*(cw*(1-hw))[:,:,None]+(body_rest@hm[:2].T)*(cw*hw)[:,:,None]
 torso=bt.render(dest)
 lag=((chest[(n-3)%N]+head[(n-3)%N])-(chest[n]+head[n]))*.35
 hairM=hm@pivot(np.array(RIG['hairPivot']),lag)
 rear=cv2.warpAffine(hair,(hairM[:2]*SCALE).astype(np.float32),(W,H),flags=cv2.INTER_CUBIC)
 def point(p):return (cm@np.array([*p,1.]))[:2]
 farshoulder=point(RIG['farShoulder']);nearshoulder=point(RIG['nearShoulder'])
 canvas=np.zeros((H,W,4),np.float32)
 off,k,a,pitch,_=relative[0];canvas=over(canvas,render_leg(hip+off,hip+k,hip+a,pitch,False))
 fararm=render_arm(farshoulder,n,'Left',False);canvas=over(canvas,rear);canvas=over(canvas,fararm)
 off,k,a,pitch,_=relative[1];canvas=over(canvas,render_leg(hip+off,hip+k,hip+a,pitch,True))
 canvas=over(canvas,torso);canvas=over(canvas,render_arm(nearshoulder,n,'Right',True))
 for off,k,a,pitch,_ in relative:
  cut=rootcurve@bone(SH,SK,hip+off,hip+k,.18).T*SCALE
  sampled=cv2.remap(torso[:,:,3],cut[:,0].astype(np.float32).reshape(-1,1),cut[:,1].astype(np.float32).reshape(-1,1),cv2.INTER_LINEAR)
  root_coverage.append({'frame':n,'minimumAlpha':float(sampled.min()),'exposedSamples':int((sampled<.9).sum())})
 alpha=np.clip(canvas[:,:,3:4],0,1);rgb=np.clip(canvas[:,:,:3]/np.maximum(alpha,1e-6),0,1)
 frame=Image.fromarray(np.uint8(np.concatenate([rgb,alpha],axis=2)*255));frames.append(frame)
 if n%9==0:frame.save(OUT/f'check-{n:02}.png')
 audit.append({'phase':n/N,'hip':hip.tolist(),'nearKnee':(hip+relative[1][1]).tolist(),'farKnee':(hip+relative[0][1]).tolist(),'nearAnkle':(hip+relative[1][2]).tolist(),'farAnkle':(hip+relative[0][2]).tolist(),'nearThighDirection':((relative[1][1]-relative[1][0])/THIGH).tolist(),'farThighDirection':((relative[0][1]-relative[0][0])/THIGH).tolist(),'nearShinDirection':((relative[1][2]-relative[1][1])/SHIN).tolist(),'farShinDirection':((relative[0][2]-relative[0][1])/SHIN).tolist(),'pelvisPitch':float(pelvis[n]),'chestPitch':float(chest[n]),'headPitch':float(head[(n-2)%N]),'nearUpperArm':float(arms['Right'][0][n]),'nearForearm':float(arms['Right'][1][n]),'nearHand':float(arms['Right'][2][n])})
if args.preview_only:
 print('Exported four hand geometry previews');raise SystemExit(0)
frames[0].save(RUNTIME/'walk-poster.png')
frames[0].save(RUNTIME/'walk.webp',save_all=True,append_images=frames[1:],duration=DT,loop=0,lossless=True)
sheet=Image.new('RGBA',(W*4,H*2))
for j,i in enumerate(range(0,N,9)):sheet.alpha_composite(frames[i],((j%4)*W,(j//4)*H))
sheet.save(OUT/'contact-sheet.png')
(OUT/'motion-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
(OUT/'root-coverage.json').write_text(json.dumps(root_coverage,indent=2),encoding='utf-8')
meta={'version':22,'view':'right-side-profile','frames':72,'frameMs':20,'cycleMs':1440,'durationMs':1440,'width':W,'height':H,'gait':'CMU07_04:139-313, identical angles to queen','thighLength':THIGH,'shinLength':SHIN,'handSides':{'near':'Right','far':'Left','separateTextures':True,'projection':'side-profile'},'handTextureSha256':{side:hashlib.sha256((SOURCE/('arm-'+side.lower()+'.png')).read_bytes()).hexdigest() for side in ['Left','Right']},'handLength':HAND_LENGTH,'handWidthScale':HAND_WIDTH,'handScaleRatioRange':[min(hand_scale_ratios),max(hand_scale_ratios)],'handDeterminantRange':{side:[min(values),max(values)] for side,values in hand_determinants.items()},'sha256':hashlib.sha256((RUNTIME/'walk.webp').read_bytes()).hexdigest()}
meta.update(version=23,gait='CMU07_04:139-313, shared timing; contact-preserving knee retarget',torsoHeightFilter=dict(sigmaFrames=3,gain=.4,contactPreserving=True),footView='orthographic-side',projectedHipSeparation=14,farGroundOffset=-5)
(RUNTIME/'walk.json').write_text(json.dumps(meta,indent=2),encoding='utf-8')
print(json.dumps(meta));print('Exposed roots:',sum(x['exposedSamples'] for x in root_coverage))
