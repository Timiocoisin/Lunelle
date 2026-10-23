'use strict';
const{app,BrowserWindow,ipcMain,dialog,screen}=require('electron');
const fs=require('node:fs/promises'),path=require('node:path'),{spawn,execFile}=require('node:child_process');
const{promisify}=require('node:util'),exec=promisify(execFile),{validateDirectory}=require('./validation.cjs');
const root=__dirname,preview=process.argv.includes('--preview'),test=process.argv.includes('--design-test');
const probe=process.env.LUNELLE_SETUP_STARTUP_PROBE;
app.setName('Lunelle Setup');app.setPath('userData',path.join(app.getPath('temp'),'Lunelle-Setup-UI'+(probe?'-probe-'+process.pid:'')));
let win,busy=false,installed=null,status={stage:'ready'},closing=false;
const version=require('./package.json').version;
if(!app.requestSingleInstanceLock()){app.quit();}else app.on('second-instance',()=>{if(win){if(win.isMinimized())win.restore();win.show();win.focus();}});
function send(next){status=next;if(win&&!win.isDestroyed())win.webContents.send('setup:status',status);}
async function existingDirectory(){
 try{const{stdout}=await exec('reg.exe',['query','HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\71bf1961-f5e8-5bb5-b72a-afd313175409','/v','InstallLocation'],{windowsHide:true});const m=stdout.match(/InstallLocation\s+REG_SZ\s+(.+)/);if(m)return validateDirectory(m[1].trim());}catch{}
 return path.join(app.getPath('appData'),'..','Local','Programs','Xingyue');
}
async function close(){if(busy){await dialog.showMessageBox(win,{type:'info',title:'正在安装',message:'文件正在写入，请等待安装结束。',detail:'请勿强行关闭安装器，以免留下不完整文件。'});return false;}if(process.env.LUNELLE_SETUP_SOURCE)await fs.unlink(path.join(process.resourcesPath,'engine/Lunelle-Engine.exe')).catch(()=>{});closing=true;win.close();return true;}
function isTrusted(e){return e.sender===win?.webContents;}
function handle(name,fn){ipcMain.handle(name,(e,...args)=>{if(!isTrusted(e))throw Error('Unknown setup window');return fn(...args);});}
async function prepareEngine(){
 const engine=path.join(process.resourcesPath,'engine','Lunelle-Engine.exe');
 try{await fs.access(engine);return engine;}catch{}
 const source=process.env.LUNELLE_SETUP_SOURCE;if(!source)throw Error('安装引擎缺失，请重新打开完整安装包。');
 await fs.mkdir(path.dirname(engine),{recursive:true});
 await new Promise((resolve,reject)=>{const child=spawn(source,['/ENGINEONLY'],{windowsHide:true,env:{...process.env,LUNELLE_SETUP_ENGINE_DIRECTORY:path.dirname(engine)}});child.once('error',reject);child.once('exit',code=>code===0?resolve():reject(Error('安装文件准备失败，请检查临时磁盘空间。')));});
 await fs.access(engine);return engine;
}
app.whenReady().then(async()=>{
 const area=screen.getPrimaryDisplay().workAreaSize,ratio=Math.min(1,area.width/1120,area.height/760);
 win=new BrowserWindow({width:Math.round(1100*ratio),height:Math.round(730*ratio),show:false,frame:false,transparent:true,backgroundColor:'#00000000',resizable:false,maximizable:false,autoHideMenuBar:true,webPreferences:{preload:path.join(root,'preload.cjs'),contextIsolation:true,sandbox:true,nodeIntegration:false,backgroundThrottling:false}});
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));win.webContents.on('will-navigate',e=>e.preventDefault());
 win.on('close',e=>{if(!closing){e.preventDefault();void close();}});win.once('ready-to-show',async()=>{if(!test)win.show();if(probe){const elapsed=Date.now()-Number(process.env.LUNELLE_SETUP_PROBE_STARTED);let engineStaged=true;try{await fs.access(path.join(process.resourcesPath,'engine/Lunelle-Engine.exe'));}catch{engineStaged=false;}await fs.writeFile(probe,JSON.stringify({readyMs:elapsed,nsisToReadyMs:Math.round(require('node:os').uptime()*1000)-Number(process.env.LUNELLE_SETUP_ENTRY_TICK),cached:process.env.LUNELLE_SETUP_CACHE_HIT==='1',engineStaged,version}));setTimeout(()=>app.exit(0),800);}});
 handle('setup:read',async()=>({version,preview:preview||test,directory:await existingDirectory(),...require('./locale-zh.cjs'),status}));
 handle('setup:browse',async()=>{if(busy)return null;const r=await dialog.showOpenDialog(win,{title:'为 Lunelle 选择安装位置',properties:['openDirectory','createDirectory']});return r.canceled?null:r.filePaths[0];});
 handle('setup:close',close);ipcMain.on('setup:minimize',e=>{if(isTrusted(e))win.minimize();});
 ipcMain.on('setup:shape',(e,rects)=>{if(!isTrusted(e)||!Array.isArray(rects)||rects.length>800)return;const[w,h]=win.getSize();if(rects.every(r=>['x','y','width','height'].every(k=>Number.isInteger(r[k]))&&r.x>=0&&r.y>=0&&r.width>0&&r.height>0&&r.x+r.width<=w&&r.y+r.height<=h))win.setShape(rects);});
 handle('setup:install',async choices=>{
  if(busy)return{ok:false,error:'安装正在进行。'};
  if(preview||test)return{ok:false,error:'这是设计预览，不会安装程序。'};
  let dir;try{
   if(choices?.accepted!==true)throw Error('请先阅读并同意许可条款。');
   dir=validateDirectory(choices.directory);await fs.mkdir(dir,{recursive:true});await fs.access(dir,require('node:fs').constants.W_OK);
   const files=await fs.readdir(dir);if(files.length&&!files.includes('Lunelle.exe'))throw Error('这个文件夹已有其他文件，请选择空文件夹或原 Lunelle 安装目录。');
  }catch(e){return{ok:false,error:e.message};}
  busy=true;send({stage:'preparing',message:'正在准备安装文件，请稍候。'});
  let enginePath;try{enginePath=await prepareEngine();}catch(e){busy=false;send({stage:'error',message:e.message});return{ok:false,error:e.message};}
  send({stage:'installing',message:'正在写入应用与角色素材，请稍候。'});
  const args=['/S','/currentuser'];if(!choices.desktop)args.push('/LUNELLENODESKTOP');if(!choices.menu)args.push('/LUNELLENOMENU');
  const engine=spawn(enginePath,args,{windowsHide:true,env:{...process.env,LUNELLE_INSTALL_DIRECTORY:dir}});
  let complete=false;const fail=error=>{if(complete)return;complete=true;busy=false;send({stage:'error',message:error});};
  engine.on('error',()=>fail('无法启动安装引擎，请重新下载安装包后重试。'));
  engine.on('exit',async code=>{if(complete)return;if(code!==0)return fail(`安装未完成（代码 ${code}）。请检查目录权限或是否有程序占用文件，再重试。`);try{await fs.access(path.join(dir,'Lunelle.exe'));await fs.access(path.join(dir,'resources','app.asar'));complete=true;installed=dir;busy=false;send({stage:'done',message:'安装完成'});}catch{fail('安装引擎已退出，但没有找到完整程序，请重新选择安装位置。');}});
  return{ok:true};
 });
 handle('setup:finish',async launch=>{if(!installed)return false;if(launch===true){const child=spawn(path.join(installed,'Lunelle.exe'),[],{cwd:installed,detached:true,stdio:'ignore'});await new Promise((resolve,reject)=>{child.once('spawn',resolve);child.once('error',reject);});child.unref();}return close();});
 await win.loadFile(path.join(root,'index.html'),test?{query:{test:'1'}}:{});
 if(test){try{await require('./test.cjs')({win,root});app.exit(0);}catch(e){console.error(e);app.exit(1);}}
});
app.on('window-all-closed',()=>app.quit());
