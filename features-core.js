// Explicit word matching avoids muting innocent substrings such as 'class' or 'Scunthorpe'.
export const DEFAULT_WORDS = ['fuck','fucking','fucked','fucker','fuckers','motherfucker','motherfuckers','shit','shitty','bullshit','shithead','bitch','bitches','bitching','bastard','bastards','asshole','assholes','arsehole','arseholes','arse','ass','dick','dickhead','cock','cocksucker','cunt','cunts','pussy','twat','wanker','prick','slut','whore','damn','goddamn','piss','pissed','pissing','crap','bollocks','bugger','bloody','jackass','dumbass','dipshit','horseshit','nigga','nigger','faggot','fag','retard','retarded','kanker','kut','lul','tering','tyfus','hoer','neuken','klootzak','merde','putain','connard','salope','scheisse','scheiße','hurensohn','arschloch','mierda','puta','puto','cabron','coño','cojones'];
export function normalized(text) { return String(text).normalize('NFKC').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[013457@$!]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i'}[c])); }
export function findSwear(text, extra=[], allowed=[]) {
 const value=normalized(text),tokens=value.match(/[\p{L}]+/gu)||[];
 const allow=new Set(allowed.map(normalized));
 for(const raw of [...DEFAULT_WORDS,...extra]) {
  const word=normalized(raw); if(allow.has(word)||!word)continue;
  if(tokens.some(t=>t===word||(['fuck','shit','bitch'].includes(word)&&new RegExp('^'+word+'(?:you|off|ing|er|ers|ed|head|face|ass)$').test(t))))return word;
  // Separator obfuscation only for 4+ character words to limit false positives.
  if(word.length>=4&&/^[a-z]+$/.test(word)){
   const pattern='(?:^|[^\\p{L}])'+[...word].join('[.\\s_*\\-]{0,3}')+'(?:$|[^\\p{L}])';
   if(new RegExp(pattern,'u').test(value))return word;
  }
 }
 return null;
}
export const ITEMS={cookie:{price:50},coffee:{price:100},badge:{price:500},laptop:{price:2500},bike:{price:5000},car:{price:25000},house:{price:100000},crown:{price:1000000}};
export function account(economy,id){economy.users||={};return economy.users[id]||={wallet:0,bank:0,earned:0,inventory:{},cooldowns:{}};}
export function amount(value){const n=Number(value);if(!Number.isSafeInteger(n)||n<1||n>1e12)throw Error('Amount must be a whole number from 1 to 1,000,000,000,000.');return n;}
function credit(a,key,n){if(!Number.isSafeInteger(a[key]+n)||a[key]+n>1e15)throw Error('Balance limit reached.');a[key]+=n;}
export function reward(a,key,wait,payout,now=Date.now()){
 const remaining=(a.cooldowns[key]||0)+wait-now;if(remaining>0)throw Error('Try again in '+Math.ceil(remaining/1000)+' seconds.');
 credit(a,'wallet',payout);a.earned+=payout;a.cooldowns[key]=now;return payout;
}
export function transfer(a,b,n){n=amount(n);if(a===b)throw Error('Cannot pay yourself.');if(a.wallet<n)throw Error('Not enough coins.');credit(b,'wallet',n);a.wallet-=n;}
export function move(a,n,toBank){n=amount(n);const from=toBank?'wallet':'bank',to=toBank?'bank':'wallet';if(a[from]<n)throw Error('Not enough coins.');credit(a,to,n);a[from]-=n;}
export function buy(a,item,qty=1){if(!ITEMS[item])throw Error('Unknown item. Use !shop.');qty=amount(qty);if(qty>100)throw Error('Maximum 100 at once.');const cost=ITEMS[item].price*qty;if(a.wallet<cost)throw Error('Not enough coins.');a.wallet-=cost;a.inventory[item]=(a.inventory[item]||0)+qty;return cost;}
export function sell(a,item,qty=1){if(!ITEMS[item])throw Error('Unknown item.');qty=amount(qty);if((a.inventory[item]||0)<qty)throw Error('Not enough items.');const payout=Math.floor(ITEMS[item].price*.6)*qty;credit(a,'wallet',payout);a.inventory[item]-=qty;return payout;}
export function customSet(commands,name,response){
 if(!/^[a-z][a-z0-9_-]{0,31}$/.test(name))throw Error('Name must be 1-32 letters/numbers, starting with a letter.');
 if(!response||response.length>1500)throw Error('Response must be 1-1500 characters.');
 if(!Object.hasOwn(commands,name)&&Object.keys(commands).length>=500)throw Error('500 custom command limit reached.');
 commands[name]=response.replace(/@/g,'@\u200b');
}
