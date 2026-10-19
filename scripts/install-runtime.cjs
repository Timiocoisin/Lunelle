'use strict';
// Optional verified local ZIP install when the platform downloader is blocked.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const folder=path.join(__dirname,'../node_modules/electron'),version=require(path.join(folder,'package.json')).version;
const filename=`electron-v${version}-${process.platform}-${process.arch}.zip`,archive=path.join(__dirname,'../.local',filename);
const expected=require(path.join(folder,'checksums.json'))[filename];
if(!expected||crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex')!==expected)throw new Error('Official Electron ZIP checksum mismatch');
const dist=path.join(folder,'dist');fs.mkdirSync(dist,{recursive:true});execFileSync('tar',['-xf',archive,'-C',dist],{stdio:'inherit'});
const executable=process.platform==='win32'?'electron.exe':process.platform==='darwin'?'Electron.app/Contents/MacOS/Electron':'electron';fs.writeFileSync(path.join(folder,'path.txt'),executable);console.log('Verified official runtime installed:',version);
