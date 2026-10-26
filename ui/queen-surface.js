'use strict';
// Render intact queen artwork through one continuous UV mesh.
(()=>{
 class QueenSurface{
  constructor(size=768){
   this.canvas=document.createElement('canvas');this.canvas.width=this.canvas.height=size;
   const gl=this.gl=this.canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:true});
   this.images=new Map();this.size=size;
   if(!gl){this.ctx=this.canvas.getContext('2d');return;}
   const shader=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
   const p=this.program=gl.createProgram();
   gl.attachShader(p,shader(gl.VERTEX_SHADER,'attribute vec2 position;attribute vec2 uv;varying vec2 tex;void main(){tex=uv;gl_Position=vec4(position,0.,1.);}'));
   gl.attachShader(p,shader(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 tex;uniform sampler2D art;uniform sampler2D closed;uniform float eyes;uniform vec4 eyeBox;void main(){vec4 base=texture2D(art,tex);vec2 d=(tex-eyeBox.xy)/eyeBox.zw;float mask=1.-smoothstep(.65,1.,length(d));gl_FragColor=mix(base,texture2D(closed,tex),mask*eyes);}`));
   gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));gl.useProgram(p);
   this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
   for(const[name,offset]of [['position',0],['uv',8]]){const i=gl.getAttribLocation(p,name);gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,2,gl.FLOAT,false,16,offset);}
   gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
   gl.uniform1i(gl.getUniformLocation(p,'art'),0);gl.uniform1i(gl.getUniformLocation(p,'closed'),1);
  }
  texture(image){
   if(this.images.has(image))return this.images.get(image);
   const gl=this.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
   for(const[name,value]of [[gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE],[gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE],[gl.TEXTURE_MIN_FILTER,gl.LINEAR],[gl.TEXTURE_MAG_FILTER,gl.LINEAR]])gl.texParameteri(gl.TEXTURE_2D,name,value);
   gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);this.images.set(image,t);return t;
  }
  render(image,closed,m,eyeBox){
   const gl=this.gl,S=this.size;
   if(!gl){
    // The software path uses the same vertices, including real head/arm motion.
    const texture=document.createElement('canvas');texture.width=texture.height=S;
    const t=texture.getContext('2d');t.drawImage(image,0,0,S,S);
    if(m.eyes>0&&closed!==image){t.save();t.beginPath();t.ellipse(eyeBox[0]*S,eyeBox[1]*S,eyeBox[2]*S,eyeBox[3]*S,0,0,Math.PI*2);t.clip();t.globalAlpha=m.eyes;t.drawImage(closed,0,0,S,S);t.restore();}
    const c=this.ctx;c.clearRect(0,0,S,S);const N=16;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(const ids of [[[x,y],[x+1,y],[x,y+1]],[[x,y+1],[x+1,y],[x+1,y+1]]]){
     const src=ids.map(([a,b])=>[a/N*S,b/N*S]),dst=ids.map(([a,b])=>window.xyQueenMotion.point(a/N,b/N,m).map(v=>v*S));
     const [p,q,r]=src,[a,b,d]=dst,det=(q[0]-p[0])*(r[1]-p[1])-(r[0]-p[0])*(q[1]-p[1]);
     const A=((b[0]-a[0])*(r[1]-p[1])-(d[0]-a[0])*(q[1]-p[1]))/det;
     const B=((b[1]-a[1])*(r[1]-p[1])-(d[1]-a[1])*(q[1]-p[1]))/det;
     const C=((d[0]-a[0])*(q[0]-p[0])-(b[0]-a[0])*(r[0]-p[0]))/det;
     const D=((d[1]-a[1])*(q[0]-p[0])-(b[1]-a[1])*(r[0]-p[0]))/det;
     c.save();c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineTo(...d);c.closePath();c.clip();c.setTransform(A,B,C,D,a[0]-A*p[0]-C*p[1],a[1]-B*p[0]-D*p[1]);c.drawImage(texture,0,0);c.restore();
    }
    return this.canvas;
   }
   gl.useProgram(this.program);const data=[],N=32;
   for(let y=0;y<N;y++)for(let x=0;x<N;x++)for(const[a,b]of [[x,y],[x+1,y],[x,y+1],[x,y+1],[x+1,y],[x+1,y+1]]){
    const u=a/N,v=b/N,[px,py]=window.xyQueenMotion.point(u,v,m);data.push(px*2-1,1-py*2,u,v);
   }
   gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.DYNAMIC_DRAW);
   gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.texture(image));
   gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.texture(closed));
   gl.uniform1f(gl.getUniformLocation(this.program,'eyes'),m.eyes);gl.uniform4fv(gl.getUniformLocation(this.program,'eyeBox'),eyeBox);
   gl.viewport(0,0,S,S);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,N*N*6);return this.canvas;
  }
 }
 window.QueenSurface=QueenSurface;
})();
