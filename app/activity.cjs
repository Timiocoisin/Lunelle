'use strict';
const gait=require('../ui/walk-timeline.js');
// Autonomous travel never writes preferences and never selects another display.
class PetActivity {
  constructor({motion,cursor,now=()=>Date.now(),random=Math.random}){
    Object.assign(this,{motion,cursor,now,random});this.enabled=false;this.mode='still';this.panel=false;this.suspended=false;this.leg=null;this.holdUntil=0;this.wait();
  }
  wait(){this.next=this.now()+15000+this.random()*10000;}
  configure({activityEnabled=false,activityMode='still'}){this.enabled=activityEnabled;this.mode=activityMode;this.interrupt();}
  interrupt(){this.quickStart=false;this.leg=null;this.motion.setActivity('idle');this.wait();}
  hold(milliseconds){this.interrupt();this.holdUntil=this.now()+milliseconds;}
  setPanel(value){if(this.panel===value)return;this.panel=value;this.interrupt();}
  suspend(value){if(this.suspended===value)return;this.suspended=value;this.interrupt();}

  tick(){
    const m=this.motion,t=this.now();
    if(!m.position||!this.enabled||this.panel||this.suspended||m.active||t<this.holdUntil){
      const quick=this.quickStart&&this.enabled&&!this.panel&&!this.suspended&&!m.active;
      if(this.leg||m.activity!=='idle')this.interrupt();else this.wait();
      if(quick){this.quickStart=true;this.next=t+3000;}return;
    }
    if(this.leg){
      const leg=this.leg,a=m.area;
      if(['x','y','width','height'].some(k=>a[k]!==leg.area[k])){this.interrupt();return;}
      const progress=Math.min(1,(t-leg.at)/leg.duration);
      m.place({x:leg.start.x+(leg.target.x-leg.start.x)*progress,y:leg.start.y+(leg.target.y-leg.start.y)*progress});
      if(progress===1){this.leg=null;m.setActivity('idle');this.wait();}
      return;
    }
    if(t<this.next)return;
    if(m.activity==='look'){m.setActivity('idle');this.wait();return;}
    if(this.mode==='still'){m.setActivity('look');this.next=t+2400;return;}
    const a=m.area,s=m.scale,start={...m.position};
    let target={x:a.x+this.random()*Math.max(0,a.width-240*s),y:a.y+this.random()*Math.max(0,a.height-232*s)};
    let distance=Math.hypot(target.x-start.x,target.y-start.y);
    if(distance<40){this.wait();return;}
    this.quickStart=false;
    const cycleSeconds=gait.cycle/1000+this.random()*.15;
    const speed=gait.stride*232/gait.referenceSize*s/cycleSeconds;
    const cycles=Math.ceil(8/cycleSeconds)+Math.floor(this.random()*(Math.floor(15/cycleSeconds)-Math.ceil(8/cycleSeconds)+1));
    const duration=cycles*cycleSeconds*1000,desired=speed*duration/1000;
    if(distance<desired){
      const corners=[{x:a.x,y:a.y},{x:a.x+a.width-240*s,y:a.y},{x:a.x,y:a.y+a.height-232*s},{x:a.x+a.width-240*s,y:a.y+a.height-232*s}];
      target=corners.sort((a,b)=>Math.hypot(b.x-start.x,b.y-start.y)-Math.hypot(a.x-start.x,a.y-start.y))[0];distance=Math.hypot(target.x-start.x,target.y-start.y);
    }
    const ratio=Math.min(1,desired/distance);target={x:start.x+(target.x-start.x)*ratio,y:start.y+(target.y-start.y)*ratio};
    this.leg={start,target,area:{...a},at:t,duration};
    m.setActivity('walk',target.x<start.x?'left':'right');
  }
  requestWalk(delay=3000){this.interrupt();this.quickStart=true;this.next=this.now()+delay;}
  snapshot(){
    let reason=!this.enabled?'disabled':this.suspended?'settings':this.panel?'panel':this.motion.active?'drag':this.leg?'walking':this.motion.activity==='look'?'looking':'waiting';
    return {reason,mode:this.mode,remaining:Math.max(0,Math.ceil((this.next-this.now())/1000))};
  }
  close(){this.interrupt();}
}
module.exports={PetActivity};
