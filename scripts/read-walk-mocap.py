"""Read the BVH hierarchy and evaluate its original full-body joint trajectories."""
from pathlib import Path
import re,json
import numpy as np
from scipy.spatial.transform import Rotation
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'artifacts/queen-walk-mocap'

def read_bvh(path):
 text=path.read_text();hier,motion=text.split('MOTION',1);tok=re.findall(r'\{|\}|[^\s{}]+',hier);pos=0;joints=[];channel_total=0
 def take():
  nonlocal pos
  v=tok[pos];pos+=1;return v
 def parse(parent=None,end=False):
  nonlocal channel_total
  name=('End'+str(len(joints))) if end else take();assert take()=='{'
  j={'name':name,'parent':parent,'offset':None,'channels':[],'start':channel_total};idx=len(joints);joints.append(j)
  while True:
   t=take()
   if t=='}':break
   if t=='OFFSET':j['offset']=np.array([float(take()) for _ in range(3)])
   elif t=='CHANNELS':
    j['channels']=[take() for _ in range(int(take()))];j['start']=channel_total;channel_total+=len(j['channels'])
   elif t=='JOINT':parse(idx)
   elif t=='End':assert take()=='Site';parse(idx,True)
   else:raise ValueError(t)
 assert take()=='HIERARCHY';assert take()=='ROOT';parse()
 lines=motion.strip().splitlines();n=int(lines[0].split(':')[1]);dt=float(lines[1].split(':')[1]);data=np.loadtxt(lines[2:]);assert data.shape==(n,channel_total)
 P=np.zeros((n,len(joints),3));R=np.zeros((n,len(joints),3,3))
 for i,j in enumerate(joints):
  ch=j['channels'];vals=data[:,j['start']:j['start']+len(ch)];localp=np.tile(j['offset'],(n,1));localr=np.tile(np.eye(3),(n,1,1))
  for k,c in enumerate(ch):
   axis='XYZ'.index(c[0])
   if c.endswith('position'):localp[:,axis]+=vals[:,k]
   else:
    rv=np.zeros((n,3));rv[:,axis]=np.radians(vals[:,k]);localr=localr@Rotation.from_rotvec(rv).as_matrix()
  if j['parent'] is None:P[:,i]=localp;R[:,i]=localr
  else:
   par=j['parent'];P[:,i]=P[:,par]+np.einsum('nij,nj->ni',R[:,par],localp);R[:,i]=R[:,par]@localr
 return joints,P,R,dt

if __name__=='__main__':
 for filename in ['07_01','07_04']:
  js,p,r,dt=read_bvh(OUT/'source'/f'{filename}.bvh');names=[j['name'] for j in js]
  np.savez(OUT/f'{filename}-joints.npz',positions=p,rotations=r,dt=dt,names=names)
  print(filename,len(p),'dt',dt,'seconds',round(len(p)*dt,3),'root displacement',p[-1,0]-p[1,0]);print(names)
