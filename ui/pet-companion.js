'use strict';
// One unchanged portrait texture. Deformation tapers to zero at the paper rim.
(()=>{
 const image=document.getElementById('portrait'),canvas=document.createElement('canvas');
 canvas.id='companion-canvas';canvas.setAttribute('aria-hidden','true');image.after(canvas);
 const ctx=canvas.getContext('2d'),texture=document.createElement('canvas'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let open=false,raf=0,start=0,nextLook=0,lookStart=-Infinity,breath=0,nodStart=-Infinity,nod=0;
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 function frame(now){
  if(!open||document.hidden){raf=0;return;}
  if(now>nextLook){lookStart=now;nextLook=now+6500+Math.random()*6500;}
  const t=(now-start)/1000,look=Math.max(0,Math.sin(Math.PI*Math.min(1,(now-lookStart)/1900)));
  breath=reduced.matches?0:Math.sin(t*Math.PI*2/4.6)*.008;
  nod=reduced.matches?0:Math.sin(Math.PI*Math.min(1,Math.max(0,(now-nodStart)/850)));
  if(window.xyPetSkin?.state.selected==='queen'){
   window.xyPetSkin.renderCompanion(now,canvas,{nod});raf=requestAnimationFrame(frame);return;
  }
  if(canvas.width!==960)ready();
  const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  for(let y=0;y<h;y+=2){
   const v=y/h,weight=1-smooth((v-.65)/.20);
   const dx=reduced.matches?0:w*(look*.006*weight+Math.sin(t*1.36-.8)*.0015*weight*(1-v));
   const dy=h*(breath*(.86-v)+nod*.012)*weight;
   ctx.drawImage(texture,0,y,w,Math.min(3,h-y),dx,y+dy,w,Math.min(3,h-y)*(1-breath*weight));
  }
  raf=requestAnimationFrame(frame);
 }
 function ready(){
  // Downsample once as an intact image before deforming, preserving soft linework.
  canvas.width=texture.width=960;canvas.height=texture.height=Math.round(960*image.naturalHeight/image.naturalWidth);
  const paint=texture.getContext('2d');paint.imageSmoothingQuality='high';paint.drawImage(image,0,0,texture.width,texture.height);
  if(open&&!raf)raf=requestAnimationFrame(frame);
 }
 image.addEventListener('load',ready);if(image.complete&&image.naturalWidth)ready();
 function setOpen(value){if(open===value)return;open=value;cancelAnimationFrame(raf);raf=0;
  nodStart=-Infinity;nod=0;
  if(open){start=performance.now();nextLook=start+5000;lookStart=-Infinity;if(canvas.width&&image.complete)raf=requestAnimationFrame(frame);}
 }
 document.addEventListener('visibilitychange',()=>{if(open&&!document.hidden&&!raf)raf=requestAnimationFrame(frame);});
 window.xyCompanion={setOpen,acknowledge(){if(open)nodStart=performance.now();},get state(){return{open,breath,nod,ready:!!image.naturalWidth,handWeight:0};}};
})();
