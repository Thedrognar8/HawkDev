// Per-server unique join tracking; duplicate gateway events must not trigger a raid.
export class RaidJoinWindow{
 constructor(){this.joins=new Map();this.seen=new Map();}
 observe(id,{now=Date.now(),windowMs=15000,threshold=8,enabled=true,active=false}={}){
  for(const [user,time]of this.seen)if(now-time>=300000)this.seen.delete(user);
  for(const [user,time]of this.joins)if(now-time>=windowMs)this.joins.delete(user);
  if(this.seen.has(id))return {trigger:false,targets:[]};this.seen.set(id,now);
  if(!enabled){this.joins.clear();return {trigger:false,targets:active?[id]:[]};}
  this.joins.set(id,now);const trigger=this.joins.size>=threshold;
  const targets=trigger?[...this.joins.keys()]:active?[id]:[];
  if(trigger)this.joins.clear();
  return {trigger,targets};
 }
}
