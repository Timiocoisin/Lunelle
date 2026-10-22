'use strict';
const {app,BrowserWindow,ipcMain}=require('electron'),fs=require('fs/promises'),path=require('path');
const root=path.resolve(__dirname,'..');app.disableHardwareAcceleration();
app.whenReady().then(async()=>{let win;try{
 const state={preview:true,version:require('../package.json').version,preferences:{scale:1,opacity:1,alwaysOnTop:true,weatherEnabled:false,activityEnabled:false},data:require('../tests/fixture.cjs')()};
 ipcMain.handle('xy:read',()=>state);ipcMain.handle('xy:refresh',()=>state);
 win=new BrowserWindow({width:560,height:1000,show:false,transparent:true,frame:false,webPreferences:{offscreen:true,backgroundThrottling:false,preload:path.join(root,'app/preload.cjs')}});
 await win.loadFile(path.join(root,'ui/pet.html'));
 await win.webContents.executeJavaScript("Promise.all([document.fonts.ready,xyPetWalk.ready,...[...document.images].map(i=>i.decode())])");
 await win.webContents.executeJavaScript("layoutScale=1;document.getElementById('stage').style.cssText='transform:none!important;left:0!important;top:0!important';document.getElementById('pet').style.cssText='left:20px!important;top:20px!important;width:240px!important;height:232px!important';document.getElementById('journal').classList.remove('open');document.getElementById('pet-breathe').style.animation='none';xyPetAnimation.play('walk');xyPetWalk.pause();document.getElementById('pet-transition').style.visibility='hidden'");
 win.webContents.debugger.attach('1.3');await win.webContents.debugger.sendCommand('Emulation.setDeviceMetricsOverride',{width:560,height:1000,deviceScaleFactor:3,mobile:false});
 const dir=path.join(root,'artifacts/walk-study-v19/runtime-captures');await fs.mkdir(dir,{recursive:true});
 if(process.argv.includes('--benchmark')){
  const report=await win.webContents.executeJavaScript("(async()=>{const times=[];for(let i=0;i<90;i++){const start=performance.now();await xyPetWalk.render(i*30);times.push(performance.now()-start);}times.sort((a,b)=>a-b);return{frames:times.length,averageMs:times.reduce((a,b)=>a+b,0)/times.length,p95Ms:times[Math.floor(times.length*.95)]};})()");console.log(JSON.stringify(report));return;
 }
 for(let i=0;i<36;i++){
  await win.webContents.executeJavaScript(`xyPetWalk.pause();xyPetWalk.render(${i*30})`);
  await new Promise(r=>setTimeout(r,25));
  const shot=await win.webContents.debugger.sendCommand('Page.captureScreenshot',{format:'png',clip:{x:20,y:20,width:240,height:232,scale:1}}),png=Buffer.from(shot.data,'base64');
  await fs.writeFile(path.join(dir,String(i).padStart(2,'0')+'.png'),png);
  if(i===0||i===18)await fs.writeFile(path.join(root,'docs/images/walk-v19-phase-'+(i===0?'a':'b')+'.png'),png);
 }
 console.log('Exported 36 actual walk frames at 720 × 696.');
}catch(error){console.error(error);process.exitCode=1;}finally{win?.destroy();app.exit(process.exitCode||0);}});
