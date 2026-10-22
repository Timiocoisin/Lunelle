'use strict';
const { Worker } = require('node:worker_threads');
const path = require('node:path');
const os = require('node:os');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const { QuotaStream } = require('./quota-stream.cjs');
const { Weather } = require('./weather.cjs');
class Monitor extends EventEmitter {
  constructor(preferences) {
    super(); this.preferences = preferences; this.weather = new Weather(); this.pending = null; this.closed=false;this.dirty=false;this.lastRefresh=0;this.home=process.env.CODEX_HOME||path.join(os.homedir(),'.codex');
    this.snapshot = { quota: null, usage: null, weather: null, issues: [], refreshing: false };
    this.quotaStream=new QuotaStream(value=>{if(this.closed)return;this.snapshot.quota=value;this.snapshot.issues=this.snapshot.issues.filter(i=>i.source!=='quota');this.emit('change',this.snapshot);});
    this.worker = new Worker(path.join(__dirname, 'usage-worker.cjs'));
    this.waiters = new Map(); this.sequence = 0;
    this.worker.on('message', m => { const w = this.waiters.get(m.id); if (!w) return;
      this.waiters.delete(m.id); clearTimeout(w.timer); m.error ? w.reject(new Error(m.error)) : w.resolve(m.result); });
    this.worker.on('error', () => { for (const w of this.waiters.values()) { clearTimeout(w.timer); w.reject(new Error('日志工作线程异常')); } this.waiters.clear(); });
  }
  usage() {
    return new Promise((resolve, reject) => {
      const id = ++this.sequence, timer = setTimeout(() => { this.waiters.delete(id); reject(new Error('日志扫描超时')); }, 120000);
      this.waiters.set(id, { resolve, reject, timer });
      this.worker.postMessage({ id, home: this.home });
    });
  }
  start() {
    this.watch();
    if(!this.fallback)this.fallback=setInterval(()=>{this.watch();this.refresh().catch(()=>{});},60000);
    this.fallback.unref();
  }
  watch() {
    if(this.closed||this.watcher)return;
    try{
      this.watcher=fs.watch(this.home,{recursive:true},(_event,file)=>{
        const name=String(file||'').replaceAll('\\','/');
        if(/^(sessions|archived_sessions)\/.*\.jsonl$/.test(name)||/^(auth\.json|config\.toml)$/.test(name))this.changed();
      });
      this.watcher.on('error',()=>{this.watcher?.close();this.watcher=null;});
    }catch{/* Missing directories are retried by the fallback timer. */}
  }
  changed(){
    if(this.closed)return;
    this.dirty=true;
    if(this.pending||this.changeTimer)return;
    this.changeTimer=setTimeout(()=>{this.changeTimer=null;this.refresh().catch(()=>{});},Math.max(350,4000-(Date.now()-this.lastRefresh)));
    this.changeTimer.unref();
  }
  refresh() {
    if(this.closed)return Promise.resolve(this.snapshot);
    if (this.pending) return this.pending;
    clearTimeout(this.changeTimer);this.changeTimer=null;this.dirty=false;this.lastRefresh=Date.now();
    this.snapshot.refreshing = true; this.emit('change', this.snapshot);
    this.pending = this.collect().finally(() => { this.pending = null;if(this.dirty&&!this.closed)this.changed(); });
    return this.pending;
  }
  async collect() {
    const settings = this.preferences.value;
    const tasks = [this.quotaStream.read(settings.codexPath), this.usage(), settings.weatherEnabled ? this.weather.read(settings.city) : Promise.resolve(null)];
    await Promise.all(tasks.map(async(task,i)=>{
      const key=['quota','usage','weather'][i];
      try{const value=await task;if(this.closed)return;this.snapshot[key]=value;this.snapshot.issues=this.snapshot.issues.filter(issue=>issue.source!==key);}
      catch(error){if(this.closed)return;this.snapshot.issues=this.snapshot.issues.filter(issue=>issue.source!==key);this.snapshot.issues.push({source:key,message:error.message});if(this.snapshot[key])this.snapshot[key]={...this.snapshot[key],stale:true};}
      if(!this.closed)this.emit('change',this.snapshot);
    }));
    if(this.closed)return this.snapshot;
    this.snapshot.refreshing = false; this.emit('change', this.snapshot);
    return this.snapshot;
  }
  close() { this.closed=true;clearInterval(this.fallback);clearTimeout(this.changeTimer);this.watcher?.close();this.quotaStream.close(); for (const w of this.waiters.values()) { clearTimeout(w.timer); w.reject(new Error('关闭')); } this.waiters.clear(); this.worker.terminate(); }
}
module.exports = { Monitor };
