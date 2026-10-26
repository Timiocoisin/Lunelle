"""Articulated walk with stance extension, toe-off, low swing, and counter-swing arms."""
from pathlib import Path
import math,json,argparse
import cv2,numpy as np
from scipy.ndimage import gaussian_filter1d
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--materials',type=Path,default=ROOT/'docs/design/queen-walk-seated-style')
parser.add_argument('--output',type=Path,default=ROOT/'artifacts/queen-runtime-walk')
args=parser.parse_args()
ASSETS=ROOT/'artifacts/queen-walk-rig-v2';CAPTURE=ROOT/'artifacts/queen-walk-mocap';BODY=ROOT/'artifacts/queen-walk-refined'
OUT=args.output;OUT.mkdir(parents=True,exist_ok=True)
SCALE=2
W,H,N=960,1120,72;GROUND=532.;DT=20;STANCE=.62

def load(name):
 a=cv2.imread(str((args.materials if args.materials else (BODY if name in ['body.png','hair.png'] else ASSETS))/name),cv2.IMREAD_UNCHANGED)
 if a is None:raise FileNotFoundError(name)
 a=cv2.cvtColor(a,cv2.COLOR_BGRA2RGBA).astype(np.float32)/255
 a[:,:,:3]*=a[:,:,3:4];return a
body,leg,arm=map(load,['body.png','leg.png','arm.png']);hair=load('hair.png')
# Let the torso own the shoulder cap; blend only the proximal upper arm.
arm_fade=np.clip((np.arange(arm.shape[0],dtype=np.float32)-160)/100,0,1)
arm_fade=arm_fade*arm_fade*(3-2*arm_fade)
arm*=arm_fade[:,None,None]
def over(a,b):return b+a*(1-b[:,:,3:4])
def piece(src,lo,hi):
 p=src.copy();p[:lo]=0;p[hi:]=0;return p
lp=[piece(leg,0,580),piece(leg,530,1185),piece(leg,1140,1536)]
ap=[piece(arm,0,650),piece(arm,595,1195),piece(arm,1135,1536)]
SH,SK,SA=map(np.array,[[490.,35.],[550.,555.],[566.,1160.]])
AS,AE,AW=map(np.array,[[470.,55.],[505.,620.],[575.,1170.]])
HEEL=np.array([-13.44,44.80]);TOE=np.array([31.36,44.80]);HIPX=270.;L1,L2=110.,113.
def rot(a):return np.array([[math.cos(a),-math.sin(a)],[math.sin(a),math.cos(a)]])
def ease(t):return t*t*t*(10-15*t+6*t*t)
def contact(p):
 u=p/STANCE;base=38-76*u
 if u<.16:angle=-.12*(1-ease(u/.16));pivot=HEEL
 elif u>.75:angle=.36*ease((u-.75)/.25);pivot=TOE
 else:angle=0.;pivot=HEEL
 r=rot(angle)
 ankle=np.array([HIPX+base+pivot[0]-(r@pivot)[0],GROUND-max((r@HEEL)[1],(r@TOE)[1])])
 return ankle,angle
A0,T0=contact(0);A1,T1=contact(STANCE)
# Stance anchors move backward at constant speed relative to the translating body.
SPEED=-76/STANCE

def foot(p):
 if p<STANCE:
  ankle,angle=contact(p);return ankle,angle,True
 u=(p-STANCE)/(1-STANCE)
 # Minimum-jerk swing: endpoint velocity matches moving stance, and
 # acceleration is zero on both sides of lift-off and touchdown.
 tangent=np.array([SPEED,0.])*(1-STANCE)
 ankle=A1+tangent*u+(A0-A1-tangent)*ease(u)
 ankle[1]-=15*64*u**3*(1-u)**3

 angle=T1*(1-ease(u))+T0*ease(u)
 return ankle,angle,False

