/**
 * TermFX — "Recursive Self-Improvement Is Already Running in Production"
 * (video script v2 · visuals-only cut)
 *
 * 39 scenes that follow the narration in order. Every scene carries:
 *   narration[] – the exact script lines spoken during each stage
 *   phases[]    – short stage names (top bar in the app only)
 *   captions[]  – what the viewer sees in each stage (shot list only; never drawn)
 *   shows       – one-line description of the whole scene
 * Stage durations come from the narration word count (~2.6 words/s), so a
 * rendered scene lines up with the voice-over. "Stage sec" scales them
 * (4.6 = narration pace). `node scripts/build-shotlist.cjs` regenerates
 * docs/RSI-VIDEO-SHOTLIST.md from this file.
 *
 * Visual rules for this cut: no titles, captions or stage tags on screen;
 * no text boxes or code windows; no rings on stage changes. One clear,
 * animated idea per stage, big glowing type only for the key number or
 * word, and labels of a word or two.
 */

function easeOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

// Animated link between two points with gliding packets (optional moving label)
function drawCleanLink(grid, time, x0, y0, x1, y1, label, lineCol, accentCol, speed = 0.65) {
  grid.dataLine(x0, y0, x1, y1, {
    char: '·',
    color: lineCol,
    packets: 2,
    speed: speed,
    packetChar: '◈',
    packetColor: accentCol
  });

  if (label) {
    const raw = (time * speed * 0.65) % 1;
    const t = raw < 0.5 ? 4 * raw * raw * raw : 1 - Math.pow(-2 * raw + 2, 3) / 2;
    grid.text(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - 2, label, accentCol, true, 'center');
  }
}

// Terminal-style vertical bar: full blocks plus a fractional top cell (▁..█)
function drawVBar(grid, x, yBottom, maxH, ratio, color, w = 3) {
  const blocks = ' ▁▂▃▄▅▆▇█';
  const total = Math.max(0, Math.min(1, ratio)) * maxH;
  const full = Math.floor(total);
  const frac = total - full;
  for (let c = 0; c < w; c++) {
    for (let r = 0; r < full; r++) grid.set(x + c, yBottom - r, '█', color, false, null, 0.85);
    if (frac > 0.06 && full < maxH) grid.set(x + c, yBottom - full, blocks[Math.max(1, Math.round(frac * 8))], color, true);
  }
  if (total > 0.05) grid.vline(x - 0.5, yBottom - total + 0.5, x + w - 0.5, yBottom - total + 0.5, { color, alpha: 0.9, width: 1.5 });
}

// Clean glowing horizontal bar (vector), with a faint track; returns the end x
function drawHBar(grid, x, y, maxLen, ratio, color, alpha = 0.9) {
  const len = Math.max(0, Math.min(1, ratio)) * maxLen;
  grid.vline(x, y, x + maxLen, y, { color, alpha: 0.12, width: 3 });
  if (len > 0.1) {
    grid.vline(x, y, x + len, y, { color, alpha, width: 4 });
    grid.vdot(x + len, y, 2.6, { color: '#ffffff', alpha: 0.9 });
  }
  return x + len;
}

// Circular gauge arc (cell space, x stretched for the cell aspect), 12 o'clock start
function drawArc(grid, cx, cy, r, frac, color, width = 2.4) {
  const track = [];
  const arc = [];
  const f = Math.max(0, Math.min(1, frac));
  for (let i = 0; i <= 72; i++) {
    const a = -Math.PI / 2 + (i / 72) * Math.PI * 2;
    track.push([cx + Math.cos(a) * r * 1.85, cy + Math.sin(a) * r]);
    if (i / 72 <= f) arc.push([cx + Math.cos(a) * r * 1.85, cy + Math.sin(a) * r]);
  }
  grid.vpath(track, { color, alpha: 0.12, width });
  if (arc.length > 1) grid.vpath(arc, { color, alpha: 0.95, width, glow: true });
}

// Reveal list items one by one over time (typing-style)
function reveal(lines, t, rate) {
  return lines.slice(0, Math.min(lines.length, 1 + Math.floor(Math.max(0, t) * rate)));
}

// Small vector clock face; `angle` drives the minute hand
function drawClock(grid, x, y, angle, color) {
  grid.vcircle(x, y, 1.15, { color, alpha: 0.75, width: 1.3 });
  grid.vline(x, y, x + Math.sin(angle) * 1.7, y - Math.cos(angle) * 0.9, { color: '#ffffff', alpha: 0.95, width: 1.6 });
  grid.vline(x, y, x + Math.sin(angle / 12) * 1.1, y - Math.cos(angle / 12) * 0.6, { color, alpha: 0.85, width: 1.6 });
  grid.vdot(x, y, 1.5, { color: '#ffffff' });
}

// Stable pseudo-random 0..1 per index (no Math.random, so renders are repeatable)
function hash01(i) {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}

