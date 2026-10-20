'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function run({pet,openSettings,getSettings,app,root,motion}){
  const out=process.env.XINGYUE_ARTIFACTS||path.join(root,'artifacts');await fs.mkdir(out,{recursive:true});let report={ok:false};const watchdog=setTimeout(()=>app.exit(1),90000);
  try{const js=s=>pet.webContents.executeJavaScript(s);await js('document.fonts.ready.then(()=>true)');await pause(300);assert.equal(await js('typeof require'),'undefined');assert.equal(await js("document.getElementById('journal').inert"),true);
    await js("xyTest.enter('test')");assert.equal(await js('xyTest.open'),false,'hover cannot open panel');await js("xyTest.visible(true);xyTest.leave('test')");await pause(400);assert.equal(await js('xyTest.open'),true,'leaving keeps clicked panel open');
    await js("xyTest.visible(false);xyTest.enter('pet');xyTest.leave('pet');xyTest.enter('panel');xyTest.leave('panel')");assert.equal(await js('xyTest.open'),false);
    const layouts=[];
    const a=motion.area;
    for(const scale of [.55,.75,.88])for(const [side,x,y]of [['top-left',a.x,a.y],['bottom-right',a.x+a.width,a.y+a.height],['middle',a.x+a.width/2,a.y+a.height/2]]){
      motion.configure(scale,{x,y});await pause(80);await js('xyTest.visible(true)');await pause(40);
      const layout=await js(`(()=>{const r=id=>document.getElementById(id).getBoundingClientRect(),p=r('pet'),c=r('journal');return{petVisible:p.left>=-1&&p.top>=-1&&p.right<=innerWidth+1&&p.bottom<=innerHeight+1,panelVisible:c.left>=-1&&c.top>=-1&&c.right<=innerWidth+1&&c.bottom<=innerHeight+1,valuesFit:[...document.querySelectorAll('.details b,.statistics b,.token-note')].every(n=>n.scrollWidth<=n.clientWidth+1)}})()`);
      layouts.push({scale,side,...layout});for(const[k,v]of Object.entries(layout))assert.equal(v,true,k+' '+JSON.stringify(layout));
    }
    await js('xyTest.visible(false)');
    const cursorSource=motion.cursor;let cursor={x:a.x+300,y:a.y+300};motion.cursor=()=>cursor;
    motion.configure(.75,{x:a.x+200,y:a.y+150});await pause(60);motion.begin();
    const fixedBounds=pet.getBounds();let last=null;
    for(let frame=1;frame<=60;frame++){
      cursor={x:a.x+300+frame*5,y:a.y+300+frame*4};motion.move();await pause(20);
      const rect=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()");
      assert.ok(Math.abs(rect.x-(200+frame*5))<1,'rendered x tracks cursor');assert.ok(Math.abs(rect.y-(150+frame*4))<1,'rendered y tracks cursor');
      if(last){assert.ok(rect.x>=last.x&&rect.y>=last.y,'rendered motion never reverses');assert.ok(Math.abs(rect.width-last.width)<.01);assert.ok(Math.abs(rect.height-last.height)<.01);}
      assert.deepEqual(pet.getBounds(),fixedBounds,'native host does not move or resize');last=rect;
    }
    motion.end();motion.cursor=cursorSource;
    const clickPoint=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
    for(const expected of [true,false]){pet.webContents.sendInputEvent({type:'mouseMove',...clickPoint});pet.webContents.sendInputEvent({type:'mouseDown',...clickPoint,button:'left',clickCount:1});pet.webContents.sendInputEvent({type:'mouseUp',...clickPoint,button:'left',clickCount:1});await pause(100);assert.equal(await js('xyTest.open'),expected,'one click toggles exactly once');}
    await js('xyTest.visible(true)');
    assert.equal(await js("document.querySelectorAll('#content-frame').length"),1,'one enclosing frame around information');
    pet.webContents.debugger.attach('1.3');await pet.webContents.debugger.sendCommand('DOM.enable');await pet.webContents.debugger.sendCommand('CSS.enable');const doc=await pet.webContents.debugger.sendCommand('DOM.getDocument'),audit=[];
    for(const[selector,expected]of[['h1','Marker'],['#quota-value','Marker'],['.circle-copy>span','Xiaolai'],['#used-label','Yozai'],['#model-value','975'],['#week-tokens','975']]){const node=await pet.webContents.debugger.sendCommand('DOM.querySelector',{nodeId:doc.root.nodeId,selector});const fonts=await pet.webContents.debugger.sendCommand('CSS.getPlatformFontsForNode',{nodeId:node.nodeId});audit.push({selector,expected,fonts:fonts.fonts});}
    pet.webContents.debugger.detach();await fs.writeFile(path.join(out,'font-audit.json'),JSON.stringify(audit,null,2));for(const row of audit){assert.ok(row.fonts.length,row.selector+' missing actual font');assert.ok(row.fonts.every(f=>f.isCustomFont),row.selector+' fell back to a system font');assert.ok(row.fonts.some(f=>(f.postScriptName+' '+f.familyName).toLowerCase().includes(row.expected.toLowerCase())),row.selector+' wrong actual face');}
    await fs.writeFile(path.join(out,'panel.png'),(await pet.webContents.capturePage()).toPNG());
    const settingsPoint=await js("(()=>{const r=document.getElementById('settings').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
    pet.webContents.sendInputEvent({type:'mouseMove',...settingsPoint});pet.webContents.sendInputEvent({type:'mouseDown',...settingsPoint,button:'left',clickCount:1});pet.webContents.sendInputEvent({type:'mouseUp',...settingsPoint,button:'left',clickCount:1});await pause(500);const settings=getSettings();assert.ok(settings,'one native mouse press opens settings');assert.ok(settings.isVisible(),'first press shows the window without a second activation');await settings.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
    await settings.webContents.executeJavaScript("document.getElementById('tab-data').click()");assert.equal(await settings.webContents.executeJavaScript("document.getElementById('page-data').hidden"),false);
    await settings.webContents.executeJavaScript("document.getElementById('city').value='珠海';document.getElementById('city-form').requestSubmit()");await pause(300);assert.equal(await settings.webContents.executeJavaScript("window.xingyue.read().then(v=>v.preferences.city)"),'珠海');
    await settings.webContents.executeJavaScript("document.getElementById('tab-look').click()");await pause(100);await fs.writeFile(path.join(out,'settings.png'),(await settings.webContents.capturePage()).toPNG());
    await js("xyTest.render({preferences:{hoverEnabled:true,collapseMs:320,refreshSeconds:60,weatherEnabled:false,city:'中山'},data:{quota:null,usage:null,weather:null,issues:[],refreshing:false},preview:true})");assert.equal(await js("document.getElementById('quota-value').textContent"),'—');assert.equal(await js("document.getElementById('sync-value').textContent"),'未连接');report={ok:true,layouts,checks:['sandbox isolation','clicked panel remains open','all four actual custom fonts','settings single click','settings tabs and persistence','missing data','no portrait overlap','60 rendered drag frames track cursor without native moves or direction reversal']};
  }catch(e){report={ok:false,error:e.message,stack:e.stack};}finally{await fs.writeFile(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));clearTimeout(watchdog);console.log(JSON.stringify(report));app.exit(report.ok?0:1);}
}
module.exports={run};
