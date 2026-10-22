'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),timeline=require('../ui/walk-timeline.js'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test('v19 uses the approved slow cadence without interpolating new leg drawings',()=>{
 assert.equal(timeline.cycle,1080);assert.equal(timeline.frameMs,30);
 assert.deepEqual(timeline.sample(539),{index:17,phase:17/36});
 assert.deepEqual(timeline.sample(540),{index:18,phase:.5});
 assert.equal(timeline.sample(1080).index,36);assert.equal(timeline.sample(1080).phase,0);
 assert.deepEqual(timeline.sample(6480),timeline.sample(0));
 assert.deepEqual(timeline.sample(2999,true),{index:0,phase:0});
});
test('travel advances the same amount at every pet size and stops with position',()=>{
 for(const size of [151,232,325]){
  const distance=timeline.stride*size/timeline.referenceSize;
  assert.ok(Math.abs(timeline.advance(0,distance,size)-1080)<1e-8);
  assert.equal(timeline.advance(840,0,size),840);
 }
});
test('the packaged animation matches the approved v19 export and timing',()=>{
 const root=path.join(__dirname,'../assets/characters'),meta=JSON.parse(fs.readFileSync(path.join(root,'walk-v19.json'),'utf8')),webp=fs.readFileSync(path.join(root,'walk-v19.webp'));
 assert.equal(meta.version,19);assert.equal(meta.frames,timeline.frames);assert.equal(meta.durationMs,6480);assert.equal(meta.whiteCompositeMaxError,0);
 assert.equal(crypto.createHash('sha256').update(webp).digest('hex'),meta.sha256);
 assert.equal(webp.toString('ascii',0,4),'RIFF');let count=0,total=0;
 for(let offset=12;offset+8<=webp.length;){const size=webp.readUInt32LE(offset+4);if(webp.toString('ascii',offset,offset+4)==='ANMF'){count++;total+=webp.readUIntLE(offset+20,3);}offset+=8+size+(size&1);}
 assert.equal(count,216);assert.equal(total,6480);
});
