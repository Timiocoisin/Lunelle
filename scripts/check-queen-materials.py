"""Validate that a material repaint does not alter the reviewed walk geometry."""
from pathlib import Path
import json,numpy as np
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'artifacts/queen-walk-seated-style'
source=ROOT/'docs/design/queen-walk-seated-style'
for name in ['body','hair','arm','leg']:
 a=np.array(Image.open(source/'geometry'/(name+'.png')))[:,:,3]
 b=np.array(Image.open(source/(name+'.png')))[:,:,3]
 assert np.array_equal(a,b),name+' rig alpha changed'
a=Image.open(OUT/'previous/walk.webp');b=Image.open(ROOT/'assets/characters/queen/v2/walk.webp')
assert a.n_frames==b.n_frames==72
changes=[];total_ms=0
for i in range(72):
 a.seek(i);b.seek(i);old=np.array(a.convert('RGBA'));new=np.array(b.convert('RGBA'))
 assert np.array_equal(old[:,:,3],new[:,:,3]),f'Frame {i} silhouette changed'
 opaque=old[:,:,3]>128
 changes.append(float(np.abs(old[:,:,:3].astype(float)-new[:,:,:3])[opaque].mean()))
 total_ms+=b.info['duration']
assert total_ms==1440
assert np.mean(changes)>2,'New materials were not exported'
old=json.loads((ROOT/'artifacts/queen-runtime-walk/motion-audit.json').read_text(encoding='utf-8'))
new=json.loads((OUT/'render/motion-audit.json').read_text(encoding='utf-8'))
for a,b in zip(old,new):
 for key in ['hip','nearKnee','farKnee','nearAnkle','farAnkle','upperBody']:assert a[key]==b[key],key+' trajectory changed'
roots=json.loads((OUT/'render/root-coverage.json').read_text(encoding='utf-8'))
assert sum(x['exposedSamples'] for x in roots)==0
report={'frames':72,'cycleMs':total_ms,'rigAlphaUnchanged':True,'allFrameAlphaUnchanged':True,'jointTrajectoriesUnchanged':True,'exposedRootSamples':0,'meanRGBChange':float(np.mean(changes))}
(OUT/'validation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
