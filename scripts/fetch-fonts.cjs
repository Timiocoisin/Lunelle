'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const folder=path.join(__dirname,'../assets/fonts');
const sources=[
 ['Xiaolai-Regular.ttf','kose-font','v3.126','Xiaolai-Regular.ttf','e2f68daf0e72777a8cf58bc83de1b98634b251e537ddbfca24b0ae50d1802da2','master','Xiaolai'],
 ['Yozai-Medium.ttf','yozai-font','v0.868','Yozai-Medium.ttf','05f50f252b45197d0d6148a4abc3e37c7cd4cfdf03c955b57c25d53d924f835f','master','Yozai'],
 ['LXGW975YuanSC-400W.ttf','975Yuan','26.07.26','LXGW975YuanSC-400W.ttf','d14f5a453a221525f0db4887412712cbc03a84d0dc44ce2d22d51d1c136ed9a1','master','975Yuan'],
 ['LXGWMarkerGothic-Regular.ttf','LxgwMarkerGothic','v1.004','LxgwMarkerGothic-v1.004.zip','4a30c82200664d5366ed8ef822ee2085ad16c767862396b96b8924fd94297aa6','main','Marker']
];
async function get(url){const r=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw new Error('Font download failed: '+r.status);return Buffer.from(await r.arrayBuffer());}
async function main(){await fs.mkdir(path.join(folder,'licenses'),{recursive:true});for(const[file,repo,tag,asset,hash,branch,label]of sources){const content=await get(`https://github.com/lxgw/${repo}/releases/download/${tag}/${asset}?source=xingyue`);if(crypto.createHash('sha256').update(content).digest('hex')!==hash)throw new Error('Font integrity mismatch: '+file);
  if(asset.endsWith('.zip')){const temp=await fs.mkdtemp(path.join(os.tmpdir(),'xingyue-font-'));const archive=path.join(temp,'font.zip');await fs.writeFile(archive,content);const binary=execFileSync('tar',['-xOf',archive,'LxgwMarkerGothic-v1.004/fonts/ttf/LXGWMarkerGothic-Regular.ttf'],{maxBuffer:32*1024*1024});await fs.writeFile(path.join(folder,file),binary);await fs.rm(temp,{recursive:true,force:true});}else await fs.writeFile(path.join(folder,file),content);
  await fs.writeFile(path.join(folder,'licenses',`LICENSE-${label}.txt`),await get(`https://raw.githubusercontent.com/lxgw/${repo}/${branch}/OFL.txt`));console.log('Verified',file);
}}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
