'use strict';
const { Worker } = require('node:worker_threads');
const path = require('node:path');
const os = require('node:os');
const { EventEmitter } = require('node:events');
const { readQuotas } = require('./quotas.cjs');
const { Weather } = require('./weather.cjs');
class Monitor extends EventEmitter {
  constructor(preferences) {
    super(); this.preferences = preferences; this.weather = new Weather(); this.pending = null;
    this.snapshot = { quota: null, usage: null, weather: null, issues: [], refreshing: false };
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
      this.worker.postMessage({ id, home: process.env.CODEX_HOME || path.join(os.homedir(), '.codex') });
    });
  }
  refresh() {
    if (this.pending) return this.pending;
    this.snapshot.refreshing = true; this.emit('change', this.snapshot);
    this.pending = this.collect().finally(() => { this.pending = null; });
    return this.pending;
  }
  async collect() {
    const settings = this.preferences.value;
    const tasks = [readQuotas(settings.codexPath), this.usage(), settings.weatherEnabled ? this.weather.read(settings.city) : Promise.resolve(null)];
    const results = await Promise.allSettled(tasks);
    this.snapshot.issues = [];
    for (const [i, key] of ['quota', 'usage', 'weather'].entries()) {
      const r = results[i];
      if (r.status === 'fulfilled') this.snapshot[key] = r.value;
      else {
        this.snapshot.issues.push({ source: key, message: r.reason.message });
        if (this.snapshot[key]) this.snapshot[key] = { ...this.snapshot[key], stale: true };
      }
    }
    this.snapshot.refreshing = false; this.emit('change', this.snapshot);
    return this.snapshot;
  }
  close() { for (const w of this.waiters.values()) { clearTimeout(w.timer); w.reject(new Error('关闭')); } this.waiters.clear(); this.worker.terminate(); }
}
module.exports = { Monitor };
