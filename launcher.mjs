import { readFile, access, readdir } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = new URL('./', import.meta.url);
const terminal = Boolean(process.stdout.isTTY);
const interactive = Boolean(process.stdin.isTTY && terminal);
const args = new Set(process.argv.slice(2));
let theme = 165;
let launched = false;
const paint = (code, text) => terminal && !process.env.NO_COLOR ? `\x1b[${code}m${text}\x1b[0m` : text;
const accent = text => paint(`38;5;${theme}`, text);
const line = () => console.log(accent('  ───────────────────────────────────────────────────'));
const input = createInterface({ input: process.stdin, output: process.stdout });

function banner() {
 const logo = [
  '██╗  ██╗ █████╗ ██╗    ██╗██╗  ██╗',
  '██║  ██║██╔══██╗██║    ██║██║ ██╔╝',
  '███████║███████║██║ █╗ ██║█████╔╝ ',
  '██╔══██║██╔══██║██║███╗██║██╔═██╗',
  '██║  ██║██║  ██║╚███╔███╔╝██║  ██╗',
  '╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝'
 ];
 console.log('\n'+paint('90','  H A W K  /  C O N T R O L  C E N T E R')+'\n');
 logo.forEach((text,i)=>console.log(paint(`38;5;${theme===165?[54,90,127,163,165,129][i]:theme}`,'  '+text)));
 console.log('\n'+paint('1;97','                 #1 BOT')); line();
 console.log(paint('90','  PROTECT YOUR COMMUNITY. COMMAND YOUR SERVER.'));
 console.log();
}

async function boot() {
 if(!interactive||args.has('--no-animation')||process.env.NO_COLOR)return;
 for(const label of ['Loading control center','Reading local configuration','Preparing launcher']){
  process.stdout.write('  '+accent('◈')+' '+label);await delay(130);
  process.stdout.write(paint('32','  OK')+'\n');
 }
 // This animation reports launcher progress only; API connectivity is checked by the bot.
 for(let n=0;n<=20;n++){
  process.stdout.write('\r  '+accent('['+'━'.repeat(n)+'─'.repeat(20-n)+']')+' '+String(n*5).padStart(3)+'%');await delay(15);
 }
 console.log('\n');
}

