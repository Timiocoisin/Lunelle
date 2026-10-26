"""Articulated walk with stance extension, toe-off, low swing, and counter-swing arms."""
from pathlib import Path
import math,json
import cv2,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];ASSETS=ROOT/'artifacts/queen-walk-rig-v2';OUT=ROOT/'artifacts/queen-walk-rig-v3';OUT.mkdir(exist_ok=True)
W,H,N=480,560,80;GROUND=532.;DT=20;STANCE=.62

def load(name):
 a=cv2.imread(str(ASSETS/name),cv2.IMREAD_UNCHANGED)
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

def renderleg(hip,ankle,angle,near):
 knee=solve(hip,ankle)
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

def renderarm(shoulder,phase,near,lean):
 swing=-.23*math.cos(phase*2*math.pi)+lean
 flex=.16+.07*(1+math.sin(phase*2*math.pi))
 elbow=shoulder+np.array([math.sin(swing),math.cos(swing)])*61
 wrist=elbow+np.array([math.sin(swing+flex),math.cos(swing+flex)])*60
 layer=segment(ap[1],AE,AW,elbow,wrist,.103)
 layer=over(layer,segment(ap[0],AS,AE,shoulder,elbow,.103))
 if not near:layer[:,:,:3]*=.78
 return layer

ygrid,xgrid=np.mgrid[0:H,0:W].astype(np.float32)
frames=[];audit=[]
for n in range(N):
 phase=n/N;feet=[foot((phase+.5)%1),foot(phase)];hy=hipheight(feet);hip=np.array([HIPX,hy])
 lean=.022+.007*math.sin(phase*2*math.pi)
 r=rot(lean);s=.34
 # Source pelvis at770,625; shoulder layers are transformed by same torso matrix.
 m=np.zeros((2,3),np.float32);m[:,:2]=r*s;m[:,2]=hip-r@np.array([770.,625.])*s
 def point(p):return m[:,:2]@np.array(p)+m[:,2]
 farshoulder=point([745.,305.]);nearshoulder=point([680.,300.])
 canvas=np.zeros((H,W,4),np.float32)
 far,kfar=renderleg(hip,feet[0][0],feet[0][1],False)
 near,knear=renderleg(hip,feet[1][0],feet[1][1],True)
 canvas=over(canvas,far)
 canvas=over(canvas,renderarm(farshoulder,(phase+.5)%1,False,lean))
 canvas=over(canvas,near)
 torso=cv2.warpAffine(body,m,(W,H),flags=cv2.INTER_CUBIC)
 # Small delayed fabric displacement; no whole-image morphing or crossfades.
 weight=np.clip((245-xgrid)/140,0,1)*np.clip((ygrid-100)/160,0,1)
 sway=2*math.sin(phase*2*math.pi-.7)*weight
 torso=cv2.remap(torso,xgrid-sway,ygrid,cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
 canvas=over(canvas,torso)
 canvas=over(canvas,renderarm(nearshoulder,phase,True,lean))
 bg=np.ones((H,W,3),np.float32)*np.array([250,248,243],np.float32)/255
 for ankle,angle,stance in feet:
  strength=.08 if stance else .025
  footcenter=ankle[0]+10
  shadow=strength*np.exp(-((xgrid-footcenter)/26)**2-((ygrid-GROUND-1)/3.5)**2)
  bg*=1-shadow[:,:,None]
 rgb=np.clip(canvas[:,:,:3]+bg*(1-canvas[:,:,3:4]),0,1)
 frames.append(Image.fromarray(np.uint8(rgb*255)))
 audit.append({'phase':phase,'hip':hip.tolist(),'far':{'knee':kfar.tolist(),'ankle':feet[0][0].tolist(),'stance':feet[0][2]},'near':{'knee':knear.tolist(),'ankle':feet[1][0].tolist(),'stance':feet[1][2]}})
for i in range(0,N,10):frames[i].save(OUT/f'check-{i:02}.png')
contactsheet=Image.new('RGB',(W*4,H*2))
for j,i in enumerate(range(0,N,10)):contactsheet.paste(frames[i],((j%4)*W,(j//4)*H))
contactsheet.save(OUT/'contact-sheet.png')
pal=contactsheet.quantize(colors=256)
indexed=[f.quantize(palette=pal,dither=Image.Dither.NONE) for f in frames]
indexed[0].save(OUT/'lunelle-walk-v3.gif',save_all=True,append_images=indexed[1:],duration=DT,loop=0,disposal=2,optimize=False)
frames[0].save(OUT/'lunelle-walk-v3.webp',save_all=True,append_images=frames[1:],duration=DT,loop=0,lossless=True)
(OUT/'motion-audit.json').write_text(json.dumps(audit),encoding='utf-8')
print('Rendered v3: continuous acceleration at foot transitions and smooth pelvis support transfer.')
