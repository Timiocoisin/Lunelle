'use strict';
// Different app identity/executable/shortcut names isolate this from the user's pet.
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process'),{createHash}=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),work=path.join(root,'artifacts/installer-engine-test'),source=path.join(work,'source'),target=path.join(work,'中文 path','Lunelle');
const run=(exe,args,env=process.env)=>new Promise((resolve,reject)=>{const child=spawn(exe,args,{cwd:root,env,windowsHide:true,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Process failed: '+code)));});
const hash=async file=>createHash('sha256').update(await fs.readFile(file)).digest('hex');
async function main(){
 await fs.mkdir(work,{recursive:true});await fs.cp(path.join(root,'dist/Lunelle-win32-x64'),source,{recursive:true});
 try{await fs.rename(path.join(source,'Lunelle.exe'),path.join(source,'Lunelle-Integration-Test.exe'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const nsis=path.join(root,'.local/installer-tools/nsis/nsis-bundle'),env={...process.env,LUNELLE_ENGINE_INTEGRATION:'1',ELECTRON_BUILDER_NSIS_DIR:nsis,ELECTRON_BUILDER_NSIS_RESOURCES_DIR:nsis,ELECTRON_BUILDER_7ZIP_PATH:path.join(root,'.local/installer-tools/7zip/7zip/bin/7za.exe')};
 await run(process.execPath,[require.resolve('electron-builder/cli.js'),'--config','installer-ui/engine-config.cjs','--prepackaged',source,'--win','nsis','--x64'],env);
 const engine=path.join(root,'.local/installer-engine-test/Lunelle-Engine.exe'),args=['/S','/currentuser','/LUNELLENODESKTOP','/LUNELLENOMENU'],installEnv={...process.env,LUNELLE_INSTALL_DIRECTORY:target};
 await run(engine,args,installEnv);assert.equal(await hash(path.join(source,'resources/app.asar')),await hash(path.join(target,'resources/app.asar')),'installs exact archive at Unicode/spaced target');
 await fs.writeFile(path.join(target,'upgrade-marker.txt'),'preserve');await run(engine,args,installEnv);assert.equal(await hash(path.join(source,'resources/app.asar')),await hash(path.join(target,'resources/app.asar')),'upgrade writes expected archive');
 const uninstaller=(await fs.readdir(target)).find(n=>/^Uninstall.*\.exe$/i.test(n));assert.ok(uninstaller,'registered uninstall executable exists');
 await run(path.join(target,uninstaller),['/S']);
 for(let i=0;i<40;i++){try{await fs.access(path.join(target,'Lunelle-Integration-Test.exe'));await new Promise(r=>setTimeout(r,250));}catch{break;}}
 await assert.rejects(()=>fs.access(path.join(target,'Lunelle-Integration-Test.exe')),'uninstall removes test app');
 const report={ok:true,identity:'io.xingyue.installer.integration',unicodeAndSpacedPath:true,archiveVerified:true,upgradeVerified:true,uninstallVerified:true};await fs.writeFile(path.join(work,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
