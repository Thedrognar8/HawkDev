export function durationMinutes(value,max=40320){
 const match=/^(\d+)(m|h|d)?$/i.exec(String(value||''));if(!match)throw Error('Use a duration such as 10m, 2h, or 7d.');
 const n=Number(match[1])*({m:1,h:60,d:1440}[String(match[2]||'m').toLowerCase()]);if(!Number.isSafeInteger(n)||n<1||n>max)throw Error(`Duration must be 1-${max} minutes.`);return n;
}
export class TaskScheduler {
 constructor({state,save,execute,record,now=Date.now}){this.state=state;this.save=save;this.execute=execute;this.record=record;this.now=now;this.busy=false;state.scheduledTasks||=[];}
 async add(kind,target,due,extra={}){
  if(!['unban','removeRole'].includes(kind))throw Error('Unsupported scheduled action.');
  if(this.state.scheduledTasks.filter(j=>j.status==='pending').length>=500)throw Error('500 pending task limit.');
  const before=structuredClone(this.state.scheduledTasks);
  for(const old of this.state.scheduledTasks)if(old.status==='pending'&&old.kind===kind&&old.target===target&&(extra.roleId??'')===(old.roleId??''))old.status='superseded';
  const job={id:'J'+this.now().toString(36)+Math.random().toString(36).slice(2,7),kind,target,due,...extra,status:'pending',attempts:0};
  this.state.scheduledTasks.push(job);try{await this.save();}catch(e){this.state.scheduledTasks=before;throw e;}return job;
 }
 async cancel(id){const j=this.state.scheduledTasks.find(j=>j.id===id&&j.status==='pending');if(!j)throw Error('Pending task not found.');j.status='cancelled';await this.save();return j;}
 async cancelUnban(target){let changed=false;for(const j of this.state.scheduledTasks)if(j.kind==='unban'&&j.target===target&&j.status==='pending'){j.status='cancelled';changed=true;}if(changed)await this.save();}
 async tick(){
  if(this.busy)return;this.busy=true;
  try{for(const j of this.state.scheduledTasks.filter(j=>j.status==='pending'&&j.due<=this.now()).slice(0,5)){
   try{await this.execute(j);j.status='completed';j.completedAt=this.now();await this.save();await this.record('scheduled-'+j.kind,'Vigil',j.target,j.id+' completed');}
   catch(e){j.attempts++;j.error=String(e.message).slice(0,300);if(j.attempts>=3)j.status='failed';else j.due=this.now()+30000*2**(j.attempts-1);await this.save();await this.record('scheduled-failed','Vigil',j.target,j.id+': '+j.error);}
  }}finally{this.busy=false;}
 }
}
