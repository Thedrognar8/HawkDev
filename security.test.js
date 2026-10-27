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
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
test('owner authorization uses platform metadata and fails closed',()=>{
 assert.equal(ownerFromServer({owner_id:'actual-owner'}),'actual-owner');
 assert.equal(ownerFromServer({owner:{id:'another-owner'}}),'another-owner');
 for(const s of [{},{owner_id:''},{owner_id:{}},{id:'server-id'}])assert.throws(()=>ownerFromServer(s));
});
test('atomic persistence writes and replaces the correct server files',async()=>{
 const dir=await mkdtemp(new URL('./hawk-test-',import.meta.url));const url=pathToFileURL(dir+'/');
 try{await atomicSave(url,'one','first');await atomicSave(url,'two','other');await atomicSave(url,'one','updated');assert.equal(await readFile(new URL('one.json',url),'utf8'),'updated');assert.equal(await readFile(new URL('two.json',url),'utf8'),'other');}finally{await rm(dir,{recursive:true,force:true});}
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
test('feature commands fit within SDK registration budget',()=>{
 const h=featureHarness();assert.ok(h.commands.size+24<=100);assert.ok(h.commands.has('customadd'));assert.ok(h.commands.has('filter'));assert.ok(h.commands.has('daily'));
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
