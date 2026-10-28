const clean=value=>String(value||'').replace(/@/g,'@\u200b').replace(/\u0000/g,'');
export function renderWelcome(template,user,server){return String(template).replace(/\{(user|id|server)\}/g,(_,key)=>clean({user:user.username||user.display_name||'New member',id:user.id,server:server.name||'our community'}[key])).slice(0,1800);}
export function installWelcome({state,save,command,bot,cfg,record}){
 state.welcome||={enabled:false,channelId:'',message:'Welcome {user} to {server}! Read the rules and enjoy your stay.'};const settings=state.welcome,recent=new Map();
 async function destination(id){const c=await bot.channel(id);if(String(c?.server_id)!==String(cfg.serverId)||(c.kind??c.type)!=='text')throw Error('Choose a text channel in this server.');return c;}
 async function send(id){await destination(settings.channelId);const [user,server]=await Promise.all([bot.user(id),bot.server(cfg.serverId)]);await bot.send(settings.channelId,'',{embeds:[{title:'Welcome to the community',description:renderWelcome(settings.message,{...user,id},server),color:0xa855f7}]});}
 command('welcome','setup [CHANNEL_ID] | message TEXT | test | on | off | status',async m=>{
  const sub=m.argv[0]||'status';
  if(sub==='setup'){const id=String(m.argv[1]||m.channel_id).replace(/^<#([\w-]+)>$/,'$1');await destination(id);const before={...settings};Object.assign(settings,{channelId:id,enabled:true});try{await save();}catch(e){Object.assign(settings,before);throw e;}await record('welcome-setup',m.author_id,id);await m.reply('Welcomer enabled here. /welcome message Welcome {user} to {server}! | /welcome test | /welcome off');}
  else if(sub==='message'){const message=clean(m.argv.slice(1).join(' '));if(!message||message.length>1500)throw Error('Provide 1–1500 characters. Placeholders: {user}, {id}, {server}.');const old=settings.message;settings.message=message;try{await save();}catch(e){settings.message=old;throw e;}await record('welcome-message',m.author_id,cfg.serverId);await m.reply('Welcome message saved. Use /welcome test to preview.');}
  else if(sub==='test'){if(!settings.channelId)throw Error('Run /welcome setup first.');await send(m.author_id);await m.reply('Preview sent to the welcome channel.');}
  else if(['on','off'].includes(sub)){if(sub==='on')await destination(settings.channelId);const old=settings.enabled;settings.enabled=sub==='on';try{await save();}catch(e){settings.enabled=old;throw e;}await record('welcome-toggle',m.author_id,cfg.serverId,sub);await m.reply('Welcomer '+sub+'.');}
  else if(sub==='status')await m.reply('Welcomer '+(settings.enabled?'ON':'OFF')+' | Channel: '+(settings.channelId||'not set')+'\n/welcome setup — use this channel\n/welcome message TEXT — customize using {user}, {id}, {server}\n/welcome test — preview\n/welcome on or off');
  else throw Error('Use /welcome setup, message TEXT, test, on, off or status.');
 });
 return {async join(ev){if(!settings.enabled)return;const now=Date.now(),id=String(ev.user_id);for(const [u,t]of recent)if(now-t>=60000)recent.delete(u);if(recent.has(id))return;recent.set(id,now);try{await send(id);}catch(e){await record('welcome-send-failed','Vigil',id,e.message);}}};
}
