'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('xingyue', Object.freeze({
  read: () => ipcRenderer.invoke('xy:read'),
  refresh: () => ipcRenderer.invoke('xy:refresh'),
  configure: patch => ipcRenderer.invoke('xy:configure', patch),
  chooseCodex: () => ipcRenderer.invoke('xy:choose-codex'),
  command: name => ipcRenderer.send('xy:command', name),
  drag: phase => ipcRenderer.send('xy:drag', { phase }),
  panel: value => ipcRenderer.send('xy:panel', value),
  onDismiss: listener => { const callback = () => listener(); ipcRenderer.on('xy:dismiss', callback); return () => ipcRenderer.removeListener('xy:dismiss', callback); },
  onMotion: listener => {
    const callback = (_event, value) => listener(value);
    ipcRenderer.on('xy:motion', callback);
    return () => ipcRenderer.removeListener('xy:motion', callback);
  },
  interactive: active => ipcRenderer.send('xy:interactive', active),
  subscribe: listener => {
    const callback = (_event, state) => listener(state);
    ipcRenderer.on('xy:state', callback);
    return () => ipcRenderer.removeListener('xy:state', callback);
  }
}));
