'use strict';
const api=window.xingyue,$=id=>document.getElementById(id);let state,initialized=false,queue=Promise.resolve();
const controls=['scale','opacity','alwaysOnTop','weatherEnabled','refreshSeconds','codexPath','city'];
function feedback(message,error=false){$('save-feedback').textContent=message;$('save-feedback').classList.toggle('feedback-error',error);}
function write(patch){feedback('保存中…');queue=queue.catch(()=>{}).then(()=>api.configure(patch)).then(value=>{state=value;feedback('已保存');}).catch(()=>feedback('保存失败，请重试',true));return queue;}
function render(value){state=value;document.querySelector('.version').textContent='v'+value.version;const q=value.data.quota;$('settings-five').textContent=q?.fiveHour?Math.round(q.fiveHour.remaining)+'%':'—';$('settings-week').textContent=q?.weekly?Math.round(q.weekly.remaining)+'%':'—';$('connection-label').textContent=value.preview?'预览模式':q?.stale?'额度数据已过期':q?'Codex 已连接':'尚未取得额度';$('connection-note').textContent=value.data.issues?.map(i=>i.message).join('；')||'额度来自当前登录账号；token 来自本机可读日志。';$('settings-refresh').disabled=value.data.refreshing;
  document.querySelector('.version').textContent='v'+value.version;
  if(!initialized){for(const id of controls){const el=$(id);if(el.type==='checkbox')el.checked=value.preferences[id];else el.value=value.preferences[id];}initialized=true;outputs();}}
function outputs(){$('scale-output').textContent=Math.round(Number($('scale').value)*100)+'%';$('opacity-output').textContent=Math.round(Number($('opacity').value)*100)+'%';}
for(const id of controls.filter(id=>id!=='city')){$(id).addEventListener('change',()=>{const el=$(id),value=el.type==='checkbox'?el.checked:['scale','opacity','collapseMs','refreshSeconds'].includes(id)?Number(el.value):el.value;write({[id]:value});});}
for(const id of['scale','opacity'])$(id).addEventListener('input',outputs);
$('city-form').addEventListener('submit',async e=>{e.preventDefault();const city=$('city').value.trim();if(!city){$('city').setAttribute('aria-invalid','true');$('city-feedback').textContent='请输入城市名后重试';return;}$('city').removeAttribute('aria-invalid');await write({city});$('city-feedback').textContent='城市已保存，天气正在更新';});
$('browse').addEventListener('click',async()=>{try{const file=await api.chooseCodex();if(file){$('codexPath').value=file;await write({codexPath:file});}}catch{feedback('无法选择文件，请手动填写路径',true);}});
$('settings-refresh').addEventListener('click',async()=>{$('settings-refresh').disabled=true;try{render(await api.refresh());}catch{feedback('刷新失败，请稍后重试',true);}finally{$('settings-refresh').disabled=false;}});
function tab(name){for(const id of['look','data','behavior']){const selected=name===id;$('tab-'+id).setAttribute('aria-selected',String(selected));$('tab-'+id).tabIndex=selected?0:-1;$('page-'+id).hidden=!selected;}window.xyIllustrations.sketchAll();}
for(const id of['look','data','behavior'])$('tab-'+id).addEventListener('click',()=>tab(id));
document.querySelector('.tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const all=['look','data','behavior'],index=all.findIndex(id=>$('tab-'+id).getAttribute('aria-selected')==='true');const next=e.key==='Home'?0:e.key==='End'?2:(index+(e.key==='ArrowRight'?1:2))%3;tab(all[next]);$('tab-'+all[next]).focus();});
$('settings-portrait').addEventListener('error',()=>{if(!$('settings-portrait').src.endsWith('moon.svg'))$('settings-portrait').src='../assets/moon.svg';});api.subscribe(render);api.read().then(render).catch(()=>feedback('无法连接，请重新打开设置',true));
