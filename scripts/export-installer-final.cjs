'use strict';
const{app,BrowserWindow}=require('electron'),fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'..'),input=path.join(root,'artifacts/installer-final'),out=path.join(root,'docs/design/installer-final');
app.disableHardwareAcceleration();
app.whenReady().then(async()=>{let win;try{
 await fs.mkdir(out,{recursive:true});const names=['欢迎','许可协议','安装范围','安装位置','安装进度','完成'];
 for(let i=1;i<=6;i++)await fs.copyFile(path.join(input,`0${i}.png`),path.join(out,`0${i}.png`));
 const html=path.join(root,'.local/installer-final-overview.html');await fs.writeFile(html,`<meta charset="utf-8"><style>html,body{margin:0;background:#b7b0cc;color:#fff;font-family:'Microsoft YaHei';}body{padding:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px}figure{margin:0}figcaption{text-align:center;height:30px;font-size:17px;letter-spacing:3px}img{width:100%;display:block}</style>${names.map((name,i)=>`<figure><figcaption>0${i+1} · ${name}</figcaption><img src="${pathToFileURL(path.join(out,`0${i+1}.png`)).href}"></figure>`).join('')}`);
 win=new BrowserWindow({width:1800,height:900,show:false,frame:false,webPreferences:{offscreen:true}});await win.loadFile(html);await win.webContents.executeJavaScript('Promise.all([...document.images].map(i=>i.decode()))');await fs.writeFile(path.join(out,'overview.png'),(await win.webContents.capturePage()).toPNG());
 await fs.writeFile(path.join(out,'README.md'),'# Lunelle 安装器 · 实际程序截图\n\n以下由打包后的六页界面导出，使用最终人物素材。安装进度页展示运行状态布局，截图不执行安装。\n\n![六页总览](overview.png)\n\n'+names.map((name,i)=>`## 0${i+1} ${name}\n\n![${name}](0${i+1}.png)\n`).join('\n'));
 console.log('Exported final installer screenshots.');
 }catch(e){console.error(e);process.exitCode=1;}finally{win?.destroy();app.exit(process.exitCode||0);}});
