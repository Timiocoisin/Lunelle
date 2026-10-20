'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {PetMotion}=require('../app/motion.cjs');
function rig(area={x:0,y:0,width:1920,height:1040},scale=.88){
 let bounds={...area},pointer={x:500,y:500},writes=0,saves=[],events=[];
 const window={getBounds:()=>({...bounds}),setBounds:b=>{writes++;bounds={...b};},setPosition:()=>assert.fail('native position changed during drag'),setIgnoreMouseEvents:()=>{}};
 const motion=new PetMotion({window,cursor:()=>pointer,display:()=>({workArea:area}),scale,autoTick:false,save:v=>saves.push(v),notify:v=>events.push(v)});
 motion.configure(scale,{x:400+area.x,y:300+area.y});
 return {motion,events,saves,area,scale,get writes(){return writes;},get bounds(){return bounds;},pointer:p=>{pointer=p;}};
}
test('screen halves and walking direction never mirror the character',()=>{
 const r=rig();for(const x of [0,900,1700,50]){r.motion.place({x,y:300});assert.equal(r.motion.facing,'right');}
 r.motion.setActivity('walk','left');assert.equal(r.motion.facing,'right');r.motion.setActivity('idle');assert.equal(r.motion.facing,'right');
});
test('downward and rightward moves are monotonic over repeated gestures',()=>{
 const r=rig();
 for(let pass=0;pass<3;pass++){
  r.pointer({x:500,y:500});r.motion.begin();const start={...r.motion.position};
  for(let i=3;i<=80;i++){r.pointer({x:500+i,y:500+i});r.motion.move();assert.equal(r.motion.position.x,start.x+i);assert.equal(r.motion.position.y,start.y+i);}
  r.motion.end();
 }
});
test('all four edges work at different DPI scales and negative screen origins',()=>{
 for(const a of [{x:0,y:0,width:2560,height:1392},{x:-1920,y:-300,width:1920,height:1040}])for(const scale of [.57,.88,1.23]){
  const r=rig(a,scale);r.motion.begin();
  for(const [px,py,ex,ey]of [[-10000,-10000,a.x,a.y],[10000,10000,a.x+a.width-240*scale,a.y+a.height-232*scale]]){
   r.pointer({x:px,y:py});r.motion.move();assert.equal(r.motion.position.x,ex);assert.equal(r.motion.position.y,ey);
   const e=r.events.at(-1);assert.ok(e.panelLeft*scale>=0);assert.ok((e.panelLeft+500)*scale<=a.width);assert.ok(e.panelTop*scale>=0);assert.ok((e.panelTop+730)*scale<=a.height);
  }
  r.motion.end();assert.equal(r.writes,1,'one host placement, never a write per move');
 }
});
test('unchanged cursor produces no repeated notifications; release keeps sprite in place',()=>{
 const r=rig();r.motion.begin();const count=r.events.length;
 for(let i=0;i<500;i++)r.motion.move();assert.equal(r.events.length,count);
 const p={...r.motion.position};r.motion.end(true);assert.deepEqual(r.motion.position,p);assert.equal(r.events.at(-1).togglePanel,true);assert.equal(r.saves.length,0,'click does not persist a temporary autonomous position');
});
test('500 move frames leave native window bounds fixed and facing does not flicker',()=>{
 const r=rig(),bounds={...r.bounds};r.motion.begin();const face=r.motion.facing;
 for(let i=0;i<500;i++){r.pointer({x:500+i*2,y:500+i});r.motion.move();assert.deepEqual(r.bounds,bounds);assert.equal(r.motion.facing,face);}
 r.motion.end(true);assert.equal(r.events.at(-1).togglePanel,false);assert.equal(r.motion.facing,'right');assert.equal(r.writes,1);
});
test('display switch changes host once, preserving cursor deltas',()=>{
 let pointer={x:500,y:500},bounds={x:0,y:0,width:1920,height:1040},writes=0;
 const a={...bounds},b={x:1920,y:0,width:1920,height:1040};
 const m=new PetMotion({window:{getBounds:()=>bounds,setBounds:v=>{bounds=v;writes++;},setIgnoreMouseEvents:()=>{}},cursor:()=>pointer,display:p=>({workArea:p.x>=1920?b:a}),autoTick:false});
 m.configure(.88,{x:400,y:300});m.begin();pointer={x:2400,y:600};m.move();assert.equal(m.position.x,2300);assert.equal(m.position.y,400);assert.equal(writes,2);m.move();assert.equal(writes,2);m.end();
});
