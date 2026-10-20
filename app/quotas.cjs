'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { createInterface } = require('node:readline');

async function discover(explicit = '', env = process.env) {
  if (explicit) {
    if (!path.isAbsolute(explicit) || !/\.exe$/i.test(explicit) && process.platform === 'win32')
      throw new Error('请选择 Codex 可执行文件的绝对路径');
    await fs.access(explicit); return explicit;
  }
  const executable = process.platform === 'win32' ? 'codex.exe' : 'codex';
  for (const directory of (env.PATH || '').split(path.delimiter)) {
    const candidate = path.join(directory, executable);
    try { await fs.access(candidate); return candidate; } catch {}
  }
  const base = path.join(env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'OpenAI', 'Codex', 'bin');
  let dirs = [];
  try { dirs = await fs.readdir(base, { withFileTypes: true }); } catch {}
  const candidates = await Promise.all(dirs.filter(d => d.isDirectory()).map(async d => {
    const file = path.join(base, d.name, 'codex.exe');
    try { return { file, mtime: (await fs.stat(file)).mtimeMs }; } catch { return null; }
  }));
  const latest = candidates.filter(Boolean).sort((a, b) => b.mtime - a.mtime)[0];
  if (latest) return latest.file;
  throw new Error('未找到 Codex；请在设置中指定 codex.exe');
}

// This transport intentionally exposes no thread/turn/login/write methods.
class ReadOnlyRpc {
  constructor(binary, timeout = 15000) {
    this.pending = new Map(); this.next = 1; this.closed = false; this.timeout = timeout;
    this.child = spawn(binary, ['app-server', '--stdio'], { windowsHide: true, stdio: ['pipe', 'pipe', 'ignore'] });
    this.lines = createInterface({ input: this.child.stdout });
    this.lines.on('line', line => {
      if (line.length > 4 * 1024 * 1024) return;
      let message; try { message = JSON.parse(line); } catch { return; }
      const item = this.pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timer); this.pending.delete(message.id);
      if (message.error) item.reject(new Error('Codex 拒绝读取请求；请确认已登录'));
      else item.resolve(message.result);
    });
    this.child.once('error', () => this.fail('无法启动 Codex app-server'));
    this.child.once('exit', () => this.fail('Codex 读取连接已关闭'));
    this.child.stdin.on('error', () => this.fail('Codex 读取管道已关闭'));
  }
  fail(message) {
    this.closed = true;
    for (const item of this.pending.values()) { clearTimeout(item.timer); item.reject(new Error(message)); }
    this.pending.clear();
  }
  call(method, params = {}) {
    if (!['initialize', 'account/read', 'account/rateLimits/read'].includes(method))
      return Promise.reject(new Error('只读方法白名单拒绝此请求'));
    if (this.closed) return Promise.reject(new Error('读取连接不可用'));
    const id = this.next++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('Codex 读取超时，请刷新重试')); }, this.timeout);
      this.pending.set(id, { resolve, reject, timer });
      this.child.stdin.write(JSON.stringify({ id, method, params }) + '\n');
    });
  }
  async start() {
    await this.call('initialize', { clientInfo: { name: 'lunelle_desktop', title: 'Lunelle', version: '0.1.0' } });
    this.child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
  }
  close() { this.fail('读取完成'); this.lines.close(); this.child.kill(); }
}
function windows(result) {
  const map = result?.rateLimitsByLimitId;
  const bucket = map?.codex || (result?.rateLimits?.limitId === 'codex' ? result.rateLimits : null)
    || (!map || Object.keys(map).length === 0 ? result?.rateLimits : null);
  const values = bucket ? [bucket.primary, bucket.secondary].filter(Boolean) : [];
  const read = minutes => {
    const window = values.find(w => w.windowDurationMins === minutes);
    if (!window || !Number.isFinite(window.usedPercent)) return null;
    return { remaining: Math.max(0, Math.min(100, 100 - window.usedPercent)),
      resetsAt: Number.isFinite(window.resetsAt) ? window.resetsAt * 1000 : null };
  };
  return { fiveHour: read(300), weekly: read(10080) };
}
async function readQuotas(explicit) {
  const client = new ReadOnlyRpc(await discover(explicit));
  try {
    await client.start();
    const [account, limits] = await Promise.all([client.call('account/read', { refreshToken: false }), client.call('account/rateLimits/read')]);
    // Discard account identifiers, email, credentials and unrelated response fields.
    return { ...windows(limits), plan: account?.account?.planType || '未提供', at: Date.now(), status: 'live' };
  } finally { client.close(); }
}
module.exports = { discover, windows, ReadOnlyRpc, readQuotas };
