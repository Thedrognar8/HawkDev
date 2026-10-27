const safe=value=>String(value??'').replace(/@/g,'@\u200b').replace(/[\\`*_~|>]/g,'\\$&');
export async function banWithNotice(bot,serverId,userId,reason='No reason provided.') {
 const [server,dmResult]=await Promise.all([bot.server(serverId),bot.dm(userId).then(value=>({value}),error=>({error:String(error.message).slice(0,300)}))]);
 let dm=dmResult.value,error=dmResult.error||'';
 // Never tell someone they were banned if the platform rejected the ban.
 await bot.ban(serverId,userId);
 if(dm){
  try{
   await bot.send(dm,'',{embeds:[{
    title:'You have been banned',
    description:'You have been banned from **'+safe(server.name||serverId).slice(0,250)+'**.',
    color:0xed4245,
    fields:[{name:'Reason',value:safe(reason||'No reason provided.').slice(0,1000),inline:false}],
    footer:{text:'VIGIL • Server moderation'},timestamp:new Date().toISOString()
   }]});
   return {notified:true,error:''};
  }catch(e){error=String(e.message).slice(0,300);}
 }
 return {notified:false,error:error||'DM unavailable'};
}
