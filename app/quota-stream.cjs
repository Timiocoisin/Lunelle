'use strict';
const { discover, ReadOnlyRpc, windows } = require('./quotas.cjs');
// Persistent, read-only JSON-RPC stream. Transport is local stdio, with no listening port.
class QuotaStream {
  constructor(onUpdate, { locate = discover, connect = file => new ReadOnlyRpc(file) } = {}) {
    this.onUpdate=onUpdate;this.locate=locate;this.connect=connect;this.client=null;this.explicit=null;this.plan='未提供';this.generation=0;this.closed=false;
  }
  publish(limits) {
    const value=windows(limits);
    if(!value.fiveHour&&!value.weekly)return null;
    const result={...value,plan:this.plan,at:Date.now(),status:'live'};
    this.onUpdate(result);return result;
  }
  async read(explicit='') {
    if(this.closed)throw new Error('读取连接已关闭');
    if(this.explicit!==explicit){this.reset();this.explicit=explicit;}
    const generation=this.generation;
    let client=this.client;
    try{
      if(!client||client.closed){
        const file=await this.locate(explicit);
        if(this.closed||generation!==this.generation)throw new Error('读取连接已更换');
        client=this.client=this.connect(file);
        client.on('limits',limits=>{if(this.client===client&&!this.closed)this.publish(limits);});
        await client.start();
      }
      const [account,limits]=await Promise.all([client.call('account/read',{refreshToken:false}),client.call('account/rateLimits/read')]);
      if(this.closed||generation!==this.generation)throw new Error('读取连接已更换');
      this.plan=account?.account?.planType||'未提供';
      return this.publish(limits)||{...windows(limits),plan:this.plan,at:Date.now(),status:'live'};
    }catch(error){if(this.client===client)this.reset();throw error;}
  }
  reset(){this.generation++;const client=this.client;this.client=null;client?.close();}
  close(){this.closed=true;this.reset();}
}
module.exports={QuotaStream};
