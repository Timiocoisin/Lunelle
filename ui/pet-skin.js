'use strict';
// Queen actions use the approved v2 artwork and a separate continuous surface.
(()=>{
 const pet=document.getElementById('pet'),canvas=document.createElement('canvas');
 canvas.id='queen-sprite';canvas.width=canvas.height=768;canvas.setAttribute('aria-hidden','true');pet.appendChild(canvas);
 const ctx=canvas.getContext('2d'),motion=window.xyQueenMotion,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const root='../assets/characters/queen/v2/',images={},cache=new Map();
 let selected='classic',loaded=false,loading=null,error=null,surface,manifest,decoder,poster,decoding=null;
 let raf=0,action='',start=0,travel=0,lastPosition=null,distanceDriven=false,facing='right',walkFrame=0,currentMotion=null;
 let previousPose=null,previousFrame=null,transitionStart=-Infinity;
 const load=file=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Queen artwork unavailable: '+file));im.src=root+file;});
 async function initialize(){
  if(loading)return loading;
  loading=(async()=>{
   const response=await fetch(root+'manifest.json');if(!response.ok)throw Error('Queen manifest unavailable');manifest=await response.json();
   await Promise.all(Object.entries(manifest.poses).map(async([name,file])=>{images[name]=await load(file);}));
   poster=await load('walk-poster.png');
   if(typeof ImageDecoder!=='undefined'&&await ImageDecoder.isTypeSupported('image/webp')){
    const walk=await fetch(root+'walk.webp');if(!walk.ok)throw Error('Queen walk unavailable');
    decoder=new ImageDecoder({data:await walk.arrayBuffer(),type:'image/webp',preferAnimation:true});await decoder.tracks.ready;
    if(decoder.tracks.selectedTrack.frameCount!==motion.frames)throw Error('Unexpected queen walk length');
   }else poster=await load('walk.webp');
   surface=new window.QueenSurface(768);loaded=true;error=null;return true;
  })().catch(e=>{error=e.message;console.error(e);throw e;});return loading;
 }
 function drawFit(context,image,mirror=false){
  const S=context.canvas.width,T=context.canvas.height,scale=Math.min(S/image.width,T/image.height)*.94;
  const w=image.width*scale,h=image.height*scale;
  context.save();if(mirror){context.translate(S,0);context.scale(-1,1);}context.drawImage(image,(S-w)/2,T*.97-h,w,h);context.restore();
 }
 async function walkImage(index){
  if(!decoder)return poster;if(cache.has(index))return cache.get(index);
  const{image}=await decoder.decode({frameIndex:index,completeFramesOnly:true});let bitmap;
  try{bitmap=await createImageBitmap(image);}finally{image.close();}
  cache.set(index,bitmap);while(cache.size>6){const key=cache.keys().next().value;cache.get(key).close();cache.delete(key);}return bitmap;
 }
 function paintWalk(context,image,index){context.clearRect(0,0,context.canvas.width,context.canvas.height);drawFit(context,image,facing==='left');walkFrame=index;}
 async function renderWalk(ms){
  if(decoding)return;
  const index=motion.walk(ms,reduced.matches);
  decoding=walkImage(index);
  try{const image=await decoding;if(selected==='queen'&&pet.dataset.action==='walk')paintWalk(ctx,image,index);}finally{decoding=null;}
 }
 function paintPose(context,name,ms,{panel=false,nod=0}={}){
  const m=motion.sample(name,ms,{reduced:reduced.matches,panel,eyes:window.xyPetAnimation.state.blinkProgress});
  if(panel&&!['lift','land'].includes(name))m.pose='companion';
  if(nod&&!reduced.matches)m.nod=nod;
  const image=images[m.pose]||images.idle;
  // Eyelid pixels are registered to the neutral face. Other poses retain their
  // own expressions instead of borrowing a misaligned patch from another face.
  if(m.pose!=='idle')m.eyes=0;
  const rendered=surface.render(image,images.blink,m,manifest.eyeBox);
  context.clearRect(0,0,context.canvas.width,context.canvas.height);
  context.drawImage(rendered,0,0,context.canvas.width,context.canvas.height);currentMotion=m;
  return m.pose;
 }
 function tick(now){
  raf=0;if(selected!=='queen'||document.hidden)return;
  const next=pet.dataset.action||'idle';
  if(next!==action){action=next;start=now;distanceDriven=false;lastPosition=null;travel=0;}
  if(loaded&&!document.body.classList.contains('companion-open')){
   if(action==='walk')void renderWalk(distanceDriven?travel:now-start).catch(e=>{error=e.message;});
   else{
    const nextPose=({wave:'wave',lift:'lift',land:'land',companion:'companion'})[action]||'idle';
    if(previousPose!==null&&previousPose!==nextPose){previousFrame=document.createElement('canvas');previousFrame.width=previousFrame.height=768;previousFrame.getContext('2d').drawImage(canvas,0,0);transitionStart=now;}
    previousPose=nextPose;paintPose(ctx,action,now-start);
    const mix=reduced.matches?1:motion.smooth((now-transitionStart)/160);
    if(previousFrame&&mix<1){ctx.globalAlpha=1-mix;ctx.drawImage(previousFrame,0,0);ctx.globalAlpha=1;}else previousFrame=null;
   }
  }
  raf=requestAnimationFrame(tick);
 }
 const oldSync=window.xyPetWalk.sync;
 window.xyPetWalk.sync=value=>{
  if(selected==='queen'){
   if(value.activity==='walk'&&!value.dragging&&!value.dragMoved){
    if(value.facing==='left'||value.facing==='right')facing=value.facing;
    if(Number.isFinite(value.petLeft)&&Number.isFinite(value.petTop)){
     distanceDriven=true;if(lastPosition)travel=motion.advance(travel,Math.hypot(value.petLeft-lastPosition.x,value.petTop-lastPosition.y),Math.min(pet.clientWidth,pet.clientHeight));
     lastPosition={x:value.petLeft,y:value.petTop};
    }
   }else{distanceDriven=false;lastPosition=null;facing='right';}
  }
  return oldSync(value);
 };
 function resume(){if(selected==='queen'&&!document.hidden&&!raf)raf=requestAnimationFrame(tick);}
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else resume();});
 window.xyPetSkin={
  get ready(){return initialize();},
  get state(){return{selected,ready:loaded,error,version:2,action,pose:currentMotion?.pose,motion:currentMotion,walkFrame,frames:motion.frames,cycle:motion.cycle,facing,distanceDriven,cacheSize:cache.size,renderer:surface?.gl?'webgl':'canvas'};},
  set(value){
   const next=value==='queen'?'queen':'classic';if(next===selected)return;selected=next;document.body.dataset.character=next;
   const portrait=document.getElementById('portrait');portrait.src=next==='queen'?root+'companion.png':'../assets/characters/portrait-perch.png';
   cancelAnimationFrame(raf);raf=0;action='';previousPose=null;previousFrame=null;lastPosition=null;distanceDriven=false;facing='right';
   if(next==='queen'){initialize().then(resume).catch(()=>{});}
  },
  renderCompanion(now,target,{nod=0}={}){
   if(!loaded)return;
   if(target.width!==768||target.height!==768){target.width=target.height=768;}
   const name=['lift','land'].includes(pet.dataset.action)?pet.dataset.action:'companion';
   paintPose(target.getContext('2d'),name,now-start,{panel:true,nod});
  },
  async renderAt(name,ms){
   await initialize();if(name==='walk'){const index=motion.walk(ms,reduced.matches);paintWalk(ctx,await walkImage(index),index);}else paintPose(ctx,name,ms);
   return canvas.toDataURL();
  }
 };
})();
