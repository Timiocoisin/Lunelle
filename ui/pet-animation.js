'use strict';
(()=>{
 const pet=document.getElementById('pet'),image=document.getElementById('pet-image'),art=document.getElementById('pet-art');
 const root='../assets/characters/',paths={idle:'pet.png',blink:'motion-blink.png',wave:'motion-wave.png',lift:'motion-lift.png',walkBody:'walk-body.png',walkLeft:'walk-leg-left.png',walkRight:'walk-leg-right.png'};
 let ready=false,panel=false,drag=false,activity='idle',action=null,animation=null,finishTimer=null,blinkTimer=null;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function pose(name){if(ready){image.src=root+paths[name];pet.classList.toggle('action-pose',name!=='idle'&&name!=='blink');}}
 function cancel(){animation?.cancel();animation=null;clearTimeout(finishTimer);action=null;pet.classList.toggle('panel-mode',panel);pose('idle');pet.dataset.action=panel?'companion':'idle';}
 function animate(frames,options){if(!reduced.matches)animation=art.animate(frames,options);}
 function finishAfter(ms){finishTimer=setTimeout(()=>{cancel();},ms);}
 function play(name){
  if(drag&&name!=='lift')return false;
  cancel();action=name;pet.dataset.action=name;
  if(name==='blink'){pose('blink');finishAfter(150);}
  else if(name==='wave'){
   pose('wave');animate([{transform:'rotate(0deg)'},{transform:'rotate(-3deg)',offset:.3},{transform:'rotate(2deg)',offset:.65},{transform:'rotate(0deg)'}],{duration:1000,easing:'ease-in-out'});finishAfter(1050);
  }else if(name==='tilt'||name==='look'){
   animate([{transform:'rotate(0deg)'},{transform:'rotate(-7deg)',offset:.28},{transform:'rotate(5deg)',offset:.65},{transform:'rotate(0deg)'}],{duration:1400,easing:'ease-in-out'});finishAfter(1450);
  }else if(name==='nod'){
   animate([{transform:'translateY(0) rotate(0deg)'},{transform:'translateY(5px) rotate(3deg)',offset:.25},{transform:'translateY(0) rotate(0deg)',offset:.5},{transform:'translateY(3px) rotate(2deg)',offset:.75},{transform:'translateY(0) rotate(0deg)'}],{duration:850,easing:'ease-in-out'});finishAfter(900);
  }else if(name==='lift'){
   pose('lift');animate([{transform:'translateY(-3px) rotate(-2deg)'},{transform:'translateY(-5px) rotate(2deg)'},{transform:'translateY(-3px) rotate(-2deg)'}],{duration:1200,iterations:Infinity,easing:'ease-in-out'});
  }else if(name==='land'){
   animate([{transform:'scale(1.025,.94)'},{transform:'translateY(-4px) scale(.99,1.025)',offset:.45},{transform:'scale(1,1)'}],{duration:540,easing:'cubic-bezier(.2,.8,.3,1)'});finishAfter(580);
  }else if(name==='walk'){
   // A single standing image is rigged into stable body and continuous leg layers.
   // Never alternate full-body images during walking.
   pose('idle');
  }else if(name==='breathe'){
   animate([{transform:'scale(1,1)'},{transform:'translateY(-2px) scale(1.006,1.012)'},{transform:'scale(1,1)'}],{duration:2600,iterations:2,easing:'ease-in-out'});finishAfter(5250);
  }else if(name==='companion'){pet.classList.add('panel-mode');pet.dataset.action='companion';finishTimer=setTimeout(()=>{pet.classList.toggle('panel-mode',panel);cancel();},1800);}
  return true;
 }
 function idleBlink(){
  clearTimeout(blinkTimer);blinkTimer=setTimeout(()=>{if(!panel&&!drag&&activity==='idle'&&!action)play('blink');idleBlink();},4000+Math.random()*4000);
 }
 function setPanel(value){panel=value;pet.classList.toggle('panel-mode',value);cancel();}
 function sync(value){
  const moving=!!value.dragMoved;
  if(moving!==drag){drag=moving;if(drag){play('lift');}else cancel();}
  const next=value.activity||'idle';
  if(next!==activity){activity=next;if(!drag){if(next==='walk'&&!panel)play('walk');else if(next==='look'&&!panel)play('look');else cancel();}}
 }
 function click(){if(!drag){play(['tilt','nod','wave'][Math.floor(Math.random()*3)]);}}
 function preview(name){if(drag)return;activity='idle';if(name==='drag'){play('lift');finishTimer=setTimeout(()=>play('land'),1100);}else if(name==='walk'){play('walk');finishAfter(2200);}else play(name);}
 Promise.all(Object.values(paths).map(file=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src=root+file;}))).then(()=>{ready=true;pose('idle');}).catch(()=>{ready=false;});
 idleBlink();
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancel();clearTimeout(blinkTimer);}else idleBlink();});
 reduced.addEventListener('change',()=>cancel());
 window.xyPetAnimation={sync,setPanel,click,play,preview,cancel,get state(){return{ready,panel,drag,activity,action,pose:image.src};}};
})();
