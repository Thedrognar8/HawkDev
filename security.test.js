import test from 'node:test';
import assert from 'node:assert/strict';
import {Counter,safeTarget,settings} from './security.js';
test('sliding window and isolation',()=>{const c=new Counter();assert.equal(c.hit('a',100,0),1);assert.equal(c.hit('a',100,99),2);assert.equal(c.hit('a',100,100),2);assert.equal(c.hit('b',100,100),1);});
test('protected and malformed targets rejected',()=>{for(const u of ['owner','bot','actor','<@123>',''])assert.throws(()=>safeTarget(u,['owner','bot','actor']));assert.doesNotThrow(()=>safeTarget('attacker',['owner']));});
test('private recovery fails closed',()=>{assert.throws(()=>settings({private:true,role_ids:['r']}));});
test('read-only recovery requires posting ACL',()=>{assert.throws(()=>settings({read_only:true}));assert.deepEqual(settings({name:'news',read_only:true,post_role_ids:[]}).postRoleIds,[]);});
test('public settings preserved',()=>{assert.equal(settings({name:'chat',slowmode:10}).slowmode,10);});
import {ServerRegistry} from './server-registry.js';
test('server state is isolated and initialization is deduplicated',async()=>{
 let calls=0;const registry=new ServerRegistry(async id=>{calls++;return {id,backups:[]};});
 const [a,b,c]=await Promise.all([registry.get('one'),registry.get('one'),registry.get('two')]);
 assert.equal(calls,2);assert.equal(a,b);assert.notEqual(a,c);a.backups.push('private');assert.deepEqual(c.backups,[]);
});
test('initialization failure can retry',async()=>{
 let n=0;const registry=new ServerRegistry(async()=>{if(++n===1)throw Error('network');return {};});
 await assert.rejects(registry.get('one'));await registry.get('one');assert.equal(n,2);
});
test('server identifiers cannot escape data directory',async()=>{
 const registry=new ServerRegistry(async()=>({}));await assert.rejects(registry.get('../other'));await assert.rejects(registry.get(''));
});
import {ownerFromServer,atomicSave} from './runtime.js';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,sep,basename} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
test('owner authorization uses platform metadata and fails closed',()=>{
 assert.equal(ownerFromServer({owner_id:'actual-owner'}),'actual-owner');
 assert.equal(ownerFromServer({owner:{id:'another-owner'}}),'another-owner');
 for(const s of [{},{owner_id:''},{owner_id:{}},{id:'server-id'}])assert.throws(()=>ownerFromServer(s));
});
test('atomic persistence writes and replaces the correct server files',async()=>{
 const dir=await mkdtemp(new URL('./vigil-test-',import.meta.url));const url=pathToFileURL(dir+'/');
 try{await atomicSave(url,'one','first');await atomicSave(url,'two','other');await atomicSave(url,'one','updated');assert.equal(await readFile(new URL('one.json',url),'utf8'),'updated');assert.equal(await readFile(new URL('two.json',url),'utf8'),'other');}finally{const boundary=resolve(dirname(fileURLToPath(import.meta.url)))+sep;const actual=resolve(dir);if(!actual.toLowerCase().startsWith(boundary.toLowerCase())||!basename(actual).startsWith('vigil-test-'))throw Error('Refusing cleanup outside test directory');await rm(actual,{recursive:true,force:true});}
});
import {memberHasAdministrator} from './security.js';
test('assigned administrator role grants access',()=>{
 const roles=[{id:'admin-role',perms:{administrator:true}}];
 assert.equal(memberHasAdministrator({roles:['admin-role']},roles),true);
 assert.equal(memberHasAdministrator({role_ids:['admin-role']},roles),true);
 assert.equal(memberHasAdministrator({roles:[{id:'admin-role'}]},roles),true);
});
test('unassigned, removed, named-only or partial admin roles do not grant access',()=>{
 assert.equal(memberHasAdministrator({roles:[]},[{id:'admin',perms:{administrator:true}}]),false);
 assert.equal(memberHasAdministrator({roles:['admin']},[{id:'admin',name:'Admin',manage_server:true}]),false);
 assert.equal(memberHasAdministrator({roles:['admin']},[{id:'admin',perms:{administrator:'true'}}]),false);
 assert.equal(memberHasAdministrator({roles:['admin']},[{id:'admin',perms:{administrator:false}}]),false);
 assert.equal(memberHasAdministrator(null,null),false);
});
import {findSwear,account,reward,transfer,move,buy,sell,customSet} from './features-core.js';
test('filter catches requested phrase, leetspeak, separators and zero-width tricks',()=>{
 for(const text of ['fuckyou','FUCK YOU','sh1t','f.u.c.k','f\u200buck','bitch','klootzak'])assert.ok(findSwear(text),text);
});
test('filter avoids innocent substrings and supports word exceptions',()=>{
 for(const text of ['class assignment','Scunthorpe','Dickens novels','hello friends'])assert.equal(findSwear(text),null,text);
 assert.equal(findSwear('damn',[],['damn']),null);assert.equal(findSwear('customword',['customword']),'customword');
});
test('reward cooldown prevents repeated payouts',()=>{
 const a=account({},'one');assert.equal(reward(a,'daily',1000,100,10000),100);assert.throws(()=>reward(a,'daily',1000,100,10001));assert.equal(a.wallet,100);reward(a,'daily',1000,100,11000);assert.equal(a.wallet,200);
});
test('transfers and bank moves conserve money and reject invalid amounts',()=>{
 const e={},a=account(e,'one'),b=account(e,'two');a.wallet=100;transfer(a,b,30);move(a,20,true);assert.deepEqual([a.wallet,a.bank,b.wallet],[50,20,30]);
 for(const n of [-1,0,1.5,'NaN','Infinity'])assert.throws(()=>transfer(a,b,n));assert.throws(()=>transfer(a,b,999));assert.throws(()=>transfer(a,a,1));assert.equal(a.wallet+b.wallet+a.bank,100);
});
test('inventory purchases and sales cannot create free items',()=>{
 const a=account({},'one');a.wallet=100;buy(a,'cookie');assert.equal(a.wallet,50);assert.equal(a.inventory.cookie,1);sell(a,'cookie');assert.equal(a.wallet,80);assert.throws(()=>sell(a,'cookie'));assert.throws(()=>buy(a,'car'));assert.equal(a.wallet,80);
});
test('custom commands cap at 500, permit edits, and suppress mentions',()=>{
 const c={};for(let i=0;i<500;i++)customSet(c,'cmd'+i,'hello');assert.equal(Object.keys(c).length,500);assert.throws(()=>customSet(c,'overflow','no'));customSet(c,'cmd1','@everyone');assert.ok(!c.cmd1.includes('@everyone'));assert.throws(()=>customSet(c,'bad name','hi'));
});
import {installFeatures} from './features.js';
function featureHarness(save=async()=>{}){
 const state={},commands=new Map(),handlers=new Map(),calls=[];
 const command=(name,description,fn,access)=>{commands.set(name,description);handlers.set(name,fn);};
 const bot={member:async()=>({}),delete:async()=>calls.push('delete'),timeout:async()=>calls.push('timeout')};
 const features=installFeatures({state,save,command,commands,handlers,hasAdmin:async()=>false,bot,cfg:{serverId:'server'},record:async()=>calls.push('record')});
 const message=(argv=[])=>({author_id:'user',channel_id:'channel',id:'message',argv,reply:async()=>{}});
 return {state,commands,handlers,calls,features,message};
}
test('concurrent reward commands cannot claim twice',async()=>{
 const h=featureHarness();const results=await Promise.allSettled([h.handlers.get('daily')(h.message()),h.handlers.get('daily')(h.message())]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);assert.equal(h.state.economy.users.user.wallet,1000);
});
test('failed persistence rolls back economy mutation',async()=>{
 const h=featureHarness(async()=>{throw Error('disk full');});await assert.rejects(h.handlers.get('daily')(h.message()));assert.deepEqual(h.state.economy.users,{});
});
test('swear filter attempts deletion, timeout and audit record',async()=>{
 const h=featureHarness();assert.equal(await h.features.filter({...h.message(),content:'fuckyou'}),true);assert.deepEqual(h.calls,['delete','timeout','record']);
});
test('feature command set stays within the documented expanded total',()=>{
 const h=featureHarness();assert.ok(h.commands.size+24<=150);assert.ok(h.commands.has('customadd'));assert.ok(h.commands.has('filter'));assert.ok(h.commands.has('daily'));
});
import {LogService,cleanLog} from './logging.js';
function logHarness(){const state={replacements:{}},sent=[];let fail=false;const bot={channel:async id=>({id,server_id:'server',kind:'text'}),send:async(id,text)=>{if(fail)throw Error('Missing permission');sent.push({id,text});}};const logger=new LogService({state,save:async()=>{},bot,serverId:'server'});return {state,sent,bot,logger,setFail:value=>{fail=value;}};}
test('logs validate server destination and suppress mentions',async()=>{
 const h=logHarness();await h.logger.setChannel('logs');await h.logger.enqueue('@everyone action');await h.logger.flush();assert.equal(h.sent.length,1);assert.ok(!h.sent[0].text.includes('@everyone'));assert.equal(h.state.logs.pending.length,0);
 h.bot.channel=async()=>({kind:'text',server_id:'other'});await assert.rejects(h.logger.setChannel('foreign'));assert.equal(h.state.logs.channelId,'logs');
});
test('failed log delivery retains queue and retries',async()=>{
 const h=logHarness();await h.logger.setChannel('logs');await h.logger.enqueue('action');h.setFail(true);await h.logger.flush();assert.equal(h.state.logs.pending.length,1);assert.ok(h.state.logs.lastError);h.setFail(false);await h.logger.flush();assert.equal(h.state.logs.pending.length,0);assert.equal(h.sent.length,1);
});
test('log flushing is serialized and follows recovered channel IDs',async()=>{
 const h=logHarness();await h.logger.setChannel('old');h.state.replacements.old='new';await h.logger.enqueue('one');await Promise.all([h.logger.flush(),h.logger.flush()]);assert.equal(h.sent.length,1);assert.equal(h.sent[0].id,'new');
});
test('logs can pause without discarding existing queue',async()=>{
 const h=logHarness();await h.logger.setChannel('logs');await h.logger.enqueue('one');h.state.logs.enabled=false;await h.logger.enqueue('two');await h.logger.flush();assert.equal(h.state.logs.pending.length,1);assert.equal(h.sent.length,0);assert.equal(cleanLog('x'.repeat(5000)).length,1750);
});
import {installTickets} from './tickets.js';
function ticketHarness(){
 const state={},handlers=new Map(),calls=[],channels=new Map();let n=0,privateFailure=false,dmFailure=false;
 const bot={roles:async()=>[{id:'support',name:'Support'},{id:'everyone',name:'@everyone'}],categories:async()=>[{id:'category'}],createCategory:async()=>({id:'category'}),member:async(s,id)=>({roles:id==='helper'?['support']:[]}),dm:async()=>{if(dmFailure)throw Error('DMs blocked');return 'dm';},createChannel:async()=>{const c={id:'room'+(++n),server_id:'server',kind:'text',private:false};channels.set(c.id,c);return c;},editChannel:async(id,changes)=>{calls.push(['edit',id,changes]);if(privateFailure&&changes.private)throw Error('no private permission');Object.assign(channels.get(id),changes);return channels.get(id);},channel:async id=>channels.get(id),server:async()=>({name:'Test Server'}),send:async(id,text)=>{calls.push(['send',id,text]);return {};}};
 const system=installTickets({state,save:async()=>{},command:(n,d,f)=>handlers.set(n,f),bot,cfg:{serverId:'server'},hasAdmin:async id=>id==='admin',record:async()=>{}});
 const message=(author='owner',argv=[],channel='public')=>({author_id:author,argv,channel_id:channel,reply:async()=>{},say:async()=>{}});
 return {state,handlers,calls,channels,system,message,failPrivate:()=>{privateFailure=true;},failDM:()=>{dmFailure=true;}};
}
test('tickets require setup and exclude everyone role',async()=>{
 const h=ticketHarness();await assert.rejects(h.handlers.get('ticket')(h.message()));await assert.rejects(h.handlers.get('ticketsetup')(h.message('admin',['everyone'])));
 await h.handlers.get('ticketsetup')(h.message('admin',['support']));assert.equal(h.state.tickets.settings.enabled,true);
});
test('ticket content is never sent until privacy is verified',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin',['support']));h.failPrivate();await assert.rejects(h.handlers.get('ticket')(h.message()));assert.equal(h.calls.filter(x=>x[0]==='send').length,0);assert.equal(h.system.openFor('owner').length,0);
});
test('blocked DMs do not create staff rooms',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin',['support']));h.failDM();await assert.rejects(h.handlers.get('ticket')(h.message()));assert.equal(h.channels.size,0);
});
test('concurrent ticket opens obey per-member limit',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin',['support']));const r=await Promise.allSettled([h.handlers.get('ticket')(h.message()),h.handlers.get('ticket')(h.message())]);assert.equal(r.filter(x=>x.status==='fulfilled').length,1);assert.equal(h.system.openFor('owner').length,1);
});
test('DM relay verifies ownership and remains private after permission changes',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin',['support']));await h.handlers.get('ticket')(h.message());const [t]=h.system.openFor('owner');
 await assert.rejects(h.system.receive(t,h.message('intruder',[],'dm'),'secret'));
 await h.system.receive(t,h.message('owner',[],'dm'),'hello @everyone');assert.equal(t.messages.length,1);assert.ok(!t.messages[0].text.includes('@everyone'));
 t.lastMessage=0;h.channels.get(t.channelId).private=false;await assert.rejects(h.system.receive(t,h.message('owner',[],'dm'),'secret'));assert.equal(t.messages.length,1);
});
test('support role recognition, claim and safe archive',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin',['support']));await h.handlers.get('ticket')(h.message());const [t]=h.system.openFor('owner');
 assert.equal(await h.system.isStaff('helper'),true);assert.equal(Boolean(await h.system.isStaff('stranger')),false);
 await h.handlers.get('ticketclaim')(h.message('helper',[],t.channelId));assert.equal(t.claimedBy,'helper');
 await assert.rejects(h.handlers.get('ticketclose')(h.message('stranger',[],t.channelId)));
 await h.handlers.get('ticketreply')(h.message('helper',['hello'],t.channelId));assert.equal(t.messages.length,1);
 await h.handlers.get('ticketclose')(h.message());assert.equal(t.status,'closed');assert.equal(h.channels.get(t.channelId).private,true);assert.equal(h.channels.get(t.channelId).readOnly,true);assert.equal(h.channels.size,1);
});
import {responseEmbed,installEmbeds,typedCommand,registerLimited} from './presentation.js';
import {installMore} from './more-commands.js';
test('all ordinary bot responses use safe embeds and preserve reply metadata',async()=>{
 const calls=[],bot={send:async(...args)=>calls.push(args)};installEmbeds(bot);await bot.send('channel','hello @everyone',{replyTo:'message'});
 assert.equal(calls[0][1],'');assert.equal(calls[0][2].replyTo,'message');assert.ok(!calls[0][2].embeds[0].description.includes('@everyone'));assert.equal(responseEmbed('Vigil: failure').color,0xed4245);
 const embed={title:'Existing'};await bot.send('channel','',{embeds:[embed]});assert.equal(calls[1][2].embeds[0],embed);assert.equal(responseEmbed('x'.repeat(8000)).description.length,4000);
});
test('130 built-ins register 100 menu commands and keep 30 typed commands',()=>{
 const bot={commands:new Map(),command(n,d,f){if(this.commands.size>=100)throw Error('SDK limit');this.commands.set(n,f);}},prefix=new Set();
 for(let i=0;i<130;i++)registerLimited(bot,'cmd'+i,'description',()=>{},prefix);
 assert.equal(bot.commands.size,100);assert.equal(prefix.size,30);assert.deepEqual(typedCommand({content:'!cmd129 a b'},prefix,'bot'),{command:'cmd129',args:'a b',argv:['a','b']});
 assert.equal(typedCommand({content:'!cmd129',author_bot:true},prefix,'bot'),null);assert.equal(typedCommand({content:'!cmd129',command_for:['other']},prefix,'bot'),null);assert.equal(typedCommand({content:'!cmd129',command:'cmd129'},prefix,'bot'),null);
});
test('exactly 50 new commands and public economy shortcuts',()=>{
 const entries=new Map(),pub=(n,d,f)=>entries.set(n,{f,access:'public'}),command=(n,d,f)=>entries.set(n,{f,access:'admin'});
 installMore({pub,command,commands:entries,handlers:new Map(),tx:async f=>f(),me:()=>({}),state:{},bot:{},cfg:{},record:async()=>{}});
 assert.equal(entries.size,50);for(const name of ['eco','bal','dep','with','fish','mine','craft','quests','pickjob','buybusiness'])assert.equal(entries.get(name).access,'public');assert.equal(entries.get('setnickname').access,'admin');
});
test('resource gathering cooldown and crafting cannot be repeated for free',async()=>{
 const h=featureHarness();await h.handlers.get('mine')(h.message());assert.equal(h.state.economy.users.user.resources.ore,1);await assert.rejects(h.handlers.get('mine')(h.message()));
 await assert.rejects(h.handlers.get('buybusiness')(h.message(['constructor'])));assert.ok(Number.isFinite(h.state.economy.users.user.wallet));
 await assert.rejects(h.handlers.get('buy')(h.message(['constructor'])));assert.ok(Number.isFinite(h.state.economy.users.user.wallet));
 const a=h.state.economy.users.user;a.resources.ore=4;a.resources.herbs=3;await h.handlers.get('craft')(h.message(['rod']));assert.equal(h.state.economy.users.user.gear.rod,true);await assert.rejects(h.handlers.get('craft')(h.message(['rod'])));
});
test('quests pay only once and job changes do not reset salary cooldown',async()=>{
 const h=featureHarness();await h.handlers.get('balance')(h.message());const a=h.state.economy.users.user;a.tasks={gathered:10};await h.handlers.get('claimquest')(h.message(['gatherer']));assert.equal(h.state.economy.users.user.wallet,500);await assert.rejects(h.handlers.get('claimquest')(h.message(['gatherer'])));
 await h.handlers.get('pickjob')(h.message(['courier']));await h.handlers.get('salary')(h.message());await h.handlers.get('pickjob')(h.message(['engineer']));await assert.rejects(h.handlers.get('salary')(h.message()));
});
import {banWithNotice} from './moderation.js';
test('ban notice is delivered only after successful ban and includes server/reason',async()=>{
 const calls=[];let embed;const bot={server:async()=>({name:'Test Server'}),dm:async()=>{calls.push('dm');return 'dm-id';},ban:async()=>calls.push('ban'),send:async(c,t,o)=>{calls.push('send');embed=o.embeds[0];}};
 assert.equal((await banWithNotice(bot,'server','user','Spam')).notified,true);assert.deepEqual(calls,['dm','ban','send']);assert.ok(embed.description.includes('Test Server'));assert.equal(embed.fields[0].value,'Spam');
});
test('blocked DM does not prevent a ban',async()=>{
 let banned=false;const bot={server:async()=>({name:'Server'}),dm:async()=>{throw Error('DMs blocked');},ban:async()=>{banned=true;}};const r=await banWithNotice(bot,'server','user');assert.equal(banned,true);assert.equal(r.notified,false);
});
test('failed ban never sends a false confirmation',async()=>{
 let sent=false;const bot={server:async()=>({name:'Server'}),dm:async()=>'dm',ban:async()=>{throw Error('Missing ban permission');},send:async()=>{sent=true;}};await assert.rejects(banWithNotice(bot,'server','user'));assert.equal(sent,false);
});
test('post-ban notice failure is reported without repeating the ban',async()=>{
 let bans=0;const bot={server:async()=>({name:'Server'}),dm:async()=>'dm',ban:async()=>{bans++;},send:async()=>{throw Error('No longer share a server');}};const r=await banWithNotice(bot,'server','user');assert.equal(r.notified,false);assert.equal(bans,1);
});
import {installHoneypot} from './honeypot.js';
function honeypotHarness(save=async()=>{}){
 const state={logs:{channelId:'logs'},tickets:{items:{one:{channelId:'ticket'}}}},handlers=new Map(),calls=[];
 const bot={me:{id:'bot'},channel:async id=>({id,server_id:'server',kind:'text'}),send:async()=>calls.push('warning'),createChannel:async()=>({id:'trap'}),delete:async()=>calls.push('delete'),timeout:async()=>calls.push('timeout'),kick:async()=>calls.push('kick')};
 const h=installHoneypot({state,save,command:(n,d,f)=>handlers.set(n,f),bot,cfg:{serverId:'server'},isStaff:async id=>id==='staff',record:async(action,actor,target,detail)=>calls.push({action,detail}),alert:async()=>calls.push('alert')});
 const msg=(id='user',channel='trap')=>({author_id:id,server_id:'server',channel_id:channel,id:'message',argv:[],reply:async()=>{}});
 const configure=(argv,channel='trap')=>handlers.get('honeypot')({...msg('staff',channel),argv});
 return {state,h,calls,bot,msg,configure};
}
test('honeypot is off until configured and refuses log/ticket channels',async()=>{
 const h=honeypotHarness();assert.equal(await h.h.handle(h.msg()),false);await assert.rejects(h.configure(['set','confirm'],'logs'));await assert.rejects(h.configure(['set','confirm'],'ticket'));await assert.rejects(h.configure(['set']));assert.equal(h.state.honeypot.enabled,false);
});
test('honeypot warns before arming and defaults to timeout',async()=>{
 const h=honeypotHarness();await h.configure(['set','confirm']);assert.equal(h.calls[0],'warning');assert.equal(await h.h.handle(h.msg()),true);assert.ok(h.calls.includes('delete'));assert.ok(h.calls.includes('timeout'));assert.equal(h.state.honeypot.hits,1);
});
test('staff, bots, other servers and ordinary channels are exempt',async()=>{
 const h=honeypotHarness();await h.configure(['set','confirm']);for(const m of [h.msg('staff'),h.msg('user','general'),{...h.msg(),server_id:'other'},{...h.msg(),author_bot:true},h.msg('bot')])assert.equal(await h.h.handle(m),false);assert.equal(h.state.honeypot.hits,0);
});
test('duplicate concurrent events cause only one sanction',async()=>{
 const h=honeypotHarness();await h.configure(['set','confirm']);await Promise.all([h.h.handle(h.msg()),h.h.handle(h.msg())]);assert.equal(h.calls.filter(c=>c==='timeout').length,1);
});
test('log-only mode does not delete or sanction, and off keeps the channel',async()=>{
 const h=honeypotHarness();await h.configure(['set','confirm']);await h.configure(['action','log']);await h.h.handle(h.msg());assert.ok(!h.calls.includes('delete'));assert.ok(!h.calls.includes('timeout'));await h.configure(['off']);assert.equal(h.state.honeypot.channelId,'trap');assert.equal(await h.h.handle(h.msg('another')),false);
});
test('kick/ban require explicit command confirmation',async()=>{
 const h=honeypotHarness();await assert.rejects(h.configure(['action','ban']));await assert.rejects(h.configure(['action','kick']));assert.equal(h.state.honeypot.action,'timeout');await h.configure(['action','kick','confirm']);assert.equal(h.state.honeypot.action,'kick');
});
test('a failed sanction is recorded, not reported as successful',async()=>{
 const h=honeypotHarness();await h.configure(['set','confirm']);h.bot.timeout=async()=>{throw Error('Missing Timeout');};await h.h.handle(h.msg());const log=h.calls.find(c=>c.action==='honeypot-trigger');assert.ok(log.detail.includes('timeout failed'));assert.ok(!log.detail.includes('timeout succeeded'));
});
import {TaskScheduler,durationMinutes} from './scheduler.js';
import {installPolicy} from './policy.js';
import {installModerationSuite,safeAutoRole} from './moderation-suite.js';
test('duration parser rejects invalid and excessive durations',()=>{
 assert.equal(durationMinutes('2h'),120);assert.equal(durationMinutes('7d'),10080);for(const value of ['0','-1','Infinity','1.5h','999d','abc'])assert.throws(()=>durationMinutes(value));
});
test('scheduled tasks survive reload and execute only when due',async()=>{
 let now=1000,calls=0;const state={};let scheduler=new TaskScheduler({state,save:async()=>{},execute:async()=>{calls++;},record:async()=>{},now:()=>now});await scheduler.add('unban','user',2000);await scheduler.tick();assert.equal(calls,0);
 scheduler=new TaskScheduler({state:JSON.parse(JSON.stringify(state)),save:async()=>{},execute:async()=>{calls++;},record:async()=>{},now:()=>now});now=2000;await Promise.all([scheduler.tick(),scheduler.tick()]);assert.equal(calls,1);await scheduler.tick();assert.equal(calls,1);
});
test('failed scheduled tasks back off, stop after three attempts, and can be cancelled',async()=>{
 let now=0,calls=0;const state={};const scheduler=new TaskScheduler({state,save:async()=>{},execute:async()=>{calls++;throw Error('No permission');},record:async()=>{},now:()=>now});const j=await scheduler.add('removeRole','user',0,{roleId:'role'});await scheduler.tick();assert.equal(j.status,'pending');assert.equal(calls,1);await scheduler.tick();assert.equal(calls,1);now=30000;await scheduler.tick();now=90000;await scheduler.tick();assert.equal(j.status,'failed');assert.equal(calls,3);const next=await scheduler.add('unban','other',999999);await scheduler.cancel(next.id);assert.equal(next.status,'cancelled');
});
test('safe automatic roles cannot grant administrator or unknown permissions',()=>{
 assert.equal(safeAutoRole({name:'Member',perms:{send_messages:true}}),true);for(const role of [{name:'Member'},{name:'Admin',perms:{administrator:true}},{name:'Staff',manage_messages:true,perms:{}},{name:'@everyone',perms:{}},{name:'Unknown',perms:{new_privilege:true}}])assert.equal(safeAutoRole(role),false);
});
function policyHarness(){const state={},handlers=new Map(),calls=[];const policy=installPolicy({state,save:async()=>{},command:(n,d,f)=>handlers.set(n,f),bot:{member:async()=>({roles:[]}),delete:async()=>calls.push('delete'),timeout:async()=>calls.push('timeout')},cfg:{serverId:'server'},hasAdmin:async id=>id==='admin',record:async()=>calls.push('record')});const msg=(argv=[],text='')=>({argv,content:text,author_id:'user',channel_id:'room',reply:async()=>{}});return {state,handlers,calls,policy,msg};}
test('content filters support allowlisted domains, caps and duplicate matching',async()=>{
 const h=policyHarness();await h.handlers.get('antilink')(h.msg(['on']));await h.handlers.get('linkwhitelist')(h.msg(['add','example.com']));assert.deepEqual(h.policy.inspect('https://sub.example.com/path'),[]);assert.ok(h.policy.inspect('https://notexample.com').includes('link'));
 await h.handlers.get('anticaps')(h.msg(['on']));assert.ok(h.policy.inspect('THIS IS A VERY LOUD MESSAGE').includes('excessive capitals'));await h.handlers.get('antiduplicate')(h.msg(['on']));h.policy.inspect('repeated message','same',1000);assert.ok(h.policy.inspect('repeated message','same',2000).includes('duplicate message'));
});
test('policy exemptions, disable and log-only mode avoid punishment',async()=>{
 const h=policyHarness();await h.handlers.get('antilink')(h.msg(['on']));await h.handlers.get('whitelist')(h.msg(['add','channel','room']));assert.equal(await h.policy.handle(h.msg([],'https://bad.example')),false);assert.ok(!h.calls.includes('timeout'));
 await h.handlers.get('whitelist')(h.msg(['remove','channel','room']));await h.handlers.get('automod')(h.msg(['punishment','log']));assert.equal(await h.policy.handle(h.msg([],'https://bad.example')),true);assert.ok(!h.calls.includes('timeout'));assert.ok(!h.calls.includes('delete'));
 await h.handlers.get('automod')(h.msg(['disable']));assert.equal(await h.policy.handle(h.msg([],'https://bad.example')),false);
});
function suiteHarness(){
 const state={cases:[],warnings:{},locks:{},channels:{},replacements:{},filter:{words:[],allowed:[]}},handlers=new Map(),calls=[];let banFailure=false;
 for(const n of ['ban','bans','clearwarnings','untimeout','slowmode','lock','unlock','release','filter','userinfo','ticket','case','filteradd','filterallow','ticketclose','ticketsetup','tickettranscript','ticketclaim','ticketreply'])handlers.set(n,async()=>{});
 const roles=[{id:'memberrole',name:'Member',perms:{send_messages:true}},{id:'adminrole',name:'Admin',perms:{administrator:true}}];
 const bot={me:{id:'bot'},server:async()=>({name:'Server'}),dm:async()=>'dm',send:async()=>{},ban:async(s,id)=>{if(banFailure)throw Error('No permission');calls.push(['ban',id]);},unban:async(s,id)=>calls.push(['unban',id]),kick:async(s,id)=>calls.push(['kick',id]),timeout:async(s,id,n)=>calls.push(['timeout',id,n]),roles:async()=>roles,member:async()=>({roles:[]}),members:async()=>[],addRole:async(s,id,r)=>calls.push(['addRole',id,r]),removeRole:async(s,id,r)=>calls.push(['removeRole',id,r]),messages:async()=>[{id:'m1',author_id:'user',content:'hello'},{id:'m2',author_id:'other',content:'https://example.com'},{id:'m3',author_id:'user',content:'another'}],bulkDelete:async(c,ids)=>{calls.push(['bulkDelete',ids]);return {deleted:ids.length};}};
 const record=async(action,actor,target,reason)=>{state.cases.push({number:state.cases.length+1,action,actor,target,reason});};
 const suite=installModerationSuite({state,save:async()=>{},command:(n,d,f)=>handlers.set(n,f),handlers,bot,cfg:{serverId:'server',ownerId:'owner',autoRestore:true},hasAdmin:async id=>id==='owner',record,dir:new URL('file:///unused/'),writeFile:async()=>{},policy:{}});
 const msg=(argv=[],author='moderator')=>({argv,author_id:author,channel_id:'room',reply:async()=>{}});
 return {state,handlers,calls,bot,suite,msg,failBan:()=>{banFailure=true;}};
}
test('tempban schedules unban; failed ban does not schedule any task',async()=>{
 const h=suiteHarness();await h.handlers.get('tempban')(h.msg(['user','2h','test']));assert.equal(h.state.scheduledTasks.length,1);assert.equal(h.state.scheduledTasks[0].kind,'unban');const f=suiteHarness();f.failBan();await assert.rejects(f.handlers.get('tempban')(f.msg(['user','1h'])));assert.equal(f.state.scheduledTasks.length,0);
});
test('bulk bans require confirmation and reject protected targets before acting',async()=>{
 const h=suiteHarness();await assert.rejects(h.handlers.get('massban')(h.msg(['user,other'])));await assert.rejects(h.handlers.get('massban')(h.msg(['user,owner','confirm'])));assert.ok(!h.calls.some(x=>x[0]==='ban'));await h.handlers.get('massban')(h.msg(['user,other','confirm','reason']));assert.equal(h.calls.filter(x=>x[0]==='ban').length,2);
});
test('warning thresholds, edits, expiry and appeals stay in local records',async()=>{
 const h=suiteHarness();await h.handlers.get('warnthreshold')(h.msg(['2','10']));await h.handlers.get('warnexpire')(h.msg(['1']));await h.handlers.get('warn')(h.msg(['user','first']));await h.handlers.get('warn')(h.msg(['user','second']));assert.ok(h.calls.some(x=>x[0]==='timeout'));assert.ok(h.state.warnings.user[0].expiresAt>Date.now());
 await h.handlers.get('warnreason')(h.msg(['user','1','revised']));assert.equal(h.state.warnings.user[0].reason,'revised');await h.handlers.get('warnappeal')(h.msg(['1','please','review'],'user'));assert.equal(h.state.modSuite.reports.length,1);h.state.warnings.user[0].expiresAt=1;await h.suite.tick();assert.equal(h.state.warnings.user.length,1);
});
test('purge filters never delete outside last 100-message selection',async()=>{
 const h=suiteHarness();await h.handlers.get('purgelinks')(h.msg());assert.deepEqual(h.calls.find(x=>x[0]==='bulkDelete')[1],['m2']);await assert.rejects(h.handlers.get('purgeafter')(h.msg(['not-in-page'])));await h.handlers.get('purgebetween')(h.msg(['m1','m3']));assert.deepEqual(h.calls.filter(x=>x[0]==='bulkDelete').at(-1)[1],['m2']);
});
test('timed and automatic roles reject privileged roles',async()=>{
 const h=suiteHarness();await assert.rejects(h.handlers.get('autorole')(h.msg(['adminrole'])));await assert.rejects(h.handlers.get('temprole')(h.msg(['user','adminrole','1h'])));assert.ok(!h.calls.some(x=>x[0]==='addRole'));await h.handlers.get('temprole')(h.msg(['user','memberrole','1h']));assert.equal(h.state.scheduledTasks[0].kind,'removeRole');
});
test('reports have a per-member open limit and case edits retain revisions',async()=>{
 const h=suiteHarness();for(let i=0;i<3;i++)await h.handlers.get('report')(h.msg(['suspect','test'],'user'));await assert.rejects(h.handlers.get('report')(h.msg(['suspect','fourth'],'user')));await h.handlers.get('case')(h.msg(['edit','1','reviewed']));assert.ok(h.state.cases[0].revisions.length);await h.handlers.get('case')(h.msg(['delete','1','confirm']));assert.equal(h.state.cases[0].hidden,true);
});
test('scheduled task persistence failure leaves no untracked pending job',async()=>{
 const state={};const scheduler=new TaskScheduler({state,save:async()=>{throw Error('disk full');},execute:async()=>{},record:async()=>{}});await assert.rejects(scheduler.add('unban','user',Date.now()+1000));assert.equal(state.scheduledTasks.length,0);
});
test('reaction roles only remove grants made by Vigil and reject privileged roles',async()=>{
 const h=suiteHarness();h.bot.message=async()=>({id:'message'});await assert.rejects(h.handlers.get('reactionrole')(h.msg(['message','✅','adminrole'])));
 await h.handlers.get('reactionrole')(h.msg(['message','✅','memberrole']));const event={channel_id:'room',message_id:'message',emoji:'✅',user_id:'user'};
 await h.suite.onReaction(event,true);assert.ok(!h.calls.some(x=>x[0]==='removeRole'));
 await h.suite.onReaction(event,false);assert.ok(h.calls.some(x=>x[0]==='addRole'));await h.suite.onReaction(event,true);assert.equal(h.calls.filter(x=>x[0]==='removeRole').length,1);
 h.bot.member=async()=>({roles:['memberrole']});await h.suite.onReaction(event,false);await h.suite.onReaction(event,true);assert.equal(h.calls.filter(x=>x[0]==='removeRole').length,1);
});
test('disabled log categories preserve local audit but do not enqueue server posts',async()=>{
 const h=logHarness();await h.logger.setChannel('logs');h.state.logTypes={voice:false};await h.logger.enqueue('voice event','voice');await h.logger.enqueue('moderation event','moderation');assert.equal(h.state.logs.pending.length,1);await h.logger.flush();assert.ok(h.sent[0].text.includes('moderation'));
});
test('honeypot configuration save failure does not leave a trap armed',async()=>{
 const h=honeypotHarness(async()=>{throw Error('disk full');});await assert.rejects(h.configure(['set','confirm']));assert.equal(h.state.honeypot.enabled,false);assert.equal(h.state.honeypot.channelId,'');assert.equal(await h.h.handle(h.msg()),false);
});
test('staff-note pagination retains the original removal indexes',async()=>{
 const h=suiteHarness();for(let i=1;i<=12;i++)await h.handlers.get('note')(h.msg(['add','user','note'+i]));let reply;await h.handlers.get('notes')({...h.msg(['user']),reply:async text=>{reply=text;}});assert.ok(reply.startsWith('3. note3'));await h.handlers.get('note')(h.msg(['remove','user','3']));assert.equal(h.state.modSuite.notes.user[2].text,'note4');
});
import {PermissionGate,withRequest,firstInRequest,installReadMemo,mapLimit} from './performance.js';
test('permission checks launch independent reads concurrently',async()=>{
 const resolvers=[],calls=[];const deferred=(name,value)=>{calls.push(name);return new Promise(resolve=>resolvers.push(()=>resolve(value)));};
 const bot={server:()=>deferred('server',{owner_id:'owner'}),member:()=>deferred('member',{roles:['admin']}),roles:()=>deferred('roles',[{id:'admin',perms:{administrator:true}}])};
 const gate=new PermissionGate(bot,{serverId:'server'}),decision=gate.check('user');assert.deepEqual(calls,['server','member','roles']);resolvers.forEach(fn=>fn());assert.equal(await decision,true);
});
test('request-local memoization saves duplicate calls but removed admins lose access on next event',async()=>{
 let calls=0,admin=true;const bot={server:async()=>{calls++;return {owner_id:'owner'};},member:async()=>{calls++;return {roles:['role']};},roles:async()=>{calls++;return [{id:'role',perms:{administrator:admin}}];}};installReadMemo(bot);const gate=new PermissionGate(bot,{serverId:'server'});
 await withRequest(async()=>{const results=await Promise.all([gate.check('user'),gate.check('user'),gate.check('user')]);assert.deepEqual(results,[true,true,true]);});assert.equal(calls,3);
 admin=false;await withRequest(async()=>assert.equal(await gate.check('user'),false));assert.equal(calls,6);
});
test('owner transfer and permission read failures do not retain old access',async()=>{
 let owner='old-owner',broken=false;const cfg={serverId:'server'},bot={server:async()=>({owner_id:owner}),member:async()=>{if(broken)throw Error('permission read failed');return {roles:[]};},roles:async()=>[]};const gate=new PermissionGate(bot,cfg);
 assert.equal(await withRequest(()=>gate.check('old-owner')),true);owner='new-owner';assert.equal(await withRequest(()=>gate.check('old-owner')),false);broken=true;await assert.rejects(withRequest(()=>gate.check('ordinary')));assert.equal(await withRequest(()=>gate.check('new-owner')),true);
});
test('nested aliases count as one incoming rate-limit event',async()=>{
 await withRequest(async()=>{assert.equal(firstInRequest('user'),true);assert.equal(firstInRequest('user'),false);assert.equal(firstInRequest('different'),true);});await withRequest(async()=>assert.equal(firstInRequest('user'),true));
});
test('parallel server discovery respects its concurrency limit and isolates failures',async()=>{
 let active=0,peak=0;const result=await mapLimit([0,1,2,3,4,5],3,async n=>{active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));active--;if(n===2)throw Error('one server failed');return n;});assert.ok(peak<=3);assert.equal(result.filter(x=>x.status==='fulfilled').length,5);assert.equal(result[2].status,'rejected');
});
test('audit outbox can be committed with the case using one state save',async()=>{
 const state={},calls=[];let saves=0;const logger=new LogService({state,save:async()=>{saves++;},serverId:'server',bot:{channel:async()=>({server_id:'server',kind:'text'}),send:async()=>calls.push('sent')}});await logger.setChannel('logs');saves=0;
 await logger.enqueue('case','moderation',false);assert.equal(saves,0);assert.equal(state.logs.pending.length,1);await logger.save();assert.equal(saves,1);assert.equal(calls.length,0);
});
test('a current server owner needs one fresh owner read, not member-role round trips',async()=>{
 const calls=[];const bot={server:async()=>{calls.push('server');return {owner_id:'owner'};},member:async()=>{calls.push('member');return {roles:[]};},roles:async()=>{calls.push('roles');return [];}};const gate=new PermissionGate(bot,{serverId:'server',ownerId:'owner'});assert.equal(await withRequest(()=>gate.check('owner')),true);assert.deepEqual(calls,['server']);
});

