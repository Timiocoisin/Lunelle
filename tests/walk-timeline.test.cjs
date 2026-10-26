'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),timeline=require('../ui/walk-timeline.js'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test('both appearances use the same 72-frame queen gait clock',()=>{
 const queen=require('../ui/queen-motion.js');
 assert.equal(timeline.cycle,1440);assert.equal(timeline.frameMs,20);assert.equal(timeline.frames,72);
 assert.deepEqual(timeline.sample(719),{index:35,phase:35/72});
 assert.deepEqual(timeline.sample(720),{index:36,phase:.5});
 assert.deepEqual(timeline.sample(1440),timeline.sample(0));
 assert.deepEqual(timeline.sample(2999,true),{index:0,phase:0});
 for(const ms of [0,100,719,720,1439,1440,8640])assert.equal(queen.walk(ms),timeline.sample(ms).index);
 for(const size of [151,232,325])assert.equal(queen.advance(400,10,size),timeline.advance(400,10,size));
});
test('travel advances the same amount at every pet size and stops with position',()=>{
 for(const size of [151,232,325]){
  const distance=timeline.stride*size/timeline.referenceSize;
  assert.ok(Math.abs(timeline.advance(0,distance,size )-1440)<1e-8);
  assert.equal(timeline.advance(840,0,size),840);
 }
});
test('the classic animation retargets the queen gait with its own artwork',()=>{
 const root=path.join(__dirname,'../assets/characters/classic/shared-walk'),meta=JSON.parse(fs.readFileSync(path.join(root,'walk.json'),'utf8')),webp=fs.readFileSync(path.join(root,'walk.webp'));
 assert.ok(meta.version>=23);assert.equal(meta.frames,timeline.frames);assert.equal(meta.durationMs,1440);
 assert.equal(meta.view,'right-side-profile');assert.equal(meta.handSides.separateTextures,true);assert.equal(meta.handSides.near,'Right');assert.equal(meta.handSides.far,'Left');
 assert.ok(meta.handScaleRatioRange[1]<1.00001,'hand texture retains its proportions');
 assert.ok(meta.handDeterminantRange.Left[0]>0&&meta.handDeterminantRange.Right[0]>0,'side-view hands face forward without reversing the texture');
 assert.notEqual(meta.handTextureSha256.Left,meta.handTextureSha256.Right,'side-view left/right hands have separate artwork');
 assert.equal(crypto.createHash('sha256').update(webp).digest('hex'),meta.sha256);
 assert.equal(webp.toString('ascii',0,4),'RIFF');let count=0,total=0;
 for(let offset=12;offset+8<=webp.length;){const size=webp.readUInt32LE(offset+4);if(webp.toString('ascii',offset,offset+4)==='ANMF'){count++;total+=webp.readUIntLE(offset+20,3);}offset+=8+size+(size&1);}
 assert.equal(count,72);assert.equal(total,1440);
 const queen=fs.readFileSync(path.join(root,'../../queen/v2/walk.webp'));
 assert.notEqual(crypto.createHash('sha256').update(webp).digest('hex'),crypto.createHash('sha256').update(queen).digest('hex'),'appearances use different textures');
});
