'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
// All positions are screen DIPs. The transparent host stays stationary while
// the sprite moves in its compositor layer; native and DOM offsets never mix.
class PetMotion {
  constructor({window,cursor,display,notify=()=>{},save=()=>{},scale=.88,autoTick=true}){
    Object.assign(this,{window,cursor,display,notify,save,scale,autoTick});
    this.start=null;this.activity='idle';this.facing='right';this.position=null;this.timer=null;this.last=null;
  }
  get active(){return this.start!==null;}
  configure(scale,position=this.position){
    if(this.active)this.end();
    this.scale=scale;
    const b=this.window.getBounds();
    this.place(position||{x:b.x+b.width-240*scale-16,y:b.y+b.height-232*scale-8});
  }
  place(position){
    const area=this.display({x:Math.round(position.x+120*this.scale),y:Math.round(position.y+116*this.scale)}).workArea;
    this.area=area;
    this.position={x:clamp(position.x,area.x,area.x+area.width-240*this.scale),y:clamp(position.y,area.y,area.y+area.height-232*this.scale)};
    if(!this.hostArea||['x','y','width','height'].some(k=>this.hostArea[k]!==area[k])){this.window.setBounds({...area});this.hostArea={...area};}
    this.updateFacing();
  }
  updateFacing(extra={}){
    if(!this.position)return;
    const a=this.area,b=this.window.getBounds(),s=this.scale,p=this.position;
    // Reserve the complete above-the-page companion, including on short displays.
    const panelScale=Math.min(s,(a.height-12)/1000),w=500*panelScale,h=1000*panelScale,gap=12*s;
    // Panel placement never changes the character's walking direction.
    let x=p.x-130*s,y=p.y-h-gap;
    if(y<a.y+4){
      if(p.y+232*s+gap+h<=a.y+a.height-4)y=p.y+232*s+gap;
      else {x=p.x+240*s+gap+w<=a.x+a.width-4?p.x+240*s+gap:p.x-w-gap;y=p.y+(232*s-h)/2;}
    }
    x=clamp(x,a.x+4,a.x+a.width-w-4);y=clamp(y,a.y+4,a.y+a.height-h-4);
    const value={activity:this.activity,dragMoved:!!this.moved&&this.active,dragging:this.active,facing:this.facing,scale:s,panelScale,petLeft:(p.x-b.x)/s,petTop:(p.y-b.y)/s,panelLeft:(x-b.x)/s,panelTop:(y+270*panelScale-b.y)/s,...extra};
    const serialized=JSON.stringify(value);
    if(serialized!==this.last){this.last=serialized;this.notify(value);}
  }
  setActivity(name,direction='right'){this.activity=name;this.facing=name==='walk'&&direction==='left'?'left':'right';this.updateFacing();}
  settle(){this.updateFacing();}
  begin(){
    if(this.active||!this.position)return;
    this.start={position:{...this.position},pointer:{...this.cursor()}};this.moved=false;this.facing='right';
    this.window.setIgnoreMouseEvents(false);this.updateFacing();
    if(this.autoTick){this.timer=setInterval(()=>this.move(),16);this.timer.unref?.();}
  }
  move(){
    if(!this.active)return;
    const pointer=this.cursor(),dx=pointer.x-this.start.pointer.x,dy=pointer.y-this.start.pointer.y;
    this.moved ||= Math.hypot(dx,dy)>4;
    if(!this.moved)return;
    this.place({x:this.start.position.x+dx,y:this.start.position.y+dy});
  }
  end(activate=false){
    if(!this.active)return;
    this.move();clearInterval(this.timer);this.timer=null;
    const togglePanel=activate&&!this.moved,landed=!!this.moved;this.start=null;this.updateFacing({togglePanel,landed});
    if(this.moved)this.save({...this.position,petOffset:0,positionVersion:3});
  }
}
module.exports={PetMotion};
