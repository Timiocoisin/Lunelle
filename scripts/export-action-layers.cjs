const{app,nativeImage}=require('electron'),fs=require('fs'),path=require('path');app.whenReady().then(()=>{const root=path.resolve(__dirname,'..'),S=887,log=[];
 function part(file,lo,hi){const img=nativeImage.createFromPath(path.join(root,file)),{width,height}=img.getSize(),b=img.toBitmap();let x0=hi,y0=height,x1=lo,y1=0;for(let y=0;y<height;y++)for(let x=lo;x<hi;x++)if(b[(y*width+x)*4+3]>100){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}return{image:img.crop({x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}),bounds:{x0,y0,x1,y1}};}
 function put(name,part,h,x,y){const src=part.image.resize({height:h,quality:'best'}),{width,height}=src.getSize(),b=src.toBitmap(),out=Buffer.alloc(S*S*4);x=Math.round(x===null?(S-width)/2:x);y=Math.round(y);for(let v=0;v<height;v++)for(let u=0;u<width;u++){const dx=x+u,dy=y+v;if(dx>=0&&dx<S&&dy>=0&&dy<S)b.copy(out,(dy*S+dx)*4,(v*width+u)*4,(v*width+u+1)*4);}fs.writeFileSync(path.join(root,'assets/characters',name+'.png'),nativeImage.createFromBitmap(out,{width:S,height:S}).toPNG());log.push({name,...part.bounds,x,y,width,height});}
 const wave='docs/design/lunelle-wave-rig-v1.png',lift='docs/design/lunelle-lift-rig-v1.png';
 put('wave-body',part(wave,0,1020),865,null,10);
 put('wave-arm',part(wave,1190,1774),250,511,343);
 put('lift-body',part(lift,0,815),790,null,10);
 put('lift-leg-left',part(lift,850,1300),278,300,595);
 put('lift-leg-right',part(lift,1450,2172),278,455,595);
 console.log(JSON.stringify(log));fs.writeFileSync(path.join(root,'artifacts/action-layer-registration.json'),JSON.stringify(log,null,2));app.quit();});
