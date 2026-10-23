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
    await js("document.getElementById('notice').hidden=false;document.getElementById('notice').textContent='Codex 读取超时，请刷新重试'");
    assert.equal(await js("(()=>{const n=document.getElementById('notice').getBoundingClientRect(),a=document.querySelector('.actions').getBoundingClientRect();return n.bottom<=a.top&&n.height>0})()"),true,'timeout status never overlaps action buttons');
    await js("document.getElementById('notice').hidden=true");
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
    await js("xyPetAnimation.play('blink')");assert.ok((await js('xyPetAnimation.state.pose')).endsWith('/idle-seated.png'),'blink keeps the idle body source');assert.equal(await js("document.getElementById('pet').classList.contains('blinking')"),true);assert.equal(await js("getComputedStyle(document.getElementById('pet-image')).animationName"),'none','idle never rotates sideways');await js('xyPetAnimation.cancel()');
    await js("xyPetAnimation.play('blink')");const eyelidSamples=[];
    for(let step=0;step<10;step++){await pause(30);const frame=await js("({progress:xyPetAnimation.state.blinkProgress,src:document.getElementById('pet-image').src,hitbox:document.getElementById('pet').getBoundingClientRect().toJSON()})");eyelidSamples.push(frame);assert.ok(frame.src.endsWith('/idle-seated.png'));}
    assert.ok(eyelidSamples.some(f=>f.progress>.2&&f.progress<.8),'eyelids pass through half-closed');assert.ok(eyelidSamples.some(f=>f.progress>.99),'eyes hold fully closed');const peak=eyelidSamples.findIndex(f=>f.progress>.99);assert.ok(eyelidSamples.slice(peak+1).some(f=>f.progress>.1&&f.progress<.9),'eyelids pass through half-open');assert.ok(eyelidSamples.every(f=>JSON.stringify(f.hitbox)===JSON.stringify(eyelidSamples[0].hitbox)),'blink hitbox stays fixed');await js('xyPetAnimation.cancel()');
    const hitbox=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()");
    for(const action of ['breathe','blink','tilt','nod','wave','drag','walk','companion']){
      await js('xyPetAnimation.preview('+JSON.stringify(action)+')');await pause(45);
      assert.equal(await js('xyPetAnimation.state.action'),action==='drag'?'lift':action,'preview '+action);
      const box=await js("(()=>{const r=document.getElementById('pet').getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}})()");assert.deepEqual(box,hitbox,'animation must not move hitbox: '+action);
    }
    for(const gesture of ['tilt','nod']){
      await js('xyPetAnimation.preview('+JSON.stringify(gesture)+')');await pause(230);
      const bodyBefore=await js("document.getElementById('pet-image').getBoundingClientRect().toJSON()");
      await pause(140);
      const pose=await js("({puppet:xyPetPuppet.state,art:getComputedStyle(document.getElementById('pet-art')).transform,body:document.getElementById('pet-image').getBoundingClientRect().toJSON(),eyes:xyPetAnimation.state.blinkProgress})");
      assert.equal(pose.puppet.active,true);assert.ok(Math.abs(pose.puppet.angle)>.1,'head has real motion');assert.deepEqual(pose.puppet.bodyPoint,[.5,.8],'lower body vertices stay fixed');assert.notDeepEqual(pose.puppet.headPoint,[.5,.2],'head vertices move');assert.equal(pose.art,'none','gesture never rotates the entire character');assert.ok(Math.abs(pose.body.x-bodyBefore.x)<.01&&Math.abs(pose.body.y-bodyBefore.y)<2&&Math.abs(pose.body.height-bodyBefore.height)<2,'only subpixel breathing amplitude settles during '+gesture);if(gesture==='nod')assert.ok(pose.eyes>.9,'nod closes eyes during downward motion');
      await js('xyPetAnimation.cancel()');assert.equal(await js("xyPetPuppet.state.active"),false,'interruption resets head motion');assert.equal(await js("document.getElementById('pet').classList.contains('blinking')"),false,'interruption resets eyelids');
    }
    await js("xyPetAnimation.preview('wave');delete window.waveCrownReference");const waves=[];for(let sample=0;sample<11;sample++){await pause(90);const frame=await js(`(()=>{const canvas=document.getElementById('pet-puppet'),S=canvas.width,x=Math.floor(S*.43),y=Math.floor(S*.14),w=Math.floor(S*.10),h=Math.floor(S*.07),gl=canvas.getContext('webgl');let data;if(gl){data=new Uint8Array(w*h*4);gl.readPixels(x,S-y-h,w,h,gl.RGBA,gl.UNSIGNED_BYTE,data);}else data=canvas.getContext('2d').getImageData(x,y,w,h).data;if(!window.waveCrownReference)window.waveCrownReference=new Uint8Array(data);let difference=0;for(let k=0;k<data.length;k++)difference=Math.max(difference,Math.abs(data[k]-window.waveCrownReference[k]));return{...xyPetPuppet.state,crownDifference:difference};})()`);assert.ok(frame.crownDifference<=1,'wave crown pixels remain fixed through pose/eye transitions: '+frame.crownDifference);waves.push(frame);assert.deepEqual(frame.bodyPoint,[.5,.8],'waving does not move lower-body vertices');assert.equal(await js("getComputedStyle(document.getElementById('pet-art')).transform"),'none','waving never rotates full character');}assert.ok(waves.some(f=>f.arm>3)&&waves.some(f=>f.arm<-3),'arm waves back and forth');assert.ok(waves.some(f=>f.eyes>.8),'wave includes smiling blink');await js('xyPetAnimation.cancel()');assert.equal(await js('xyPetPuppet.state.active'),false,'cancel wave clears scene');
    await js("xyTest.visible(false);xyPetAnimation.preview('tilt')");await pause(420);
    const interruption=await js("(()=>{const before=xyPetPuppet.state.angle;xyTest.visible(true);return{before,after:xyPetPuppet.state.angle,action:xyPetAnimation.state.action}})()");
    assert.ok(Math.abs(interruption.before)>1);assert.equal(interruption.after,interruption.before,'panel interruption preserves the first return frame');assert.equal(interruption.action,null);
    await pause(270);assert.equal(await js('xyPetPuppet.state.active'),false,'interrupted gesture eases fully to idle');await js('xyTest.visible(false)');
    await js("xyPetAnimation.preview('walk');window.gaitSourceChanges=0;window.gaitObserver=new MutationObserver(records=>{window.gaitSourceChanges+=records.filter(r=>r.attributeName==='src').length;});gaitObserver.observe(document.getElementById('pet-art'),{subtree:true,attributes:true,attributeFilter:['src']});");
    const gait=[];
    for(let frame=0;frame<12;frame++){
      await pause(80);const sample=await js("({...xyPetWalk.state,changes:window.gaitSourceChanges})");
      assert.equal(sample.version,19);assert.equal(sample.ready,true);assert.equal(sample.decoder,true,'frame-addressable transparent animation is available');assert.equal(sample.changes,0);assert.ok(sample.cacheSize<=8);gait.push(sample);
    }
    assert.ok(new Set(gait.map(g=>g.index)).size>5,'approved artwork advances during preview');
    await js("xyPetWalk.sync({activity:'walk',petLeft:100,petTop:100});xyPetWalk.sync({activity:'walk',petLeft:108,petTop:100})");await pause(450);
    const heldPhase=await js('xyPetWalk.state.phase');await pause(70);assert.equal(await js('xyPetWalk.state.phase'),heldPhase,'a stationary pet does not advance travel frames');
    await js("xyPetWalk.sync({activity:'walk',petLeft:116,petTop:100})");await pause(80);assert.notEqual(await js('xyPetWalk.state.phase'),heldPhase,'travel advances the selected frame');
    await js("xyPetWalk.pause();xyPetWalk.sync({activity:'idle'})");
    const poses=[];
    for(const time of [0,540,1080,6480]){
      const value=await js(`(async()=>{await xyPetWalk.render(${time});const c=document.getElementById('walk-canvas'),d=c.getContext('2d').getImageData(0,0,640,640).data;let opaque=0;for(let i=3;i<d.length;i+=4)if(d[i]>240)opaque++;return{...xyPetWalk.state,corner:d[3],opaque,png:c.toDataURL()};})()`);
      assert.equal(value.corner,0,'walking has no opaque white background');assert.ok(value.opaque>60000,'the complete character remains visible');poses.push(value);
    }
    assert.equal(poses[0].index,0);assert.equal(poses[1].index,18);assert.notEqual(poses[0].png,poses[1].png,'opposite half cycles have distinct poses');assert.equal(poses[3].index,0);assert.equal(poses[0].png,poses[3].png,'full animation closes without a new pose');
    const direction=await js(`(async()=>{const c=document.getElementById('walk-canvas'),ctx=c.getContext('2d'),box=document.getElementById('pet').getBoundingClientRect();xyPetWalk.setFacing('right');await xyPetWalk.render(540);const right=ctx.getImageData(0,0,640,640).data;xyPetWalk.setFacing('left');await xyPetWalk.render(540);const left=ctx.getImageData(0,0,640,640).data;let mismatches=0;for(let y=0;y<640;y++)for(let x=0;x<640;x++)for(let k=0;k<4;k++)if(left[(y*640+x)*4+k]!==right[(y*640+639-x)*4+k])mismatches++;const facing=xyPetWalk.state.facing,index=xyPetWalk.state.index;xyPetWalk.sync({activity:'walk',petLeft:100,petTop:100,facing:'left'});xyPetWalk.sync({activity:'walk',petLeft:100,petTop:100,facing:'left'});const held=xyPetWalk.state.facing;xyPetWalk.sync({activity:'idle'});await xyPetWalk.render(540);const after=document.getElementById('pet').getBoundingClientRect();return{mismatches,facing,index,held,idle:xyPetWalk.state.facing,boxStable:box.width===after.width&&box.height===after.height,parent:getComputedStyle(document.getElementById('pet-facing')).transform};})()`);
    assert.equal(direction.mismatches,0,'left walking mirrors every pixel of the same approved frame');assert.equal(direction.facing,'left');assert.equal(direction.index,18,'turning preserves gait phase');assert.equal(direction.held,'left','stationary samples preserve travel direction');assert.equal(direction.idle,'right','idle restores original orientation');assert.equal(direction.boxStable,true,'direction does not alter hitbox');assert.equal(direction.parent,'matrix(1, 0, 0, 1, 0, 0)','other gestures and the panel are never mirrored');
    await js('gaitObserver.disconnect()');
    await js('xyPetAnimation.cancel();xyTest.visible(true)');await pause(40);
    assert.equal(await js('xyPetAnimation.state.action'),null,'opening panel cancels preview');
    assert.equal(await js("document.getElementById('pet').classList.contains('panel-mode')"),true);
    assert.equal(activity.panel,true,'host observes panel lock');
    const heldCursor=motion.cursor;let dragCursor={x:a.x+500,y:a.y+500};motion.cursor=()=>dragCursor;motion.begin();dragCursor={x:a.x+530,y:a.y+525};motion.move();await pause(70);
    assert.equal(await js('xyPetAnimation.state.action'),'lift','real drag uses lift pose');assert.equal(await js('xyPetPuppet.state.pose'),'lift');assert.equal(await js('xyPetPuppet.state.active'),true);const legBefore=await js('xyPetPuppet.state.leftLeg');await pause(100);assert.notEqual(await js('xyPetPuppet.state.leftLeg'),legBefore,'suspended leg moves continuously');assert.notEqual(await js('xyPetPuppet.state.leftLeg'),await js('xyPetPuppet.state.rightLeg'),'legs swing independently');
    motion.end(true);await pause(60);assert.equal(await js('xyPetAnimation.state.action'),'land','release plays landing');assert.equal(await js('xyTest.open'),true,'drag does not toggle panel');motion.cursor=heldCursor;
    motion.setActivity('walk','right');await pause(40);
    assert.notEqual(await js('xyPetAnimation.state.action'),'walk','panel suppresses walking pose');motion.setActivity('idle');
    assert.equal(await js("document.querySelectorAll('#content-frame').length"),1,'one enclosing frame around information');
    pet.webContents.debugger.attach('1.3');await pet.webContents.debugger.sendCommand('DOM.enable');await pet.webContents.debugger.sendCommand('CSS.enable');const doc=await pet.webContents.debugger.sendCommand('DOM.getDocument'),audit=[];
    for(const[selector,expected]of[['h1','Marker'],['#quota-value','Marker'],['.circle-copy>span','Xiaolai'],['#used-label','Yozai'],['#model-value','975'],['#week-tokens','975']]){const node=await pet.webContents.debugger.sendCommand('DOM.querySelector',{nodeId:doc.root.nodeId,selector});const fonts=await pet.webContents.debugger.sendCommand('CSS.getPlatformFontsForNode',{nodeId:node.nodeId});audit.push({selector,expected,fonts:fonts.fonts});}
    pet.webContents.debugger.detach();await fs.writeFile(path.join(out,'font-audit.json'),JSON.stringify(audit,null,2));for(const row of audit){assert.ok(row.fonts.length,row.selector+' missing actual font');assert.ok(row.fonts.every(f=>f.isCustomFont),row.selector+' fell back to a system font');assert.ok(row.fonts.some(f=>(f.postScriptName+' '+f.familyName).toLowerCase().includes(row.expected.toLowerCase())),row.selector+' wrong actual face');}
    await fs.writeFile(path.join(out,'panel.png'),(await pet.webContents.capturePage()).toPNG());
    const settingsPoint=await js("(()=>{const r=document.getElementById('settings').getBoundingClientRect();return{x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)}})()");
    pet.webContents.sendInputEvent({type:'mouseMove',...settingsPoint});pet.webContents.sendInputEvent({type:'mouseDown',...settingsPoint,button:'left',clickCount:1});pet.webContents.sendInputEvent({type:'mouseUp',...settingsPoint,button:'left',clickCount:1});await pause(500);let settings=getSettings();assert.ok(settings,'one native mouse press opens settings');assert.ok(settings.isVisible(),'first press shows the window without a second activation');await settings.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
    assert.deepEqual(settings.getContentBounds(),settings.getBounds(),'settings has no system frame');
    assert.equal(await settings.webContents.executeJavaScript("getComputedStyle(document.documentElement).backgroundColor"),'rgba(0, 0, 0, 0)');
    const silhouette=await settings.webContents.capturePage(),pixels=silhouette.toBitmap(),sw=silhouette.getSize().width;
    assert.equal(pixels[3],0,'outer window corner reveals the desktop');
    assert.ok(pixels[(40*sw+40)*4+3]>240,'paper interior remains opaque');
    assert.equal(await settings.webContents.executeJavaScript("getComputedStyle(document.querySelector('.window-bar')).getPropertyValue('-webkit-app-region')"),'drag');
    assert.equal(await settings.webContents.executeJavaScript("document.getElementById('refreshSeconds')===null"),true,'real-time sync replaces interval selector');
    const originalSettingsBounds=settings.getBounds();
    await settings.webContents.executeJavaScript("document.getElementById('window-maximize').click()");await pause(250);assert.ok(settings.paperRestoreBounds,'transparent paper window expands to work area');assert.notDeepEqual(settings.getBounds(),originalSettingsBounds);
    await settings.webContents.executeJavaScript("document.getElementById('window-maximize').click()");await pause(250);assert.ok(['x','y','width','height'].every(key=>Math.abs(settings.getBounds()[key]-originalSettingsBounds[key])<=1),'paper window restores bounds within native DPI rounding');
    assert.notEqual(await settings.webContents.executeJavaScript("getComputedStyle(document.querySelector('.page>.outline')).display"),'none','handwritten panel frame restored');

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
    await js("xyTest.render({preferences:{hoverEnabled:true,collapseMs:320,refreshSeconds:60,weatherEnabled:false,city:'中山'},data:{quota:null,usage:null,weather:null,issues:[],refreshing:false},preview:true})");assert.equal(await js("document.getElementById('quota-value').textContent"),'—');assert.equal(await js("document.getElementById('sync-value').textContent"),'未连接');report={ok:true,layouts,checks:['sandbox isolation','clicked panel remains open','all four actual custom fonts','settings single click','settings tabs and persistence','handwritten panel, frameless controls and real-time sync','missing data','no portrait overlap','eight actions with fixed hitbox','v19 transparent full-frame walking, bounded cache, distance synchronization and loop closure','non-activating permanently topmost pet','panel cancels autonomous walking','activity settings and preview','60 rendered drag frames track cursor without native moves or direction reversal']};
  }catch(e){report={ok:false,error:e.message,stack:e.stack};}finally{await fs.writeFile(path.join(out,'ui-report.json'),JSON.stringify(report,null,2));clearTimeout(watchdog);console.log(JSON.stringify(report));app.exit(report.ok?0:1);}
}
module.exports={run};
