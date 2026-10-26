"""Articulated walk with stance extension, toe-off, low swing, and counter-swing arms."""
from pathlib import Path
import math,json
import cv2,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'artifacts/queen-walk-rig-v2';CAPTURE=ROOT/'artifacts/queen-walk-mocap';BODY=ROOT/'artifacts/queen-walk-mocap-attached';OUT=ROOT/'artifacts/queen-walk-rigidtorso';OUT.mkdir(exist_ok=True)
W,H,N=480,560,72;GROUND=532.;DT=20;STANCE=.62

def load(name):
 a=cv2.imread(str((BODY if name=='body.png' else ASSETS)/name),cv2.IMREAD_UNCHANGED)
 a=cv2.cvtColor(a,cv2.COLOR_BGRA2RGBA).astype(np.float32)/255
 a[:,:,:3]*=a[:,:,3:4];return a
body,leg,arm=map(load,['body.png','leg.png','arm.png'])
def over(a,b):return b+a*(1-b[:,:,3:4])
def piece(src,lo,hi):
 p=src.copy();p[:lo]=0;p[hi:]=0;return p
lp=[piece(leg,0,580),piece(leg,530,1185),piece(leg,1140,1536)]
ap=[piece(arm,0,650),piece(arm,595,1536)]
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
    sp=np.float32([source[a,b] for a,b in ids]);dp=np.float32([dest[a,b] for a,b in ids])
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

def renderarm(shoulder,q,side,near):
 upper=vec(q,side+'Arm',side+'ForeArm');lower=vec(q,side+'ForeArm',side+'Hand')
 elbow=shoulder+upper/np.linalg.norm(upper)*61
 wrist=elbow+lower/np.linalg.norm(lower)*60
 layer=segment(ap[1],AE,AW,elbow,wrist,.103)
 layer=over(layer,segment(ap[0],AS,AE,shoulder,elbow,.103))
 if not near:layer[:,:,:3]*=.78
 return layer

# Measured spinal tilt supplies real torso motion rather than a periodic sine.
leans=[]
for q in motion:
 v=vec(q,'Hips','Spine1');leans.append(math.atan2(v[0],-v[1]))
leans=np.array(leans);leans=leans-leans.mean()+.025

hv=motion[:,jid['Head']]-motion[:,jid['Neck1']]
head_pitch=np.unwrap(np.arctan2(hv[:,2],hv[:,1]));head_pitch=(head_pitch-head_pitch.mean())*.65
chest_pitch=(leans-leans.mean())*.55

# Static skirt overlap correction, applied once in source coordinates. This
# garment shape does not expand, compress, or pulse during the animation.
by,bx=np.mgrid[0:body.shape[0],0:body.shape[1]].astype(np.float32)
seam=10.0*np.exp(-((bx-829)/71)**2-((by-649)/71)**2)
body=cv2.remap(body,(bx-seam).astype(np.float32),by,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)

def pivot_rotation(point,angle):
 result=np.eye(3);result[:2,:2]=rot(angle);result[:2,2]=np.array(point)-rot(angle)@np.array(point)
 return result

def render_torso(base,n):
 bm=np.eye(3);bm[:2]=base
 cm=bm@pivot_rotation([770.,535.],chest_pitch[n])
 hm=cm@pivot_rotation([770.,245.],head_pitch[(n-2)%N])
 layers=[cv2.warpAffine(body,t[:2].astype(np.float32),(W,H),flags=cv2.INTER_CUBIC) for t in [bm,cm,hm]]
 inverse=np.linalg.inv(bm)
 sy=inverse[1,0]*xgrid+inverse[1,1]*ygrid+inverse[1,2]
 chest=1-np.clip((sy-520)/70,0,1);chest=chest*chest*(3-2*chest)
 head=1-np.clip((sy-215)/75,0,1);head=head*head*(3-2*head)
 # Each major region is a rigid transform. Only the narrow neck/waist joins blend.
 layer=layers[0]*(1-chest)[:,:,None]+layers[1]*(chest*(1-head))[:,:,None]+layers[2]*(chest*head)[:,:,None]
 return np.clip(layer,0,1),cm,hm

