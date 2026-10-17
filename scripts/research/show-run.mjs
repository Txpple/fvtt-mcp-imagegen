// Print a headtest run's head and anatomy results per item.
import * as fs from 'node:fs';
import * as path from 'node:path';
const runDir = process.argv[2];
const m = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8'));
console.log(`spend $${m.spendUsd.toFixed(2)}  body ${m.body ?? 'own'}`);
for (const it of m.items) {
  const v = (it.head?.verdicts ?? [it.head?.verdict]).join(' > ');
  console.log(`${it.id.padEnd(16)} head ${v.padEnd(26)} ${it.head?.anchorUsed ?? ''}`);
  const a = it.anatomy;
  if (a) {
    console.log(
      `    anatomy ${a.verdict}${a.facing ? `, facing ${a.facing}` : ''}${a.rotate ? `, rotate ${a.rotate}` : ''}`
    );
    console.log(`    found: ${a.found}`);
    for (const f of a.flaws) console.log(`    - ${f}`);
  }
}
