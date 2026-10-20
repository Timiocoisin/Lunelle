'use strict';
const api=window.xingyue, $=id=>document.getElementById(id);
let layoutScale=null;
let current=null, open=false, collapseTimer=null, dragging=null, lastHit=null, inputMode='pointer', fitLocked=false, suppressFitUntil=0;
const occupied=new Set();
function fit(){if(layoutScale!==null||fitLocked||performance.now()<suppressFitUntil)return;const ratio=Math.min(innerWidth/1530,innerHeight/990);$('stage').style.left=(500*ratio)+'px';$('stage').style.transform=`scale(${ratio})`;}
fit();addEventListener('resize',fit);
function reportPanel(){api.panel({open,rects:['pet','journal','bridge'].map(id=>{const r=$(id).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};})});}
function visible(value){open=value;window.xyPetAnimation.setPanel(value);$('journal').classList.toggle('open',value);$('journal').inert=!value;$('journal').setAttribute('aria-hidden',String(!value));$('bridge').hidden=!value;requestAnimationFrame(reportPanel);}
api.onDismiss(()=>visible(false));
addEventListener('resize',()=>requestAnimationFrame(reportPanel));
document.addEventListener('pointerdown',e=>{if(open&&!e.target.closest('#pet,#journal,#bridge'))visible(false);},true);
function enter(source){occupied.add(source);}
function leave(source){occupied.delete(source);}
for(const [id,source]of[['pet','pet'],['journal','panel'],['bridge','bridge']]){$(id).addEventListener('pointerenter',()=>enter(source));$(id).addEventListener('pointerleave',()=>leave(source));}
$('pet').addEventListener('focus',()=>{if(inputMode==='keyboard')enter('keyboard');});$('pet').addEventListener('blur',()=>leave('keyboard'));
$('journal').addEventListener('focusin',()=>{if(inputMode==='keyboard'){occupied.add('keyboard-panel');clearTimeout(collapseTimer);}});
document.addEventListener('pointerdown',()=>{inputMode='pointer';occupied.delete('keyboard');occupied.delete('keyboard-panel');},true);
document.addEventListener('keydown',()=>{inputMode='keyboard';},true);
$('journal').addEventListener('focusout',e=>{if(!$('journal').contains(e.relatedTarget))leave('keyboard-panel');});
document.addEventListener('pointermove',e=>{const hit=!!(e.target.closest('#pet')||open&&e.target.closest('#journal,#bridge'));if(hit!==lastHit){lastHit=hit;api.interactive(hit);}});
document.addEventListener('pointerleave',()=>{if(!dragging){api.interactive(false);occupied.clear();leave('window');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){occupied.clear();visible(false);$('pet').blur();}});
$('pet').addEventListener('contextmenu',e=>{e.preventDefault();api.command('context');});
$('pet').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();fitLocked=true;dragging={id:e.pointerId};$('pet').classList.add('dragging');$('pet').setPointerCapture(e.pointerId);api.interactive(true);api.drag('start');});

