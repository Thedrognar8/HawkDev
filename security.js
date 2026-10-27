export class Counter {
 constructor(){this.entries=new Map();}
 hit(key,window,now=Date.now()){const a=(this.entries.get(key)||[]).filter(t=>now-t<window);a.push(now);this.entries.set(key,a);return a.length;}
 sweep(now=Date.now()){for(const [k,a]of this.entries)if(now-a.at(-1)>300000)this.entries.delete(k);}
}
export function safeTarget(u,protectedIds){if(!/^[\w-]{2,100}$/.test(u)||protectedIds.includes(u))throw Error('Invalid or protected target.');}
export function settings(c){
 if(c.private)throw Error('Private channel skipped: SDK cannot recreate its access atomically.');
 if(c.read_only&&!Array.isArray(c.post_role_ids))throw Error('Posting ACL unavailable; restore manually.');
 return {name:c.name,private:false,readOnly:!!c.read_only,postRoleIds:c.post_role_ids,slowmode:c.slowmode||0};
}
// Checked against Yapin's authenticated role API: role.perms.administrator.
export function memberHasAdministrator(member, roles) {
 const assigned=member?.role_ids ?? member?.roles;
 if(!Array.isArray(assigned)||!Array.isArray(roles))return false;
 const ids=new Set(assigned.map(r=>String(typeof r==='object'&&r!==null?r.id:r)));
 return roles.some(role=>ids.has(String(role.id))&&role.perms?.administrator===true);
}
