'use strict';
const{app,BrowserWindow}=require('electron'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),out=path.join(root,'artifacts/readme-editorial');
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{let win;try{
 win=new BrowserWindow({width:1080,height:1100,show:false,frame:false,webPreferences:{offscreen:true,backgroundThrottling:false}});
 win.webContents.session.webRequest.onBeforeRequest({urls:['http://*/*','https://*/*']},(_details,callback)=>callback({cancel:true}));
 await win.loadFile(path.join(out,'README-preview.html'));
 await win.webContents.executeJavaScript('Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode())])');
 const report=await win.webContents.executeJavaScript(`(()=>{const rect=n=>n.getBoundingClientRect();return{title:document.querySelector('h1')?.textContent,headings:[...document.querySelectorAll('h2')].map(n=>n.textContent),imageCount:document.images.length,imagesLoaded:[...document.images].every(i=>i.complete&&i.naturalWidth>0),horizontalOverflow:document.documentElement.scrollWidth>innerWidth,tablesFit:[...document.querySelectorAll('table')].every(n=>rect(n).right<=innerWidth+1),height:document.documentElement.scrollHeight};})()`);
 if(!report.imagesLoaded||report.horizontalOverflow||!report.tablesFit)throw Error(JSON.stringify(report));
 for(const[id,file]of [['','page-top.png'],['character','page-character.png'],['journal','page-journal.png'],['motion','page-motion.png']]){
  await win.webContents.executeJavaScript(id?`document.getElementById('${id}').scrollIntoView()`:'scrollTo(0,0)');
  await win.webContents.executeJavaScript('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');
  await new Promise(r=>setTimeout(r,100));
  await fs.writeFile(path.join(out,file),(await win.webContents.capturePage()).toPNG());
 }
 await fs.writeFile(path.join(out,'layout-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }catch(e){console.error(e);process.exitCode=1;}finally{win?.destroy();app.exit(process.exitCode||0);}});
