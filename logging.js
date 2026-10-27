// Server-scoped, persistent, at-least-once log delivery.
export function cleanLog(value){return String(value??'').replace(/@/g,'@\u200b').replace(/\u0000/g,'').slice(0,1750);}
export class LogService{
 constructor({state,save,bot,serverId,autoFlush=false}){this.state=state;this.save=save;this.bot=bot;this.serverId=String(serverId);this.busy=false;this.autoFlush=autoFlush;this.scheduled=false;state.logs||={enabled:true,channelId:'',pending:[],lastError:'',lastSent:''};}
 async setChannel(id){
  const channel=await this.bot.channel(id);
  if(!channel||String(channel.server_id)!==this.serverId||!['text'].includes(channel.kind??channel.type))throw Error('Choose a text channel in this server that Vigil can access.');
  this.state.logs.channelId=String(id);this.state.logs.enabled=true;await this.save();
 }
 async enqueue(text,type='general',persist=true){
  const log=this.state.logs;if(!log.enabled||!log.channelId||this.state.logTypes?.[type]===false)return;
  if(log.pending.length>=500){log.dropped=(log.dropped||0)+1;if(persist)await this.save();console.error('Log queue full; event remains in local audit where applicable.');return;}
  log.pending.push({text:cleanLog(text),time:new Date().toISOString()});if(persist){await this.save();this.requestFlush();}
 }
 requestFlush(){
  if(!this.autoFlush||this.scheduled||!this.state.logs.enabled||!this.state.logs.channelId||!this.state.logs.pending.length)return;this.scheduled=true;
  const timer=setTimeout(()=>{this.scheduled=false;this.flush().catch(e=>console.error('Log worker:',e.message));},30);timer.unref?.();
 }
 async flush(){
  if(this.busy)return;const log=this.state.logs;if(!log.enabled||!log.channelId||!log.pending.length)return;
  this.busy=true;
  try{
   const replacement=this.state.replacements?.[log.channelId];if(replacement){log.channelId=replacement;await this.save();}
   const channel=await this.bot.channel(log.channelId);
   if(!channel||String(channel.server_id)!==this.serverId)throw Error('Log channel missing or inaccessible. Use !setlogs in another staff channel.');
   // Drain a bounded batch. API rate limits are handled by the SDK.
   for(let n=0;n<5&&log.pending.length;n++){
    const event=log.pending[0];await this.bot.send(log.channelId,`[VIGIL LOG] ${event.time}\n${event.text}`);
    log.pending.shift();log.lastSent=new Date().toISOString();log.lastError='';await this.save();
   }
  }catch(e){log.lastError=String(e.message).slice(0,500);await this.save();console.error('LOG DELIVERY:',e.message);}
  finally{this.busy=false;if(!log.lastError&&log.pending.length&&log.enabled)this.requestFlush();}
 }
}
