'use strict';
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline');

function boundaries(now = new Date()) {
  const today = new Date(now); today.setHours(0, 0, 0, 0);
  const week = new Date(today); week.setDate(week.getDate() - (week.getDay() + 6) % 7);
  return { today: +today, week: +week };
}
function unionDuration(intervals, from, to) {
  const clipped = intervals.map(([a, b]) => [Math.max(a, from), Math.min(b, to)])
    .filter(([a, b]) => b > a).sort((a, b) => a[0] - b[0]);
  let end = from, duration = 0;
  for (const [a, b] of clipped) { duration += Math.max(0, b - Math.max(a, end)); end = Math.max(end, b); }
  return Math.round(duration / 1000);
}
// JSONL is parsed in a worker. Conversation text is never returned or persisted.
async function parseFile(file) {
  const result = { session: path.basename(file), events: [], intervals: [], model: null, malformed: 0 };
  const turns = new Map(); let cumulative = null, task = null;
  const stream = fs.createReadStream(file, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  stream.on('error', () => lines.close());
  try {
    for await (const line of lines) {
      if (line.length > 16 * 1024 * 1024) { result.malformed++; continue; }
      // Only metadata/event records are decoded; message/tool payloads are skipped.
      if (!/"(?:session_meta|turn_context|event_msg)"/.test(line.slice(0, 600))) continue;
      let row; try { row = JSON.parse(line); } catch { result.malformed++; continue; }
      const time = Date.parse(row.timestamp), p = row.payload || {};
      if (row.type === 'session_meta' && typeof p.id === 'string') result.session = p.id;
      if (!Number.isFinite(time)) continue;
      if (row.type === 'turn_context' && typeof p.model === 'string') {
        result.model = { name: p.model.slice(0, 100), effort: p.effort || p.reasoning_effort || p.collaboration_mode?.settings?.reasoning_effort || null, at: time };
      }
      if (row.type !== 'event_msg') continue;
      if (p.type === 'task_started') { task = { id: p.turn_id || String(time), time }; turns.set(task.id, { tokens: 0, time }); }
      if (p.type === 'token_count') {
        const info = p.info, raw = info?.total_token_usage?.total_tokens;
        if (!Number.isFinite(raw) || raw < 0) continue;
        // Cumulative totals include cached input; do not add cached tokens again.
        // A rollback can occur around resets/compaction. Never count the entire
        // new cumulative value twice. Prefer the explicit last response count;
        // otherwise keep the lower-bound total and flag incomplete telemetry.
        const last = info?.last_token_usage?.total_tokens;
        const hasLast = Number.isFinite(last) && last >= 0;
        // A fork/resumed log can start with an inherited cumulative counter.
        // Count only the explicit last response at that first observation.
        const delta = cumulative === null ? hasLast ? Math.min(raw, last) : raw
          : raw >= cumulative ? raw - cumulative : hasLast ? last : 0;
        if (cumulative === null && !hasLast || cumulative !== null && raw < cumulative && !hasLast) result.malformed++;
        cumulative = raw;
        result.events.push({ time, tokens: delta, total: raw, key: time + ':' + raw });
        if (task) { const turn = turns.get(task.id); turn.tokens += delta; turn.time = time; }
      }
      if (p.type === 'task_complete' || p.type === 'turn_aborted') {
        const id = p.turn_id || task?.id, turn = turns.get(id);
        if (task && id === task.id && p.type === 'task_complete') result.intervals.push([task.time, time]);
        if (turn && p.type === 'task_complete') { turn.complete = true; turn.time = time; }
        if (id === task?.id) task = null;
      }
    }
  } finally { lines.close(); stream.destroy(); }
  result.lastTurn = [...turns.values()].filter(t => t.complete).sort((a, b) => b.time - a.time)[0] || null;
  return result;
}
async function enumerate(directory) {
  let entries; try { entries = await fsp.readdir(directory, { withFileTypes: true }); } catch { return []; }
  const files = [];
  for (const e of entries) {
    if (e.isSymbolicLink()) continue;
    const file = path.join(directory, e.name);
    if (e.isDirectory()) files.push(...await enumerate(file));
    else if (e.isFile() && e.name.endsWith('.jsonl')) files.push(file);
  }
  return files;
}
function summarize(records, now = Date.now(), partial = false) {
  const { today, week } = boundaries(new Date(now));
  let todayTokens = 0, weekTokens = 0, model = null, last = null;
  const seen = new Set(), intervals = [];
  for (const record of records) {
    partial ||= record.malformed > 0;
    if (record.model && (!model || record.model.at > model.at)) model = record.model;
    if (record.lastTurn && (!last || record.lastTurn.time > last.time)) last = record.lastTurn;
    intervals.push(...record.intervals);
    for (const e of record.events) {
      const key = record.session + ':' + e.key;
      if (seen.has(key) || e.time > now) continue;
      seen.add(key); if (e.time >= today) todayTokens += e.tokens;
      if (e.time >= week) weekTokens += e.tokens;
    }
  }
  return { todayTokens, weekTokens, lastTurnTokens: last?.tokens ?? null, model,
    runtimeSeconds: unionDuration(intervals, week, now), partial, files: records.length,
    scope: 'local-device-all-accounts', at: now };
}
class UsageIndex {
  constructor() { this.cache = new Map(); }
  async scan(home, now = Date.now()) {
    const files = [...await enumerate(path.join(home, 'sessions')), ...await enumerate(path.join(home, 'archived_sessions'))];
    let partial = false; const records = [];
    for (const file of files) {
      try {
        const stat = await fsp.stat(file), signature = `${stat.size}:${stat.mtimeMs}`;
        let entry = this.cache.get(file);
        if (entry?.signature !== signature) { entry = { signature, record: await parseFile(file) }; this.cache.set(file, entry); }
        records.push(entry.record);
      } catch { partial = true; }
    }
    const available = new Set(files);
    for (const file of this.cache.keys()) if (!available.has(file)) this.cache.delete(file);
    return summarize(records, now, partial);
  }
}
module.exports = { boundaries, unionDuration, parseFile, summarize, UsageIndex };
