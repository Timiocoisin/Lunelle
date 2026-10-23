'use strict';
const{app,nativeImage}=require('electron'),fs=require('node:fs/promises'),path=require('node:path');
app.whenReady().then(async()=>{try{
 const image=nativeImage.createFromPath(process.argv[2]),{width,height}=image.getSize(),data=image.toBitmap();console.log({width,height,cornerAlpha:data[3]});
 if(data[3]!==0)throw Error('Atlas background is not transparent; do not ship opaque sprite rectangles.');
 const out=path.resolve(__dirname,'../assets/installer/poses');await fs.mkdir(out,{recursive:true});
 const seen=new Uint8Array(width*height),groups=Array.from({length:6},()=>[]);
 // Segment complete sprites before dividing cells, so a curl cannot be cut off.
 for(let p=0;p<seen.length;p++){
  if(seen[p]||data[p*4+3]<16)continue;const queue=[p];seen[p]=1;let sx=0,sy=0;
  for(let q=0;q<queue.length;q++){const n=queue[q],cx=n%width,cy=Math.floor(n/width);sx+=cx;sy+=cy;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=cx+dx,ny=cy+dy,k=ny*width+nx;if(nx<0||nx>=width||ny<0||ny>=height||seen[k]||data[k*4+3]<16)continue;seen[k]=1;queue.push(k);}}
  if(queue.length>1500){const col=Math.min(2,Math.floor(sx/queue.length/(width/3))),row=Math.min(1,Math.floor(sy/queue.length/(height/2)));groups[row*3+col].push(queue);}
 }
 console.log(groups.map(g=>g.map(c=>c.length)));
 for(let i=0;i<6;i++){
  if(!groups[i].length)throw Error('Missing atlas pose '+i);const pixels=Buffer.alloc(data.length);let x0=width,y0=height,x1=0,y1=0;
  for(const component of groups[i])for(const p of component){const x=p%width,y=Math.floor(p/width);x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);data.copy(pixels,p*4,p*4,p*4+4);}
  const crop=nativeImage.createFromBitmap(pixels,{width,height}).crop({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}),size=crop.getSize(),scale=Math.min(492/size.width,492/size.height),sprite=crop.resize({width:Math.round(size.width*scale),height:Math.round(size.height*scale),quality:'best'}),s=sprite.getSize(),b=sprite.toBitmap(),canvas=Buffer.alloc(512*512*4),ox=Math.floor((512-s.width)/2),oy=Math.floor((512-s.height)/2);
  for(let y=0;y<s.height;y++)b.copy(canvas,((y+oy)*512+ox)*4,y*s.width*4,(y+1)*s.width*4);
  await fs.writeFile(path.join(out,`0${i+1}.png`),nativeImage.createFromBitmap(canvas,{width:512,height:512}).toPNG());
 }
 }catch(e){console.error(e.message);process.exitCode=1;}finally{app.exit(process.exitCode||0);}});
