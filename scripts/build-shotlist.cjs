// Builds docs/RSI-VIDEO-SHOTLIST.md from the scene definitions in src/presets.js,
// so the shot list (narration per stage, timings, on-screen captions) can never
// drift from what the app actually renders.
//   node scripts/build-shotlist.cjs
const fs = require('fs');
const path = require('path');

global.window = undefined;
const { PRESET_SCENES } = require(path.join(__dirname, '..', 'src', 'presets.js'));

function captionsOf(scene) {
  if (Array.isArray(scene.captions)) return scene.captions;
  const src = scene.update.toString();
  const block = /const captions = \[([\s\S]*?)\];/.exec(src);
  if (!block) return [];
  const out = [];
  const re = /'((?:[^'\\]|\\.)*)'/g;
  let m;
  while ((m = re.exec(block[1]))) out.push(m[1].replace(/\\'/g, "'").replace(/^STAGE \d+:\s*/, ''));
  return out;
}

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${m}:${r.toFixed(1).padStart(4, '0')}`;
};

const lines = [];
const total = PRESET_SCENES.reduce((a, p) => a + p.stageDurations.reduce((x, y) => x + y, 0), 0);
lines.push('# RSI Video — Scene & Shot List');
lines.push('');
lines.push('_Generated from `src/presets.js` by `node scripts/build-shotlist.cjs` — edit the scenes, then re-run this._');
lines.push('');
lines.push(`**${PRESET_SCENES.length} scenes · ${PRESET_SCENES.reduce((a, p) => a + p.phases.length, 0)} stages · ~${(total / 60).toFixed(1)} min at narration pace (2.6 words/s)**`);
lines.push('');
lines.push('## How to use this with your edit');
lines.push('');
lines.push('1. **Each scene = one clip.** Scenes follow the script in order; every sentence of the script is assigned to exactly one stage.');
lines.push('2. **Timing is built in.** Stage lengths are calculated from the words spoken in that stage, so a rendered scene lines up with the voice-over. The `Stage sec` box scales all of it: `4.6` = narration pace, higher = slower, lower = faster.');
lines.push('3. **Record VO against it.** The strip under the stage shows the exact script line for the current stage and its length. It is never rendered into exports, and Clean View (`TAB`) hides it. Nothing but the visuals is drawn on screen — no titles, captions or stage tags — so add any on-screen text in your editor.');
lines.push('4. **Render.** Pick a scene and press `F9`, or press `F10` (**● All 39**) to render the whole video back to back into one MP4 — Shift+F10 for one file per scene. MP4 for direct use; ProRes 4444 + Transparent background if you want to composite over other footage.');
lines.push('5. **Fine-tune in the editor.** Each stage begins with a visible beat (a soft dissolve, then elements building in), so cuts and VO nudges are easy to line up.');
lines.push('');
lines.push('## Scene overview');
lines.push('');
lines.push('| # | Scene | Section | Length | Stages |');
lines.push('|---|---|---|---|---|');
let clock = 0;
for (const p of PRESET_SCENES) {
  const d = p.stageDurations.reduce((a, b) => a + b, 0);
  lines.push(`| ${p.number} | ${p.title} | ${p.category} | ${d.toFixed(1)}s (starts ${fmt(clock)}) | ${p.phases.length} |`);
  clock += d;
}
lines.push('');

for (const p of PRESET_SCENES) {
  const caps = captionsOf(p);
  const d = p.stageDurations.reduce((a, b) => a + b, 0);
  lines.push(`## ${p.number} — ${p.title}`);
  lines.push('');
  lines.push(`**Section:** ${p.category} · **Length:** ${d.toFixed(1)}s`);
  lines.push('');
  lines.push(`**On screen:** ${p.shows}`);
  lines.push('');
  lines.push('| Stage | Time | Narration (VO) | What the viewer sees |');
  lines.push('|---|---|---|---|');
  let t = 0;
  p.phases.forEach((name, i) => {
    const dur = p.stageDurations[i];
    const vo = (p.narration[i] || '_(no narration: visual beat)_').replace(/\|/g, '\\|');
    const cap = (caps[i] || '').replace(/\|/g, '\\|');
    lines.push(`| ${i + 1}. ${name} | ${t.toFixed(1)}–${(t + dur).toFixed(1)}s | ${vo} | ${cap} |`);
    t += dur;
  });
  lines.push('');
}

lines.push('## Script notes & fact-check list');
lines.push('');
lines.push('The scenes put these claims on screen as written in the script. Many are about events after mid-2026, which I could not verify — confirm each source before publishing, since the on-screen text attributes them to real companies and people.');
lines.push('');
lines.push('- Anthropic report "When AI Builds Itself": low single digits before Claude Code (Feb 2025) → 80%+ of merged code; 8× code per engineer by Q2; 76% on hardest tasks (+50 pts / 6 months) (Scenes 05–07).');
lines.push('- Research-loop benchmark: human 4× in 4–8 h, Claude Opus 4 3× (May 2025), Claude Mythos Preview 52× (Scene 08); two researchers 23% vs agent loop 97% in 800 h on ~$18k (Scene 09).');
lines.push('- Frameworks and papers: AutoHarness, Weco AIDE2, Google Dream-RSI (Oct 6), MASS (Oct 8); 8-day run with 7 versions, beating a 2-year hand-tuned agent on 3 unseen benchmarks, reward hacking 63% → 34%; MASS 68.3% win rate, evaluator 73% → 93% (Scenes 11–17, 38).');
lines.push('- Anthropic October docs: Opus 5.5 (−40% cost, +30% speed, 680k-line migration < 24 h), Sonnet 5.5, Oct 7 platform update, Haiku 5.5 (1M context, 128k output, adaptive thinking + effort, removed sampling params → 400), cache-read pricing, computer_toolset_20260801, allowed_hosts, Oct 12 distillation report (Opus 4.8 traces 80.4% vs 71.8%), Oct 15 Code Review GA (6–10 min, 3× faster, CLAUDE.md / REVIEW.md, read-only), six METR evaluators (Scenes 19–26).');
lines.push('- OpenAI October docs: GPT-6 Astra / Sol / 6.1 Sol / Luna, Oct 15–20 updates, two zero-days, auto-review denial result, Oct 16 GPT-6 Pro parallel agents, Codex parallel tools / steering / interrupts, Daybreak + Codex Security, bubblewrap + seccomp sandbox (Scenes 27–31).');
lines.push('- The "four-level industry scale" with net-positive and ignition (Scene 35) — the scene labels only those two rungs; the lower two are shown as LEVEL 1 / LEVEL 2.');
lines.push('- Anthropic RSI forecast and "50× human speed" framing (Scenes 36–38).');
lines.push('- I. J. Good quote (Scene 01) is from "Speculations Concerning the First Ultraintelligent Machine" (1965).');
lines.push('- Values that are **illustrative only** (not from the script): file, plugin and host names, code-card contents, the 26% starting point for the hardest-task chart, benchmark bar heights in Scenes 15–16, harvested-trace words, review findings, overnight times and task lists, and the GPT-5.6 vs Astra token bar proportions.');
lines.push('');

const outDir = path.join(__dirname, '..', 'docs');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'RSI-VIDEO-SHOTLIST.md'), lines.join('\n'), 'utf8');
console.log(`Wrote docs/RSI-VIDEO-SHOTLIST.md (${PRESET_SCENES.length} scenes, ${(total / 60).toFixed(1)} min)`);
