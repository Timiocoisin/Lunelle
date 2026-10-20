'use strict';
const PET_WINDOW_FLAGS=Object.freeze({focusable:false,alwaysOnTop:true,skipTaskbar:true});
const hooks=new WeakMap();let native;
function attachNonActivatingClick(window){
  if(process.platform!=='win32'||typeof window.getNativeWindowHandle!=='function'||hooks.has(window))return;
  if(!native){
    const koffi=require('koffi'),path=require('node:path');
    const library=koffi.load(path.join(process.env.SystemRoot||'C:/Windows','System32/comctl32.dll'));
    const proc=koffi.proto('intptr_t __stdcall XYNoActivateProc(void *hwnd, uint32_t msg, uintptr_t wParam, intptr_t lParam, uintptr_t id, uintptr_t data)');
    native={koffi,proc,
      set:library.func('int __stdcall SetWindowSubclass(void *hwnd, XYNoActivateProc *proc, uintptr_t id, uintptr_t data)'),
      remove:library.func('int __stdcall RemoveWindowSubclass(void *hwnd, XYNoActivateProc *proc, uintptr_t id)'),
      next:library.func('intptr_t __stdcall DefSubclassProc(void *hwnd, uint32_t msg, uintptr_t wParam, intptr_t lParam)')};
  }
  const n=native,id=0x58594e41,buffer=window.getNativeWindowHandle(),hwnd=buffer.length===8?buffer.readBigUInt64LE():BigInt(buffer.readUInt32LE());
  let callback,released=false;
  const release=()=>{if(released)return;released=true;hooks.delete(window);setImmediate(()=>n.koffi.unregister(callback));};
  callback=n.koffi.register((h,msg,w,l)=>{
    if(msg===0x21)return 3; // MA_NOACTIVATE: preserve foreground and deliver first click.
    if(msg===0x82){n.remove(h,callback,id);const result=n.next(h,msg,w,l);release();return result;}
    return n.next(h,msg,w,l);
  },n.koffi.pointer(n.proc));
  if(!n.set(hwnd,callback,id,0)){n.koffi.unregister(callback);throw new Error('Could not install non-activating pet input policy');}
  hooks.set(window,{hwnd,callback});window.once('closed',release);
}
function applyPetWindowPolicy(window){
  window.setFocusable(false);
  window.setAlwaysOnTop(true,'screen-saver');
  attachNonActivatingClick(window);
}
module.exports={PET_WINDOW_FLAGS,applyPetWindowPolicy};
