'use strict';
// Isolated native-window diagnostic. No pet/profile/account access.
const {app,BrowserWindow,screen}=require('electron');
const fs=require('node:fs'),path=require('node:path');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
app.whenReady().then(async()=>{
  const display=screen.getPrimaryDisplay(),a=display.workArea;
  const win=new BrowserWindow({x:a.x+50,y:a.y+30,width:350,height:650,show:false,
    frame:false,transparent:true,resizable:false,webPreferences:{sandbox:true,contextIsolation:true}});
  await win.loadURL('data:text/html,<html><body>native drag diagnostic</body></html>');
  const initial=win.getBounds(),samples=[];
  for(let i=0;i<12;i++){
    win.setPosition(initial.x+(i%2?30:80),initial.y+10);await delay(30);
    samples.push({method:'setPosition',bounds:win.getBounds(),content:win.getContentBounds()});
  }
  for(let i=0;i<12;i++){
    win.setBounds({...initial,x:initial.x+(i%2?30:80),y:initial.y+10});await delay(30);
    samples.push({method:'fixed-setBounds',bounds:win.getBounds(),content:win.getContentBounds()});
  }
  fs.mkdirSync(path.join(__dirname,'../artifacts'),{recursive:true});
  fs.writeFileSync(path.join(__dirname,'../artifacts/native-drag-probe.json'),JSON.stringify({display:{workArea:a,scaleFactor:display.scaleFactor},initial,samples},null,2));
  win.destroy();app.exit(0);
}).catch(()=>app.exit(1));
