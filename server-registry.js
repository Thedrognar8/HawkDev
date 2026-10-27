// Memoized initialization prevents simultaneous events from creating two state stores.
export class ServerRegistry {
 constructor(create){this.create=create;this.entries=new Map();}
 get(value){
  const id=String(value||'');
  if(!/^[\w-]{1,100}$/.test(id))return Promise.reject(Error('Invalid server ID from event.'));
  if(!this.entries.has(id)){
   const pending=Promise.resolve().then(()=>this.create(id));
   this.entries.set(id,pending);
   pending.catch(()=>{if(this.entries.get(id)===pending)this.entries.delete(id);});
  }
  return this.entries.get(id);
 }
}
