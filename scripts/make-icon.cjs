'use strict';
// Original rasterization of the moon/star mark; no borrowed app icon.
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
function crc32(data){let c=0xffffffff;for(const byte of data){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
function chunk(type,data){const t=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([t,data])));return Buffer.concat([length,t,data,crc]);}
function makeIcon(file){const n=128,raw=Buffer.alloc((n*4+1)*n);const star=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?10:22;star.push([91+Math.cos(a)*r,39+Math.sin(a)*r]);}
const inside=(x,y)=>{let yes=false;for(let i=0,j=star.length-1;i<star.length;j=i++){const a=star[i],b=star[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
for(let y=0;y<n;y++)for(let x=0;x<n;x++){let color=[0,0,0,0];const moon=(x-62)**2+(y-66)**2<49**2&&((x-82)**2+(y-45)**2>43**2);if(moon)color=[169,143,213,255];if(inside(x,y))color=[247,221,164,255];const offset=y*(n*4+1)+1+x*4;raw.set(color,offset);}
const header=Buffer.alloc(13);header.writeUInt32BE(n,0);header.writeUInt32BE(n,4);header[8]=8;header[9]=6;
fs.mkdirSync(path.dirname(file),{recursive:true});const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);fs.writeFileSync(file,png);
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico[6]=128;ico[7]=128;ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);fs.writeFileSync(file.replace(/\.png$/,'.ico'),Buffer.concat([ico,png]));}
if(require.main===module)makeIcon(path.join(__dirname,'../assets/icon.png'));module.exports={makeIcon};
