const safe=value=>String(value??'Not provided by Yapin').replace(/@/g,'@\u200b').replace(/\u0000/g,'').slice(0,1100);
export function createMessageLogs({logger,bot,cfg}){
 const cache=new Map(),seen=new Map();
 const tracker={
 remember(m){if(!m.id||!m.channel_id)return;cache.set(String(m.id),{author:m.author_id,text:m.content,channel:m.channel_id,time:Date.now()});while(cache.size>500)cache.delete(cache.keys().next().value);},
 async sent(m){
  if(m.author_bot||String(m.author_id)===String(bot.me?.id)||String(m.channel_id)===String(logger.state?.logs?.channelId))return;
  tracker.remember(m);if(logger.state?.logs?.enabled===false||!logger.state?.logs?.channelId||logger.state?.logTypes?.messages===false)return;
  const channel=await bot.channel(m.channel_id);if(String(channel?.server_id)!==String(cfg.serverId))return;
  await logger.enqueue('MESSAGE SENT | #'+safe(channel.name||'channel')+'\nAuthor: '+safe(m.author_id)+'\nMessage: '+safe(m.id)+'\nText: '+safe(m.content||'[no text; attachments may be present]'),'messages');
 },
 async edited(ev){
  const id=String(ev.message_id??ev.id??''),old=cache.get(id),channelId=ev.channel_id??old?.channel;if(!channelId||ev.author_bot||String(channelId)===String(logger.state?.logs?.channelId))return;
  const ch=await bot.channel(channelId);if(String(ch?.server_id)!==String(cfg.serverId))return;
  await logger.enqueue('MESSAGE EDITED | #'+safe(ch.name||'channel')+'\nAuthor: '+safe(ev.author_id??old?.author)+'\nMessage: '+safe(id)+'\nBefore: '+safe(old&&Date.now()-old.time<3600000?old.text:'Not cached').slice(0,650)+'\nAfter: '+safe(ev.content).slice(0,650),'messages');
  tracker.remember({id,channel_id:channelId,author_id:ev.author_id??old?.author,content:ev.content});
 },
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
 return tracker;
}
