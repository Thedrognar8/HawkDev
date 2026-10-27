import { Bot } from './yapper.js';
import { readFile, writeFile, rename, mkdir, appendFile } from 'node:fs/promises';
import { Counter, settings, safeTarget, memberHasAdministrator } from './security.js';
import { ServerRegistry } from './server-registry.js';
import { installFeatures } from './features.js';
import { LogService } from './logging.js';
import { installTickets } from './tickets.js';
import {installEmbeds,typedCommand,registerLimited} from './presentation.js';
import {banWithNotice} from './moderation.js';
import {installHoneypot} from './honeypot.js';
import {installPolicy} from './policy.js';
import {installModerationSuite} from './moderation-suite.js';
import {withRequest,firstInRequest,installReadMemo,PermissionGate,mapLimit} from './performance.js';
import { ownerFromServer, atomicSave } from './runtime.js';
const root = new URL('./', import.meta.url);
const config = JSON.parse(await readFile(new URL('hawk.config.json', root), 'utf8'));
const bot = new Bot(process.env.YAPPER_BOT_TOKEN, { prefixes: ['!', '/'] });
installEmbeds(bot);
installReadMemo(bot);
const prefixOnly = new Set();
const dir = new URL('data/', root); await mkdir(dir, { recursive: true });
const registered = new Set();
const registry = new ServerRegistry(createProtection);
function register(name,description) {
 if(registered.has(name))return; registered.add(name);
 registerLimited(bot,name,description,msg=>withRequest(async()=>{
  if(!msg.server_id)return msg.reply('Use this command inside a server.');
  try {const protection=await registry.get(msg.server_id);return await protection.handlers.get(name)(msg);}
  catch(e){console.error('Command routing failed:',e.message);return msg.reply('Vigil could not load server protection. Check the bot console.');}
 }),prefixOnly);
}
async function createProtection(serverId) {
 // Each server owns its state, counters, quarantine records and recovery lock.
 const cfg={...config,...config.servers?.[serverId],serverId};
 // Resolve authority from the platform, never from the first person to issue a command.
 cfg.ownerId=ownerFromServer(await bot.server(serverId));
 // A global log destination is used only if it is verified to belong to this server.
 if(cfg.logChannelId){const ch=await bot.channel(cfg.logChannelId);if(String(ch?.server_id)!==serverId)cfg.logChannelId='';}
 let state;
 try {state=JSON.parse(await readFile(new URL(serverId+'.json',dir),'utf8'));}
 catch(e){
  if(e.code!=='ENOENT')throw e;
  state={channels:{},categories:{},replacements:{},quarantine:{},warnings:{},cases:[],locks:{}};
  // Migrate legacy backups only when their configured server matches exactly.
  if(String(config.serverId)===serverId){try{state=JSON.parse(await readFile(new URL('state.json',dir),'utf8'));}catch(old){if(old.code!=='ENOENT')throw old;}}
 }
state.pending ||= {}; state.categoryReplacements ||= {};
const counter = new Counter(); let busy=false, frozen=false, raidUntil=0, lastRecovery=0, queue=Promise.resolve();
function save() {
 const text=JSON.stringify(state,null,2);
 const next=queue.then(()=>atomicSave(dir,serverId,text));
 queue=next.catch(e=>console.error('SAVE FAILED',e.message)); return next;
}
async function record(action,actor,target,reason='') { const c={number:state.cases.length+1,time:new Date().toISOString(),action,actor,target,reason}; state.cases.push(c); if(['ban','unban'].includes(action))await suite?.cancelTempBan(target); await appendFile(new URL(serverId+'.audit.jsonl',dir),JSON.stringify(c)+'\n'); await logger.enqueue(`Case #${c.number} | ${action}\nActor: ${actor} | Target: ${target}\n${reason||'No details supplied.'}`,'moderation',false); await save(); logger.requestFlush(); }
const logger=new LogService({state,save,bot,serverId,autoFlush:true});
if(!state.logs.channelId&&cfg.logChannelId)state.logs.channelId=cfg.logChannelId;
async function alert(text) { console.log(text); await logger.enqueue('PROTECTION ALERT | '+text,'protection'); }
const isOwner=m=>String(m.author_id)===String(cfg.ownerId);
const permissionGate=new PermissionGate(bot,cfg);
const hasAdmin=userId=>permissionGate.check(userId);
let ticketSystem,honeypot,policy,suite;
const commands=new Map(), accessLevels=new Map(), handlers=new Map(), events=new Map();
function command(name,desc,fn,onlyOwner=false) { commands.set(name,desc); accessLevels.set(name,onlyOwner==='public'?'Public':onlyOwner==='support'?'Support/Admin':'Administrator'); register(name,desc); handlers.set(name,async m=>{try{
 if(String(m.server_id)!==String(cfg.serverId)) throw Error('Wrong server.');
 if(await honeypot?.handle(m))return;
 if(firstInRequest('rate:'+cfg.serverId+':'+m.author_id)&&counter.hit('cmd:'+m.author_id,10000)>8) throw Error('Wait a few seconds.');
 if(onlyOwner!=='public'){const allowed=onlyOwner==='support'?await ticketSystem?.isStaff(m.author_id):await hasAdmin(m.author_id);if(!allowed)throw Error(onlyOwner==='support'?'Requires the configured support role or Administrator.':'Requires a role with Administrator (all permissions).');}
 const before=state.cases.length;
 await fn(m);
 const changes=['filter','filtertime','filteradd','filterallow','filterignore','filterunignore','customadd','customdelete','backup','restore','unlock','raidmode','setlogs','logsoff','logson'];
 if(changes.includes(name)&&state.cases.length===before)await record('command:'+name,m.author_id,m.channel_id,'Completed');
 }catch(e){ console.error(name,e.message); await m.reply('Vigil: '+String(e.message).replace(/@/g,'@\u200b').slice(0,1000)).catch(()=>{}); }}); }
const user=m=>{const u=String(m.argv[0]||'').replace(/^<@!?([\w-]+)>$/,'$1'); safeTarget(u,[String(cfg.ownerId),String(bot.me?.id),String(m.author_id)]);return u;};
const num=(x,a,b)=>{const n=Number(x);if(!Number.isInteger(n)||n<a||n>b)throw Error(`Number must be ${a}-${b}.`);return n;};
async function baseline(){ const channels=await bot.channels(cfg.serverId),categories=await bot.categories(cfg.serverId);state.channels=Object.fromEntries(channels.map(c=>[c.id,c]));state.categories=Object.fromEntries(categories.map(c=>[c.id,c]));state.replacements={};state.pending={};state.categoryReplacements={};await save();frozen=false; }
async function recover(){
 lastRecovery=Date.now();
 const channels=await bot.channels(cfg.serverId),cats=await bot.categories(cfg.serverId),map=new Map(cats.map(c=>[c.id,c.id]));let done=0,errors=[];
 for(const [old,replacement]of Object.entries(state.categoryReplacements))if(cats.some(c=>c.id===replacement))map.set(old,replacement);
 for(const c of Object.values(state.channels)){
  if(state.intentionalDeletes?.[c.id])continue;
  if(state.pending[c.id]&&channels.some(x=>x.id===state.replacements[c.id])){try{await bot.editChannel(state.replacements[c.id],settings(c));delete state.pending[c.id];await save();done++;}catch(e){errors.push(c.name+': settings retry failed: '+e.message);}continue;}
  if(channels.some(x=>x.id===c.id||x.id===state.replacements[c.id]))continue;
  try{
   const opts=settings(c); const catId=c.category?.id??c.category_id;
   if(catId&&!map.has(catId)){const cat=state.categories[catId];if(!cat)throw Error('Category backup missing');map.set(catId,(await bot.createCategory(cfg.serverId,cat.name)).id);state.categoryReplacements[catId]=map.get(catId);await save();}
   // Private originals are skipped: SDK cannot atomically create a private channel.
   const made=await bot.createChannel(cfg.serverId,c.name,{kind:c.type||c.kind||'text',categoryId:map.get(catId)});
   state.replacements[c.id]=made.id;state.pending[c.id]=true;await save();
   await bot.editChannel(made.id,opts);delete state.pending[c.id];await save();done++;await record('channel-restore','Vigil',c.id,'New ID '+made.id);
  }catch(e){errors.push(c.name+': '+e.message);}
 }
 await alert(`Recovery: ${done} recreated. ${errors.join(' | ')||'No errors.'} Old messages cannot be recovered.`);return done;
}
async function poll(){if(busy)return;busy=true;try{
 cfg.ownerId=ownerFromServer(await bot.server(cfg.serverId));
 const channels=await bot.channels(cfg.serverId);
 if(!Object.keys(state.channels).length){await baseline();return;}
 const missing=Object.values(state.channels).filter(c=>!state.intentionalDeletes?.[c.id]&&!channels.some(x=>x.id===c.id||x.id===state.replacements[c.id]));
 if(missing.length){if(!frozen){frozen=true;await alert(`CHANNEL LOSS: ${missing.length} missing; baseline frozen. Actor unavailable in SDK. Verify attacker then !quarantine USER_ID.`);}if((suite?.settings.autoRestore??cfg.autoRestore)&&missing.length>=cfg.deleteThreshold&&Date.now()-lastRecovery>=60000)await recover();}
 else if(Object.keys(state.pending).length&&(suite?.settings.autoRestore??cfg.autoRestore)&&Date.now()-lastRecovery>=60000){await recover();}
 else if(!frozen){for(const c of channels)if(!state.intentionalDeletes?.[c.id])state.channels[c.id]=c;for(const c of await bot.categories(cfg.serverId))state.categories[c.id]=c;await save();}
 counter.sweep();
 }catch(e){console.error('POLL FAILED',e.message);}finally{try{await suite?.tick();}finally{busy=false;await logger.flush();}}}
async function quarantine(u,actor){
 safeTarget(u,[String(cfg.ownerId),String(bot.me?.id)]);
 const member=await bot.member(cfg.serverId,u),roles=member.role_ids??member.roles?.map(r=>typeof r==='object'?r.id:r);
 if(!Array.isArray(roles))throw Error('API did not return role IDs.');
 state.quarantine[u]||={roles:[...roles],removed:[]};await save();const errors=[];
 for(const r of roles){if(state.quarantine[u].removed.includes(r))continue;try{await bot.removeRole(cfg.serverId,u,r);state.quarantine[u].removed.push(r);await save();}catch(e){errors.push(r+': '+e.message);}}
 await record('quarantine',actor,u,errors.join(';'));if(errors.length)throw Error('Partial role removal: '+errors.join(';'));
}
command('help','List commands',m=>m.reply([...commands].map(([n,d])=>'!'+n+' - '+d).join('\n')));
command('ping','Check connection',m=>m.reply('Vigil online.'));
command('status','Protection status',m=>m.reply(`Backup ${Object.keys(state.channels).length} channels; frozen=${frozen}; raid=${Date.now()<raidUntil}; autoRestore=${suite?.settings.autoRestore??cfg.autoRestore}; poll=${cfg.pollSeconds}s. Actor attribution unavailable.`));
command('backup','Replace baseline: confirm',async m=>{if(m.argv[0]!=='confirm')throw Error('Use !backup confirm to accept current layout.');if(busy)throw Error('Busy; retry.');busy=true;try{await baseline();await m.reply('Baseline saved.');}finally{busy=false;}},true);
command('restore','Recreate missing public channels',async m=>{if(busy)throw Error('Busy; retry.');busy=true;try{await m.reply('Restored '+await recover()+' channels.');}finally{busy=false;}},true);
command('quarantine','Strip confirmed attacker roles: USER_ID',async m=>{await quarantine(user(m),m.author_id);await m.reply('Roles removed; recovery record saved.');},true);
command('release','Restore roles: USER_ID confirm',async m=>{const u=user(m);if(m.argv[1]!=='confirm')throw Error('Use !release USER_ID confirm.');const q=state.quarantine[u];if(!q)throw Error('No quarantine record.');for(const r of [...q.removed]){await bot.addRole(cfg.serverId,u,r);q.removed=q.removed.filter(x=>x!==r);await save();}delete state.quarantine[u];await record('release',m.author_id,u);await m.reply('Roles restored.');},true);
command('ban','Ban USER_ID reason and notify them privately',async m=>{const u=user(m),reason=m.argv.slice(1).join(' ')||'No reason provided.';const notice=await banWithNotice(bot,cfg.serverId,u,reason);await record('ban',m.author_id,u,reason+' | Private notice: '+(notice.notified?'delivered':notice.error));await m.reply(notice.notified?'Ban completed. The member received a private ban notice.':'Ban completed. The private notice could not be delivered (DMs may be blocked).');});
for(const action of ['kick','unban'])command(action,action+' USER_ID reason',async m=>{const u=user(m);await bot[action](cfg.serverId,u);await record(action,m.author_id,u,m.argv.slice(1).join(' '));await m.reply(action+' completed.');});
command('timeout','USER_ID MINUTES reason',async m=>{const u=user(m),minutes=num(m.argv[1],1,40320);await bot.timeout(cfg.serverId,u,minutes,m.argv.slice(2).join(' '));if(suite)suite.settings.muted[u]=Date.now()+minutes*60000;await record('timeout',m.author_id,u,String(minutes));await m.reply('Timeout applied.');});
command('untimeout','Clear timeout: USER_ID',async m=>{const u=user(m);await bot.timeout(cfg.serverId,u,0);if(suite)delete suite.settings.muted[u];await record('untimeout',m.author_id,u);await m.reply('Timeout cleared.');});
command('warn','USER_ID reason',async m=>{const u=user(m),reason=m.argv.slice(1).join(' ');if(!reason)throw Error('Reason required.');(state.warnings[u]||=[]).push({reason,actor:m.author_id,time:Date.now()});await record('warn',m.author_id,u,reason);await m.reply('Warning recorded.');});
command('warnings','View warnings: USER_ID',m=>m.reply(JSON.stringify(state.warnings[String(m.argv[0])]||[]).replace(/@/g,'@\u200b').slice(0,1800)));
command('clearwarnings','Clear warnings: USER_ID',async m=>{const u=user(m);delete state.warnings[u];await record('clearwarnings',m.author_id,u);await m.reply('Warnings cleared.');},true);
command('cases','Recent cases',m=>m.reply(state.cases.filter(c=>!c.hidden).slice(-10).map(c=>`#${c.number} ${c.action} ${c.target} ${c.time}`).join('\n')||'No cases.'));
command('case','Case NUMBER',m=>m.reply(JSON.stringify(state.cases[num(m.argv[0],1,Math.max(1,state.cases.length))-1]||{}).replace(/@/g,'@\u200b').slice(0,1800)));
command('bans','List bans',async m=>m.reply(JSON.stringify((await bot.bans(cfg.serverId)).slice(0,20)).replace(/@/g,'@\u200b').slice(0,1800)));
command('userinfo','Inspect USER_ID',async m=>m.reply(JSON.stringify(await bot.member(cfg.serverId,String(m.argv[0]))).replace(/@/g,'@\u200b').slice(0,1800)));
command('slowmode','Set SECONDS in this channel',async m=>{await bot.editChannel(m.channel_id,{slowmode:num(m.argv[0],0,21600)});await m.reply('Slowmode updated.');});
command('lock','Lock current channel',async m=>{const c=await bot.channel(m.channel_id);if(!c)throw Error('Channel unavailable.');state.locks[c.id]||={readOnly:!!c.read_only,postRoleIds:c.post_role_ids};await save();await bot.editChannel(c.id,{readOnly:true,postRoleIds:[]});await record('lock',m.author_id,c.id);await m.reply('Locked.');});
command('unlock','Restore posting settings',async m=>{const old=state.locks[m.channel_id];if(!old)throw Error('No saved lock.');await bot.editChannel(m.channel_id,old);delete state.locks[m.channel_id];await save();await m.reply('Unlocked.');});
command('purge','Delete 1-100 recent messages',async m=>{const n=num(m.argv[0],1,100),messages=await bot.messages(m.channel_id,n),r=await bot.bulkDelete(m.channel_id,messages.map(x=>x.id));await record('purge',m.author_id,m.channel_id,JSON.stringify(r));await m.reply(JSON.stringify(r));});
command('raidmode','on|off: temporary newcomer timeouts',async m=>{if(!['on','off'].includes(m.argv[0]))throw Error('Use on or off.');raidUntil=m.argv[0]==='on'?Date.now()+3600000:0;await m.reply('Raid mode '+m.argv[0]);},true);
const punishCooldown=new Map();
events.set('member_join',async ev=>{if(String(ev.server_id)!==String(cfg.serverId))return;
 if(suite?.settings.antiRaid!==false&&counter.hit('joins',(suite?.settings.joinWindowSeconds??cfg.joinWindowSeconds)*1000)>=(suite?.settings.joinThreshold??cfg.joinThreshold)){if(Date.now()>=raidUntil)await alert('JOIN RAID: newcomer timeouts enabled for two minutes.');raidUntil=Date.now()+120000;}
 if(Date.now()<raidUntil&&![String(cfg.ownerId),String(bot.me?.id)].includes(String(ev.user_id)))try{if(await hasAdmin(ev.user_id))return;await bot.timeout(cfg.serverId,ev.user_id,2,'Join raid containment');await record('raid-timeout','Vigil',ev.user_id);}catch(e){await alert('Raid containment failed: '+e.message);}
});
events.set('message',async m=>{if(String(m.server_id)!==String(cfg.serverId)||isOwner(m)||m.author_bot)return;
 const text=String(m.content||''),flood=policy.settings.flags.spam&&counter.hit('spam:'+m.author_id,8000)>=cfg.spamThreshold,mentions=(policy.settings.flags.mentions&&(text.match(/<@/g)||[]).length>=cfg.mentionThreshold)||(policy.settings.flags.everyone&&/@everyone|@here/i.test(text));
 if(!flood&&!mentions)return;if(Date.now()-(punishCooldown.get(m.author_id)||0)<30000)return;punishCooldown.set(m.author_id,Date.now());
 try{if(await hasAdmin(m.author_id))return;await bot.delete(m.channel_id,m.id);await bot.timeout(cfg.serverId,m.author_id,5,'Flood or mass mentions');await record('automod-timeout','Vigil',m.author_id);}catch(e){await alert('Automod failed: '+e.message);}
});

 ticketSystem=installTickets({state,save,command,bot,cfg,hasAdmin,record});
 const features=installFeatures({state,save,command,commands,handlers,hasAdmin,bot,cfg,record});
 honeypot=installHoneypot({state,save,command,bot,cfg,isStaff:id=>ticketSystem.isStaff(id),record,alert});
 policy=installPolicy({state,save,command,bot,cfg,hasAdmin,record});
 const previousMessage=events.get('message');
 events.set('message',async m=>{
  if(String(m.server_id)!==String(cfg.serverId)||m.author_bot)return;
  try {if(await honeypot.handle(m))return;const ignored=!policy.settings.enabled||await policy.ignored(m);if(!ignored){if(await features.filter(m))return;if(await policy.handle(m))return;await previousMessage(m);}await features.custom(m);}
  catch(e){await alert('Message protection failed: '+e.message);}
 });
 command('setlogs','Use this channel for Vigil logs',async m=>{await logger.setChannel(m.channel_id);await logger.enqueue('Logging enabled by '+m.author_id);await logger.flush();await m.reply('Vigil logs will appear in this channel. Use a private staff channel.');});
 command('logs','Show log configuration and queue',m=>m.reply(JSON.stringify({enabled:state.logs.enabled,channel:state.logs.channelId||'Not set: use !setlogs',queued:state.logs.pending.length,lastError:state.logs.lastError,lastSent:state.logs.lastSent,dropped:state.logs.dropped||0}).slice(0,1800)));
 command('logtest','Send a test log entry',async m=>{if(!state.logs.channelId||!state.logs.enabled)throw Error('Use !setlogs first.');await logger.enqueue('TEST | Requested by '+m.author_id);await logger.flush();await m.reply(state.logs.lastError?'Log queued; delivery failed: '+state.logs.lastError:'Test log processed.');});
 command('logsoff','Pause server log delivery',async m=>{state.logs.enabled=false;await save();await m.reply('Server logs paused. Local audit remains enabled.');});
 command('logson','Resume server log delivery',async m=>{if(!state.logs.channelId)throw Error('Use !setlogs first.');state.logs.enabled=true;await save();await logger.flush();await m.reply('Server logs enabled.');});
 suite=installModerationSuite({state,save,command,handlers,bot,cfg,hasAdmin,isStaff:id=>ticketSystem.isStaff(id),record,dir,writeFile,policy});
 state.logTypes||={};
 const originalLogs=handlers.get('logs');
 command('logs','status|setup|disable TYPE|TYPE on|off',async m=>{
  const [sub,arg]=m.argv;if(!sub||sub==='status')return originalLogs({...m,argv:[]});
  if(sub==='setup')return handlers.get('setlogs')({...m,argv:[]});
  const type=sub==='disable'?arg:sub,value=sub==='disable'?'off':arg;
  if(!['joins','leaves','voice','moderation','protection','general'].includes(type)||!['on','off'].includes(value))throw Error('Use logs TYPE on|off. Types: joins, leaves, voice, moderation, protection, general.');
  state.logTypes[type]=value==='on';await save();await m.reply(type+' logs '+value+'. Local audit is retained.');
 });
 for(const [name,type]of [['joinlog','joins'],['leavelog','leaves']])command(name,'on|off: configure server log category',m=>handlers.get('logs')({...m,argv:[type,m.argv[0]]}));
 events.set('reaction_add',ev=>suite.onReaction(ev,false));events.set('reaction_remove',ev=>suite.onReaction(ev,true));
 for(const event of ['voice_join','voice_leave'])events.set(event,ev=>logger.enqueue(event.toUpperCase()+' | User: '+ev.user_id+' | Channel: '+ev.channel_id,'voice'));
 const previousJoin=events.get('member_join');
 events.set('member_join',async ev=>{await logger.enqueue('MEMBER JOIN | User: '+ev.user_id,'joins');await previousJoin(ev);await suite.onJoin(ev);});
 events.set('member_leave',async ev=>{await logger.enqueue('MEMBER LEAVE | User: '+ev.user_id+' | Cause/actor not supplied by SDK.','leaves');});
 return {commands,accessLevels,handlers,events,poll,tickets:ticketSystem,flush:async()=>{await ticketSystem.flush();await queue;}};
}
async function receiveTicketDM(message){
 if(message.author_bot||message.command)return;
 const available=[];
 for(const pending of registry.entries.values()){
  try{const protection=await pending;for(const ticket of protection.tickets.openFor(message.author_id))if(ticket.dmChannelId===String(message.channel_id))available.push({ticket,system:protection.tickets});}catch{}
 }
 if(!available.length)return;
 const match=/^!ticketmsg\s+(T-[a-f0-9]{8})\s+([\s\S]+)$/i.exec(String(message.content||''));
 let chosen,text;
 if(match){chosen=available.find(x=>x.ticket.id.toLowerCase()===match[1].toLowerCase());text=match[2];}
 else if(available.length===1&&!String(message.content||'').startsWith('!')){chosen=available[0];text=message.content;}
 if(!chosen){await message.reply('Choose a ticket: !ticketmsg ID YOUR MESSAGE. Your open IDs: '+available.map(x=>x.ticket.id).join(', '));return;}
 try{await chosen.system.receive(chosen.ticket,message,text);await message.reply('Delivered to support ['+chosen.ticket.id+'].');}
 catch(e){await message.reply('Ticket delivery failed: '+String(e.message).replace(/@/g,'@\u200b').slice(0,500));}
}
for(const event of ['message','member_join','member_leave','voice_join','voice_leave','reaction_add','reaction_remove'])bot.on(event,ev=>withRequest(async()=>{
 if(!ev.server_id&&event.startsWith('reaction_')&&ev.channel_id){const channel=await bot.channel(ev.channel_id);if(channel?.server_id)ev={...ev,server_id:channel.server_id};}
 if(!ev.server_id){if(event==='message')await receiveTicketDM(ev);return;}
 try{const protection=await registry.get(ev.server_id);if(event==='message'){const typed=typedCommand(ev,prefixOnly,bot.me?.id);if(typed){Object.assign(ev,typed);await protection.handlers.get(typed.command)?.(ev);}}await protection.events.get(event)?.(ev);}
 catch(e){console.error('Event routing failed:',e.message);}
}));
let discovering=false;
async function discover(){
 if(discovering)return;discovering=true;
 try{await mapLimit(await bot.servers(),3,server=>withRequest(async()=>{try{const protection=await registry.get(server.id);await protection.poll();}catch(e){console.error('Protection failed for server '+server.id+': '+e.message);}}));}catch(e){console.error('Server discovery failed:',e.message);}finally{discovering=false;}
}
bot.on('error',e=>console.error('SDK',e.message));
bot.on('ready',async()=>{await discover();console.log('Vigil ready: automatic server discovery enabled.');});
const timer=setInterval(()=>void discover(),Math.max(5,config.pollSeconds)*1000);
async function stop(){clearInterval(timer);for(const promise of registry.entries.values())try{await(await promise).flush();}catch{}process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
bot.start().catch(e=>{console.error('Startup failed',e.message);clearInterval(timer);process.exitCode=1;});
