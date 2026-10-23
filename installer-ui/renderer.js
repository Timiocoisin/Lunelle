'use strict';
const $=id=>document.getElementById(id),steps=[
 ['WELCOME HOME','欢迎，让 Lunelle 住进桌面','抱着星星的桌面伙伴，和一本随手翻开的 Codex 使用手账。','挥手欢迎'],
 ['许可与素材说明','阅读许可与素材说明','开始之前，请了解代码与角色素材的使用范围。','低头阅读'],
 ['INSTALLATION SCOPE','她将陪伴哪位用户？','选择 Lunelle 在这台电脑上的使用范围。','歪头示意'],
 ['INSTALL LOCATION','为她留一个位置','选择安装文件夹，准备开始桌边日常。','指向安装位置'],
 ['INSTALLING','正在安放她的小小世界','文件正在写入，请稍候。','闭眼等待'],
 ['READY TO MEET YOU','Lunelle 已在桌边等你','安装完成，和她打个招呼吧。','站起招手']
];let page=0,preview=false,installing=false,finished=false;
function fit(){const s=Math.min(innerWidth/1100,innerHeight/730);$('book').style.transform=`scale(${s})`;const c=document.createElement('canvas');c.width=innerWidth;c.height=innerHeight;const ctx=c.getContext('2d'),p=new Path2D($('outline').getAttribute('d')),art=$('paper-art'),rects=[];let pixels;if(art.complete&&art.naturalWidth){ctx.drawImage(art,0,0,1100*s,730*s);pixels=ctx.getImageData(0,0,c.width,c.height).data;}for(let y=0;y<innerHeight;y+=2){let first=-1,last=-1;for(let x=0;x<innerWidth;x++){if(pixels?pixels[((Math.min(y+1,c.height-1))*c.width+x)*4+3]>32:ctx.isPointInPath(p,x/s,(y+1)/s)){if(first<0)first=x;last=x;}}if(first>=0)rects.push({x:first,y,width:last-first+1,height:Math.min(2,innerHeight-y)});}window.installer.shape(rects);}
addEventListener('resize',fit);fit();
$('paper-art').addEventListener('load',fit);
function show(index){page=index;const data=steps[index];$('eyebrow').textContent=data[0];$('heading').textContent=data[1];$('subtitle').textContent=data[2];$('character').src=`../assets/installer/poses/0${index+1}.png`;$('character').alt=`Lunelle ${data[3]}`;document.querySelectorAll('.page').forEach(el=>el.classList.toggle('active',+el.dataset.page===index));$('step').textContent=`0${index+1} / 06`;$('back').hidden=index===0||index>=4;$('next').hidden=index===4;$('later').hidden=index===4;$('later').textContent=index===5?'稍后启动':index===0?'稍后再见':'取消';$('next').innerHTML=['开始安装 <span>→</span>','同意并继续 <span>→</span>','下一步 <span>→</span>','安装 <span>→</span>','','与她见面 <span>→</span>'][index];$('next').disabled=index===1&&!$('accepted').checked;$('error').hidden=true;}
function error(message){$('error').textContent=message;$('error').hidden=false;}
$('accepted').onchange=()=>{$('next').disabled=!$('accepted').checked;};
$('back').onclick=()=>show(page-1);$('minimize').onclick=()=>window.installer.minimize();$('close').onclick=()=>window.installer.close();
$('browse').onclick=async()=>{const dir=await window.installer.browse();if(dir)$('directory').value=dir;};
$('later').onclick=()=>{if(page===5)void window.installer.finish(false);else void window.installer.close();};
$('next').onclick=async()=>{
 if(page<3){show(page+1);return;}
 if(page===5){try{await window.installer.finish($('launch').checked);}catch{error('无法启动应用，请从桌面或开始菜单打开。');}return;}
 if(page!==3||installing)return;
 $('next').disabled=true;try{const result=await window.installer.install({directory:$('directory').value,accepted:$('accepted').checked,desktop:$('desktop').checked,menu:$('menu').checked});if(!result.ok){error(result.error);return;}installing=true;show(4);}catch{error('无法启动安装，请重试。');}finally{$('next').disabled=false;}
};
window.installer.onStatus(s=>{if(s.stage==='preparing'||s.stage==='installing'){installing=true;show(4);$('progress-state').textContent=s.stage==='preparing'?'准备中':'写入中';$('status-message').textContent=s.message;}else if(s.stage==='done'){installing=false;finished=true;show(5);}else if(s.stage==='error'){installing=false;show(3);error(s.message);}});
window.installer.read().then(data=>{preview=data.preview;$('preview-mark').hidden=!preview;$('directory').value=data.directory;$('license').textContent=data.license;$('assets').textContent=data.assets;$('thirdParty').textContent=data.thirdParty;$('version').textContent=`v${data.version} · Windows x64`;show(0);}).catch(()=>error('安装信息未能载入，请重新打开安装包。'));
// Isolated design checks can visit all pages without starting an installer.
if(new URLSearchParams(location.search).has('test'))window.setupDesign={show,get page(){return page;}};
