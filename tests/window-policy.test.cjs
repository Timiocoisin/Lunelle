'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict');
const{PET_WINDOW_FLAGS,applyPetWindowPolicy}=require('../app/window-policy.cjs');
const{normalize}=require('../app/config.cjs');
test('pet is non-activating and permanently topmost even with old disabled preferences',()=>{
 assert.equal(PET_WINDOW_FLAGS.focusable,false);assert.equal(PET_WINDOW_FLAGS.alwaysOnTop,true);assert.equal(normalize({alwaysOnTop:false}).alwaysOnTop,true);
 const calls=[];applyPetWindowPolicy({setFocusable:v=>calls.push(['focusable',v]),setAlwaysOnTop:(v,level)=>calls.push(['topmost',v,level]),focus:()=>assert.fail('policy must not acquire focus')});
 assert.deepEqual(calls,[['focusable',false],['topmost',true,'screen-saver']]);
});
