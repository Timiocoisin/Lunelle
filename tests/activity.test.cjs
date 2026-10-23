'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {PetMotion}=require('../app/motion.cjs'),{PetActivity}=require('../app/activity.cjs'),{normalize}=require('../app/config.cjs');
function rig(){
 let t=0,cursor={x:-5000,y:-5000},bounds={x:0,y:0,width:1920,height:1040},saves=[];
 const m=new PetMotion({window:{getBounds:()=>bounds,setBounds:b=>bounds=b,setIgnoreMouseEvents:()=>{}},cursor:()=>cursor,display:()=>({workArea:{x:0,y:0,width:1920,height:1040}}),autoTick:false,save:p=>saves.push(p)});
 m.configure(.88,{x:400,y:300});const a=new PetActivity({motion:m,cursor:()=>cursor,now:()=>t,random:()=>.99});
 return {a,m,saves,time:n=>{t=n;},cursor:p=>{cursor=p;},start(){a.configure({activityEnabled:true,activityMode:'roam'});t=60000;a.tick();assert.ok(a.leg);}};
}
test('roaming is enabled by default and invalid settings are normalized',()=>{
 assert.equal(normalize().activityEnabled,true);assert.equal(normalize({activityMode:'bad'}).activityMode,'roam');
 const r=rig();r.time(100000);r.a.tick();assert.equal(r.a.leg,null);assert.deepEqual(r.m.position,{x:400,y:300});
});
test('roaming takes full 8–15 second strolls within the work area and never persists its temporary position',()=>{
 const r=rig();r.start();const target={...r.a.leg.target};assert.ok(target.x>400);assert.ok(target.y>300);assert.ok(r.a.leg.duration>=8000&&r.a.leg.duration<=15000);
 r.time(65000);r.a.tick();assert.ok(r.m.position.x>400);assert.ok(r.m.position.y>300);assert.equal(r.saves.length,0);
 r.time(150000);r.a.tick();assert.deepEqual(r.m.position,target);assert.equal(r.m.activity,'idle');assert.equal(r.saves.length,0);
 assert.ok(r.m.position.x+240*r.m.scale<=1920);assert.ok(r.m.position.y+232*r.m.scale<=1040);
});
test('panel opening stops travel immediately, keeps position stable and delays restart',()=>{
 const r=rig();r.start();r.time(61000);r.a.tick();const position={...r.m.position};r.a.setPanel(true);assert.equal(r.a.leg,null);assert.equal(r.m.activity,'idle');
 r.time(999999);r.a.tick();assert.deepEqual(r.m.position,position);r.a.setPanel(false);r.a.tick();assert.equal(r.a.leg,null);
});
test('dragging, hidden/settings suspension and disabling interrupt travel',()=>{
 for(const reason of ['drag','suspend','disable']){
  const r=rig();r.start();r.time(62000);r.a.tick();const position={...r.m.position};
  if(reason==='drag')r.m.begin();if(reason==='suspend')r.a.suspend(true);if(reason==='disable')r.a.configure({activityEnabled:false});
  r.a.tick();assert.equal(r.a.leg,null,reason);assert.deepEqual(r.m.position,position,reason);assert.equal(r.saves.length,0);
 }
});
test('in-place activity continues when the mouse approaches',()=>{
 const r=rig();r.a.configure({activityEnabled:true,activityMode:'still'});r.time(60000);r.a.tick();assert.equal(r.m.activity,'look');assert.deepEqual(r.m.position,{x:400,y:300});
 r.cursor({x:390,y:300});r.a.tick();assert.equal(r.m.activity,'look');assert.equal(r.saves.length,0);
});
test('manual drag after roaming saves user position, stationary click does not',()=>{
 const r=rig();r.start();r.time(62000);r.a.tick();r.a.interrupt();r.cursor({x:500,y:500});r.m.begin();r.m.end(true);assert.equal(r.saves.length,0);
 r.m.begin();r.cursor({x:550,y:560});r.m.move();r.m.end();assert.equal(r.saves.length,1);assert.deepEqual({x:r.saves[0].x,y:r.saves[0].y},r.m.position);
});

test('immediate trial starts after three seconds even with the cursor over the pet',()=>{
 const r=rig();r.a.configure({activityEnabled:true,activityMode:'roam'});r.a.requestWalk();
 r.a.setPanel(false);r.a.suspend(false);assert.equal(r.a.next,3000);
 r.cursor({x:400,y:300});r.time(2000);r.a.tick();assert.equal(r.a.next,3000);
 r.cursor({x:-5000,y:-5000});r.time(3001);r.a.tick();assert.ok(r.a.leg);
});
test('activity status explains disabled, in-place, settings and waiting states',()=>{
 const r=rig();assert.equal(r.a.snapshot().reason,'disabled');
 r.a.configure({activityEnabled:true,activityMode:'still'});assert.equal(r.a.snapshot().mode,'still');assert.equal(r.a.snapshot().reason,'waiting');
 r.a.suspend(true);assert.equal(r.a.snapshot().reason,'settings');r.a.suspend(false);r.a.setPanel(true);assert.equal(r.a.snapshot().reason,'panel');
 r.a.setPanel(false);r.cursor({x:400,y:300});assert.equal(r.a.snapshot().reason,'waiting');
});

test('roam travel matches the same relaxed step cadence at different pet scales',()=>{
 const gait=require('../ui/walk-timeline.js');
 for(const scale of [.65,.88,1.4]){const r=rig();r.m.configure(scale,{x:400,y:300});r.start();const leg=r.a.leg,distance=Math.hypot(leg.target.x-leg.start.x,leg.target.y-leg.start.y),speed=distance/(leg.duration/1000),period=gait.stride*232/gait.referenceSize*scale/speed;
  assert.ok(period>=1.08-1e-8&&period<=1.23+1e-8,'travel and the approved slow animation share one cadence');
 }
});

test('walking continues beneath the cursor until the pet is pressed',()=>{
 const r=rig();r.start();const leg=r.a.leg;r.cursor({...r.m.position});r.time(61000);r.a.tick();assert.equal(r.a.leg,leg);assert.ok(r.m.position.x>400);assert.equal(r.a.snapshot().reason,'walking');
 r.a.interrupt();r.m.begin();r.time(62000);r.a.tick();assert.equal(r.a.leg,null);assert.equal(r.m.activity,'idle');assert.equal(r.saves.length,0);
});


test('interaction hold prevents walking and starts a fresh seated rest afterward',()=>{
 const r=rig();r.a.configure({activityEnabled:true,activityMode:'roam'});r.a.hold(6000);
 r.time(5999);r.a.tick();assert.equal(r.a.leg,null);
 r.time(6000);r.a.tick();assert.equal(r.a.leg,null);assert.ok(r.a.next-6000>=15000&&r.a.next-6000<=25000);
 r.time(r.a.next);r.a.tick();assert.ok(r.a.leg);
 r.time(100000);r.a.tick();assert.equal(r.m.activity,'idle');assert.ok(r.a.next-100000>=15000&&r.a.next-100000<=25000);
});