async function readToken() {
 if(process.env.YAPPER_BOT_TOKEN?.trim())return {value:process.env.YAPPER_BOT_TOKEN.trim(),source:'environment'};
 try {return {value:(await readFile(new URL('token.txt',root),'utf8')).replace(/^\uFEFF/,'').trim(),source:'token.txt'};}
 catch(e){if(e.code!=='ENOENT')throw e;return {value:'',source:'not configured'};}
}
const validToken = value => /^yb_\S+$/.test(value||'');
async function diagnostics() {
 const checks=[];
 checks.push({name:'Node.js '+process.versions.node,ok:Number(process.versions.node.split('.')[0])>=18});
 const required=['bot.js','hawk.js','yapper.js','features.js','features-core.js','security.js','runtime.js','server-registry.js','logging.js','tickets.js','presentation.js','more-commands.js'];
 for(const name of required){try{await access(new URL(name,root));checks.push({name,ok:true});}catch{checks.push({name,ok:false});}}
 try {
  const cfg=JSON.parse((await readFile(new URL('hawk.config.json',root),'utf8')).replace(/^\uFEFF/,''));
  if(!cfg||typeof cfg!=='object'||Array.isArray(cfg)||!Number.isFinite(cfg.pollSeconds)||cfg.pollSeconds<5)throw Error('pollSeconds must be at least 5');
  checks.push({name:'Configuration readable',ok:true});
 }catch(e){checks.push({name:'Configuration: '+e.message,ok:false});}
 const token=await readToken();
 console.log(paint('1;97','\n  LOCAL STARTUP CHECKS'));line();
 for(const c of checks)console.log('  '+paint(c.ok?'32':'31',c.ok?'[OK]  ':'[FAIL]')+' '+c.name);
 console.log('  '+paint(validToken(token.value)?'32':'33',validToken(token.value)?'[SET] ':'[WAIT]')+' Token: '+(validToken(token.value)?token.source+' (hidden)':'add token.txt or enter at start'));
 let snapshots=0;try{snapshots=(await readdir(new URL('data/',root))).filter(n=>n.endsWith('.json')).length;}catch(e){if(e.code!=='ENOENT')console.log('  Data directory unavailable: '+e.code);}
 console.log(paint('90',`  Saved server state files: ${snapshots}`));
 console.log(paint('90','  Offline checks only. API connection is not tested here.\n'));
 return checks.every(c=>c.ok);
}
async function tests() {
 console.log(accent('\n  Running offline security / economy / logging tests...\n'));
 return await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['--test',fileURLToPath(new URL('security.test.js',root))],{cwd:fileURLToPath(root),stdio:'inherit',shell:false});
  child.once('error',reject);child.once('exit',code=>{console.log(paint(code===0?'32':'31',code===0?'\n  TEST SUITE PASSED\n':'\n  TEST SUITE FAILED\n'));resolve(code??1);});
 });
}
function help() {
 console.log(paint('1;97','\n  QUICK START'));line();
 console.log('  1. Add your bot token to token.txt. It stays on your PC.');
 console.log('  2. Invite Hawk and grant the moderation permissions it needs.');
 console.log('  3. Start the bot and keep this window open.');
 console.log('  4. In a private staff channel: !setlogs then !logtest');
 console.log('  5. Browse commands with !help 1 / !help 2 / ...');
 console.log(paint('90','\n  Ctrl+C stops the bot. Server and owner IDs are automatic.'));
 console.log(paint('90','  Never share token.txt. GitHub uploads do not host the bot.'));
 console.log(paint('90','  Direct start: node bot.js --start'));
 console.log(paint('90','  Checks only: node bot.js --check | Tests: node bot.js --test\n'));
}
function highlights() {
 console.log(paint('1;97','\n  HAWK MODULES'));line();
 console.log('  ◈ Protection     Join raids, spam and mass mentions');
 console.log('  ◈ Moderation     Bans, kicks, timeouts and role quarantine');
 console.log('  ◈ Recovery       Saved public-channel layouts');
 console.log('  ◈ Word filter    Custom words, exceptions and timeouts');
 console.log('  ◈ Economy        Rewards, banking, payments and inventories');
 console.log('  ◈ Tickets        Private support rooms and DM replies');
 console.log('  ◈ Logs           Persistent queue, cases and staff channel');
 console.log('  ◈ Custom         Up to 500 custom text-response commands');
 console.log(paint('90','\n  These are installed features, not live connection indicators.\n'));
}
async function start() {
 if(!await diagnostics())throw Error('Fix the failed checks before starting.');
 let {value:token}=await readToken();
 if(!validToken(token)) {
  if(!interactive)throw Error('Configure token.txt or YAPPER_BOT_TOKEN first.');
  token=(await input.question(accent('  Paste bot token (visible while typing), then Enter: '))).trim();
 }
 if(!validToken(token))throw Error('Invalid token format. It must start with yb_ and contain no spaces.');
 process.env.YAPPER_BOT_TOKEN=token;input.close();
 line();console.log(paint('32','  LAUNCHING HAWK'));console.log(paint('90','  Waiting for Yapin connection... Ctrl+C to stop.\n'));
 await import('./hawk.js');
 launched = true;
}
async function main() {
 banner();
 if(args.has('--help')){help();return;}
 if(args.has('--check')){if(!await diagnostics())process.exitCode=1;return;}
 if(args.has('--test')){process.exitCode=await tests();return;}
 if(args.has('--start')||!interactive){await start();return;}
 await boot();
 while(true){
  console.log(accent('  [1]')+' Start Hawk            '+accent('[2]')+' Startup checks');
  console.log(accent('  [3]')+' Run test suite        '+accent('[4]')+' Quick start guide');
  console.log(accent('  [5]')+' Explore modules       '+accent('[6]')+' Change accent color');
  console.log(accent('  [0]')+' Exit');
  const choice=(await input.question('\n  '+accent('HAWK > '))).trim();
  if(choice===''||choice==='1'){try{await start();return;}catch(e){console.error(paint('31','\n  '+e.message+'\n'));if(input.closed)throw e;}}
  else if(choice==='2')await diagnostics();
  else if(choice==='3')await tests();
  else if(choice==='4')help();
  else if(choice==='5')highlights();
  else if(choice==='6'){theme=theme===165?51:theme===51?214:165;banner();}
  else if(choice==='0')return;
  else console.log(paint('33','  Choose 0–6. Enter starts Hawk.\n'));
 }
}
try{await main();}catch(e){console.error(paint('31','\n  Launcher error: '+e.message));process.exitCode=1;}finally{input.close();process.stdin.pause();if(!launched)process.exit(process.exitCode||0);}
