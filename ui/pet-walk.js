'use strict';
// v19 full-frame playback: the approved artwork is never split into limb layers.
(()=>{
 const pet=document.getElementById('pet'),rig=document.getElementById('walk-rig'),canvas=document.createElement('canvas');
 canvas.id='walk-canvas';canvas.width=canvas.height=640;rig.appendChild(canvas);
 const ctx=canvas.getContext('2d'),timeline=window.xyWalkTimeline,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const asset='../assets/characters/',cache=new Map();
 let decoder,poster,ready=false,running=false,raf=0,start=0,distanceDriven=false,lastPosition=null,travelTime=0,last=null,request=0,pending=null;
 const loadImage=file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=asset+file;});
 async function frame(index){
  if(cache.has(index))return cache.get(index);
  const {image}=await decoder.decode({frameIndex:index,completeFramesOnly:true});
  let bitmap;try{bitmap=await createImageBitmap(image);}finally{image.close();}
  cache.set(index,bitmap);
  while(cache.size>8){const key=cache.keys().next().value;cache.get(key).close();cache.delete(key);}
  return bitmap;
 }
 async function render(milliseconds){
  const selection=timeline.sample(milliseconds,reduced.matches),token=++request;
  if(!ready)return;
  // Serial requests bound decoder work and avoid old results overwriting new poses.
  if(pending){try{await pending;}catch{}if(token!==request)return;}
  const task=decoder?frame(selection.index):Promise.resolve(poster);pending=task;
  let image;try{image=await task;}finally{if(pending===task)pending=null;}
  if(token!==request)return;
  ctx.clearRect(0,0,640,640);ctx.drawImage(image,0,0,640,640);
  last={...selection,time:milliseconds};
 }
 function tick(now){if(!running)return;void render(distanceDriven?travelTime:now-start).catch(error=>console.error('Walk frame unavailable',error));raf=requestAnimationFrame(tick);}
 function startWalk(){if(running)return;running=true;start=performance.now();distanceDriven=false;lastPosition=null;travelTime=0;void render(0);raf=requestAnimationFrame(tick);}
 function stopWalk(){running=false;cancelAnimationFrame(raf);}
 function sync(value){
  if(value.activity!=='walk'||value.dragMoved||value.dragging){distanceDriven=false;lastPosition=null;return;}
  if(!Number.isFinite(value.petLeft)||!Number.isFinite(value.petTop))return;
  distanceDriven=true;
  if(lastPosition)travelTime=timeline.advance(travelTime,Math.hypot(value.petLeft-lastPosition.x,value.petTop-lastPosition.y),Math.min(pet.clientWidth,pet.clientHeight));
  lastPosition={x:value.petLeft,y:value.petTop};
 }
 const loaded=(async()=>{
  poster=await loadImage('walk-v19-poster.png');ctx.drawImage(poster,0,0);
  // Animated-image decoding is local; no account data or network service is involved.
  if(typeof ImageDecoder!=='undefined'&&await ImageDecoder.isTypeSupported('image/webp')){
   const response=await fetch(asset+'walk-v19.webp');if(!response.ok)throw Error('Walk artwork unavailable');
   decoder=new ImageDecoder({data:await response.arrayBuffer(),type:'image/webp',preferAnimation:true});
   await decoder.tracks.ready;
   const track=decoder.tracks.selectedTrack;if(track.frameCount!==timeline.frames)throw Error('Unexpected walk frame count');
  }else{
   // Native animated WebP fallback for runtimes without frame-addressable decoding.
   poster=await loadImage('walk-v19.webp');
  }
  ready=true;await render(0);if(pet.dataset.action==='walk')startWalk();
 })();
 new MutationObserver(()=>{if(pet.dataset.action==='walk')startWalk();else stopWalk();}).observe(pet,{attributes:true,attributeFilter:['data-action']});
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopWalk();else if(pet.dataset.action==='walk')startWalk();});
 reduced.addEventListener('change',()=>{void render(travelTime);});
 window.xyPetWalk={ready:loaded,sync,render,pause:stopWalk,get state(){return{ready,running,distanceDriven,version:19,cycle:timeline.cycle,decoder:!!decoder,cacheSize:cache.size,...last};}};
})();