def hipheight(feet):
 candidates=[]
 for ankle,angle,stance in feet:
  dx=ankle[0]-HIPX
  candidates.append(ankle[1]-math.sqrt(222.2**2-dx*dx))
 # Smooth maximum removes the pelvis cusp when the supporting leg changes.
 temperature=.9;peak=max(candidates)
 return peak+temperature*math.log(sum(math.exp((v-peak)/temperature) for v in candidates))+.15

def solve(hip,ankle):
 v=ankle-hip;d=np.linalg.norm(v)
 assert d<L1+L2
 along=(L1*L1-L2*L2+d*d)/(2*d);bend=math.sqrt(max(0,L1*L1-along*along))
 return hip+v/d*along+np.array([v[1],-v[0]])/d*bend

def segment(src,s0,s1,t0,t1,width):
 sv=s1-s0;sn=np.array([sv[1],-sv[0]])/np.linalg.norm(sv)
 tv=t1-t0;tn=np.array([tv[1],-tv[0]])/np.linalg.norm(tv)
 m=cv2.getAffineTransform(np.float32([s0,s1,s0+100*sn]),np.float32([t0,t1,t0+width*100*tn]))
 return cv2.warpAffine(src,m,(W,H),flags=cv2.INTER_CUBIC)

def matrix_for(s0,s1,t0,t1,width):
 sv=s1-s0;sn=np.array([sv[1],-sv[0]])/np.linalg.norm(sv)
 tv=t1-t0;tn=np.array([tv[1],-tv[0]])/np.linalg.norm(tv)
 return cv2.getAffineTransform(np.float32([s0,s1,s0+100*sn]),np.float32([t0,t1,t0+width*100*tn]))

