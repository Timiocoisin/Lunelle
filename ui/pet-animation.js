'use strict';
(()=>{
 const pet=document.getElementById('pet'),image=document.getElementById('pet-image'),art=document.getElementById('pet-art');
 const root='../assets/characters/',paths={idle:'idle-seated.png',blink:'blink-seated.png',wave:'motion-wave.png',lift:'motion-lift.png',halfEye:'eyes-half-natural.png',closedEye:'eyes-closed-natural.png'};
 let ready=false,panel=false,drag=false,activity='idle',action=null,animation=null,finishTimer=null,blinkTimer=null,blinkFrame=null,blinkProgress=0,headAnimation=null,gestureAnimation=null,dragSway=0,dragTarget=0,lastDragSample=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function pose(name){if(ready){const next=root+paths[name==='blink'?'idle':name];if(image.getAttribute('src')!==next)image.src=next;pet.classList.toggle('blinking',name==='blink');pet.classList.toggle('action-pose',name!=='idle'&&name!=='blink');}}
 function cancel(){cancelAnimationFrame(settleFrame);settleFrame=null;gestureAnimation?.cancel();gestureAnimation=null;headAnimation?.cancel();headAnimation=null;window.xyPetPuppet.reset();cancelAnimationFrame(blinkFrame);blinkFrame=null;blinkProgress=0;animation?.cancel();animation=null;clearTimeout(finishTimer);action=null;pet.classList.toggle('panel-mode',panel);pose('idle');pet.dataset.action=panel?'companion':'idle';}
 function animate(frames,options){if(!reduced.matches)animation=art.animate(frames,options);}
 // Capture interruptions before resetting controllers; the visible pose never flashes idle.
 const bridge=document.createElement('canvas');bridge.width=bridge.height=887;bridge.id='pet-transition';art.appendChild(bridge);
 let bridgeAnimation=null,settleFrame=null;
 function bridgeFromCurrent(){
  const c=bridge.getContext('2d'),copy=document.createElement('canvas');copy.width=copy.height=887;
  const ctx=copy.getContext('2d');ctx.drawImage(action==='walk'?document.getElementById('walk-canvas'):pet.classList.contains('puppet-active')?document.getElementById('pet-puppet'):image,0,0,887,887);
  if(bridgeAnimation){ctx.globalAlpha=Number(getComputedStyle(bridge).opacity);ctx.drawImage(bridge,0,0);}
  bridgeAnimation?.cancel();c.clearRect(0,0,887,887);c.drawImage(copy,0,0);bridge.style.visibility='visible';
  bridgeAnimation=bridge.animate([{opacity:1},{opacity:0}],{duration:180,easing:'ease-in-out',fill:'forwards'});
  const current=bridgeAnimation;current.onfinish=()=>{if(bridgeAnimation===current){bridge.style.visibility='hidden';bridgeAnimation=null;current.cancel();}};
 }
 function settle(){
  const from=window.xyPetPuppet.state,start=performance.now();
  cancel();cancelAnimationFrame(settleFrame);
  if(!from.active)return;
  function frame(now){const t=Math.min(1,(now-start)/220),weight=1-t*t*(3-2*t),values={};
   for(const key of ['angle','nod','eyes','poseMix','arm','leftLeg','rightLeg','hair','impact'])values[key]=from[key]*weight;
   values.landingMix=from.landingMix;window.xyPetPuppet.setGesture(from.pose,values);
   if(t<1)settleFrame=requestAnimationFrame(frame);else{settleFrame=null;window.xyPetPuppet.reset();}
  }frame(start);
 }
 function finishAfter(ms){finishTimer=setTimeout(settle,ms);}
 function play(name){
  if(drag&&name!=='lift')return false;
  const previous=window.xyPetPuppet.state;
  const continuousLanding=name==='land'&&previous.pose==='lift';
  if(!continuousLanding&&(previous.active||action==='walk'||name==='walk'))bridgeFromCurrent();
  cancelAnimationFrame(settleFrame);settleFrame=null;
  cancel();
  if(continuousLanding)window.xyPetPuppet.setGesture('lift',previous);
  action=name;pet.dataset.action=name;
  if(name==='blink'){pose('blink');startBlink();}
  else if(name==='wave'){
   startGesture('wave');finishAfter(1850);
  }else if(name==='tilt'||name==='look'){
   animateHead('tilt',1450);finishAfter(1500);
  }else if(name==='nod'){
   animateHead('nod',1050);
   nodEyes();finishAfter(1100);
  }else if(name==='lift'){
   startGesture('lift');
  }else if(name==='land'){
   startGesture('land');finishAfter(820);
  }else if(name==='walk'){
   // Play the selected v19 complete artwork without bone or limb recomposition.
   pose('idle');
  }else if(name==='breathe'){
   finishAfter(5250);
  }else if(name==='companion'){pet.classList.add('panel-mode');pet.dataset.action='companion';finishTimer=setTimeout(()=>{pet.classList.toggle('panel-mode',panel);cancel();},1800);}
  return true;
 }
 // Eyelids descend over the unchanged iris, hold closed, then lift again.
 function drawLids(progress){blinkProgress=progress;window.xyPetPuppet.setEyes(progress);}
 function startBlink(){
  const start=performance.now();drawLids(0);
  const duration=reduced.matches?140:340;
  const smooth=t=>t*t*(3-2*t);
  function frame(now){
   const t=(now-start)/duration;
   if(t>=1){cancel();return;}
   const p=t<.38?smooth(t/.38):t<.56?1:1-smooth((t-.56)/.44);
   drawLids(p);blinkFrame=requestAnimationFrame(frame);
  }
  blinkFrame=requestAnimationFrame(frame);
 }
 function animateHead(kind,duration){
  if(reduced.matches)return;
  const start=performance.now();let raf=null,stopped=false;
  const smooth=t=>t*t*(3-2*t);
  function frame(now){if(stopped)return;const t=Math.min(1,(now-start)/duration);const amount=t<.32?smooth(t/.32):t<.52?1:1-smooth((t-.52)/.48);window.xyPetPuppet.setMotion(kind==='tilt'?-4*amount:.7*amount,kind==='nod'?amount:0);if(t<1)raf=requestAnimationFrame(frame);}
  headAnimation={cancel(){stopped=true;cancelAnimationFrame(raf);}};raf=requestAnimationFrame(frame);
 }
 function nodEyes(){
  const start=performance.now();pet.classList.add('blinking');
  const smooth=t=>t*t*(3-2*t);
  function frame(now){const t=Math.min(1,(now-start)/1050);const p=t<.15?0:t<.32?smooth((t-.15)/.17):t<.56?1:t<.82?1-smooth((t-.56)/.26):0;drawLids(p);if(t<1)blinkFrame=requestAnimationFrame(frame);else pet.classList.remove('blinking');}
  blinkFrame=requestAnimationFrame(frame);
 }
 function startGesture(kind){
  const initial=window.xyPetPuppet.state,initialMix=initial.pose==='lift'?initial.poseMix:1;
  const start=performance.now();let raf=null,stopped=false;
  const clamp=t=>Math.max(0,Math.min(1,t)),smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
  pose('idle');
  function frame(now){
   if(stopped)return;const seconds=(now-start)/1000;
   if(kind==='wave'){
    const mix=smooth(seconds/.18)*(1-smooth((seconds-1.5)/.3));
    const eyes=smooth((seconds-.7)/.12)*(1-smooth((seconds-1.02)/.16));
    window.xyPetPuppet.setGesture('wave',{poseMix:mix,arm:reduced.matches?0:Math.sin(seconds*17)*9*mix,eyes,impact:0,hair:0});
   }else if(kind==='lift'){
    dragSway+=(dragTarget-dragSway)*.13;dragTarget*=.94;
    window.xyPetPuppet.setGesture('lift',{poseMix:smooth(seconds/.16),leftLeg:reduced.matches?0:Math.sin(seconds*4.2)*2+dragSway*7,rightLeg:reduced.matches?0:Math.sin(seconds*4.2+.9)*2+dragSway*6,hair:reduced.matches?0:-dragSway*.6+Math.sin(seconds*2)*.1,eyes:0,impact:0});
   }else{
    const t=clamp(seconds/.76),mix=(initialMix+(1-initialMix)*smooth(t/.25))*(1-smooth((t-.74)/.26)),landingMix=smooth(t/.38);
    const impact=reduced.matches?0:t<.55?Math.sin(Math.PI*clamp((t-.12)/.43)):-.22*Math.sin(Math.PI*clamp((t-.55)/.45));
    const eyes=smooth((t-.4)/.12)*(1-smooth((t-.7)/.25));
    window.xyPetPuppet.setGesture('landing',{poseMix:mix,landingMix,leftLeg:dragSway*4*mix,rightLeg:dragSway*3*mix,hair:dragSway*.3*mix,impact,eyes});
   }
   if(kind==='lift'||seconds<(kind==='wave'?1.8:.76))raf=requestAnimationFrame(frame);
  }
  gestureAnimation={cancel(){stopped=true;cancelAnimationFrame(raf);}};frame(start);
 }
 function idleBlink(){
  clearTimeout(blinkTimer);blinkTimer=setTimeout(()=>{if(!panel&&!drag&&activity==='idle'&&!action)play('blink');idleBlink();},4000+Math.random()*4000);
 }
 function setPanel(value){if(panel===value)return;panel=value;pet.classList.toggle('panel-mode',value);settle();}
 function sync(value){
  window.xyPetWalk.setFacing(value.activity==='walk'&&!value.dragging&&!value.dragMoved?value.facing:'right');
  if(value.activity!=='walk'||value.dragging)window.xyPetWalk.sync(value);
  const moving=!!value.dragMoved;
  if(moving&&Number.isFinite(value.petLeft)&&Number.isFinite(value.petTop)){
   const now=performance.now();if(lastDragSample){const dt=Math.max(16,now-lastDragSample.at);dragTarget=Math.max(-1,Math.min(1,(value.petLeft-lastDragSample.x)/dt*3));}lastDragSample={x:value.petLeft,y:value.petTop,at:now};
  }else lastDragSample=null;
  if(moving!==drag){drag=moving;if(drag){play('lift');} // Release keeps the suspended pose for the following landed event.
  }
  const next=value.activity||'idle';
  if(next!==activity){activity=next;if(!drag){if(next==='walk'&&!panel)play('walk');else if(next==='look'&&!panel)play('look');else if(action==='walk'||action==='look')settle();}}
 }
 function click(){if(!drag&&!panel)preview(['breathe','blink','tilt','nod','wave'][Math.floor(Math.random()*5)]);}
 function preview(name){if(drag)return;activity='idle';if(name==='drag'){play('lift');finishTimer=setTimeout(()=>play('land'),1100);}else if(name==='walk'){play('walk');finishAfter(window.xyWalkTimeline.cycle*2);}else play(name);}
 Promise.all([window.xyPetPuppet.ready,window.xyPetWalk.ready,...Object.values(paths).map(file=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=root+file;}))]).then(()=>{ready=true;pose('idle');}).catch(()=>{ready=false;});
 idleBlink();
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();clearTimeout(blinkTimer);}else idleBlink();});
 reduced.addEventListener('change',()=>cancel());
 window.xyPetAnimation={sync,setPanel,click,play,preview,cancel,get state(){return{ready,panel,drag,activity,action,blinkProgress,pose:image.src};}};
})();
