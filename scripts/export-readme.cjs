'use strict';
// Export the real UI with synthetic data at 3× device resolution; no account access.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/images');
app.disableHardwareAcceleration();
app.setPath('userData',path.join(os.tmpdir(),'lunelle-readme-preview'));
app.whenReady().then(async()=>{
 const windows=[];try{
  await fs.mkdir(out,{recursive:true});
  const state={preview:true,version:require('../package.json').version,preferences:{scale:1,opacity:1,alwaysOnTop:true,weatherEnabled:true,city:'中山',refreshSeconds:60,codexPath:'',activityEnabled:false,activityMode:'still'},data:require('../tests/fixture.cjs')(),activity:{reason:'disabled',remaining:0}};
  ipcMain.handle('xy:read',()=>state);ipcMain.handle('xy:refresh',()=>state);
  const create=async(file,width,height)=>{const w=new BrowserWindow({width,height,show:false,frame:false,transparent:true,webPreferences:{preload:path.join(root,'app/preload.cjs'),contextIsolation:true,sandbox:true,offscreen:true,backgroundThrottling:false}});windows.push(w);await w.loadFile(path.join(root,'ui',file));await w.webContents.executeJavaScript('document.fonts.ready.then(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))))');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:false});return w;};
  const capture=async(w,name,clip)=>{await new Promise(r=>setTimeout(r,120));const shot=await w.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,fromSurface:true,...(clip?{clip:{...clip,scale:1}}:{})});await fs.writeFile(path.join(out,name),Buffer.from(shot.data,'base64'));};
  const pet=await create('pet.html',560,1000);await pet.webContents.executeJavaScript('xyPetPuppet.ready');
  await pet.webContents.executeJavaScript("layoutScale=1;document.getElementById('stage').style.cssText='left:0!important;top:0!important;transform:scale(1)!important';document.getElementById('journal').style.cssText='left:20px;top:10px';document.getElementById('pet').style.cssText='left:160px;top:750px';xyTest.visible(true);document.getAnimations().forEach(a=>a.pause())");
  await capture(pet,'quota-panel-restored-hd.png',{x:0,y:0,width:540,height:990});
  await pet.webContents.executeJavaScript("document.getElementById('notice').textContent='Codex 读取超时，请刷新重试';document.getElementById('notice').hidden=false");
  await capture(pet,'quota-status-hd.png',{x:0,y:0,width:540,height:750});
  await pet.webContents.executeJavaScript("document.getElementById('notice').hidden=true");
  await pet.webContents.executeJavaScript("xyTest.visible(false);document.getElementById('pet').style.cssText='left:20px;top:20px';xyPetAnimation.cancel();document.getAnimations().forEach(a=>a.pause())");
  await capture(pet,'blink-open-hd.png',{x:20,y:20,width:240,height:232});
  for(const[name,time]of [['half-close',65],['closed',155],['half-open',265]]){
   await pet.webContents.executeJavaScript(`(()=>{xyPetAnimation.cancel();const original=window.requestAnimationFrame;let pending;window.requestAnimationFrame=callback=>(pending=callback,0);const start=performance.now();xyPetAnimation.play('blink');pending(start+${time});window.requestAnimationFrame=original;})()`);
   await capture(pet,'blink-'+name+'-hd.png',{x:20,y:20,width:240,height:232});
  }
  for(const action of ['tilt','nod']){
   await pet.webContents.executeJavaScript(`xyPetAnimation.cancel();document.getElementById('pet').dataset.action='${action}';xyPetPuppet.setMotion(${action==='tilt'?-4:.7},${action==='nod'?1:0});xyPetPuppet.setEyes(${action==='nod'?1:0});`);
   await capture(pet,action+'-head-hd.png',{x:20,y:20,width:240,height:232});
  }
  for(const[name,pose,values]of [['wave-arm-a','wave',{poseMix:1,arm:-9,eyes:0}],['wave-arm-b','wave',{poseMix:1,arm:9,eyes:1}],['drag-suspended-design','lift',{poseMix:1,leftLeg:-4,rightLeg:3,hair:.5,eyes:0}],['landing-seated-design','landing',{poseMix:1,landingMix:1,impact:0,eyes:1}]]){
   await pet.webContents.executeJavaScript(`xyPetAnimation.cancel();document.getElementById('pet').dataset.action='${name.startsWith('drag-suspended')?'lift':name.startsWith('landing-')?'land':'wave'}';xyPetPuppet.setGesture('${pose}',${JSON.stringify(values)});`);
   await capture(pet,name+'-hd.png',{x:20,y:20,width:240,height:232});
  }
  const settings=await create('settings.html',700,1400);await settings.webContents.executeJavaScript("document.querySelector('.notebook').style.minHeight='0'");
  const appearanceHeight=await settings.webContents.executeJavaScript('Math.ceil(document.querySelector(".notebook").scrollHeight)+90');await settings.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:700,height:appearanceHeight,deviceScaleFactor:3,mobile:false});await settings.webContents.executeJavaScript('xyIllustrations.sketchAll()');await capture(settings,'appearance-settings-restored-hd.png',{x:0,y:0,width:700,height:appearanceHeight});
  await settings.webContents.executeJavaScript("document.getElementById('tab-behavior').click();document.querySelector('.motion-previews').open=true");
  const behaviorHeight=await settings.webContents.executeJavaScript('Math.ceil(document.querySelector(".notebook").scrollHeight)+90');await settings.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:700,height:behaviorHeight,deviceScaleFactor:3,mobile:false});await settings.webContents.executeJavaScript('xyIllustrations.sketchAll()');await capture(settings,'behavior-settings-restored-hd.png',{x:0,y:0,width:700,height:behaviorHeight});
  console.log('Exported UI and head-action PNGs at 3× device resolution using real UI and demo data.');
 }catch(error){console.error(error);process.exitCode=1;}finally{for(const w of windows)if(!w.isDestroyed())w.destroy();app.exit(process.exitCode||0);}
});
