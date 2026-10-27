import {readFile,access,readdir,stat} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const root=new URL('./',import.meta.url),args=new Set(process.argv.slice(2));
const terminal=Boolean(process.stdout.isTTY),interactive=Boolean(process.stdin.isTTY&&terminal);
const input=createInterface({input:process.stdin,output:process.stdout});
const REQUIRED=['bot.js','hawk.js','yapper.js','features.js','features-core.js','security.js','runtime.js','server-registry.js','logging.js','tickets.js','presentation.js','more-commands.js','moderation.js','honeypot.js','policy.js','scheduler.js','moderation-suite.js','performance.js'];
const THEMES=[{name:'NEBULA',accent:165,gradient:[54,90,129,165,171,213]},{name:'GLACIER',accent:51,gradient:[17,24,31,38,45,51]},{name:'SOLAR',accent:214,gradient:[130,166,172,208,214,220]},{name:'PHOSPHOR',accent:46,gradient:[22,28,34,40,46,82]}];
let theme=0,launched=false;
const color=(code,text)=>terminal&&!process.env.NO_COLOR?`\x1b[${code}m${text}\x1b[0m`:String(text);
const ink=text=>color('38;5;'+THEMES[theme].accent,text),muted=text=>color('90',text);
const width=60;
function panel(title,rows){
 console.log(ink('  ╭─ '+title+' '+ '─'.repeat(Math.max(0,width-title.length-3))+'╮'));
 for(const row of rows){const plain=String(row).slice(0,width-2);console.log(ink('  │ ')+plain.padEnd(width-2)+ink(' │'));}
 console.log(ink('  ╰'+'─'.repeat(width)+'╯'));
}
function banner(){
 const logo=['██╗   ██╗██╗ ██████╗ ██╗██╗     ','██║   ██║██║██╔════╝ ██║██║     ','██║   ██║██║██║  ███╗██║██║     ','╚██╗ ██╔╝██║██║   ██║██║██║     ',' ╚████╔╝ ██║╚██████╔╝██║███████╗','  ╚═══╝  ╚═╝ ╚═════╝ ╚═╝╚══════╝'];
 console.log('\n'+muted('  V I G I L  /  O P E R A T I O N S  T E R M I N A L')+'\n');
 logo.forEach((row,i)=>console.log(color('38;5;'+THEMES[theme].gradient[i],'       '+row)));
 console.log('\n'+color('1;97','                    #1 COMMUNITY BOT')+'\n');
 panel('SENTINEL / LOCAL CONSOLE',[
  'PROTECT. MODERATE. SUPPORT. BUILD YOUR COMMUNITY.',
  'Node '+process.versions.node+'  /  '+process.platform+'  /  '+THEMES[theme].name,
  new Date().toLocaleString()+'  /  API connects after launch'
 ]);console.log();
}
async function readToken(){
 if(process.env.YAPPER_BOT_TOKEN?.trim())return {value:process.env.YAPPER_BOT_TOKEN.trim(),source:'environment'};
 try{return {value:(await readFile(new URL('token.txt',root),'utf8')).replace(/^\uFEFF/,'').trim(),source:'token.txt'};}catch(e){if(e.code!=='ENOENT')throw e;return {value:'',source:'not configured'};}
}
const valid=value=>/^yb_\S+$/.test(value||'');
async function checks(){
 const files=await Promise.all(REQUIRED.map(async name=>{try{await access(new URL(name,root));return {name,ok:true};}catch{return {name,ok:false};}}));
 let config;try{const cfg=JSON.parse((await readFile(new URL('hawk.config.json',root),'utf8')).replace(/^\uFEFF/,''));if(!cfg||typeof cfg!=='object'||Array.isArray(cfg)||!Number.isFinite(cfg.pollSeconds)||cfg.pollSeconds<5)throw Error('pollSeconds must be at least 5');config={name:'Configuration parsed',ok:true};}catch(e){config={name:'Configuration: '+e.message,ok:false};}
 return [{name:'Node.js '+process.versions.node,ok:Number(process.versions.node.split('.')[0])>=18},...files,config];
}
async function boot(){
 if(!interactive||args.has('--no-animation'))return;
 const phases=[['MODULE MANIFEST',async()=>{const list=await checks();return list.every(c=>c.ok)?'READY':list.filter(c=>!c.ok).length+' CHECKS FAILED';}],['LOCAL CREDENTIAL',async()=>valid((await readToken()).value)?'FORMAT OK / HIDDEN':'TOKEN NEEDED'],['TRANSPORT',async()=> 'GATEWAY CONNECTS ON START']];
 console.log(muted('  INITIALIZING SENTINEL CONSOLE'));
 for(const [name,fn]of phases){process.stdout.write('  '+ink('◈')+' '+name.padEnd(22));const result=await fn();await delay(50);console.log(color(result.includes('FAILED')?'31':'36',result));}
 for(let i=0;i<=24;i++){process.stdout.write('\r  '+ink('['+'━'.repeat(i)+'─'.repeat(24-i)+']')+' '+String(Math.round(i/24*100)).padStart(3)+'%  '+muted('LOCAL UI'));await delay(7);}
 console.log('\n');
}
async function diagnostics(){
 const results=await checks(),token=await readToken();
 panel('PREFLIGHT / OFFLINE CHECKS',results.map(c=>(c.ok?'[OK]   ':'[FAIL] ')+c.name));
 console.log('  '+color(valid(token.value)?'32':'33',valid(token.value)?'TOKEN READY':'TOKEN REQUIRED')+muted('  •  '+(valid(token.value)?token.source+' / value hidden':'paste at start or use token.txt')));
 console.log(muted('  API access and server permissions are verified by the running bot.\n'));
 return results.every(c=>c.ok);
}
async function run(file,flags=[]){
 return new Promise((resolve,reject)=>{const child=spawn(process.execPath,[...flags,fileURLToPath(new URL(file,root))],{cwd:fileURLToPath(root),stdio:'inherit',shell:false});child.once('error',reject);child.once('exit',code=>resolve(code??1));});
}
async function tests(){console.log(ink('\n  SECURITY / ECONOMY / TICKETS / PERFORMANCE\n'));const code=await run('security.test.js',['--test']);console.log(color(code===0?'32':'31',code===0?'\n  ✓ ALL CHECKS PASSED\n':'\n  × CHECKS FAILED — REVIEW OUTPUT\n'));return code;}
function guide(){
 panel('QUICK START',[
  '1. Put your bot token in token.txt. Never share it.',
  '2. Choose 1 to connect. Keep the window open.',
  '3. In a private staff room: !setlogs then !logtest',
  '4. Commands: !help 1, !eco, !bal, !ticket',
  '5. Honeypot is OFF until !honeypot create.',
  'Owner/server IDs are automatic. Ctrl+C stops the bot.'
 ]);
 console.log(muted('  Direct: node bot.js --start | Checks: --check | Tests: --test'));
 console.log(muted('  No animation: --no-animation | Offline benchmark: --benchmark\n'));
}
function modules(){panel('INSTALLED MODULES / NOT LIVE STATUS',[
 '◈ SENTINEL     Raid / spam / marked honeypot containment',
 '◈ MODERATION   Warnings, bans, roles and persistent tasks',
 '◈ SUPPORT      Private staff rooms + member DM bridge',
 '◈ ECONOMY      Rewards, jobs, crafting and businesses',
 '◈ JOURNAL      Durable cases + background log delivery',
 '◈ ACCESS       Fresh permissions / request-local dedupe',
 '◈ COMMANDS     243 built-ins + 500 custom-response slots'
 ]);console.log();}
