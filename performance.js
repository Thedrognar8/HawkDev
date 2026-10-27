import {AsyncLocalStorage} from 'node:async_hooks';
import {ownerFromServer} from './runtime.js';
import {memberHasAdministrator} from './security.js';
const scope=new AsyncLocalStorage();
export function withRequest(fn){return scope.getStore()?fn():scope.run({reads:new Map(),permissions:new Map(),limits:new Set()},fn);}
export function firstInRequest(key){const store=scope.getStore();if(!store)return true;if(store.limits.has(key))return false;store.limits.add(key);return true;}
export function installReadMemo(bot){
 for(const name of ['server','member','roles']){
  const original=bot[name].bind(bot);
  bot[name]=(...args)=>{
   const store=scope.getStore();if(!store)return original(...args);
   const key=name+':'+JSON.stringify(args);if(!store.reads.has(key))store.reads.set(key,Promise.resolve().then(()=>original(...args)));
   return store.reads.get(key);
  };
 }
}
export class PermissionGate{
 constructor(bot,cfg){this.bot=bot;this.cfg=cfg;}
 check(user){
  const store=scope.getStore(),key=this.cfg.serverId+':'+user;
  if(store?.permissions.has(key))return store.permissions.get(key);
  const result=this.fresh(user);if(store)store.permissions.set(key,result);return result;
 }
 async fresh(user){
  if(String(user)===String(this.cfg.ownerId)){this.cfg.ownerId=ownerFromServer(await this.bot.server(this.cfg.serverId));if(String(user)===String(this.cfg.ownerId))return true;}
  // Launch independent reads together; never reuse decisions across incoming events.
  const results=await Promise.allSettled([this.bot.server(this.cfg.serverId),this.bot.member(this.cfg.serverId,user),this.bot.roles(this.cfg.serverId)]);
  if(results[0].status!=='fulfilled')throw results[0].reason;
  this.cfg.ownerId=ownerFromServer(results[0].value);
  if(String(user)===String(this.cfg.ownerId))return true;
  if(results[1].status!=='fulfilled')throw results[1].reason;if(results[2].status!=='fulfilled')throw results[2].reason;
  return memberHasAdministrator(results[1].value,results[2].value);
 }
}
export async function mapLimit(items,limit,fn){
 let index=0;const results=new Array(items.length);
 await Promise.all(Array.from({length:Math.min(limit,items.length)},async()=>{while(index<items.length){const current=index++;try{results[current]={status:'fulfilled',value:await fn(items[current])};}catch(reason){results[current]={status:'rejected',reason};}}}));return results;
}
