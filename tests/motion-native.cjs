'use strict';
const {app,BrowserWindow,screen}=require('electron');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {PetMotion}=require('../app/motion.cjs');
app.setPath('userData',fs.mkdtempSync(path.join(os.tmpdir(),'xingyue-motion-')));
app.whenReady().then(async()=>{
  const area=screen.getPrimaryDisplay().workArea;
  const win=new BrowserWindow({x:area.x+20,y:area.y+10,width:300,height:560,show:false,frame:false,transparent:true,resizable:false,webPreferences:{sandbox:true,contextIsolation:true}});
  await win.loadURL('data:text/html,<body>isolated motion test</body>');
  const initial=win.getBounds(),content=win.getContentBounds(),events=[];let cursor={x:initial.x+150,y:initial.y+500};
  const motion=new PetMotion({window:win,cursor:()=>cursor,display:()=>({workArea:area}),notify:e=>events.push(e),autoTick:false});motion.configure(.88,{x:area.x+20,y:area.y+10});const fixed=win.getBounds(),fixedContent=win.getContentBounds();motion.begin();
  for(let i=0;i<120;i++){cursor={x:area.x+150+(i%2?area.width-320:20),y:area.y+510};motion.move();const b=win.getBounds(),c=win.getContentBounds();assert.equal(b.width,fixed.width);assert.equal(b.height,fixed.height);assert.equal(c.width,fixedContent.width);assert.equal(c.height,fixedContent.height);}
  motion.end();assert.ok(events.some(e=>e.petLeft>1000));assert.ok(events.some(e=>e.petLeft<100));
  fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../artifacts/motion-native.json'),JSON.stringify({ok:true,moves:120,initial,content,fixedNativeBounds:true,final:win.getBounds()},null,2));win.destroy();app.exit(0);
}).catch(e=>{console.error(e.message);app.exit(1);});
