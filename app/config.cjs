'use strict';
const fs = require('node:fs');
const path = require('node:path');
const DEFAULTS = Object.freeze({ character: 'classic', scale: 1, opacity: 1, alwaysOnTop: true,
  activityEnabled: true, activityMode: 'roam', interactionVersion: 1, hoverEnabled: true, collapseMs: 320, refreshSeconds: 60, weatherEnabled: true,
  city: '中山', codexPath: '', x: null, y: null, petOffset: 0, positionVersion: 1 });
function normalize(input = {}) {
  const result = { ...DEFAULTS };
  for (const key of ['alwaysOnTop', 'hoverEnabled', 'weatherEnabled', 'activityEnabled'])
    if (typeof input[key] === 'boolean') result[key] = input[key];
  for (const [key, min, max] of [['scale', .65, 1.4], ['opacity', .4, 1],
    ['collapseMs', 100, 2000], ['refreshSeconds', 30, 600]]) {
    if (Number.isFinite(input[key])) result[key] = Math.max(min, Math.min(max, input[key]));
  }
  if(['classic','queen'].includes(input.character))result.character=input.character;
  if(['still','roam'].includes(input.activityMode))result.activityMode=input.activityMode;
  if (typeof input.city === 'string' && input.city.trim()) result.city = input.city.trim().slice(0, 60);
  if (typeof input.codexPath === 'string') result.codexPath = input.codexPath.trim().slice(0, 1000);
  for (const key of ['x', 'y']) if (Number.isFinite(input[key])) result[key] = Math.round(input[key]);
  if(Number.isFinite(input.petOffset))result.petOffset=Math.max(-1000,Math.min(1000,input.petOffset));
  if([2,3].includes(input.positionVersion))result.positionVersion=input.positionVersion;
  result.alwaysOnTop=true;
  return result;
}
function dimensions(scale, area) {
  const factor = Math.min(.88 * normalize({ scale }).scale, (area.width - 12) / 530, (area.height - 12) / 990);
  // Reference design dimensions determine sprite/panel scale only.
  // The native host covers the work area and is stationary during dragging.
  return { width: Math.round(1530 * factor), height: Math.round(990 * factor) };
}
class Preferences {
  constructor(directory) {
    this.file = path.join(directory, 'preferences.json');
    fs.mkdirSync(directory, { recursive: true });
    try { const saved=JSON.parse(fs.readFileSync(this.file, 'utf8'));this.value = normalize(saved.interactionVersion===1?saved:{...saved,activityEnabled:true,activityMode:'roam'}); }
    catch { this.value = normalize(); }
  }
  update(patch) {
    const next = normalize({ ...this.value, ...patch });
    const temporary = this.file + '.pending';
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2), { mode: 0o600 });
    fs.renameSync(temporary, this.file);
    this.value = next;
    return next;
  }
}
module.exports = { DEFAULTS, normalize, dimensions, Preferences };
