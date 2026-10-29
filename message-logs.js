const safe=value=>String(value??'Not provided by Yapin').replace(/@/g,'@\u200b').replace(/\u0000/g,'').slice(0,1100);
export function createMessageLogs({logger,bot,cfg}){
 const cache=new Map(),seen=new Map();
 return {
 remember(m){if(!m.id||!m.channel_id)return;cache.set(String(m.id),{author:m.author_id,text:m.content,channel:m.channel_id,time:Date.now()});while(cache.size>500)cache.delete(cache.keys().next().value);},
 async deleted(ev){
  const id=String(ev.message_id??ev.id??''),cached=cache.get(id);if(cached&&Date.now()-cached.time>3600000)cache.delete(id);
  const saved=cache.get(id);const channelId=ev.channel_id??saved?.channel;if(!channelId)return;
  const ch=await bot.channel(channelId);if(String(ch?.server_id)!==String(cfg.serverId))return;
  const now=Date.now();for(const [key,time]of seen)if(now-time>=60000)seen.delete(key);if(id&&seen.has(id))return;if(id)seen.set(id,now);
  const author=ev.author_id??saved?.author,actor=ev.deleted_by??ev.actor_id??ev.moderator_id;
  await logger.enqueue('MESSAGE DELETED | #'+safe(ch.name||'channel')+'\nMessage: '+safe(id||undefined)+'\nWritten by: '+safe(author)+'\nDeleted by: '+safe(typeof actor==='object'?actor?.id:actor)+'\nText: '+safe(ev.content??saved?.text??'Unavailable: message was not cached or contained only attachments'),'moderation');
  cache.delete(id);
 }
 };
}
