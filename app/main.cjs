'use strict';
const { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage, dialog, globalShortcut, shell } = require('electron');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Preferences, dimensions } = require('./config.cjs');
const { Monitor } = require('./monitor.cjs');
const { PetMotion } = require('./motion.cjs');
const { OutsideClick, contains } = require('./outside-click.cjs');
const root = path.join(__dirname, '..');
const test = process.argv.includes('--ui-test'), preview = test || process.argv.includes('--preview');
app.setName('Xingyue');
app.setAppUserModelId('io.xingyue.desktop');
if (test) { app.disableHardwareAcceleration(); app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'xingyue-ui-'))); }
else {
  const profile = path.join(app.getPath('appData'), 'XingyueDesktop');
  fs.mkdirSync(profile, { recursive: true });
  app.setPath('userData', profile);
}
if (!app.requestSingleInstanceLock()) app.quit();
else {
  let pet, settingsWindow, tray, monitor, preferences, timer, motion, outsideClick, panelRects = [], pendingResize = false, quitting = false;
  const windowOptions = { webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false, offscreen: test } };
  const fixture = require('../tests/fixture.cjs');
  function state() { return { preferences: preferences.value, data: preview ? fixture() : monitor.snapshot, preview, version: app.getVersion(), facing: motion?.facing || 'right' }; }
  function broadcast() { for (const window of [pet, settingsWindow]) if (window && !window.isDestroyed()) window.webContents.send('xy:state', state()); }
  function secure(window) {
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
  }
  function resize() {
    if (motion?.active) { pendingResize = true; return; }
    const before=pet.getBounds(),oldScale=Math.min(before.width/1530,before.height/990);
    const anchor=before.x+645*oldScale;
    const area = screen.getDisplayNearestPoint({ x:Math.round(anchor+120*oldScale), y:before.y+before.height-30 }).workArea;
    const d = dimensions(preferences.value.scale, area);
    const old = pet.getBounds();
    const scale=Math.min(d.width/1530,d.height/990);
    pet.setBounds({ ...d, x: Math.round(Math.max(area.x,Math.min(area.x+area.width-240*scale,anchor))-645*scale),
      y: Math.round(Math.max(area.y, Math.min(area.y + area.height - d.height, old.y + old.height - d.height))) });
    pet.setOpacity(preferences.value.opacity); pet.setAlwaysOnTop(preferences.value.alwaysOnTop, 'floating');
    pendingResize = false;
    motion?.settle();
  }
  function schedule() {
    clearInterval(timer); if (!preview) timer = setInterval(() => monitor.refresh().catch(() => {}), preferences.value.refreshSeconds * 1000);
  }
  function openSettings() {
    if (settingsWindow && !settingsWindow.isDestroyed()) { if (settingsWindow.isMinimized()) settingsWindow.restore(); settingsWindow.show(); settingsWindow.moveTop(); settingsWindow.focus(); return; }
    settingsWindow = new BrowserWindow({ ...windowOptions, title: '星月 · 设置手册', width: 700, height: 820, minWidth: 540, minHeight: 600,
      show: false, autoHideMenuBar: true, backgroundColor: '#f0eef8', icon: path.join(root, 'assets/icon.png') });
    const target = settingsWindow; let shown = false;
    const reveal = () => { if (shown || target.isDestroyed()) return; shown = true; target.setAlwaysOnTop(preferences.value.alwaysOnTop, 'floating'); target.show(); target.moveTop(); target.focus(); };
    secure(target); target.once('ready-to-show', reveal);
    settingsWindow.on('closed', () => { settingsWindow = null; });
    target.loadFile(path.join(root, 'ui/settings.html')).then(reveal).catch(() => { if (!target.isDestroyed()) target.close(); });
  }
  function valid(event) { return [pet, settingsWindow].some(w => w && !w.isDestroyed() && event.sender.id === w.webContents.id); }
  app.whenReady().then(async () => {
    preferences = new Preferences(app.getPath('userData'));
    if (!preview) monitor = new Monitor(preferences);
    const area = screen.getPrimaryDisplay().workArea, size = dimensions(preferences.value.scale, area);
    pet = new BrowserWindow({ ...windowOptions, ...size, x: area.x + area.width - Math.round(size.width*1030/1530) - 16, y: area.y + area.height - size.height - 8,
      frame: false, transparent: true, resizable: false, maximizable: false, fullscreenable: false,
      show: false, skipTaskbar: true, hasShadow: false, title: '星月', icon: path.join(root, 'assets/icon.png') });
    secure(pet);
    pet.webContents.setZoomMode('disabled');
    pet.webContents.setZoomFactor(1);
    pet.webContents.setVisualZoomLevelLimits(1, 1).catch(() => {});
    motion = new PetMotion({window: pet, cursor: () => screen.getCursorScreenPoint(),
      display: point => screen.getDisplayNearestPoint({x: Math.round(point.x), y: Math.round(point.y)}),
      notify: value => { if (!pet.isDestroyed()) pet.webContents.send('xy:motion', value); },
      save: position => preferences.update(position)});
    if (preferences.value.x !== null && preferences.value.y !== null) {
      const target = screen.getDisplayNearestPoint({ x: preferences.value.x, y: preferences.value.y }).workArea;
      const s=Math.min(size.width/1530,size.height/990);
      const anchor=preferences.value.positionVersion===2?preferences.value.x:preferences.value.x+145*s+preferences.value.petOffset;
      pet.setPosition(Math.round(Math.max(target.x,Math.min(target.x+target.width-240*s,anchor))-645*s),
        Math.round(Math.max(target.y, Math.min(target.y + target.height - size.height, preferences.value.y))));
    }
    resize();
    {const b=pet.getBounds(),s=Math.min(b.width/1530,b.height/990);preferences.update({x:b.x+645*s,y:b.y,petOffset:0,positionVersion:2});}
    pet.on('close', event => { if (!quitting && !test) { event.preventDefault(); pet.hide(); } });
    pet.on('blur', () => { motion.end(); });
    outsideClick = new OutsideClick(() => {
      if (pet.isDestroyed() || !pet.isVisible() || motion.active) return;
      const cursor = screen.getCursorScreenPoint(), bounds = pet.getBounds();
      const local = { x: cursor.x - bounds.x, y: cursor.y - bounds.y };
      if (!panelRects.some(rect => contains(rect, local))) {
        pet.webContents.send('xy:dismiss'); outsideClick.stop();
      }
    });
    pet.on('hide', () => { outsideClick.stop(); pet.webContents.send('xy:dismiss'); });
    ipcMain.on('xy:panel', (event, data) => {
      if (event.sender.id !== pet.webContents.id || !data || typeof data.open !== 'boolean') return;
      if (!data.open) { panelRects = []; outsideClick.stop(); return; }
      if (!Array.isArray(data.rects) || data.rects.length !== 3 || !data.rects.every(r => r && ['x','y','width','height'].every(k => Number.isFinite(r[k])) && r.width >= 0 && r.height >= 0)) return;
      panelRects = data.rects;
      if (!test) outsideClick.start();
    });
    ipcMain.handle('xy:read', event => { if (!valid(event)) throw new Error('不受信任窗口'); return state(); });
    ipcMain.handle('xy:refresh', async event => { if (!valid(event)) throw new Error('不受信任窗口'); if (!preview) await monitor.refresh(); broadcast(); return state(); });
    ipcMain.handle('xy:configure', (event, patch) => {
      if (!valid(event) || event.sender.id !== settingsWindow?.webContents.id || !patch || Array.isArray(patch) || typeof patch !== 'object') throw new Error('无效设置请求');
      const allowed = ['scale', 'opacity', 'alwaysOnTop', 'hoverEnabled', 'collapseMs', 'refreshSeconds', 'weatherEnabled', 'city', 'codexPath'];
      const clean = Object.fromEntries(Object.entries(patch).filter(([key]) => allowed.includes(key)));
      const old = preferences.value; preferences.update(clean); resize(); schedule(); broadcast();
      if (!preview && (old.city !== preferences.value.city || old.weatherEnabled !== preferences.value.weatherEnabled || old.codexPath !== preferences.value.codexPath)) monitor.refresh().catch(() => {});
      return state();
    });
    ipcMain.handle('xy:choose-codex', async event => {
      if (!valid(event) || event.sender.id !== settingsWindow?.webContents.id) throw new Error('无效窗口');
      const result = await dialog.showOpenDialog(settingsWindow, { title: '选择 Codex 可执行文件', properties: ['openFile'], filters: [{ name: 'Codex', extensions: process.platform === 'win32' ? ['exe'] : ['*'] }] });
      return result.canceled ? null : result.filePaths[0];
    });
    ipcMain.on('xy:interactive', (event, active) => { if (valid(event) && event.sender.id === pet.webContents.id && typeof active === 'boolean') pet.setIgnoreMouseEvents(motion.active ? false : !active, { forward: true }); });
    ipcMain.on('xy:command', (event, name) => {
      if (!valid(event)) return;
      if (name === 'settings') openSettings();
      if (name === 'hide') pet.hide();
      if (name === 'close-settings') settingsWindow?.close();
      if (name === 'context') Menu.buildFromTemplate([{ label: '设置手册', click: openSettings }, { label: '收起桌宠', click: () => pet.hide() }, { type: 'separator' }, { label: '退出星月', click: () => { quitting = true; app.quit(); } }]).popup({ window: pet });
    });
    ipcMain.on('xy:drag', (event, data) => {
      if (!valid(event) || event.sender.id !== pet.webContents.id || !data) return;
      if (data.phase === 'start') motion.begin();
      if (data.phase === 'move') motion.move();
      if (data.phase === 'end') { motion.end(); }
      if (data.phase === 'release') { motion.end(true); }
    });
    if (monitor) monitor.on('change', broadcast);
    await pet.loadFile(path.join(root, 'ui/pet.html'));
    motion.updateFacing();
    if (test) { await require('../tests/ui-runner.cjs').run({ pet, openSettings, getSettings: () => settingsWindow, app, root }); return; }
    const icon = nativeImage.createFromPath(path.join(root, 'assets/icon.png'));
    tray = new Tray(icon.resize({ width: 20, height: 20 })); tray.setToolTip('星月 · 额度手账');
    tray.setContextMenu(Menu.buildFromTemplate([{ label: '显示星月', click: () => pet.showInactive() }, { label: '设置手册', click: openSettings },
      { label: '打开星月配置目录', click: () => shell.openPath(app.getPath('userData')) }, { type: 'separator' }, { label: '退出星月', click: () => { quitting = true; app.quit(); } }]));
    tray.on('click', () => pet.isVisible() ? pet.hide() : pet.showInactive());
    globalShortcut.register('CommandOrControl+Alt+X', () => pet.isVisible() ? pet.hide() : pet.showInactive());
    pet.showInactive(); schedule(); if (!preview) monitor.refresh().catch(() => {});
    screen.on('display-metrics-changed', resize);
  }).catch(() => { dialog.showErrorBox('星月启动失败', '请运行 npm test 检查安装，或查看项目 README。'); app.exit(1); });
  app.on('second-instance', () => { pet?.show(); });
  app.on('before-quit', () => { quitting = true; outsideClick?.stop(); clearInterval(timer); monitor?.close(); globalShortcut.unregisterAll(); tray?.destroy(); });
  app.on('window-all-closed', () => { if (test) app.quit(); });
}
