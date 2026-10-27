import { writeFile, rename } from 'node:fs/promises';
export function ownerFromServer(server) {
 const value=server?.owner_id ?? server?.owner?.id;
 if(!['string','number'].includes(typeof value)||! /^[\w-]{2,100}$/.test(String(value)))throw Error('Yapin did not return a verifiable server owner. Owner-only commands remain unavailable.');
 return String(value);
}
export async function atomicSave(directory,id,text){
 if(!/^[\w-]{1,100}$/.test(id))throw Error('Invalid state file ID');
 const temp=new URL(id+'.tmp',directory),dest=new URL(id+'.json',directory);
 await writeFile(temp,text);await rename(temp,dest);
}