def renderleg(hip,knee,ankle,angle,near):
 mt=matrix_for(SH,SK,hip,knee,.155)
 ms=matrix_for(SK,SA,knee,ankle,.148)
 mf=np.zeros((2,3),np.float32);mf[:,:2]=rot(angle)*.14;mf[:,2]=ankle-rot(angle)@SA*.14
 ys=sorted(set(list(range(0,1536,36))+[510,535,555,575,600,1125,1140,1160,1180,1200,1535]))
 xs=[300.,575.,850.]
 source=np.array([[(x,float(y)) for x in xs] for y in ys],np.float32)
 dest=np.zeros_like(source)
 for row,y in enumerate(ys):
  v=np.column_stack([source[row],np.ones(3)])
  kt=np.clip((y-510)/90,0,1);kt=kt*kt*(3-2*kt)
  ka=np.clip((y-1125)/75,0,1);ka=ka*ka*(3-2*ka)
  points=(v@mt.T)*(1-kt)+(v@ms.T)*kt
  dest[row]=points*(1-ka)+(v@mf.T)*ka
 mapx=np.full((H,W),-1,np.float32);mapy=mapx.copy()
 for row in range(len(ys)-1):
  for col in range(2):
   for ids in [((row,col),(row,col+1),(row+1,col)),((row,col+1),(row+1,col+1),(row+1,col))]:
    sp=np.float32([source[a,b] for a,b in ids]);dp=np.float32([dest[a,b] for a,b in ids])*SCALE
    x0=max(0,int(np.floor(dp[:,0].min())));x1=min(W,int(np.ceil(dp[:,0].max()))+1)
    y0=max(0,int(np.floor(dp[:,1].min())));y1=min(H,int(np.ceil(dp[:,1].max()))+1)
    if x1<=x0 or y1<=y0:continue
    inverse=cv2.getAffineTransform(dp,sp)
    yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32)
    # Test true triangle interiors rather than rounded raster polygons; this
    # prevents neighboring triangles from sampling outside the stocking edge.
    ex=xx+.5;ey=yy+.5
    a,b,c=dp
    denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(denominator)<1e-6:continue
    u=((b[1]-c[1])*(ex-c[0])+(c[0]-b[0])*(ey-c[1]))/denominator
    v=((c[1]-a[1])*(ex-c[0])+(a[0]-c[0])*(ey-c[1]))/denominator
    mask=(u>=-1e-5)&(v>=-1e-5)&(u+v<=1.00001)
    sx=inverse[0,0]*xx+inverse[0,1]*yy+inverse[0,2]
    sy=inverse[1,0]*xx+inverse[1,1]*yy+inverse[1,2]
    region=mask>0
    mapx[y0:y1,x0:x1][region]=sx[region];mapy[y0:y1,x0:x1][region]=sy[region]
 layer=cv2.remap(leg,mapx,mapy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
 if not near:layer[:,:,:3]*=.82
 return layer,knee

capture=np.load(CAPTURE/'walk-cycle.npz');motion=capture['positions'];names=list(capture['names']);jid={name:i for i,name in enumerate(names)}

def vec(q,a,b):
 v=q[jid[b]]-q[jid[a]]
 return np.array([v[2],-v[1]])

def limb(q,side):
 # Retarget measured sagittal joint directions onto constant character bones.
 thigh=vec(q,side+'UpLeg',side+'Leg');thigh=thigh/np.linalg.norm(thigh)*110
 shin=vec(q,side+'Leg',side+'Foot');shin=shin/np.linalg.norm(shin)*113
 footvector=vec(q,side+'Foot',side+'ToeBase')
 delta=math.atan2(footvector[1],footvector[0])-.27
 limit=.50 if delta>=0 else .20
 pitch=limit*math.tanh(delta/limit)
 return thigh,shin,pitch

arm_curves={}
for side in ['Left','Right']:
 def angles(a,b):
  v=motion[:,jid[side+b]]-motion[:,jid[side+a]]
  return np.unwrap(np.arctan2(v[:,2],-v[:,1]))
 upper=angles('Arm','ForeArm');lower=angles('ForeArm','Hand')
 flex=lower-upper;flex-=flex.mean()
 centered=upper-upper.mean();gain=float(np.clip(.11/max(.01,np.std(centered)),.7,1.5))
 upper=gaussian_filter1d(centered*gain-.04,1.2,mode='wrap')
 flex=.24+.18*np.tanh(flex*.8/.18)
 fore=upper+gaussian_filter1d(flex,1.2,mode='wrap')
 wrist=np.roll(gaussian_filter1d(fore,1.5,mode='wrap'),2)+.04
 arm_curves[side]=(upper,fore,wrist)

def arm_mesh(shoulder,elbow,wrist,tip,near):
 mt=matrix_for(AS,AE,shoulder,elbow,.103)
 ms=matrix_for(AE,AW,elbow,wrist,.103)
 mf=matrix_for(AW,np.array([620.,1490.]),wrist,tip,.103)
 ys=sorted(set(list(range(0,1536,36))+[520,560,600,620,660,1100,1135,1170,1200,1240,1535]))
 xs=[300.,575.,850.]
 source=np.array([[(x,float(y)) for x in xs] for y in ys],np.float32)
 dest=np.zeros_like(source)
 for row,y in enumerate(ys):
  v=np.column_stack([source[row],np.ones(3)])
  kt=np.clip((y-520)/140,0,1);kt=kt*kt*(3-2*kt)
  ka=np.clip((y-1100)/140,0,1);ka=ka*ka*(3-2*ka)
  points=(v@mt.T)*(1-kt)+(v@ms.T)*kt
  dest[row]=points*(1-ka)+(v@mf.T)*ka
 mapx=np.full((H,W),-1,np.float32);mapy=mapx.copy()
 for row in range(len(ys)-1):
  for col in range(2):
   for ids in [((row,col),(row,col+1),(row+1,col)),((row,col+1),(row+1,col+1),(row+1,col))]:
    sp=np.float32([source[a,b] for a,b in ids]);dp=np.float32([dest[a,b] for a,b in ids])*SCALE
    x0=max(0,int(np.floor(dp[:,0].min())));x1=min(W,int(np.ceil(dp[:,0].max()))+1)
    y0=max(0,int(np.floor(dp[:,1].min())));y1=min(H,int(np.ceil(dp[:,1].max()))+1)
    if x1<=x0 or y1<=y0:continue
    inverse=cv2.getAffineTransform(dp,sp)
    yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32)
    # Test true triangle interiors rather than rounded raster polygons; this
    # prevents neighboring triangles from sampling outside the stocking edge.
    ex=xx+.5;ey=yy+.5
    a,b,c=dp
    denominator=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
    if abs(denominator)<1e-6:continue
    u=((b[1]-c[1])*(ex-c[0])+(c[0]-b[0])*(ey-c[1]))/denominator
    v=((c[1]-a[1])*(ex-c[0])+(a[0]-c[0])*(ey-c[1]))/denominator
    mask=(u>=-1e-5)&(v>=-1e-5)&(u+v<=1.00001)
    sx=inverse[0,0]*xx+inverse[0,1]*yy+inverse[0,2]
    sy=inverse[1,0]*xx+inverse[1,1]*yy+inverse[1,2]
    region=mask>0
    mapx[y0:y1,x0:x1][region]=sx[region];mapy[y0:y1,x0:x1][region]=sy[region]
 layer=cv2.remap(arm,mapx,mapy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
 if not near:layer[:,:,:3]*=.82
 return layer

def renderarm(shoulder,frame,side,near):
 u,f,w=(v[frame] for v in arm_curves[side])
 elbow=shoulder+np.array([math.sin(u),math.cos(u)])*61
 wrist=elbow+np.array([math.sin(f),math.cos(f)])*52
 tip=wrist+np.array([math.sin(w),math.cos(w)])*28
 return arm_mesh(shoulder,elbow,wrist,tip,near)

# Measured spinal tilt supplies real torso motion rather than a periodic sine.
leans=[]
for q in motion:
 v=vec(q,'Hips','Spine1');leans.append(math.atan2(v[0],-v[1]))
leans=np.array(leans);leans=leans-leans.mean()+.025

hv=motion[:,jid['Head']]-motion[:,jid['Neck1']]
head_pitch=np.unwrap(np.arctan2(hv[:,2],hv[:,1]));head_pitch=(head_pitch-head_pitch.mean())*.65
def measured_roll(left,right):
 v=motion[:,jid[left]]-motion[:,jid[right]]
 a=np.unwrap(np.arctan2(v[:,1],v[:,0]));return gaussian_filter1d(a-a.mean(),1.0,mode='wrap')
pelvis_roll=measured_roll('LeftUpLeg','RightUpLeg')*.23
shoulder_roll=measured_roll('LeftArm','RightArm')*.5
chest_pitch=(leans-leans.mean())*.4+(shoulder_roll-pelvis_roll)*.6
head_pitch-=.25*chest_pitch

# Static skirt overlap correction, applied once in source coordinates. This
# garment shape does not expand, compress, or pulse during the animation.
by,bx=np.mgrid[0:body.shape[0],0:body.shape[1]].astype(np.float32)
seam=14.0*np.exp(-((bx-829)/71)**2-((by-649)/71)**2)
body=cv2.remap(body,(bx-seam).astype(np.float32),by,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)

def pivot_rotation(point,angle):
 result=np.eye(3);result[:2,:2]=rot(angle);result[:2,2]=np.array(point)-rot(angle)@np.array(point)
 return result

def root_at(q):
 bottoms=[]
 for side in ['Left','Right']:
  thigh,shin,angle=limb(q,side)
  ankle=thigh+shin
  bottoms.append(ankle[1]+max((rot(angle)@HEEL)[1],(rot(angle)@TOE)[1]))
 peak=max(bottoms);support=peak+.65*math.log(sum(math.exp((v-peak)/.65) for v in bottoms))
 return np.array([HIPX,GROUND-support])

# Periodic damped response to measured parent motion; no transient at the loop seam.
parent=[]
for i,q in enumerate(motion):
 hip=root_at(q);r=rot(.025+pelvis_roll[i]);bm=np.eye(3);bm[:2,:2]=r*.34;bm[:2,2]=hip-r@np.array([770.,625.])*.34
 cm=bm@pivot_rotation([770.,535.],chest_pitch[i]);parent.append((cm@np.array([820.,375.,1.]))[:2])
parent=np.array(parent)
def response(values,natural_hz=3.2,damping=.85):
 omega=2*np.pi*np.fft.rfftfreq(N,DT/1000)
 natural=2*np.pi*natural_hz
 transfer=omega**2/(natural**2-omega**2+2j*damping*natural*omega)
 return np.fft.irfft(np.fft.rfft(values)*transfer,n=N)
secondary=np.column_stack([.45*np.tanh(response(parent[:,0])/.45),1.2*np.tanh(response(parent[:,1])/1.2)])

# One shared UV mesh for body and clothing: no separately blended waist images.
xs=sorted(set(list(range(0,body.shape[1],70))+[600,660,720,770,800,830,860,900,body.shape[1]-1]))
ys=sorted(set(list(range(0,body.shape[0],45))+[215,245,290,320,350,375,400,430,475,520,535,560,590,625,650,body.shape[0]-1]))
mesh_source=np.array([[(float(x),float(y)) for x in xs] for y in ys],np.float32)
mesh_h=np.concatenate([mesh_source,np.ones((*mesh_source.shape[:2],1),np.float32)],axis=2)
chest_weight=1-np.clip((mesh_source[:,:,1]-520)/70,0,1);chest_weight=chest_weight*chest_weight*(3-2*chest_weight)
head_weight=1-np.clip((mesh_source[:,:,1]-215)/75,0,1);head_weight=head_weight*head_weight*(3-2*head_weight)
r2=((mesh_source[:,:,0]-820)/120)**2+((mesh_source[:,:,1]-375)/100)**2
bust_weight=np.maximum(0,1-r2)**3
triangles=[]
for row in range(len(ys)-1):
 for col in range(len(xs)-1):
  if body[ys[row]:ys[row+1]+1,xs[col]:xs[col+1]+1,3].max()<.01:continue
  triangles.extend([((row,col),(row,col+1),(row+1,col)),((row,col+1),(row+1,col+1),(row+1,col))])
mesh_areas=[]

def render_torso(base,n):
 bm=np.eye(3);bm[:2]=base
 cm=bm@pivot_rotation([770.,535.],chest_pitch[n])
 hm=cm@pivot_rotation([770.,245.],head_pitch[(n-2)%N])
 wp=1-chest_weight;wc=chest_weight*(1-head_weight);wh=chest_weight*head_weight
 dest=(mesh_h@bm[:2].T)*wp[:,:,None]+(mesh_h@cm[:2].T)*wc[:,:,None]+(mesh_h@hm[:2].T)*wh[:,:,None]
 # Fabric and skin use the same vertices and UV coordinates through the chest.
 disp=rot(.025+pelvis_roll[n]+chest_pitch[n])@secondary[n]
 dest+=bust_weight[:,:,None]*disp
 mapx=np.full((H,W),-1,np.float32);mapy=mapx.copy();areas=[]
 for ids in triangles:
  sp=np.float32([mesh_source[a,b] for a,b in ids]);dp=np.float32([dest[a,b] for a,b in ids])*SCALE
  su=sp[1]-sp[0];sv=sp[2]-sp[0];du=dp[1]-dp[0];dv=dp[2]-dp[0]
  source_area=su[0]*sv[1]-su[1]*sv[0];target_area=du[0]*dv[1]-du[1]*dv[0]
  areas.append(float(target_area/source_area/(.34**2)))
  x0=max(0,int(np.floor(dp[:,0].min())));x1=min(W,int(np.ceil(dp[:,0].max()))+1)
  y0=max(0,int(np.floor(dp[:,1].min())));y1=min(H,int(np.ceil(dp[:,1].max()))+1)
  if x1<=x0 or y1<=y0:continue
  inverse=cv2.getAffineTransform(dp,sp);yy,xx=np.mgrid[y0:y1,x0:x1].astype(np.float32);ex=xx+.5;ey=yy+.5
  a,b,c=dp;den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1])
  if abs(den)<1e-6:continue
  u=((b[1]-c[1])*(ex-c[0])+(c[0]-b[0])*(ey-c[1]))/den
  v=((c[1]-a[1])*(ex-c[0])+(a[0]-c[0])*(ey-c[1]))/den
  mask=(u>=-1e-5)&(v>=-1e-5)&(u+v<=1.00001)
  sx=inverse[0,0]*xx+inverse[0,1]*yy+inverse[0,2];sy=inverse[1,0]*xx+inverse[1,1]*yy+inverse[1,2]
  mapx[y0:y1,x0:x1][mask]=sx[mask];mapy[y0:y1,x0:x1][mask]=sy[mask]
 layer=cv2.remap(body,mapx,mapy,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
 mesh_areas.append({'frame':n,'minimumAreaRatio':min(areas),'maximumAreaRatio':max(areas)})
 lag=((chest_pitch[(n-3)%N]+head_pitch[(n-3)%N])-(chest_pitch[n]+head_pitch[n]))*.35
 hair_matrix=hm@pivot_rotation([750.,200.],lag)
 rear=cv2.warpAffine(hair,(hair_matrix[:2]*SCALE).astype(np.float32),(W,H),flags=cv2.INTER_CUBIC)
 return np.clip(layer,0,1),cm,hm,rear,hair_matrix

ygrid,xgrid=np.mgrid[0:H,0:W].astype(np.float32)/SCALE
rootcurve=[]
for x in range(370,625,4):
 visible=np.where(leg[:85,x,3]>.75)[0]
 if len(visible) and visible[0]<60:rootcurve.append([x,float(visible[0]+1),1.])
rootcurve=np.array(rootcurve)
frames=[];transparent_frames=[];audit=[];root_coverage=[]
for n,q in enumerate(motion):
 phase=n/N;parts=[limb(q,'Left'),limb(q,'Right')]
 relative=[]
 for side,(thigh,shin,angle) in zip(['Left','Right'],parts):
  offset=np.array([(q[jid[side+'UpLeg'],2]-.5)*6,0.])
  knee=offset+thigh;ankle=knee+shin
  bottom=ankle[1]+max((rot(angle)@HEEL)[1],(rot(angle)@TOE)[1])
  relative.append((offset,knee,ankle,angle,bottom))
 bottoms=[v[4] for v in relative];peak=max(bottoms)
 support=peak+.65*math.log(sum(math.exp((v-peak)/.65) for v in bottoms))
 hip=np.array([HIPX,GROUND-support])
 lean=.025+pelvis_roll[n];r=rot(lean);s=.34
 m=np.zeros((2,3),np.float32);m[:,:2]=r*s;m[:,2]=hip-r@np.array([770.,625.])*s
 torso,cm,hm,rearhair,hairmatrix=render_torso(m,n)
 def point(p):return cm[:2,:2]@np.array(p)+cm[:2,2]
 farshoulder=point([745.,305.]);nearshoulder=point([680.,300.])
 canvas=np.zeros((H,W,4),np.float32)
 off,k,a,pitch,bottom=relative[0]
 far,kfar=renderleg(hip+off,hip+k,hip+a,pitch,False)
 off,k,a,pitch,bottom=relative[1]
 near,knear=renderleg(hip+off,hip+k,hip+a,pitch,True)
 canvas=over(canvas,far);canvas=over(canvas,renderarm(farshoulder,n,'Left',False));canvas=over(canvas,rearhair);canvas=over(canvas,near)
 for off,k,a,pitch,bottom in relative:
  origin=hip+off
  mr=matrix_for(SH,SK,origin,hip+k,.155)
  cut=(rootcurve@mr.T)*SCALE
  sampled=cv2.remap(torso[:,:,3],cut[:,0].astype(np.float32).reshape(-1,1),cut[:,1].astype(np.float32).reshape(-1,1),cv2.INTER_LINEAR)
  root_coverage.append({'frame':n,'minimumAlpha':float(sampled.min()),'exposedSamples':int((sampled<.9).sum())})
 canvas=over(canvas,torso);canvas=over(canvas,renderarm(nearshoulder,n,'Right',True))
 bg=np.ones((H,W,3),np.float32)*np.array([250,248,243],np.float32)/255
 for off,k,a,pitch,bottom in relative:
  ankle=hip+a;clearance=support-bottom;strength=.075*math.exp(-max(0,clearance)/10)
  shadow=strength*np.exp(-((xgrid-ankle[0]-10)/26)**2-((ygrid-GROUND-1)/3.5)**2)
  bg*=1-shadow[:,:,None]
 alpha=np.clip(canvas[:,:,3:4],0,1)
 straight=np.concatenate([np.clip(canvas[:,:,:3]/np.maximum(alpha,1e-6),0,1),alpha],axis=2)
 transparent_frames.append(Image.fromarray(np.uint8(straight*255)).resize((768,896),Image.Resampling.LANCZOS))
 rgb=np.clip(canvas[:,:,:3]+bg*(1-canvas[:,:,3:4]),0,1)
 frames.append(Image.fromarray(np.uint8(rgb*255)))
 audit.append({'phase':phase,'hip':hip.tolist(),'nearKnee':knear.tolist(),'farKnee':kfar.tolist(),'nearAnkle':(hip+relative[1][2]).tolist(),'farAnkle':(hip+relative[0][2]).tolist(),'source':'CMU07_04:139-313','upperBody':{'nearShoulder':nearshoulder.tolist(),'farShoulder':farshoulder.tolist(),'headPitch':float(head_pitch[(n-2)%N]),'chestPitch':float(chest_pitch[n]),'chestScales':np.linalg.svd(cm[:2,:2],compute_uv=False).tolist(),'headScales':np.linalg.svd(hm[:2,:2],compute_uv=False).tolist(),'hairScales':np.linalg.svd(hairmatrix[:2,:2],compute_uv=False).tolist(),'pelvisPitch':float(pelvis_roll[n]),'nearUpperArm':float(arm_curves['Right'][0][n]),'nearForearm':float(arm_curves['Right'][1][n]),'nearHand':float(arm_curves['Right'][2][n]),'chestSecondaryOffset':secondary[n].tolist()}})
runtime=ROOT/'assets/characters/queen/v2';runtime.mkdir(exist_ok=True)
transparent_frames[0].save(runtime/'walk-poster.png')
transparent_frames[0].save(runtime/'walk.webp',save_all=True,append_images=transparent_frames[1:],duration=DT,loop=0,lossless=True)
for i in range(0,N,9):frames[i].save(OUT/f'check-{i:02}.png')
contactsheet=Image.new('RGB',(W*4,H*2))
for j,i in enumerate(range(0,N,9)):contactsheet.paste(frames[i],((j%4)*W,(j//4)*H))
contactsheet.save(OUT/'contact-sheet.png')
pal=contactsheet.quantize(colors=256)
indexed=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
indexed[0].save(OUT/'lunelle-walk-clean-arm.gif',save_all=True,append_images=indexed[1:],duration=DT,loop=0,disposal=2,optimize=False)
frames[0].save(OUT/'lunelle-walk-clean-arm.webp',save_all=True,append_images=frames[1:],duration=DT,loop=0,lossless=True)
(OUT/'mesh-areas.json').write_text(json.dumps(mesh_areas,indent=2),encoding='utf-8')
(OUT/'motion-audit.json').write_text(json.dumps(audit),encoding='utf-8')
(OUT/'root-coverage.json').write_text(json.dumps(root_coverage,indent=2),encoding='utf-8')
print('Rendered high resolution continuous arm mesh:72frames from measured CMU07_04 slow walk; no synthetic gait phases.')
