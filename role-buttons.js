import {randomUUID} from 'node:crypto';
import {safeAutoRole} from './moderation-suite.js';
const clean=text=>String(text||'').replace(/@/g,'@\u200b');
export function installRoleButtons({state,save,command,bot,cfg,record}){
 state.roleButtons||={};const panels=state.roleButtons;let queue=Promise.resolve();
 command('rolebutton','ROLE_ID LABEL | MESSAGE; list; remove PANEL_ID',async m=>{
  if(m.argv[0]==='list'){await m.reply(Object.entries(panels).map(([id,p])=>id+' | '+p.label+' | role '+p.roleId+' | '+(p.enabled?'active':'disabled')).join('\n')||'No role buttons.');return;}
  if(m.argv[0]==='remove'){const p=panels[m.argv[1]];if(!p)throw Error('Panel not found. Use /rolebutton list.');p.enabled=false;await save();await record('rolebutton-disable',m.author_id,p.roleId);await m.reply('Role button disabled. Existing roles remain.');return;}
  if(!m.argv.length){await m.reply('ROLE BUTTON SETUP\n/rolebutton @Role Button label | Embed message\nExample: /rolebutton @Update notification Get updates | Click below for update notifications.\nYou can also use a role ID. Optional message follows |.\n/rolebutton list — show panels\n/rolebutton remove PANEL_ID — disable a panel');return;}
  const roles=await bot.roles(cfg.serverId),selection=resolveRoleSelection(m.argv,roles);
  if(!selection)throw Error('Role not found. Use a role mention, exact role name or ID. Example: /rolebutton @Update notification Get updates | Click for updates.');
  const {role,rest}=selection;const roleId=String(role.id);
  const [rawLabel,...body]=rest.join(' ').split('|');const label=clean(rawLabel).trim(),description=clean(body.join('|').trim()||'Click below to toggle this role.');
  if(!label||label.length>60||description.length>1800)throw Error('Use /rolebutton ROLE_ID Button label | Panel message. Label: 1–60 characters; message: up to 1800.');
  if(!safeAutoRole(role))throw Error('This role has elevated or unknown permissions. Use a notification role without moderation or administrative permissions.');
  const id=randomUUID();panels[id]={roleId,label,channelId:String(m.channel_id),enabled:false};await save();
  const message=await bot.send(m.channel_id,'',{embeds:[{title:'Choose your roles',description,color:0xa855f7}],components:[{type:'row',components:[{type:'button',style:'primary',label,custom_id:'vigil-role:'+id}]}]});
  if(!message?.id)throw Error('Platform did not return the panel message ID. Button remains disabled.');
  Object.assign(panels[id],{messageId:String(message.id),enabled:true});try{await save();}catch(e){panels[id].enabled=false;throw e;}
  await record('rolebutton-create',m.author_id,roleId,id);await m.reply('Role button posted. Click once to add the role, again to remove it. Panel ID: '+id);
 });
 return {click(i){const next=queue.then(async()=>{
  const id=String(i.custom_id||'').replace(/^vigil-role:/,''),p=panels[id];
  if(!p?.enabled)throw Error('This role button is disabled.');
  const channel=await bot.channel(i.channel_id);if(String(channel?.server_id)!==String(cfg.serverId)||String(i.channel_id)!==p.channelId||String(i.message_id??i.message?.id)!==p.messageId)throw Error('This button is not linked to this panel.');
  const role=(await bot.roles(cfg.serverId)).find(r=>String(r.id)===p.roleId);if(!safeAutoRole(role))throw Error('The linked role is missing or now has elevated permissions.');
  const member=await bot.member(cfg.serverId,i.user_id),ids=(member?.role_ids??member?.roles??[]).map(r=>String(typeof r==='object'?r.id:r));
  const remove=ids.includes(p.roleId);await bot[remove?'removeRole':'addRole'](cfg.serverId,i.user_id,p.roleId);
  await record(remove?'rolebutton-remove':'rolebutton-grant',i.user_id,p.roleId,id);
  await i.ephemeral(clean(role.name)+' '+(remove?'removed.':'added.'));
 });queue=next.catch(()=>{});return next;}};
}

// Longest exact name wins, preserving labels after multi-word role names.
export function resolveRoleSelection(argv,roles){
 const first=String(argv[0]||''),id=first.replace(/^<@&([\w-]+)>$/,'$1');
 const byId=roles.find(r=>String(r.id)===id);if(byId)return {role:byId,rest:argv.slice(1)};
 for(let count=argv.length;count>0;count--){const name=argv.slice(0,count).join(' ').replace(/^@/,'').replace(/^"|"$/g,'').toLowerCase();const matches=roles.filter(r=>String(r.name).toLowerCase()===name);if(matches.length>1)throw Error('Multiple roles share that name. Use a role ID.');if(matches.length===1)return {role:matches[0],rest:argv.slice(count)};}
 return null;
}
