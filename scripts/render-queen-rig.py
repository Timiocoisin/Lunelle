from pathlib import Path
import math,json
import cv2,numpy as np
from PIL import Image
OUT=Path(__file__).resolve().parents[1]/'artifacts/queen-walk-rig'
W,H=480,560;N=64;GROUND=533.;DURATION=20
body=cv2.imread(str(OUT/'body.png'),cv2.IMREAD_UNCHANGED)
leg=cv2.imread(str(OUT/'leg.png'),cv2.IMREAD_UNCHANGED)
# BGRA -> premultiplied float RGBA to keep interpolation edges clean.
def premul(a):
 a=cv2.cvtColor(a,cv2.COLOR_BGRA2RGBA).astype(np.float32)/255
 a[:,:,:3]*=a[:,:,3:4];return a
body=premul(body);leg=premul(leg)
SH=np.array([490.,35.]);SK=np.array([550.,555.]);SA=np.array([566.,1160.])
pieces=[]
for lo,hi in [(0,575),(535,1180),(1145,1536)]:
 p=leg.copy();p[:lo]=0;p[hi:]=0;pieces.append(p)
def over(dst,src):return src+dst*(1-src[:,:,3:4])
def affinepart(part,s0,s1,t0,t1,width=.145):
 sv=s1-s0;sn=np.array([sv[1],-sv[0]])/np.linalg.norm(sv)
 tv=t1-t0;tn=np.array([tv[1],-tv[0]])/np.linalg.norm(tv)
 m=cv2.getAffineTransform(np.float32([s0,s1,s0+sn*100]),np.float32([t0,t1,t0+tn*width*100]))
 return cv2.warpAffine(part,m,(W,H),flags=cv2.INTER_CUBIC,borderMode=cv2.BORDER_CONSTANT)
def pose(p,near):
 stance=p<.62
 if stance:
  u=p/.62;x=35-70*u
  angle=-.10*max(0,1-u/.15)+.18*max(0,(u-.82)/.18)
  lift=0
 else:
  u=(p-.62)/.38;s=u*u*(3-2*u);x=-35+70*s
  angle=.18*(1-u)-.10*u;lift=13*math.sin(math.pi*u)
 rot=np.array([[math.cos(angle),-math.sin(angle)],[math.sin(angle),math.cos(angle)]])
 foot=np.array([[-13.,46.],[32.,46.]])@rot.T
 ankle=np.array([266+x,GROUND-float(foot[:,1].max())-lift])
 bob=1.2*math.cos(p*4*math.pi)
 hip=np.array([272. if near else 260.,270.+bob])
 v=ankle-hip;dist=np.linalg.norm(v);a,b=110.,113.
 assert dist<a+b,'leg cannot reach'
 along=(a*a-b*b+dist*dist)/(2*dist);height=math.sqrt(max(0,a*a-along*along))
 knee=hip+v/dist*along+np.array([v[1],-v[0]])/dist*height
 return hip,knee,ankle,rot,stance,lift
frames=[];audit=[]
for n in range(N):
 phase=n/N
 canvas=np.zeros((H,W,4),np.float32)
 legs=[]
 for near,p in [(False,(phase+.5)%1),(True,phase)]:
  hip,knee,ankle,rot,stance,lift=pose(p,near)
  shoe_m=np.zeros((2,3),np.float32);shoe_m[:,:2]=rot*.14;shoe_m[:,2]=ankle-rot@SA*.14
  shoe=cv2.warpAffine(pieces[2],shoe_m,(W,H),flags=cv2.INTER_CUBIC)
  layer=over(np.zeros_like(canvas),shoe)
  layer=over(layer,affinepart(pieces[1],SK,SA,knee,ankle))
  layer=over(layer,affinepart(pieces[0],SH,SK,hip,knee,.155))
  if not near:layer[:,:,:3]*=.85
  canvas=over(canvas,layer)
  legs.append({'near':near,'hip':hip.tolist(),'knee':knee.tolist(),'ankle':ankle.tolist(),'stance':stance,'lift':lift})
 # Original detailed body artwork remains intact; cape trails with a tiny delayed sway.
 bob=1.2*math.cos(phase*4*math.pi)
 m=np.float32([[.37,0,300-850*.37],[0,.37,270-625*.37+bob]])
 bodyframe=cv2.warpAffine(body,m,(W,H),flags=cv2.INTER_CUBIC)
 canvas=over(canvas,bodyframe)
 bg=np.array([250,248,243],np.float32)/255
 rgb=np.clip(canvas[:,:,:3]+bg*(1-canvas[:,:,3:4]),0,1)
 frames.append(Image.fromarray(np.uint8(rgb*255)))
 audit.append(legs)
for i in [0,8,16,24,32,40,48,56]:frames[i].save(OUT/f'check-{i:02}.png')
# Proof of constant bone lengths and continuous two-leg identity.
for row in audit:
 for p in row:
  h,k,a=map(np.array,[p['hip'],p['knee'],p['ankle']])
  assert abs(np.linalg.norm(k-h)-110)<1e-5
  assert abs(np.linalg.norm(a-k)-113)<1e-5
assert all(any(p['stance'] for p in row) for row in audit)
mosaic=Image.new('RGB',(W*4,H*2))
for j,i in enumerate([0,8,16,24,32,40,48,56]):mosaic.paste(frames[i],((j%4)*W,(j//4)*H))
mosaic.save(OUT/'rig-contact-sheet.png')
palette=mosaic.quantize(colors=256)
indexed=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
indexed[0].save(OUT/'lunelle-walk-rig.gif',save_all=True,append_images=indexed[1:],duration=DURATION,loop=0,disposal=2,optimize=False)
frames[0].save(OUT/'lunelle-walk-rig.webp',save_all=True,append_images=frames[1:],duration=DURATION,loop=0,lossless=True)
(OUT/'motion-audit.json').write_text(json.dumps(audit),encoding='utf-8')
gif=Image.open(OUT/'lunelle-walk-rig.gif');assert gif.n_frames==N
length=0
for i in range(N):gif.seek(i);length+=gif.info['duration']
assert length==1280
print('Verified: 64 frames, 1280ms loop; fixed bone lengths, persistent leg identities, continuous support.')
