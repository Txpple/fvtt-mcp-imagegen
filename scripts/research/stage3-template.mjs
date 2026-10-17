// The stage-3 rulings template: head, build and (for a PC) likeness per numbered cell.
import * as fs from 'node:fs';
import * as path from 'node:path';
const [stageDir, keyFile] = process.argv.slice(2);
const key = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
const pcs = new Set(['tychon', 'kartor', 'lysandra', 'cecil']);
const lines = key.cells.map(c => {
  const pc = pcs.has(c.id.split('-')[0]);
  const tag = c.delivered ? '' : ', first render (redone)';
  return `${c.n} ${c.id}${tag}:  head:   build:  ${pc ? 'likeness:  ' : ''}`;
});
fs.writeFileSync(
  path.join(stageDir, 'RULINGS-fill-in.md'),
  '# Stage 3 rulings: one body, blind\n\n' +
    'Every subject of runs 1 and 2, the same words and busts, rendered on the human-male capture of\n' +
    'its pose and setup. Two sheets: `SHEET-blind-38-tokens.png` (the 26 delivered tokens, then the 12\n' +
    'first renders the head check sent back) and `SHEET-pairs-blind.png` (each delivered token beside\n' +
    'its matched-body render from run 1 or stage 2, same numbers). `tokens/` has each as a file.\n\n' +
    'Three words per number:\n' +
    '- **head**: right, bowed, lifted, dropped or unclear (as before);\n' +
    '- **build**: does it read as its race and build with the body gone? **ok** or **off** (say what:\n' +
    '  too tall, too slight, too heavy, a human in a costume);\n' +
    '- **likeness** (the eight PCs only): **them** or **off**.\n\n' +
    'The ones that decide the stage: the dwarf woman, the goblin, the bugbear, the orc and Kartor,\n' +
    'the subjects whose own body is not the human male. Anything else under Notes.\n\n' +
    `${lines.join('\n')}\n\n## Notes\n\n`
);
console.log(`${key.cells.length} lines`);
