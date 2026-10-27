// Boot the ACTUAL bot module with fake transport/filesystem. Never connects to Yapin.
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),cache=new Map();
const context=vm.createContext({console,URL,Date,Math,Map,Set,Promise,JSON,Number,String,Boolean,Object,Array,RegExp,Error,structuredClone,setTimeout:()=>({unref(){}}),setInterval:()=>0,clearInterval:()=>{},process:{env:{YAPPER_BOT_TOKEN:'yb_offline-test'},on:()=>{},uptime:()=>1}});
class FakeBot{
 constructor(){this.commands=new Map();this.handlers={};this.me={id:'bot'};this.sent=[];this.mutations=[];context.__bot=this;}
 onButton(){return this;}
 on(n,f){(this.handlers[n]||=[]).push(f);return this;}
 command(n,d,f){if(!this.commands.has(n)&&this.commands.size>=100)throw Error('SDK limit exceeded');this.commands.set(n,{description:d,fn:f});return this;}
 async start(){assert.equal(this.commands.size,100,'first connection would publish an empty slash menu');for(const name of ['help','rolebutton','honeypot'])assert.ok(this.commands.has(name));this.ready=(async()=>{for(const fn of this.handlers.ready||[])await fn();})();return this.ready;}
 async servers(){return [{id:'offline-server'}];}
 async server(){return {id:'offline-server',name:'Offline Test',owner_id:'owner'};}
 async roles(){return [{id:'member-role',name:'Member',perms:{send_messages:true}}];}
 async member(){return {roles:['member-role']};}
 async channels(){return [];}
 async categories(){return [];}
 async channel(id){return {id,server_id:'offline-server',kind:'text',private:false};}
 async send(channel,content,options){this.sent.push({channel,content,options});return {id:'message'};}
 async ban(...args){this.mutations.push(['ban',...args]);}
}
const fakeFS={readFile:async file=>{if(String(file).endsWith('vigil.config.json'))return JSON.stringify({pollSeconds:5,autoRestore:false,spamThreshold:7,mentionThreshold:5,joinThreshold:8,joinWindowSeconds:15,servers:{}});const e=Error('missing');e.code='ENOENT';throw e;},writeFile:async()=>{},rename:async()=>{},mkdir:async()=>{},appendFile:async()=>{}};
async function synthetic(name,exports){if(cache.has(name))return cache.get(name);const module=new vm.SyntheticModule(Object.keys(exports),function(){for(const [key,value]of Object.entries(exports))this.setExport(key,value);},{context,identifier:name});cache.set(name,module);return module;}
async function moduleFor(url){
 if(cache.has(url))return cache.get(url);
 const source=await readFile(new URL(url),'utf8');
 const extra=url.endsWith('/vigil.js')?'\nglobalThis.__internals={registry,prefixOnly};':'';
 const module=new vm.SourceTextModule(source+extra,{context,identifier:url,initializeImportMeta:meta=>{meta.url=url;}});cache.set(url,module);return module;
}
async function linker(specifier,parent){
 if(specifier==='node:fs/promises')return synthetic('fake-fs',fakeFS);
 if(specifier.startsWith('node:'))return synthetic(specifier,await import(specifier));
 const url=new URL(specifier,parent.identifier).href;
 if(url.endsWith('/yapper.js'))return synthetic('fake-sdk',{Bot:FakeBot});
 return moduleFor(url);
}
const main=await moduleFor(new URL('vigil.js',root).href);await main.link(linker);await main.evaluate();await context.__bot.ready;
const bot=context.__bot,internals=context.__internals,protection=await internals.registry.get('offline-server');
assert.equal(bot.commands.size,100);for(const name of ['rolebutton','honeypot','ticketsetup'])assert.ok(bot.commands.has(name),name+' missing from slash menu');assert.ok(internals.prefixOnly.size>0);
const replies=[];const msg=(content,argv=[],author='ordinary')=>({id:'test-message',server_id:'offline-server',channel_id:'general',author_id:author,content,argv,reply:(text,opts)=>{replies.push(text);return bot.send('general',text,opts);}});
await protection.handlers.get('bal')(msg('!bal'));
assert.ok(replies.some(r=>r.startsWith('Wallet:')),'non-admin balance command failed');
for(const name of ['massban','tempban','role','honeypot','automod','deletechannel']){await protection.handlers.get(name)(msg('!'+name+' user confirm',['user','confirm']));assert.ok(replies.at(-1).includes('Requires a role with Administrator'),'unauthorized access to '+name);}assert.equal(bot.mutations.length,0,'non-admin reached ban API');
const publicTyped=[...internals.prefixOnly].find(n=>['milestone','botinfo','networth','rolelist'].includes(n));
if(publicTyped){const event=msg('!'+publicTyped,[],'typed-user');for(const fn of bot.handlers.message||[])await fn(event);assert.ok(event.command===publicTyped);assert.ok(!replies.at(-1).startsWith('Vigil:'),'public typed command was rejected');}
assert.ok(bot.sent.length>0&&bot.sent.every(x=>x.content===''&&x.options?.embeds?.length),'a bot reply was not an embed');
console.log(JSON.stringify({offlineBootstrap:'passed',totalCommands:protection.handlers.size,menuCommands:bot.commands.size,typedCommands:internals.prefixOnly.size,nonAdminEconomy:'passed',unauthorizedBan:'blocked',embedReplies:'passed'}));

if(process.argv.includes('--catalog'))console.log('CATALOG='+JSON.stringify([...protection.commands].map(([name,description])=>({name,description,access:protection.accessLevels.get(name)}))));
