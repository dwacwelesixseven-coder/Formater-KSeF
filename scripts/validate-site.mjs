import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
if (!/<title[^>]*>\s*Formater raportów KSeF\s*<\/title>/i.test(html)) throw new Error('Missing application title.');
if (!/<html\b/i.test(html) || !/<\/html>/i.test(html)) throw new Error('Incomplete HTML document.');
let checked = 0;
for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
  if (/\bsrc\s*=/i.test(script[1]) || !script[2].trim()) continue;
  if (/\btype\s*=\s*["'](?:application\/ld\+json|application\/json)["']/i.test(script[1])) {
    JSON.parse(script[2]);
    continue;
  }
  new vm.Script(script[2], { filename: `index.html inline script ${++checked}` });
}
if (!checked) throw new Error('No application JavaScript found.');
console.log(`Validated HTML and syntax of ${checked} inline script(s).`);