function endDrag(e){if(!dragging)return;suppressFitUntil=performance.now()+350;api.drag(e?.type==='pointerup'?'release':'end');dragging=null;fitLocked=false;$('pet').classList.remove('dragging');}
$('pet').addEventListener('pointerup',endDrag);$('pet').addEventListener('pointercancel',endDrag);$('pet').addEventListener('lostpointercapture',endDrag);
document.addEventListener('dragstart',e=>e.preventDefault());
for(const id of['pet','pet-image','portrait'])$(id).draggable=false;
let pendingMotion=null,motionFrame=0;
function motionState(value){
  layoutScale=value.scale;
  $('stage').style.left='0px';$('stage').style.transform=`scale(${value.scale})`;
  $('pet').style.transform=`translate3d(${value.petLeft-145}px,${value.petTop-750}px,0)`;
  $('journal').style.transform=`translate3d(${value.panelLeft-15}px,${value.panelTop-8}px,0)`;
  $('pet').classList.toggle('walking-motion',value.activity==='walk'&&!value.dragging);
  $('bridge').hidden=true;
  if(value.togglePanel){visible(!open);window.xyPetAnimation.click();}
  if(!value.dragging){dragging=null;fitLocked=false;$('pet').classList.remove('dragging');}
  if(open&&!value.dragging)reportPanel();
}
api.onMotion(value=>{
  window.xyPetAnimation.sync(value);
  if(value.previewAction)window.xyPetAnimation.preview(value.previewAction);
  if(value.landed)window.xyPetAnimation.play('land');
  if(value.dragging){fitLocked=true;}
  // Keep activation separate so a subsequent geometry event cannot lose it.
  if(value.togglePanel){visible(!open);window.xyPetAnimation.click();}
  pendingMotion={...value,togglePanel:false};
  if(!motionFrame)motionFrame=requestAnimationFrame(()=>{motionFrame=0;const next=pendingMotion;pendingMotion=null;motionState(next);});
});
$('pet').addEventListener('click',e=>{if(e.detail===0){visible(!open);window.xyPetAnimation.click();}});
// Open on press: activating a transparent inactive pet window can cancel the
// subsequent click. Keep detail=0 click for keyboard/accessibility activation.
$('settings').addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();api.command('settings');});
$('settings').addEventListener('click',e=>{if(e.detail===0)api.command('settings');});
$('hide').addEventListener('click',()=>{occupied.clear();visible(false);api.command('hide');});
$('refresh').addEventListener('click',async()=>{if($('refresh').disabled)return;$('refresh').disabled=true;$('refresh').dataset.status='loading';try{render(await api.refresh());$('refresh').dataset.status='success';}catch{$('notice').textContent='刷新失败，请稍后重试';$('notice').hidden=false;$('refresh').dataset.status='error';}finally{$('refresh').disabled=false;}});
function shortTokens(n){if(!Number.isFinite(n))return'—';return n>=1e6?(n/1e6).toFixed(1)+'M':n>=1e3?(n/1e3).toFixed(1)+'K':String(n);}
function chineseTokens(n){return Number.isFinite(n)?n>=1e4?(n/1e4).toFixed(1)+'万':String(n):'—';}
function date(t){if(!Number.isFinite(t))return'—';const d=new Date(t);return`${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;}
function remaining(t,compact=false){if(!Number.isFinite(t))return'—';const seconds=Math.max(0,Math.floor((t-Date.now())/1000)),h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60);return compact?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`:`${h}小时${m}分`;}
function clocks(){const now=new Date();$('clock').textContent=now.toLocaleString('sv-SE');const q=current?.data.quota?.fiveHour;$('reset-relative').textContent=q?'距重置 '+remaining(q.resetsAt):'距重置 —';$('reset-countdown').textContent=remaining(q?.resetsAt,true);}
function render(state){current=state;const d=state.data,q=d.quota,five=q?.fiveHour,week=q?.weekly,u=d.usage,w=d.weather;

  $('preview-mark').hidden=!state.preview;$('quota-value').textContent=five?Math.round(five.remaining):'—';$('used-label').textContent=five?`已使用 ${Math.round(100-five.remaining)}%`:'未取得额度';
  $('ring-fill').style.strokeDasharray=`${five?.remaining??0} 100`;if(five)$('quota-meter').setAttribute('aria-valuenow',String(five.remaining));else $('quota-meter').removeAttribute('aria-valuenow');
  $('week-value').textContent=week?Math.round(week.remaining):'—';$('week-fill').style.width=(week?.remaining??0)+'%';$('week-reset').textContent='重置 '+date(week?.resetsAt);$('reset-value').textContent=date(five?.resetsAt);
  $('model-value').textContent=u?.model?.name||'未提供';$('plan-value').textContent=q?.plan||'—';$('weather-city').textContent=w?.label||state.preferences.city;
  $('weather-value').textContent=w?`${w.temperature.toFixed(1)}℃`:state.preferences.weatherEnabled?'—':'未启用';$('weather-note').textContent=w?`${w.text}${w.stale?' · 旧数据':''}`:state.preferences.weatherEnabled?'等待天气':'';
  $('week-tokens').textContent=shortTokens(u?.weekTokens);$('today-tokens').textContent=chineseTokens(u?.todayTokens);$('turn-tokens').textContent=chineseTokens(u?.lastTurnTokens);
  $('effort-value').textContent=({minimal:'极低',low:'低',medium:'中',high:'高',xhigh:'极高',max:'最高',ultra:'极高'})[u?.model?.effort]||u?.model?.effort||'未提供';
  $('runtime-value').textContent=u?`${Math.floor(u.runtimeSeconds/3600)}h${String(Math.floor(u.runtimeSeconds%3600/60)).padStart(2,'0')}m`:'—';
  const stale=q?.stale||q&&Date.now()-q.at>state.preferences.refreshSeconds*2500;
  $('sync-value').textContent=stale?'已过期':q?'已连接':d.refreshing?'读取中':'未连接';$('sync-note').textContent=u?.partial?'部分日志可读':'本机 Codex';$('live-dot').style.opacity=q&&!stale?'1':'.4';
  $('refresh').disabled=d.refreshing;$('notice').hidden=!d.issues?.length;$('notice').textContent=d.issues?.map(i=>i.message).join('；')||'';
  clocks();
}
for(const id of['portrait','pet-image'])$(id).addEventListener('error',()=>{if(!$(id).src.endsWith('moon.svg'))$(id).src='../assets/moon.svg';});
api.subscribe(render);api.read().then(render).catch(()=>{$('notice').textContent='连接失败，请从托盘重新打开Lunelle';$('notice').hidden=false;});setInterval(clocks,1000);
window.xyTest={visible,enter,leave,render,get open(){return open;}};
