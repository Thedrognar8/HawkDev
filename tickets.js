import { randomUUID } from 'node:crypto';
const clean = text => String(text||'').replace(/@/g,'@\u200b').replace(/\u0000/g,'').slice(0,1800);
const roleIds = member => (member?.role_ids??member?.roles??[]).map(r=>String(typeof r==='object'?r.id:r));
export function installTickets({state,save,command,bot,cfg,hasAdmin,record}) {
 state.tickets||={settings:{enabled:false,roleId:'',categoryId:'',limit:1},items:{}};
 const data=state.tickets,settings=data.settings;
 let queue=Promise.resolve();
 function serial(fn){const next=queue.then(fn);queue=next.catch(()=>{});return next;}
 async function isStaff(id){return await hasAdmin(id)||(settings.roleId&&roleIds(await bot.member(cfg.serverId,id)).includes(settings.roleId));}
 function openFor(id){return Object.values(data.items).filter(t=>t.owner===String(id)&&t.status==='open');}
 function inChannel(m){const t=Object.values(data.items).find(t=>t.channelId===String(m.channel_id));if(!t)throw Error('Use this inside a ticket staff channel.');return t;}
 async function privateRoom(t){const c=await bot.channel(t.channelId);if(!c||String(c.server_id)!==String(cfg.serverId)||c.private!==true)throw Error('Ticket channel is missing, inaccessible or no longer private. Delivery blocked.');}
 function logMessage(t,from,text){t.messages||=[];if(t.messages.length>=500){t.messages.shift();t.truncated=true;}t.messages.push({time:new Date().toISOString(),from:String(from),text:clean(text)});}
 const admin=(n,d,fn)=>command(n,d,fn);
 const support=(n,d,fn)=>command(n,d,fn,'support');
 const pub=(n,d,fn)=>command(n,d,fn,'public');
 admin('ticketsetup','[SUPPORT_ROLE]: quick setup; default admins only',m=>serial(async()=>{
  const input=m.argv.join(' ').trim();let roleId='';
  if(input){const roles=await bot.roles(cfg.serverId),id=input.replace(/^<@&([\w-]+)>$/,'$1');const matches=roles.filter(r=>String(r.id)===id||String(r.name).toLowerCase()===input.toLowerCase());if(matches.length!==1||/^@?everyone$/i.test(matches[0].name))throw Error('Choose one support role by name, ID or mention. Never use @everyone.');roleId=String(matches[0].id);}
  const categories=await bot.categories(cfg.serverId);
  let category=categories.find(c=>String(c.id)===settings.categoryId)||categories.find(c=>c.name==='Vigil Support');
  if(!category)category=await bot.createCategory(cfg.serverId,'Vigil Support');
  settings.roleId=roleId;settings.categoryId=String(category.id);settings.enabled=true;await save();await record('ticket-setup',m.author_id,roleId||'administrators');
  await m.reply('Tickets ready! Members: /ticket, then DM Vigil. Staff: /ticketreply TEXT in the private room. Access: '+(roleId?'support role + administrators':'administrators only')+'. Optional: /ticketsetup Support to add a role.');
 }));
 admin('ticketrole','SUPPORT_ROLE_ID: change role for future tickets',async m=>{
  const id=String(m.argv[0]||'').replace(/^<@&([\w-]+)>$/,'$1'),role=(await bot.roles(cfg.serverId)).find(r=>String(r.id)===id);
  if(!role||/^@?everyone$/i.test(role.name))throw Error('Invalid support role.');settings.roleId=id;await save();await record('ticket-role',m.author_id,id);await m.reply('Support role updated for future tickets. Existing channel permissions remain unchanged.');
 });
 admin('ticketcategory','CATEGORY_ID: category for future tickets',async m=>{
  const id=String(m.argv[0]||''),found=(await bot.categories(cfg.serverId)).some(c=>String(c.id)===id);if(!found)throw Error('Category must belong to this server.');settings.categoryId=id;await save();await record('ticket-category',m.author_id,id);await m.reply('Category saved.');
 });
 admin('tickettoggle','on|off: allow new tickets',async m=>{if(!['on','off'].includes(m.argv[0]))throw Error('Use on or off.');if(m.argv[0]==='on'&&!settings.categoryId)throw Error('Run /ticketsetup first.');settings.enabled=m.argv[0]==='on';await save();await record('ticket-toggle',m.author_id,cfg.serverId,m.argv[0]);await m.reply('New tickets '+m.argv[0]+'. Existing tickets still work.');});
 admin('ticketlimit','1-3: open tickets per member per server',async m=>{const n=Number(m.argv[0]);if(!Number.isInteger(n)||n<1||n>3)throw Error('Choose 1-3.');settings.limit=n;await save();await record('ticket-limit',m.author_id,cfg.serverId,String(n));await m.reply('Ticket limit saved.');});
 admin('ticketsettings','Show ticket configuration',m=>m.reply(JSON.stringify({...settings,open:Object.values(data.items).filter(t=>t.status==='open').length})));
 admin('ticketpanel','Post ticket instructions here',async m=>{await m.say('🎟 VIGIL SUPPORT\nNeed help? Type !ticket here, then send your details to Vigil in DMs. Only support staff/server administrators can access the staff ticket room. Do not post private information in this public channel.');});
 pub('ticket','Open a private support conversation',m=>serial(async()=>{
  if(!settings.enabled||!settings.categoryId)throw Error('Tickets are not configured or are currently disabled.');
  if(openFor(m.author_id).length>=settings.limit)throw Error('You already reached your open-ticket limit. Continue by messaging Vigil privately.');
  // Open DM first; failure must not create an unusable support room.
  const dm=String(await bot.dm(m.author_id));
  const t={id:'T-'+randomUUID().slice(0,8),owner:String(m.author_id),dmChannelId:dm,channelId:'',status:'opening',created:new Date().toISOString(),claimedBy:'',messages:[]};
  data.items[t.id]=t;await save();
  try{
   const c=await bot.createChannel(cfg.serverId,'ticket-'+t.id.slice(2),{kind:'text',categoryId:settings.categoryId});t.channelId=String(c.id);await save();
   // No identifying or ticket content is posted before private access is verified.
   await bot.editChannel(t.channelId,{private:true,roleIds:settings.roleId?[settings.roleId]:[]});await privateRoom(t);
   const server=await bot.server(cfg.serverId);
   await bot.send(dm,`Ticket ${t.id} opened for ${clean(server.name||cfg.serverId)}. Messages sent here are relayed to that server's support staff. Send text describing your issue. If several tickets are open, use !ticketmsg ${t.id} YOUR MESSAGE. Use !ticketclose in the original server to close your ticket.`);
   await bot.send(t.channelId,`🎟 ${t.id}\nMember ID: ${t.owner}\nStaff: !ticketclaim | !ticketreply TEXT | !ticketclose\nMessages from the member arrive here through Vigil DMs.`);
   t.status='open';await save();await record('ticket-open',m.author_id,t.id);await m.reply('Your support ticket is open. Check your DMs from Vigil.');
  }catch(e){t.status='failed';t.error=String(e.message).slice(0,300);await save();await record('ticket-open-failed',m.author_id,t.id,t.error);throw Error('Could not open ticket: '+e.message+' Check bot channel permissions and allow DMs from Vigil.');}
 }));
 pub('tickets','List your open tickets',m=>m.reply(openFor(m.author_id).map(t=>`${t.id} | Opened ${t.created}`).join('\n')||'No open tickets. Use !ticket.'));
 support('ticketclaim','Assign this ticket to yourself',m=>serial(async()=>{const t=inChannel(m);await privateRoom(t);if(t.status!=='open')throw Error('Ticket is closed.');if(t.claimedBy&&t.claimedBy!==String(m.author_id))throw Error('Already claimed by another staff member.');t.claimedBy=String(m.author_id);await save();await record('ticket-claim',m.author_id,t.id);await m.reply('Ticket claimed.');}));
 support('ticketunclaim','Remove your ticket assignment',m=>serial(async()=>{const t=inChannel(m);if(t.claimedBy!==String(m.author_id)&&!await hasAdmin(m.author_id))throw Error('Only the assigned staff member or an administrator can unclaim.');t.claimedBy='';await save();await record('ticket-unclaim',m.author_id,t.id);await m.reply('Assignment cleared.');}));
 support('ticketreply','TEXT: send a private reply to ticket owner',m=>serial(async()=>{const t=inChannel(m);await privateRoom(t);if(t.status!=='open')throw Error('Ticket is closed.');const text=clean(m.argv.join(' '));if(!text)throw Error('Provide reply text.');await bot.send(t.dmChannelId,`[${t.id}] Support: ${text}`);logMessage(t,m.author_id,text);await save();await record('ticket-reply',m.author_id,t.id);await m.reply('Reply sent.');}));
 pub('ticketclose','Close current staff ticket or your own ticket [ID]',m=>serial(async()=>{
  let t=Object.values(data.items).find(t=>t.channelId===String(m.channel_id));
  if(!t){const list=openFor(m.author_id);t=m.argv[0]?list.find(t=>t.id===m.argv[0]):list.length===1?list[0]:null;}
  if(!t)throw Error('Specify one of your open ticket IDs, or use this in its staff channel.');
  if(t.owner!==String(m.author_id)&&!await isStaff(m.author_id))throw Error('This is not your ticket.');
  if(t.status!=='open')throw Error('Ticket is already closed.');await privateRoom(t);
  // Archive in place instead of deleting the transcript or triggering channel recovery.
  await bot.editChannel(t.channelId,{name:'closed-'+t.id.slice(2),readOnly:true,postRoleIds:[]});
  t.status='closed';t.closed=new Date().toISOString();await save();await record('ticket-close',m.author_id,t.id);
  try{await bot.send(t.dmChannelId,`[${t.id}] Ticket closed. Open another with !ticket in the server if you need more help.`);}catch(e){await record('ticket-close-dm-failed','Vigil',t.id,e.message);}
  await m.reply('Ticket closed and archived privately.');
 }));
 support('tickettranscript','PAGE: saved text transcript in staff room',async m=>{const t=inChannel(m);await privateRoom(t);const page=Number(m.argv[0]||1);if(!Number.isInteger(page)||page<1)throw Error('Choose a positive page number.');const lines=t.messages.slice((page-1)*5,page*5).map(x=>`${x.time} | ${x.from}\n${clean(x.text).slice(0,260)}`);await m.reply(`Transcript ${t.id} | page ${page} | ${t.truncated?'oldest entries expired':'stored text'}\n`+(lines.join('\n\n')||'No entries on this page.'));});
 support('ticketrename','NAME: rename current staff room',async m=>{const t=inChannel(m);await privateRoom(t);const name=m.argv.join('-').toLowerCase().replace(/[^a-z0-9-]/g,'').slice(0,40);if(!name)throw Error('Provide a name.');await bot.editChannel(t.channelId,{name:'ticket-'+name});await record('ticket-rename',m.author_id,t.id);await m.reply('Ticket room renamed.');});
 return {
  isStaff,openFor,flush:()=>queue,
  receive(t,m,text){return serial(async()=>{
   if(t.status!=='open'||t.owner!==String(m.author_id)||t.dmChannelId!==String(m.channel_id))throw Error('Ticket does not belong to this DM sender.');
   text=clean(text);if(!text)throw Error('Send text; attachments are not relayed automatically.');
   const now=Date.now();if(now-(t.lastMessage||0)<3000)throw Error('Wait three seconds before sending another ticket message.');
   await privateRoom(t);await bot.send(t.channelId,`[${t.id}] Member ${t.owner}: ${text}`);t.lastMessage=now;logMessage(t,t.owner,text);await save();
  });}
 };
}
