'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events'),{PassThrough}=require('node:stream');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
const {ReadOnlyRpc}=require('../app/quotas.cjs'),{Monitor}=require('../app/monitor.cjs');
test('stdio notifications work without pending requests and only rate limit events escape',async()=>{
 const child=new EventEmitter();child.stdout=new PassThrough();child.stdin=new PassThrough();child.kill=()=>{};
 const rpc=new ReadOnlyRpc('fake',100,()=>child),events=[];rpc.on('limits',v=>events.push(v));
 child.stdout.write('{"method":"thread/started","params":{"private":"ignored"}}\n');
 child.stdout.write('{"method":"account/rateLimits/updated","params":{"rateLimits":{"limitId":"codex"}}}\n');
 assert.deepEqual(events,[{rateLimits:{limitId:'codex'}}]);
 const pending=rpc.call('account/rateLimits/read');child.emit('exit');await assert.rejects(pending,/关闭/);assert.equal(rpc.pending.size,0);rpc.close();
});
test('watcher observes new nested session logs and ignores unrelated files',async()=>{
 const home=await fs.mkdtemp(path.join(os.tmpdir(),'lunelle-watch-'));const observed=[];
 const monitor={home,closed:false,changed:()=>observed.push(Date.now())};
 try{await fs.mkdir(path.join(home,'sessions'));Monitor.prototype.watch.call(monitor);assert.ok(monitor.watcher);
 await fs.writeFile(path.join(home,'other.txt'),'ignored');await new Promise(r=>setTimeout(r,100));assert.equal(observed.length,0);
 await fs.mkdir(path.join(home,'sessions','new'));await fs.writeFile(path.join(home,'sessions','new','turn.jsonl'),'{}\n');
 for(let i=0;i<30&&!observed.length;i++)await new Promise(r=>setTimeout(r,50));assert.ok(observed.length>0);
 }finally{monitor.watcher?.close();await fs.rm(home,{recursive:true,force:true});}
});
test('changes during a pending read are retained and dense changes share one timer',()=>{
 const monitor={closed:false,pending:Promise.resolve(),dirty:false,lastRefresh:Date.now()};
 Monitor.prototype.changed.call(monitor);assert.equal(monitor.dirty,true);assert.equal(monitor.changeTimer,undefined);
 monitor.pending=null;Monitor.prototype.changed.call(monitor);const timer=monitor.changeTimer;Monitor.prototype.changed.call(monitor);assert.equal(monitor.changeTimer,timer);clearTimeout(timer);
});
