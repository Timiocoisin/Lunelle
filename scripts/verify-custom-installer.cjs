'use strict';
// Verify a /ENGINEONLY extraction from the final bootstrap without installing.
const fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawnSync}=require('node:child_process'),asar=require('@electron/asar');
const root=path.resolve(__dirname,'..'),version=require('../package.json').version;
const hash=file=>new Promise((resolve,reject)=>{const h=crypto.createHash('sha256'),s=fs.createReadStream(file);s.on('data',b=>h.update(b));s.on('error',reject);s.on('end',()=>resolve(h.digest('hex')));});
async function main(){
 const out=path.join(root,'artifacts','installer-v'+version),installer=path.join(root,'installers',`Lunelle-Setup-${version}-x64.exe`),engine=path.join(out,'engine-extracted','Lunelle-Engine.exe');
 assert.equal(await hash(engine),await hash(path.join(root,'.local/installer-engine/Lunelle-Engine.exe')),'bootstrap contains current install engine');
 const payload=path.join(out,'payload');await fsp.mkdir(payload,{recursive:true});
 const seven=path.join(root,'.local/installer-tools/7zip/7zip/bin/7za.exe');
 const result=spawnSync(seven,['x',engine,'-o'+payload,'resources\\app.asar','-y','-bso0','-bsp0'],{windowsHide:true,encoding:'utf8'});
 if(result.error)throw result.error;if(result.status!==0&&result.status!==1)throw Error(result.stderr||result.stdout||'Payload extraction failed');
 const archive=path.join(payload,'resources/app.asar'),portable=path.join(root,'dist/Lunelle-win32-x64/resources/app.asar');
 assert.equal(await hash(archive),await hash(portable),'installed application matches reviewed portable archive');
 const appPackage=JSON.parse(asar.extractFile(archive,'package.json'));assert.equal(appPackage.version,version);
 const wizard=JSON.parse(asar.extractFile(path.join(root,'dist/Lunelle-Installer-win32-x64/resources/app.asar'),'installer-ui/package.json'));assert.equal(wizard.version,version);
 const files=asar.listPackage(archive),artwork={};
 for(const suffix of ['classic/shared-walk/walk.webp','queen/v2/walk.webp']){
  const name=files.find(f=>f.replaceAll('\\','/').endsWith(suffix));assert.ok(name,suffix);
  const shipped=crypto.createHash('sha256').update(asar.extractFile(archive,name.slice(1))).digest('hex');
  assert.equal(shipped,await hash(path.join(root,'assets/characters',suffix)));artwork[suffix]=shipped;
 }
 const builtAt=(await fsp.stat(installer)).mtimeMs;
 for(const file of [path.join(out,'startup-first.json'),path.join(out,'startup-cached.json'),path.join(root,'artifacts/installer-final/report.json')])assert.ok((await fsp.stat(file)).mtimeMs>=builtAt,'stale installer verification record: '+file);
 const first=JSON.parse(await fsp.readFile(path.join(out,'startup-first.json'),'utf8')),cached=JSON.parse(await fsp.readFile(path.join(out,'startup-cached.json'),'utf8'));
 for(const probe of[first,cached]){assert.equal(probe.version,version);assert.equal(probe.engineStaged,false);}assert.equal(cached.cached,true);
 const design=JSON.parse(await fsp.readFile(path.join(root,'artifacts/installer-final/report.json'),'utf8'));assert.equal(design.ok,true);assert.equal(design.version,version);
 const sha256=await hash(installer),line=`${sha256}  ${path.basename(installer)}\n`;
 await fsp.writeFile(path.join(root,'installers',`SHA256SUMS-v${version}.txt`),line);
 await fsp.mkdir(path.join(root,'docs/releases'),{recursive:true});await fsp.writeFile(path.join(root,'docs/releases',`SHA256SUMS-v${version}.txt`),line);
 const report={ok:true,version,installer:path.basename(installer),bytes:(await fsp.stat(installer)).size,sha256,engineMatchesBuilt:true,applicationMatchesPortable:true,artworkMatchesSources:true,artwork,wizardVersion:wizard.version,applicationVersion:appPackage.version,design,startup:{first,cached}};
 await fsp.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
