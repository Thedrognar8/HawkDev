import {VERSION} from './version.js';
import {randomUUID} from 'node:crypto';
import {installMore} from './more-commands.js';
import {account,amount,reward,transfer,move,buy,sell,ITEMS,customSet,findSwear} from './features-core.js';
export function installFeatures({state,save,command,commands,handlers,hasAdmin,bot,cfg,record}) {
 state.economy||={users:{}};state.customCommands||={};state.filter||={enabled:true,minutes:5,words:[],allowed:[],channels:[],violations:{}};
 state.filter.autoWarn ??= true;
 let queue=Promise.resolve();
 const me=m=>account(state.economy,String(m.author_id));
 const uid=x=>String(x||'').replace(/^<@!?([\w-]+)>$/,'$1');
 function tx(fn){const next=queue.then(async()=>{const snapshot=structuredClone(state.economy);try{const result=fn();await save();return result;}catch(e){state.economy=snapshot;throw e;}});queue=next.catch(()=>{});return next;}
 const pub=(n,d,fn)=>command(n,d,fn,'public');
 pub('help','All commands, descriptions and running version',async m=>{
  const lines=[...commands].map(([name,description])=>'/'+name+' — '+description);
  const custom=Object.entries(state.customCommands);if(custom.length)lines.push('', 'CUSTOM COMMANDS',...custom.map(([name])=>'/'+name+' — Server custom response'));
  const header='VIGIL v'+VERSION+' — COMPLETE COMMAND GUIDE\n'+commands.size+' built-in command names (including aliases).\nPublic economy/help: everyone. Moderation/config: Administrator. Ticket staff: support role or Administrator. Both / and ! prefixes work.\n\n';
  // Deliver every entry automatically; do not silently truncate at the embed limit.
  const chunks=[];let text=header;for(const line of lines){if(text.length+line.length+1>3400){chunks.push(text);text='';}text+=line+'\n';}if(text)chunks.push(text);
  for(let i=0;i<chunks.length;i++)await m.reply((i?'VIGIL v'+VERSION+' — continued ('+(i+1)+'/'+chunks.length+')\n\n':'')+chunks[i]);
 });
 pub('balance','Your coin balance',m=>m.reply('Wallet: '+me(m).wallet+' coins | Bank: '+me(m).bank));
 pub('bank','Your bank balance',m=>m.reply('Bank: '+me(m).bank+' coins'));
 pub('daily','Claim 1,000 coins every 24 hours',async m=>m.reply('Claimed '+await tx(()=>reward(me(m),'daily',86400000,1000))+' coins.'));
 pub('weekly','Claim 5,000 coins every seven days',async m=>m.reply('Claimed '+await tx(()=>reward(me(m),'weekly',604800000,5000))+' coins.'));
 pub('monthly','Claim 15,000 coins every 30 days',async m=>m.reply('Claimed '+await tx(()=>reward(me(m),'monthly',2592000000,15000))+' coins.'));
 pub('work','Earn coins every five minutes',async m=>m.reply('Work completed: '+await tx(()=>reward(me(m),'work',300000,100+Math.floor(Math.random()*151)))+' coins.'));
 pub('pay','USER_ID AMOUNT: transfer coins',async m=>{const id=uid(m.argv[0]);if(!/^[\w-]{2,100}$/.test(id)||id===String(m.author_id))throw Error('Choose another server member.');await bot.member(cfg.serverId,id);await tx(()=>transfer(me(m),account(state.economy,id),m.argv[1]));await m.reply('Payment sent.');});
 pub('deposit','AMOUNT: wallet to bank',async m=>{await tx(()=>move(me(m),m.argv[0],true));await m.reply('Deposited.');});
 pub('withdraw','AMOUNT: bank to wallet',async m=>{await tx(()=>move(me(m),m.argv[0],false));await m.reply('Withdrawn.');});
 pub('richest','Top ten coin balances',m=>m.reply(Object.entries(state.economy.users).sort((a,b)=>(b[1].wallet+b[1].bank)-(a[1].wallet+a[1].bank)).slice(0,10).map(([id,a],i)=>`${i+1}. ${id}: ${a.wallet+a.bank}`).join('\n')||'No accounts yet.'));
 pub('shop','Coin item catalog',m=>m.reply(Object.entries(ITEMS).map(([n,i])=>`${n}: ${i.price} coins`).join('\n')));
 pub('buy','ITEM [QUANTITY]',async m=>m.reply('Purchased for '+await tx(()=>buy(me(m),m.argv[0],m.argv[1]||1))+' coins.'));
 pub('sell','ITEM [QUANTITY]: sell for 60%',async m=>m.reply('Sold for '+await tx(()=>sell(me(m),m.argv[0],m.argv[1]||1))+' coins.'));
 pub('inventory','Your purchased items',m=>m.reply(Object.entries(me(m).inventory).filter(([,n])=>n>0).map(([n,q])=>n+' x'+q).join('\n')||'Empty inventory.'));
 pub('profile','Your economy profile',m=>{const a=me(m);return m.reply(`Wallet ${a.wallet} | Bank ${a.bank} | Lifetime earned ${a.earned}`);});
 pub('cooldowns','Remaining reward cooldowns',m=>{const waits={daily:86400000,weekly:604800000,monthly:2592000000,work:300000};return m.reply(Object.entries(waits).map(([k,w])=>k+': '+Math.max(0,Math.ceil(((me(m).cooldowns[k]||0)+w-Date.now())/1000))+'s').join('\n'));});
 pub('economy','Economy quick guide',m=>m.reply('!daily !weekly !monthly !work earn coins. !pay USER_ID AMOUNT sends coins. !deposit / !withdraw store coins. !shop !buy !sell !inventory. Coins have no real-money value.'));
 command('addmoney','USER_ID AMOUNT',async m=>{const id=uid(m.argv[0]);await bot.member(cfg.serverId,id);const n=amount(m.argv[1]);await tx(()=>{const a=account(state.economy,id);if(a.wallet+n>1e15)throw Error('Balance cap.');a.wallet+=n;});await record('addmoney',m.author_id,id,String(n));await m.reply('Coins added.');});
 command('removemoney','USER_ID AMOUNT',async m=>{const id=uid(m.argv[0]),n=amount(m.argv[1]);await tx(()=>{const a=account(state.economy,id);if(a.wallet<n)throw Error('Not enough coins.');a.wallet-=n;});await record('removemoney',m.author_id,id,String(n));await m.reply('Coins removed.');});
 command('resetmoney','USER_ID confirm',async m=>{const id=uid(m.argv[0]);if(m.argv[1]!=='confirm')throw Error('Use USER_ID confirm.');await tx(()=>{delete state.economy.users[id];});await record('resetmoney',m.author_id,id);await m.reply('Economy account reset.');});
 command('filter','on|off|status',async m=>{const f=state.filter;if(['on','off'].includes(m.argv[0])){f.enabled=m.argv[0]==='on';await save();}await m.reply(`Swear filter ${f.enabled?'ON':'OFF'} | timeout ${f.minutes} minutes | custom words ${f.words.length}. Admins exempt.`);});
 command('filtertime','Timeout length: 1-1440 minutes',async m=>{const n=amount(m.argv[0]);if(n>1440)throw Error('Maximum 1440 minutes.');state.filter.minutes=n;await save();await m.reply('Timeout length saved.');});
 command('filteradd','Add a blocked word',async m=>{const word=String(m.argv[0]||'').toLowerCase();if(!/^[\p{L}]{2,40}$/u.test(word))throw Error('Use one word, 2-40 letters.');if(!state.filter.words.includes(word))state.filter.words.push(word);state.filter.allowed=state.filter.allowed.filter(w=>w!==word);await save();await m.reply('Blocked word saved.');});
 command('filterallow','Allow an otherwise blocked word',async m=>{const word=String(m.argv[0]||'').toLowerCase();if(!/^[\p{L}]{2,40}$/u.test(word))throw Error('Use one word.');if(!state.filter.allowed.includes(word))state.filter.allowed.push(word);await save();await m.reply('Word exception saved.');});
 command('filterwords','List custom words and exceptions',m=>m.reply(JSON.stringify({blocked:state.filter.words,allowed:state.filter.allowed}).slice(0,1800)));
 command('filterignore','Exempt this channel',async m=>{if(!state.filter.channels.includes(m.channel_id))state.filter.channels.push(m.channel_id);await save();await m.reply('Channel exempted.');});
 command('filterunignore','Enable filter in this channel',async m=>{state.filter.channels=state.filter.channels.filter(id=>id!==m.channel_id);await save();await m.reply('Channel filter enabled.');});
 command('autowarn','on|off|status: automatic chat warnings',async m=>{const value=m.argv[0];if(value&&!['on','off','status'].includes(value))throw Error('Use on, off or status.');if(['on','off'].includes(value)){state.filter.autoWarn=value==='on';await save();}await m.reply('Automatic chat warnings '+(state.filter.autoWarn?'ON':'OFF')+'. Uses the existing warning threshold.');});
 command('filtertest','TEXT: dry-run the language filter',m=>m.reply('Filter match: '+(findSwear(m.argv.join(' '),state.filter.words,state.filter.allowed)?'blocked language':'none')+'. No action taken.'));
 command('filterstats','Swear violation counts',m=>m.reply(JSON.stringify(state.filter.violations).slice(0,1800)));
 command('customadd','NAME RESPONSE: save custom command',async m=>{const name=String(m.argv[0]||'').toLowerCase();if(handlers.has(name))throw Error('That is a built-in command.');customSet(state.customCommands,name,m.argv.slice(1).join(' '));await save();await m.reply('Saved !'+name);});
 command('customdelete','NAME: remove custom command',async m=>{delete state.customCommands[m.argv[0]];await save();await m.reply('Custom command removed.');});
 pub('customlist','List custom commands: PAGE',m=>{const page=Math.max(1,Number(m.argv[0])||1),names=Object.keys(state.customCommands);return m.reply(`Custom commands ${names.length}/500\n`+(names.slice((page-1)*30,page*30).map(n=>'!'+n).join(', ')||'No commands on this page.'));});
 pub('commandcount','Count built-in and custom commands',m=>m.reply(`${commands.size} built-in commands; ${Object.keys(state.customCommands).length}/500 custom commands.`));
 pub('serverinfo','Server details',async m=>{const s=await bot.server(cfg.serverId);await m.reply('Server: '+String(s.name||cfg.serverId).replace(/@/g,'@\u200b'));});
 pub('coinflip','Flip a coin',m=>m.reply(Math.random()<.5?'Heads':'Tails'));
 pub('roll','Roll a die: SIDES',m=>{const n=Number(m.argv[0]||6);if(!Number.isInteger(n)||n<2||n>1000)throw Error('Sides: 2-1000.');return m.reply(String(1+Math.floor(Math.random()*n)));});
 installMore({pub,command,commands,handlers,tx,me,state,bot,cfg,record});
 const customCooldown=new Map(),filterCooldown=new Map();
 return {
 async filter(m){
  const f=state.filter;if(!f.enabled||m.author_bot||f.channels.includes(m.channel_id))return false;
  if(!findSwear(m.content,f.words,f.allowed))return false;
  if(await hasAdmin(m.author_id))return false;
  if(Date.now()-(filterCooldown.get(m.author_id)||0)<5000)return true;filterCooldown.set(m.author_id,Date.now());
  // Persist a warning before punishment, once per moderation cooldown.
  if(f.autoWarn){state.warnings||={};const rules=state.modSuite?.warnSettings||{},now=Date.now();const warnings=(state.warnings[m.author_id]||[]).filter(w=>!w.expiresAt||w.expiresAt>now);warnings.push({id:randomUUID(),actor:'Vigil',reason:'Automatic chat warning: blocked language',time:now,expiresAt:rules.expireDays?now+rules.expireDays*86400000:0,notes:[],automatic:true});state.warnings[m.author_id]=warnings;await save();}
  const rules=state.modSuite?.warnSettings||{};
  const minutes=rules.threshold>0&&(state.warnings?.[m.author_id]?.length||0)>=rules.threshold?Math.max(f.minutes,rules.minutes||1):f.minutes;
  // Attempt both actions even if deletion lacks permission; report individual failures.
  const results=await Promise.allSettled([bot.delete(m.channel_id,m.id),bot.timeout(cfg.serverId,m.author_id,minutes,'Vigil chat filter')]);
  f.violations[m.author_id]=(f.violations[m.author_id]||0)+1;
  await record('swear-filter','Vigil',m.author_id,results.map((r,i)=>`${i===0?'delete':'timeout'}: ${r.status}${r.reason?': '+r.reason.message:''}`).join('; '));
  if(f.autoWarn){try{await m.reply('Warning: blocked language. Follow the server chat rules. Warnings: '+state.warnings[m.author_id].length+'.');}catch(e){await record('warning-notice-failed','Vigil',m.author_id,e.message);}}
  return true;
 },
 async custom(m){
  if(m.author_bot||m.command||!String(m.content||'').startsWith('!'))return;
  const name=String(m.content).slice(1).trim().split(/\s+/)[0].toLowerCase();
  if(!Object.hasOwn(state.customCommands,name))return;
  if(Date.now()-(customCooldown.get(m.author_id)||0)<3000)return;
  customCooldown.set(m.author_id,Date.now());await m.reply(state.customCommands[name]);
 }
 };
}
