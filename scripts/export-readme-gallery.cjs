'use strict';
// Documentation captures use the production renderers and synthetic fixture data.
const {app,BrowserWindow,ipcMain}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/images/readme');
app.disableHardwareAcceleration();app.setPath('userData',path.join(os.tmpdir(),'lunelle-gallery-preview'));
app.whenReady().then(async()=>{const windows=[];try{
 await fs.mkdir(out,{recursive:true});
 const state={preview:true,version:require('../package.json').version,preferences:{character:'classic',scale:1,opacity:1,alwaysOnTop:true,weatherEnabled:true,city:'中山',activityEnabled:false},data:require('../tests/fixture.cjs')()};
 ipcMain.handle('xy:read',()=>state);ipcMain.handle('xy:refresh',()=>state);
 const create=async(file,width,height)=>{const w=new BrowserWindow({width,height,show:false,transparent:true,frame:false,webPreferences:{preload:path.join(root,'app/preload.cjs'),offscreen:true,backgroundThrottling:false,contextIsolation:true,sandbox:true}});windows.push(w);await w.loadFile(path.join(root,'ui',file));await w.webContents.executeJavaScript('Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode().catch(()=>{}))])');w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:3,mobile:false});return w;};
 const save=async(name,data)=>fs.writeFile(path.join(out,name),Buffer.from(data.split(',')[1],'base64'));
 const capture=async(w,name,clip)=>{await new Promise(r=>setTimeout(r,450));const shot=await w.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{...clip,scale:1}});await fs.writeFile(path.join(out,name),Buffer.from(shot.data,'base64'));};
 const pet=await create('pet.html',560,1100);
 await pet.webContents.executeJavaScript("Promise.all([xyPetPuppet.ready,xyPetWalk.ready]);");
 await pet.webContents.executeJavaScript("xyPetAnimation.cancel();layoutScale=1;document.getElementById('stage').style.cssText='left:0!important;top:0!important;transform:none!important';document.getAnimations().forEach(a=>a.pause())");
 const classic=[['breathe',{}],['blink',{eyes:1}],['tilt',{angle:-4}],['nod',{nod:1,eyes:1}],['wave',{pose:'wave',poseMix:1,arm:-9}],['lift',{pose:'lift',poseMix:1,leftLeg:-4,rightLeg:3}],['land',{pose:'landing',poseMix:1,landingMix:1,eyes:1}]];
 for(const [name,values]of classic){
  const data=await pet.webContents.executeJavaScript(`(()=>{xyPetAnimation.cancel();xyPetPuppet.setGesture('idle',${JSON.stringify(values)});return document.getElementById('pet-puppet').toDataURL('image/png');})()`);
  await save('classic-'+name+'.png',data);
 }
 await pet.webContents.executeJavaScript("xyPetSkin.set('queen');xyPetSkin.ready");
 // Pause the automatic RAF loop; renderAt selects reproducible animation phases.
 await pet.webContents.executeJavaScript("window.requestAnimationFrame=()=>0;xyPetAnimation.cancel()");
 for(const [name,ms]of [['breathe',1150],['blink',150],['tilt',600],['nod',400],['wave',650],['lift',400],['land',500],['companion',1150]]){
  await save('queen-'+name+'.png',await pet.webContents.executeJavaScript(`xyPetSkin.renderAt('${name}',${ms})`));
 }
 // Both complete companion panels, at the same size and with identical demo data.
 for(const skin of ['classic','queen']){
  await pet.webContents.executeJavaScript(`xyTest.visible(false);xyPetSkin.set('${skin}');xyPetAnimation.cancel();document.getElementById('journal').style.cssText='left:20px;top:310px';xyTest.visible(true);`);
  await pet.webContents.executeJavaScript("Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))");
  await pet.webContents.executeJavaScript(skin==='queen'?"xyPetSkin.renderCompanion(1150,document.getElementById('companion-canvas'))":"xyCompanion.setOpen(false);xyCompanion.setOpen(true)");
  // Explicitly render classic companion once because automatic RAF is paused.
  if(skin==='classic')await pet.webContents.executeJavaScript("(()=>{const c=document.getElementById('companion-canvas'),im=document.getElementById('portrait');c.width=960;c.height=Math.round(960*im.naturalHeight/im.naturalWidth);c.getContext('2d').drawImage(im,0,0,c.width,c.height)})()");
  await save(skin+'-companion.png',await pet.webContents.executeJavaScript("document.getElementById('companion-canvas').toDataURL('image/png')"));
  await capture(pet,'panel-'+skin+'.png',{x:0,y:0,width:540,height:1060});
 }
 const settings=await create('settings.html',700,1400);
 await settings.webContents.executeJavaScript("document.querySelector('.notebook').style.minHeight='0'");
 const height=await settings.webContents.executeJavaScript('Math.ceil(document.querySelector(".notebook").scrollHeight)+90');
 await settings.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:700,height,deviceScaleFactor:3,mobile:false});
 await settings.webContents.executeJavaScript('xyIllustrations.sketchAll()');
 await capture(settings,'settings-full.png',{x:0,y:0,width:700,height});
 // Raster badges avoid SVG restrictions in Markdown viewers; 3× pixels stay crisp.
 for(const name of ['version','platform','license']){
  const w=new BrowserWindow({width:300,height:60,show:false,webPreferences:{offscreen:true}});windows.push(w);
  await w.loadURL('data:text/html,'+encodeURIComponent(`<body style="margin:0"><img id="badge" src="${require('node:url').pathToFileURL(path.join(out,name+'.svg')).href}"></body>`));
  // A local file origin is needed for embedded file URLs.
  await w.loadFile(path.join(out,name+'.svg'));
  w.webContents.debugger.attach('1.3');await w.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:300,height:60,deviceScaleFactor:3,mobile:false});
  const size=await w.webContents.executeJavaScript("({width:document.documentElement.width.baseVal.value,height:document.documentElement.height.baseVal.value})");
  await capture(w,name+'.png',{x:0,y:0,...size});
 }
 console.log('Exported both appearances, 8 action categories, two complete panels, full settings, and PNG badges.');
}catch(e){console.error(e);process.exitCode=1;}finally{for(const w of windows)if(!w.isDestroyed())w.destroy();app.exit(process.exitCode||0);}});
