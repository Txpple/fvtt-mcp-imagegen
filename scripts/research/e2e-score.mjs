// Score a headtest run against the proposed stopping rule, by the checks' words (the owner's
// rulings supply the owner-measured numbers later). Writes SCORE.md into the stage folder.
//
//   node e2e-score.mjs <run dir> <stage folder>
import * as fs from 'node:fs';
import * as path from 'node:path';
const [runDir, stageDir] = process.argv.slice(2);
const m = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8'));
const items = m.items.filter(it => it.head);
const inBandWord = v => ['down', 'right', 'up'].includes(v);
const firstOk = h =>
  inBandWord((h.verdicts ?? [h.verdict])[0]) && (h.eyesVerdicts ?? [h.eyes])[0] !== 'no';
const n = items.length;
const first = items.filter(it => firstOk(it.head)).length;
const delivered = items.filter(it => it.head.inBand).length;
const edited = items.filter(it => it.head.eyesEdited).length;
const retriedItems = items.filter(it => it.head.retried).length;
const steps = items.reduce((a, it) => a + ((it.head.verdicts ?? [it.head.verdict]).length - 1), 0);
const reRenders = steps - edited;
const anatomyFlawed = items.filter(it => it.anatomy?.verdict === 'flawed').length;
const facingNotTop = items.filter(it => it.anatomy && it.anatomy.facing !== 'top').length;
const spend = m.spendUsd;
const perDelivered = delivered ? spend / delivered : Infinity;
const perToken = spend / n;
const pct = (a, b) => `${a} of ${b} (${Math.round((100 * a) / b)}%)`;
const rule = { first: 0.8, delivered: 0.95, cents: 6 };
const lines = [
  `# The end-to-end run against the stopping rule, by the checks' words`,
  ``,
  `Run: \`${runDir}\`; ${n} subjects; spent $${spend.toFixed(2)}.`,
  ``,
  `| Measure | By the checks | The rule | Met by the checks? |`,
  `| --- | --- | --- | --- |`,
  `| First renders in band (tilt and eyes) | ${pct(first, n)} | 80% | ${first / n >= rule.first ? 'yes' : 'no'} |`,
  `| Delivered in band after edits and re-renders | ${pct(delivered, n)} | 95% | ${delivered / n >= rule.delivered ? 'yes' : 'no'} |`,
  `| Cost per delivered in-band token | ${(100 * perDelivered).toFixed(1)} cents (${(100 * perToken).toFixed(1)} per token rendered) | 6 cents | ${100 * perDelivered <= rule.cents ? 'yes' : 'no'} |`,
  `| Edits for eyes | ${pct(edited, n)} | | |`,
  `| Re-renders (tilt, or a second NO) | ${reRenders} across ${retriedItems - edited > 0 ? retriedItems : retriedItems} items | | |`,
  `| Anatomy flawed / facing not top | ${anatomyFlawed} / ${facingNotTop} | | |`,
  ``,
  `The owner's rulings on the sheet give the owner-measured first-render and delivered rates and the`,
  `checks' agreement; the rule is met only on those.`,
  ``,
  `## Per subject`,
  ``,
  `| # | Subject | Steps (tilt·eyes) | Edited | Delivered | $ |`,
  `| --- | --- | --- | --- | --- | --- |`,
  ...items.map((it, i) => {
    const t = it.head.verdicts ?? [it.head.verdict];
    const e = it.head.eyesVerdicts ?? [it.head.eyes];
    const s = t.map((v, k) => `${v}${e[k] ? `·${e[k]}` : ''}`).join(' → ');
    return `| ${i + 1} | ${it.id} | ${s} | ${it.head.eyesEdited ? 'yes' : ''} | ${it.head.inBand ? 'in band' : 'OUT'} | ${it.usd?.toFixed(3) ?? ''} |`;
  }),
  ``,
];
fs.mkdirSync(stageDir, { recursive: true });
fs.writeFileSync(path.join(stageDir, 'SCORE.md'), lines.join('\n'));
console.log(lines.slice(4, 12).join('\n'));
