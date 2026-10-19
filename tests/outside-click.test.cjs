'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { contains, OutsideClick } = require('../app/outside-click.cjs');
test('outside dismissal excludes panel and pet; supports negative desktop coordinates', () => {
  const rects = [{ x: -20, y: 5, width: 500, height: 700 }, { x: 100, y: 750, width: 240, height: 232 }];
  assert.equal(rects.some(r => contains(r, { x: 20, y: 50 })), true);
  assert.equal(rects.some(r => contains(r, { x: 150, y: 800 })), true);
  assert.equal(rects.some(r => contains(r, { x: 600, y: 800 })), false);
});
test('observer stop is idempotent', () => { const watcher = new OutsideClick(() => {}); watcher.stop(); watcher.stop(); });
