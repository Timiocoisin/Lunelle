'use strict';
// Both appearances share the reviewed 72-frame measured gait and travel clock.
((root,factory)=>{const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.xyWalkTimeline=api;})(globalThis,()=>{
 const cycle=1440,frameMs=20,frames=72,cycleFrames=72,stride=125,referenceSize=640;
 const wrap=(value,length)=>((value%length)+length)%length;
 function sample(milliseconds,reduced=false){const time=reduced?0:Math.floor(wrap(milliseconds,frames*frameMs)/frameMs);return{index:time,phase:time%cycleFrames/cycleFrames};}
 function advance(milliseconds,distance,size){return milliseconds+Math.max(0,distance)/Math.max(1,stride*size/referenceSize)*cycle;}
 return{cycle,frameMs,frames,cycleFrames,stride,referenceSize,sample,advance};
});
