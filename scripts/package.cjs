'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os');
const packager=require('@electron/packager');const{makeIcon}=require('./make-icon.cjs');
const root=path.join(__dirname,'..');
async function main(){const artwork=process.argv.includes('--with-artwork');const stage=await fs.mkdtemp(path.join(os.tmpdir(),'xingyue-release-'));
  try{
    for(const folder of['app','ui'])await fs.cp(path.join(root,folder),path.join(stage,folder),{recursive:true});
    await fs.mkdir(path.join(stage,'tests'),{recursive:true});for(const file of['fixture.cjs','ui-runner.cjs'])await fs.copyFile(path.join(root,'tests',file),path.join(stage,'tests',file));
    await fs.mkdir(path.join(stage,'assets'),{recursive:true});await fs.cp(path.join(root,'assets/fonts'),path.join(stage,'assets/fonts'),{recursive:true});
    await fs.copyFile(path.join(root,'assets/moon.svg'),path.join(stage,'assets/moon.svg'));makeIcon(path.join(stage,'assets/icon.png'));
    if(artwork)await fs.cp(path.join(root,'assets/characters'),path.join(stage,'assets/characters'),{recursive:true});
    else {await fs.mkdir(path.join(stage,'assets/characters'),{recursive:true});for(const name of['portrait.png','pet.png'])await fs.copyFile(path.join(stage,'assets/icon.png'),path.join(stage,'assets/characters',name));}
    for(const file of['LICENSE','ASSETS.md','README.md','THIRD_PARTY.md'])await fs.copyFile(path.join(root,file),path.join(stage,file));
    const pkg=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));delete pkg.devDependencies;delete pkg.scripts;await fs.writeFile(path.join(stage,'package.json'),JSON.stringify(pkg,null,2));
    const archive=path.join(root,'.local',`electron-v44.7.2-${process.platform}-${process.arch}.zip`);
    const localZip=await fs.access(archive).then(()=>path.dirname(archive),()=>undefined);
    const output=await packager({dir:stage,name:'Xingyue',executableName:'Xingyue',appBundleId:'io.xingyue.desktop',appCopyright:'Xingyue contributors',platform:process.platform,arch:process.arch,electronVersion:'44.7.2',electronZipDir:localZip,icon:path.join(stage,'assets/icon.ico'),out:path.join(root,'dist'),overwrite:true,asar:true,prune:false,win32metadata:{ProductName:'Xingyue',FileDescription:'Xingyue desktop companion'}});
    console.log('Built:',output.join('\n'));console.log(artwork?'Contains owner-provided character artwork; review ASSETS.md before redistribution.':'Public-safe build: local character PNGs omitted; moon/star fallback enabled.');
  }finally{if(!stage.startsWith(path.join(os.tmpdir(),'xingyue-release-')))throw new Error('Invalid staging directory');await fs.rm(stage,{recursive:true,force:true});}
}
main().catch(()=>{console.error('Build failed; check dependency installation and write permissions.');process.exitCode=1;});
