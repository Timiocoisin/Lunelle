'use strict';
const{test}=require('node:test'),assert=require('node:assert/strict'),{validateDirectory}=require('../installer-ui/validation.cjs');
test('installer accepts local app folders and rejects roots, system folders and malformed paths',()=>{
 assert.equal(validateDirectory('D:\\Apps\\Lunelle'),'D:\\Apps\\Lunelle');assert.equal(validateDirectory('D:\\我的应用\\Lunelle'),'D:\\我的应用\\Lunelle');
 for(const dir of ['D:\\','C:\\Windows\\System32','relative','\\\\server\\share','D:\\Apps\\"evil','D:\\Apps\\bad:stream'])assert.throws(()=>validateDirectory(dir));
});
