'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {QuotaStream}=require('../app/quota-stream.cjs');
const limits=used=>({rateLimits:{limitId:'codex',primary:{windowDurationMins:300,usedPercent:used,resetsAt:1800000000}}});
function harness(){const clients=[],updates=[];class Client extends EventEmitter{
  constructor(){super();this.closed=false;this.calls=[];clients.push(this);}
  async start(){this.started=true;}
  async call(method){this.calls.push(method);if(this.fail)throw Error('断线');return method==='account/read'?{account:{planType:'plus'}}:limits(20);}
  close(){this.closed=true;}
}return{clients,updates,stream:new QuotaStream(v=>updates.push(v),{locate:async p=>p||'codex',connect:()=>new Client()})};}
test('quota reads reuse one initialized connection; notifications publish immediately without a request',async()=>{
 const h=harness();await h.stream.read();await h.stream.read();assert.equal(h.clients.length,1);const c=h.clients[0],n=c.calls.length;
 c.emit('limits',limits(35));assert.equal(h.updates.at(-1).fiveHour.remaining,65);assert.equal(h.updates.at(-1).plan,'plus');assert.equal(c.calls.length,n);
 assert.ok(c.calls.every(m=>['account/read','account/rateLimits/read'].includes(m)));h.stream.close();
});
test('failed connection reconnects; replacing binary and closing detach stale updates',async()=>{
 const h=harness();await h.stream.read();h.clients[0].fail=true;await assert.rejects(h.stream.read());assert.equal(h.clients[0].closed,true);
 await h.stream.read();assert.equal(h.clients.length,2);const old=h.clients[1];await h.stream.read('other.exe');assert.equal(old.closed,true);
 const n=h.updates.length;old.emit('limits',limits(90));assert.equal(h.updates.length,n);h.stream.close();h.clients[2].emit('limits',limits(99));assert.equal(h.updates.length,n);
 await assert.rejects(h.stream.read());
});
