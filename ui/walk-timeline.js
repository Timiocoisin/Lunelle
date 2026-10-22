'use strict';
// The selected v19 artwork is played as complete frames; no limb deformation.
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.xyWalkTimeline=api;})(globalThis,()=>{
 const cycle=1080,frameMs=30,frames=216,cycleFrames=36,stride=100,referenceSize=640;
 const wrap=(value,length)=>((value%length)+length)%length;
 function sample(milliseconds,reduced=false){const time=reduced?0:Math.floor(wrap(milliseconds,frames*frameMs)/frameMs);return{index:time,phase:time%cycleFrames/cycleFrames};}
 function advance(milliseconds,distance,size){return milliseconds+Math.max(0,distance)/Math.max(1,stride*size/referenceSize)*cycle;}
 return{cycle,frameMs,frames,cycleFrames,stride,referenceSize,sample,advance};
});