async function dataView(){
 let files=[];try{files=(await readdir(new URL('data/',root))).filter(n=>/^[\w-]+\.json$/.test(n));}catch(e){if(e.code!=='ENOENT')throw e;}
 let read=0,skipped=0,tickets=0,logs=0,tasks=0,cases=0;
 for(const name of files.slice(0,20)){
  try{const file=new URL('data/'+name,root);if((await stat(file)).size>5*1024*1024){skipped++;continue;}const state=JSON.parse(await readFile(file,'utf8'));read++;tickets+=Object.values(state.tickets?.items||{}).filter(t=>t.status==='open').length;logs+=state.logs?.pending?.length||0;tasks+=(state.scheduledTasks||[]).filter(j=>j.status==='pending').length;cases+=state.cases?.length||0;}catch{skipped++;}
 }
 panel('LOCAL DATA / READ ONLY',[
  'Server-state files found: '+files.length,
  'Sampled files: '+read+' (up to 20; 5 MB limit each)',
  'Open tickets in sample: '+tickets,
  'Queued log entries in sample: '+logs,
  'Pending timed tasks in sample: '+tasks,
  'Local cases in sample: '+cases,
  'Skipped/unreadable sample files: '+skipped,
  'No user identities, conversations or tokens shown.'
 ]);console.log();
}
async function finder(){
 const query=(await input.question('  '+ink('SEARCH > '))).trim().toLowerCase();if(!query)return;
 let doc;try{doc=await readFile(new URL('COMMANDS.md',root),'utf8');}catch{console.log('  COMMANDS.md not found. Use !help inside Yapin.');return;}
 const matches=doc.split(/\r?\n/).filter(line=>line.startsWith('| `!')&&line.toLowerCase().includes(query));
 console.log(ink('\n  '+matches.length+' MATCHES / showing up to 12'));
 for(const row of matches.slice(0,12)){
  const fields=row.replace(/\\\|/g,' / ').split('|').slice(1,-1).map(v=>v.trim().replace(/`/g,''));
  console.log(ink('  '+fields[0])+' '+muted('['+fields[1]+']'));
  console.log('    '+String(fields[2]||'').slice(0,Math.max(20,(process.stdout.columns||80)-6)));
 }
 console.log();
}
async function start(){
 if(!await diagnostics())throw Error('Fix the failed preflight checks first.');
 let {value:token}=await readToken();
 if(!valid(token)){if(!interactive)throw Error('Configure token.txt or YAPPER_BOT_TOKEN first.');token=(await input.question('  '+ink('BOT TOKEN (visible while typing) > '))).trim();}
 if(!valid(token))throw Error('Invalid token format: it must start with yb_ and have no spaces.');
 process.env.YAPPER_BOT_TOKEN=token;input.close();
 console.log(color('32','\n  ◉ HANDING CONTROL TO VIGIL'));console.log(muted('  Establishing Yapin connection… keep this window open.\n'));
 await import('./hawk.js');launched=true;
}
function menu(){panel('OPERATIONS / ENTER = LAUNCH',[
 '01  LAUNCH VIGIL          02  PREFLIGHT CHECKS',
 '03  RUN TEST SUITE        04  QUICK START',
 '05  MODULE DIRECTORY     06  ACCENT / THEME',
 '07  LOCAL DATA OVERVIEW  08  OFFLINE SPEED BENCH',
 '09  COMMAND FINDER       00  EXIT'
 ]);}
async function main(){
 banner();
 if(args.has('--help'))return guide();
 if(args.has('--check')){if(!await diagnostics())process.exitCode=1;return;}
 if(args.has('--test')){process.exitCode=await tests();return;}
 if(args.has('--benchmark')){process.exitCode=await run('performance-bench.mjs');return;}
 if(args.has('--start')||!interactive)return start();
 await boot();
 while(true){
  menu();const choice=(await input.question('\n  '+ink('VIGIL / '+THEMES[theme].name+' > '))).trim().replace(/^0(?=\d)/,'');
  try{
   if(choice===''||choice==='1'){await start();return;}
   if(choice==='2')await diagnostics();else if(choice==='3')await tests();else if(choice==='4')guide();else if(choice==='5')modules();
   else if(choice==='6'){theme=(theme+1)%THEMES.length;banner();}
   else if(choice==='7')await dataView();else if(choice==='8')await run('performance-bench.mjs');else if(choice==='9')await finder();else if(choice==='0')return;else console.log(color('33','  Select 0–9. Enter launches Vigil.'));
  }catch(e){console.error(color('31','\n  '+e.message+'\n'));if(input.closed)throw e;}
 }
}
try{await main();}catch(e){console.error(color('31','\n  VIGIL LAUNCHER ERROR: '+e.message));process.exitCode=1;}finally{input.close();process.stdin.pause();if(!launched)process.exit(process.exitCode||0);}
