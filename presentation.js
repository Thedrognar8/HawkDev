import {VERSION} from './version.js';
export function responseEmbed(text){
 const value=String(text??'').replace(/@/g,'@\u200b');
 const error=/^(Vigil:|Ticket delivery failed:)|\b(TEST SUITE FAILED|PROTECTION ALERT|CHANNEL LOSS)\b/i.test(value);
 const log=value.startsWith('[VIGIL LOG]');
 return {title:error?'VIGIL • Attention':log?'VIGIL • Activity log':'VIGIL • #1 BOT',description:value.slice(0,4000)||'Done.',color:error?0xed4245:log?0x22b8a0:0xa855f7,footer:{text:'VIGIL v'+VERSION+'  •  Community control center'},timestamp:new Date().toISOString()};
}
export function installEmbeds(bot){
 const send=bot.send.bind(bot);
 bot.send=(channel,text='',options={})=>{
  if(options.embeds?.length)return send(channel,text,options);
  return send(channel,'',{...options,embeds:[responseEmbed(text)]});
 };
}
// The platform menu is capped; additional built-ins still use the same handlers/auth.
export function typedCommand(message,prefixOnly,botId){
 if(message.command||message.author_bot)return null;
 if(Array.isArray(message.command_for)&&!message.command_for.includes(botId))return null;
 const match=/^[!/]([a-z0-9_-]{1,32})(?:\s+([\s\S]*))?$/i.exec(String(message.content||''));
 if(!match||!prefixOnly.has(match[1].toLowerCase()))return null;
 const args=(match[2]||'').trim();return {command:match[1].toLowerCase(),args,argv:args?args.split(/\s+/):[]};
}
export function registerLimited(bot,name,description,handler,prefixOnly){
 const priority=new Set(['help','welcome','reactroles','honeypot','ticketsetup','ticket','automod','filter','autowarn','setlogs','ban','kick','warn']);
 if(bot.commands.size>=100&&!bot.commands.has(name)){
  if(priority.has(name)){const victim=[...bot.commands.keys()].reverse().find(n=>!priority.has(n));if(victim){bot.commands.delete(victim);prefixOnly.add(victim);}else{prefixOnly.add(name);return false;}}
  else{prefixOnly.add(name);return false;}
 }
 prefixOnly.delete(name);
 bot.command(name,description,handler);return true;
}
