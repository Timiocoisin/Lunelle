"""Register the AI-repainted materials to the existing, reviewed rig UVs.

This performs alignment, not a style filter. All silhouettes and alpha holes
come from the original geometry; the new painted RGB supplies the materials.
"""
from pathlib import Path
import json
import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'docs/design/queen-walk-seated-style'
report=[]
for name in ['body','hair','arm','leg']:
 original=cv2.imread(str(SOURCE/'geometry'/f'{name}.png'),cv2.IMREAD_UNCHANGED)
 painted=cv2.imread(str(SOURCE/'painted'/f'{name}.png'),cv2.IMREAD_UNCHANGED)
 assert original is not None and painted is not None
 a=original[:,:,3]>128;b=painted[:,:,3]>128
 sift=cv2.SIFT_create(nfeatures=2500)
 ka,da=sift.detectAndCompute(cv2.cvtColor(original[:,:,:3],cv2.COLOR_BGR2GRAY),a.astype(np.uint8)*255)
 kb,db=sift.detectAndCompute(cv2.cvtColor(painted[:,:,:3],cv2.COLOR_BGR2GRAY),b.astype(np.uint8)*255)
 matches=[m for m,second in cv2.BFMatcher().knnMatch(db,da,k=2) if m.distance<.72*second.distance]
 matrix,inliers=cv2.estimateAffinePartial2D(np.float32([kb[m.queryIdx].pt for m in matches]),np.float32([ka[m.trainIdx].pt for m in matches]),method=cv2.RANSAC,ransacReprojThreshold=2)
 assert matrix is not None and inliers.sum()>50,f'Unreliable registration: {name}'
 height,width=original.shape[:2]
 aligned=cv2.warpAffine(painted,matrix,(width,height),flags=cv2.INTER_CUBIC)
 # Extend painted edge colors beneath the old antialiased alpha boundary.
 valid=aligned[:,:,3]>128
 indices=distance_transform_edt(~valid,return_distances=False,return_indices=True)
 rgb=aligned[:,:,:3].copy();rgb[~valid]=rgb[indices[0][~valid],indices[1][~valid]]
 result=np.dstack([rgb,original[:,:,3]])
 assert np.array_equal(result[:,:,3],original[:,:,3])
 cv2.imwrite(str(SOURCE/f'{name}.png'),result)
 report.append({'layer':name,'matches':len(matches),'inliers':int(inliers.sum()),'transform':matrix.tolist(),'alphaUnchanged':True,'shape':list(result.shape)})
(SOURCE/'registration.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps(report,indent=2))
