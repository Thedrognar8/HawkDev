import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';

// Purple terminal identity; plain text remains readable in redirected output.
function printBanner() {
 const color = process.stdout.isTTY && !process.env.NO_COLOR;
 const tint = (code, text) => color ? '\x1b[' + code + 'm' + text + '\x1b[0m' : text;
 const logo = [
  '██╗  ██╗ █████╗ ██╗    ██╗██╗  ██╗',
  '██║  ██║██╔══██╗██║    ██║██║ ██╔╝',
  '███████║███████║██║ █╗ ██║█████╔╝ ',
  '██╔══██║██╔══██║██║███╗██║██╔═██╗',
  '██║  ██║██║  ██║╚███╔███╔╝██║  ██╗',
  '╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝'
 ];
 console.log();
 console.log(tint('90', '  H A W K  /  L O A D E R'));
 console.log();
 logo.forEach((line, i) => console.log(tint('38;5;' + [54,90,127,163,165,129][i], '  ' + line)));
 console.log();
 console.log(tint('1;97', '                 #1 BOT'));
 console.log(tint('38;5;60', '  ───────────────────────────────────'));
 console.log(tint('90', '  ANTI-RAID  /  MODERATION  /  ECONOMY'));
 console.log();
}

const root = new URL('./', import.meta.url);
const input = createInterface({ input: process.stdin, output: process.stdout });
try {
 printBanner();
 let token = process.env.YAPPER_BOT_TOKEN?.trim();
 if (!token) {
  try { token = (await readFile(new URL('token.txt', root), 'utf8')).replace(/^\uFEFF/, '').trim(); }
  catch (e) { if (e.code !== 'ENOENT') throw e; }
 }
 if (!token || token === 'PASTE_YOUR_BOT_TOKEN_HERE') {
  token = (await input.question('Paste your bot token, then press Enter: ')).trim();
 }
 if (!/^yb_\S+$/.test(token || '')) throw Error('Invalid bot token. It must start with yb_ and have no spaces.');
 process.env.YAPPER_BOT_TOKEN = token;
 input.close();
 console.log('\nStarting HawkDev. Keep this window open. Ctrl+C stops it.\n');
 await import('./hawk.js');
} catch (e) {
 input.close();
 console.error('\nCould not start: ' + e.message);
 process.exitCode = 1;
}
