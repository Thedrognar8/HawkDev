import { readFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
const root = new URL('./', import.meta.url);
const input = createInterface({ input: process.stdin, output: process.stdout });
try {
 console.log('\n=== HawkDev Protection ===\n');
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
