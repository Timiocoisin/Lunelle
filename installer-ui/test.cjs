'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async({win,root})=>{
 const out=path.resolve(process.env.XINGYUE_SETUP_ARTIFACTS||path.join(process.cwd(),'artifacts/installer-final'));await fs.mkdir(out,{recursive:true});
 const js=code=>win.webContents.executeJavaScript(code);
 const setupState=await js('installer.read()');assert.equal(setupState.version,require('./package.json').version,'wizard version matches package');
 await js("document.getElementById('directory').value=['D:','Apps','Lunelle'].join(String.fromCharCode(92))");
 await js('document.fonts.ready');await new Promise(r=>setTimeout(r,300));
 assert.equal(await js('document.querySelector(".welcome-note")===null'),true,'welcome card removed');
 assert.equal(await js('document.querySelectorAll(".welcome-story .story-item").length'),2,'welcome paper has two readable illustrated notes');
 assert.equal(await js('getComputedStyle(document.getElementById("book")).getPropertyValue("-webkit-app-region")'),'drag','paper drags the window');
 assert.equal(await js('getComputedStyle(document.getElementById("close")).getPropertyValue("-webkit-app-region")'),'no-drag','window controls remain clickable');
 const sources=[];
 for(let i=0;i<6;i++){
  await js(`setupDesign.show(${i});document.getElementById('character').decode()`);
  await js('new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))');await new Promise(r=>setTimeout(r,160));
  const state=await js(`(()=>{const a=document.querySelector('article').getBoundingClientRect(),n=document.querySelector('nav').getBoundingClientRect(),c=document.getElementById('character');return{src:c.src,width:c.naturalWidth,heading:document.getElementById('heading').textContent,navFits:n.bottom<=a.bottom+1,nextDisabled:document.getElementById('next').disabled,license:document.getElementById('license').textContent.length,transparent:getComputedStyle(document.body).backgroundColor}})()`);
  assert.ok(state.width>100);assert.ok(state.navFits,'page '+i+' navigation fits');assert.equal(state.transparent,'rgba(0, 0, 0, 0)');if(i===1){assert.equal(state.nextDisabled,true);assert.ok(state.license>300);assert.equal(await js('document.getElementById("license").textContent.includes("Permission is hereby")'),false);}sources.push(state.src);
  await fs.writeFile(path.join(out,`0${i+1}.png`),(await win.webContents.capturePage()).toPNG());
 }
 assert.equal(new Set(sources).size,6);
 const blocked=await js(`installer.install({accepted:true,directory:'D:\\NeverInstallFromPreview',desktop:false,menu:false})`);assert.equal(blocked.ok,false);
 await fs.writeFile(path.join(out,'report.json'),JSON.stringify({ok:true,version:setupState.version,pages:6,uniqueCharacters:6,previewCannotInstall:true},null,2));console.log('Installer six-page design checks passed.');
};
