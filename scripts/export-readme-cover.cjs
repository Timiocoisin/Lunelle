'use strict';
// Editorial layout using unchanged, existing character artwork.
const{app,BrowserWindow}=require('electron'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/images/readme');
const url=file=>pathToFileURL(path.join(root,file)).href;
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{let win;try{
 await fs.mkdir(out,{recursive:true});const work=path.join(root,'artifacts/readme-editorial');await fs.mkdir(work,{recursive:true});
 const html=`<!doctype html><meta charset="utf-8"><style>
 @font-face{font-family:Round;src:url('${url('assets/fonts/LXGW975YuanSC-400W.ttf')}')}
 *{box-sizing:border-box}html,body{margin:0;width:1680px;height:1040px;overflow:hidden}body{background:#faf8f3;color:#65536f;font-family:Round,'Microsoft YaHei',sans-serif}
 .frame{position:absolute;inset:20px;border:1px solid #dfd5e3;border-radius:22px}.frame:after{content:'';position:absolute;inset:9px;border:1px solid #ebe4ec;border-radius:15px}
 .wash{position:absolute;left:0;right:0;top:200px;height:660px;background:radial-gradient(ellipse at 30% 65%,#eee6f166,transparent 40%),radial-gradient(ellipse at 73% 65%,#e4d9ed77,transparent 42%)}
 header{position:absolute;top:47px;left:0;right:0;text-align:center}header small{font-size:16px;letter-spacing:5px;color:#9b89a7}h1{font:normal 96px/1.1 Georgia,serif;letter-spacing:8px;margin:13px 0 12px;color:#645071}header p{font:27px/1.5 SimSun,serif;letter-spacing:3px;margin:0;color:#86738e}
 .rule{position:absolute;left:840px;top:330px;bottom:150px;width:1px;background:linear-gradient(transparent,#dfd2df,transparent)}
 figure{position:absolute;top:252px;width:680px;height:640px;margin:0}figure.young{left:106px}figure.adult{right:106px}figure img{position:absolute;bottom:0;left:50%;transform:translateX(-50%);object-fit:contain}figure.young img{width:640px;height:640px}figure.adult img{width:790px;height:790px}
 .label{position:absolute;top:914px;width:680px;text-align:center}.label.one{left:106px}.label.two{right:106px}.label strong{font-size:27px;font-weight:400;letter-spacing:3px}.label p{font-size:16px;letter-spacing:2px;color:#9b89a7;margin:14px 0 0}
 footer{position:absolute;bottom:35px;width:100%;font-size:14px;letter-spacing:4px;text-align:center;color:#a394ac}svg{position:absolute;inset:0;pointer-events:none}
 </style><div class="frame"></div><div class="wash"></div>
 <svg viewBox="0 0 1680 1040" fill="none" stroke="#d9c9df" stroke-width="1.5"><path d="M120 114h112M1448 114h112M104 936h35M1541 936h35"/><path d="M265 103v22m-11-11h22M1415 103v22m-11-11h22"/><path d="M114 285l5 13 13 5-13 5-5 13-5-13-13-5 13-5zM1566 285l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/><circle cx="840" cy="305" r="3"/></svg>
 <header><small>桌边的伙伴 · 随手可翻的使用手账</small><h1>Lunelle</h1><p>在桌面的一角，留一小片月色。</p></header><div class="rule"></div>
 <figure class="young"><img src="${url('assets/characters/idle-seated.png')}" alt="经典少女"></figure>
 <figure class="adult"><img src="${url('assets/characters/queen/v2/idle.png')}" alt="成年女王"></figure>
 <div class="label one"><strong>经典 · 淡紫少女</strong><p>星星抱枕、卷发与月亮鞋</p></div>
 <div class="label two"><strong>成年 · 暗月女王</strong><p>银紫长发、暗月长裙与月牙座</p></div>
 <footer>同一个 Lunelle · 两种年龄形态</footer>`;
 const file=path.join(work,'cover.html');await fs.writeFile(file,html);
 win=new BrowserWindow({width:1680,height:1040,show:false,frame:false,webPreferences:{offscreen:true,backgroundThrottling:false}});
 await win.loadFile(file);await win.webContents.executeJavaScript('Promise.all([document.fonts.ready,...[...document.images].map(i=>i.decode())])');
 await fs.writeFile(path.join(out,'cover.png'),(await win.webContents.capturePage()).toPNG());console.log('Created docs/images/readme/cover.png from existing artwork.');
 }catch(e){console.error(e);process.exitCode=1;}finally{win?.destroy();app.exit(process.exitCode||0);}});
