'use strict';
const { parentPort } = require('node:worker_threads');
const { UsageIndex } = require('./usage.cjs');
const index = new UsageIndex();
parentPort.on('message', async ({ id, home }) => {
  try { parentPort.postMessage({ id, result: await index.scan(home) }); }
  catch { parentPort.postMessage({ id, error: '本机日志读取失败' }); }
});
