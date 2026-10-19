'use strict';
// Explicitly invoked diagnostic: emits only a sanitized summary, never secrets/chat text.
const{readQuotas}=require('../app/quotas.cjs');
const{UsageIndex}=require('../app/usage.cjs');
const{Weather}=require('../app/weather.cjs');
const path=require('node:path'),os=require('node:os');
async function main(){const result={};for(const[name,task]of[['quota',()=>readQuotas(process.env.XINGYUE_CODEX_PATH||'')],['usage',()=>new UsageIndex().scan(process.env.CODEX_HOME||path.join(os.homedir(),'.codex'))],['weather',()=>new Weather().read('中山')]]){try{const value=await task();result[name]=name==='usage'?{files:value.files,weekTokens:value.weekTokens,todayTokens:value.todayTokens,partial:value.partial,model:value.model?.name}:value;}catch(e){result[name]={error:e.message};}}console.log(JSON.stringify(result,null,2));if(Object.values(result).some(r=>r.error))process.exitCode=1;}
main();
