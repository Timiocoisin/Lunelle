'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const motion=require('../ui/queen-motion.js');
test('queen has eight design actions, with head-only gestures and fixed lower body',()=>{
 for(const action of ['breathe','blink','tilt','nod','wave','lift','land','companion']){
  const m=motion.sample(action,420);assert.ok(Object.values(m).every(x=>typeof x==='string'||Number.isFinite(x)));
 }
 for(const action of ['tilt','nod','wave']){
  const m=motion.sample(action,420);assert.deepEqual(motion.point(.5,.8,m),[.5,.8]);
  if(action!=='wave')assert.notDeepEqual(motion.point(.5,.2,m),[.5,.2]);
 }
 const wave=motion.sample('wave',420);assert.deepEqual(motion.point(.5,.18,wave),[.5,.18],'wave never bends crown');
 assert.notDeepEqual(motion.point(.32,.33,wave),[.32,.33]);
});
test('queen motion respects reduced motion and closes the measured walk loop',()=>{
 const m=motion.sample('wave',420,{reduced:true});assert.equal(m.arm,0);assert.equal(m.breath,0);
 assert.equal(motion.walk(0),0);assert.equal(motion.walk(720),36);assert.equal(motion.walk(1440),0);assert.equal(motion.walk(720,true),0);
 assert.equal(motion.advance(720,0,240),720);
 assert.equal(motion.advance(0,50,240),motion.advance(0,100,480));
});
test('all queen design textures and the real 72-frame walk are packaged assets',()=>{
 const root=path.join(__dirname,'../assets/characters/queen/v2'),manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.json')));
 assert.equal(Object.keys(manifest.poses).length,8);
 for(const file of [...Object.values(manifest.poses),manifest.walk.file,manifest.walk.poster])assert.ok(fs.statSync(path.join(root,file)).size>10000,file);
 assert.equal(manifest.walk.frames,motion.frames);assert.equal(manifest.walk.duration,motion.cycle);
});
