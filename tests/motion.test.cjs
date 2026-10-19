'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {facingFor,dragBounds,PetMotion}=require('../app/motion.cjs');
test('pet faces inward on left and right with center hysteresis',()=>{
  const area={x:0,y:0,width:1920,height:1040};
  assert.equal(facingFor({x:20,width:400},area),'right');
  assert.equal(facingFor({x:1500,width:400},area),'left');
  assert.equal(facingFor({x:760,width:400},area,'left'),'left');
});
test('500 drag updates never write the window size',()=>{
  const area={x:0,y:0,width:1920,height:1040};let bounds={x:600,y:100,width:400,height:800},pointer={x:750,y:850},moves=0;
  const window={getBounds:()=>({...bounds}),setIgnoreMouseEvents:()=>{},setBounds:()=>assert.fail('drag attempted resize'),setPosition:(x,y)=>{moves++;bounds={...bounds,x,y};}};
  const events=[];const motion=new PetMotion({window,cursor:()=>pointer,display:()=>({workArea:area}),notify:e=>events.push(e)});
  motion.begin();for(let i=0;i<500;i++){pointer={x:750+i,y:850};motion.move();assert.equal(bounds.width,400);assert.equal(bounds.height,800);}motion.end();
  assert.equal(moves,500);assert.equal(motion.active,false);assert.equal(events.at(-1).facing,'left');
});
test('pet reaches either screen edge, transparent margins may leave screen',()=>{
 const area={x:0,y:0,width:1920,height:1040},start={bounds:{x:100,y:20,width:1530,height:990},pointer:{x:200,y:900}};
 const left=dragBounds(start,{x:-9999,y:900},area),right=dragBounds(start,{x:9999,y:900},area);
 assert.equal(left.x+645,0);assert.equal(right.x+645+240,1920);
});
test('release at an edge never moves window or sprite, only panel avoids edge',()=>{
 const b={x:-645,y:0,width:1530,height:990},events=[],saves=[];
 const m=new PetMotion({window:{getBounds:()=>({...b}),setIgnoreMouseEvents:()=>{},setPosition:()=>assert.fail('release moved window')},cursor:()=>({x:0,y:0}),display:()=>({workArea:{x:0,y:0,width:1920,height:1040}}),notify:v=>events.push(v),save:v=>saves.push(v)});
 m.begin();m.end();assert.equal(b.x,-645);assert.equal(events.at(-1).panelShift,134);assert.equal(saves[0].x,0);assert.equal(saves[0].positionVersion,2);assert.ok(!('petOffset' in events.at(-1)));
});
test('drag position derives from initial snapshot, not previous update',()=>{
  const start={bounds:{x:10,y:20,width:400,height:800},pointer:{x:100,y:900}};
  assert.deepEqual(dragBounds(start,{x:120,y:900},{x:0,y:0,width:1920,height:1040}),{x:30,y:20,width:400,height:800});
});
test('stationary release toggles panel; drag and cancellation do not',()=>{
 let pointer={x:100,y:100};const events=[];
 const m=new PetMotion({window:{getBounds:()=>({x:0,y:0,width:1530,height:990}),setIgnoreMouseEvents:()=>{},setPosition:()=>{}},cursor:()=>pointer,display:()=>({workArea:{x:0,y:0,width:1920,height:1080}}),notify:v=>events.push(v)});
 m.begin();m.end(true);assert.equal(events.at(-1).togglePanel,true);
 m.begin();pointer={x:140,y:100};m.move();m.end(true);assert.equal(events.at(-1).togglePanel,false);
 m.begin();m.end(false);assert.equal(events.at(-1).togglePanel,false);
});
