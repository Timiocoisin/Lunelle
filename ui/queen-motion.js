'use strict';
((root,factory)=>{const api=factory(typeof module==='object'&&module.exports?require('./walk-timeline.js'):root.xyWalkTimeline);if(typeof module==='object'&&module.exports)module.exports=api;else root.xyQueenMotion=api;})(globalThis,timeline=>{
 const clamp=t=>Math.max(0,Math.min(1,t));
 const smooth=t=>{t=clamp(t);return t*t*(3-2*t);};
 const pulse=(t,duration)=>{const p=clamp(t/duration);return smooth(p/.3)*(1-smooth((p-.58)/.42));};
 const {cycle,frames,frameMs,stride}=timeline;
 function sample(action,ms,{reduced=false,panel=false,eyes=0}={}){
  const s=Math.max(0,ms)/1000;
  const pose=({wave:'wave',lift:'lift',land:'land',companion:'companion'})[action]||'idle';
  const value={pose,eyes,angle:0,nod:0,arm:0,breath:0,lift:0,impact:0};
  if(action==='blink')value.eyes=pulse(s,.34);
  if(action==='nod'){value.nod=pulse(s,1.05);value.eyes=value.nod;}
  if(action==='tilt'||action==='look')value.angle=6*pulse(s,1.45);
  if(reduced){value.eyes=action==='blink'||action==='nod'?1:0;return value;}
  if(!['walk','lift','land'].includes(action))value.breath=Math.sin(s*Math.PI*2/4.6)*.003*(panel?.6:action==='breathe'?1.35:1);
  if(action==='wave'){value.arm=Math.sin(s*14)*5*pulse(s,1.8);}
  if(action==='lift')value.lift=Math.sin(s*3)*.003;
  if(action==='land')value.impact=Math.exp(-s*6)*Math.sin(s*12)*.012;
  return value;
 }
 function walk(ms,reduced=false){return timeline.sample(ms,reduced).index;}
 function advance(ms,distance,size){return timeline.advance(ms,distance,size);}
 // Every vertex belongs to one continuous surface. Shoulder/neck connections
 // interpolate through the same mesh rather than overlapping cut-out pieces.
 function point(x,y,m){
  let px=x,py=y;
  const head=1-smooth((y-.28)/.19),r=m.angle*Math.PI/180,dx=x-.5,dy=y-.34;
  px+=head*(Math.cos(r)*dx-Math.sin(r)*dy+.5-x);
  py+=head*(Math.sin(r)*dx+Math.cos(r)*dy+.34-y+m.nod*.012);
  const torso=(1-smooth((y-.42)/.14))*smooth((y-.19)/.10);
  py-=m.breath*torso;px+=(x-.5)*m.breath*torso*.3;
  if(m.pose==='wave'){
   const weight=1-smooth(Math.hypot((x-.32)/.115,(y-.33)/.19));
   const a=m.arm*Math.PI/180,ax=x-.27,ay=y-.43;
   px+=weight*(Math.cos(a)*ax-Math.sin(a)*ay+.27-x);
   py+=weight*(Math.sin(a)*ax+Math.cos(a)*ay+.43-y);
  }
  py+=m.lift;if(m.impact)py=.95+(py-.95)*(1-m.impact);
  return[px,py];
 }
 return{sample,point,walk,advance,smooth,cycle,frames,frameMs,stride};
});
