'use strict';
const{contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('installer',Object.freeze({
 read:()=>ipcRenderer.invoke('setup:read'),browse:()=>ipcRenderer.invoke('setup:browse'),
 install:choices=>ipcRenderer.invoke('setup:install',choices),finish:launch=>ipcRenderer.invoke('setup:finish',launch),
 close:()=>ipcRenderer.invoke('setup:close'),minimize:()=>ipcRenderer.send('setup:minimize'),shape:rects=>ipcRenderer.send('setup:shape',rects),
 onStatus:fn=>{const callback=(_e,s)=>fn(s);ipcRenderer.on('setup:status',callback);return()=>ipcRenderer.removeListener('setup:status',callback);}
}));