ygrid,xgrid=np.mgrid[0:H,0:W].astype(np.float32)
rootcurve=[]
for x in range(370,625,4):
 visible=np.where(leg[:85,x,3]>.75)[0]
 if len(visible) and visible[0]<60:rootcurve.append([x,float(visible[0]+1),1.])
rootcurve=np.array(rootcurve)
frames=[];audit=[];root_coverage=[]
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
 lean=.025;r=rot(lean);s=.34
 m=np.zeros((2,3),np.float32);m[:,:2]=r*s;m[:,2]=hip-r@np.array([770.,625.])*s
 torso,cm,hm=render_torso(m,n)
 def point(p):return cm[:2,:2]@np.array(p)+cm[:2,2]
 farshoulder=point([745.,305.]);nearshoulder=point([680.,300.])
 canvas=np.zeros((H,W,4),np.float32)
 off,k,a,pitch,bottom=relative[0]
 far,kfar=renderleg(hip+off,hip+k,hip+a,pitch,False)
 off,k,a,pitch,bottom=relative[1]
 near,knear=renderleg(hip+off,hip+k,hip+a,pitch,True)
 canvas=over(canvas,far);canvas=over(canvas,renderarm(farshoulder,q,'Left',False));canvas=over(canvas,near)
 for off,k,a,pitch,bottom in relative:
  origin=hip+off
  mr=matrix_for(SH,SK,origin,hip+k,.155)
  cut=rootcurve@mr.T
  sampled=cv2.remap(torso[:,:,3],cut[:,0].astype(np.float32).reshape(-1,1),cut[:,1].astype(np.float32).reshape(-1,1),cv2.INTER_LINEAR)
  root_coverage.append({'frame':n,'minimumAlpha':float(sampled.min()),'exposedSamples':int((sampled<.9).sum())})
 canvas=over(canvas,torso);canvas=over(canvas,renderarm(nearshoulder,q,'Right',True))
 bg=np.ones((H,W,3),np.float32)*np.array([250,248,243],np.float32)/255
 for off,k,a,pitch,bottom in relative:
  ankle=hip+a;clearance=support-bottom;strength=.075*math.exp(-max(0,clearance)/10)
  shadow=strength*np.exp(-((xgrid-ankle[0]-10)/26)**2-((ygrid-GROUND-1)/3.5)**2)
  bg*=1-shadow[:,:,None]
 rgb=np.clip(canvas[:,:,:3]+bg*(1-canvas[:,:,3:4]),0,1)
 frames.append(Image.fromarray(np.uint8(rgb*255)))
 audit.append({'phase':phase,'hip':hip.tolist(),'nearKnee':knear.tolist(),'farKnee':kfar.tolist(),'nearAnkle':(hip+relative[1][2]).tolist(),'farAnkle':(hip+relative[0][2]).tolist(),'source':'CMU07_04:139-313','upperBody':{'nearShoulder':nearshoulder.tolist(),'farShoulder':farshoulder.tolist(),'headPitch':float(head_pitch[(n-2)%N]),'chestPitch':float(chest_pitch[n]),'chestScales':np.linalg.svd(cm[:2,:2],compute_uv=False).tolist(),'headScales':np.linalg.svd(hm[:2,:2],compute_uv=False).tolist()}})
for i in range(0,N,9):frames[i].save(OUT/f'check-{i:02}.png')
contactsheet=Image.new('RGB',(W*4,H*2))
for j,i in enumerate(range(0,N,9)):contactsheet.paste(frames[i],((j%4)*W,(j//4)*H))
contactsheet.save(OUT/'contact-sheet.png')
pal=contactsheet.quantize(colors=256)
indexed=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
indexed[0].save(OUT/'lunelle-walk-rigidtorso.gif',save_all=True,append_images=indexed[1:],duration=DT,loop=0,disposal=2,optimize=False)
frames[0].save(OUT/'lunelle-walk-rigidtorso.webp',save_all=True,append_images=frames[1:],duration=DT,loop=0,lossless=True)
(OUT/'motion-audit.json').write_text(json.dumps(audit),encoding='utf-8')
(OUT/'root-coverage.json').write_text(json.dumps(root_coverage,indent=2),encoding='utf-8')
print('Rendered72frames from measured CMU07_04 slow walk; no synthetic gait phases.')
