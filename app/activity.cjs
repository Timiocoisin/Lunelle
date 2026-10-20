'use strict';
// Autonomous travel never writes preferences and never selects another display.
class PetActivity {
  constructor({motion,cursor,now=()=>Date.now(),random=Math.random}){
    Object.assign(this,{motion,cursor,now,random});this.enabled=false;this.mode='still';this.panel=false;this.suspended=false;this.leg=null;this.wait();
  }
  wait(){this.next=this.now()+30000+this.random()*30000;}
  configure({activityEnabled=false,activityMode='still'}){this.enabled=activityEnabled;this.mode=activityMode;this.interrupt();}
  interrupt(){this.quickStart=false;this.leg=null;this.motion.setActivity('idle');this.wait();}
  setPanel(value){if(this.panel===value)return;this.panel=value;this.interrupt();}
  suspend(value){if(this.suspended===value)return;this.suspended=value;this.interrupt();}
  near(){
    const p=this.motion.position,c=this.cursor(),s=this.motion.scale;if(!p)return true;
    const dx=Math.max(p.x-c.x,0,c.x-p.x-240*s),dy=Math.max(p.y-c.y,0,c.y-p.y-232*s);
    return Math.hypot(dx,dy)<100;
  }
  tick(){
    const m=this.motion,t=this.now();
    if(!m.position||!this.enabled||this.panel||this.suspended||m.active||this.near()){
      const quick=this.quickStart&&this.enabled&&!this.panel&&!this.suspended&&!m.active;
      if(this.leg||m.activity!=='idle')this.interrupt();else this.wait();
      if(quick){this.quickStart=true;this.next=t+3000;}return;
    }
    if(this.leg){
      const leg=this.leg,a=m.area;
      if(['x','y','width','height'].some(k=>a[k]!==leg.area[k])){this.interrupt();return;}
      const progress=Math.min(1,(t-leg.at)/leg.duration);
      m.place({x:leg.start.x+(leg.target.x-leg.start.x)*progress,y:leg.start.y+(leg.target.y-leg.start.y)*progress});
      if(progress===1){this.leg=null;m.setActivity('look');this.next=t+2400;}
      return;
    }
    if(t<this.next)return;
    if(m.activity==='look'){m.setActivity('idle');this.wait();return;}
    if(this.mode==='still'){m.setActivity('look');this.next=t+2400;return;}
    const a=m.area,s=m.scale,start={...m.position};
    const target={x:a.x+this.random()*Math.max(0,a.width-240*s),y:a.y+this.random()*Math.max(0,a.height-232*s)};
    const distance=Math.hypot(target.x-start.x,target.y-start.y);
    if(distance<40){this.wait();return;}
    this.quickStart=false;
    this.leg={start,target,area:{...a},at:t,duration:distance/(40+this.random()*18)*1000};
    m.setActivity('walk',target.x<start.x?'left':'right');
  }
  requestWalk(delay=3000){this.interrupt();this.quickStart=true;this.next=this.now()+delay;}
  snapshot(){
    let reason=!this.enabled?'disabled':this.suspended?'settings':this.panel?'panel':this.motion.active?'drag':this.near()?'cursor':this.leg?'walking':this.motion.activity==='look'?'looking':'waiting';
    return {reason,mode:this.mode,remaining:Math.max(0,Math.ceil((this.next-this.now())/1000))};
  }
  close(){this.interrupt();}
}
module.exports={PetActivity};