test('avatar is removed and autowarn records once with a visible notice',async()=>{
 const h=featureHarness(),replies=[];assert.equal(h.handlers.has('avatar'),false);
 const m={...h.message(),content:'n1gg3r',reply:async text=>replies.push(text)};
 await h.features.filter(m);await h.features.filter(m);
 assert.equal(h.state.warnings.user.length,1);assert.equal(h.state.warnings.user[0].automatic,true);assert.ok(replies[0].includes('Warning:'));
});
test('autowarn off preserves language enforcement without warnings',async()=>{
 const h=featureHarness();await h.handlers.get('autowarn')(h.message(['off']));await h.features.filter({...h.message(),content:'fuck'});assert.equal(h.state.warnings?.user,undefined);assert.ok(h.calls.includes('timeout'));
});
test('short fragments do not mute innocent chat',()=>{assert.equal(findSwear('ni nice night ninja'),null);});
test('tickets quick setup works without role IDs and stays private',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin'));await h.handlers.get('ticket')(h.message());const [t]=h.system.openFor('owner');assert.ok(t);assert.equal(h.channels.get(t.channelId).private,true);assert.deepEqual(h.channels.get(t.channelId).roleIds,[]);
});
test('ticket setup accepts support role name',async()=>{
 const h=ticketHarness();await h.handlers.get('ticketsetup')(h.message('admin',['Support']));assert.equal(h.state.tickets.settings.roleId,'support');
});

test('honeypot setup is one step and repeated setup preserves the trap',async()=>{const h=honeypotHarness();await h.configure(['setup']);assert.equal(h.state.honeypot.enabled,true);assert.equal(h.state.honeypot.minutes,10);await h.configure(['setup']);assert.equal(h.calls.filter(x=>x==='warning').length,1);});

test('help automatically includes every command and version without truncation',async()=>{const h=featureHarness(),replies=[];for(let i=0;i<250;i++)h.commands.set('testcommand'+i,'Description '+i+' '+ 'x'.repeat(60));await h.handlers.get('help')({...h.message(),reply:async text=>replies.push(text)});const all=replies.join('\n');assert.ok(all.includes('VIGIL v2.3'));for(const [name]of h.commands)assert.ok(all.includes('/'+name+' — '),name);assert.ok(replies.every(text=>text.length<=4000));});
