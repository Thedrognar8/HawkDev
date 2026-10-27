import {banWithNotice} from './moderation.js';
const WARNING='HONEYPOT — DO NOT POST\nThis channel is a moderation trap for automated spam. Do not send messages or commands here. Posting here can trigger the configured moderation action. Contact staff elsewhere if you need help.';
export function installHoneypot({state,save,command,bot,cfg,isStaff,record,alert}){
 state.honeypot||={enabled:false,channelId:'',action:'timeout',minutes:10,hits:0};
 const settings=state.honeypot,inflight=new Set(),recent=new Map();
 async function commit(values){const before={...settings};Object.assign(settings,values);try{await save();}catch(e){Object.assign(settings,before);throw e;}}
 async function channel(){const c=await bot.channel(settings.channelId);if(!c||String(c.server_id)!==String(cfg.serverId)||(c.kind??c.type)!=='text')throw Error('Honeypot channel missing or inaccessible.');return c;}
 function excluded(id){return id===state.logs?.channelId||Object.values(state.tickets?.items||{}).some(t=>t.channelId===id);}
 async function configure(id){
  const c=await bot.channel(id);if(!c||String(c.server_id)!==String(cfg.serverId)||(c.kind??c.type)!=='text')throw Error('Choose a text channel in this server.');
  if(excluded(id))throw Error('Cannot use a log channel or ticket room as a honeypot.');
  // Publish the warning before arming. If posting fails, the trap remains unarmed.
  await bot.send(id,WARNING);
  await commit({channelId:id,enabled:true});
 }
 command('honeypot','create|set|on|off|status|time|action|test',async m=>{
  const sub=String(m.argv[0]||'status').toLowerCase();
  if(sub==='create'){
   if(settings.channelId)throw Error('A channel is already configured. Use set confirm to replace it or on/off.');
   const name=m.argv.slice(1).join('-').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40)||'do-not-post';
   const c=await bot.createChannel(cfg.serverId,name,{kind:'text'});await configure(String(c.id));await record('honeypot-create',m.author_id,c.id,'Warning posted; enabled with '+settings.action);await m.reply('Honeypot created and armed. Action: '+settings.action+'.');return;
  }
  if(sub==='set'){
   if(m.argv[1]!=='confirm')throw Error('Run !honeypot set confirm INSIDE a dedicated decoy channel. Every non-staff message there will trigger enforcement.');
   await configure(String(m.channel_id));await record('honeypot-set',m.author_id,m.channel_id,'Warning posted; enabled');await m.reply('This channel is now the armed honeypot.');return;
  }
  if(sub==='on'){await channel();if(excluded(settings.channelId))throw Error('Channel is now used by logs/tickets; choose another.');await bot.send(settings.channelId,WARNING);await commit({enabled:true});await record('honeypot-on',m.author_id,settings.channelId);await m.reply('Honeypot enabled.');return;}
  if(sub==='off'){await commit({enabled:false});await record('honeypot-off',m.author_id,settings.channelId);await m.reply('Honeypot disabled. Channel and history kept.');return;}
  if(sub==='time'){const n=Number(m.argv[1]);if(!Number.isInteger(n)||n<1||n>1440)throw Error('Timeout length: 1-1440 minutes.');await commit({minutes:n});await record('honeypot-time',m.author_id,settings.channelId,String(n));await m.reply('Timeout length saved.');return;}
  if(sub==='action'){const action=m.argv[1];if(!['log','timeout','kick','ban'].includes(action))throw Error('Actions: log, timeout, kick, ban.');if(['kick','ban'].includes(action)&&m.argv[2]!=='confirm')throw Error('Use !honeypot action '+action+' confirm. Non-staff posting there will be '+(action==='ban'?'banned':'kicked')+'.');await commit({action});await record('honeypot-action',m.author_id,settings.channelId,action);await m.reply('Honeypot action: '+action+'.');return;}
  if(sub==='test'){await channel();await record('honeypot-test',m.author_id,settings.channelId,'Dry run only; no member moderated.');await m.reply('Dry-run log created. Channel is accessible. No member was punished; moderation permissions are not proven by this test.');return;}
  if(sub!=='status')throw Error('Use create, set, on, off, status, time, action or test.');
  await m.reply(`Honeypot: ${settings.enabled?'ON':'OFF'}\nChannel: ${settings.channelId||'Not configured'}\nAction: ${settings.action}\nTimeout: ${settings.minutes} minutes\nTriggers: ${settings.hits}\nStaff and bots are exempt. No trap exists until you configure it.`);
 });
 return {settings,async handle(message){
  if(!settings.enabled||String(message.server_id)!==String(cfg.serverId)||message.author_bot||String(message.author_id)===String(bot.me?.id))return false;
  const replacement=state.replacements?.[settings.channelId];if(replacement){settings.channelId=replacement;await save();}
  if(String(message.channel_id)!==settings.channelId)return false;
  if(excluded(settings.channelId)){settings.enabled=false;await save();await alert('Honeypot disabled because its channel is now used for logs or tickets.');return false;}
  const user=String(message.author_id);
  if(inflight.has(user))return true;inflight.add(user);
  try{
   if(await isStaff(user))return false;
   if(Date.now()-(recent.get(user)||0)<30000)return true;
   recent.set(user,Date.now());settings.hits++;await save();
   const outcomes=[];
   if(settings.action!=='log'){try{await bot.delete(message.channel_id,message.id);outcomes.push('message deleted');}catch(e){outcomes.push('delete failed: '+e.message);}}else outcomes.push('message retained');
   try{
    if(settings.action==='timeout')await bot.timeout(cfg.serverId,user,settings.minutes,'Posted in the clearly marked honeypot channel');
    else if(settings.action==='kick')await bot.kick(cfg.serverId,user);
    else if(settings.action==='ban'){const result=await banWithNotice(bot,cfg.serverId,user,'Posted in the clearly marked honeypot channel');outcomes.push('ban DM: '+(result.notified?'sent':result.error));}
    outcomes.push(settings.action==='log'?'log-only mode':settings.action+' succeeded');
   }catch(e){outcomes.push(settings.action+' failed: '+e.message);}
   await record('honeypot-trigger','Vigil',user,`Channel ${settings.channelId} | Message ${message.id} | ${outcomes.join('; ')}`);
   return true;
  }catch(e){await alert('Honeypot processing error; review recorded outcomes: '+e.message);return true;}
  finally{inflight.delete(user);}
 }};
}
