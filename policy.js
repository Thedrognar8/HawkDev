const clean=s=>String(s||'').replace(/@/g,'@\u200b').slice(0,1800);
export function installPolicy({state,save,command,bot,cfg,hasAdmin,record}){
 state.policy||={enabled:true,flags:{spam:true,mentions:true,everyone:true,links:false,invites:false,caps:false,emoji:false,duplicate:false,zalgo:false,phishing:false},allowedDomains:[],blockedDomains:[],ignoredUsers:[],ignoredRoles:[],ignoredChannels:[],action:'timeout',minutes:5};
 const p=state.policy,last=new Map(),cooldown=new Map();
 const setting=async()=>{await save();};
 async function ignored(m){if(p.ignoredChannels.includes(String(m.channel_id))||p.ignoredUsers.includes(String(m.author_id)))return true;if(p.ignoredRoles.length){const member=await bot.member(cfg.serverId,m.author_id),ids=member?.role_ids??member?.roles??[];if(ids.some(r=>p.ignoredRoles.includes(String(typeof r==='object'?r.id:r))))return true;}return false;}
 function inspect(content,user='test',now=Date.now(),mutate=true){
  const text=String(content||'').slice(0,4000),reasons=[];
  const domains=[];for(const match of text.matchAll(/https?:\/\/[^\s<>]+/gi)){try{domains.push(new URL(match[0]).hostname.toLowerCase());}catch{}}
  const allowed=host=>p.allowedDomains.some(d=>host===d||host.endsWith('.'+d));
  if(p.flags.links&&domains.some(d=>!allowed(d)))reasons.push('link');
  if(p.flags.invites&&/(?:yapin\.gg|yapper\.website)\/invite\/|discord\.gg\/|discord(?:app)?\.com\/invite\//i.test(text))reasons.push('invite');
  if(p.flags.phishing&&domains.some(d=>p.blockedDomains.some(b=>d===b||d.endsWith('.'+b))))reasons.push('blocked domain');
  const letters=text.match(/[a-z]/gi)||[],upper=text.match(/[A-Z]/g)||[];
  if(p.flags.caps&&letters.length>=15&&upper.length/letters.length>.8)reasons.push('excessive capitals');
  if(p.flags.emoji&&(text.match(/\p{Extended_Pictographic}/gu)||[]).length>=12)reasons.push('emoji spam');
  if(p.flags.zalgo&&(text.match(/\p{M}/gu)||[]).length>=15)reasons.push('combining-mark spam');
  const prior=last.get(user);if(p.flags.duplicate&&prior&&now-prior.time<15000&&prior.text===text&&text.length>=5)reasons.push('duplicate message');
  if(mutate){last.set(user,{time:now,text});if(last.size>10000)last.delete(last.keys().next().value);}
  return reasons;
 }
 const toggles={antispam:'spam',antimention:'mentions',antieveryone:'everyone',antilink:'links',antiinvite:'invites',antiinviteadvert:'invites',anticaps:'caps',antiemoji:'emoji',antiduplicate:'duplicate',antizalgo:'zalgo',antiscam:'phishing',antiphishing:'phishing'};
 for(const [name,flag]of Object.entries(toggles))command(name,'on|off: configure '+flag,async m=>{if(!['on','off'].includes(m.argv[0]))throw Error('Use on or off.');p.flags[flag]=m.argv[0]==='on';await setting();await record('automod-setting',m.author_id,cfg.serverId,name+' '+m.argv[0]);await m.reply(name+' '+m.argv[0]+(flag==='phishing'?'. Uses your linkblacklist, not an external scam database.':'.'));});
 command('automod','enable|disable|status|test|punishment|ignore|logs',async m=>{
  const [sub,...args]=m.argv;
  if(['enable','disable'].includes(sub)){p.enabled=sub==='enable';await setting();await record('automod-master',m.author_id,cfg.serverId,sub);await m.reply('Automod '+sub+'d.');}
  else if(sub==='punishment'){if(!['log','timeout'].includes(args[0]))throw Error('Use log or timeout [MINUTES].');const n=args[1]?Number(args[1]):5;if(!Number.isInteger(n)||n<1||n>1440)throw Error('Timeout: 1-1440 minutes.');p.action=args[0];p.minutes=n;await setting();await m.reply('Additional content filters: '+p.action+'. Built-in swear/spam and honeypot keep their own configured actions.');}
  else if(sub==='ignore'){const [type,id]=args;if(!['user','role','channel'].includes(type)||!/^[-\w]{2,100}$/.test(id||''))throw Error('Use ignore user|role|channel ID.');const list=p['ignored'+({user:'Users',role:'Roles',channel:'Channels'}[type])];if(!list.includes(id))list.push(id);await setting();await m.reply('Automod exemption saved. Honeypot and ticket checks are separate.');}
  else if(sub==='logs'){await m.reply('Automod uses !setlogs and local audit records.');}
  else if(sub==='test'){await m.reply('Dry-run content matches: '+(inspect(args.join(' '),'test',Date.now(),false).join(', ')||'none')+'. No moderation action performed.');}
  else if(!sub||sub==='status')await m.reply(JSON.stringify(p).slice(0,1800));
  else throw Error('Use enable, disable, status, test TEXT, punishment, ignore or logs.');
 });
 for(const [name,key]of [['linkwhitelist','allowedDomains'],['linkblacklist','blockedDomains']])command(name,'add|remove|list DOMAIN',async m=>{const [sub,raw]=m.argv;if(!sub||sub==='list'){await m.reply(p[key].join('\n')||'No domains configured.');return;}let domain;try{domain=new URL(raw?.includes('://')?raw:'https://'+raw).hostname.toLowerCase();}catch{throw Error('Use a valid domain.');}if(!domain.includes('.')||!['add','remove'].includes(sub))throw Error('Use add|remove DOMAIN.');if(sub==='add'&&!p[key].includes(domain))p[key].push(domain);if(sub==='remove')p[key]=p[key].filter(d=>d!==domain);await setting();await record(name,m.author_id,domain,sub);await m.reply('Domain list updated.');});
 command('whitelist','add|remove|list user|role|channel ID',async m=>{const [sub,type,id]=m.argv;if(sub==='list'){await m.reply(JSON.stringify({users:p.ignoredUsers,roles:p.ignoredRoles,channels:p.ignoredChannels}));return;}const key={user:'ignoredUsers',role:'ignoredRoles',channel:'ignoredChannels'}[type];if(!key||!/^[-\w]{2,100}$/.test(id||'')||!['add','remove'].includes(sub))throw Error('Use add|remove user|role|channel ID.');if(sub==='add'&&!p[key].includes(id))p[key].push(id);if(sub==='remove')p[key]=p[key].filter(x=>x!==id);await setting();await record('automod-whitelist',m.author_id,id,sub+' '+type);await m.reply('Exemption list updated.');});
 return {settings:p,ignored,inspect,async handle(m){if(!p.enabled||m.author_bot||await ignored(m))return false;const reasons=inspect(m.content,String(m.author_id));if(!reasons.length)return false;if(await hasAdmin(m.author_id))return false;if(Date.now()-(cooldown.get(m.author_id)||0)<15000)return true;cooldown.set(m.author_id,Date.now());const outcomes=[];if(p.action==='timeout'){for(const [label,fn]of [['delete',()=>bot.delete(m.channel_id,m.id)],['timeout',()=>bot.timeout(cfg.serverId,m.author_id,p.minutes,'Automod: '+reasons.join(', '))]]){try{await fn();outcomes.push(label+' succeeded');}catch(e){outcomes.push(label+' failed: '+e.message);}}}await record('content-filter','Vigil',m.author_id,reasons.join(', ')+' | '+clean(outcomes.join('; ')||'log-only'));return true;}};
}
