'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process');
const packager=require('@electron/packager');
const root=path.resolve(__dirname,'..');
function run(exe,args,env=process.env){const r=spawnSync(exe,args,{cwd:root,env,stdio:'inherit',windowsHide:true});if(r.error)throw r.error;if(r.status!==0)throw Error('Installer build failed: '+r.status);}
async function main(){
 const version=require('../package.json').version,asar=require('@electron/asar');
 const archive=path.join(root,'dist/Lunelle-win32-x64/resources/app.asar');
 const packaged=JSON.parse(asar.extractFile(archive,'package.json'));
 if(packaged.version!==version)throw Error('便携版版本过期，请先运行 npm run build -- --with-artwork');
 const files=new Set(asar.listPackage(archive).map(name=>name.replace(/\\/g,'/').replace(/^\//,'')));
 for(const file of ['assets/characters/classic/shared-walk/walk.webp','assets/characters/queen/v2/walk.webp']){
  if(!files.has(file))throw Error('角色素材不完整，请先运行 npm run build -- --with-artwork');
 }
 const nsis=path.join(root,'.local/installer-tools/nsis/nsis-bundle'),seven=path.join(root,'.local/installer-tools/7zip/7zip/bin/7za.exe');
 const env={...process.env,ELECTRON_BUILDER_7ZIP_PATH:seven,ELECTRON_BUILDER_NSIS_DIR:nsis,ELECTRON_BUILDER_NSIS_RESOURCES_DIR:nsis};
 await fs.access(path.join(root,'assets/installer/poses/06.png'));
 run(process.execPath,[require.resolve('electron-builder/cli.js'),'--config','installer-ui/engine-config.cjs','--prepackaged','dist/Lunelle-win32-x64','--win','nsis','--x64'],env);
 const stage=await fs.mkdtemp(path.join(os.tmpdir(),'lunelle-setup-stage-'));
 try{
  await fs.cp(path.join(root,'installer-ui'),path.join(stage,'installer-ui'),{recursive:true});
  for(const file of ['LICENSE','ASSETS.md','THIRD_PARTY.md'])await fs.copyFile(path.join(root,file),path.join(stage,file));
  await fs.mkdir(path.join(stage,'assets/fonts'),{recursive:true});
  for(const font of ['LXGW975YuanSC-400W.ttf','LXGWMarkerGothic-Regular.ttf'])await fs.copyFile(path.join(root,'assets/fonts',font),path.join(stage,'assets/fonts',font));
  await fs.cp(path.join(root,'assets/fonts/licenses'),path.join(stage,'assets/fonts/licenses'),{recursive:true});
  await fs.cp(path.join(root,'assets/installer/poses'),path.join(stage,'assets/installer/poses'),{recursive:true});
  await fs.copyFile(path.join(root,'assets/installer/paper-master.png'),path.join(stage,'assets/installer/paper-master.png'));
  await fs.writeFile(path.join(stage,'package.json'),JSON.stringify({name:'lunelle-setup',version,main:'installer-ui/main.cjs',productName:'Lunelle Setup'}));
  await fs.writeFile(path.join(stage,'installer-ui/package.json'),JSON.stringify({version}));
  const[output]=await packager({dir:stage,name:'Lunelle-Installer',executableName:'Lunelle-Installer',platform:'win32',arch:'x64',electronVersion:'44.7.2',electronZipDir:path.join(root,'.local'),icon:path.join(root,'assets/icon.ico'),out:path.join(root,'dist'),overwrite:true,asar:true,prune:false,win32metadata:{ProductName:'Lunelle Setup',FileDescription:'Lunelle 安装手账'}});
  await fs.mkdir(path.join(output,'resources/engine'),{recursive:true});await fs.copyFile(path.join(root,'.local/installer-engine/Lunelle-Engine.exe'),path.join(output,'resources/engine/Lunelle-Engine.exe'));
  await fs.mkdir(path.join(root,'installers'),{recursive:true});
  const cacheId=require('node:crypto').createHash('sha256').update(await fs.readFile(path.join(output,'resources/app.asar'))).digest('hex').slice(0,16);
  run(path.join(nsis,'windows/makensis.exe'),['/V2','/INPUTCHARSET','UTF8',`/DCACHE_ID=${cacheId}`,`/DVERSION=${version}`,`/DPROJECT=${root}`,`/DWIZARD=${output}`,`/DOUTPUT=${path.join(root,`installers/Lunelle-Setup-${version}-x64.exe`)}`,path.join(root,'installer-ui/bootstrap.nsi')],{...process.env,NSISDIR:path.join(nsis,'windows')});
  console.log('Custom installer built: installers/Lunelle-Setup-'+version+'-x64.exe');
 }finally{if(!stage.startsWith(path.join(os.tmpdir(),'lunelle-setup-stage-')))throw Error('Unexpected stage');await fs.rm(stage,{recursive:true,force:true});}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
