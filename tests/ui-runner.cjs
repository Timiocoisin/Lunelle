'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
async function run({pet,openSettings,getSettings,app,root,motion,activity}){
  const out=process.env.XINGYUE_ARTIFACTS||path.join(root,'artifacts');await fs.mkdir(out,{recursive:true});let report={ok:false};const watchdog=setTimeout(()=>app.exit(1),90000);
  try{const js=s=>pet.webContents.executeJavaScript(s);await js('document.fonts.ready.then(()=>true)');await pause(300);assert.equal(pet.isFocusable(),false,'pet never takes OS input focus');assert.equal(pet.isAlwaysOnTop(),true,'pet is permanently topmost');assert.equal(await js('typeof require'),'undefined');assert.equal(await js("document.getElementById('journal').inert"),true);
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
    // Native synthetic input must not derive drag distance from the user's hardware mouse.
    motion.cursor=()=>({x:a.x+clickPoint.x,y:a.y+clickPoint.y});
    for(const expected of [true,false]){pet.webContents.sendInputEvent({type:'mouseMove',...clickPoint});pet.webContents.sendInputEvent({type:'mouseDown',...clickPoint,button:'left',clickCount:1});pet.webContents.sendInputEvent({type:'mouseUp',...clickPoint,button:'left',clickCount:1});await pause(100);assert.equal(pet.isFocused(),false,'click never focuses pet');assert.equal(await js('xyTest.open'),expected,'one click toggles exactly once');}
    motion.cursor=cursorSource;
    await js('xyTest.visible(true)');
    assert.equal(await js('xyPetAnimation.state.ready'),true,'all required transparent pose assets loaded');
    assert.ok((await js('xyPetAnimation.state.pose')).endsWith('/idle-seated.png'),'idle uses approved seated breathing design');
    const hitbox=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()");
    for(const action of ['breathe','blink','tilt','nod','wave','drag','walk','companion']){
      await js('xyPetAnimation.preview('+JSON.stringify(action)+')');await pause(45);
      assert.equal(await js('xyPetAnimation.state.action'),action==='drag'?'lift':action,'preview '+action);
      const box=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()");assert.deepEqual(box,hitbox,'animation must not move hitbox: '+action);
    }
    await js("xyPetAnimation.preview('walk');window.gaitSourceChanges=0;window.gaitObserver=new MutationObserver(records=>{window.gaitSourceChanges+=records.filter(r=>r.attributeName==='src').length;});gaitObserver.observe(document.getElementById('pet-art'),{subtree:true,attributes:true,attributeFilter:['src']});");
    const gait=[];
    for(let frame=0;frame<12;frame++){
      await pause(80);
      const sample=await js("(()=>{const front=document.querySelector('.walk-leg-front'),back=document.querySelector('.walk-leg-back');const foot=(el,px)=>{const style=getComputedStyle(el),m=new DOMMatrix(style.transform),origin=style.transformOrigin.split(' ').map(parseFloat),w=el.clientWidth,h=el.clientHeight,pw=Math.min(w,h),x=(w-pw)/2+px/512*pw,y=490/512*pw;return origin[0]+m.a*(x-origin[0])+m.c*(y-origin[1])+m.e;};return{front:getComputedStyle(front).transform,back:getComputedStyle(back).transform,footOrder:foot(front,215)-foot(back,292),jointClip:getComputedStyle(front.querySelector('img')).clipPath,bodySrc:document.querySelector('.walk-body').src,mirror:getComputedStyle(document.getElementById('pet-facing')).transform,changes:window.gaitSourceChanges}})()");
      assert.notEqual(sample.front,sample.back,'legs have opposite phases');assert.equal(sample.changes,0,'walking never swaps image sources');gait.push(sample);
      if(frame<3){const box=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:Math.floor(r.x),y:Math.floor(r.y),width:Math.ceil(r.width),height:Math.ceil(r.height)}})()");await fs.writeFile(path.join(out,'continuous-gait-'+frame+'.png'),(await pet.webContents.capturePage(box)).toPNG());}
    }
    assert.ok(gait.some(g=>g.footOrder>3)&&gait.some(g=>g.footOrder<-3),'feet actually exchange front/back positions');assert.ok(gait.every(g=>g.jointClip==='none'),'complete leg artwork is never cut at the joint');
    assert.ok(new Set(gait.map(g=>g.front)).size>3,'front leg moves continuously');assert.ok(new Set(gait.map(g=>g.back)).size>3,'back leg moves continuously');assert.ok(gait.every(g=>g.bodySrc===gait[0].bodySrc),'body texture is unchanged');
    assert.ok(gait.every(g=>g.mirror==='matrix(1, 0, 0, 1, 0, 0)'||g.mirror==='none'),'no mirrored character');
    await js('gaitObserver.disconnect()');
    await js('xyPetAnimation.cancel();xyTest.visible(true)');await pause(40);
    assert.equal(await js('xyPetAnimation.state.action'),null,'opening panel cancels preview');
    assert.equal(await js("document.getElementById('pet').classList.contains('panel-mode')"),true);
    assert.equal(activity.panel,true,'host observes panel lock');
    const heldCursor=motion.cursor;let dragCursor={x:a.x+500,y:a.y+500};motion.cursor=()=>dragCursor;motion.begin();dragCursor={x:a.x+530,y:a.y+525};motion.move();await pause(70);
    assert.equal(await js('xyPetAnimation.state.action'),'lift','real drag uses lift pose');assert.ok((await js('xyPetAnimation.state.pose')).endsWith('motion-lift.png'));
    motion.end(true);await pause(60);assert.equal(await js('xyPetAnimation.state.action'),'land','release plays landing');assert.equal(await js('xyTest.open'),true,'drag does not toggle panel');motion.cursor=heldCursor;
    motion.setActivity('walk','right');await pause(40);
    assert.notEqual(await js('xyPetAnimation.state.action'),'walk','panel suppresses walking pose');motion.setActivity('idle');
    assert.equal(await js("document.querySelectorAll('#content-frame').length"),1,'one enclosing frame around information');
    pet.webContents.debugger.attach('1.3');await pet.webContents.debugger.sendCommand('DOM.enable');await pet.webContents.debugger.sendCommand('CSS.enable');const doc=await pet.webContents.debugger.sendCommand('DOM.getDocument'),audit=[];
    for(const[selector,expected]of[['h1','Marker'],['#quota-value','Marker'],['.circle-copy>span','Xiaolai'],['#used-label','Yozai'],['#model-value','975'],['#week-tokens','975']]){const node=await pet.webContents.debugger.sendCommand('DOM.querySelector',{nodeId:doc.root.nodeId,selector});const fonts=await pet.webContents.debugger.sendCommand('CSS.getPlatformFontsForNode',{nodeId:node.nodeId});audit.push({selector,expected,fonts:fonts.fonts});}
    pet.webContents.debugger.detach();await fs.writeFile(path.join(out,'font-audit.json'),JSON.stringify(audit,null,2));for(const row of audit){assert.ok(row.fonts.length,row.selector+' missing actual font');assert.ok(row.fonts.every(f=>f.isCustomFont),row.selector+' fell back to a system font');assert.ok(row.fonts.some(f=>(f.postScriptName+' '+f.familyName).toLowerCase().includes(row.expected.toLowerCase())),row.selector+' wrong actual face');}
    await fs.writeFile(path.join(out,'panel.png'),(await pet.webContents.capturePage()).toPNG());
    const settingsPoint=await js("(()=>{const r=document.getElementById('settings').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
    pet.webContents.sendInputEvent({type:'mouseMove',...settingsPoint});pet.webContents.sendInputEvent({type:'mouseDown',...settingsPoint,button:'left',clickCount:1});pet.webContents.sendInputEvent({type:'mouseUp',...settingsPoint,button:'left',clickCount:1});await pause(500);const settings=getSettings();assert.ok(settings,'one native mouse press opens settings');assert.ok(settings.isVisible(),'first press shows the window without a second activation');await settings.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
    await settings.webContents.executeJavaScript("document.getElementById('tab-behavior').click()");
    assert.equal(await settings.webContents.executeJavaScript("document.getElementById('activityEnabled').checked"),false,'auto activity off by default');
    await settings.webContents.executeJavaScript("document.getElementById('activityEnabled').click();document.getElementById('activityMode').value='roam';document.getElementById('activityMode').dispatchEvent(new Event('change'))");await pause(150);
    assert.equal((await settings.webContents.executeJavaScript('window.xingyue.read()')).preferences.activityMode,'roam');
    assert.equal(activity.enabled,true);assert.equal(activity.suspended,true,'settings pause autonomous movement');
    await settings.webContents.executeJavaScript("document.querySelector('[data-motion=wave]').click()");await pause(80);assert.equal(await js('xyPetAnimation.state.action'),'wave','settings preview reaches pet');
    await settings.webContents.executeJavaScript("document.getElementById('activityEnabled').click()");await pause(100);
    await settings.webContents.executeJavaScript("document.getElementById('tab-data').click()");assert.equal(await settings.webContents.executeJavaScript("document.getElementById('page-data').hidden"),false);
    await settings.webContents.executeJavaScript("document.getElementById('city').value='珠海';document.getElementById('city-form').requestSubmit()");await pause(300);assert.equal(await settings.webContents.executeJavaScript("window.xingyue.read().then(v=>v.preferences.city)"),'珠海');
    await settings.webContents.executeJavaScript("document.getElementById('tab-look').click()");await pause(100);await fs.writeFile(path.join(out,'settings.png'),(await settings.webContents.capturePage()).toPNG());
    await settings.webContents.executeJavaScript("document.getElementById('tab-behavior').click()");
    await pause(100);await fs.writeFile(path.join(out,'behavior-settings.png'),(await settings.webContents.capturePage()).toPNG());
    assert.ok(await settings.webContents.executeJavaScript("document.getElementById('activity-status').textContent.length>0"),'activity explanation visible');
    await settings.webContents.executeJavaScript("document.getElementById('walk-now').click()");await pause(150);
    assert.equal(getSettings(),null,'trial closes settings');assert.equal(activity.enabled,true);assert.equal(activity.mode,'roam');assert.equal(activity.panel,false);assert.equal(activity.suspended,false);assert.ok(activity.next-Date.now()<=3100,'trial schedules quickly');
    await js("xyTest.render({preferences:{hoverEnabled:true,collapseMs:320,refreshSeconds:60,weatherEnabled:false,city:'中山'},data:{quota:null,usage:null,weather:null,issues:[],refreshing:false},preview:true})");assert.equal(await js("document.getElementById('quota-value').textContent"),'—');assert.equal(await js("document.getElementById('sync-value').textContent"),'未连接');report={ok:true,layouts,checks:['sandbox isolation','clicked panel remains open','all four actual custom fonts','settings single click','settings tabs and persistence','missing data','no portrait overlap','eight actions with fixed hitbox','complete overlapping legs with true alternating foot positions','non-activating permanently topmost pet','panel cancels autonomous walking','activity settings and preview','60 rendered drag frames track cursor without native moves or direction reversal']};
  }catch(e){report={ok:false,error:e.message,stack:e.stack};}finally{await fs.writeFile(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));clearTimeout(watchdog);console.log(JSON.stringify(report));app.exit(report.ok?0:1);}
}
module.exports={run};
