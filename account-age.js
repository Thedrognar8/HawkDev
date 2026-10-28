// Only platform-provided account creation dates are used, never join timestamps.
export function accountAgeNote(user,id,now=Date.now()){
 const created=Date.parse(user?.created_at);if(!Number.isFinite(created)||created>now)return null;
 const days=Math.floor((now-created)/86400000);if(days>=5)return null;
 const marker=days<2?'⛔':days===2?'⚠️':'✅';
 const username=String(user.username||user.display_name||'Unknown user').replace(/@/g,'@\u200b').replace(/[\r\n\u0000]/g,' ').slice(0,100);
 return username+' | '+String(id)+' | account made '+(days===0?'less than 1 day ago':days+' day'+(days===1?'':'s')+' ago')+' '+marker;
}