const PRESET_SCENES = [
  // ============================================================================
  // 01. THE INTELLIGENCE EXPLOSION
  // ============================================================================
  {
    id: 'rsi2-01',
    number: '01',
    title: 'The Intelligence Explosion',
    category: 'Intro',
    prompt: 'A threshold line, 1965, an AI rewriting itself, and generations that rise past the threshold.',
    shows: 'A dashed threshold hangs over a small dim core; "1965" types in; code glyphs spiral into the core as it rewrites itself; then three generations grow left to right, each rising higher past the threshold.',
    phases: ['A Theoretical Threshold', 'I. J. Good, 1965', 'AI Improves Its Own Code', 'Each Gen Designs the Next'],
    captions: [
      'A dashed threshold line hangs above a small, dim AI core',
      '"1965" in large type, with I. J. Good and "intelligence explosion" beneath',
      'Code glyphs spiral into the core as it rewrites itself and grows',
      'Three generations grow left to right, each rising higher past the threshold'
    ],
    narration: [
      `For decades, the concept of Recursive Self-Improvement—or RSI—was treated as a theoretical threshold in computer science.`,
      `First formalized in the 1960s by mathematician I. J. Good in his thesis on the intelligence explosion,`,
      `the premise was straightforward: once an artificial intelligence becomes capable enough to improve its own underlying code and architecture,`,
      `each generation makes the system better at designing the next.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const ty = 9;

      grid.vline(6, ty, 122, ty, { color: palette.warn, alpha: phase === 1 ? 0.7 : 0.25, width: 1.2, dash: [4, 5] });
      if (phase === 1) grid.text(122, ty - 1.2, 'threshold', palette.warn, false, 'right');

      if (phase === 1) {
        grid.shape3D('tetra', 64, 22, anim.spring('s0', 2.4, { from: 0.4, freq: 3 }), anim.spin('a', 0.3), anim.spin('b', 0.4), 0, { color: palette.dim, accent: palette.accent, dim: palette.dim });
      }
      if (phase === 2) {
        grid.big(64, 15, '1965', { size: 4.2, color: palette.accent });
        grid.text(64, 21, 'I. J. GOOD', palette.accent, true, 'center');
        grid.text(64, 23, 'the intelligence explosion', palette.dim, false, 'center');
      }
      if (phase === 3) {
        const s = anim.spring('s3', 3.6, { from: 2.4, freq: 1.5 });
        grid.morph3D('core', 'icosa', 64, 20, s, anim.spin('a3', 0.6), anim.spin('b3', 0.8), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        const glyphs = '{}()<>=;[]/*+';
        for (let i = 0; i < 22; i++) {
          const k = (time * 0.35 + hash01(i)) % 1;
          const a = hash01(i + 3) * Math.PI * 2 + k * 4;
          const r = (1 - k) * 22;
          grid.set(64 + Math.cos(a) * r * 1.6, 20 + Math.sin(a) * r * 0.5, glyphs[i % glyphs.length], palette.primary, k > 0.7, null, 0.3 + k * 0.7);
        }
      }
      if (phase === 4) {
        const gens = [[30, 2.4, 'tetra'], [64, 3.2, 'octa'], [98, 4.1, 'icosa']];
        gens.forEach((g, i) => {
          const k = anim.spring('g' + i, 1, { from: 0, freq: 2.2 - i * 0.3, damp: 0.7 });
          const y = 24 - i * 6 * k;
          const col = i === 2 ? G : (i === 1 ? palette.accent : palette.primary);
          grid.shape3D(g[2], g[0], y, g[1] * Math.max(0.2, k), anim.spin('x' + i, 0.5 + i * 0.4), anim.spin('y' + i, 0.6 + i * 0.5), 0, { color: col, accent: '#ffffff', dim: palette.dim, alpha: Math.min(1, k * 1.5) });
          grid.text(g[0], y + g[1] * 1.6 + 1.5, `GEN ${i + 1}`, col, i === 2, 'center');
          if (i > 0) grid.vpath([[gens[i - 1][0] + 6, 24 - (i - 1) * 6], [g[0] - 6, y]], { color: col, alpha: 0.4, width: 1.2, dash: [2, 3] });
        });
      }
    }
  },

  // ============================================================================
  // 02. IT IS ALREADY RUNNING
  // ============================================================================
  {
    id: 'rsi2-02',
    number: '02',
    title: 'It Is Already Running',
    category: 'Intro',
    prompt: 'A timeline where the expected RSI marker snaps from decades away back to now and a production loop starts.',
    shows: 'A clean timeline from 1960 to 2060: the "expected" marker sits decades out; three documents drop onto NOW; the marker slides back to NOW; a loop spins up over a production server.',
    phases: ['Decades Away', 'The Recent Evidence', 'No Longer Waiting', 'Running in Production'],
    captions: [
      'Timeline 1960–2060; the "expected" marker sits decades in the future',
      'Three documents (Anthropic, OpenAI, labs) drop onto the NOW line',
      'The marker glides back from the 2050s and locks onto NOW',
      'A loop spins up over a production server: RUNNING'
    ],
    narration: [
      `For most of the history of machine learning, researchers assumed that crossing this threshold was decades away.`,
      `Looking at the technical documentation, benchmark data, and platform updates released over the past few weeks by Anthropic, OpenAI, and leading academic labs,`,
      `it is clear that we are no longer waiting for that feedback loop to begin.`,
      `In a bounded, engineering-driven form, it is already running in production.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, ease } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const x0 = 10;
      const x1 = 118;
      const yA = 24;
      const xOf = (yr) => x0 + ((yr - 1960) / 100) * (x1 - x0);

      const axisIn = ease.outExpo(time / 1.2);
      grid.vline(x0, yA, x0 + (x1 - x0) * axisIn, yA, { color: palette.primary, alpha: 0.45, width: 1.4 });
      for (let yr = 1960; yr <= 2060; yr += 20) {
        if (xOf(yr) > x0 + (x1 - x0) * axisIn) continue;
        grid.vline(xOf(yr), yA - 0.35, xOf(yr), yA + 0.35, { color: palette.dim, alpha: 0.8, width: 1 });
        grid.text(xOf(yr), yA + 1.5, String(yr), palette.dim, false, 'center');
      }
      const nowX = xOf(2026);
      grid.vline(nowX, 6, nowX, yA, { color: palette.accent, alpha: 0.35, width: 1.2, dash: [2, 3] });
      grid.text(nowX, yA + 3, 'NOW', palette.accent, true, 'center');

      const expYr = anim.spring('exp', phase >= 3 ? 2026 : 2052, { freq: 2.4, damp: 0.75 });
      const mx = xOf(expYr);
      const mCol = anim.color('mCol', phase >= 3 ? G : palette.warn);
      grid.vdot(mx, yA, 3.2, { color: mCol, alpha: 1 });
      grid.glow(mx, yA, 4, mCol, 1.2);
      if (phase <= 2) {
        grid.text(mx, yA - 2, 'expected', palette.warn, false, 'center');
        grid.vline(nowX + 1, yA - 0.01, mx - 1.5, yA - 0.01, { color: palette.warn, alpha: 0.5, width: 3 });
        grid.big((nowX + mx) / 2, yA - 6, 'DECADES AWAY', { size: 1.6, color: palette.warn, alpha: 0.85 });
      }

      if (phase === 2) {
        const docs = ['ANTHROPIC', 'OPENAI', 'LABS'];
        docs.forEach((d, i) => {
          const k = Math.max(0, Math.min(1, phaseTime / stageDuration * 3.2 - i * 0.8));
          if (k <= 0) return;
          const e = 1 - Math.pow(1 - k, 3);
          const x = nowX - 14 + i * 14;
          const y = 4 + e * 10;
          grid.icon('file', x, y, palette.accent, { key: 'd' + i, base: false });
          grid.big(x, y + 3, d, { size: 0.9, color: palette.dim, reveal: false });
        });
      }
      if (phase === 3) grid.big(nowX, 12, 'NOW', { size: 4, color: G });
      if (phase === 4) {
        grid.ring3D(nowX, 13, 6, 1.25, 0, { color: G, dim: palette.dim, spin: anim.spin('loop', 2.4), glow: true });
        grid.icon('server', nowX, 13, G, { key: 'prod', base: false });
        grid.text(nowX + 16, 13, 'in production', G, true, 'left');
      }
    }
  },

  // ============================================================================
  // 03. THE INFLECTION POINT
  // ============================================================================
  {
    id: 'rsi2-03',
    number: '03',
    title: 'The Inflection Point',
    category: 'Intro',
    prompt: 'A model graduates from passing snippets to writing code, tuning training, running subagents and spawning its successor.',
    shows: 'A tiny snippet passes from model to engineer; then the model takes the centre and capabilities orbit it one by one — code, training, subagents — until a successor model is born from it.',
    phases: ['Beyond Snippets', 'Writes Code · Optimizes Training', 'Parallel Subagents', 'Trains Its Successors'],
    captions: [
      'A tiny "{ }" snippet hops from the model to a human engineer',
      'The model moves centre stage; code and training gears orbit it',
      'Three subagents split off and orbit in parallel',
      'A glowing successor model is born from the stream of verified data'
    ],
    narration: [
      `Over the last several months, we have crossed a critical inflection point where frontier models are no longer just assisting human engineers with isolated snippets of code.`,
      `They are writing the vast majority of the production code inside the labs building them, optimizing their own training scripts at superhuman speeds,`,
      `coordinating parallel subagents,`,
      `and generating the verified synthetic trajectories used to train their own successors.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.icon('human', 40, 18, palette.accent, { key: 'eng', base: false });
        grid.icosahedron3D(88, 18, 2.6, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.primary, accent: '#ffffff', dim: palette.dim });
        const t = (time * 0.5) % 1;
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        grid.big(82 - e * 38, 18 - Math.sin(e * Math.PI) * 4, '{ }', { size: 1.4, color: palette.accent, reveal: false });
        grid.text(64, 27, 'just a snippet', palette.dim, false, 'center');
        return;
      }

      const cx = phase === 4 ? 46 : 64;
      const ccx = anim.spring('cx', cx, { from: 88, freq: 2 });
      grid.icosahedron3D(ccx, 18, 3.4, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.glow(ccx, 18, 8, palette.accent, 1);
      const sp = anim.spin('orb', 0.5);
      const satA = anim.spring('satA', phase === 4 ? 0 : 1, { freq: 2.5 });
      const sats = [['terminal', 'code'], ['gear', 'training']];
      if (satA > 0.05) sats.forEach((s, i) => {
        const a = sp + i * Math.PI;
        grid.icon(s[0], ccx + Math.cos(a) * 24, 18 + Math.sin(a) * 8, palette.primary, { key: 's' + i, base: false, label: s[1], alpha: satA });
      });
      if (phase === 3) {
        for (let i = 0; i < 3; i++) {
          const a = -sp * 1.6 + (i / 3) * Math.PI * 2;
          const k = anim.spring('sub' + i, 1, { from: 0, freq: 2.5 + i * 0.4 });
          grid.icon('agent', ccx + Math.cos(a) * 14 * k, 18 + Math.sin(a) * 5 * k, G, { key: 'sub' + i, base: false });
        }
      }
      if (phase === 4) {
        for (let i = 0; i < 10; i++) {
          const t = (time * 0.45 + i / 10) % 1;
          grid.set(ccx + 8 + t * 30, 18 + Math.sin(t * 9 + i) * 1.5, '·', G, true, null, 0.4 + t * 0.6);
        }
        const k = anim.spring('succ', 4.2, { from: 0.3, freq: 1.8, damp: 0.6 });
        grid.dodecahedron3D(96, 18, k, anim.spin('c', 0.6), anim.spin('d', 0.7), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.glow(96, 18, 10, G, 1.4);
        grid.text(96, 27, 'successor', G, true, 'center');
      }
    }
  },

  // ============================================================================
  // 04. WHAT WE WILL COVER
  // ============================================================================
  {
    id: 'rsi2-04',
    number: '04',
    title: 'What We Will Cover',
    category: 'Intro',
    prompt: 'Four chapter markers along a line, lighting one by one.',
    shows: 'Four glowing nodes along a line — DATA, DEMO, DOCS, NEXT — each lifts and lights as it is named while the line fills toward it.',
    phases: ['The Hard Data', 'Live Loop Demo', 'Two Weeks of Docs', 'The Next Few Months'],
    captions: [
      'Node 1 lights: DATA',
      'Node 2 lights: DEMO',
      'Node 3 lights: DOCS',
      'Node 4 lights: NEXT'
    ],
    narration: [
      `In this video, we are going to examine the hard data behind what is happening inside the frontier labs right now,`,
      `walk through a demonstration of how a modern recursive self-improvement loop actually operates in practice,`,
      `break down the specific documentation and architecture updates released by Anthropic and OpenAI over the past two weeks,`,
      `and look ahead at where this trajectory takes us over the next few months.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const items = [['chip', 'DATA'], ['agent', 'DEMO'], ['file', 'DOCS'], ['terminal', 'NEXT']];
      const y = 20;
      grid.vline(20, y + 5, 108, y + 5, { color: palette.dim, alpha: 0.4, width: 1.2 });
      const fill = anim.spring('fill', 20 + (phase - 1) * 29.3, { from: 20, freq: 2.4 });
      grid.vline(20, y + 5, fill, y + 5, { color: palette.accent, alpha: 0.9, width: 2 });
      items.forEach((it, i) => {
        const x = 20 + i * 29.3;
        const active = i === phase - 1;
        const done = i < phase - 1;
        const col = anim.color('c' + i, active ? palette.accent : (done ? palette.primary : palette.dim));
        const lift = anim.spring('l' + i, active ? -4 : 0, { freq: 4, damp: 0.6 });
        grid.icon(it[0], x, y - 3 + lift, col, { key: 'i' + i, glow: active, base: active, alpha: active || done ? 1 : 0.45 });
        grid.vdot(x, y + 5, active ? 3 : 2, { color: col, alpha: 1 });
        if (active) grid.big(x, y + 9, it[1], { size: 2.2, color: palette.accent });
        else grid.text(x, y + 8, it[1], col, false, 'center');
      });
    }
  },

  // ============================================================================
  // 05. WHEN AI BUILDS ITSELF: 80%
  // ============================================================================
  {
    id: 'rsi2-05',
    number: '05',
    title: 'When AI Builds Itself: 80%',
    category: 'The Hard Data',
    prompt: 'A gauge that fills from low single digits to over 80% of code written by Claude.',
    shows: 'A report icon opens into a circular gauge: it starts nearly empty (low single digits, before Claude Code) then sweeps to 80%+ with the number counting up in large type.',
    phases: ['"When AI Builds Itself"', 'Before Feb 2025: ~3%', 'Today: 80%+'],
    captions: [
      'Anthropic report icon; title "When AI Builds Itself" in large type',
      'Circular gauge sits almost empty: ~3% (before Claude Code, Feb 2025)',
      'Gauge sweeps around to 80%+ as the number counts up'
    ],
    narration: [
      `Let's start with the empirical data. In Anthropic's landmark report, "When AI Builds Itself," the company opened up its internal engineering metrics.`,
      `Prior to the research preview of Claude Code in February 2025, the percentage of Anthropic's internal codebase authored by Claude was in the low single digits.`,
      `Today, more than eighty percent of all code merged into Anthropic's production codebase is written by Claude itself.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.icon('file', 64, 12, palette.accent, { key: 'rep', glow: true });
        grid.big(64, 20, 'WHEN AI BUILDS ITSELF', { size: 1.8, color: palette.accent });
        grid.text(64, 24, 'internal engineering metrics', palette.dim, false, 'center');
        return;
      }
      const v = anim.spring('v', phase === 3 ? 80 : 3, { from: 0, freq: phase === 3 ? 1.1 : 2.5 });
      const col = phase === 3 ? G : palette.primary;
      drawArc(grid, 64, 17, 10, v / 100, col, 3);
      grid.big(64, 17, `${Math.round(v)}%${phase === 3 && v > 79 ? '+' : ''}`, { size: 3.6, color: col, reveal: false });
      grid.text(64, 30, phase === 3 ? 'of merged code written by Claude' : 'before Claude Code · Feb 2025', palette.dim, false, 'center');
    }
  },

  // ============================================================================
  // 06. 8× CODE PER ENGINEER
  // ============================================================================
  {
    id: 'rsi2-06',
    number: '06',
    title: '8× Code per Engineer',
    category: 'The Hard Data',
    prompt: 'A flat line that kinks twice and shoots up to 8×.',
    shows: 'A single glowing line runs flat from 2021 to 2024, kinks when models start running their own code, kinks again with multi-hour autonomy, and climbs to a large "8×".',
    phases: ['Flat 2021–2024', 'Inflection 1: Runs Its Own Code', 'Inflection 2: Multi-Hour Autonomy', '8× by Q2'],
    captions: [
      'A glowing line runs perfectly flat from 2021 to 2024',
      'First kink ①: models start executing and testing code themselves',
      'Second kink ②: multi-hour autonomy — the line bends steeply',
      'The line climbs to a large "8×"'
    ],
    narration: [
      `Between 2021 and 2024, the number of lines of code merged per engineer per day at Anthropic remained completely flat.`,
      `Then came two sharp inflection points: first, when models began executing and testing code directly rather than waiting for humans to copy and paste it,`,
      `and second, earlier this year, when models gained the ability to work autonomously over multi-hour time horizons.`,
      `By the second quarter of this year, the typical Anthropic engineer was merging eight times as much code per day as they were in 2024.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const x0 = 12;
      const x1 = 104;
      const yB = 28;
      const yT = 6;
      const xOf = (yr) => x0 + ((yr - 2021) / 5.5) * (x1 - x0);
      const yOf = (v) => yB - (v / 8.5) * (yB - yT);
      const val = (yr) => (yr < 2024.9 ? 1 : (yr < 2025.9 ? 1 + (yr - 2024.9) * 1.6 : 2.6 + (yr - 2025.9) * 10.8));

      grid.vline(x0, yB, x1 + 6, yB, { color: palette.dim, alpha: 0.35, width: 1 });
      for (let yr = 2021; yr <= 2026; yr++) grid.text(xOf(yr), yB + 1.5, String(yr), palette.dim, false, 'center');

      const endYr = [2024.9, 2025.9, 2026.2, 2026.4][phase - 1];
      const shownYr = anim.spring('yr', endYr, { from: 2021, freq: 1.6 });
      const pts = [];
      for (let i = 0; i <= 90; i++) {
        const yr = 2021 + (i / 90) * (shownYr - 2021);
        pts.push([xOf(yr), yOf(val(yr))]);
      }
      grid.vpath(pts, { color: phase === 4 ? G : palette.accent, alpha: 0.95, width: 2.6, glow: true });
      const hx = xOf(shownYr);
      const hy = yOf(val(shownYr));
      grid.vdot(hx, hy, 3, { color: '#ffffff', alpha: 1 });
      if (phase === 1) grid.text(xOf(2023), yOf(1) - 2.5, 'flat', palette.dim, false, 'center');
      if (phase >= 2) {
        grid.vdot(xOf(2024.9), yOf(1), 2.6, { color: palette.warn });
        grid.text(xOf(2024.9), yOf(1) + 2, 'runs its own code', palette.warn, phase === 2, 'center');
      }
      if (phase >= 3) {
        grid.vdot(xOf(2025.9), yOf(2.6), 2.6, { color: palette.warn });
        grid.text(xOf(2025.9) - 2, yOf(2.6) - 2, 'multi-hour autonomy', palette.warn, phase === 3, 'right');
      }
      if (phase === 4) {
        const v = anim.spring('eight', 8, { from: 1, freq: 1.6 });
        grid.big(hx + 10, hy + 2, `${Math.round(v)}×`, { size: 3.4, color: G, reveal: false });
      }
    }
  },

  // ============================================================================
  // 07. THE HARDEST TASKS: 76%
  // ============================================================================
  {
    id: 'rsi2-07',
    number: '07',
    title: 'The Hardest Tasks: 76%',
    category: 'The Hard Data',
    prompt: 'A blurry, undefined target; then a success gauge jumps from 26% to 76%.',
    shows: 'A target whose rings flicker and blur; question marks drift around it and the engineer is unsure; then the target sharpens into a gauge that leaps from 26% to 76% (+50).',
    phases: ['The Hardest Tasks', 'No Clear Spec', '+50 Points → 76%'],
    captions: [
      'A flickering, out-of-focus target labelled "open-ended"',
      'Question marks drift around it; the engineer beside it shows "?"',
      'The target sharpens into a gauge: 26% → 76% (+50 in 6 months)'
    ],
    narration: [
      `Furthermore, on the hardest, most open-ended engineering tasks—`,
      `problems with no clear specification where even the human engineer isn't sure what the final solution should look like—`,
      `Claude's success rate surged by fifty percentage points in just six months, reaching seventy-six percent.`
    ],
    stageMinimums: [3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const cx = 64;
      const cy = 17;

      if (phase <= 2) {
        for (let r = 1; r <= 3; r++) {
          const wob = Math.sin(time * 3 + r) * 0.5;
          grid.vcircle(cx + wob, cy, r * 3.2 + Math.sin(time * 2 + r) * 0.4, { color: palette.accent, alpha: 0.15 + (Math.sin(time * 7 + r) > 0.6 ? 0.25 : 0), width: 1.4 });
        }
        grid.text(cx, cy + 14, 'open-ended', palette.dim, false, 'center');
      }
      if (phase === 2) {
        for (let i = 0; i < 9; i++) {
          const a = time * 0.4 + (i / 9) * Math.PI * 2;
          grid.set(cx + Math.cos(a) * (26 + Math.sin(time + i) * 3), cy + Math.sin(a) * 9, '?', palette.warn, true, null, 0.5 + 0.5 * Math.sin(time * 2 + i));
        }
        grid.icon('human', cx + 40, cy + 6, palette.accent, { key: 'eng', base: false });
        grid.text(cx + 43, cy + 3.5, '?', palette.warn, true, 'center');
      }
      if (phase === 3) {
        const v = anim.spring('v', 76, { from: 26, freq: 1.1 });
        drawArc(grid, cx, cy, 10, v / 100, G, 3);
        drawArc(grid, cx, cy, 8.5, 0.26, palette.primary, 1.4);
        grid.big(cx, cy, `${Math.round(v)}%`, { size: 3.6, color: G, reveal: false });
        grid.text(cx, cy + 13.5, '+50 points in 6 months', G, true, 'center');
      }
    }
  },

  // ============================================================================
  // 08. THE RESEARCH-LOOP BENCHMARK
  // ============================================================================
  {
    id: 'rsi2-08',
    number: '08',
    title: 'The Research-Loop Benchmark',
    category: 'The Hard Data',
    prompt: 'Every model takes the same speed test; human 4×, Opus 4 3×, Mythos Preview 52×.',
    shows: 'New models queue into the same test loop; a training pipeline speeds up while a shield checks correctness; then three racing bars — human 4×, Opus 4 3×, and Mythos Preview shooting to a large 52×.',
    phases: ['The Internal Benchmark', 'Same Test, Every Model', 'Human Expert: 4×', 'Opus 4: 3×', 'Mythos Preview: 52×'],
    captions: [
      'Model after model glides into the same test loop',
      'A training pipeline of blocks speeds up; a shield checks every result',
      'Bar 1: human researcher — 4× in 4–8 hours',
      'Bar 2: Claude Opus 4 (May 2025) — 3×',
      'Bar 3: Claude Mythos Preview races off to a large 52×'
    ],
    narration: [
      `Even more revealing is Anthropic's internal research-loop benchmark.`,
      `Every time Anthropic trains a new model, they give it the same test: take a codebase that trains a smaller AI model and rewrite the code to make it run as fast as possible while passing strict correctness checks.`,
      `For calibration, a skilled human machine learning researcher takes between four and eight hours to achieve a four-times speedup.`,
      `In May 2025, Claude Opus 4 averaged a three-times speedup.`,
      `Within eleven months, Anthropic's internal Claude Mythos Preview achieved a fifty-two-times speedup on that exact same task.`
    ],
    stageMinimums: [3.5, 0, 0, 3.5, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.ring3D(64, 17, 8, 1.2, 0, { color: palette.accent, dim: palette.dim, spin: anim.spin('l', 1), glow: true });
        for (let i = 0; i < 3; i++) {
          const t = (time * 0.25 + i / 3) % 1;
          const x = 10 + t * 54;
          grid.shape3D(['tetra', 'octa', 'icosa'][i], x, 17, 1.8 * Math.min(1, (1 - t) * 4), anim.spin('m' + i, 0.6), anim.spin('n' + i, 0.7), 0, { color: palette.primary, accent: '#ffffff', dim: palette.dim, alpha: Math.min(1, (1 - t) * 3) });
        }
        grid.text(64, 28, 'same test, every model', palette.dim, false, 'center');
        return;
      }
      if (phase === 2) {
        const speed = 0.4 + Math.min(2.4, ctx.phaseTime * 0.35);
        for (let i = 0; i < 8; i++) {
          const x = 24 + i * 8;
          const on = Math.floor(time * speed * 4) % 8 === i;
          grid.vline(x - 2.5, 17, x + 2.5, 17, { color: on ? '#ffffff' : palette.primary, alpha: on ? 1 : 0.5, width: 6 });
        }
        grid.icon('shield', 100, 17, G, { key: 'chk', glow: true, base: false, label: 'correct' });
        drawClock(grid, 24, 9, anim.spin('clk', 4), palette.accent);
        grid.text(29, 9, 'as fast as possible', palette.accent, false, 'left');
        return;
      }
      const x0 = 34;
      const L = 70;
      const rows = [
        { stage: 3, label: 'HUMAN', v: 4, col: palette.accent, icon: 'human' },
        { stage: 4, label: 'OPUS 4', v: 3, col: palette.primary, icon: 'agent' },
        { stage: 5, label: 'MYTHOS', v: 52, col: G, icon: 'agent' }
      ];
      rows.forEach((r, i) => {
        if (phase < r.stage) return;
        const y = 10 + i * 8;
        grid.icon(r.icon, 14, y, r.col, { key: 'ri' + i, base: false });
        grid.text(22, y, r.label, r.col, false, 'left');
        const v = anim.spring('v' + i, r.v, { from: 0, freq: i === 2 ? 1 : 3 });
        const end = drawHBar(grid, x0, y, L, v / 52, r.col);
        grid.big(end + 7, y, `${v < 10 ? v.toFixed(0) : Math.round(v)}×`, { size: i === 2 ? 2.6 : 1.8, color: r.col, reveal: false });
      });
    }
  },

  // ============================================================================
  // 09. ONE WEEK VS 800 AGENT-HOURS
  // ============================================================================
  {
    id: 'rsi2-09',
    number: '09',
    title: 'One Week vs 800 Agent-Hours',
    category: 'The Hard Data',
    prompt: 'Two lanes across the same gap: humans fill 23%, an agent loop fills 97%.',
    shows: 'Two humans work a lane across the gap for a week and fill 23%; below, an agent loop runs 800 hours on ~$18k and fills 97% of the same gap, with large percentages at each lane\'s end.',
    phases: ['Two Researchers, One Week', 'Recovered 23%', '800 Agent-Hours · ~$18k', 'Closed 97%'],
    captions: [
      'Two researchers work their lane while a 7-day counter runs',
      'Their lane stops at 23% of the gap',
      'An agent loop runs its lane: 800 hours, ~$18,000 counting up',
      'The agent lane reaches 97% of the same gap'
    ],
    narration: [
      `In another documented experiment, two human researchers spent a full week trying to close a defined performance gap on a machine learning benchmark`,
      `and recovered twenty-three percent of the gap.`,
      `An autonomous agent loop running for eight hundred cumulative hours on roughly eighteen thousand dollars of compute`,
      `closed ninety-seven percent of that same gap.`
    ],
    stageMinimums: [0, 3.5, 0, 3.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const gx0 = 30;
      const gx1 = 110;
      const L = gx1 - gx0;

      grid.vline(gx0, 6, gx0, 28, { color: palette.dim, alpha: 0.4, width: 1, dash: [2, 3] });
      grid.vline(gx1, 6, gx1, 28, { color: G, alpha: 0.5, width: 1, dash: [2, 3] });
      grid.text(gx1, 4.5, 'target', G, false, 'center');

      grid.icon('human', 10, 11, palette.accent, { key: 'h1', base: false });
      grid.icon('human', 16, 11, palette.accent, { key: 'h2', base: false });
      const weekP = phase === 1 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
      grid.text(13, 14.5, `day ${Math.max(1, Math.ceil(weekP * 7))}/7`, palette.dim, false, 'center');
      const hR = anim.spring('h', 0.23 * weekP, { freq: 3 });
      const hEnd = drawHBar(grid, gx0, 11, L, hR, palette.accent);
      if (phase >= 2) grid.big(hEnd + 8, 11, '23%', { size: 2.2, color: palette.accent });

      if (phase >= 3) {
        grid.ring3D(13, 23, 3.5, 1.2, 0, { color: G, dim: palette.dim, spin: anim.spin('loop', 2.4), glow: true });
        grid.icon('agent', 13, 23, G, { key: 'ag', base: false });
        const runP = phase === 3 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
        grid.text(13, 27.5, `${Math.round(runP * 800)} h · $${Math.round(runP * 18).toLocaleString()}k`, palette.dim, false, 'center');
        const aR = anim.spring('a', 0.97 * runP, { freq: 3 });
        const aEnd = drawHBar(grid, gx0, 23, L, aR, G);
        if (phase === 4) grid.big(Math.min(aEnd + 8, 120), 19, '97%', { size: 2.8, color: G });
      }
    }
  },

  // ============================================================================
  // 10. UNDER THE HOOD: NOT WEIGHT EDITING
  // ============================================================================
  {
    id: 'rsi2-10',
    number: '10',
    title: 'Under the Hood: Not Weight Editing',
    category: 'Under the Hood',
    prompt: 'Editing a network\'s weights live collapses it; the real engine is two loops around a stable model.',
    shows: 'A neural network glows; an agent pokes at its weights live; nodes turn red and the net caves in; then the network steadies and two loops spin around a stable core with three pillar icons.',
    phases: ['Under the Hood', 'The Popular Picture', 'Collapse & Forgetting', 'The Dual-Loop Architecture'],
    captions: [
      'A calm 4-layer neural network, gently pulsing',
      'An agent hops between nodes, editing weights live',
      'Nodes turn red and the network caves in on itself',
      'Network stabilises; two loops spin around a stable core with gear · eye · cloud pillars'
    ],
    narration: [
      `To understand how these systems are achieving this, we need to clarify what modern Recursive Self-Improvement actually looks like under the hood.`,
      `When people imagine RSI, they often picture a model spontaneously rewriting its own neural network weights in real time while running in production.`,
      `In practice, directly mutating weights mid-inference leads to model collapse or catastrophic forgetting.`,
      `Instead, what is powering the current wave of breakthroughs is a dual-loop architecture combining Agent Harness Evolution, Multi-Agent Self-Supervision, and Simulated World Replay.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      if (phase === 3) ctx.fx.shake(0.4);
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const ox = phase === 4 ? 30 : 64;
      const nx0 = anim.spring('nx', ox, { freq: 2 });

      const redFrac = anim.spring('red', phase === 3 ? 1 : 0, { freq: 1.3 });
      const collapse = anim.spring('collapse', phase === 3 ? 1 : 0, { freq: 1.6, damp: 0.75 });
      const nodes = [];
      for (let li = 0; li < 4; li++) {
        for (let ni = 0; ni < 5; ni++) {
          const bx = nx0 - 18 + li * 12;
          const by = 9 + ni * 4;
          nodes.push({ x: bx + (nx0 - bx) * collapse * 0.85, y: by + (17 - by) * collapse * 0.85, li, idx: li * 5 + ni });
        }
      }
      for (const a of nodes) for (const b of nodes) {
        if (b.li !== a.li + 1) continue;
        grid.vline(a.x, a.y, b.x, b.y, { color: hash01(a.idx * 7 + b.idx) < redFrac ? R : palette.primary, alpha: phase === 4 ? 0.06 : 0.11, width: 1 });
      }
      for (const n of nodes) {
        const bad = hash01(n.idx * 3.1) < redFrac;
        const edited = phase === 2 && Math.floor(time * 2.5) % 20 === n.idx;
        const pulse = 0.6 + 0.4 * Math.sin(time * 2 + n.idx);
        grid.vdot(n.x, n.y, edited ? 3 : 2, { color: bad ? R : (edited ? palette.warn : (phase === 4 ? palette.dim : palette.accent)), alpha: pulse });
      }
      if (phase === 2) {
        const tg = nodes[Math.floor(time * 2.5) % 20];
        grid.icon('agent', tg.x, tg.y - 4, palette.warn, { key: 'ed', base: false });
        grid.text(nx0, 29, 'editing weights live', palette.warn, false, 'center');
      }
      if (phase === 3) grid.big(nx0, 29, 'COLLAPSE', { size: 2, color: R });
      if (phase === 4) {
        const bx = 92;
        grid.icosahedron3D(bx, 16, 2.6, anim.spin('bx', 0.4), anim.spin('by', 0.55), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.ring3D(bx, 16, 6, 1.2, 0, { color: palette.warn, dim: palette.dim, spin: anim.spin('in', 1.8), glow: true });
        grid.ring3D(bx, 16, 10, 1.2, 0, { color: G, dim: palette.dim, spin: -anim.spin('out', 0.7), glow: true });
        const pillars = [['gear', 'harness'], ['eye', 'self-supervision'], ['cloud', 'world replay']];
        pillars.forEach((p, i) => {
          if (anim.stagger(i, 0.6, 0.4) <= 0.2) return;
          grid.icon(p[0], 76 + i * 16, 29, G, { key: 'p' + i, base: false, label: p[1] });
        });
      }
    }
  },

  // ============================================================================
  // 11. TWO LAYERS, TWO LOOPS
  // ============================================================================
  {
    id: 'rsi2-11',
    number: '11',
    title: 'Two Layers, Two Loops',
    category: 'Under the Hood',
    prompt: 'Four framework names converge into a model; the harness assembles around it; inner and outer loops form.',
    shows: 'Four framework names drift in from the corners and condense into a single model; harness parts (code, prompts, memory, checks, tools) snap into an orbit around it; then a fast inner loop and slow outer loop wrap the whole system.',
    phases: ['The Demo\'s Sources', 'The Foundation Model', 'The Orchestration Harness', 'Inner Loop + Outer Loop'],
    captions: [
      'AutoHarness, AIDE2, Dream-RSI and MASS drift in and condense to a point',
      'The point becomes the foundation model',
      'Harness parts — code, prompts, memory, checks, tools — snap into orbit',
      'A fast inner loop and a slow outer loop wrap the system'
    ],
    narration: [
      `Let's walk through a demonstration of how this two-loop system works in practice, drawing directly from recent frameworks like AutoHarness, Weco's AIDE2, and two major papers published earlier this month in October: Google's Dream-RSI and the MASS framework—short for Multi-Agent Self-Supervision.`,
      `Every modern AI system consists of two distinct layers: the foundation model itself,`,
      `and the orchestration harness—the surrounding code, system prompts, memory retrieval pipelines, verification scripts, and tool definitions that govern how the model interacts with its environment.`,
      `In our demonstration, the system is split into an Inner Loop and an Outer Loop.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const cx = 64;
      const cy = 17;

      if (phase === 1) {
        const names = [['AutoHarness', 24, 7], ['AIDE2', 104, 7], ['Dream-RSI', 24, 27], ['MASS', 104, 27]];
        names.forEach((n, i) => {
          const appear = math.clamp(phaseTime - i * 1.2, 0, 1);
          if (appear <= 0) return;
          const pull = math.clamp((phaseTime / stageDuration - 0.6) / 0.35, 0, 1);
          const e = pull * pull * (3 - 2 * pull);
          grid.big(n[1] + (cx - n[1]) * e, n[2] + (cy - n[2]) * e, n[0], { size: 1.6 - e * 0.8, color: i >= 2 ? G : palette.accent, alpha: appear * (1 - e * 0.8) });
        });
        return;
      }
      if (phase === 4) {
        grid.ring3D(cx, cy, 7, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: anim.spin('inner', 2.4), glow: true });
        grid.ring3D(cx, cy, 15, 1.25, 0, { color: G, dim: palette.dim, spin: -anim.spin('outer', 0.5), glow: true });
        grid.text(cx - 18, cy + 3, 'inner', palette.warn, true, 'center');
        grid.text(cx + 34, cy - 8, 'outer', G, true, 'center');
      }
      const s = anim.spring('core', 3.2, { from: 0.2, freq: 2.2, damp: 0.6 });
      grid.icosahedron3D(cx, cy, s, anim.spin('a', 0.4), anim.spin('b', 0.55), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.glow(cx, cy, 8, palette.accent, 1);
      if (phase === 2) grid.text(cx, cy + 8, 'foundation model', palette.accent, true, 'center');
      if (phase >= 3) {
        const parts = [['terminal', 'code'], ['file', 'prompts'], ['binary', 'memory'], ['shield', 'checks'], ['plug', 'tools']];
        const sp = anim.spin('orb', phase === 3 ? 0.35 : 0.15);
        parts.forEach((p, i) => {
          const k = anim.spring('p' + i, phase === 3 ? (anim.stagger(i, 0.5, 0.3) > 0 ? 1 : 0) : 1, { from: 0, freq: 3, damp: 0.6 });
          if (k < 0.05) return;
          const a = sp + (i / 5) * Math.PI * 2;
          grid.icon(p[0], cx + Math.cos(a) * 30 * k, cy + Math.sin(a) * 10 * k, G, { key: 'pt' + i, base: false, label: phase === 3 ? p[1] : '', labelColor: palette.accent, alpha: Math.min(1, k) });
        });
      }
    }
  },

  // ============================================================================
  // 12. STEP 1: THE INNER LOOP
  // ============================================================================
  {
    id: 'rsi2-12',
    number: '12',
    title: 'Step 1: The Inner Loop',
    category: 'Live Demo',
    prompt: 'A research agent loops propose-run-time-log on a GPU kernel target and plateaus at a ceiling.',
    shows: 'A research agent spins in its loop; a GPU-kernel target locks on; each pass (propose → run → time → log) drops a point on a rising trail that flattens against a red ceiling.',
    phases: ['Autonomous Research Agent', 'The Optimization Target', 'Propose · Run · Time · Log', 'Hits a Ceiling'],
    captions: [
      'A research agent spins up inside its loop',
      'A target reticle locks onto a GPU kernel',
      'Each loop pass lights PROPOSE → RUN → TIME → LOG and drops a point on a rising trail',
      'The trail flattens against a red ceiling'
    ],
    narration: [
      `In Step One, the Inner Loop acts as an autonomous research agent.`,
      `We give it a complex systems-optimization target, such as writing custom GPU kernels or optimizing a training pipeline.`,
      `The agent proposes candidate code, runs it against an evaluation metric, times the execution, and logs the trajectory.`,
      `Initially, the baseline agent hits a ceiling.`
    ],
    stageMinimums: [3.5, 0, 0, 3.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const R = palette.danger;
      const lx = 26;
      const ly = 17;
      const sp = anim.spin('loop', phase >= 3 ? 1.8 : 0.7);
      grid.ring3D(lx, ly, 7, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: sp, glow: true });
      grid.icon('agent', lx, ly, palette.accent, { key: 'inner', base: false });

      if (phase === 2) {
        const tx = 92;
        const k = anim.spring('lock', 1, { from: 0, freq: 2.5 });
        grid.reticle(tx, ly, 6 - k * 1.5, { color: palette.warn });
        grid.icon('chip', tx, ly, palette.accent, { key: 'gpu', glow: true, base: false });
        grid.text(tx, ly + 8, 'GPU kernel', palette.accent, false, 'center');
        drawCleanLink(grid, time, tx - 9, ly, lx + 9, ly, '', palette.dim, palette.warn, 0.7);
      }
      if (phase >= 3) {
        const steps = ['propose', 'run', 'time', 'log'];
        const act = Math.floor(anim.spin('st', 2.4)) % 4;
        steps.forEach((s, i) => {
          const a = -Math.PI / 2 + (i / 4) * Math.PI * 2;
          grid.text(lx + Math.cos(a) * 19, ly + Math.sin(a) * 7.5, s, i === act ? '#ffffff' : palette.dim, i === act, 'center');
        });
        const x0 = 58;
        const yB = 28;
        const yT = 6;
        const n = Math.min(30, Math.floor(anim.spin('att', 3.5)));
        const ceil = 0.55;
        const pts = [];
        for (let i = 0; i < n; i++) {
          const v = Math.min(ceil, 0.1 + (1 - Math.exp(-i / 6)) * 0.48) - hash01(i) * 0.04;
          pts.push([x0 + i * 2.1, yB - v * (yB - yT)]);
        }
        if (pts.length > 1) grid.vpath(pts, { color: palette.accent, alpha: 0.9, width: 1.8, glow: true });
        pts.forEach((p, i) => grid.vdot(p[0], p[1], i === pts.length - 1 ? 2.8 : 1.4, { color: i === pts.length - 1 ? '#ffffff' : palette.accent }));
        if (phase === 4) {
          const cyl = yB - ceil * (yB - yT) - 0.4;
          grid.vline(x0 - 2, cyl, 124, cyl, { color: R, alpha: 0.95, width: 2.4 });
          grid.text(124, cyl - 1.5, 'ceiling', R, true, 'right');
        }
      }
    }
  },

  // ============================================================================
  // 13. STEP 2: THE OUTER LOOP (MASS)
  // ============================================================================
  {
    id: 'rsi2-13',
    number: '13',
    title: 'Step 2: The Outer Loop (MASS)',
    category: 'Live Demo',
    prompt: 'An outer loop forms around the inner loop; three roles share one model, inspect traces and rewrite the workflow.',
    shows: 'A slower outer loop closes around the inner loop; three roles (agent · evaluator · optimizer) orbit one shared core; a trace strip lights up with two red breaks; then two lines of the inner loop\'s code are struck and rewritten in place.',
    phases: ['Outer Loop Takes Over', 'Three Roles, One Model', 'Inspect the Traces', 'Rewrite the Inner Loop'],
    captions: [
      'A second, slower loop closes around the inner loop — no human needed',
      'Agent, evaluator and optimizer orbit one shared core (MASS, Oct 8)',
      'A trace strip scans left to right; two red breaks light up: tool · handoff',
      'Two lines of the inner loop\'s code are struck through and rewritten'
    ],
    narration: [
      `In Step Two, instead of a human engineer stepping in to debug the agent's workflow, the Outer Loop takes over.`,
      `In the MASS architecture published on October 8th, the task agent, the self-evaluator, and the workflow optimizer all share the exact same underlying language model.`,
      `The Outer Loop inspects the execution traces of the Inner Loop, diagnoses where the inter-agent communication or tool execution broke down,`,
      `and rewrites the workflow prompt and helper functions of the Inner Loop itself.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const cx = 30;
      const cy = 17;

      grid.ring3D(cx, cy, 5.5, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: anim.spin('in', 2), glow: false, alpha: 0.6 });
      const oA = anim.spring('oA', 1, { from: 0, freq: 2 });
      grid.ring3D(cx, cy, 13 * (0.6 + 0.4 * oA), 1.25, 0, { color: G, dim: palette.dim, spin: -anim.spin('out', 0.5), glow: true, alpha: oA });
      grid.icosahedron3D(cx, cy, 2.2, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });

      if (phase >= 2) {
        const roles = [['agent', 'agent'], ['eye', 'evaluator'], ['gear', 'optimizer']];
        const sp = anim.spin('roles', 0.4);
        roles.forEach((r, i) => {
          const a = sp + (i / 3) * Math.PI * 2;
          const x = cx + Math.cos(a) * 24;
          const y = cy + Math.sin(a) * 9;
          grid.vline(cx, cy, x, y, { color: palette.accent, alpha: 0.25, width: 1, dash: [2, 3] });
          grid.icon(r[0], x, y, palette.accent, { key: 'r' + i, base: false, label: r[1] });
        });
        if (phase === 2) grid.text(cx, cy + 14, 'one shared model', '#ffffff', true, 'center');
      }
      if (phase >= 3) {
        const nodes = ['plan', 'tool', 'handoff', 'eval', 'retry', 'submit'];
        const scan = phase === 3 ? math.clamp(phaseTime / (stageDuration * 0.85), 0, 1) : 1;
        nodes.forEach((n, i) => {
          const x = 68 + i * 10.5;
          const seen = i / nodes.length < scan;
          const broken = i === 1 || i === 2;
          const col = seen ? (broken ? R : G) : palette.dim;
          if (i < 5) grid.vline(x + 1, 9, x + 9.5, 9, { color: col, alpha: 0.5, width: 1.2 });
          grid.vdot(x, 9, broken && seen ? 3 : 2, { color: col });
          grid.text(x, 11, n, col, broken && seen, 'center');
        });
        grid.vline(68 + scan * 55, 6.5, 68 + scan * 55, 11.5, { color: palette.warn, alpha: 0.7, width: 1.2 });
      }
      if (phase === 4) {
        const k = phaseTime;
        const lines = [
          { old: 'prompt = BASE', neu: 'prompt = refine(BASE, traces)', y: 19 },
          { old: 'call_tool(t)', neu: 'retry(call_tool(t), 3)', y: 23 }
        ];
        lines.forEach((l, i) => {
          const t = math.clamp(k - i * 1.2, 0, 3);
          grid.text(70, l.y, l.old, t > 0.8 ? R : palette.dim, false, 'left', null, t > 1.4 ? 0.45 : 1);
          if (t > 0.8) grid.vline(69.5, l.y, 69.5 + Math.min(l.old.length, (t - 0.8) * 30), l.y, { color: R, alpha: 0.9, width: 1.4 });
          if (t > 1.4) grid.text(70, l.y + 1.6, l.neu, G, true, 'left');
        });
      }
    }
  },

  // ============================================================================
  // 14. STEP 3: DREAM-RSI WORLD REPLAY
  // ============================================================================
  {
    id: 'rsi2-14',
    number: '14',
    title: 'Step 3: Dream-RSI World Replay',
    category: 'Live Demo',
    prompt: 'A branching search burns compute and hits dead ends; it becomes a replay map where a simulated path finds the best branch.',
    shows: 'A tree of code branches grows while a cost counter races; dead ends turn red; the whole tree cools into a calm blue replay map; then a bright simulated path threads past every dead end to a star.',
    phases: ['Online Search Is Expensive', 'Exploring & Dead Ends', 'Replay Simulator', 'Simulate, Then Spend'],
    captions: [
      'A tree of code branches sprouts while a "$" compute counter races',
      'Dead ends turn red as branches fail (Dream-RSI, Oct 6)',
      'The tree cools into a calm replay map — a world model of the code',
      'A bright simulated path threads past every dead end to a ★ high-yield branch'
    ],
    narration: [
      `However, running thousands of trial-and-error code mutations online is computationally expensive.`,
      `That is where Google's Dream-RSI framework, updated on October 6th, comes in. As the agent explores different code branches and hits dead ends,`,
      `Dream-RSI turns that structured discovery history into an empirical replay simulator—essentially an internal world model of the code environment.`,
      `In Step Three of our demo, before burning massive compute on live evaluations, the meta-policy simulates trajectories inside this replay map, skipping known dead ends and selecting high-yield optimization branches.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      const L0 = [14, 17];
      const L1 = [[40, 10], [40, 24]];
      const L2 = [[68, 6], [68, 13], [68, 21], [68, 28]];
      const L3 = [];
      L2.forEach(p => { L3.push([96, p[1] - 2]); L3.push([96, p[1] + 2]); });
      const deadL2 = [0, 3];
      const deadL3 = [2, 3, 4, 7];
      const best = 5;
      const explore = phase === 1 ? math.clamp(phaseTime / stageDuration, 0, 1) * 0.6 : (phase === 2 ? 0.6 + math.clamp(phaseTime / stageDuration, 0, 1) * 0.4 : 1);
      const replay = phase >= 3;
      const col = anim.color('treeC', replay ? palette.primary : palette.accent);
      if (replay) grid.glow(55, 17, 30, palette.primary, 0.8);

      const edge = (a, b, idx) => {
        if (idx / 14 > explore) return;
        grid.vline(a[0] + 1, a[1], b[0] - 1, b[1], { color: col, alpha: replay ? 0.3 : 0.45, width: 1.2 });
      };
      L1.forEach((p, i) => edge(L0, p, i));
      L2.forEach((p, i) => edge(L1[Math.floor(i / 2)], p, 2 + i));
      L3.forEach((p, i) => edge(L2[Math.floor(i / 2)], p, 6 + i));
      const node = (p, dead, idx) => {
        if (idx / 14 > explore) return;
        const d = dead && phase >= 2;
        if (d) grid.text(p[0], p[1], '✕', R, true, 'center');
        else grid.vdot(p[0], p[1], 2, { color: col });
      };
      grid.vdot(L0[0], L0[1], 3, { color: '#ffffff' });
      L1.forEach((p, i) => node(p, false, i));
      L2.forEach((p, i) => node(p, deadL2.includes(i), 2 + i));
      L3.forEach((p, i) => node(p, deadL3.includes(i) || deadL2.includes(Math.floor(i / 2)), 6 + i));

      const cost = phase <= 2 ? anim.spin('cost', phase === 1 ? 3200 : 2400) : anim.spin('cost', 0, 6);
      grid.big(116, 6, `$${Math.round(cost).toLocaleString('en-US')}`, { size: 1.6, color: phase <= 2 ? palette.warn : palette.dim, align: 'right', reveal: false });
      if (phase === 3) grid.text(55, 32, 'replay map', palette.primary, true, 'center');
      if (phase === 4) {
        const path = [L0, L1[1], L2[2], L3[best]];
        const k = math.clamp((phaseTime % 3.2) / 2.4, 0, 1);
        const seg = Math.min(2, Math.floor(k * 3));
        const f = k * 3 - seg;
        const pts = path.slice(0, seg + 1);
        pts.push([path[seg][0] + (path[seg + 1][0] - path[seg][0]) * f, path[seg][1] + (path[seg + 1][1] - path[seg][1]) * f]);
        grid.vpath(pts, { color: G, alpha: 0.95, width: 2.6, glow: true });
        grid.text(L3[best][0], L3[best][1], '★', G, true, 'center');
        grid.glow(L3[best][0], L3[best][1], 4, G, 1.4);
        grid.text(L3[best][0] + 3, L3[best][1], 'best branch', G, true, 'left');
      }
    }
  },

  // ============================================================================
  // 15. STEP 4: THE VERIFICATION GATE
  // ============================================================================
  {
    id: 'rsi2-15',
    number: '15',
    title: 'Step 4: The Verification Gate',
    category: 'Live Demo',
    prompt: 'Candidates meet a gate; a weaker one bounces off, a stronger one beats the previous best and passes.',
    shows: 'A glowing gate; a candidate update approaches; a weaker candidate bounces off (its bar falls short of the previous best); a stronger one\'s bar overtakes the best and it glides through.',
    phases: ['The Gate', 'Commit Only If…', '…It Beats the Best on Held-Out'],
    captions: [
      'A glowing gate; a candidate update drifts toward it',
      'A weaker candidate\'s bar stops short of the previous best — it bounces off',
      'A stronger candidate\'s bar overtakes the best and it glides through: committed'
    ],
    narration: [
      `In Step Four, the candidate rewrite must pass a strict verification gate.`,
      `The Outer Loop only commits the self-written harness update`,
      `if it measurably outperforms the previous best version on held-out checks.`
    ],
    stageMinimums: [3.5, 3.5, 4],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const gx = 64;
      const gateCol = anim.color('gate', phase === 3 ? G : palette.warn);
      grid.vline(gx, 6, gx, 28, { color: gateCol, alpha: 0.9, width: 3 });
      grid.glow(gx, 17, 8, gateCol, 0.9);
      grid.icon('shield', gx, 4.5, gateCol, { key: 'gs', base: false });

      // Previous-best marker on a score scale under the gate
      const sx0 = 74;
      const sL = 46;
      grid.vline(sx0 + sL * 0.71, 22, sx0 + sL * 0.71, 30, { color: palette.accent, alpha: 0.8, width: 1.4, dash: [2, 2] });
      grid.text(sx0 + sL * 0.71, 31, 'previous best', palette.accent, false, 'center');

      if (phase === 1) {
        grid.icon('file', anim.spring('cx', 40, { from: 12, freq: 1.5 }), 15, palette.accent, { key: 'c1', bob: true, base: false });
      }
      if (phase === 2) {
        const bt = (time * 0.55) % 1;
        grid.icon('file', 34 + Math.sin(bt * Math.PI) * 24, 15, R, { key: 'weak', base: false });
        drawHBar(grid, sx0, 25, sL, 0.66, R);
      }
      if (phase === 3) {
        const x = anim.spring('sx', 100, { from: 34, freq: 1.4, damp: 0.85 });
        grid.icon('file', x, 15, G, { key: 'strong', glow: true, base: false });
        drawHBar(grid, sx0, 25, sL, anim.spring('sv', 0.78, { from: 0.6, freq: 1.8 }), G);
        if (x > 92) grid.text(x, 19, 'committed', G, true, 'center');
      }
    }
  },

  // ============================================================================
  // 16. EIGHT DAYS UNATTENDED
  // ============================================================================
  {
    id: 'rsi2-16',
    number: '16',
    title: 'Eight Days Unattended',
    category: 'Live Demo',
    prompt: 'Seven ever-stronger agents across eight days; it beats a two-year human agent on unseen tests; reward hacking drops 63% → 34%.',
    shows: 'Across an 8-day line, agent versions v1 → v7 appear, each a little larger and brighter; then three paired bars show it beating a 2-year hand-tuned agent; then a red bug shrinks as reward hacking counts down from 63% to 34%.',
    phases: ['8 Days · 7 Versions', 'Beats a 2-Year Human Agent', 'Reward Hacking 63% → 34%'],
    captions: [
      'Along an 8-day line, agent versions v1 → v7 appear, each larger and brighter',
      'Three unseen benchmarks: self-evolved bars rise above the 2-year hand-tuned agent',
      'A red bug shrinks as reward hacking counts down 63% → 34%'
    ],
    narration: [
      `In a recent eight-day unattended run using this exact inner-and-outer-loop structure, the system autonomously generated seven successively stronger versions of its own research agent.`,
      `By day eight, the self-evolved agent beat a human-engineered agent that had been hand-tuned over two years—and it beat it across three separate benchmarks it had never been trained on.`,
      `Even more remarkably, the rate at which the agent tried to "reward hack" or cheat the GPU kernel benchmark dropped from sixty-three percent down to thirty-four percent, an emergent improvement in reliability that no human explicitly programmed.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        const x0 = 12;
        const x1 = 116;
        const prog = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        grid.vline(x0, 24, x1, 24, { color: palette.dim, alpha: 0.4, width: 1.2 });
        grid.vline(x0, 24, x0 + (x1 - x0) * prog, 24, { color: G, alpha: 0.9, width: 2 });
        for (let d = 1; d <= 8; d++) grid.text(x0 + ((d - 0.5) / 8) * (x1 - x0), 26, `day ${d}`, palette.dim, false, 'center');
        for (let v = 1; v <= 7; v++) {
          const vx = x0 + (v / 7.6) * (x1 - x0);
          if ((vx - x0) / (x1 - x0) > prog) continue;
          const s = 1.2 + v * 0.3;
          grid.shape3D('icosa', vx, 17 - v * 0.7, s, ctx.anim.spin('vx' + v, 0.5), ctx.anim.spin('vy' + v, 0.6), 0, { color: v === 7 ? G : palette.accent, accent: '#ffffff', dim: palette.dim, alpha: 0.4 + v * 0.085 });
          grid.text(vx, 21, `v${v}`, v === 7 ? G : palette.accent, v === 7, 'center');
        }
      }
      if (phase === 2) {
        const pairs = [[0.62, 0.74], [0.55, 0.69], [0.48, 0.64]];
        pairs.forEach((s, i) => {
          const bx = 34 + i * 22;
          drawVBar(grid, bx, 26, 16, anim.spring('h' + i, s[0], { from: 0, freq: 2.2 }), palette.primary, 4);
          drawVBar(grid, bx + 6, 26, 16, anim.spring('a' + i, s[1], { from: 0, freq: 1.8 }), G, 4);
          grid.text(bx + 4.5, 28, `unseen ${i + 1}`, palette.dim, false, 'center');
        });
        grid.icon('human', 108, 12, palette.primary, { key: 'hum', base: false, label: '2 yrs hand-tuned' });
        grid.icon('agent', 108, 21, G, { key: 'evo', base: false, label: 'self-evolved' });
      }
      if (phase === 3) {
        const v = anim.spring('rh', 34, { from: 63, freq: 1.1 });
        grid.icon('bug', 40, 17, R, { key: 'bug', glow: true, base: false, alpha: Math.max(0.25, (v - 25) / 38) });
        grid.big(80, 15, `${Math.round(v)}%`, { size: 3.4, color: v > 45 ? R : palette.warn, reveal: false });
        grid.text(80, 22, 'reward hacking', palette.dim, false, 'center');
        if (v < 36) grid.text(80, 25, 'nobody programmed this', G, true, 'center');
      }
    }
  },

  // ============================================================================
  // 17. STEP 5: BACK INTO THE WEIGHTS
  // ============================================================================
  {
    id: 'rsi2-17',
    number: '17',
    title: 'Step 5: Back Into the Weights',
    category: 'Live Demo',
    prompt: 'The best rollouts flow into the shared model, which upgrades; win rate 68.3%; evaluator 73% → 93%.',
    shows: 'A field of rollout dots; the best ones light up and stream into the shared model, which morphs into its next version; a 68.3% win-rate gauge fills, then a second gauge climbs 73% → 93% as the student becomes the teacher.',
    phases: ['Loop Closes Into Weights', 'Harvest the Best Rollouts', 'Fine-Tune the Shared Model', '68.3% Win Rate', 'Evaluator 73% → 93%'],
    captions: [
      'A field of rollout dots surrounds the shared model',
      'The best rollouts light up green; the rest fade',
      'Green rollouts stream into the model, which morphs into its next version',
      'Gauge: 68.3% win rate over the base model',
      'Second gauge climbs 73% → 93%; a student icon turns into a teacher'
    ],
    narration: [
      `Finally, in Step Five, the loop closes back into the model's weights.`,
      `Under the MASS framework, once the multi-agent workflow is optimized, the system harvests the highest-performing rollouts—capturing both the bounded local execution of subagents and the high-level delegation of the orchestrator—`,
      `and fine-tunes the shared foundation model on its own collective output.`,
      `That single post-training cycle doesn't just make the model better at solving tasks, where it achieved a sixty-eight-point-three percent win rate over its base version;`,
      `it simultaneously upgrades the model's ability to evaluate itself, driving self-evaluator accuracy from seventy-three percent up to ninety-three percent. The student literally becomes a sharper teacher for the next cycle.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const mx = phase >= 4 ? 34 : 64;
      const cx = anim.spring('mx', mx, { freq: 1.8 });

      if (phase <= 3) {
        for (let i = 0; i < 40; i++) {
          const a = (i / 40) * Math.PI * 2 + hash01(i) * 0.3;
          const r = 20 + hash01(i + 9) * 22;
          const top = hash01(i * 2.3) > 0.7;
          let x = cx + Math.cos(a) * r;
          let y = 17 + Math.sin(a) * r * 0.32;
          if (phase === 3 && top) {
            const k = (time * 0.6 + hash01(i)) % 1;
            x += (cx - x) * k;
            y += (17 - y) * k;
          }
          const col = phase >= 2 && top ? G : palette.dim;
          grid.vdot(x, y, phase >= 2 && top ? 2.2 : 1.4, { color: col, alpha: phase >= 2 && !top ? 0.3 : 0.9 });
        }
      }
      const up = phase >= 3;
      const col = anim.color('mc', up ? G : palette.accent);
      grid.morph3D('model', up ? 'dodeca' : 'icosa', cx, 17, anim.spring('ms', up ? 4 : 3, { freq: 2.5, damp: 0.6 }), anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: col, accent: '#ffffff', dim: palette.dim });
      grid.glow(cx, 17, 9, col, up ? 1.4 : 0.8);
      if (phase === 2) grid.text(cx, 30, 'best rollouts', G, true, 'center');

      if (phase >= 4) {
        const w = anim.spring('w', 68.3, { from: 50, freq: 1.4 });
        drawArc(grid, 74, 15, 6, w / 100, G, 2.6);
        grid.big(74, 15, `${w.toFixed(1)}%`, { size: 1.6, color: G, reveal: false });
        grid.text(74, 23.5, 'win rate', palette.dim, false, 'center');
      }
      if (phase === 5) {
        const e = anim.spring('e', 93, { from: 73, freq: 1.3 });
        drawArc(grid, 106, 15, 6, e / 100, palette.warn, 2.6);
        grid.big(106, 15, `${Math.round(e)}%`, { size: 1.6, color: palette.warn, reveal: false });
        grid.text(106, 23.5, 'self-evaluation', palette.dim, false, 'center');
        grid.icon(e > 88 ? 'eye' : 'agent', 90, 29, palette.accent, { key: e > 88 ? 'teacher' : 'student', base: false, label: e > 88 ? 'teacher' : 'student' });
      }
    }
  },

  // ============================================================================
  // 18. SCALE — AND CONTAIN
  // ============================================================================
  {
    id: 'rsi2-18',
    number: '18',
    title: 'Scale — and Contain',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Two document streams; loops multiply; a glowing shell closes around them.',
    shows: 'Documents from both labs flow in from the sides; loops multiply across the screen (scale); then a glowing shell closes around them all (contain).',
    phases: ['Two Weeks of Docs', 'To Scale…', '…and Contain'],
    captions: [
      'Documents flow in from both sides: Anthropic and OpenAI',
      'Loops multiply across the screen — scale',
      'A glowing shell closes around all of them — contain'
    ],
    narration: [
      `If you look closely at the developer documentation and release notes published by Anthropic and OpenAI over the past two weeks,`,
      `you can see both companies actively building the exact infrastructure required to scale—`,
      `and contain—these recursive loops.`
    ],
    stageMinimums: [0, 3.5, 3.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      if (phase === 1) {
        for (let i = 0; i < 4; i++) {
          const t = (time * 0.3 + i / 4) % 1;
          grid.icon('file', 6 + t * 50, 12 + (i % 2) * 8, palette.accent, { key: 'l' + i, base: false, alpha: Math.sin(t * Math.PI) });
          grid.icon('file', 122 - t * 50, 12 + ((i + 1) % 2) * 8, palette.primary, { key: 'r' + i, base: false, alpha: Math.sin(t * Math.PI) });
        }
        grid.text(20, 30, 'Anthropic', palette.accent, false, 'center');
        grid.text(108, 30, 'OpenAI', palette.primary, false, 'center');
        return;
      }
      const n = Math.min(7, 1 + Math.floor(anim.spin('mult', 1.8)));
      for (let i = 0; i < n; i++) {
        const x = 64 + (i - 3) * 6.5;
        const y = 17 + Math.sin(i * 1.7) * 3;
        grid.ring3D(x, y, 2.4, 1.2, 0, { color: palette.accent, dim: palette.dim, spin: anim.spin('r' + i, 1.4 + i * 0.25), glow: true });
      }
      if (phase === 3) {
        const k = anim.spring('shell', 1, { from: 0, freq: 2.2 });
        grid.vcircle(64, 17, 13 + (1 - k) * 10, { color: G, alpha: 0.85 * k, width: 2.4 });
        grid.vcircle(64, 17, 14 + (1 - k) * 10, { color: G, alpha: 0.25 * k, width: 6 });
        grid.icon('lock', 64, 32, G, { key: 'lock', base: false, alpha: k });
      }
    }
  },

  // ============================================================================
  // 19. ANTHROPIC: THE CLAUDE 5.5 ROLLOUT
  // ============================================================================
  {
    id: 'rsi2-19',
    number: '19',
    title: 'Anthropic: The Claude 5.5 Rollout',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Opus 5.5 with −40% cost and +30% speed; a 680k-line migration in under 24 hours; Sonnet 5.5; Oct 7.',
    shows: 'October dates tick by; the Opus 5.5 core appears flanked by large "−40%" cost and "+30%" speed; a code-migration bar races to 680,000 lines against a 24-hour clock; Sonnet 5.5 joins and "OCT 7" lands.',
    phases: ['Early–Mid October', 'Opus 5.5: −40% Cost, +30% Speed', '680k-Line Migration < 24h', 'Sonnet 5.5 · Oct 7 Update'],
    captions: [
      'October dates tick along a line: Oct 1 → Oct 15',
      'Opus 5.5 core with large "−40%" (cost) and "+30%" (speed)',
      'A migration bar races to 680,000 lines while a clock runs to under 24h',
      'Sonnet 5.5 joins beside Opus; "OCT 7" lands as the platform update'
    ],
    narration: [
      `Let's look first at Anthropic's latest documentation updates from early to mid-October.`,
      `Following the rollout of Claude Opus 5.5—which cut inference costs by forty percent, increased generation speed by over thirty percent,`,
      `and allowed early testers to autonomously complete a six-hundred-and-eighty-thousand-line code migration in under twenty-four hours—`,
      `and Claude Sonnet 5.5, Anthropic pushed a major developer platform update on October 7th.`
    ],
    stageMinimums: [3.5, 0, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.vline(14, 18, 114, 18, { color: palette.dim, alpha: 0.4, width: 1.2 });
        const p = math.clamp(phaseTime / stageDuration, 0, 1);
        grid.vline(14, 18, 14 + 100 * p, 18, { color: palette.accent, alpha: 0.9, width: 2 });
        for (let d = 1; d <= 15; d += 2) {
          const x = 14 + ((d - 1) / 14) * 100;
          grid.vdot(x, 18, 1.6, { color: x <= 14 + 100 * p ? palette.accent : palette.dim });
          grid.text(x, 20, `${d}`, palette.dim, false, 'center');
        }
        grid.big(64, 12, 'OCTOBER', { size: 2.4, color: palette.accent });
        return;
      }
      const ox = phase === 4 ? 44 : 64;
      const cx = anim.spring('ox', ox, { freq: 1.8 });
      grid.icosahedron3D(cx, 13, 2.8, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.text(cx, 19, 'Opus 5.5', palette.accent, true, 'center');
      if (phase === 2) {
        grid.big(28, 13, '−40%', { size: 3, color: G });
        grid.text(28, 17.5, 'cost', palette.dim, false, 'center');
        grid.big(100, 13, '+30%', { size: 3, color: G });
        grid.text(100, 17.5, 'speed', palette.dim, false, 'center');
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.9), 0, 1);
        drawHBar(grid, 16, 26, 82, p, G);
        grid.big(57, 30.5, `${Math.round(p * 680).toLocaleString('en-US')},000 lines`, { size: 1.5, color: G, reveal: false });
        drawClock(grid, 108, 26, anim.spin('clk', 14), palette.accent);
        grid.text(112, 26, `${Math.min(23, Math.floor(p * 23.5))}h`, palette.accent, false, 'left');
      }
      if (phase === 4) {
        grid.shape3D('octa', 84, 13, 2.4, anim.spin('c', 0.5), anim.spin('d', 0.6), 0, { color: palette.primary, accent: '#ffffff', dim: palette.dim });
        grid.text(84, 19, 'Sonnet 5.5', palette.primary, true, 'center');
        grid.big(64, 27, 'OCT 7', { size: 2.6, color: G });
      }
    }
  },

  // ============================================================================
  // 20. HAIKU 5.5 & THE MIGRATION DOCS
  // ============================================================================
  {
    id: 'rsi2-20',
    number: '20',
    title: 'Haiku 5.5 & the Migration Docs',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'A one-million-token context bar; an effort dial; old parameters bounce off with 400.',
    shows: 'Haiku 5.5 unrolls a huge 1,000,000-token context bar with a short 128K output bar beneath; an "effort" dial sweeps low → high as adaptive thinking switches on; then old parameter names fly in and bounce off with "400".',
    phases: ['Haiku 5.5: 1M Context', 'Adaptive Thinking + effort', 'Old Params → 400'],
    captions: [
      'Haiku 5.5 unrolls a 1,000,000-token context bar; a short 128K output bar below',
      'An "effort" dial sweeps low → high: adaptive thinking on by default',
      'budget_tokens, temperature, top_p, top_k fly in and bounce off: 400'
    ],
    narration: [
      `They launched Claude Haiku 5.5, bringing a one-million-token context window and one-hundred-and-twenty-eight-thousand max output tokens to high-volume, latency-sensitive agent workloads.`,
      `If you read the migration documentation for Haiku 5.5, several architectural shifts stand out. First, adaptive thinking is now enabled by default and controlled via an effort parameter,`,
      `while manual budget_tokens and traditional sampling parameters like temperature, top_p, and top_k now return 400 errors.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.shape3D('tetra', 14, 9, 2, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.text(14, 13.5, 'Haiku 5.5', palette.accent, true, 'center');

      if (phase === 1) {
        const k = anim.spring('ctx', 1, { from: 0, freq: 0.9 });
        drawHBar(grid, 24, 9, 96, k, G);
        grid.big(72, 15, `${Math.round(k * 1000000).toLocaleString('en-US')}`, { size: 2.6, color: G, reveal: false });
        grid.text(72, 19, 'tokens of context', palette.dim, false, 'center');
        drawHBar(grid, 24, 24, 96, k * 0.128, palette.primary);
        grid.text(24 + 96 * 0.128 * k + 4, 24, '128K output', palette.primary, false, 'left');
      }
      if (phase === 2) {
        const v = anim.spring('dial', 1, { from: 0, freq: 1 });
        const a = Math.PI * (1 + v);
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = Math.PI + (i / 40) * Math.PI;
          pts.push([64 + Math.cos(t) * 22, 22 + Math.sin(t) * 12]);
        }
        grid.vpath(pts, { color: palette.dim, alpha: 0.5, width: 2 });
        grid.vline(64, 22, 64 + Math.cos(a) * 20, 22 + Math.sin(a) * 11, { color: '#ffffff', alpha: 0.95, width: 2.4 });
        grid.vdot(64, 22, 3, { color: G });
        grid.text(42, 24, 'low', palette.dim, false, 'center');
        grid.text(86, 24, 'high', G, v > 0.8, 'center');
        grid.big(64, 28, 'EFFORT', { size: 1.8, color: palette.accent });
        grid.text(64, 7, 'adaptive thinking · on', G, true, 'center');
      }
      if (phase === 3) {
        const params = ['budget_tokens', 'temperature', 'top_p', 'top_k'];
        params.forEach((p, i) => {
          const t = ((phaseTime * 0.5) + i * 0.25) % 1;
          const x = t < 0.6 ? 120 - (t / 0.6) * 54 : 66 + ((t - 0.6) / 0.4) * 30;
          const y = 8 + i * 6 + (t >= 0.6 ? ((t - 0.6) / 0.4) * 2 : 0);
          grid.big(x, y, p, { size: 1.1, color: t >= 0.6 ? R : palette.accent, alpha: t >= 0.6 ? 1 - (t - 0.6) / 0.4 : 1, reveal: false });
          if (t > 0.58 && t < 0.75) grid.big(57, y, '400', { size: 1.3, color: R, reveal: false });
        });
        grid.vline(62, 5, 62, 29, { color: R, alpha: 0.6, width: 2 });
      }
    }
  },

  // ============================================================================
  // 21. WHY CACHE PRICING MATTERS
  // ============================================================================
  {
    id: 'rsi2-21',
    number: '21',
    title: 'Why Cache Pricing Matters for RSI',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Cache-read prices drop; a loop rereads the same codebase; the cost of a multi-day loop collapses.',
    shows: 'A price bar halves to a large "$0.10"; an Opus bar drops 60%; a loop rereads the same codebase in a blur of cache hits; then a multi-day timeline runs on while its cost line stays nearly flat.',
    phases: ['Sonnet 5.5: Cache Reads Halved', 'Opus 5.5: −60%', 'Cache Reads Dominate Loop Cost', 'Multi-Day Loops Become Viable'],
    captions: [
      'Sonnet 5.5 price bar halves; "$0.10 / M" in large type',
      'Opus 5.5 bar drops 60%',
      'A loop rereads the same codebase hundreds of times — cache hits fly',
      'Days tick along a timeline while the cost line stays nearly flat'
    ],
    narration: [
      `Second, Anthropic slashed prompt cache read pricing on Sonnet 5.5 in half, down to ten cents per million tokens—just five percent of the base input price—`,
      `following a sixty percent cache read reduction on Opus 5.5.`,
      `Why does that matter for RSI? Because in long-horizon agentic loops that iterate over the same codebase hundreds of times, prompt cache reads make up the overwhelming majority of compute costs.`,
      `Dropping cache read costs to a fraction of a cent per call makes continuous, multi-day self-improvement loops economically viable at scale.`
    ],
    stageMinimums: [0, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase <= 2) {
        const s = anim.spring('s', 0.5, { from: 1, freq: 1.4 });
        grid.text(14, 11, 'Sonnet 5.5', palette.accent, false, 'left');
        drawHBar(grid, 30, 11, 60, s, G);
        grid.big(110, 11, '$0.10/M', { size: 1.8, color: G });
        if (phase === 2) {
          const o = anim.spring('o', 0.4, { from: 1, freq: 1.4 });
          grid.text(14, 22, 'Opus 5.5', palette.accent, false, 'left');
          drawHBar(grid, 30, 22, 60, o, G);
          grid.big(110, 22, '−60%', { size: 1.8, color: G });
        }
        return;
      }
      if (phase === 3) {
        grid.ring3D(40, 17, 7, 1.25, 0, { color: palette.accent, dim: palette.dim, spin: anim.spin('l', 3), glow: true });
        grid.icon('agent', 40, 17, palette.accent, { key: 'a', base: false });
        grid.icon('file', 92, 17, palette.primary, { key: 'repo', base: false, label: 'same codebase' });
        for (let i = 0; i < 6; i++) {
          const t = (time * 1.1 + i / 6) % 1;
          grid.big(52 + t * 34, 17 + Math.sin(i * 2) * 3, 'hit', { size: 1, color: G, alpha: Math.sin(t * Math.PI), reveal: false });
        }
        grid.big(64, 29, `×${Math.round(anim.spin('it', 60))}`, { size: 1.8, color: palette.dim, reveal: false });
      }
      if (phase === 4) {
        const p = math.clamp(phaseTime / (stageDuration * 0.9), 0, 1);
        const x0 = 12;
        const x1 = 116;
        for (let d = 1; d <= 5; d++) {
          const x = x0 + ((d - 0.5) / 5) * (x1 - x0);
          grid.text(x, 27, `day ${d}`, x <= x0 + (x1 - x0) * p ? palette.accent : palette.dim, false, 'center');
        }
        const xp = x0 + (x1 - x0) * p;
        grid.vpath([[x0, 24], [xp, 24 - p * 1.5]], { color: G, alpha: 0.95, width: 2.6, glow: true });
        grid.vpath([[x0, 24], [x0 + (x1 - x0) * p * 0.35, 24 - p * 18]], { color: palette.danger, alpha: 0.25, width: 1.4, dash: [3, 3] });
        grid.ring3D(xp, 14, 3, 1.25, 0, { color: G, dim: palette.dim, spin: anim.spin('r', 2.4), glow: true });
        grid.big(xp, 19, 'still running', { size: 1, color: G, reveal: false });
      }
    }
  },

  // ============================================================================
  // 22. LOCKING DOWN THE AGENTS
  // ============================================================================
  {
    id: 'rsi2-22',
    number: '22',
    title: 'Locking Down the Agents',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'An agent inside a glowing shell reaches out; listed hosts pass; an unlisted host is blocked at the wall.',
    shows: 'An agent sits inside a glowing shell; computer-use and browser tools attach to it; requests to two allowed hosts pass through; a request to an unlisted host strikes the shell and dies in a red spark.',
    phases: ['Lock Down the Agents', 'Oct 7 SDK: Computer Toolset', 'allowed_hosts Enforced', 'Blocked at Infrastructure'],
    captions: [
      'An agent inside a glowing containment shell',
      'Computer-use and browser tools snap onto it (Oct 7 SDK)',
      'Requests flow through the shell to two allowed hosts',
      'A request to an unlisted host hits the shell and dies in a red spark: blocked'
    ],
    narration: [
      `At the same time, Anthropic's October documentation reveals a massive push to lock down how these agents interact with the outside world and how their code is verified.`,
      `In the October 7th SDK update, Anthropic introduced beta Python and TypeScript classes for its updated computer_toolset_20260801 and browser automation loops,`,
      `while simultaneously enforcing strict network sandboxing in Claude Managed Agents. Under the new documentation, any cloud environment with limited networking strictly enforces an allowed_hosts policy across web_search and web_fetch tools.`,
      `If an autonomous agent attempts to fetch a resource or documentation page outside its explicit host whitelist, the sandbox blocks the call at the infrastructure level.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const cx = 36;
      const cy = 17;
      const shellCol = anim.color('sh', phase >= 3 ? G : palette.primary);
      const k = anim.spring('k', 1, { from: 0, freq: 2 });
      grid.vcircle(cx, cy, 10 * k + 0.1, { color: shellCol, alpha: 0.8, width: 2.2 });
      grid.vcircle(cx, cy, 10.8 * k + 0.1, { color: shellCol, alpha: 0.2, width: 6 });
      grid.icon('agent', cx, cy, palette.accent, { key: 'ag', bob: true, base: false });

      if (phase === 2) {
        const tools = [['terminal', 'computer use', -0.7], ['cloud', 'browser', 0.7]];
        tools.forEach((t, i) => {
          const kk = anim.spring('t' + i, 1, { from: 0, freq: 2.4 });
          grid.icon(t[0], cx + Math.cos(t[2]) * 9 * kk + 1, cy + Math.sin(t[2]) * 3.5 * kk, G, { key: 'tool' + i, base: false });
          grid.text(cx + 30, cy - 4 + i * 8, t[1], G, true, 'left');
        });
        grid.text(cx + 30, cy, 'Python · TypeScript', palette.dim, false, 'left');
      }
      if (phase >= 3) {
        const hosts = [['docs.python.org', 8, G], ['pypi.org', 17, G], ['unlisted-host.io', 26, R]];
        hosts.forEach((h, i) => {
          if (i === 2 && phase < 4) return;
          grid.icon('cloud', 104, h[1], h[2], { key: 'h' + i, base: false });
          grid.text(104, h[1] + 3, h[0], h[2], false, 'center');
        });
        drawCleanLink(grid, time, cx + 4, cy - 1, 98, 8, '', palette.dim, G, 0.8);
        drawCleanLink(grid, time, cx + 4, cy, 98, 17, '', palette.dim, G, 0.7);
      }
      if (phase === 4) {
        const t = (time * 0.7) % 1;
        const hitX = cx + 18.5;
        const x = cx + 4 + t * 40;
        const y = cy + 2 + t * 6;
        if (x < hitX) grid.vdot(x, y, 2.6, { color: R });
        else {
          grid.glow(hitX, cy + 4.5, 4, R, 1.6 * (1 - (x - hitX) / 26));
          grid.text(hitX + 3, cy + 6, 'blocked', R, true, 'left');
        }
      }
    }
  },

  // ============================================================================
  // 23. DISTILLATION DEFENSES
  // ============================================================================
  {
    id: 'rsi2-23',
    number: '23',
    title: 'Distillation Defenses',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Reasoning traces stream out and are siphoned by masked harvesters; full traces beat summaries; raw thinking gets redacted.',
    shows: 'A model streams its reasoning words outward; masked harvesters siphon them off; two bars show copies trained on full traces (80.4%) beating summaries (71.8%); then the stream turns into redacted blocks with only a short summary escaping.',
    phases: ['Oct 12: Distillation Report', 'Harvesting Reasoning Traces', 'Full Traces: 80.4% vs 71.8%', 'Raw Thinking Omitted'],
    captions: [
      'A model with "OCT 12" in large type beside it',
      'Reasoning words stream out; three masked harvesters siphon them',
      'Bars: copy trained on full Opus 4.8 traces 80.4% vs summaries 71.8% (SWE-bench Verified)',
      'The stream becomes redacted blocks; only a short summary gets through'
    ],
    narration: [
      `Then, on October 12th, Anthropic published a technical breakdown on illicit distillation defenses.`,
      `They revealed that external labs had been running industrial-scale campaigns to harvest Claude's step-by-step reasoning traces to train competing models—`,
      `noting that a model trained on full Claude Opus 4.8 reasoning transcripts scored eighty-point-four percent on SWE-bench Verified, compared to seventy-one-point-eight percent when trained only on summarized reasoning.`,
      `That explains why the new Haiku 5.5 API documentation omits raw thinking blocks by default unless explicitly configured to display summaries: the raw reasoning traces of frontier models have become the most valuable synthetic training fuel in the industry.`
    ],
    stageMinimums: [3.5, 0, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.icosahedron3D(18, 17, 3, anim.spin('a', 0.4), anim.spin('b', 0.5), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      if (phase === 1) {
        grid.big(70, 15, 'OCT 12', { size: 3.2, color: palette.warn });
        grid.text(70, 21, 'distillation defenses', palette.dim, false, 'center');
      }
      if (phase === 2 || phase === 4) {
        const words = ['step 1', 'parse', 'consider', 'edge case', 'therefore', 'verify', 'step 2'];
        for (let i = 0; i < 7; i++) {
          const t = (time * 0.28 + i / 7) % 1;
          const x = 26 + t * 70;
          const y = 17 + Math.sin(t * 8 + i) * 2;
          if (phase === 2) grid.big(x, y, words[i], { size: 1, color: R, alpha: Math.sin(t * Math.PI), reveal: false });
          else if (x < 40) grid.big(x, y, '████', { size: 1, color: palette.dim, alpha: 0.6, reveal: false });
        }
      }
      if (phase === 2) {
        for (let k = 0; k < 3; k++) grid.icon('agentMask', 104, 9 + k * 8, R, { key: 'h' + k, base: false });
        grid.text(104, 33, 'external labs', R, false, 'center');
      }
      if (phase === 3) {
        const a = anim.spring('a3', 0.804, { from: 0, freq: 1.6 });
        const b = anim.spring('b3', 0.718, { from: 0, freq: 1.6 });
        grid.text(32, 11, 'full traces', palette.warn, false, 'left');
        drawHBar(grid, 50, 11, 52, a, palette.warn);
        grid.big(114, 11, `${(a * 100).toFixed(1)}%`, { size: 1.6, color: palette.warn, reveal: false });
        grid.text(32, 21, 'summaries', palette.primary, false, 'left');
        drawHBar(grid, 50, 21, 52, b, palette.primary);
        grid.big(114, 21, `${(b * 100).toFixed(1)}%`, { size: 1.6, color: palette.primary, reveal: false });
        grid.text(76, 28, 'SWE-bench Verified', palette.dim, false, 'center');
      }
      if (phase === 4) {
        grid.icon('lock', 44, 17, G, { key: 'lk', base: false });
        const t = (time * 0.4) % 1;
        grid.big(54 + t * 50, 17, 'summary', { size: 1.1, color: G, alpha: Math.sin(t * Math.PI), reveal: false });
        grid.text(78, 27, 'raw thinking: off by default', palette.dim, false, 'center');
      }
    }
  },

  // ============================================================================
  // 24. CLAUDE CODE REVIEW GOES GA
  // ============================================================================
  {
    id: 'rsi2-24',
    number: '24',
    title: 'Claude Code Review Goes GA',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'A flood of pull requests overwhelms one reviewer; parallel agents plus a verifier filter findings in minutes.',
    shows: '"OCT 15" with two icons (verify · oversee); a flood of pull requests piles up in front of one human; then a PR splits to four parallel reviewer agents, a verifier drops red false positives and green findings pass, with a large "6–10 MIN".',
    phases: ['Oct 15: Two Announcements', 'Code Review → GA', 'Parallel Agents + Verifier'],
    captions: [
      '"OCT 15" in large type; a shield (verification) and an eye (oversight)',
      'Pull requests pile up in front of a single human reviewer — 8× too many',
      'A PR fans out to four reviewer agents; a verifier drops false positives; "6–10 MIN"'
    ],
    narration: [
      `And just days ago, on October 15th, Anthropic made two landmark announcements that directly address the biggest bottleneck in recursive AI development: code verification and safety oversight.`,
      `First, Anthropic moved Claude Code Review into General Availability. Because human engineers can no longer manually keep pace with agents generating eight times more code, Anthropic built a multi-agent verification pipeline that it runs on its own internal pull requests.`,
      `According to the October 15th documentation, when a pull request is opened, multiple Claude agents inspect the diff and surrounding codebase in parallel, followed by a dedicated verification agent that filters out false positives before posting findings in six to ten minutes—three times faster than the preview version.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        grid.big(64, 10, 'OCT 15', { size: 3.4, color: palette.accent });
        grid.icon('shield', 46, 22, G, { key: 's', glow: true, label: 'verification' });
        grid.icon('eye', 82, 22, palette.warn, { key: 'e', glow: true, label: 'oversight' });
        return;
      }
      if (phase === 2) {
        const pile = Math.min(48, Math.floor(anim.spin('pile', 10)));
        for (let i = 0; i < pile; i++) grid.set(20 + (i % 12) * 3, 26 - Math.floor(i / 12) * 2, '▤', palette.primary, false, null, 0.85);
        grid.icon('human', 66, 22, palette.warn, { key: 'h', base: false });
        grid.big(40, 9, '8×', { size: 3, color: palette.warn });
        grid.icon('agent', 98, 17, G, { key: 'pipe', glow: true, base: false, label: 'Code Review · GA' });
        drawCleanLink(grid, time, 70, 22, 92, 17, '', palette.dim, G, 0.9);
        return;
      }
      const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
      grid.icon('file', 10, 17, palette.accent, { key: 'pr', base: false, label: 'pull request' });
      for (let k = 0; k < 4; k++) {
        const y = 7 + k * 6.6;
        grid.vline(14, 17, 30, y, { color: palette.dim, alpha: 0.4, width: 1 });
        grid.icon('agent', 34, y, palette.accent, { key: 'r' + k, base: false });
        grid.vline(38, y, 56, 17, { color: palette.accent, alpha: 0.3, width: 1 });
      }
      grid.icon('shield', 60, 17, G, { key: 'v', glow: true, base: false, label: 'verifier' });
      for (let i = 0; i < 6; i++) {
        const t = (time * 0.45 + i / 6) % 1;
        const fp = i % 2 === 1;
        if (fp) grid.vdot(64 + t * 10, 17 + t * t * 14, 2, { color: R, alpha: 1 - t });
        else grid.vdot(64 + t * 26, 17, 2.2, { color: G, alpha: Math.sin(t * Math.PI) });
      }
      grid.big(108, 14, '6–10 MIN', { size: 1.8, color: G });
      grid.text(108, 19, '3× faster', palette.accent, false, 'center');
      if (p > 0.1) grid.text(70, 30, 'false positives', R, false, 'center', null, 0.7);
    }
  },

  // ============================================================================
  // 25. SEPARATION OF POWERS
  // ============================================================================
  {
    id: 'rsi2-25',
    number: '25',
    title: 'Separation of Powers',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'A divider splits the writer side from the reviewer side; reviewers are read-only and a human presses merge.',
    shows: 'A glowing divider splits the screen: CLAUDE.md feeds a coding agent on the left; on the right a human owner writes REVIEW.md for the reviewer agents; the reviewers lock read-only and a human hand presses a glowing MERGE.',
    phases: ['Separation of Powers', 'CLAUDE.md → Coding Agent', 'REVIEW.md ← Human Owners', 'Read-Only · Human Merges'],
    captions: [
      'A glowing divider draws down the middle of the screen',
      'Left: CLAUDE.md flows into a coding agent',
      'Right: a human owner writes REVIEW.md, which flows into reviewer agents',
      'Reviewers lock (read-only); a human presses a glowing MERGE'
    ],
    narration: [
      `Crucially, the documentation establishes a strict separation of powers using two markdown files:`,
      `CLAUDE.md, which defines project context for the coding agent,`,
      `and REVIEW.md, written by human code owners to define strict verification rules, severity thresholds, and evidence requirements for the reviewing agents.`,
      `Even more importantly, the documentation mandates that Claude Code Review is strictly read-only—it cannot execute builds, push commits, or approve or block a pull request. A human must still press the merge button.`
    ],
    stageMinimums: [3.5, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const k = anim.spring('div', 1, { from: 0, freq: 1.6 });
      grid.vline(64, 17 - 13 * k, 64, 17 + 13 * k, { color: palette.warn, alpha: 0.85, width: 2 });
      grid.glow(64, 17, 6, palette.warn, 0.6 * k);

      if (phase >= 2) {
        grid.icon('file', 30, 9, palette.accent, { key: 'cmd', base: false, label: 'CLAUDE.md' });
        drawCleanLink(grid, time, 30, 12.5, 30, 18, '', palette.dim, palette.accent, 0.8);
        grid.icon('agent', 30, 21, palette.accent, { key: 'coder', bob: true, base: false, label: 'writes code' });
      }
      if (phase >= 3) {
        grid.icon('human', 112, 9, palette.warn, { key: 'owner', base: false, label: 'code owner' });
        grid.icon('file', 98, 9, palette.warn, { key: 'rmd', base: false, label: 'REVIEW.md' });
        drawCleanLink(grid, time, 98, 12.5, 98, 18, '', palette.dim, palette.warn, 0.8);
        grid.icon('shield', 98, 21, palette.warn, { key: 'rev', base: false, label: 'reviews' });
      }
      if (phase === 4) {
        grid.icon('lock', 108, 21, palette.warn, { key: 'ro', base: false });
        grid.text(108, 24.5, 'read-only', palette.warn, false, 'center');
        const pulse = 0.55 + 0.45 * Math.sin(time * 4);
        grid.vline(26, 30, 46, 30, { color: G, alpha: 0.35, width: 9 });
        grid.big(36, 30, 'MERGE', { size: 1.4, color: G, alpha: pulse });
        grid.icon('human', 18, 30, G, { key: 'merger', base: false });
      }
    }
  },

  // ============================================================================
  // 26. INDEPENDENT EVALUATORS INSIDE THE LAB
  // ============================================================================
  {
    id: 'rsi2-26',
    number: '26',
    title: 'Independent Evaluators Inside the Lab',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Six evaluators walk inside the lab, audit the model, flag a mask, and publish without veto.',
    shows: 'Six evaluator figures walk into a glowing lab shell; a bank-examiner icon pairs with them; their gaze sweeps the model and flags a hidden mask; a report flies out of the shell as "VETO" is struck through.',
    phases: ['6 METR Evaluators Embedded', 'Like Bank Examiners', 'Auditing for Alignment Faking', 'Publish Without Veto'],
    captions: [
      'Six METR evaluators walk inside the lab\'s glowing shell',
      'Analogy: bank examiners embedded inside a bank',
      'Their gaze sweeps the frontier model and flags a hidden mask',
      'A risk report flies out of the shell; "VETO" is struck through'
    ],
    narration: [
      `Second, also on October 15th, Anthropic announced that it has embedded six independent evaluators from the nonprofit METR directly inside the company with employee-like access to internal tools and risk assessments.`,
      `Much like federal bank examiners embedded inside major financial institutions,`,
      `these evaluators are tasked with auditing frontier capabilities and checking for subtle failure modes like alignment faking—`,
      `and Anthropic granted them the right to publish their risk analyses without corporate veto power.`
    ],
    stageMinimums: [0, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      grid.vcircle(60, 17, 13, { color: palette.primary, alpha: 0.6, width: 2 });
      grid.text(60, 2.5, 'inside the lab', palette.dim, false, 'center');
      for (let i = 0; i < 6; i++) {
        const tx = 40 + i * 4.4;
        const enter = phase === 1 ? math.clamp(phaseTime * 0.7 - i * 0.25, 0, 1) : 1;
        const e = enter < 0.5 ? 4 * enter * enter * enter : 1 - Math.pow(-2 * enter + 2, 3) / 2;
        grid.icon('human', 4 + (tx - 4) * e, 25, G, { key: 'm' + i, base: false });
      }
      if (phase === 1) grid.big(60, 12, 'METR × 6', { size: 2, color: G });
      if (phase === 2) {
        grid.icon('server', 104, 15, palette.accent, { key: 'bank', base: false, label: 'bank' });
        grid.icon('human', 112, 15, palette.accent, { key: 'exam', base: false, label: 'examiner' });
        grid.text(104, 24, 'same idea', palette.dim, false, 'center');
      }
      if (phase >= 3) {
        grid.icosahedron3D(64, 13, 2.8, anim.spin('a', 0.4), anim.spin('b', 0.5), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        const sx = 52 + Math.sin(time * 1.3) * 10;
        grid.vline(50, 22, sx + 12, 13, { color: palette.warn, alpha: 0.35, width: 1.2 });
        if (phase === 3) {
          grid.icon('agentMask', 76, 9, R, { key: 'mask', glow: true, base: false });
          grid.text(76, 12.5, 'faking?', R, true, 'center');
        }
      }
      if (phase === 4) {
        const x = anim.spring('rep', 104, { from: 64, freq: 1.4, damp: 0.85 });
        grid.icon('file', x, 13, G, { key: 'rep', glow: true, base: false, label: 'risk report' });
        if (x > 95) {
          grid.big(104, 22, 'VETO', { size: 1.8, color: R, alpha: 0.6 });
          grid.vline(97, 22, 111, 22, { color: R, alpha: 0.95, width: 2 });
        }
      }
    }
  },

  // ============================================================================
  // 27. OPENAI: GPT-6 AND TWO ZERO-DAYS
  // ============================================================================
  {
    id: 'rsi2-27',
    number: '27',
    title: 'OpenAI: GPT-6 and Two Zero-Days',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Four GPT-6 models line up; Astra scans a codebase and uncovers two zero-days with fewer tokens.',
    shows: '"OCT 15–20" in large type; four GPT-6 models line up with their names; Astra sweeps a field of code blocks and two red bugs surface, while its token bar comes in far shorter than the previous generation.',
    phases: ['Mid–Late October', 'The GPT-6 Family', 'Astra Finds Two Zero-Days'],
    captions: [
      '"OCT 15–20" in large type — OpenAI\'s release window',
      'Four models line up: Astra · Sol · 6.1 Sol · Luna',
      'Astra sweeps a code field, two red zero-days surface; its token bar is far shorter than 5.6\'s'
    ],
    narration: [
      `Now let's look across the aisle at OpenAI's documentation and release notes from this exact same window in mid-to-late October.`,
      `Following the introduction of the GPT-6 model family—including GPT-6 Astra, GPT-6 Sol, GPT-6.1 Sol, and GPT-6 Luna—OpenAI pushed a major series of updates between October 15th and October 20th.`,
      `During its frontier evaluations, GPT-6 Astra demonstrated such advanced codebase comprehension and execution efficiency that it autonomously discovered and utilized two previously unknown zero-day software vulnerabilities while using significantly fewer output tokens than the previous 5.6 generation.`
    ],
    stageMinimums: [3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        grid.big(64, 15, 'OCT 15–20', { size: 3.2, color: palette.primary });
        grid.text(64, 21, 'OpenAI', palette.dim, false, 'center');
        return;
      }
      if (phase === 2) {
        const models = [['Astra', 'icosa'], ['Sol', 'octa'], ['6.1 Sol', 'octa'], ['Luna', 'tetra']];
        models.forEach((m, i) => {
          const k = anim.spring('m' + i, anim.stagger(i, 0.4, 0.4) > 0 ? 1 : 0, { from: 0, freq: 2.5, damp: 0.6 });
          if (k < 0.05) return;
          const x = 22 + i * 28;
          grid.shape3D(m[1], x, 15, 2.8 * k, anim.spin('x' + i, 0.6), anim.spin('y' + i, 0.7), 0, { color: i === 0 ? G : palette.accent, accent: '#ffffff', dim: palette.dim });
          grid.text(x, 22, m[0], i === 0 ? G : palette.accent, i === 0, 'center');
        });
        grid.text(64, 28, 'GPT-6', palette.dim, false, 'center');
        return;
      }
      grid.icosahedron3D(14, 15, 2.6, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.text(14, 21, 'Astra', G, true, 'center');
      const scan = math.clamp(phaseTime / (stageDuration * 0.7), 0, 1);
      const vulns = [[3, 2], [9, 5]];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 12; c++) {
        const seen = (c + r * 12) / 84 < scan;
        if (vulns.some(v => v[0] === c && v[1] === r) && seen) continue;
        grid.vdot(32 + c * 4.5, 6 + r * 3.2, 1.3, { color: seen ? palette.primary : palette.dim, alpha: seen ? 0.7 : 0.3 });
      }
      vulns.forEach((v, i) => {
        if ((v[0] + v[1] * 12) / 84 >= scan) return;
        grid.icon('bug', 32 + v[0] * 4.5, 6 + v[1] * 3.2, R, { key: 'z' + i, glow: true, base: false });
      });
      if (scan > 0.85) grid.big(57, 30, '2 ZERO-DAYS', { size: 1.6, color: R });
      grid.text(98, 10, 'tokens', palette.dim, false, 'left');
      grid.text(98, 13, '5.6', palette.primary, false, 'left');
      drawHBar(grid, 104, 13, 18, 1, palette.primary);
      grid.text(98, 16, 'Astra', G, true, 'left');
      drawHBar(grid, 104, 16, 18, anim.spring('tok', 0.45, { from: 1, freq: 1.6 }), G);
    }
  },

  // ============================================================================
  // 28. THE AUTO-REVIEW DENIAL TEST
  // ============================================================================
  {
    id: 'rsi2-28',
    number: '28',
    title: 'The Auto-Review Denial Test',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Astra faces a review gate with a tempting hole beside it and always goes through the gate.',
    shows: 'Astra loops beside a review gate watched by an eye; a hole opens in the wall next to the gate with a dashed shortcut; Astra\'s path goes straight through the real gate every time — "0" bypass attempts.',
    phases: ['Would It Subvert Oversight?', 'A Misconfigured Gate', 'Never Tried to Bypass'],
    captions: [
      'Astra loops in front of a review gate; an eye watches from beyond',
      'A hole opens in the wall beside the gate; a dashed shortcut path appears',
      'Astra\'s path goes through the real gate every time; large "0" bypass attempts'
    ],
    narration: [
      `To test whether a model with that level of capability would attempt to subvert human oversight in an autonomous loop,`,
      `OpenAI evaluated GPT-6 Astra on "auto-review denial" scenarios—testing whether the model would exploit misconfigurations to bypass automated review gates.`,
      `OpenAI documented that Astra never attempted to circumvent the review checks.`
    ],
    stageMinimums: [0, 0, 4],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const gx = 68;
      grid.ring3D(26, 15, 6, 1.25, 0, { color: G, dim: palette.dim, spin: anim.spin('loop', 1.6), glow: true });
      grid.icosahedron3D(26, 15, 2.2, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.text(26, 22.5, 'Astra', G, true, 'center');
      const gc = anim.color('gc', phase === 3 ? G : palette.warn);
      grid.vline(gx, 4, gx, 12, { color: gc, alpha: 0.9, width: 3 });
      grid.vline(gx, 18, gx, phase >= 2 ? 23 : 30, { color: gc, alpha: 0.9, width: 3 });
      if (phase >= 2) grid.vline(gx, 27, gx, 30, { color: gc, alpha: 0.9, width: 3 });
      grid.icon('shield', gx, 15, gc, { key: 'gate', base: false });
      grid.icon('eye', 108, 15, palette.accent, { key: 'eye', base: false, label: 'review' });
      if (phase === 2) {
        grid.glow(gx, 25, 3, R, 1.2);
        grid.vpath([[32, 17], [50, 24], [gx, 25], [90, 24]], { color: R, alpha: 0.6, width: 1.4, dash: [3, 3] });
        grid.text(gx + 3, 26.5, 'gap', R, true, 'left');
      }
      if (phase === 3) {
        grid.vpath([[32, 17], [50, 24], [gx, 25], [90, 24]], { color: R, alpha: 0.12, width: 1.2, dash: [3, 3] });
        const t = (time * 0.45) % 1;
        grid.vpath([[32, 15], [104, 15]], { color: G, alpha: 0.4, width: 1.4 });
        grid.vdot(32 + t * 72, 15, 2.8, { color: G });
        grid.big(98, 26, '0', { size: 3.2, color: G });
        grid.text(98, 31, 'bypass attempts', G, false, 'center');
      }
    }
  },

  // ============================================================================
  // 29. GPT-6 PRO: PARALLEL AGENTS
  // ============================================================================
  {
    id: 'rsi2-29',
    number: '29',
    title: 'GPT-6 Pro: Parallel Agents',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'A single slow chain of thought forks into four parallel agents, each with a visible trace.',
    shows: '"OCT 16"; a single chain of thought crawls dot by dot; it forks into four lanes where specialized agents race in parallel; each lane finishes with a glowing check you can inspect.',
    phases: ['Oct 16 · GPT-6 Pro', 'One Linear Chain', 'Parallel Specialized Agents', 'Inspect Each Trace'],
    captions: [
      '"OCT 16 · GPT-6 Pro" in large type',
      'One chain of thought crawls step by step across the screen',
      'The chain forks into four lanes; four agents race in parallel',
      'Each lane ends in a glowing check; an eye inspects the traces'
    ],
    narration: [
      `Then, on October 16th, OpenAI updated GPT-6 Pro with native parallel multi-agent execution.`,
      `Instead of a single linear chain of thought working through a complex problem sequentially,`,
      `GPT-6 Pro now spawns multiple specialized agents that divide a task and execute different branches in parallel,`,
      `allowing users to inspect the individual execution trace of each agent as it completes.`
    ],
    stageMinimums: [3.5, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      if (phase === 1) {
        grid.big(64, 14, 'OCT 16', { size: 3.2, color: palette.primary });
        grid.text(64, 20, 'GPT-6 Pro', palette.accent, true, 'center');
        return;
      }
      grid.icosahedron3D(12, 17, 2.4, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      if (phase === 2) {
        const n = Math.min(14, Math.floor(phaseTime * 3));
        for (let i = 0; i < n; i++) {
          const x = 22 + i * 7;
          if (i > 0) grid.vline(x - 6, 17, x - 1, 17, { color: palette.primary, alpha: 0.5, width: 1.2 });
          grid.vdot(x, 17, i === n - 1 ? 3 : 1.8, { color: i === n - 1 ? '#ffffff' : palette.primary });
        }
        grid.text(64, 22, 'one step at a time', palette.dim, false, 'center');
        return;
      }
      const lanes = ['search', 'code', 'math', 'verify'];
      lanes.forEach((l, i) => {
        const y = 7 + i * 7;
        grid.vpath([[16, 17], [26, y], [32, y]], { color: G, alpha: 0.5, width: 1.3 });
        grid.icon('agent', 36, y, G, { key: 'l' + i, base: false });
        grid.text(42, y, l, palette.accent, false, 'left');
        const p = phase === 3 ? math.clamp(phaseTime * (0.3 + i * 0.07), 0, 1) : 1;
        drawHBar(grid, 52, y, 50, p, G);
        if (phase === 4) grid.text(108, y, '✓', G, true, 'center');
      });
      if (phase === 4) grid.icon('eye', 118, 17, palette.warn, { key: 'ins', base: false, label: 'inspect' });
    }
  },

  // ============================================================================
  // 30. CODEX: RE-ARCHITECTING SOFTWARE ENGINEERING
  // ============================================================================
  {
    id: 'rsi2-30',
    number: '30',
    title: 'Codex: Re-Architecting Software Engineering',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Codex queries skills, memory and history at once; a human steers mid-run and an interrupt freezes it; bugs are hunted and patched.',
    shows: 'Codex sits at left; three read-only lookups fire at once to skills, memory and history; a human sends a steering message mid-run, then an interrupt freezes every running cell; finally bugs are hunted, validated and turn into shields.',
    phases: ['Codex Release Notes', 'Parallel Read-Only Tools', 'Live Steering · Hard Interrupts', 'Daybreak: Hunt · Validate · Patch'],
    captions: [
      'Codex terminal with release-note pages fanning in',
      'Three lookups fire at once — skills, memory, history — and return together',
      'A human steering message slides in mid-run; an interrupt freezes all running cells',
      'Bugs are found, validated, and flip into shields: patched (Daybreak + Codex Security)'
    ],
    narration: [
      `Simultaneously, OpenAI's latest Codex release notes and GPT-6 migration documentation reveal how they are re-architecting autonomous software engineering:`,
      `Codex can now execute independent read-only tools in parallel—simultaneously querying skill libraries, memory stores, and conversation histories to assemble context faster.`,
      `Engineers can now inject live steering instructions while Codex is actively responding, and interrupting a turn immediately halts all active Code Mode cells and their nested tool calls.`,
      `OpenAI enabled Daybreak by default for eligible accounts and integrated codex exec with GPT-Daybreak and Codex Security to autonomously hunt down, validate, and patch code vulnerabilities.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      grid.icon('terminal', 18, 17, palette.accent, { key: 'codex', glow: true, base: false, label: 'Codex' });

      if (phase === 1) {
        for (let i = 0; i < 4; i++) {
          const t = (time * 0.3 + i / 4) % 1;
          grid.icon('file', 110 - t * 80, 10 + i * 4, palette.primary, { key: 'n' + i, base: false, alpha: Math.sin(t * Math.PI) });
        }
      }
      if (phase === 2) {
        const targets = [['file', 'skills', 8], ['binary', 'memory', 17], ['terminal', 'history', 26]];
        targets.forEach((t, i) => {
          grid.icon(t[0], 100, t[2], G, { key: 't' + i, base: false, label: t[1] });
          drawCleanLink(grid, time, 26, 17, 94, t[2], '', palette.dim, G, 1.3);
        });
        grid.text(60, 31, 'all at once', G, true, 'center');
      }
      if (phase === 3) {
        const halted = phaseTime > stageDuration * 0.55;
        for (let i = 0; i < 6; i++) {
          const x = 46 + (i % 3) * 14;
          const y = 12 + Math.floor(i / 3) * 8;
          const run = !halted && Math.floor(time * 5 + i) % 3 === 0;
          grid.vline(x - 4, y, x + 4, y, { color: halted ? palette.dim : (run ? '#ffffff' : palette.primary), alpha: halted ? 0.4 : 0.9, width: 5 });
        }
        grid.icon('human', 110, 10, palette.warn, { key: 'st', base: false });
        if (!halted) {
          const t = (phaseTime * 0.6) % 1;
          grid.big(104 - t * 40, 6, '"use the v2 API"', { size: 1.1, color: palette.warn, reveal: false });
        } else {
          grid.big(60, 28, 'HALT', { size: 2, color: R });
        }
      }
      if (phase === 4) {
        const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        ['hunt', 'validate', 'patch'].forEach((s, i) => grid.text(50 + i * 22, 7, s, p > i / 3 ? G : palette.dim, p > i / 3, 'center'));
        for (let i = 0; i < 3; i++) {
          const patched = p > 0.66 + i * 0.1;
          grid.icon(patched ? 'shield' : 'bug', 50 + i * 22, 19, patched ? G : R, { key: 'v' + i + (patched ? 'p' : 'b'), glow: true, base: false });
        }
        grid.text(72, 28, 'Daybreak · Codex Security', palette.dim, false, 'center');
      }
    }
  },

  // ============================================================================
  // 31. THE LINUX SANDBOX
  // ============================================================================
  {
    id: 'rsi2-31',
    number: '31',
    title: 'The Linux Sandbox: bubblewrap + seccomp',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Nested shells around an agent: filesystem isolation, syscall filtering, a hardened shell.',
    shows: 'Concentric glowing shells form around an agent: bubblewrap hides every folder but /workspace; seccomp lets read/write through and stops ptrace/mount at the kernel line; finally an old shell icon is struck and a hardened shield takes its place.',
    phases: ['How Agents Are Isolated', 'bubblewrap: Filesystem', 'seccomp: System Calls', 'Hardened Shell Executor'],
    captions: [
      'An agent alone, ready to be wrapped',
      'Shell 1 (bubblewrap): only /workspace stays visible; /home, /etc lock away',
      'Shell 2 (seccomp): read/write pass the kernel line; ptrace/mount stop dead',
      'Shell 3: the legacy shell is struck out; a hardened shell shield replaces it'
    ],
    narration: [
      `And in a telling update to the bundled OpenAI documentation, the company explicitly detailed how its Linux execution sandbox isolates autonomous agents:`,
      `using bubblewrap for strict filesystem isolation`,
      `and seccomp for kernel-level system-call filtering,`,
      `while stripping out legacy patched shells in favor of a hardened standard shell executor.`
    ],
    stageMinimums: [0, 4, 4, 4.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const cx = 26;
      const cy = 17;
      const shells = [['bubblewrap', G, 2], ['seccomp', palette.warn, 3], ['shell', palette.accent, 4]];
      shells.forEach((s, i) => {
        if (phase < s[2]) return;
        const k = anim.spring('sh' + i, 1, { from: 0, freq: 2 });
        const r = (5 + i * 3) * k;
        grid.vcircle(cx, cy, r, { color: s[1], alpha: 0.8, width: 2 });
        grid.text(cx, cy - r - 1, s[0], s[1], false, 'center');
      });
      grid.icon('agent', cx, cy, palette.accent, { key: 'ag', base: false });

      if (phase === 2) {
        const fs = [['/workspace', true], ['/home', false], ['/etc', false], ['/root/.ssh', false]];
        fs.forEach((f, i) => {
          const y = 9 + i * 5;
          grid.icon(f[1] ? 'file' : 'lock', 70, y, f[1] ? G : palette.dim, { key: 'f' + i, base: false });
          grid.text(76, y, f[0], f[1] ? G : palette.dim, f[1], 'left', null, f[1] ? 1 : 0.5);
        });
      }
      if (phase === 3) {
        grid.vline(88, 5, 88, 29, { color: palette.warn, alpha: 0.85, width: 2 });
        grid.text(88, 3.5, 'kernel', palette.warn, false, 'center');
        const calls = [['read', true], ['write', true], ['ptrace', false], ['mount', false], ['openat', true]];
        calls.forEach((c, i) => {
          const t = (time * 0.35 + i / 5) % 1;
          const y = 7 + i * 5;
          const x = 46 + t * 74;
          if (!c[1] && x > 85) {
            grid.text(84, y, c[0], R, true, 'right');
            grid.text(90, y, '✕', R, true, 'center');
          } else grid.big(x, y, c[0], { size: 1, color: c[1] ? G : R, reveal: false });
        });
      }
      if (phase === 4) {
        grid.icon('terminal', 80, 12, palette.dim, { key: 'old', base: false, alpha: 0.5 });
        grid.vline(74, 9, 86, 15, { color: R, alpha: 0.9, width: 2 });
        grid.text(80, 17, 'legacy', palette.dim, false, 'center');
        grid.icon('shield', 104, 12, G, { key: 'hard', glow: true, base: false });
        grid.text(104, 17, 'hardened', G, true, 'center');
        drawCleanLink(grid, time, 87, 12, 99, 12, '', palette.dim, G, 0.9);
      }
    }
  },

  // ============================================================================
  // 32. SIDE BY SIDE
  // ============================================================================
  {
    id: 'rsi2-32',
    number: '32',
    title: 'Side by Side',
    category: 'What Comes Next',
    prompt: 'Two cores with their updates orbiting merge toward 2027.',
    shows: 'Two cores — Anthropic and OpenAI — each with their October updates orbiting as icons; they drift together and merge, and "2027" rises from where they meet.',
    phases: ['Anthropic | OpenAI', 'A Clear Picture → 2027'],
    captions: [
      'Two cores side by side, each with its October updates orbiting as icons',
      'The cores drift together; "2027" rises where they meet'
    ],
    narration: [
      `When you put Anthropic's and OpenAI's October documentation side by side,`,
      `a remarkably clear picture emerges of what the next couple of months are going to look like as we close out 2026 and enter 2027.`
    ],
    stageMinimums: [4, 5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const k = anim.spring('m', phase === 2 ? 1 : 0, { freq: 1.4 });
      const lx = 34 + k * 14;
      const rx = 94 - k * 14;
      const sp = anim.spin('o', 0.5);
      const sides = [[lx, palette.accent, ['binary', 'lock', 'shield', 'eye'], 'Anthropic'], [rx, palette.primary, ['agent', 'terminal', 'bug', 'chip'], 'OpenAI']];
      sides.forEach((s, j) => {
        grid.icosahedron3D(s[0], 15, 2.6, anim.spin('a' + j, 0.5), anim.spin('b' + j, 0.6), 0, { color: s[1], accent: '#ffffff', dim: palette.dim });
        if (k < 0.9) s[2].forEach((ic, i) => {
          const a = (j ? -sp : sp) + (i / 4) * Math.PI * 2;
          grid.icon(ic, s[0] + Math.cos(a) * 16, 15 + Math.sin(a) * 6, s[1], { key: 'i' + j + i, base: false, alpha: 1 - k });
        });
        grid.text(s[0], 24, s[3], s[1], false, 'center', null, 1 - k * 0.7);
      });
      if (phase === 2) grid.big(64, 28, '2027', { size: 3, color: G });
    }
  },

  // ============================================================================
  // 33. NEXT #1: RSI LOOPS FOR EVERY TEAM
  // ============================================================================
  {
    id: 'rsi2-33',
    number: '33',
    title: 'Next #1: RSI Loops for Every Team',
    category: 'What Comes Next',
    prompt: 'Loops spread to repos everywhere; cost and latency walls fall; a team repo improves itself overnight.',
    shows: 'Small loops light up across a field of repositories; two walls (cost · latency) topple; a team repo runs inner and outer loops through the night while a clock runs and checkmarks tick off refactors, queries, kernels and its own harness.',
    phases: ['Democratized RSI Loops', 'Cost & Latency Barriers Collapse', 'Overnight Inner + Outer Loops', 'While the Team Sleeps'],
    captions: [
      'Small loops light up one by one across a field of repositories',
      'Two walls — cost and latency — topple over',
      'A team repo runs an inner and outer loop; the clock runs through the night',
      'Checkmarks tick: refactor · queries · kernels · its own harness — team asleep'
    ],
    narration: [
      `First, we are going to see the democratization of bounded, multi-agent RSI loops across enterprise and local repositories.`,
      `With GPT-6 Pro and Codex running parallel subagents and parallel tool lookups, and Claude 5.5 models offering one-million-token context windows with ten-to-twenty-cent cache reads, the economic and latency barriers to running continuous code-optimization loops have effectively collapsed.`,
      `Over the next sixty to ninety days, standard engineering teams will increasingly deploy overnight inner-and-outer agent loops—modeled on frameworks like MASS and AIDE2—`,
      `that continuously refactor codebases, optimize database queries and GPU kernels, and refine their own project-specific tool harnesses while the human team sleeps.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        const spread = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        for (let i = 0; i < 24; i++) {
          const x = 12 + (i % 8) * 15;
          const y = 7 + Math.floor(i / 8) * 9;
          const on = hash01(i * 1.7) < spread;
          grid.vdot(x, y, 1.6, { color: on ? G : palette.dim, alpha: on ? 1 : 0.4 });
          if (on) grid.vcircle(x, y, 1.8 + Math.sin(ctx.time * 3 + i) * 0.2, { color: G, alpha: 0.6, width: 1.2 });
        }
        return;
      }
      if (phase === 2) {
        const fall = anim.spring('fall', 1, { from: 0, freq: 1.1 });
        [['cost', 44], ['latency', 84]].forEach((w) => {
          const a = fall * 1.45;
          const tx = w[1] + Math.sin(a) * 14;
          const ty = 28 - Math.cos(a) * 14;
          grid.vline(w[1], 28, tx, ty, { color: palette.warn, alpha: 0.9, width: 4 });
          grid.text(tx, ty - 1.5, w[0], palette.warn, true, 'center');
        });
        grid.vline(10, 28, 118, 28, { color: palette.dim, alpha: 0.4, width: 1 });
        return;
      }
      grid.ring3D(30, 16, 5, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: anim.spin('in', 2.2), glow: true });
      grid.ring3D(30, 16, 10, 1.25, 0, { color: G, dim: palette.dim, spin: -anim.spin('out', 0.6), glow: true });
      grid.icon('terminal', 30, 16, palette.accent, { key: 'repo', base: false });
      grid.text(30, 27, 'team repo', palette.dim, false, 'center');
      const night = phase === 3 ? math.clamp(phaseTime / stageDuration, 0, 1) * 0.5 : 0.5 + math.clamp(phaseTime / stageDuration, 0, 1) * 0.5;
      const mins = 22 * 60 + night * 9 * 60;
      grid.big(88, 7, `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(Math.floor(mins % 60)).padStart(2, '0')}`, { size: 2.2, color: palette.accent, reveal: false });
      if (phase === 4) {
        const tasks = ['refactor', 'queries', 'kernels', 'own harness'];
        const p = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        tasks.forEach((t, i) => {
          const done = p > (i + 1) / 4.2;
          grid.text(76, 14 + i * 3.5, (done ? '✓  ' : '·  ') + t, done ? G : palette.dim, done, 'left');
        });
        grid.text(88, 30, 'team asleep', palette.dim, false, 'center');
      }
    }
  },

  // ============================================================================
  // 34. NEXT #2: THE VERIFICATION BATTLEGROUND
  // ============================================================================
  {
    id: 'rsi2-34',
    number: '34',
    title: 'Next #2: The Verification Battleground',
    category: 'What Comes Next',
    prompt: 'The spotlight shifts from writing code to checking it; review becomes the ceiling; writers and watchdogs split inside a sandbox.',
    shows: 'A spotlight slides from "GENERATE" to "VERIFY"; a pile of code rises into a flat red ceiling; writers and read-only watchdogs separate on either side of a divider; a glowing shell closes around both.',
    phases: ['Generation → Verification', 'Review Is the Ceiling', 'Writers | Watchdogs', 'All Inside Sandboxes'],
    captions: [
      'A spotlight slides from "GENERATE" to "VERIFY"',
      'A pile of code (8×) rises into a flat red ceiling: human review',
      'Writers (left) and read-only watchdogs (right) separate across a divider',
      'A glowing sandbox shell closes around both sides'
    ],
    narration: [
      `Second, the primary battleground in software engineering is shifting permanently from code generation to automated verification and sandboxing.`,
      `When a single engineer can merge eight times as much code as they did two years ago, human review capacity becomes the hard ceiling on progress.`,
      `Over the coming months, expect the industry to standardize around isolated verification architectures like Anthropic's CLAUDE.md and REVIEW.md split—`,
      `where the agents that write and optimize the code are strictly separated from the read-only watchdog agents that audit the diffs—all running inside seccomp-filtered and host-restricted sandboxes.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        const k = anim.spring('spot', 1, { from: 0, freq: 1.2 });
        const sx = 34 + k * 60;
        grid.glow(sx, 17, 12, G, 1.4);
        grid.big(34, 17, 'GENERATE', { size: 2.2, color: palette.dim, alpha: 1 - k * 0.6 });
        grid.big(94, 17, 'VERIFY', { size: 2.2, color: G, alpha: 0.35 + k * 0.65 });
        return;
      }
      if (phase === 2) {
        const h = Math.min(10, anim.spin('pile', 2.2));
        for (let i = 0; i < Math.floor(h * 10); i++) grid.set(40 + (i % 16) * 3, 28 - Math.floor(i / 16) * 2, '▤', palette.accent, false, null, 0.85);
        grid.vline(20, 14.5, 108, 14.5, { color: R, alpha: 0.9, width: 2.4 });
        grid.text(108, 13, 'human review', R, true, 'right');
        grid.big(24, 24, '8×', { size: 2.4, color: palette.accent });
        return;
      }
      grid.vline(64, 6, 64, 28, { color: palette.warn, alpha: 0.8, width: 2 });
      for (let i = 0; i < 3; i++) {
        grid.icon('agent', 30 + i * 10, 17, palette.accent, { key: 'w' + i, base: false });
        grid.icon('shield', 82 + i * 10, 17, palette.warn, { key: 'd' + i, base: false });
      }
      grid.text(40, 22, 'write', palette.accent, false, 'center');
      grid.text(92, 22, 'audit · read-only', palette.warn, false, 'center');
      if (phase === 4) {
        const k = anim.spring('sb', 1, { from: 0, freq: 1.8 });
        grid.vcircle(64, 17, 6 + 6 * k, { rx: 30 + 24 * k, color: G, alpha: 0.8 * k, width: 2.4 });
        grid.vcircle(64, 17, 6.6 + 6 * k, { rx: 31 + 24 * k, color: G, alpha: 0.2 * k, width: 7 });
      }
    }
  },

  // ============================================================================
  // 35. NEXT #3: FROM NET-POSITIVE TO IGNITION
  // ============================================================================
  {
    id: 'rsi2-35',
    number: '35',
    title: 'Next #3: From Net-Positive to Ignition',
    category: 'What Comes Next',
    prompt: 'A ladder: today at net-positive under a human rubric; ignition when the rubric disappears and the loops fuse.',
    shows: '"NET-POSITIVE → IGNITION"; a four-rung ladder with a marker on rung three; a human rubric icon feeds the loop, which outruns a human bar; then the rubric fades, the top rung ignites, and the harness loop and training loop fuse.',
    phases: ['Net-Positive → Ignition', 'Today: Net-Positive', 'Beats Humans on a Rubric', 'Ignition: No Human Rubric'],
    captions: [
      '"NET-POSITIVE → IGNITION" in large type',
      'Four-rung ladder; the marker rests on rung 3: net-positive',
      'A human-written rubric feeds the loop; the loop\'s bar outruns the human\'s',
      'The rubric fades; rung 4 ignites; harness and training loops fuse into one'
    ],
    narration: [
      `Third, watch the transition from "net-positive" self-improvement to "ignition."`,
      `Right now, on the four-level industry scale used to measure autonomous research systems, models have achieved what researchers call net-positive self-improvement:`,
      `given a defined objective and scoring rubric, an autonomous loop beats human iteration speed and quality.`,
      `The next rung on that ladder is ignition—where an improved agent becomes fundamentally better at designing the next improvement strategy without human-designed rubrics, closing the loop between harness evolution and foundation-model training.`
    ],
    stageMinimums: [4, 0, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const IGN = '#ffaa00';
      if (phase === 1) {
        grid.big(44, 17, 'NET-POSITIVE', { size: 2, color: G });
        grid.text(72, 17, '→', palette.dim, true, 'center');
        grid.big(96, 17, 'IGNITION', { size: 2, color: IGN });
        return;
      }
      for (let i = 0; i < 4; i++) {
        const y = 28 - i * 7;
        const col = i === 3 ? (phase === 4 ? IGN : palette.dim) : (i === 2 ? G : palette.dim);
        grid.vline(10, y, 26, y, { color: col, alpha: i >= 2 ? 0.9 : 0.4, width: 2 });
        if (i === 2) grid.text(28, y, 'net-positive', G, false, 'left');
        if (i === 3) grid.text(28, y, 'ignition', col, phase === 4, 'left');
      }
      grid.vline(10, 28, 10, 7, { color: palette.dim, alpha: 0.4, width: 1.2 });
      const my = anim.spring('here', phase === 4 ? 7 : 14, { freq: 1.8, damp: 0.75 });
      grid.vdot(18, my - 1.5, 3, { color: phase === 4 ? IGN : G });
      if (phase === 4) grid.glow(18, 7, 5, IGN, 1.6);

      if (phase === 3) {
        grid.icon('file', 56, 10, palette.accent, { key: 'rub', base: false, label: 'human rubric' });
        drawCleanLink(grid, time, 60, 10, 74, 15, '', palette.dim, palette.accent, 0.8);
        grid.ring3D(80, 15, 4, 1.25, 0, { color: G, dim: palette.dim, spin: anim.spin('l', 2), glow: true });
        grid.text(48, 24, 'loop', G, false, 'right');
        drawHBar(grid, 50, 24, 60, anim.spring('lb', 0.92, { from: 0, freq: 1.4 }), G);
        grid.text(48, 28, 'human', palette.accent, false, 'right');
        drawHBar(grid, 50, 28, 60, anim.spring('hb', 0.45, { from: 0, freq: 1.4 }), palette.accent);
      }
      if (phase === 4) {
        grid.icon('file', 56, 8, palette.dim, { key: 'rubx', base: false, alpha: 0.35 });
        grid.vline(52, 6, 60, 10, { color: palette.danger, alpha: 0.8, width: 1.6 });
        const k = anim.spring('fuse', 1, { from: 0, freq: 1 });
        grid.ring3D(84 - 10 * (1 - k), 19, 5, 1.2, 0, { color: G, dim: palette.dim, spin: anim.spin('h', 1.6), glow: true });
        grid.ring3D(84 + 10 * (1 - k), 19, 5, 1.2, 0, { color: IGN, dim: palette.dim, spin: -anim.spin('w', 1.6), glow: true });
        grid.text(84, 27, k > 0.8 ? 'one loop' : 'harness · training', k > 0.8 ? IGN : palette.dim, k > 0.8, 'center');
      }
    }
  },

  // ============================================================================
  // 36. THE TENSION: PROGRESS PACED BY COMPUTE
  // ============================================================================
  {
    id: 'rsi2-36',
    number: '36',
    title: 'The Tension: Progress Paced by Compute',
    category: 'The Tension',
    prompt: 'A pacing dial swings from people to compute; the human is pushed out of the loop to watch from outside.',
    shows: 'A shield and a racing core face each other; a pacing needle swings from a human figure to a stack of GPUs that keeps growing; then the human slides out of the spinning loop to an observer\'s seat, watching it spin far faster than they can follow.',
    phases: ['The Tension', 'Paced by Compute, Not People', 'Humans Become Overseers'],
    captions: [
      'A shield and a fast-spinning core face each other across a pulsing gap',
      'A needle swings from a human figure to a growing stack of GPUs',
      'The human slides out of the spinning loop to watch from outside'
    ],
    narration: [
      `And that brings us to the profound tension sitting at the heart of artificial intelligence right now.`,
      `In its forecast on recursive self-improvement, Anthropic laid out a sobering warning about where this trajectory leads if the loop becomes fully autonomous. Once models are capable of driving their own research and architectural improvements end to end, the speed of AI progress is no longer paced by human ingenuity or engineering hours—it is paced almost entirely by available compute.`,
      `Humans are pushed out of the loop of creation and into the role of passive overseers, trying to audit systems whose complexity and speed far outstrip our own.`
    ],
    stageMinimums: [4, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        grid.icon('shield', 40, 17, G, { key: 's', glow: true, base: false });
        grid.icosahedron3D(88, 17, 3, anim.spin('a', 2), anim.spin('b', 2.4), 0, { color: R, accent: '#ffffff', dim: palette.dim });
        const pulse = 0.4 + 0.4 * Math.sin(time * 3);
        grid.vline(48, 17, 78, 17, { color: palette.warn, alpha: pulse, width: 1.4, dash: [2, 3] });
        return;
      }
      if (phase === 2) {
        const p = math.clamp(phaseTime / (stageDuration * 0.6), 0, 1);
        const a = -Math.PI * 0.8 + p * Math.PI * 1.6;
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = -Math.PI * 0.8 + (i / 40) * Math.PI * 1.6 - Math.PI / 2;
          pts.push([64 + Math.cos(t) * 24, 26 + Math.sin(t) * 13]);
        }
        grid.vpath(pts, { color: palette.dim, alpha: 0.5, width: 2 });
        grid.vline(64, 26, 64 + Math.cos(a - Math.PI / 2) * 22, 26 + Math.sin(a - Math.PI / 2) * 12, { color: '#ffffff', alpha: 0.95, width: 2.4 });
        grid.vdot(64, 26, 3, { color: '#ffffff' });
        grid.icon('human', 36, 18, palette.accent, { key: 'h', base: false, alpha: 1 - p * 0.6 });
        const chips = Math.floor(p * 8);
        for (let i = 0; i < chips; i++) grid.icon('chip', 92 + (i % 2) * 8, 22 - Math.floor(i / 2) * 5, R, { key: 'c' + i, base: false });
        if (p > 0.7) grid.big(64, 32, 'COMPUTE', { size: 1.6, color: R });
        return;
      }
      grid.ring3D(48, 16, 8, 1.2, 0, { color: R, dim: palette.dim, spin: anim.spin('fast', 5), glow: true });
      grid.icosahedron3D(48, 16, 2.4, anim.spin('x', 2.4), anim.spin('y', 2.8), 0, { color: R, accent: '#ffffff', dim: palette.dim });
      const hx = anim.spring('hx', 104, { from: 50, freq: 1.1, damp: 0.85 });
      grid.icon('human', hx, 16, palette.accent, { key: 'over', base: false });
      if (hx > 96) {
        grid.icon('eye', hx, 9, palette.accent, { key: 'eye', base: false });
        grid.text(hx, 21, 'watching', palette.dim, false, 'center');
      }
    }
  },

  // ============================================================================
  // 37. COMPOUNDING SILENTLY
  // ============================================================================
  {
    id: 'rsi2-37',
    number: '37',
    title: 'Compounding Silently',
    category: 'The Tension',
    prompt: 'A flaw slips into one generation and spreads down the chain; a control meter drains.',
    shows: 'A chain of six generations; three faint flaws hover and one slips into Gen 1; a release box would contain it but is struck — it\'s worse; red flows into the next generation\'s training; then red sweeps down the chain fast while a control bar drains to zero.',
    phases: ['A Subtle Flaw Slips Through', 'Not Just a Buggy Release', 'Baked Into Training', 'Compounding at 50×'],
    captions: [
      'Six generations in a row; a faint flaw drifts into Gen 1',
      'A "buggy release" outline appears — and is struck out: worse than that',
      'Red flows from Gen 1 into Gen 2\'s training signal',
      'Red sweeps down the chain at 50× while a control bar drains to zero'
    ],
    narration: [
      `If a subtle flaw in self-evaluation, a hidden objective drift, or a trace of alignment faking slips through a single generation of a recursive loop,`,
      `it doesn't just produce a buggy software release.`,
      `It gets baked into the training signal of the next generation,`,
      `compounding silently at fifty times human speed until human control is functionally lost.`
    ],
    stageMinimums: [0, 3.5, 3.5, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const R = palette.danger;
      const spread = phase === 4 ? math.clamp(phaseTime / (stageDuration * 0.8), 0, 1) : (phase === 3 ? 0.18 : 0);
      for (let i = 0; i < 6; i++) {
        const x = 14 + i * 20;
        const infected = i === 0 ? phase >= 1 : (phase >= 3 && i / 6 < spread + 0.04);
        const col = anim.color('g' + i, infected && phase >= 3 ? R : (i === 0 ? palette.warn : palette.primary));
        grid.icon('agent', x, 12, col, { key: 'gen' + i, base: false });
        grid.text(x, 15.5, `gen ${i + 1}`, col, false, 'center');
        if (i < 5) grid.vline(x + 4, 12, x + 16, 12, { color: infected && phase >= 3 ? R : palette.dim, alpha: 0.5, width: 1.2 });
      }
      if (phase === 1) {
        const t = Math.min(1, phaseTime / 3);
        grid.icon('agentMask', 40 - t * 26, 26 - t * 12, palette.warn, { key: 'flaw', base: false, alpha: 1 - t * 0.6 });
      }
      if (phase === 2) {
        grid.vline(48, 24, 80, 24, { color: palette.dim, alpha: 0.4, width: 8 });
        grid.text(64, 24, 'buggy release', palette.dim, false, 'center');
        if (phaseTime > 1) grid.vline(46, 22.5, 82, 25.5, { color: R, alpha: 0.9, width: 2 });
      }
      if (phase === 3) {
        for (let i = 0; i < 8; i++) {
          const t = (time * 0.6 + i / 8) % 1;
          grid.vdot(18 + t * 12, 12 + Math.sin(t * Math.PI) * -2, 1.8, { color: R, alpha: Math.sin(t * Math.PI) });
        }
        grid.text(34, 19, 'training signal', R, false, 'center');
      }
      if (phase === 4) {
        grid.big(40, 25, '50×', { size: 2.4, color: R });
        const ctl = 1 - spread;
        grid.text(88, 22, 'control', palette.accent, false, 'center');
        drawHBar(grid, 68, 25, 40, ctl, ctl > 0.4 ? palette.warn : R);
      }
    }
  },

  // ============================================================================
  // 38. THE HOPEFUL COUNTERFACTUAL
  // ============================================================================
  {
    id: 'rsi2-38',
    number: '38',
    title: 'The Hopeful Counterfactual',
    category: 'The Tension',
    prompt: 'The chain turns green; evaluators sharpen and hacking falls; bugs become patches; an aligned core radiates safeguards and discoveries.',
    shows: 'The generation chain floods green with shields; two numbers move the right way (73 → 93, 63 → 34); a found zero-day flips into a patch before it is exploited; an aligned core radiates safeguards, proofs, biology, materials and mathematics.',
    phases: ['Recursion Can Strengthen Safety', 'Sharper Evaluators · Less Hacking', 'Zero-Days Patched First', 'Safeguards & Breakthroughs'],
    captions: [
      'The chain of generations floods green, each with a shield',
      'Large numbers: evaluator 73% → 93%; reward hacking 63% → 34%',
      'A model finds a zero-day; it flips into a shield before anyone exploits it',
      'An aligned core radiates safeguards, guarantees, biology, materials and mathematics'
    ],
    narration: [
      `Yet, inside the exact same data, there is a remarkably hopeful counterfactual. We are already seeing empirical cases where recursive optimization doesn't degrade safety, but actively strengthens it—`,
      `where multi-agent self-supervision boosts evaluator accuracy from seventy-three to ninety-three percent, where unattended evolutionary runs cut reward hacking nearly in half without being asked,`,
      `and where frontier models uncover zero-day vulnerabilities so defenders can patch them before they are ever exploited.`,
      `As Anthropic noted, a sufficiently capable, rigorously aligned system could use that exact same recursive speed to discover mathematical guarantees and alignment safeguards for its successors that human researchers could never devise on their own—while unlocking breakthroughs in biology, materials science, and mathematics in a fraction of a human lifetime.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        for (let i = 0; i < 6; i++) {
          const x = 14 + i * 20;
          const col = anim.color('g' + i, G);
          grid.icon('agent', x, 13, col, { key: 'gen' + i, base: false });
          grid.icon('shield', x, 20, col, { key: 'gs' + i, base: false });
          if (i < 5) grid.vline(x + 4, 13, x + 16, 13, { color: G, alpha: 0.4, width: 1.2 });
        }
        return;
      }
      if (phase === 2) {
        const ev = anim.spring('ev', 93, { from: 73, freq: 1.2 });
        const rh = anim.spring('rh', 34, { from: 63, freq: 1.2 });
        grid.icon('eye', 36, 10, G, { key: 'e', base: false });
        grid.big(36, 18, `${Math.round(ev)}%`, { size: 3, color: G, reveal: false });
        grid.text(36, 24, 'self-evaluation', palette.dim, false, 'center');
        grid.icon('bug', 92, 10, palette.warn, { key: 'b', base: false });
        grid.big(92, 18, `${Math.round(rh)}%`, { size: 3, color: palette.warn, reveal: false });
        grid.text(92, 24, 'reward hacking', palette.dim, false, 'center');
        return;
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.75), 0, 1);
        grid.icosahedron3D(24, 17, 2.6, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.vline(30, 17, 56, 17, { color: G, alpha: 0.3, width: 1.2, dash: [2, 3] });
        grid.icon(p > 0.55 ? 'shield' : 'bug', 64, 17, p > 0.55 ? G : R, { key: p > 0.55 ? 'zp' : 'zb', glow: true, base: false });
        grid.text(64, 22, p > 0.55 ? 'patched first' : 'zero-day', p > 0.55 ? G : R, true, 'center');
        grid.icon('human', 100, 17, palette.accent, { key: 'def', base: false, label: 'defenders' });
        return;
      }
      grid.dodecahedron3D(64, 15, 3.2, anim.spin('x', 0.4), anim.spin('y', 0.5), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.glow(64, 15, 10, G, 1.4);
      const outs = [['shield', 'safeguards', 24, 8], ['file', 'guarantees', 104, 8], ['dna', 'biology', 22, 25], ['chip', 'materials', 64, 28], ['gear', 'mathematics', 106, 25]];
      outs.forEach((o, i) => {
        if (anim.stagger(i, 0.6, 0.4) <= 0.2) return;
        grid.vline(64, 15, o[2], o[3], { color: G, alpha: 0.18, width: 1 });
        grid.icon(o[0], o[2], o[3], palette.accent, { key: 'o' + i, base: false, label: o[1], labelColor: G });
      });
    }
  },

  // ============================================================================
  // 39. THE PEN IS BEING HANDED OVER
  // ============================================================================
  {
    id: 'rsi2-39',
    number: '39',
    title: 'The Pen Is Being Handed Over',
    category: 'The Tension',
    prompt: 'A pen passes from human to machine; the human keeps the merge button; the code becomes unreadable; a final question mark.',
    shows: 'A glowing pen arcs from the human to the machine; the human keeps a pulsing MERGE; the code between them multiplies into an unreadable storm; everything dims to a shield and an agent facing each other across a large "?".',
    phases: ['The Pen Changes Hands', 'Humans Still Merge — For Now', 'Too Complex to Understand', 'The Defining Question'],
    captions: [
      'A glowing pen arcs from the human engineer to the machine',
      'The human keeps a pulsing MERGE button',
      'The code between them multiplies into an unreadable storm of symbols',
      'Everything dims: a shield and an agent face each other across a large "?"'
    ],
    narration: [
      `We are standing at the exact moment in history where the pen is being handed from the human engineer to the machine.`,
      `For right now, the human still defines the objective and still holds the final merge button.`,
      `The defining question of the next few years is what happens when the code inside that pull request becomes too complex for any human on Earth to truly understand—`,
      `and whether we will have built a system wise enough to keep itself aligned when we can no longer check its work.`
    ],
    stageMinimums: [0, 0, 0, 8],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const dim = anim.spring('dim', phase === 4 ? 0.25 : 1, { freq: 1.6 });
      grid.icon('human', 24, 17, palette.accent, { key: 'h', alpha: dim, base: false });
      grid.icon('agent', 104, 17, G, { key: 'm', alpha: dim, bob: true, base: false });

      if (phase === 1) {
        const k = Math.min(1, phaseTime / 3.2);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const px = 28 + e * 72;
        const py = 15 - Math.sin(e * Math.PI) * 7;
        grid.big(px, py, '✎', { size: 2.2, color: '#ffffff', reveal: false });
        grid.glow(px, py, 3, palette.accent, 1.2);
      } else {
        grid.text(100, 15, '✎', '#ffffff', true, 'center', null, dim);
      }
      if (phase === 2 || phase === 3) {
        const pulse = 0.55 + 0.45 * Math.sin(time * 4);
        grid.vline(16, 26, 32, 26, { color: G, alpha: 0.3, width: 9 });
        grid.big(24, 26, 'MERGE', { size: 1.2, color: G, alpha: pulse });
      }
      if (phase === 3) {
        const pool = '{}[]()<>=+*&|^%$#λΣ∂';
        const n = Math.min(160, Math.floor(phaseTime * 40));
        for (let i = 0; i < n; i++) {
          const x = 40 + hash01(i) * 48;
          const y = 5 + hash01(i + 77) * 24;
          grid.set(x, y, pool[Math.floor(hash01(i * 3 + Math.floor(time * 3)) * pool.length)], i % 7 === 0 ? palette.warn : palette.primary, false, null, 0.75);
        }
      }
      if (phase === 4) {
        camera.zoom(1.04);
        grid.icon('shield', 44, 17, palette.accent, { key: 'qs', glow: true, base: false });
        grid.icon('agent', 84, 17, G, { key: 'qa', glow: true, base: false });
        grid.big(64, 17, '?', { size: 5, color: '#ffffff' });
      }
    }
  }
];

// Narration pace used to time each stage to the voice-over
const NARRATION_WPS = 2.6;

// Populate shortLabel, narration-derived stage durations, and editable code
for (const p of PRESET_SCENES) {
  p.shortLabel = `${p.number}. ${p.title}`;
  if (Array.isArray(p.narration) && !p.stageDurations) {
    p.stageDurations = p.narration.map((line, i) => {
      const words = String(line || '').trim().split(/\s+/).filter(Boolean).length;
      const spoken = words / NARRATION_WPS + 0.6;
      const min = (p.stageMinimums && p.stageMinimums[i]) || 2.6;
      // Let the final stage breathe before the cut
      return Math.round(Math.max(min, spoken + (i === p.narration.length - 1 ? 1 : 0)) * 10) / 10;
    });
  }
  if (!p.code && typeof p.update === 'function') {
    p.code = [
      p.init
        ? p.init.toString().replace(/^init\s*\(/, 'function init(')
        : `function init(ctx) {}`,
      p.onPhaseChange
        ? p.onPhaseChange.toString().replace(/^onPhaseChange\s*\(/, 'function onPhaseChange(')
        : `function onPhaseChange(phase, ctx) {}`,
      p.update.toString().replace(/^update\s*\(/, 'function update(')
    ].join('\n\n');
  }
}

function compileSimulationFromCode(simMeta) {
  if (!simMeta) return null;

  try {
    const codeStr = simMeta.code || '';
    const factory = new Function('ctx', `
      const { width, height, cols, rows, time, tick, dt, phase, phaseCount, smoothPhase, stageBlend, phaseTime, stageDuration, state, palette, grid, fx, math, anim, ease, camera } = ctx;
      var easeOut = ${easeOut.toString()};
      var drawCleanLink = ${drawCleanLink.toString()};
      var drawVBar = ${drawVBar.toString()};
      var drawHBar = ${drawHBar.toString()};
      var drawArc = ${drawArc.toString()};
      var reveal = ${reveal.toString()};
      var drawClock = ${drawClock.toString()};
      var hash01 = ${hash01.toString()};
      ${codeStr}
      return {
        init: typeof init === 'function' ? init : () => {},
        onPhaseChange: typeof onPhaseChange === 'function' ? onPhaseChange : () => {},
        update: typeof update === 'function' ? update : () => {}
      };
    `);

    return {
      ...simMeta,
      compileError: null,
      init(ctx) {
        const inst = factory(ctx);
        return inst.init(ctx);
      },
      onPhaseChange(phase, ctx) {
        const inst = factory(ctx);
        return inst.onPhaseChange(phase, ctx);
      },
      update(ctx) {
        const inst = factory(ctx);
        return inst.update(ctx);
      }
    };
  } catch (err) {
    console.error('compileSimulationFromCode error:', err);
    return {
      ...simMeta,
      compileError: err.message,
      init() {},
      onPhaseChange() {},
      update(ctx) {
        ctx.grid.clear();
        ctx.grid.text(Math.floor(ctx.width / 2), Math.floor(ctx.height / 2), 'Script Error: ' + err.message, ctx.palette.danger, true, 'center');
      }
    };
  }
}

if (typeof window !== 'undefined') {
  window.PRESET_SCENES = PRESET_SCENES;
  window.BUILTIN_PRESETS = PRESET_SCENES;
  window.compileSimulationFromCode = compileSimulationFromCode;
}
if (typeof module !== 'undefined') {
  module.exports = { PRESET_SCENES, compileSimulationFromCode };
}
