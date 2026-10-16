import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ui } from './js/ui.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coding = fs.readFileSync(path.join(root, 'coding_output.md'), 'utf8');
const overview = fs.readFileSync(path.join(root, 'output.md'), 'utf8');

const normC = ui.normalizeMarkdown(coding);
const normO = ui.normalizeMarkdown(overview);

const fenceLines = normC.split('\n').filter((l) => {
  const t = l.trim();
  return t.startsWith('```') || /^`{1,2}[A-Za-z]/.test(t) || t === '`';
});
console.log('--- coding fence-like lines ---');
console.log(fenceLines.join('\n'));
const ticks = (normC.match(/^```/gm) || []).length;
console.log('triple-backtick lines', ticks, 'even?', ticks % 2 === 0);

console.log('--- citations left ---', (normO.match(/【|†L/g) || []).length);
console.log('--- br left ---', (normO.match(/<br/gi) || []).length);
console.log('--- rate limits row ---');
console.log(normO.split('\n').find((l) => l.includes('Rate limits')));

const standard = '```js\nconst x = 1;\n`\nconsole.log(x);\n```\n';
console.log('--- standard with lone backtick ---');
console.log(ui.normalizeMarkdown(standard));
console.log('--- inline ---');
console.log(ui.normalizeMarkdown('hello `code` world'));
