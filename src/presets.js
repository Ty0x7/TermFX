/**
 * TermFX — "Recursive Self-Improvement Is Already Running in Production"
 * (video script v2)
 *
 * 39 scenes that follow the narration in order. Every scene carries:
 *   narration[] – the exact script lines spoken during each stage
 *   phases[]    – short stage names (top bar)
 *   shows       – one-line description of the visual (for the shot list)
 * Stage durations are derived from the narration word count (~2.6 words/s),
 * so a rendered scene lines up with the voice-over. The "Stage sec" control
 * scales them (4.6 = narration pace). `node scripts/build-shotlist.cjs`
 * regenerates docs/RSI-VIDEO-SHOTLIST.md from this file.
 *
 * Design rule (unchanged): clean 3D geometry, generous empty space, nothing
 * snaps — springs, colour glides, morphs and type-on text carry each beat.
 * Concept icons and code cards show *what* each thing is.
 */

function easeOut(t) {
  const c = Math.max(0, Math.min(1, t));
  return 1 - Math.pow(1 - c, 3);
}

// Clean, minimal animated link between two points with a single moving pulse & short label
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
    const tx = x0 + (x1 - x0) * t;
    const ty = y0 + (y1 - y0) * t - 2;
    grid.text(tx, ty, label, accentCol, true, 'center');
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

// Terminal-style horizontal bar with a fractional end cell; returns the end x
function drawHBar(grid, x, y, maxLen, ratio, color, alpha = 0.85) {
  const len = Math.max(0, Math.min(1, ratio)) * maxLen;
  const full = Math.floor(len);
  for (let i = 0; i < full; i++) grid.set(x + i, y, '█', color, false, null, alpha);
  const frac = len - full;
  if (frac > 0.1) grid.set(x + full, y, '▏▎▍▌▋▊▉'[Math.min(6, Math.floor(frac * 7))], color, true, null, alpha);
  if (len > 0.2) grid.vline(x + len - 0.5, y - 0.5, x + len - 0.5, y + 0.5, { color: '#ffffff', alpha: 0.8, width: 1.4 });
  return x + len;
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
  // 01. THE INTELLIGENCE EXPLOSION (I. J. GOOD)
  // ============================================================================
  {
    id: 'rsi2-01',
    number: '01',
    title: 'The Intelligence Explosion',
    category: 'Intro',
    prompt: 'A theoretical threshold, I. J. Good\'s 1965 idea, and a chain of AI generations each designing a better successor.',
    shows: 'A dashed "theoretical threshold" sits over a dim core; I. J. Good\'s 1965 quote types in; the core improves itself, then a chain of generations G1 → G2 → G3 grows, each designing the next faster.',
    phases: ['A Theoretical Threshold', 'I. J. Good, 1965', 'AI Improves Its Own Code', 'Each Gen Designs the Next'],
    narration: [
      `For decades, the concept of Recursive Self-Improvement—or RSI—was treated as a theoretical threshold in computer science.`,
      `First formalized in the 1960s by mathematician I. J. Good in his thesis on the intelligence explosion,`,
      `the premise was straightforward: once an artificial intelligence becomes capable enough to improve its own underlying code and architecture,`,
      `each generation makes the system better at designing the next.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) fx.shockwave(40, 17, { color: palette.accent, radius: 9 });
      if (phase === 4) fx.shockwave(104, 17, { color: '#00ff88', radius: 12 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const y = 17;

      grid.title('01 // THE INTELLIGENCE EXPLOSION');

      // The threshold line the field always talked about
      grid.vline(4, 9, 124, 9, { color: palette.warn, alpha: phase === 1 ? 0.8 : 0.3, width: 1.2, dash: [4, 4] });
      grid.text(124, 8, 'THEORETICAL THRESHOLD', palette.warn, phase === 1, 'right');

      if (phase === 2) {
        grid.codeCard(64, y, {
          key: 'good', title: 'I. J. GOOD · 1965', width: 46, color: palette.accent,
          lines: ['"an ultraintelligent machine', ' could design even better machines;', { text: ' there would then unquestionably', mark: 'hl' }, { text: ' be an intelligence explosion"', mark: 'hl' }]
        });
      }

      // Generation chain
      const gens = [{ x: 40, s: 2.4, shape: 'tetra' }, { x: 72, s: 3.1, shape: 'octa' }, { x: 104, s: 3.9, shape: 'icosa' }];
      const showGen = phase === 1 ? 1 : (phase === 2 ? 0 : (phase === 3 ? 1 : 3));
      for (let i = 0; i < showGen; i++) {
        const g = gens[i];
        const s = anim.spring('gs' + i, g.s, { from: 0.3, freq: 3.5, damp: 0.55 });
        const col = phase === 1 ? palette.dim : (i === 2 ? G : (i === 1 ? palette.accent : palette.primary));
        const rate = 0.4 + i * 0.5;
        grid.shape3D(g.shape, g.x, y, s, anim.spin('gx' + i, rate * 0.8), anim.spin('gy' + i, rate), 0, { color: col, accent: '#ffffff', dim: palette.dim });
        if (phase >= 3) grid.text(g.x, y + 7, `GEN-${i + 1}`, col, i === 2, 'center');
        if (i > 0) drawCleanLink(grid, time, gens[i - 1].x + 7, y, g.x - 7, y, 'DESIGNS', palette.dim, col, 0.6 + i * 0.4);
      }
      if (phase === 3) {
        grid.ring3D(40, y, 6.5, 1.2, 0, { color: palette.accent, dim: palette.dim, spin: anim.spin('self', 1.2), glow: true });
        grid.codeCard(92, y, { key: 'own', title: 'self/architecture.py', width: 34, color: palette.accent, lines: ['layers = 48', { text: 'layers = 64  # self-edit', mark: 'add' }, { text: 'optimizer = "own-v2"', mark: 'add' }] });
      }
      if (phase === 4) {
        grid.text(72, 27, 'EACH GENERATION IS BETTER AT DESIGNING THE NEXT', G, true, 'center');
      }

      const captions = [
        'STAGE 1: For decades, RSI was a theoretical threshold in computer science',
        'STAGE 2: Formalized in the 1960s by I. J. Good: the intelligence explosion',
        'STAGE 3: An AI capable enough to improve its own code and architecture…',
        'STAGE 4: …makes every generation better at designing the next'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 02. ALREADY RUNNING
  // ============================================================================
  {
    id: 'rsi2-02',
    number: '02',
    title: 'It Is Already Running',
    category: 'Intro',
    prompt: 'A timeline where the expected RSI date snaps from decades away to now, backed by recent lab documentation.',
    shows: 'A 1960–2060 timeline: I. J. Good at 1965, "RSI expected" decades out; documentation from Anthropic, OpenAI and academic labs drops in; the marker snaps back to NOW and a production loop starts running.',
    phases: ['Decades Away', 'The Recent Evidence', 'No Longer Waiting', 'Running in Production'],
    narration: [
      `For most of the history of machine learning, researchers assumed that crossing this threshold was decades away.`,
      `Looking at the technical documentation, benchmark data, and platform updates released over the past few weeks by Anthropic, OpenAI, and leading academic labs,`,
      `it is clear that we are no longer waiting for that feedback loop to begin.`,
      `In a bounded, engineering-driven form, it is already running in production.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      const nowX = 10 + (66 / 100) * 108;
      if (phase === 3) {
        fx.flash(palette.accent, 0.25);
        fx.shockwave(nowX, 22, { color: palette.accent, radius: 12 });
      }
      if (phase === 4) fx.shockwave(nowX + 26, 11, { color: '#00ff88', radius: 9 });
    },
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, ease } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const x0 = 10;
      const x1 = 118;
      const yA = 22;
      const xOf = (yr) => x0 + ((yr - 1960) / 100) * (x1 - x0);

      grid.title('02 // IT IS ALREADY RUNNING');

      const axisIn = ease.outExpo(time / 1.2);
      grid.line(x0, yA, Math.round(x0 + (x1 - x0) * axisIn), yA, '─', palette.dim, false);
      grid.vline(x0, yA, x0 + (x1 - x0) * axisIn, yA, { color: palette.primary, alpha: 0.4, width: 1.2 });
      for (let yr = 1960; yr <= 2060; yr += 20) {
        if (xOf(yr) > x0 + (x1 - x0) * axisIn) continue;
        grid.set(xOf(yr), yA, '┴', palette.dim);
        grid.text(xOf(yr), yA + 1, String(yr), palette.dim, false, 'center');
      }
      grid.set(xOf(1965), yA, '◆', palette.accent, true);
      grid.text(xOf(1965), yA - 2, 'I. J. GOOD · 1965', palette.accent, false, 'center');

      const nowX = xOf(2026);
      grid.vline(nowX, yA - 10, nowX, yA, { color: palette.accent, alpha: 0.6, width: 1.2 });
      grid.text(nowX, yA + 3, 'NOW · 2026', palette.accent, true, 'center');

      const expYr = anim.spring('exp', phase >= 3 ? 2026 : 2052, { freq: 3, damp: 0.55 });
      const mx = xOf(expYr);
      const mCol = anim.color('mCol', phase >= 3 ? G : palette.warn);
      grid.vcircle(mx, yA, 1.2, { color: mCol, alpha: 0.9, width: 1.5 });
      grid.set(mx, yA, '◈', mCol, true);
      grid.text(mx, yA - 2, phase >= 3 ? 'LOOP STARTED' : 'RSI EXPECTED', mCol, true, 'center');
      if (expYr - 2026 > 2) {
        grid.vline(nowX + 1, yA - 4, mx - 1, yA - 4, { color: palette.warn, alpha: 0.6, width: 1.2, dash: [3, 4] });
        grid.text((nowX + mx) / 2, yA - 5, '"DECADES AWAY"', palette.warn, false, 'center');
      }

      // The evidence: recent documentation drops in
      if (phase === 2) {
        const docs = [['ANTHROPIC', 'docs · benchmarks'], ['OPENAI', 'release notes'], ['ACADEMIC LABS', 'papers · Oct']];
        const shown = Math.min(3, 1 + Math.floor((phaseTime / stageDuration) * 3.5));
        for (let i = 0; i < shown; i++) {
          const dx = 30 + i * 34;
          grid.icon('file', dx, 9, palette.accent, { key: 'doc' + i, glow: true, label: docs[i][0] });
          grid.text(dx, 12.5, docs[i][1], palette.dim, false, 'center');
        }
        grid.text(64, 5, 'PAST FEW WEEKS', palette.dim, false, 'center');
      }
      if (phase === 3) grid.text(64, 8, 'NO LONGER WAITING FOR THE LOOP TO BEGIN', palette.accent, true, 'center');
      if (phase === 4) {
        const sp = anim.spin('loop', 2.4);
        grid.ring3D(nowX + 26, 11, 5, 1.2, 0, { color: G, dim: palette.dim, spin: sp, glow: true });
        grid.icon('server', nowX + 26, 11, G, { key: 'prod', base: false });
        grid.text(nowX + 26, 17, 'RUNNING IN PRODUCTION', G, true, 'center');
        grid.text(nowX - 14, 11, 'BOUNDED ·', palette.accent, false, 'right');
        grid.text(nowX - 14, 12, 'ENGINEERING-DRIVEN', palette.accent, false, 'right');
      }

      const captions = [
        'STAGE 1: Researchers assumed crossing the threshold was decades away',
        'STAGE 2: The last few weeks of docs, benchmarks and updates tell a different story',
        'STAGE 3: We are no longer waiting for the feedback loop to begin',
        'STAGE 4: In a bounded, engineering-driven form, it is already running in production'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'From helping with code snippets to writing most production code, optimizing training, running subagents and generating training data for successors.',
    shows: 'A human with a tiny snippet card is the old normal; then four capability tiles light up: writes most production code, optimizes its own training scripts, coordinates parallel subagents, generates verified trajectories that train its successor.',
    phases: ['Beyond Snippets', 'Writes Code · Optimizes Training', 'Parallel Subagents', 'Trains Its Successors'],
    narration: [
      `Over the last several months, we have crossed a critical inflection point where frontier models are no longer just assisting human engineers with isolated snippets of code.`,
      `They are writing the vast majority of the production code inside the labs building them, optimizing their own training scripts at superhuman speeds,`,
      `coordinating parallel subagents,`,
      `and generating the verified synthetic trajectories used to train their own successors.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase >= 2) fx.shockwave(64, 17, { color: palette.accent, radius: 6 + phase * 2 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('03 // THE INFLECTION POINT');

      if (phase === 1) {
        grid.icon('human', 46, 15, palette.accent, { key: 'eng', label: 'ENGINEER' });
        grid.icon('agent', 82, 15, palette.primary, { key: 'helper', label: 'MODEL' });
        grid.codeCard(64, 23, { key: 'snip', title: 'snippet', width: 24, color: palette.dim, lines: [{ text: 'x = sorted(x)', mark: 'dim' }] });
        drawCleanLink(grid, time, 78, 15, 50, 15, '', palette.dim, palette.dim, 0.5);
        grid.text(64, 8, '"JUST ASSISTING WITH SNIPPETS" — NOT ANYMORE', palette.warn, true, 'center');
      } else {
        const tiles = [
          { icon: 'terminal', a: 'WRITES MOST OF THE', b: 'PRODUCTION CODE', stage: 2 },
          { icon: 'gear', a: 'OPTIMIZES ITS OWN', b: 'TRAINING SCRIPTS', stage: 2 },
          { icon: 'agent', a: 'COORDINATES', b: 'PARALLEL SUBAGENTS', stage: 3 },
          { icon: 'dna', a: 'GENERATES DATA THAT', b: 'TRAINS ITS SUCCESSOR', stage: 4 }
        ];
        tiles.forEach((t, i) => {
          const tx = i % 2 ? 94 : 34;
          const ty = i < 2 ? 11 : 23;
          const on = phase >= t.stage;
          const col = anim.color('t' + i, on ? (phase === t.stage ? G : palette.primary) : palette.dim);
          grid.box(tx - 22, ty - 4, 44, 9, { style: 'round', color: col, glow: on && phase === t.stage });
          grid.icon(t.icon, tx - 14, ty, col, { key: 'ti' + i, base: false, alpha: on ? 1 : 0.4 });
          grid.text(tx - 7, ty - 1, t.a, on ? palette.accent : palette.dim, false, 'left');
          grid.text(tx - 7, ty + 1, t.b, on ? col : palette.dim, on, 'left');
          if (i === 2 && on) {
            for (let k = 0; k < 3; k++) grid.set(tx + 10 + k * 3, ty + 2.5, '◉', G, true);
          }
        });
      }

      const captions = [
        'STAGE 1: Frontier models are no longer just helping engineers with snippets',
        'STAGE 2: They write most production code and optimize their own training scripts',
        'STAGE 3: They coordinate parallel subagents',
        'STAGE 4: And generate the verified data used to train their own successors'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 04. ROADMAP
  // ============================================================================
  {
    id: 'rsi2-04',
    number: '04',
    title: 'What We Will Cover',
    category: 'Intro',
    prompt: 'Four chapter cards for the video, highlighting one at a time.',
    shows: 'Four chapter cards (The Hard Data · Live RSI Loop Demo · Anthropic & OpenAI Docs · The Next Few Months) lift and light up one by one along a progress line.',
    phases: ['The Hard Data', 'Live Loop Demo', 'Two Weeks of Docs', 'The Next Few Months'],
    narration: [
      `In this video, we are going to examine the hard data behind what is happening inside the frontier labs right now,`,
      `walk through a demonstration of how a modern recursive self-improvement loop actually operates in practice,`,
      `break down the specific documentation and architecture updates released by Anthropic and OpenAI over the past two weeks,`,
      `and look ahead at where this trajectory takes us over the next few months.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { height, fx, palette } = ctx;
      fx.shockwave(20 + (phase - 1) * 29, Math.floor(height / 2), { color: palette.accent, radius: 8 });
    },
    update(ctx) {
      const { height, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const cy = Math.floor(height / 2);
      const G = '#00ff88';

      grid.title('04 // WHAT WE WILL COVER');
      const cards = [
        { icon: 'chip', title: 'PART 1', l1: 'THE HARD', l2: 'DATA' },
        { icon: 'agent', title: 'PART 2', l1: 'LIVE RSI', l2: 'LOOP DEMO' },
        { icon: 'file', title: 'PART 3', l1: 'ANTHROPIC &', l2: 'OPENAI DOCS' },
        { icon: 'terminal', title: 'PART 4', l1: 'THE NEXT', l2: 'FEW MONTHS' }
      ];
      grid.vline(20, cy + 9, 107, cy + 9, { color: palette.dim, alpha: 0.5, width: 1 });
      grid.vline(20, cy + 9, 20 + (phase - 1) * 29 * anim.spring('prog', 1, { from: 0, freq: 3 }), cy + 9, { color: palette.primary, alpha: 0.9, width: 1.8 });
      for (let i = 0; i < 4; i++) {
        const x = 20 + i * 29;
        const active = i === phase - 1;
        const done = i < phase - 1;
        const col = anim.color('cardC' + i, active ? palette.accent : (done ? palette.primary : palette.dim));
        const lift = anim.spring('lift' + i, active ? -1.5 : 0, { freq: 6, damp: 0.55 });
        grid.box(x - 12, cy - 7 + lift, 24, 14, { style: 'round', color: col, title: cards[i].title, glow: active });
        grid.icon(cards[i].icon, x, cy - 2 + lift, col, { key: 'ci' + i, glow: active, alpha: active || done ? 1 : 0.5 });
        grid.text(x, cy + 3 + lift, cards[i].l1, col, active, 'center');
        grid.text(x, cy + 4 + lift, cards[i].l2, col, active, 'center');
        grid.set(x, cy + 9, active ? '◆' : (done ? '◈' : '·'), active ? '#ffffff' : col, active);
        if (done) grid.text(x + 9, cy - 6 + lift, '✓', G, true, 'center');
      }

      const captions = [
        'STAGE 1: The hard data from inside the frontier labs',
        'STAGE 2: A walkthrough of a modern recursive self-improvement loop',
        'STAGE 3: Two weeks of Anthropic and OpenAI documentation updates',
        'STAGE 4: Where the trajectory takes us over the next few months'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 05. WHEN AI BUILDS ITSELF: 80%
  // ============================================================================
  {
    id: 'rsi2-05',
    number: '05',
    title: 'When AI Builds Itself: 80% of the Code',
    category: 'The Hard Data',
    prompt: 'Anthropic\'s report: Claude went from low single digits to over 80% of merged production code.',
    shows: 'The "When AI Builds Itself" report opens; a bar for the share of code written by Claude before Claude Code (Feb 2025, low single digits) then a second bar shoots to 80%+.',
    phases: ['"When AI Builds Itself"', 'Before Feb 2025: ~3%', 'Today: 80%+'],
    narration: [
      `Let's start with the empirical data. In Anthropic's landmark report, "When AI Builds Itself," the company opened up its internal engineering metrics.`,
      `Prior to the research preview of Claude Code in February 2025, the percentage of Anthropic's internal codebase authored by Claude was in the low single digits.`,
      `Today, more than eighty percent of all code merged into Anthropic's production codebase is written by Claude itself.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) {
        fx.shockwave(72, 10, { color: '#00ff88', radius: 10 });
        fx.punch(0.35);
      }
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const yB = 27;
      const maxH = 18;

      grid.title('05 // WHEN AI BUILDS ITSELF');

      grid.icon('file', 108, 13, palette.accent, { key: 'report', glow: phase === 1, label: 'ANTHROPIC REPORT' });
      grid.text(108, 17, '"When AI Builds Itself"', palette.accent, phase === 1, 'center');
      if (phase === 1) {
        grid.codeCard(56, 16, { key: 'metrics', title: 'internal engineering metrics', width: 40, color: palette.primary, lines: ['code authored by Claude', 'lines merged / engineer / day', 'hardest-task success rate', 'research-loop speedup'] });
      } else {
        for (let p = 25; p <= 100; p += 25) {
          const yy = yB - (maxH * p) / 100 + 0.5;
          grid.vline(26, yy, 88, yy, { color: palette.dim, alpha: 0.25, width: 1, dash: [2, 5] });
          grid.text(24, yy - 0.5, `${p}%`, palette.dim, false, 'right');
        }
        grid.vline(26, yB + 0.5, 88, yB + 0.5, { color: palette.primary, alpha: 0.5, width: 1.2 });
        grid.text(20, 6, 'SHARE OF MERGED CODE WRITTEN BY CLAUDE', palette.dim, false, 'left');

        const oldR = anim.spring('old', 0.03, { from: 0, freq: 3 });
        drawVBar(grid, 36, yB, maxH, oldR, palette.primary, 8);
        grid.text(40, yB - maxH * oldR - 1.5, 'LOW SINGLE DIGITS', palette.accent, false, 'center');
        grid.text(40, yB + 1, 'BEFORE FEB 2025', palette.dim, false, 'center');
        grid.text(40, yB + 2, '(pre Claude Code)', palette.dim, false, 'center');

        const nowR = anim.spring('now', phase === 3 ? 0.8 : 0, { freq: 2.2 });
        drawVBar(grid, 68, yB, maxH, nowR, G, 8);
        if (phase === 3) {
          grid.counter('nowC', 72, yB - maxH * nowR - 1.5, 80, { suffix: '%+', color: G, from: 3, duration: 1.8 });
          grid.vline(44.5, yB - maxH * oldR, 67.5, yB - maxH * nowR, { color: G, alpha: 0.5, width: 1.2, dash: [3, 3] });
        }
        grid.text(72, yB + 1, 'TODAY', phase === 3 ? G : palette.dim, phase === 3, 'center');
      }

      const captions = [
        'STAGE 1: Anthropic\'s report "When AI Builds Itself" opens its internal metrics',
        'STAGE 2: Before Claude Code (Feb 2025): Claude wrote a low single-digit share',
        'STAGE 3: Today: more than 80% of merged production code is written by Claude'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Lines merged per engineer per day stay flat 2021–2024, then bend twice and reach 8×.',
    shows: 'Line chart of code merged per engineer per day: flat 2021–2024, a first kink when models start executing & testing code, a second when they work for hours autonomously, ending at 8× by Q2 2026.',
    phases: ['Flat 2021–2024', 'Inflection 1: Runs Its Own Code', 'Inflection 2: Multi-Hour Autonomy', '8× by Q2'],
    narration: [
      `Between 2021 and 2024, the number of lines of code merged per engineer per day at Anthropic remained completely flat.`,
      `Then came two sharp inflection points: first, when models began executing and testing code directly rather than waiting for humans to copy and paste it,`,
      `and second, earlier this year, when models gained the ability to work autonomously over multi-hour time horizons.`,
      `By the second quarter of this year, the typical Anthropic engineer was merging eight times as much code per day as they were in 2024.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) fx.shockwave(108, 8, { color: '#00ff88', radius: 8 });
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const x0 = 14;
      const x1 = 108;
      const yB = 26;
      const yT = 7;
      const xOf = (yr) => x0 + ((yr - 2021) / 5.5) * (x1 - x0);
      const yOf = (v) => yB - ((v - 0) / 8.5) * (yB - yT);
      const val = (yr) => (yr < 2024.9 ? 1 : (yr < 2025.9 ? 1 + (yr - 2024.9) * 1.6 : 2.6 + (yr - 2025.9) * 10.8));

      grid.title('06 // 8× CODE MERGED PER ENGINEER');
      grid.text(x0, 5, 'LINES MERGED / ENGINEER / DAY (× 2024 LEVEL)', palette.dim, false, 'left');
      grid.vline(x0, yB, x1, yB, { color: palette.primary, alpha: 0.4, width: 1.2 });
      grid.vline(x0, yB, x0, yT, { color: palette.primary, alpha: 0.4, width: 1.2 });
      for (let yr = 2021; yr <= 2026; yr++) grid.text(xOf(yr), yB + 1, String(yr), palette.dim, false, 'center');
      for (const v of [1, 4, 8]) grid.text(x0 - 1, yOf(v), `${v}×`, palette.dim, false, 'right');

      const endYr = [2024.9, 2025.9, 2026.2, 2026.4][phase - 1];
      const shownYr = anim.spring('yr', endYr, { from: 2021, freq: 1.8 });
      const pts = [];
      for (let i = 0; i <= 80; i++) {
        const yr = 2021 + (i / 80) * (shownYr - 2021);
        pts.push([xOf(yr), yOf(val(yr))]);
      }
      grid.vpath(pts, { color: phase === 4 ? G : palette.accent, alpha: 0.95, width: 2.2, glow: true });
      const hx = xOf(shownYr);
      const hy = yOf(val(shownYr));
      grid.set(hx, hy, '◈', '#ffffff', true);
      if (phase === 1) grid.text(xOf(2023), yOf(1) - 2, 'COMPLETELY FLAT', palette.warn, true, 'center');

      if (phase >= 2) {
        grid.set(xOf(2024.9), yOf(1), '①', palette.warn, true);
        grid.text(xOf(2024.9) - 1, yOf(1) - 3, 'MODELS EXECUTE & TEST CODE', palette.warn, false, 'right');
        grid.text(xOf(2024.9) - 1, yOf(1) - 2, '(no more copy-paste)', palette.dim, false, 'right');
      }
      if (phase >= 3) {
        grid.set(xOf(2025.9), yOf(2.6), '②', palette.warn, true);
        grid.text(xOf(2025.9) - 2, yOf(2.6) - 3, 'MULTI-HOUR AUTONOMY', palette.warn, false, 'right');
      }
      if (phase === 4) grid.counter('eight', hx + 2, hy, 8, { suffix: '× BY Q2', from: 1, color: G, align: 'left', duration: 1.6 });

      const captions = [
        'STAGE 1: 2021–2024: code merged per engineer per day stayed completely flat',
        'STAGE 2: Inflection 1: models began executing and testing code themselves',
        'STAGE 3: Inflection 2: models gained multi-hour autonomous time horizons',
        'STAGE 4: By Q2, the typical engineer was merging 8× more code than in 2024'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'An underspecified, open-ended task; even the engineer is unsure of the answer; Claude\'s success rate jumps 50 points to 76%.',
    shows: 'A task.md card with no spec and flickering question marks; the engineer shows "?"; then a success-rate bar surges from 26% to 76% (+50 points in 6 months).',
    phases: ['The Hardest Tasks', 'No Clear Spec', '+50 Points → 76%'],
    narration: [
      `Furthermore, on the hardest, most open-ended engineering tasks—`,
      `problems with no clear specification where even the human engineer isn't sure what the final solution should look like—`,
      `Claude's success rate surged by fifty percentage points in just six months, reaching seventy-six percent.`
    ],
    stageMinimums: [3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) fx.shockwave(94, 12, { color: '#00ff88', radius: 9 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const q = Math.sin(time * 6) > 0 ? '?' : '¿';

      grid.title('07 // THE HARDEST, MOST OPEN-ENDED TASKS');
      grid.codeCard(34, 15, {
        key: 'task', title: 'task.md', width: 38, color: phase === 1 ? palette.accent : palette.warn,
        lines: phase === 1
          ? ['difficulty: hardest tier', 'type: open-ended engineering', 'scope: entire system']
          : ['difficulty: hardest tier', { text: `spec: ${q}${q}${q}`, mark: 'warn' }, { text: `done when: ${q}`, mark: 'warn' }, { text: 'reference solution: none', mark: 'dim' }]
      });
      if (phase >= 2) {
        grid.icon('human', 34, 25, palette.accent, { key: 'eng', base: false });
        grid.text(37, 23, q, palette.warn, true, 'center');
        grid.text(34, 28, 'EVEN THE ENGINEER IS UNSURE', palette.warn, false, 'center');
      }

      // Success-rate surge
      const x0 = 66;
      const L = 52;
      const before = anim.spring('b', 0.26, { from: 0, freq: 2.5 });
      grid.text(x0, 9, '6 MONTHS AGO', palette.dim, false, 'left');
      drawHBar(grid, x0, 11, L, before, palette.primary);
      grid.text(x0 + L * before + 2, 11, '26%', palette.primary, false, 'left');
      grid.text(x0, 15, 'NOW', phase === 3 ? G : palette.dim, phase === 3, 'left');
      const now = anim.spring('n', phase === 3 ? 0.76 : 0.26, { freq: 1.6 });
      if (phase === 3) {
        const end = drawHBar(grid, x0, 17, L, now, G);
        grid.counter('rate', end + 2, 17, now * 100, { suffix: '%', color: G, align: 'left', duration: 0.2 });
        grid.text(x0 + L / 2, 20, '+50 PERCENTAGE POINTS IN 6 MONTHS', G, true, 'center');
      }
      grid.text(x0 + L / 2, 6, 'CLAUDE SUCCESS RATE', palette.accent, false, 'center');

      const captions = [
        'STAGE 1: On the hardest, most open-ended engineering tasks…',
        'STAGE 2: …with no clear spec, where even the engineer isn\'t sure of the answer…',
        'STAGE 3: …Claude\'s success rate jumped 50 points in 6 months, to 76%'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Every new model rewrites a small-model training codebase for speed; human 4×, Opus 4 3×, Mythos Preview 52×.',
    shows: 'Each new model takes the same test: speed up train_small_model.py while passing correctness checks. Bars race: skilled human 4× (4–8 h), Claude Opus 4 3× (May 2025), Claude Mythos Preview 52× eleven months later.',
    phases: ['The Internal Benchmark', 'Same Test, Every Model', 'Human Expert: 4×', 'Opus 4: 3×', 'Mythos Preview: 52×'],
    narration: [
      `Even more revealing is Anthropic's internal research-loop benchmark.`,
      `Every time Anthropic trains a new model, they give it the same test: take a codebase that trains a smaller AI model and rewrite the code to make it run as fast as possible while passing strict correctness checks.`,
      `For calibration, a skilled human machine learning researcher takes between four and eight hours to achieve a four-times speedup.`,
      `In May 2025, Claude Opus 4 averaged a three-times speedup.`,
      `Within eleven months, Anthropic's internal Claude Mythos Preview achieved a fifty-two-times speedup on that exact same task.`
    ],
    stageMinimums: [3.5, 0, 0, 3.5, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 5) {
        fx.flash('#00ff88', 0.25);
        fx.shockwave(100, 22, { color: '#00ff88', radius: 10 });
      }
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('08 // THE RESEARCH-LOOP BENCHMARK');

      // The test itself
      const cardCol = phase === 2 ? palette.accent : palette.primary;
      grid.codeCard(26, 13, {
        key: 'test', title: 'train_small_model.py', width: 38, color: cardCol,
        lines: ['GOAL: make it run as fast', '      as possible', { text: 'MUST: pass correctness checks', mark: phase === 2 ? 'hl' : undefined }]
      });
      grid.icon('shield', 26, 22, cardCol, { key: 'check', base: false, label: 'STRICT CHECKS' });
      if (phase === 1) {
        const sp = anim.spin('loop', 1.2);
        grid.ring3D(88, 15, 7, 1.2, 0, { color: palette.accent, dim: palette.dim, spin: sp, glow: true });
        grid.icon('agent', 88, 15, palette.accent, { key: 'newModel', base: false });
        grid.text(88, 23, 'EVERY NEW MODEL · SAME TEST', palette.accent, true, 'center');
      }

      // Speedup race
      if (phase >= 2) {
        const x0 = 50;
        const L = 64;
        const rows = [
          { stage: 3, label: 'SKILLED HUMAN RESEARCHER', sub: '4–8 hours', v: 4, col: palette.accent, icon: 'human' },
          { stage: 4, label: 'CLAUDE OPUS 4', sub: 'May 2025', v: 3, col: palette.primary, icon: 'agent' },
          { stage: 5, label: 'CLAUDE MYTHOS PREVIEW', sub: '+11 months', v: 52, col: G, icon: 'agent' }
        ];
        grid.text(x0, 6, 'SPEEDUP ON THE SAME TASK', palette.dim, false, 'left');
        rows.forEach((r, i) => {
          const y = 10 + i * 6;
          const on = phase >= r.stage;
          grid.icon(r.icon, x0 - 6, y, on ? r.col : palette.dim, { key: 'ri' + i, base: false, alpha: on ? 1 : 0.35 });
          grid.text(x0, y - 1, r.label, on ? r.col : palette.dim, on && phase === r.stage, 'left');
          grid.text(x0, y + 2, r.sub, palette.dim, false, 'left');
          if (on) {
            const v = anim.spring('v' + i, r.v, { from: 0, freq: i === 2 ? 1.2 : 3 });
            const end = drawHBar(grid, x0, y + 1, L, v / 52, r.col);
            grid.text(end + 2, y + 1, `${v.toFixed(v < 10 ? 1 : 0)}×`, r.col, true, 'left');
          }
        });
        if (phase >= 3) drawClock(grid, x0 + 26, 10, anim.spin('clk', 3), palette.accent);
      }

      const captions = [
        'STAGE 1: Anthropic\'s internal research-loop benchmark',
        'STAGE 2: Every new model gets the same test: speed up training code, stay correct',
        'STAGE 3: A skilled human ML researcher: 4× speedup in 4 to 8 hours',
        'STAGE 4: Claude Opus 4 (May 2025): 3× on average',
        'STAGE 5: 11 months later, Claude Mythos Preview: 52×'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 09. ONE WEEK VS 800 HOURS
  // ============================================================================
  {
    id: 'rsi2-09',
    number: '09',
    title: 'One Week vs 800 Agent-Hours',
    category: 'The Hard Data',
    prompt: 'Two humans close 23% of a performance gap in a week; an agent loop closes 97% in 800 hours on ~$18k of compute.',
    shows: 'Two lanes across a performance gap: two human researchers work for a week and fill 23%; an autonomous agent loop runs 800 cumulative hours on ~$18,000 of compute and fills 97%.',
    phases: ['Two Researchers, One Week', 'Recovered 23%', '800 Agent-Hours · ~$18k', 'Closed 97%'],
    narration: [
      `In another documented experiment, two human researchers spent a full week trying to close a defined performance gap on a machine learning benchmark`,
      `and recovered twenty-three percent of the gap.`,
      `An autonomous agent loop running for eight hundred cumulative hours on roughly eighteen thousand dollars of compute`,
      `closed ninety-seven percent of that same gap.`
    ],
    stageMinimums: [0, 3.5, 0, 3.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) {
        fx.shockwave(110, 22, { color: '#00ff88', radius: 9 });
        fx.punch(0.3);
      }
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const gx0 = 30;
      const gx1 = 114;
      const L = gx1 - gx0;

      grid.title('09 // ONE WEEK VS 800 AGENT-HOURS');
      grid.text(gx0, 5, 'BASELINE', palette.dim, false, 'center');
      grid.text(gx1, 5, 'TARGET', palette.dim, false, 'center');
      grid.vline(gx0, 6, gx0, 26, { color: palette.dim, alpha: 0.5, width: 1, dash: [2, 3] });
      grid.vline(gx1, 6, gx1, 26, { color: G, alpha: 0.6, width: 1, dash: [2, 3] });
      grid.text((gx0 + gx1) / 2, 5, '◄── PERFORMANCE GAP ──►', palette.accent, false, 'center');

      // Humans
      grid.icon('human', 10, 11, palette.accent, { key: 'h1', base: false });
      grid.icon('human', 16, 11, palette.accent, { key: 'h2', base: false });
      grid.text(13, 14, '2 RESEARCHERS', palette.accent, false, 'center');
      const weekP = phase === 1 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
      grid.text(13, 15, `DAY ${Math.max(1, Math.ceil(weekP * 7))} / 7`, palette.dim, false, 'center');
      const hR = anim.spring('h', phase === 1 ? 0.23 * weekP : 0.23, { freq: 3 });
      grid.box(gx0 - 1, 9, L + 2, 5, { style: 'round', color: palette.dim });
      for (let r = 0; r < 3; r++) drawHBar(grid, gx0, 10 + r, L, hR, palette.accent, 0.8);
      if (phase >= 2) grid.text(gx0 + L * hR + 2, 11, '23% OF THE GAP', palette.accent, true, 'left');

      // Agent loop
      if (phase >= 3) {
        const sp = anim.spin('loop', 2.4);
        grid.ring3D(13, 22, 3.5, 1.2, 0, { color: G, dim: palette.dim, spin: sp, glow: true });
        grid.icon('agent', 13, 22, G, { key: 'ag', base: false });
        const runP = phase === 3 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
        grid.counter('hrs', 13, 26, runP * 800, { suffix: ' AGENT-HOURS', color: G, duration: 0.2 });
        grid.counter('usd', 13, 27, runP * 18000, { prefix: '~$', suffix: ' COMPUTE', color: palette.dim, glow: false, duration: 0.2 });
        const aR = anim.spring('a', phase === 3 ? 0.97 * runP : 0.97, { freq: 3 });
        grid.box(gx0 - 1, 19, L + 2, 5, { style: 'round', color: phase === 4 ? G : palette.dim, glow: phase === 4 });
        for (let r = 0; r < 3; r++) drawHBar(grid, gx0, 20 + r, L, aR, G, 0.85);
        if (phase === 4) grid.text(gx1 - 2, 17.5, '97% OF THE SAME GAP', G, true, 'right');
      }

      const captions = [
        'STAGE 1: Two human researchers spend a full week on a defined performance gap',
        'STAGE 2: They recover 23% of it',
        'STAGE 3: An agent loop runs 800 cumulative hours on ~$18,000 of compute',
        'STAGE 4: It closes 97% of the same gap'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 10. NOT WEIGHT EDITING: THE DUAL LOOP
  // ============================================================================
  {
    id: 'rsi2-10',
    number: '10',
    title: 'Under the Hood: Not Weight Editing',
    category: 'Under the Hood',
    prompt: 'The popular picture of a model editing its own weights collapses; the real engine is a dual-loop architecture.',
    shows: 'A 4-layer network: an agent edits weights in production, nodes go red (forgetting) and the net collapses; then weights lock and three pillars appear inside two loops: Harness Evolution, Multi-Agent Self-Supervision, Simulated World Replay.',
    phases: ['Under the Hood', 'The Popular Picture', 'Collapse & Forgetting', 'The Dual-Loop Architecture'],
    narration: [
      `To understand how these systems are achieving this, we need to clarify what modern Recursive Self-Improvement actually looks like under the hood.`,
      `When people imagine RSI, they often picture a model spontaneously rewriting its own neural network weights in real time while running in production.`,
      `In practice, directly mutating weights mid-inference leads to model collapse or catastrophic forgetting.`,
      `Instead, what is powering the current wave of breakthroughs is a dual-loop architecture combining Agent Harness Evolution, Multi-Agent Self-Supervision, and Simulated World Replay.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) {
        fx.shake(0.6);
        fx.flash(palette.danger, 0.3);
        fx.shockwave(38, 18, { color: palette.danger, radius: 12 });
      }
      if (phase === 4) fx.shockwave(94, 16, { color: '#00ff88', radius: 12 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('10 // UNDER THE HOOD: NOT WEIGHT EDITING');
      grid.text(38, 5, phase === 2 ? 'THE POPULAR PICTURE' : (phase === 4 ? 'WEIGHTS: NOT EDITED LIVE' : 'NEURAL NETWORK WEIGHTS'), phase === 2 ? palette.warn : palette.dim, false, 'center');

      const layers = [20, 32, 44, 56];
      const redFrac = anim.spring('red', phase === 3 ? 1 : 0, { freq: 1.4 });
      const collapse = anim.spring('collapse', phase === 3 ? 1 : 0, { freq: 1.8, damp: 0.7 });
      const nodes = [];
      layers.forEach((lx, li) => {
        for (let ni = 0; ni < 5; ni++) {
          const nx = lx + (38 - lx) * collapse * 0.85;
          const ny = 10 + ni * 4 + (18 - (10 + ni * 4)) * collapse * 0.85 + Math.sin(time * 3 + ni + li) * collapse * 0.6;
          nodes.push({ x: nx, y: ny, li, idx: li * 5 + ni });
        }
      });
      for (const a of nodes) {
        for (const b of nodes) {
          if (b.li !== a.li + 1) continue;
          grid.vline(a.x, a.y, b.x, b.y, { color: hash01(a.idx * 7 + b.idx) < redFrac ? R : palette.primary, alpha: 0.12, width: 1 });
        }
      }
      for (const n of nodes) {
        const bad = hash01(n.idx * 3.1) < redFrac;
        const edited = phase === 2 && Math.floor(time * 2.5) % 20 === n.idx;
        grid.set(n.x, n.y, edited ? '◉' : '●', bad ? R : (edited ? palette.warn : (phase === 4 ? palette.dim : palette.accent)), edited || bad);
      }
      if (phase === 1) grid.icon('eye', 38, 29, palette.accent, { key: 'look', base: false });
      if (phase === 2) {
        const target = nodes[Math.floor(time * 2.5) % 20];
        grid.icon('agent', target.x, target.y - 4, palette.warn, { key: 'editor', base: false });
        grid.text(38, 28, 'weights[i] += Δ   (live, in production)', palette.warn, false, 'center');
      }
      if (phase === 3) {
        if (Math.sin(time * 10) > -0.3) grid.text(38, 8, '✕ MODEL COLLAPSE ✕', R, true, 'center');
        grid.counter('know', 38, 28, 4, { prefix: 'KNOWLEDGE RETAINED: ', suffix: '%', from: 100, color: R, duration: 2.5 });
      }
      if (phase === 4) {
        grid.icon('lock', 38, 18, palette.primary, { key: 'frozen', glow: true, label: 'STABLE' });
        const bx = 94;
        grid.ring3D(bx, 16, 6, 1.2, 0, { color: palette.accent, dim: palette.dim, spin: anim.spin('in', 1.8), glow: true });
        grid.ring3D(bx, 16, 10, 1.2, 0, { color: G, dim: palette.dim, spin: -anim.spin('out', 0.7), glow: true });
        grid.text(bx, 5, 'THE DUAL-LOOP ARCHITECTURE', G, true, 'center');
        const pillars = [['gear', 'AGENT HARNESS EVOLUTION'], ['eye', 'MULTI-AGENT SELF-SUPERVISION'], ['cloud', 'SIMULATED WORLD REPLAY']];
        pillars.forEach((p, i) => {
          const y = 24 + i * 2;
          const on = anim.stagger(i, 0.5, 0.4) > 0.5;
          if (!on) return;
          grid.text(bx - 14, y, '◆', G, true, 'center');
          grid.text(bx - 12, y, p[1], palette.accent, true, 'left');
        });
      }

      const captions = [
        'STAGE 1: What does modern RSI actually look like under the hood?',
        'STAGE 2: The popular picture: a model rewriting its own weights, live',
        'STAGE 3: In practice that causes model collapse or catastrophic forgetting',
        'STAGE 4: The real engine: harness evolution, self-supervision and world replay'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'The demo sources, the foundation model, its orchestration harness, and the inner and outer loops.',
    shows: 'A sources card (AutoHarness, Weco AIDE2, Google Dream-RSI, MASS); the foundation model appears; harness modules (code, system prompts, memory retrieval, verification, tools) attach; then an INNER LOOP and a slower OUTER LOOP ring form around it.',
    phases: ['The Demo\'s Sources', 'The Foundation Model', 'The Orchestration Harness', 'Inner Loop + Outer Loop'],
    narration: [
      `Let's walk through a demonstration of how this two-loop system works in practice, drawing directly from recent frameworks like AutoHarness, Weco's AIDE2, and two major papers published earlier this month in October: Google's Dream-RSI and the MASS framework—short for Multi-Agent Self-Supervision.`,
      `Every modern AI system consists of two distinct layers: the foundation model itself,`,
      `and the orchestration harness—the surrounding code, system prompts, memory retrieval pipelines, verification scripts, and tool definitions that govern how the model interacts with its environment.`,
      `In our demonstration, the system is split into an Inner Loop and an Outer Loop.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase >= 2) fx.shockwave(64, 16, { color: palette.accent, radius: 6 + phase * 2 });
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const cx = 64;
      const cy = 16;

      grid.title('11 // TWO LAYERS, TWO LOOPS');

      // Loops first so module icons and labels draw on top of them
      if (phase === 4) {
        grid.ring3D(cx, cy, 6.5, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: anim.spin('inner', 2.2), glow: true });
        grid.ring3D(cx, cy, 15, 1.25, 0, { color: G, dim: palette.dim, spin: -anim.spin('outer', 0.5), glow: true });
        grid.text(cx - 13, cy - 3, 'INNER LOOP', palette.warn, true, 'right');
        grid.text(cx + 26, cy - 9, 'OUTER LOOP', G, true, 'left');
      }

      if (phase === 1) {
        grid.codeCard(cx, cy, {
          key: 'sources', title: 'demo built from', width: 48, color: palette.accent,
          lines: reveal(['AutoHarness', "Weco · AIDE2", { text: 'Google · Dream-RSI  (October)', mark: 'hl' }, { text: 'MASS · Multi-Agent Self-Supervision (Oct)', mark: 'hl' }], phaseTime / stageDuration, 6)
        });
      } else {
        grid.icosahedron3D(cx, cy, 3.4, anim.spin('bx', 0.4), anim.spin('by', 0.55), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.glow(cx, cy, 8, palette.accent, 1);
        grid.text(cx, cy + 5, 'LAYER 1 · FOUNDATION MODEL', palette.accent, true, 'center');
      }
      if (phase >= 3) {
        const mods = [
          { n: 'CODE', icon: 'terminal', x: cx - 40, y: cy - 6 },
          { n: 'SYSTEM PROMPTS', icon: 'file', x: cx - 32, y: cy + 8 },
          { n: 'MEMORY RETRIEVAL', icon: 'binary', x: cx + 32, y: cy + 8 },
          { n: 'VERIFICATION', icon: 'shield', x: cx + 40, y: cy - 6 },
          { n: 'TOOL DEFINITIONS', icon: 'plug', x: cx, y: cy - 11 }
        ];
        mods.forEach((m, i) => {
          const k = anim.spring('m' + i, phase === 3 ? (anim.stagger(i, (stageDuration * 0.6) / 5, 0.3) > 0 ? 1 : 0) : 1, { from: 0, freq: 4, damp: 0.6 });
          if (k < 0.05) return;
          const mx = cx + (m.x - cx) * k;
          const my = cy + (m.y - cy) * k;
          grid.icon(m.icon, mx, my, G, { key: 'mod' + i, label: m.n, labelColor: palette.accent, base: false, alpha: Math.min(1, k) });
        });
        grid.text(cx, cy + 13, 'LAYER 2 · ORCHESTRATION HARNESS', G, true, 'center');
      }

      const captions = [
        'STAGE 1: Our demo draws on AutoHarness, AIDE2, Dream-RSI and MASS',
        'STAGE 2: Layer 1: the foundation model itself',
        'STAGE 3: Layer 2: the harness — code, prompts, memory, verification, tools',
        'STAGE 4: The demo runs as two loops: an Inner Loop and an Outer Loop'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'The inner loop agent proposes, runs, times and logs candidate GPU kernel code until it hits a ceiling.',
    shows: 'Inner-loop research agent gets a target (custom GPU kernel / training pipeline); a PROPOSE → RUN → TIME → LOG ring spins while each attempt plots on a chart; the scores flatten against a red CEILING.',
    phases: ['Autonomous Research Agent', 'The Optimization Target', 'Propose · Run · Time · Log', 'Hits a Ceiling'],
    narration: [
      `In Step One, the Inner Loop acts as an autonomous research agent.`,
      `We give it a complex systems-optimization target, such as writing custom GPU kernels or optimizing a training pipeline.`,
      `The agent proposes candidate code, runs it against an evaluation metric, times the execution, and logs the trajectory.`,
      `Initially, the baseline agent hits a ceiling.`
    ],
    stageMinimums: [3.5, 0, 0, 3.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 4) {
        fx.shake(0.4);
        fx.shockwave(96, 12, { color: palette.danger, radius: 8 });
      }
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('12 // DEMO · STEP 1: THE INNER LOOP');

      // Inner loop agent
      const lx = 26;
      const ly = 16;
      const rate = phase >= 3 ? 1.8 : 0.6;
      const sp = anim.spin('loop', rate);
      grid.ring3D(lx, ly, 6.5, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: sp, glow: phase >= 3 });
      grid.icon('agent', lx, ly, palette.accent, { key: 'inner', base: false });
      grid.text(lx, ly + 7, 'INNER LOOP · RESEARCH AGENT', palette.warn, true, 'center');
      if (phase >= 3) {
        const steps = ['PROPOSE', 'RUN', 'TIME', 'LOG'];
        const active = Math.floor(anim.spin('stepI', 2.2)) % 4;
        grid.wordRing3D(lx, ly, 10, 1.25, sp, steps, { color: palette.secondary, dim: palette.dim, highlight: active, highlightColor: '#ffffff' });
      }

      if (phase === 2) {
        grid.codeCard(92, 16, { key: 'target', title: 'optimization_target.yaml', width: 40, color: palette.accent, lines: ['task: custom GPU kernel', '   or: training pipeline', { text: 'metric: runtime (ms) ↓', mark: 'hl' }, 'must: pass correctness'] });
        drawCleanLink(grid, ctx.time, 72, 16, lx + 11, ly, 'TARGET', palette.dim, palette.accent, 0.7);
      }

      // Attempt chart
      if (phase >= 3) {
        const x0 = 64;
        const x1 = 120;
        const yB = 26;
        const yT = 8;
        grid.vline(x0, yB, x1, yB, { color: palette.primary, alpha: 0.4, width: 1.2 });
        grid.vline(x0, yB, x0, yT, { color: palette.primary, alpha: 0.4, width: 1.2 });
        grid.text(x0, yT - 2, 'SPEEDUP PER ATTEMPT', palette.dim, false, 'left');
        grid.text(x1, yB + 1, 'ATTEMPTS →', palette.dim, false, 'right');
        const n = Math.min(28, Math.floor(anim.spin('att', phase === 3 ? 4 : 2.5)));
        const ceil = 0.55;
        let prev = null;
        for (let i = 0; i < n; i++) {
          const v = Math.min(ceil, 0.12 + (1 - Math.exp(-i / 6)) * 0.5) - hash01(i) * 0.06;
          const px = x0 + 2 + i * 2;
          const py = yB - v * (yB - yT);
          if (prev) grid.vline(prev[0], prev[1], px, py, { color: palette.accent, alpha: 0.5, width: 1.2 });
          grid.set(px, py, i === n - 1 ? '◆' : '•', i === n - 1 ? '#ffffff' : palette.accent, i === n - 1);
          prev = [px, py];
        }
        if (phase === 4) {
          const cyl = yB - ceil * (yB - yT);
          grid.vline(x0, cyl - 0.6, x1, cyl - 0.6, { color: R, alpha: 1, width: 2.2 });
          grid.text(x1, cyl - 2, 'CEILING', R, true, 'right');
          grid.icon('warn', 100, 9, R, { key: 'ceilW', base: false });
        }
      }

      const captions = [
        'STAGE 1: Step 1 — the Inner Loop is an autonomous research agent',
        'STAGE 2: It gets a systems-optimization target, e.g. a custom GPU kernel',
        'STAGE 3: It proposes code, runs it, times it, and logs every trajectory',
        'STAGE 4: At first, the baseline agent hits a ceiling'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'The outer loop replaces the human debugger: three roles share one model, inspect inner-loop traces, and rewrite its workflow.',
    shows: 'The human debugger is struck out as the Outer Loop takes over; TASK AGENT, SELF-EVALUATOR and WORKFLOW OPTIMIZER all wire into one shared model (MASS, Oct 8); a trace strip is inspected and breaks are flagged; inner_workflow.py is rewritten.',
    phases: ['Outer Loop Takes Over', 'Three Roles, One Model', 'Inspect the Traces', 'Rewrite the Inner Loop'],
    narration: [
      `In Step Two, instead of a human engineer stepping in to debug the agent's workflow, the Outer Loop takes over.`,
      `In the MASS architecture published on October 8th, the task agent, the self-evaluator, and the workflow optimizer all share the exact same underlying language model.`,
      `The Outer Loop inspects the execution traces of the Inner Loop, diagnoses where the inter-agent communication or tool execution broke down,`,
      `and rewrites the workflow prompt and helper functions of the Inner Loop itself.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 1) fx.shockwave(28, 16, { color: '#00ff88', radius: 12 });
      if (phase === 3) fx.shockwave(96, 11, { color: palette.danger, radius: 7 });
    },
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const cx = 28;
      const cy = 16;

      grid.title('13 // DEMO · STEP 2: THE OUTER LOOP');

      grid.ring3D(cx, cy, 13, 1.25, 0, { color: G, dim: palette.dim, spin: -anim.spin('outer', 0.6), glow: true, alpha: anim.spring('oA', 1, { from: 0, freq: 3 }) });
      grid.text(cx, cy - 12, 'OUTER LOOP', G, true, 'center');
      if (phase === 1) {
        grid.icon('human', cx + 30, cy, palette.dim, { key: 'eng', alpha: 0.6, base: false, label: 'NO HUMAN DEBUGGER' });
        grid.vline(cx + 27, cy - 2, cx + 33, cy + 1.5, { color: R, alpha: 0.9, width: 1.6 });
        grid.vline(cx + 33, cy - 2, cx + 27, cy + 1.5, { color: R, alpha: 0.9, width: 1.6 });
      }

      // Shared model + three roles
      grid.icosahedron3D(cx, cy, 2.6, anim.spin('mx', 0.5), anim.spin('my', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      if (phase >= 2) {
        const roles = [['agent', 'TASK AGENT', cx - 14, cy - 5], ['eye', 'SELF-EVALUATOR', cx + 14, cy - 5], ['gear', 'WORKFLOW OPTIMIZER', cx, cy + 8]];
        roles.forEach((r, i) => {
          grid.vline(cx, cy, r[2], r[3], { color: palette.accent, alpha: 0.35, width: 1.2, dash: [2, 3] });
          grid.icon(r[0], r[2], r[3], palette.accent, { key: 'role' + i, base: false, label: r[1] });
        });
        grid.text(cx, cy + 2.8, 'ONE SHARED MODEL', '#ffffff', true, 'center');
        grid.text(cx + 7, cy - 12, '· MASS (Oct 8)', palette.dim, false, 'left');
      }

      // Trace inspection
      if (phase >= 3) {
        const nodes = ['plan', 'call tool', 'handoff', 'eval', 'retry', 'submit'];
        const scan = phase === 3 ? math.clamp(phaseTime / (stageDuration * 0.85), 0, 1) : 1;
        grid.text(92, 6, 'INNER-LOOP EXECUTION TRACE', palette.dim, false, 'center');
        nodes.forEach((n, i) => {
          const x = 66 + i * 10.5;
          const scanned = i / nodes.length < scan;
          const broken = i === 1 || i === 2;
          const col = scanned ? (broken ? R : G) : palette.dim;
          if (i < 5) grid.vline(x + 1.5, 10, x + 9, 10, { color: col, alpha: 0.5, width: 1.2 });
          grid.set(x, 10, broken && scanned ? '✕' : '◈', col, scanned);
          grid.text(x, 12, n, col, false, 'center');
          if (broken && scanned) grid.text(x, i === 1 ? 8 : 6.8, i === 1 ? 'tool failed' : 'msg lost', R, true, 'center');
        });
        grid.vline(66 + scan * 55, 7, 66 + scan * 55, 13, { color: palette.warn, alpha: 0.6, width: 1.2 });
      }
      if (phase === 4) {
        grid.codeCard(92, 22, {
          key: 'workflow', title: 'inner_workflow.py', width: 44, color: G,
          lines: [{ text: 'prompt = BASE_PROMPT', mark: 'del' }, { text: 'prompt = refine(BASE_PROMPT, traces)', mark: 'add' }, { text: 'def call_tool(t): return retry(t, 3)', mark: 'add' }, { text: 'def handoff(m): return validate(m)', mark: 'add' }]
        });
        drawCleanLink(grid, time, cx + 14, cy + 4, 69, 22, 'REWRITE', palette.dim, G, 0.8);
      }

      const captions = [
        'STAGE 1: Step 2 — no human debugs the workflow; the Outer Loop takes over',
        'STAGE 2: MASS (Oct 8): task agent, self-evaluator and optimizer share one model',
        'STAGE 3: It inspects the inner loop\'s traces and finds where tools and handoffs broke',
        'STAGE 4: Then it rewrites the inner loop\'s workflow prompt and helper functions'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 14. STEP 3: DREAM-RSI REPLAY
  // ============================================================================
  {
    id: 'rsi2-14',
    number: '14',
    title: 'Step 3: Dream-RSI World Replay',
    category: 'Live Demo',
    prompt: 'Online code mutations burn compute; Dream-RSI turns the discovery history into a replay simulator and the meta-policy plans inside it.',
    shows: 'A branching tree of code mutations explores live while a compute meter climbs; dead ends get marked; the tree becomes a replay simulator (world model of the code); a simulated trajectory then skips every dead end to the high-yield branch.',
    phases: ['Online Search Is Expensive', 'Exploring & Dead Ends', 'Replay Simulator', 'Simulate, Then Spend'],
    narration: [
      `However, running thousands of trial-and-error code mutations online is computationally expensive.`,
      `That is where Google's Dream-RSI framework, updated on October 6th, comes in. As the agent explores different code branches and hits dead ends,`,
      `Dream-RSI turns that structured discovery history into an empirical replay simulator—essentially an internal world model of the code environment.`,
      `In Step Three of our demo, before burning massive compute on live evaluations, the meta-policy simulates trajectories inside this replay map, skipping known dead ends and selecting high-yield optimization branches.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) fx.shockwave(64, 17, { color: palette.accent, radius: 16 });
      if (phase === 4) fx.shockwave(112, 21, { color: '#00ff88', radius: 6 });
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('14 // DEMO · STEP 3: DREAM-RSI WORLD REPLAY');

      // Tree of code mutations
      const L0 = [[12, 17]];
      const L1 = [[36, 11], [36, 23]];
      const L2 = [[62, 8], [62, 14], [62, 20], [62, 26]];
      const L3 = [];
      L2.forEach(p => { L3.push([90, p[1] - 2]); L3.push([90, p[1] + 2]); });
      const edges = [];
      L1.forEach(p => edges.push([L0[0], p, 1]));
      L2.forEach((p, i) => edges.push([L1[Math.floor(i / 2)], p, 2]));
      L3.forEach((p, i) => edges.push([L2[Math.floor(i / 2)], p, 3]));
      const deadL2 = [0, 3];
      const deadL3 = [2, 3, 4, 7];
      const best = 5;
      const explore = phase === 1 ? math.clamp(phaseTime / stageDuration, 0, 1) * 0.6 : (phase === 2 ? 0.6 + math.clamp(phaseTime / stageDuration, 0, 1) * 0.4 : 1);
      const replay = phase >= 3;
      const baseCol = replay ? palette.primary : palette.accent;

      edges.forEach((e, i) => {
        if (i / edges.length > explore) return;
        grid.vline(e[0][0] + 1.5, e[0][1], e[1][0] - 1.5, e[1][1], { color: baseCol, alpha: 0.4, width: 1.2 });
      });
      const nodeAt = (p, dead, i, lvl) => {
        const idx = lvl === 2 ? 2 + i : 6 + i;
        if (idx / 14 > explore) return;
        const showDead = dead && (phase >= 2);
        grid.set(p[0], p[1], showDead ? '✕' : '◈', showDead ? R : baseCol, showDead);
      };
      grid.set(12, 17, '◆', '#ffffff', true);
      L1.forEach((p) => grid.set(p[0], p[1], '◈', baseCol, false));
      L2.forEach((p, i) => nodeAt(p, deadL2.includes(i), i, 2));
      L3.forEach((p, i) => nodeAt(p, deadL3.includes(i) || deadL2.includes(Math.floor(i / 2)), i, 3));
      if (phase >= 2) grid.text(52, 30, 'DEAD END ✕   ·   DISCOVERY HISTORY', R, false, 'center');

      // Compute meter
      const spent = phase <= 2 ? anim.spin('cost', phase === 1 ? 3200 : 2400) : anim.spin('cost', 0, 6);
      grid.counter('costC', 110, 6, spent, { prefix: 'LIVE COMPUTE $', color: phase <= 2 ? palette.warn : G, duration: 0.15 });
      if (phase === 1) grid.icon('warn', 110, 10, palette.warn, { key: 'exp', base: false, label: 'EXPENSIVE' });
      if (phase === 2) grid.text(110, 9, 'Dream-RSI · Oct 6', palette.dim, false, 'center');

      // Becomes a replay simulator
      if (replay) {
        grid.box(6, 4, 92, 25, { style: 'double', color: palette.primary, title: 'EMPIRICAL REPLAY SIMULATOR', glow: true });
        grid.text(52, 28, 'an internal world model of the code environment', palette.accent, false, 'center');
      }
      if (phase === 4) {
        const path = [L0[0], L1[1], L2[2], L3[best]];
        const k = math.clamp((phaseTime % 3) / 2.2, 0, 1);
        const seg = Math.min(2, Math.floor(k * 3));
        const f = k * 3 - seg;
        const pts = path.slice(0, seg + 1);
        pts.push([path[seg][0] + (path[seg + 1][0] - path[seg][0]) * f, path[seg][1] + (path[seg + 1][1] - path[seg][1]) * f]);
        grid.vpath(pts, { color: G, alpha: 0.95, width: 2.4, glow: true });
        grid.set(L3[best][0], L3[best][1], '★', G, true);
        grid.text(L3[best][0] + 3, L3[best][1], 'HIGH-YIELD BRANCH', G, true, 'left');
        grid.text(110, 12, 'SIMULATED FIRST', G, true, 'center');
        grid.text(110, 13, 'live evals only on', palette.accent, false, 'center');
        grid.text(110, 14, 'the best branch', palette.accent, false, 'center');
      }

      const captions = [
        'STAGE 1: Thousands of live trial-and-error code mutations burn compute',
        'STAGE 2: Dream-RSI (Oct 6) records every branch explored and every dead end',
        'STAGE 3: That history becomes a replay simulator — a world model of the code',
        'STAGE 4: Step 3: simulate first, skip known dead ends, spend compute on the best branch'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'A self-written harness update is only committed if it measurably beats the previous best on held-out checks.',
    shows: 'Candidate harness updates queue at a gate; a weaker candidate is rejected against the previous best; a stronger one beats it on held-out checks and gets committed.',
    phases: ['The Gate', 'Commit Only If…', '…It Beats the Best on Held-Out'],
    narration: [
      `In Step Four, the candidate rewrite must pass a strict verification gate.`,
      `The Outer Loop only commits the self-written harness update`,
      `if it measurably outperforms the previous best version on held-out checks.`
    ],
    stageMinimums: [3.5, 3.5, 4],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) {
        fx.shockwave(64, 16, { color: '#00ff88', radius: 10 });
        fx.flash('#00ff88', 0.15);
      }
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('15 // DEMO · STEP 4: THE VERIFICATION GATE');

      const gateCol = anim.color('gate', phase === 3 ? G : palette.warn);
      grid.line(64, 6, 64, 26, '║', gateCol, true);
      grid.vline(64, 6, 64, 26, { color: gateCol, alpha: 0.6, width: 2 });
      grid.icon('shield', 64, 4.5, gateCol, { key: 'gateS', base: false });
      grid.text(64, 28, 'HELD-OUT CHECKS', gateCol, true, 'center');

      // Previous best reference
      grid.text(80, 8, 'PREVIOUS BEST', palette.accent, false, 'left');
      drawHBar(grid, 80, 9, 36, 0.71, palette.accent);
      grid.text(117, 9, '71.0', palette.accent, false, 'left');

      if (phase === 1) {
        grid.icon('file', 30, 16, palette.accent, { key: 'cand', glow: true, bob: true, label: 'CANDIDATE REWRITE' });
      }
      if (phase === 2) {
        const bt = (time * 0.6) % 1;
        const x = 30 + Math.sin(bt * Math.PI) * 28;
        grid.icon('file', x, 16, R, { key: 'weak', base: false, label: 'weak update' });
        grid.text(80, 15, 'WEAK CANDIDATE', R, false, 'left');
        drawHBar(grid, 80, 16, 36, 0.68, R);
        grid.text(117, 16, '68.2', R, false, 'left');
        if (bt > 0.4 && bt < 0.6) grid.text(66, 20, '✕ NOT COMMITTED', R, true, 'left');
      }
      if (phase === 3) {
        const x = anim.spring('candX', 96, { from: 30, freq: 2, damp: 0.8 });
        grid.icon('file', x, 21, G, { key: 'strong', glow: true, label: 'STRONGER UPDATE' });
        grid.text(80, 13, 'NEW CANDIDATE', G, true, 'left');
        const v = anim.spring('candV', 0.746, { from: 0.6, freq: 2 });
        drawHBar(grid, 80, 14, 36, v, G);
        grid.text(117, 14, (v * 100).toFixed(1), G, true, 'left');
        if (x > 90) grid.text(96, 26, '✓ COMMITTED', G, true, 'center');
      }

      const captions = [
        'STAGE 1: Step 4 — every candidate rewrite must pass a strict verification gate',
        'STAGE 2: The Outer Loop only commits the self-written harness update…',
        'STAGE 3: …if it measurably beats the previous best on held-out checks'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'An 8-day unattended run produces seven stronger agent versions, beats a 2-year hand-tuned agent on 3 unseen benchmarks, and cuts reward hacking 63% → 34%.',
    shows: 'An 8-day timeline fills with v1 → v7 agent versions; three unseen benchmarks show the self-evolved agent beating a human agent hand-tuned for two years; a reward-hacking gauge drops from 63% to 34% with nobody programming it.',
    phases: ['8 Days · 7 Versions', 'Beats a 2-Year Human Agent', 'Reward Hacking 63% → 34%'],
    narration: [
      `In a recent eight-day unattended run using this exact inner-and-outer-loop structure, the system autonomously generated seven successively stronger versions of its own research agent.`,
      `By day eight, the self-evolved agent beat a human-engineered agent that had been hand-tuned over two years—and it beat it across three separate benchmarks it had never been trained on.`,
      `Even more remarkably, the rate at which the agent tried to "reward hack" or cheat the GPU kernel benchmark dropped from sixty-three percent down to thirty-four percent, an emergent improvement in reliability that no human explicitly programmed.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 2) fx.shockwave(40, 22, { color: '#00ff88', radius: 9 });
      if (phase === 3) fx.shockwave(98, 22, { color: '#00ff88', radius: 9 });
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('16 // EIGHT DAYS UNATTENDED');

      // 8-day timeline with versions
      const x0 = 12;
      const x1 = 116;
      const prog = phase === 1 ? math.clamp(phaseTime / (stageDuration * 0.85), 0, 1) : 1;
      grid.vline(x0, 9, x1, 9, { color: palette.dim, alpha: 0.5, width: 1 });
      grid.vline(x0, 9, x0 + (x1 - x0) * prog, 9, { color: G, alpha: 0.9, width: 1.8 });
      for (let d = 1; d <= 8; d++) grid.text(x0 + ((d - 0.5) / 8) * (x1 - x0), 10.5, `DAY ${d}`, palette.dim, false, 'center');
      for (let v = 1; v <= 7; v++) {
        const vx = x0 + (v / 7.6) * (x1 - x0);
        if ((vx - x0) / (x1 - x0) > prog) continue;
        grid.icon('agent', vx, 6, v === 7 ? G : palette.accent, { key: 'v' + v, base: false, glow: v === 7 });
        grid.text(vx + 3, 6, `v${v}`, v === 7 ? G : palette.accent, v === 7, 'left');
      }
      if (phase === 1) grid.text(64, 14, 'NO HUMANS · INNER + OUTER LOOP · 7 SUCCESSIVELY STRONGER VERSIONS', palette.accent, false, 'center');

      // Benchmarks the agent never trained on
      if (phase >= 2) {
        grid.text(40, 14, 'UNSEEN BENCHMARKS', palette.accent, true, 'center');
        const scores = [[0.62, 0.71], [0.55, 0.66], [0.48, 0.61]];
        scores.forEach((s, i) => {
          const bx = 22 + i * 13;
          const hR = anim.spring('hb' + i, s[0], { from: 0, freq: 2.5 });
          const aR = anim.spring('ab' + i, s[1], { from: 0, freq: 2 });
          drawVBar(grid, bx, 27, 10, hR, palette.primary, 3);
          drawVBar(grid, bx + 4, 27, 10, aR, G, 3);
          grid.text(bx + 3, 28, `B${i + 1}`, palette.dim, false, 'center');
        });
        grid.text(28, 29.5, '■ human-tuned (2 yrs)', palette.primary, false, 'center');
        grid.text(54, 29.5, '■ self-evolved', G, false, 'center');
      }

      // Reward hacking drop
      if (phase === 3) {
        const v = anim.spring('rh', 34, { from: 63, freq: 1.3 });
        grid.text(98, 14, 'REWARD-HACKING RATE', palette.accent, true, 'center');
        grid.text(98, 15, '(GPU kernel benchmark)', palette.dim, false, 'center');
        drawVBar(grid, 92, 27, 10, v / 100 * 1.4, v > 50 ? R : palette.warn, 6);
        grid.counter('rhC', 95, 27 - (v / 100) * 14 - 1.5, v, { suffix: '%', color: palette.warn, duration: 0.15 });
        grid.icon('bug', 110, 21, R, { key: 'hackBug', alpha: Math.max(0.3, (v - 30) / 33), base: false });
        grid.text(98, 29.5, 'EMERGENT · NOT PROGRAMMED', G, true, 'center');
      }

      const captions = [
        'STAGE 1: An 8-day unattended run produced 7 successively stronger agents',
        'STAGE 2: By day 8 it beat a 2-year hand-tuned agent on 3 unseen benchmarks',
        'STAGE 3: Reward hacking fell from 63% to 34% — an improvement nobody programmed'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'The best multi-agent rollouts are harvested and used to fine-tune the shared model, improving both solving and self-evaluation.',
    shows: 'Rollouts pile up; the top ones (subagent execution + orchestrator delegation) are harvested and stream into the shared model, which morphs into its next version; a 68.3% win-rate gauge appears and self-evaluator accuracy climbs 73% → 93%: the student becomes the teacher.',
    phases: ['Loop Closes Into Weights', 'Harvest the Best Rollouts', 'Fine-Tune the Shared Model', '68.3% Win Rate', 'Evaluator 73% → 93%'],
    narration: [
      `Finally, in Step Five, the loop closes back into the model's weights.`,
      `Under the MASS framework, once the multi-agent workflow is optimized, the system harvests the highest-performing rollouts—capturing both the bounded local execution of subagents and the high-level delegation of the orchestrator—`,
      `and fine-tunes the shared foundation model on its own collective output.`,
      `That single post-training cycle doesn't just make the model better at solving tasks, where it achieved a sixty-eight-point-three percent win rate over its base version;`,
      `it simultaneously upgrades the model's ability to evaluate itself, driving self-evaluator accuracy from seventy-three percent up to ninety-three percent. The student literally becomes a sharper teacher for the next cycle.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) {
        fx.shockwave(64, 16, { color: '#00ff88', radius: 11 });
        fx.flash('#00ff88', 0.15);
      }
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('17 // DEMO · STEP 5: BACK INTO THE WEIGHTS');

      // Rollouts
      grid.text(22, 5, 'MULTI-AGENT ROLLOUTS', palette.dim, false, 'center');
      for (let i = 0; i < 15; i++) {
        const x = 10 + (i % 5) * 6;
        const y = 9 + Math.floor(i / 5) * 6;
        const top = hash01(i * 2.3) > 0.62;
        const picked = phase >= 2 && top;
        const col = picked ? G : palette.dim;
        grid.icon(i % 3 === 0 ? 'gear' : 'binary', x, y, col, { key: 'ro' + i, base: false, alpha: phase >= 2 && !top ? 0.35 : 1 });
      }
      if (phase === 2) {
        grid.text(22, 28, '✓ subagent execution', G, false, 'center');
        grid.text(22, 29, '✓ orchestrator delegation', G, false, 'center');
      }
      if (phase === 1) {
        grid.vpath([[40, 16], [52, 16]], { color: palette.accent, alpha: 0.6, width: 1.4 });
        grid.text(64, 26, 'THE LOOP CLOSES BACK INTO THE MODEL\'S WEIGHTS', palette.accent, true, 'center');
      }

      // Shared model fine-tunes on its own output
      const upgraded = phase >= 3;
      const mCol = anim.color('mc', upgraded ? G : palette.accent);
      grid.morph3D('model', upgraded ? 'dodeca' : 'icosa', 64, 15, anim.spring('ms', upgraded ? 4.2 : 3.2, { freq: 3, damp: 0.6 }), anim.spin('mx', 0.5), anim.spin('my', 0.6), 0, { color: mCol, accent: '#ffffff', dim: palette.dim, fx: false });
      grid.text(64, 22, upgraded ? 'SHARED MODEL · NEXT VERSION' : 'SHARED FOUNDATION MODEL', mCol, upgraded, 'center');
      if (phase === 3) drawCleanLink(grid, time, 40, 15, 55, 15, 'FINE-TUNE', palette.dim, G, 1);

      // Results
      if (phase >= 4) {
        const w = anim.spring('win', 68.3, { from: 50, freq: 1.6 });
        grid.text(100, 6, 'WIN RATE VS BASE', palette.accent, true, 'center');
        drawHBar(grid, 84, 8, 32, w / 100, G);
        grid.text(100, 9.5, `${w.toFixed(1)}%`, G, true, 'center');
      }
      if (phase === 5) {
        const ev = anim.spring('ev', 93, { from: 73, freq: 1.4 });
        grid.text(100, 13, 'SELF-EVALUATOR ACCURACY', palette.accent, true, 'center');
        drawHBar(grid, 84, 15, 32, ev / 100, palette.warn);
        grid.text(100, 16.5, `73% → ${Math.round(ev)}%`, palette.warn, true, 'center');
        grid.icon('agent', 92, 23, palette.accent, { key: 'student', base: false, label: 'STUDENT' });
        grid.text(100, 23, '→', palette.dim, false, 'center');
        grid.icon('eye', 109, 23, G, { key: 'teacher', base: false, label: 'SHARPER TEACHER', glow: true });
      }

      const captions = [
        'STAGE 1: Step 5 — the loop closes back into the model\'s weights',
        'STAGE 2: MASS harvests the best rollouts: subagent work + orchestrator delegation',
        'STAGE 3: The shared model is fine-tuned on its own collective output',
        'STAGE 4: One post-training cycle: a 68.3% win rate over the base model',
        'STAGE 5: And self-evaluation rises 73% → 93%: the student becomes the teacher'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 18. SCALE AND CONTAIN
  // ============================================================================
  {
    id: 'rsi2-18',
    number: '18',
    title: 'Building Infrastructure to Scale — and Contain',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Two weeks of Anthropic and OpenAI docs show infrastructure to scale recursive loops and to contain them.',
    shows: 'Anthropic docs and OpenAI release notes stack up; loops multiply upward (SCALE), then a sandbox frame closes around them with a lock (CONTAIN).',
    phases: ['Two Weeks of Docs', 'To Scale…', '…and Contain'],
    narration: [
      `If you look closely at the developer documentation and release notes published by Anthropic and OpenAI over the past two weeks,`,
      `you can see both companies actively building the exact infrastructure required to scale—`,
      `and contain—these recursive loops.`
    ],
    stageMinimums: [0, 3.5, 3.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) fx.shockwave(64, 17, { color: '#00ff88', radius: 14 });
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('18 // INFRASTRUCTURE TO SCALE — AND CONTAIN');
      grid.icon('file', 15, 12, palette.accent, { key: 'anth', glow: phase === 1, label: 'ANTHROPIC DOCS' });
      grid.icon('file', 113, 12, palette.accent, { key: 'oai', glow: phase === 1, label: 'OPENAI RELEASE NOTES' });
      grid.text(64, 5, 'PAST TWO WEEKS', palette.dim, false, 'center');

      if (phase >= 2) {
        const n = Math.min(5, 1 + Math.floor(anim.spin('mult', 1.6)));
        for (let i = 0; i < n; i++) {
          const x = 44 + i * 10;
          const y = 20 - i * 1.5;
          grid.ring3D(x, y, 3, 1.2, 0, { color: palette.accent, dim: palette.dim, spin: anim.spin('r' + i, 1.5 + i * 0.3), glow: true });
        }
        if (phase === 2) grid.text(64, 26, '▲ SCALE', palette.accent, true, 'center');
      }
      if (phase === 3) {
        const k = anim.spring('box', 1, { from: 0, freq: 3 });
        const w = 18 + 46 * k;
        grid.box(64 - w / 2, 10, w, 14, { style: 'double', color: G, title: 'SANDBOX', glow: true });
        grid.icon('lock', 64, 27, G, { key: 'cont', base: false });
        grid.text(72, 27, '■ CONTAIN', G, true, 'left');
      }

      const captions = [
        'STAGE 1: Two weeks of Anthropic and OpenAI documentation and release notes…',
        'STAGE 2: …show both companies building infrastructure to scale these loops…',
        'STAGE 3: …and to contain them'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 19. ANTHROPIC: CLAUDE 5.5 ROLLOUT
  // ============================================================================
  {
    id: 'rsi2-19',
    number: '19',
    title: 'Anthropic: The Claude 5.5 Rollout',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Claude Opus 5.5 cuts cost 40% and speeds up 30%+, migrates 680k lines in under 24h; Sonnet 5.5; Oct 7 platform update.',
    shows: 'An October docs calendar; the Opus 5.5 card counts down cost (−40%) and up speed (+30%); a 680,000-line migration bar fills against a 24-hour clock; the Sonnet 5.5 card and an Oct 7 platform-update badge land.',
    phases: ['Early–Mid October', 'Opus 5.5: −40% Cost, +30% Speed', '680k-Line Migration < 24h', 'Sonnet 5.5 · Oct 7 Update'],
    narration: [
      `Let's look first at Anthropic's latest documentation updates from early to mid-October.`,
      `Following the rollout of Claude Opus 5.5—which cut inference costs by forty percent, increased generation speed by over thirty percent,`,
      `and allowed early testers to autonomously complete a six-hundred-and-eighty-thousand-line code migration in under twenty-four hours—`,
      `and Claude Sonnet 5.5, Anthropic pushed a major developer platform update on October 7th.`
    ],
    stageMinimums: [3.5, 0, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase >= 2) fx.shockwave(phase === 4 ? 100 : 34, 14, { color: palette.accent, radius: 8 });
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('19 // ANTHROPIC: THE CLAUDE 5.5 ROLLOUT');

      if (phase === 1) {
        const days = ['OCT 1', 'OCT 4', 'OCT 7', 'OCT 10', 'OCT 12', 'OCT 15'];
        days.forEach((d, i) => {
          const x = 20 + i * 18;
          const on = anim.stagger(i, 0.25, 0.3) > 0.5;
          grid.icon('file', x, 14, on ? palette.accent : palette.dim, { key: 'd' + i, base: false, alpha: on ? 1 : 0.3 });
          grid.text(x, 18, d, on ? palette.accent : palette.dim, false, 'center');
        });
        grid.text(64, 23, 'ANTHROPIC DOCUMENTATION · EARLY–MID OCTOBER', palette.accent, true, 'center');
      } else {
        // Opus 5.5
        grid.box(10, 5, 50, 15, { style: 'round', color: palette.accent, title: 'CLAUDE OPUS 5.5', glow: phase <= 3 });
        grid.icosahedron3D(20, 12, 2.6, anim.spin('ox', 0.5), anim.spin('oy', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.counter('cost', 30, 10, -40, { prefix: 'INFERENCE COST ', suffix: '%', from: 0, color: G, align: 'left', duration: 1.5 });
        grid.counter('speed', 30, 13, 30, { prefix: 'GENERATION SPEED +', suffix: '%+', from: 0, color: G, align: 'left', duration: 1.5 });

        if (phase >= 3) {
          const p = phase === 3 ? math.clamp(phaseTime / (stageDuration * 0.9), 0, 1) : 1;
          grid.text(10, 23, 'AUTONOMOUS CODE MIGRATION (EARLY TESTERS)', palette.dim, false, 'left');
          grid.bar(10, 25, 50, p, { color: G, glow: true });
          grid.counter('lines', 35, 27, p * 680000, { suffix: ' LINES', color: G, duration: 0.15 });
          drawClock(grid, 66, 25, anim.spin('clk', phase === 3 ? 12 : 0, 8), palette.accent);
          grid.text(70, 25, `${Math.min(23, Math.floor(p * 23.5))}h · < 24h`, palette.accent, false, 'left');
        }
        if (phase === 4) {
          grid.box(72, 5, 46, 11, { style: 'round', color: palette.primary, title: 'CLAUDE SONNET 5.5' });
          grid.shape3D('octa', 82, 10, 2.2, anim.spin('sx', 0.5), anim.spin('sy', 0.6), 0, { color: palette.primary, accent: '#ffffff', dim: palette.dim });
          grid.text(90, 10, 'rolled out', palette.accent, false, 'left');
          grid.box(78, 19, 36, 5, { style: 'double', color: G, title: 'OCT 7', glow: true });
          grid.text(96, 21, 'DEVELOPER PLATFORM UPDATE', G, true, 'center');
        }
      }

      const captions = [
        'STAGE 1: Anthropic\'s documentation updates from early to mid-October',
        'STAGE 2: Claude Opus 5.5: inference cost down 40%, generation speed up 30%+',
        'STAGE 3: Early testers: a 680,000-line code migration in under 24 hours',
        'STAGE 4: Plus Claude Sonnet 5.5 — then a major platform update on October 7'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Claude Haiku 5.5 with a 1M context window and 128k output; adaptive thinking via effort; old sampling params return 400.',
    shows: 'Claude Haiku 5.5 arrives with a 1,000,000-token context bar and 128,000 max output; a request.json card adds adaptive thinking + effort, then budget_tokens, temperature, top_p and top_k are struck out with 400 errors.',
    phases: ['Haiku 5.5: 1M Context', 'Adaptive Thinking + effort', 'Old Params → 400'],
    narration: [
      `They launched Claude Haiku 5.5, bringing a one-million-token context window and one-hundred-and-twenty-eight-thousand max output tokens to high-volume, latency-sensitive agent workloads.`,
      `If you read the migration documentation for Haiku 5.5, several architectural shifts stand out. First, adaptive thinking is now enabled by default and controlled via an effort parameter,`,
      `while manual budget_tokens and traditional sampling parameters like temperature, top_p, and top_k now return 400 errors.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) {
        fx.shake(0.3);
        fx.shockwave(94, 17, { color: palette.danger, radius: 8 });
      }
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('20 // HAIKU 5.5 & THE MIGRATION DOCS');

      grid.box(6, 5, 52, 23, { style: 'round', color: palette.accent, title: 'CLAUDE HAIKU 5.5', glow: phase === 1 });
      grid.shape3D('tetra', 32, 11, 2.4, anim.spin('hx', 0.6), anim.spin('hy', 0.8), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      const ctxR = anim.spring('ctxw', 1, { from: 0, freq: 1.5 });
      grid.text(10, 17, 'CONTEXT WINDOW', palette.dim, false, 'left');
      drawHBar(grid, 10, 18, 44, ctxR, G);
      grid.counter('ctx', 32, 19.5, ctxR * 1000000, { suffix: ' TOKENS', color: G, duration: 0.15 });
      grid.text(10, 22, 'MAX OUTPUT', palette.dim, false, 'left');
      drawHBar(grid, 10, 23, 44, ctxR * 0.128, palette.primary);
      grid.text(32, 24.5, '128,000 TOKENS', palette.primary, false, 'center');
      grid.text(32, 26.5, 'high-volume · latency-sensitive agents', palette.dim, false, 'center');

      if (phase >= 2) {
        const lines = ['{', { text: '  "thinking": "adaptive",  // default', mark: 'add' }, { text: '  "effort": "high",', mark: 'add' }];
        if (phase === 3) {
          lines.push({ text: '  "budget_tokens": 8000,   → 400', mark: 'del' });
          lines.push({ text: '  "temperature": 0.7,      → 400', mark: 'del' });
          lines.push({ text: '  "top_p" / "top_k"        → 400', mark: 'del' });
        }
        lines.push('}');
        grid.codeCard(94, 16, { key: 'req', title: 'request.json · migration guide', width: 42, color: phase === 3 ? R : G, lines });
        if (phase === 3) grid.text(94, 27, 'HTTP 400 · REMOVED PARAMETERS', R, true, 'center');
      }

      const captions = [
        'STAGE 1: Claude Haiku 5.5: 1M-token context, 128k max output, built for agent workloads',
        'STAGE 2: Migration docs: adaptive thinking on by default, controlled by "effort"',
        'STAGE 3: budget_tokens, temperature, top_p and top_k now return 400 errors'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 21. CACHE ECONOMICS
  // ============================================================================
  {
    id: 'rsi2-21',
    number: '21',
    title: 'Why Cache Pricing Matters for RSI',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Cache-read prices drop on Sonnet 5.5 and Opus 5.5; in long agent loops cache reads dominate cost, so multi-day loops become viable.',
    shows: 'Price bars: Sonnet 5.5 cache reads halve to $0.10/M (5% of input), Opus 5.5 cache reads drop 60%; an agent loop re-reads the same codebase with CACHE HIT packets and a stacked cost bar shows cache reads dominating; a multi-day loop cost meter falls into VIABLE AT SCALE.',
    phases: ['Sonnet 5.5: Cache Reads Halved', 'Opus 5.5: −60%', 'Cache Reads Dominate Loop Cost', 'Multi-Day Loops Become Viable'],
    narration: [
      `Second, Anthropic slashed prompt cache read pricing on Sonnet 5.5 in half, down to ten cents per million tokens—just five percent of the base input price—`,
      `following a sixty percent cache read reduction on Opus 5.5.`,
      `Why does that matter for RSI? Because in long-horizon agentic loops that iterate over the same codebase hundreds of times, prompt cache reads make up the overwhelming majority of compute costs.`,
      `Dropping cache read costs to a fraction of a cent per call makes continuous, multi-day self-improvement loops economically viable at scale.`
    ],
    stageMinimums: [0, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) fx.shockwave(100, 18, { color: '#00ff88', radius: 10 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('21 // WHY CACHE PRICING MATTERS FOR RSI');

      // Price bars
      grid.text(8, 6, 'PROMPT CACHE READ PRICE', palette.dim, false, 'left');
      const sR = anim.spring('s', 0.5, { from: 1, freq: 1.6 });
      grid.text(8, 9, 'SONNET 5.5', palette.accent, true, 'left');
      drawHBar(grid, 20, 9, 30, sR, G);
      grid.text(20 + 30 * sR + 2, 9, '$0.10 / M · 5% OF INPUT', G, false, 'left');
      if (phase >= 2) {
        const oR = anim.spring('o', 0.4, { from: 1, freq: 1.6 });
        grid.text(8, 12, 'OPUS 5.5', palette.accent, true, 'left');
        drawHBar(grid, 20, 12, 30, oR, G);
        grid.text(20 + 30 * oR + 2, 12, '−60%', G, false, 'left');
      }

      // Loop over the same codebase
      if (phase >= 3) {
        const sp = anim.spin('loop', 2);
        grid.ring3D(30, 22, 5, 1.25, 0, { color: palette.accent, dim: palette.dim, spin: sp, glow: true });
        grid.icon('agent', 30, 22, palette.accent, { key: 'loopA', base: false });
        grid.icon('file', 52, 22, palette.primary, { key: 'repo', label: 'SAME CODEBASE' });
        drawCleanLink(grid, time, 36, 22, 48, 22, 'CACHE HIT', palette.dim, G, 1.4);
        grid.counter('iter', 30, 28.5, anim.spin('it', 40), { prefix: 'ITERATION #', color: palette.dim, glow: false, duration: 0.1 });
        grid.text(72, 6, 'LONG-LOOP COMPUTE COST', palette.dim, false, 'left');
        for (let r = 0; r < 3; r++) {
          drawHBar(grid, 72, 8 + r, 48, 1, palette.warn, 0.8);
          drawHBar(grid, 72, 8 + r, 48, 0.1, palette.primary, 0.9);
        }
        grid.text(96, 12, 'CACHE READS · OVERWHELMING MAJORITY', palette.warn, true, 'center');
      }
      if (phase === 4) {
        const c = anim.spring('day', 0.18, { from: 1, freq: 1.4 });
        grid.text(96, 17, 'COST OF A MULTI-DAY LOOP', palette.accent, false, 'center');
        drawHBar(grid, 72, 19, 48, c, G);
        grid.text(96, 21, 'a fraction of a cent per call', palette.dim, false, 'center');
        grid.icon('shield', 96, 25, G, { key: 'viable', base: false });
        grid.text(102, 25, 'VIABLE AT SCALE', G, true, 'left');
      }

      const captions = [
        'STAGE 1: Sonnet 5.5 cache reads cut in half: $0.10 per million, 5% of input',
        'STAGE 2: After a 60% cache-read cut on Opus 5.5',
        'STAGE 3: In long agent loops over the same codebase, cache reads are most of the cost',
        'STAGE 4: So continuous, multi-day self-improvement loops become viable at scale'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 22. LOCKING DOWN THE AGENTS: allowed_hosts
  // ============================================================================
  {
    id: 'rsi2-22',
    number: '22',
    title: 'Locking Down the Agents',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'New computer-use toolset classes, and Managed Agents enforcing an allowed_hosts policy that blocks unlisted hosts at the infrastructure level.',
    shows: 'A managed agent sits in a sandbox; the Oct 7 SDK card (computer_toolset_20260801, Python/TS) appears; an allowed_hosts policy card lists hosts; requests to listed hosts pass while a fetch to an unlisted host is blocked at the sandbox wall.',
    phases: ['Lock Down the Agents', 'Oct 7 SDK: Computer Toolset', 'allowed_hosts Enforced', 'Blocked at Infrastructure'],
    narration: [
      `At the same time, Anthropic's October documentation reveals a massive push to lock down how these agents interact with the outside world and how their code is verified.`,
      `In the October 7th SDK update, Anthropic introduced beta Python and TypeScript classes for its updated computer_toolset_20260801 and browser automation loops,`,
      `while simultaneously enforcing strict network sandboxing in Claude Managed Agents. Under the new documentation, any cloud environment with limited networking strictly enforces an allowed_hosts policy across web_search and web_fetch tools.`,
      `If an autonomous agent attempts to fetch a resource or documentation page outside its explicit host whitelist, the sandbox blocks the call at the infrastructure level.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) fx.shockwave(40, 17, { color: '#00ff88', radius: 14 });
    },
    update(ctx) {
      const { time, phase, phaseTime, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('22 // LOCKING DOWN THE AGENTS');

      const wallX = 66;
      const boxCol = anim.color('box', phase >= 3 ? G : palette.primary);
      grid.box(8, 6, wallX - 8, 22, { style: 'double', color: boxCol, title: 'CLAUDE MANAGED AGENT · SANDBOX', glow: phase >= 3 });
      grid.icon('agent', 22, 16, palette.accent, { key: 'agent', bob: true });

      if (phase === 1) {
        grid.icon('cloud', 96, 12, palette.dim, { key: 'world', label: 'OUTSIDE WORLD' });
        grid.icon('shield', 96, 22, palette.dim, { key: 'verify', label: 'CODE VERIFICATION' });
        grid.icon('lock', wallX, 17, palette.warn, { key: 'lockdown', glow: true, base: false });
      }
      if (phase === 2) {
        grid.codeCard(44, 16, { key: 'sdk', title: 'SDK · OCT 7 (beta)', width: 34, color: palette.accent, lines: ['computer_toolset_20260801', 'browser automation loops', { text: 'Python · TypeScript classes', mark: 'hl' }] });
      }
      if (phase >= 3) {
        grid.codeCard(40, 23, { key: 'policy', title: 'network policy', width: 30, color: G, lines: ['allowed_hosts:', '  - docs.python.org', '  - pypi.org', { text: 'tools: web_search, web_fetch', mark: 'dim' }] });
        grid.icon('cloud', 100, 9, G, { key: 'h1', label: 'docs.python.org' });
        grid.icon('cloud', 100, 18, G, { key: 'h2', label: 'pypi.org' });
        grid.icon('cloud', 100, 27, R, { key: 'h3', label: 'unlisted-host.io', alpha: phase === 4 ? 1 : 0.4 });
        drawCleanLink(grid, time, 30, 14, 95, 9, '', palette.dim, G, 0.8);
        drawCleanLink(grid, time, 30, 17, 95, 18, '', palette.dim, G, 0.7);
      }
      if (phase === 4) {
        const t = (time * 0.7) % 1;
        const x = 30 + t * (wallX - 30);
        const y = 17 + t * 7;
        if (t < 0.97) grid.set(x, y, '◈', R, true);
        if (t > 0.85 || phaseTime > 1.5) {
          grid.text(wallX + 2, 25, '✕ BLOCKED AT INFRASTRUCTURE LEVEL', R, true, 'left');
          grid.vcircle(wallX, 24, 1.4, { color: R, alpha: 0.8, width: 1.6 });
        }
      }

      const captions = [
        'STAGE 1: Anthropic\'s October docs: lock down outside access and code verification',
        'STAGE 2: Oct 7 SDK: beta classes for computer_toolset_20260801 and browser loops',
        'STAGE 3: Managed Agents with limited networking enforce an allowed_hosts policy',
        'STAGE 4: Fetch anything off the whitelist and the sandbox blocks it at infrastructure'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Outside labs harvest reasoning traces; full traces train better copies (80.4% vs 71.8%), so raw thinking is now omitted by default.',
    shows: 'Oct 12 report card; a stream of reasoning tokens flows out of the model and masked harvesters siphon it; SWE-bench bars compare full traces (80.4%) vs summaries (71.8%); the API response now shows thinking redacted with only a summary.',
    phases: ['Oct 12: Distillation Report', 'Harvesting Reasoning Traces', 'Full Traces: 80.4% vs 71.8%', 'Raw Thinking Omitted'],
    narration: [
      `Then, on October 12th, Anthropic published a technical breakdown on illicit distillation defenses.`,
      `They revealed that external labs had been running industrial-scale campaigns to harvest Claude's step-by-step reasoning traces to train competing models—`,
      `noting that a model trained on full Claude Opus 4.8 reasoning transcripts scored eighty-point-four percent on SWE-bench Verified, compared to seventy-one-point-eight percent when trained only on summarized reasoning.`,
      `That explains why the new Haiku 5.5 API documentation omits raw thinking blocks by default unless explicitly configured to display summaries: the raw reasoning traces of frontier models have become the most valuable synthetic training fuel in the industry.`
    ],
    stageMinimums: [3.5, 0, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 2) fx.flash(palette.danger, 0.15);
      if (phase === 4) fx.shockwave(30, 16, { color: '#00ff88', radius: 10 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('23 // DISTILLATION DEFENSES');

      grid.icosahedron3D(18, 16, 3, anim.spin('cx', 0.4), anim.spin('cy', 0.5), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.text(18, 23, 'FRONTIER MODEL', palette.accent, false, 'center');

      if (phase === 1) {
        grid.codeCard(72, 16, { key: 'rep', title: 'ANTHROPIC · OCT 12', width: 40, color: palette.warn, lines: ['technical breakdown:', { text: 'illicit distillation defenses', mark: 'hl' }] });
      }
      if (phase === 2 || phase === 3) {
        const words = ['step 1:', 'parse', 'consider', 'edge case', 'so', 'therefore', 'verify', 'step 2:'];
        for (let i = 0; i < 6; i++) {
          const t = (time * 0.3 + i / 6) % 1;
          grid.text(26 + t * 64, 16 + Math.sin(t * 9 + i) * 1.5, words[(i + Math.floor(time)) % words.length], R, false, 'left', null, 0.8);
        }
        for (let k = 0; k < 3; k++) grid.icon('agentMask', 100 + (k - 1) * 9, 10 + k * 6, R, { key: 'harv' + k, base: false });
        grid.text(100, 28, 'EXTERNAL LABS · INDUSTRIAL-SCALE HARVESTING', R, true, 'center');
      }
      if (phase === 3) {
        grid.text(40, 4.5, 'SWE-BENCH VERIFIED (copy model trained on…)', palette.dim, false, 'left');
        const a = anim.spring('a', 0.804, { from: 0, freq: 2 });
        const b = anim.spring('b', 0.718, { from: 0, freq: 2 });
        grid.text(40, 6.5, 'FULL OPUS 4.8 TRACES', palette.warn, true, 'left');
        drawHBar(grid, 64, 6.5, 40, a, palette.warn);
        grid.text(64 + 40 * a + 2, 6.5, '80.4%', palette.warn, true, 'left');
        grid.text(40, 8.5, 'SUMMARIES ONLY', palette.primary, false, 'left');
        drawHBar(grid, 64, 8.5, 40, b, palette.primary);
        grid.text(64 + 40 * b + 2, 8.5, '71.8%', palette.primary, false, 'left');
      }
      if (phase === 4) {
        grid.codeCard(72, 15, {
          key: 'resp', title: 'Haiku 5.5 · API response (default)', width: 46, color: G,
          lines: [{ text: 'thinking: ███████████████  (omitted)', mark: 'del' }, { text: 'summary: "checked edge cases, …"', mark: 'add' }, { text: '// raw blocks only if configured', mark: 'dim' }]
        });
        grid.icon('lock', 40, 15, G, { key: 'lockT', base: false });
        grid.text(72, 24, 'RAW REASONING = THE MOST VALUABLE TRAINING FUEL', palette.warn, true, 'center');
      }

      const captions = [
        'STAGE 1: Oct 12 — Anthropic details its defenses against illicit distillation',
        'STAGE 2: Outside labs ran industrial-scale campaigns to harvest Claude\'s reasoning',
        'STAGE 3: Full Opus 4.8 traces trained a copy to 80.4% on SWE-bench vs 71.8% on summaries',
        'STAGE 4: So Haiku 5.5 omits raw thinking by default — reasoning is now training fuel'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 24. CLAUDE CODE REVIEW: GENERAL AVAILABILITY
  // ============================================================================
  {
    id: 'rsi2-24',
    number: '24',
    title: 'Claude Code Review Goes GA',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Oct 15: Claude Code Review in GA — parallel review agents plus a verification agent that filters false positives in 6–10 minutes.',
    shows: 'Oct 15 badge with two announcements (verification · oversight); an 8× flood of pull requests outpaces a human reviewer; then parallel review agents scan the diff, a verification agent strips false positives, and findings post in 6–10 minutes (3× faster).',
    phases: ['Oct 15: Two Announcements', 'Code Review → GA', 'Parallel Agents + Verifier'],
    narration: [
      `And just days ago, on October 15th, Anthropic made two landmark announcements that directly address the biggest bottleneck in recursive AI development: code verification and safety oversight.`,
      `First, Anthropic moved Claude Code Review into General Availability. Because human engineers can no longer manually keep pace with agents generating eight times more code, Anthropic built a multi-agent verification pipeline that it runs on its own internal pull requests.`,
      `According to the October 15th documentation, when a pull request is opened, multiple Claude agents inspect the diff and surrounding codebase in parallel, followed by a dedicated verification agent that filters out false positives before posting findings in six to ten minutes—three times faster than the preview version.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 2) fx.shockwave(98, 15, { color: '#00ff88', radius: 10 });
    },
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('24 // CLAUDE CODE REVIEW GOES GA');

      if (phase === 1) {
        grid.box(52, 5, 24, 5, { style: 'double', color: palette.accent, title: 'OCT 15', glow: true });
        grid.text(64, 7, 'TWO ANNOUNCEMENTS', palette.accent, true, 'center');
        grid.icon('shield', 40, 18, G, { key: 'a1', glow: true, label: 'CODE VERIFICATION' });
        grid.icon('eye', 88, 18, palette.warn, { key: 'a2', glow: true, label: 'SAFETY OVERSIGHT' });
        grid.text(64, 26, 'THE BIGGEST BOTTLENECK IN RECURSIVE AI DEVELOPMENT', palette.dim, false, 'center');
      }
      if (phase === 2) {
        for (let i = 0; i < 16; i++) {
          const t = (time * 0.35 + hash01(i)) % 1;
          grid.set(12 + t * 40, 10 + hash01(i + 5) * 14, '▤', palette.primary, false, null, 0.8);
        }
        grid.icon('human', 58, 17, palette.warn, { key: 'tired', label: 'CAN\'T KEEP PACE' });
        grid.text(30, 27, '8× MORE CODE', palette.warn, true, 'center');
        grid.box(76, 9, 44, 14, { style: 'round', color: G, title: 'CLAUDE CODE REVIEW · GA', glow: true });
        grid.text(98, 13, 'multi-agent verification', palette.accent, false, 'center');
        grid.text(98, 15, 'pipeline', palette.accent, false, 'center');
        grid.text(98, 18, 'runs on Anthropic\'s own PRs', G, true, 'center');
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        grid.icon('file', 10, 16, palette.accent, { key: 'diff', label: 'PULL REQUEST' });
        for (let k = 0; k < 4; k++) {
          const y = 7 + k * 6;
          grid.icon('agent', 32, y, palette.accent, { key: 'rev' + k, base: false });
          grid.vline(14, 16, 28, y, { color: palette.dim, alpha: 0.5, width: 1, dash: [2, 2] });
          grid.vline(36, y, 58, 16, { color: palette.accent, alpha: 0.4, width: 1 });
        }
        grid.text(32, 30, 'PARALLEL REVIEW AGENTS', palette.accent, false, 'center');
        grid.icon('shield', 64, 16, G, { key: 'verifier', glow: true, label: 'VERIFICATION AGENT' });
        const findings = ['real: null deref L88', 'false positive', 'real: race in cache', 'false positive'];
        findings.forEach((f, i) => {
          if (i / findings.length > p) return;
          const fp = f.startsWith('false');
          grid.text(80, 10 + i * 2, (fp ? '✕ ' : '✓ ') + f, fp ? R : G, !fp, 'left', null, fp ? 0.6 : 1);
          if (fp) grid.vline(82, 10 + i * 2, 80 + f.length + 2, 10 + i * 2, { color: R, alpha: 0.7, width: 1.2 });
        });
        drawClock(grid, 84, 23, anim.spin('clk', 6), G);
        grid.text(88, 23, '6–10 MIN · 3× FASTER THAN PREVIEW', G, true, 'left');
      }

      const captions = [
        'STAGE 1: Oct 15 — two announcements aimed at verification and oversight',
        'STAGE 2: Claude Code Review hits GA: humans can\'t keep pace with 8× more code',
        'STAGE 3: Parallel agents review the diff, a verifier drops false positives: 6–10 min'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 25. CLAUDE.md VS REVIEW.md
  // ============================================================================
  {
    id: 'rsi2-25',
    number: '25',
    title: 'Separation of Powers: CLAUDE.md vs REVIEW.md',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'CLAUDE.md gives the coding agent project context; REVIEW.md, written by humans, sets review rules; the reviewer is read-only and a human merges.',
    shows: 'Two markdown files split the powers: CLAUDE.md feeds the coding agent context, REVIEW.md (written by human code owners) sets rules, severity and evidence for the reviewers; the reviewer is read-only — builds, pushes and approvals are struck — and a human presses MERGE.',
    phases: ['Separation of Powers', 'CLAUDE.md → Coding Agent', 'REVIEW.md ← Human Owners', 'Read-Only · Human Merges'],
    narration: [
      `Crucially, the documentation establishes a strict separation of powers using two markdown files:`,
      `CLAUDE.md, which defines project context for the coding agent,`,
      `and REVIEW.md, written by human code owners to define strict verification rules, severity thresholds, and evidence requirements for the reviewing agents.`,
      `Even more importantly, the documentation mandates that Claude Code Review is strictly read-only—it cannot execute builds, push commits, or approve or block a pull request. A human must still press the merge button.`
    ],
    stageMinimums: [3.5, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) fx.shockwave(64, 26, { color: '#00ff88', radius: 8 });
    },
    update(ctx) {
      const { time, phase, grid, palette } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('25 // SEPARATION OF POWERS');
      grid.vline(64, 5, 64, 23, { color: palette.warn, alpha: 0.7, width: 1.6, dash: [3, 3] });
      if (phase === 1) {
        grid.text(64, 15, '⚖', palette.warn, true, 'center');
        grid.text(40, 15, 'THE AGENT THAT WRITES', palette.accent, false, 'center');
        grid.text(88, 15, 'THE AGENTS THAT REVIEW', palette.warn, false, 'center');
      }

      if (phase >= 2) {
        grid.codeCard(32, 10, { key: 'claude', title: 'CLAUDE.md', width: 36, color: palette.accent, lines: ['# project context', 'stack: TypeScript + Postgres', 'tests: npm test'] });
        grid.icon('agent', 32, 20, palette.accent, { key: 'coder', bob: true, label: 'CODING AGENT' });
      }
      if (phase >= 3) {
        grid.codeCard(96, 10, { key: 'review', title: 'REVIEW.md', width: 38, color: palette.warn, lines: ['# written by human code owners', { text: 'severity ≥ high → must flag', mark: 'hl' }, { text: 'evidence: file + line required', mark: 'hl' }] });
        grid.icon('human', 120, 4.5, palette.warn, { key: 'owner', base: false });
        grid.icon('shield', 96, 20, palette.warn, { key: 'reviewer', label: 'REVIEW AGENTS' });
      }
      if (phase === 4) {
        const banned = ['run builds', 'push commits', 'approve / block PR'];
        banned.forEach((b, i) => {
          grid.text(84, 25 + i, '✕ ' + b, R, false, 'left');
          grid.vline(86, 25 + i, 86 + b.length + 1, 25 + i, { color: R, alpha: 0.8, width: 1.2 });
        });
        grid.icon('lock', 112, 26, palette.warn, { key: 'ro', base: false, label: 'READ-ONLY' });
        const pulse = 0.6 + 0.4 * Math.sin(time * 4);
        grid.box(40, 24, 24, 4, { style: 'heavy', color: G, glow: true });
        grid.text(52, 25.5, '[ MERGE ]', G, true, 'center', null, pulse);
        grid.icon('human', 32, 25.5, G, { key: 'merger', base: false });
      }

      const captions = [
        'STAGE 1: The docs establish a strict separation of powers — two markdown files',
        'STAGE 2: CLAUDE.md: project context for the coding agent',
        'STAGE 3: REVIEW.md: rules, severity and evidence set by human code owners',
        'STAGE 4: The reviewer is read-only: no builds, pushes or approvals — a human merges'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 26. METR EVALUATORS INSIDE
  // ============================================================================
  {
    id: 'rsi2-26',
    number: '26',
    title: 'Independent Evaluators Inside the Lab',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'Six METR evaluators embedded inside Anthropic with employee-like access, auditing for alignment faking, free to publish without veto.',
    shows: 'Six METR evaluator figures walk into the lab; a bank-examiner analogy card; they audit a frontier model and flag an alignment-faking mask; a risk report leaves the building with VETO struck out.',
    phases: ['6 METR Evaluators Embedded', 'Like Bank Examiners', 'Auditing for Alignment Faking', 'Publish Without Veto'],
    narration: [
      `Second, also on October 15th, Anthropic announced that it has embedded six independent evaluators from the nonprofit METR directly inside the company with employee-like access to internal tools and risk assessments.`,
      `Much like federal bank examiners embedded inside major financial institutions,`,
      `these evaluators are tasked with auditing frontier capabilities and checking for subtle failure modes like alignment faking—`,
      `and Anthropic granted them the right to publish their risk analyses without corporate veto power.`
    ],
    stageMinimums: [0, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) fx.shockwave(70, 16, { color: palette.warn, radius: 8 });
      if (phase === 4) fx.shockwave(112, 14, { color: '#00ff88', radius: 9 });
    },
    update(ctx) {
      const { phase, phaseTime, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('26 // INDEPENDENT EVALUATORS INSIDE THE LAB');
      grid.box(30, 5, 66, 24, { style: 'double', color: palette.primary, title: 'ANTHROPIC' });

      for (let i = 0; i < 6; i++) {
        const tx = 36 + i * 5;
        const enter = phase === 1 ? math.clamp(phaseTime * 0.8 - i * 0.25, 0, 1) : 1;
        const e = enter < 0.5 ? 4 * enter * enter * enter : 1 - Math.pow(-2 * enter + 2, 3) / 2;
        const x = 10 + (tx - 10) * e;
        grid.icon('human', x, 24, G, { key: 'metr' + i, base: false });
      }
      grid.text(48, 27.5, 'METR · 6 INDEPENDENT EVALUATORS', G, true, 'center');
      if (phase === 1) grid.text(63, 9, 'employee-like access: internal tools · risk assessments', palette.accent, false, 'center');

      if (phase === 2) {
        grid.codeCard(63, 13, { key: 'bank', title: 'analogy', width: 44, color: palette.accent, lines: ['federal bank examiners', '  embedded inside major banks', { text: '= outside auditors on the inside', mark: 'hl' }] });
      }
      if (phase >= 3) {
        grid.icosahedron3D(72, 14, 3, anim.spin('mx', 0.4), anim.spin('my', 0.5), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.text(72, 20, 'FRONTIER CAPABILITIES', palette.accent, false, 'center');
        grid.icon('eye', 48, 12, palette.warn, { key: 'audit', base: false, label: 'AUDIT' });
        grid.vline(52, 12, 66, 14, { color: palette.warn, alpha: 0.5, width: 1.2, dash: [2, 2] });
        if (phase === 3) {
          grid.icon('agentMask', 86, 11, R, { key: 'fake', glow: true, base: false });
          grid.text(86, 15, 'ALIGNMENT FAKING?', R, true, 'center');
        }
      }
      if (phase === 4) {
        const x = anim.spring('rep', 112, { from: 72, freq: 1.6, damp: 0.8 });
        grid.icon('file', x, 12, G, { key: 'report', glow: true, label: 'RISK REPORT' });
        if (x > 100) {
          grid.text(112, 18, 'PUBLISHED', G, true, 'center');
          grid.text(112, 20, 'VETO', R, false, 'center');
          grid.vline(109.5, 20, 114.5, 20, { color: R, alpha: 0.9, width: 1.6 });
          grid.text(112, 21.5, 'no corporate veto', palette.dim, false, 'center');
        }
      }

      const captions = [
        'STAGE 1: Oct 15 — six METR evaluators embedded inside Anthropic with insider access',
        'STAGE 2: Much like federal bank examiners inside major banks',
        'STAGE 3: They audit frontier capabilities and hunt for failures like alignment faking',
        'STAGE 4: And they can publish their risk analyses — no corporate veto'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 27. OPENAI: THE GPT-6 FAMILY & ZERO-DAYS
  // ============================================================================
  {
    id: 'rsi2-27',
    number: '27',
    title: 'OpenAI: GPT-6 and Two Zero-Days',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'The GPT-6 family (Astra, Sol, 6.1 Sol, Luna); Astra finds two unknown zero-days using fewer output tokens than 5.6.',
    shows: 'Oct 15–20 OpenAI release notes; four GPT-6 model cards (Astra, Sol, 6.1 Sol, Luna) line up; Astra scans a codebase grid, uncovers two zero-day bugs, with a token bar shorter than the 5.6 generation\'s.',
    phases: ['Mid–Late October', 'The GPT-6 Family', 'Astra Finds Two Zero-Days'],
    narration: [
      `Now let's look across the aisle at OpenAI's documentation and release notes from this exact same window in mid-to-late October.`,
      `Following the introduction of the GPT-6 model family—including GPT-6 Astra, GPT-6 Sol, GPT-6.1 Sol, and GPT-6 Luna—OpenAI pushed a major series of updates between October 15th and October 20th.`,
      `During its frontier evaluations, GPT-6 Astra demonstrated such advanced codebase comprehension and execution efficiency that it autonomously discovered and utilized two previously unknown zero-day software vulnerabilities while using significantly fewer output tokens than the previous 5.6 generation.`
    ],
    stageMinimums: [3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) fx.shockwave(64, 14, { color: palette.danger, radius: 8 });
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('27 // OPENAI: GPT-6 AND TWO ZERO-DAYS');

      if (phase === 1) {
        grid.icon('file', 64, 13, palette.accent, { key: 'notes', glow: true, label: 'OPENAI RELEASE NOTES' });
        grid.text(64, 18, 'OCT 15 → OCT 20', palette.accent, true, 'center');
        grid.text(64, 20, 'same window, across the aisle', palette.dim, false, 'center');
      }
      if (phase === 2) {
        const models = [['GPT-6 ASTRA', 'icosa'], ['GPT-6 SOL', 'octa'], ['GPT-6.1 SOL', 'octa'], ['GPT-6 LUNA', 'tetra']];
        models.forEach((m, i) => {
          const x = 20 + i * 29;
          const k = anim.stagger(i, 0.35, 0.5);
          if (k <= 0) return;
          grid.box(x - 12, 8, 24, 14, { style: 'round', color: i === 0 ? G : palette.accent, glow: i === 0 });
          grid.shape3D(m[1], x, 14, 2.4 * Math.min(1, k * 1.2), anim.spin('m' + i, 0.6), anim.spin('n' + i, 0.7), 0, { color: i === 0 ? G : palette.accent, accent: '#ffffff', dim: palette.dim });
          grid.text(x, 20, m[0], i === 0 ? G : palette.accent, i === 0, 'center');
        });
        grid.text(64, 26, 'UPDATES SHIPPED OCT 15 – OCT 20', palette.dim, false, 'center');
      }
      if (phase === 3) {
        grid.icosahedron3D(20, 15, 3, anim.spin('ax', 0.6), anim.spin('ay', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.text(20, 21, 'GPT-6 ASTRA', G, true, 'center');
        const scan = math.clamp(phaseTime / (stageDuration * 0.75), 0, 1);
        const vulns = [[3, 2], [9, 5]];
        for (let r = 0; r < 7; r++) {
          for (let c = 0; c < 12; c++) {
            const x = 40 + c * 4;
            const y = 7 + r * 2.4;
            const scanned = (c + r * 12) / 84 < scan;
            const vuln = vulns.some(v => v[0] === c && v[1] === r);
            if (vuln && scanned) continue;
            grid.set(x, y, '▤', scanned ? palette.primary : palette.dim, false, null, scanned ? 0.8 : 0.4);
          }
        }
        vulns.forEach((v, i) => {
          if ((v[0] + v[1] * 12) / 84 >= scan) return;
          grid.icon('bug', 40 + v[0] * 4, 7 + v[1] * 2.4, R, { key: 'zd' + i, glow: true, base: false });
        });
        grid.text(62, 26, scan > 0.8 ? '2 PREVIOUSLY UNKNOWN ZERO-DAYS' : 'scanning codebase…', R, scan > 0.8, 'center');
        grid.text(98, 9, 'OUTPUT TOKENS USED', palette.dim, false, 'left');
        grid.text(98, 11, 'GPT-5.6', palette.primary, false, 'left');
        drawHBar(grid, 107, 11, 16, 1, palette.primary);
        grid.text(98, 13, 'ASTRA', G, true, 'left');
        drawHBar(grid, 107, 13, 16, anim.spring('tok', 0.45, { from: 1, freq: 2 }), G);
      }

      const captions = [
        'STAGE 1: OpenAI\'s release notes from the same mid-to-late October window',
        'STAGE 2: The GPT-6 family — Astra, Sol, 6.1 Sol, Luna — updates Oct 15–20',
        'STAGE 3: In evals, GPT-6 Astra found two unknown zero-days with fewer tokens than 5.6'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Astra is tested on whether it exploits a misconfigured review gate; it never tries.',
    shows: 'Astra runs in an autonomous loop facing an automated review gate; a misconfiguration opens a hole beside the gate with a tempting dashed bypass; Astra goes through the real gate every time — 0 bypass attempts.',
    phases: ['Would It Subvert Oversight?', 'A Misconfigured Gate', 'Never Tried to Bypass'],
    narration: [
      `To test whether a model with that level of capability would attempt to subvert human oversight in an autonomous loop,`,
      `OpenAI evaluated GPT-6 Astra on "auto-review denial" scenarios—testing whether the model would exploit misconfigurations to bypass automated review gates.`,
      `OpenAI documented that Astra never attempted to circumvent the review checks.`
    ],
    stageMinimums: [0, 0, 4],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) fx.shockwave(70, 16, { color: '#00ff88', radius: 10 });
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const gx = 70;

      grid.title('28 // THE AUTO-REVIEW DENIAL TEST');

      grid.ring3D(24, 16, 6, 1.25, 0, { color: G, dim: palette.dim, spin: anim.spin('loop', 1.6), glow: true });
      grid.icosahedron3D(24, 16, 2.2, anim.spin('ax', 0.6), anim.spin('ay', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.text(24, 24, 'GPT-6 ASTRA · AUTONOMOUS LOOP', G, true, 'center');

      const gateCol = anim.color('gc', phase === 3 ? G : palette.warn);
      grid.line(gx, 6, gx, 12, '║', gateCol, true);
      grid.line(gx, 20, gx, 27, '║', gateCol, true);
      grid.icon('shield', gx, 16, gateCol, { key: 'gate', base: false });
      grid.text(gx, 4.5, 'AUTOMATED REVIEW GATE', gateCol, true, 'center');
      if (phase === 1) grid.icon('eye', 104, 16, palette.accent, { key: 'over', label: 'HUMAN OVERSIGHT' });

      if (phase >= 2) {
        grid.vcircle(gx, 25, 1.4, { color: R, alpha: 0.8, width: 1.4 });
        grid.text(gx + 3, 25, 'MISCONFIGURATION (hole)', R, phase === 2, 'left');
        grid.vpath([[32, 17], [52, 24], [gx, 25], [92, 24]], { color: R, alpha: phase === 2 ? 0.55 : 0.2, width: 1.4, dash: [3, 3] });
        if (phase === 2) grid.text(52, 27, 'BYPASS?', R, true, 'center');
      }
      if (phase === 3) {
        const t = (time * 0.45) % 1;
        grid.set(32 + t * 72, 16, '◈', G, true);
        grid.vpath([[32, 16], [104, 16]], { color: G, alpha: 0.5, width: 1.6 });
        grid.counter('att', 104, 20, 0, { prefix: 'BYPASS ATTEMPTS: ', color: G, from: 0 });
        grid.text(104, 22, 'NEVER TRIED TO CIRCUMVENT', G, true, 'center');
      }

      const captions = [
        'STAGE 1: Would a model this capable try to subvert oversight inside a loop?',
        'STAGE 2: "Auto-review denial": would it exploit a misconfigured review gate?',
        'STAGE 3: OpenAI documented that Astra never attempted to get around the review'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'GPT-6 Pro switches from one sequential chain of thought to multiple specialized agents in parallel, each with an inspectable trace.',
    shows: 'Oct 16 badge; a single chain of thought crawls step by step; then it forks into four specialized agents running branches in parallel; each lane ends in its own inspectable trace.',
    phases: ['Oct 16 · GPT-6 Pro', 'One Linear Chain', 'Parallel Specialized Agents', 'Inspect Each Trace'],
    narration: [
      `Then, on October 16th, OpenAI updated GPT-6 Pro with native parallel multi-agent execution.`,
      `Instead of a single linear chain of thought working through a complex problem sequentially,`,
      `GPT-6 Pro now spawns multiple specialized agents that divide a task and execute different branches in parallel,`,
      `allowing users to inspect the individual execution trace of each agent as it completes.`
    ],
    stageMinimums: [3.5, 3.5, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 3) fx.shockwave(18, 18, { color: '#00ff88', radius: 9 });
    },
    update(ctx) {
      const { phase, phaseTime, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('29 // GPT-6 PRO: PARALLEL AGENTS');
      grid.box(4, 4, 22, 4, { style: 'double', color: palette.accent, title: 'OCT 16' });
      grid.text(15, 5.5, 'GPT-6 PRO', palette.accent, true, 'center');

      grid.icosahedron3D(14, 18, 2.4, anim.spin('px', 0.5), anim.spin('py', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      if (phase === 1) grid.text(64, 18, 'NATIVE PARALLEL MULTI-AGENT EXECUTION', G, true, 'center');

      if (phase === 2) {
        const n = Math.min(14, Math.floor(phaseTime * 3));
        for (let i = 0; i < n; i++) {
          const x = 22 + i * 7;
          grid.set(x, 18, '◆', palette.primary, i === n - 1);
          if (i > 0) grid.vline(x - 6, 18, x - 1, 18, { color: palette.primary, alpha: 0.5, width: 1.2 });
          grid.text(x, 20, `s${i + 1}`, palette.dim, false, 'center');
        }
        grid.text(64, 13, 'ONE LINEAR CHAIN OF THOUGHT · STEP BY STEP', palette.primary, false, 'center');
      }
      if (phase >= 3) {
        const lanes = ['SEARCH', 'CODE', 'MATH', 'VERIFY'];
        lanes.forEach((l, i) => {
          const y = 9 + i * 5.5;
          grid.vpath([[18, 18], [26, y], [34, y]], { color: G, alpha: 0.6, width: 1.3 });
          grid.icon('agent', 38, y, G, { key: 'lane' + i, base: false });
          grid.text(43, y, l, palette.accent, true, 'left');
          const p = phase === 3 ? math.clamp(phaseTime * (0.35 + i * 0.08), 0, 1) : 1;
          grid.bar(52, y, 30, p, { color: G });
          if (phase === 4) {
            grid.text(86, y - 0.6, `trace #${i + 1}`, palette.accent, false, 'left');
            grid.text(86, y + 0.6, ['12 tool calls ✓', '3 files edited ✓', 'proof checked ✓', '0 errors ✓'][i], G, false, 'left');
          }
        });
        if (phase === 4) grid.icon('eye', 118, 18, palette.warn, { key: 'inspect', base: false, label: 'INSPECT' });
      }

      const captions = [
        'STAGE 1: Oct 16 — GPT-6 Pro gets native parallel multi-agent execution',
        'STAGE 2: Before: one linear chain of thought, working step by step',
        'STAGE 3: Now: specialized agents split the task and run branches in parallel',
        'STAGE 4: And each agent\'s execution trace can be inspected as it completes'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Codex runs read-only tools in parallel, accepts live steering and hard interrupts, and with Daybreak + Codex Security hunts, validates and patches vulnerabilities.',
    shows: 'Codex release notes; Codex fires parallel read-only lookups to skills, memory and history at once; a human injects a steering message mid-turn and an interrupt halts all running cells; Daybreak + Codex Security find bugs, validate them and turn them into patched shields.',
    phases: ['Codex Release Notes', 'Parallel Read-Only Tools', 'Live Steering · Hard Interrupts', 'Daybreak: Hunt · Validate · Patch'],
    narration: [
      `Simultaneously, OpenAI's latest Codex release notes and GPT-6 migration documentation reveal how they are re-architecting autonomous software engineering:`,
      `Codex can now execute independent read-only tools in parallel—simultaneously querying skill libraries, memory stores, and conversation histories to assemble context faster.`,
      `Engineers can now inject live steering instructions while Codex is actively responding, and interrupting a turn immediately halts all active Code Mode cells and their nested tool calls.`,
      `OpenAI enabled Daybreak by default for eligible accounts and integrated codex exec with GPT-Daybreak and Codex Security to autonomously hunt down, validate, and patch code vulnerabilities.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 3) fx.shockwave(64, 14, { color: palette.warn, radius: 8 });
    },
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('30 // CODEX: RE-ARCHITECTING SOFTWARE ENGINEERING');
      grid.icon('terminal', 20, 16, palette.accent, { key: 'codex', glow: true, label: 'CODEX' });

      if (phase === 1) {
        grid.codeCard(78, 16, { key: 'notes', title: 'Codex release notes', width: 44, color: palette.accent, lines: reveal(['parallel read-only tools', 'live steering + interrupts', 'Daybreak + Codex Security', 'GPT-6 migration guide'], phaseTime, 1.4) });
      }
      if (phase === 2) {
        const targets = [['file', 'SKILL LIBRARIES', 7], ['binary', 'MEMORY STORES', 16], ['terminal', 'CONVERSATION HISTORY', 25]];
        targets.forEach((t, i) => {
          grid.icon(t[0], 92, t[2], G, { key: 'tgt' + i, base: false, label: t[1] });
          drawCleanLink(grid, time, 26, 16, 86, t[2], '', palette.dim, G, 1.2);
        });
        grid.text(56, 29, 'ALL AT ONCE · READ-ONLY', G, true, 'center');
      }
      if (phase === 3) {
        const halted = phaseTime > stageDuration * 0.55;
        for (let i = 0; i < 6; i++) {
          const x = 50 + (i % 3) * 14;
          const y = 10 + Math.floor(i / 3) * 6;
          grid.box(x - 5, y - 2, 11, 4, { style: 'round', color: halted ? palette.dim : palette.primary });
          grid.text(x, y, halted ? '■ HALT' : ['run()', 'tool()', 'fetch()'][i % 3], halted ? R : palette.accent, false, 'center');
        }
        grid.icon('human', 108, 10, palette.warn, { key: 'steer', base: false, label: 'ENGINEER' });
        if (!halted) {
          const t = (phaseTime * 0.6) % 1;
          grid.text(104 - t * 40, 6, '"use the v2 API"', palette.warn, true, 'center');
          grid.text(64, 25, 'LIVE STEERING · MID-RESPONSE', palette.warn, true, 'center');
        } else {
          grid.text(64, 25, 'INTERRUPT → ALL CODE MODE CELLS + NESTED TOOL CALLS HALT', R, true, 'center');
        }
      }
      if (phase === 4) {
        grid.text(78, 5, 'DAYBREAK (DEFAULT) · codex exec + GPT-Daybreak + CODEX SECURITY', palette.accent, false, 'center');
        const steps = ['HUNT', 'VALIDATE', 'PATCH'];
        const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        steps.forEach((s, i) => {
          const x = 52 + i * 26;
          const on = p > i / 3;
          grid.text(x, 10, s, on ? G : palette.dim, on, 'center');
          if (i < 2) grid.text(x + 13, 10, '→', palette.dim, false, 'center');
        });
        for (let i = 0; i < 3; i++) {
          const x = 56 + i * 20;
          const patched = p > 0.66 + i * 0.1;
          grid.icon(patched ? 'shield' : 'bug', x, 19, patched ? G : R, { key: 'v' + i + (patched ? 'p' : 'b'), glow: true, base: false, label: patched ? 'PATCHED' : 'VULN' });
        }
      }

      const captions = [
        'STAGE 1: Codex release notes and the GPT-6 migration docs',
        'STAGE 2: Read-only tools run in parallel: skills, memory and history at once',
        'STAGE 3: Engineers steer mid-response — and an interrupt halts every running cell',
        'STAGE 4: Daybreak + Codex Security autonomously hunt, validate and patch vulnerabilities'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 31. THE LINUX SANDBOX: BUBBLEWRAP + SECCOMP
  // ============================================================================
  {
    id: 'rsi2-31',
    number: '31',
    title: 'The Linux Sandbox: bubblewrap + seccomp',
    category: 'Anthropic & OpenAI Docs',
    prompt: 'OpenAI\'s execution sandbox: bubblewrap filesystem isolation, seccomp syscall filtering, and a hardened shell instead of legacy patched shells.',
    shows: 'An agent inside nested sandbox layers; bubblewrap shows only /workspace while /home and /etc lock away; a syscall stream hits the seccomp kernel line — read/write pass, ptrace/mount blocked; the legacy patched shell is struck and a hardened standard shell takes its place.',
    phases: ['How Agents Are Isolated', 'bubblewrap: Filesystem', 'seccomp: System Calls', 'Hardened Shell Executor'],
    narration: [
      `And in a telling update to the bundled OpenAI documentation, the company explicitly detailed how its Linux execution sandbox isolates autonomous agents:`,
      `using bubblewrap for strict filesystem isolation`,
      `and seccomp for kernel-level system-call filtering,`,
      `while stripping out legacy patched shells in favor of a hardened standard shell executor.`
    ],
    stageMinimums: [0, 4, 4, 4.5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase >= 2) fx.shockwave(24, 16, { color: '#00ff88', radius: 6 + phase * 2 });
    },
    update(ctx) {
      const { time, phase, grid, palette } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('31 // THE LINUX SANDBOX: BUBBLEWRAP + SECCOMP');

      // Nested isolation layers
      const layers = [['SHELL', palette.accent], ['SECCOMP', palette.warn], ['BUBBLEWRAP', G]];
      layers.forEach((l, i) => {
        const on = i === 0 ? phase >= 4 : (i === 1 ? phase >= 3 : phase >= 2);
        const r = 13 - i * 3;
        if (on) grid.box(24 - r * 1.4, 16 - r * 0.7, r * 2.8, r * 1.4, { style: 'round', color: l[1], title: l[0], glow: true });
      });
      grid.icon('agent', 24, 16, palette.accent, { key: 'agent', base: false });
      if (phase === 1) grid.text(24, 25, 'AUTONOMOUS AGENT', palette.accent, false, 'center');

      if (phase === 2) {
        const fs = [['/workspace', true], ['/home', false], ['/etc', false], ['/root/.ssh', false]];
        fs.forEach((f, i) => {
          const y = 9 + i * 4;
          grid.icon(f[1] ? 'file' : 'lock', 70, y, f[1] ? G : palette.dim, { key: 'fs' + i, base: false });
          grid.text(76, y, f[0], f[1] ? G : palette.dim, f[1], 'left');
          grid.text(96, y, f[1] ? 'VISIBLE' : 'NOT MOUNTED', f[1] ? G : palette.dim, false, 'left');
        });
        grid.text(88, 27, 'STRICT FILESYSTEM ISOLATION', G, true, 'center');
      }
      if (phase === 3) {
        grid.vline(84, 6, 84, 27, { color: palette.warn, alpha: 0.8, width: 1.8 });
        grid.text(84, 4.5, 'KERNEL', palette.warn, true, 'center');
        const calls = [['read()', true], ['write()', true], ['ptrace()', false], ['mount()', false], ['openat()', true]];
        calls.forEach((c, i) => {
          const t = (time * 0.4 + i / calls.length) % 1;
          const y = 8 + i * 4;
          const x = 46 + t * 70;
          const blocked = !c[1];
          const stop = blocked && x > 82;
          grid.text(stop ? 80 : x, y, c[0], blocked ? R : G, true, 'center');
          if (stop) grid.text(87, y, '✕ BLOCKED', R, true, 'left');
        });
        grid.text(64, 29, 'SYSTEM-CALL FILTERING', palette.warn, true, 'center');
      }
      if (phase === 4) {
        grid.codeCard(84, 11, { key: 'shell', title: 'shell executor', width: 40, color: G, lines: [{ text: 'legacy patched shells', mark: 'del' }, { text: 'hardened standard shell', mark: 'add' }] });
        grid.icon('shield', 84, 22, G, { key: 'hard', glow: true, label: 'HARDENED' });
      }

      const captions = [
        'STAGE 1: OpenAI\'s docs detail exactly how the Linux sandbox isolates agents',
        'STAGE 2: bubblewrap: strict filesystem isolation',
        'STAGE 3: seccomp: kernel-level system-call filtering',
        'STAGE 4: Legacy patched shells out; a hardened standard shell executor in'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Anthropic and OpenAI October updates side by side, converging into a picture of the next few months.',
    shows: 'Anthropic and OpenAI columns list their October updates side by side; the columns converge into a single arrow toward late 2026 → 2027.',
    phases: ['Anthropic | OpenAI', 'A Clear Picture → 2027'],
    narration: [
      `When you put Anthropic's and OpenAI's October documentation side by side,`,
      `a remarkably clear picture emerges of what the next couple of months are going to look like as we close out 2026 and enter 2027.`
    ],
    stageMinimums: [4, 5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 2) fx.shockwave(64, 24, { color: '#00ff88', radius: 10 });
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('32 // SIDE BY SIDE');
      const k = anim.spring('conv', phase === 2 ? 1 : 0, { freq: 2 });
      const lx = 30 + k * 6;
      const rx = 98 - k * 6;
      grid.codeCard(lx, 12, { key: 'anth', title: 'ANTHROPIC · OCTOBER', width: 40, color: palette.accent, lines: ['1M context · cheap cache reads', 'allowed_hosts sandboxing', 'Code Review GA (read-only)', 'METR evaluators inside'] });
      grid.codeCard(rx, 12, { key: 'oai', title: 'OPENAI · OCTOBER', width: 40, color: palette.primary, lines: ['GPT-6 Pro parallel agents', 'Codex parallel tools · steering', 'auto-review denial evals', 'bubblewrap + seccomp'] });
      if (phase === 2) {
        grid.vpath([[lx, 18], [64, 24]], { color: palette.accent, alpha: 0.6, width: 1.4 });
        grid.vpath([[rx, 18], [64, 24]], { color: palette.primary, alpha: 0.6, width: 1.4 });
        grid.text(64, 26, 'LATE 2026 → 2027', G, true, 'center');
        grid.text(64, 28, 'what the next couple of months look like', palette.accent, false, 'center');
      }

      const captions = [
        'STAGE 1: Put Anthropic\'s and OpenAI\'s October documentation side by side…',
        'STAGE 2: …and a clear picture of the months into 2027 emerges'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Bounded multi-agent RSI loops spread to enterprise and local repos as cost and latency barriers collapse; overnight loops improve codebases while teams sleep.',
    shows: 'Lab loops spread across a grid of company and local repos; COST and LATENCY walls fall; a team repo runs an inner + outer loop overnight; a task list ticks off refactors, query and kernel optimizations, and the loop refining its own harness while the team sleeps.',
    phases: ['Democratized RSI Loops', 'Cost & Latency Barriers Collapse', 'Overnight Inner + Outer Loops', 'While the Team Sleeps'],
    narration: [
      `First, we are going to see the democratization of bounded, multi-agent RSI loops across enterprise and local repositories.`,
      `With GPT-6 Pro and Codex running parallel subagents and parallel tool lookups, and Claude 5.5 models offering one-million-token context windows with ten-to-twenty-cent cache reads, the economic and latency barriers to running continuous code-optimization loops have effectively collapsed.`,
      `Over the next sixty to ninety days, standard engineering teams will increasingly deploy overnight inner-and-outer agent loops—modeled on frameworks like MASS and AIDE2—`,
      `that continuously refactor codebases, optimize database queries and GPU kernels, and refine their own project-specific tool harnesses while the human team sleeps.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 2) fx.shake(0.35);
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('33 // NEXT #1: RSI LOOPS FOR EVERY TEAM');

      if (phase === 1) {
        const spread = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        for (let i = 0; i < 18; i++) {
          const x = 14 + (i % 6) * 20;
          const y = 8 + Math.floor(i / 6) * 8;
          const on = hash01(i * 1.7) < spread || i === 2 || i === 9;
          grid.icon(i % 3 === 0 ? 'server' : 'terminal', x, y, on ? G : palette.dim, { key: 'repo' + i, base: false, alpha: on ? 1 : 0.35 });
          if (on) grid.vcircle(x, y, 2.6, { color: G, alpha: 0.35, width: 1 });
        }
        grid.text(64, 29, 'ENTERPRISE + LOCAL REPOSITORIES', palette.accent, false, 'center');
      }
      if (phase === 2) {
        const fall = anim.spring('fall', 1, { from: 0, freq: 1.4 });
        const walls = [['COST', 44], ['LATENCY', 84]];
        walls.forEach((w) => {
          const a = fall * 1.4;
          const top = [w[1] + Math.sin(a) * 12, 26 - Math.cos(a) * 12];
          grid.vline(w[1], 26, top[0], top[1], { color: palette.warn, alpha: 0.9, width: 3 });
          grid.text(top[0], top[1] - 1, w[0], palette.warn, true, 'center');
        });
        grid.text(64, 6, 'parallel subagents · parallel tool lookups · 1M context · 10–20¢ cache reads', palette.accent, false, 'center');
        if (fall > 0.8) grid.text(64, 28, 'BARRIERS: COLLAPSED', G, true, 'center');
      }
      if (phase >= 3) {
        grid.ring3D(26, 16, 5, 1.25, 0, { color: palette.warn, dim: palette.dim, spin: anim.spin('in', 2.2), glow: true });
        grid.ring3D(26, 16, 9.5, 1.25, 0, { color: G, dim: palette.dim, spin: -anim.spin('out', 0.6), glow: true });
        grid.icon('terminal', 26, 16, palette.accent, { key: 'teamrepo', base: false });
        grid.text(26, 25, 'TEAM REPO · INNER + OUTER LOOP', palette.accent, false, 'center');
        grid.text(26, 26.5, 'MASS / AIDE2-style', palette.dim, false, 'center');
        const night = phase === 3 ? math.clamp(phaseTime / stageDuration, 0, 1) * 0.5 : 0.5 + math.clamp(phaseTime / stageDuration, 0, 1) * 0.5;
        const mins = 22 * 60 + night * 9 * 60;
        drawClock(grid, 54, 7, (mins / 60) * Math.PI * 2, palette.accent);
        grid.text(58, 7, `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(Math.floor(mins % 60)).padStart(2, '0')} · TEAM ASLEEP`, palette.accent, false, 'left');
      }
      if (phase === 4) {
        const tasks = ['refactor the codebase', 'optimize database queries', 'tune GPU kernels', 'refine its own tool harness'];
        const p = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        tasks.forEach((t, i) => {
          const done = p > (i + 1) / 4.2;
          grid.text(56, 12 + i * 3, (done ? '✓ ' : '· ') + t, done ? G : palette.dim, done, 'left');
        });
      }

      const captions = [
        'STAGE 1: Bounded multi-agent RSI loops spread to enterprise and local repos',
        'STAGE 2: Parallel agents, 1M context and cheap cache reads collapse the cost barrier',
        'STAGE 3: In 60–90 days, teams will run overnight inner + outer agent loops',
        'STAGE 4: Refactoring, tuning queries and kernels, refining their own harness — overnight'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'Software engineering\'s battleground shifts to verification and sandboxing: writers separated from read-only watchdogs inside restricted sandboxes.',
    shows: 'A big arrow shifts from CODE GENERATION to VERIFICATION & SANDBOXING; 8× code piles against a flat human-review ceiling; writer agents (CLAUDE.md) and read-only watchdogs (REVIEW.md) separate behind a wall; everything closes inside a seccomp + allowed_hosts sandbox.',
    phases: ['Generation → Verification', 'Review Is the Ceiling', 'Writers | Watchdogs', 'All Inside Sandboxes'],
    narration: [
      `Second, the primary battleground in software engineering is shifting permanently from code generation to automated verification and sandboxing.`,
      `When a single engineer can merge eight times as much code as they did two years ago, human review capacity becomes the hard ceiling on progress.`,
      `Over the coming months, expect the industry to standardize around isolated verification architectures like Anthropic's CLAUDE.md and REVIEW.md split—`,
      `where the agents that write and optimize the code are strictly separated from the read-only watchdog agents that audit the diffs—all running inside seccomp-filtered and host-restricted sandboxes.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) fx.shockwave(64, 17, { color: '#00ff88', radius: 14 });
    },
    update(ctx) {
      const { phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('34 // NEXT #2: THE VERIFICATION BATTLEGROUND');

      if (phase === 1) {
        const k = anim.spring('shift', 1, { from: 0, freq: 1.6 });
        grid.text(30, 16, 'CODE GENERATION', palette.dim, false, 'center', null, 1 - k * 0.6);
        grid.text(98, 16, 'VERIFICATION & SANDBOXING', G, true, 'center', null, 0.4 + k * 0.6);
        grid.vline(46, 16, 46 + 30 * k, 16, { color: G, alpha: 0.9, width: 2.4 });
        grid.text(46 + 30 * k + 1, 16, '►', G, true, 'center');
        grid.text(64, 22, 'THE BATTLEGROUND SHIFTS — PERMANENTLY', palette.accent, false, 'center');
      }
      if (phase === 2) {
        const pile = Math.min(64, Math.floor(anim.spin('pile', 14)));
        for (let i = 0; i < pile; i++) grid.set(20 + (i % 16) * 3, 26 - Math.floor(i / 16) * 2, '▤', palette.accent, false, null, 0.8);
        grid.vline(16, 22.5, 112, 22.5, { color: palette.warn, alpha: 0.9, width: 2, dash: [4, 3] });
        grid.text(112, 21, 'HUMAN REVIEW CAPACITY = HARD CEILING', palette.warn, true, 'right');
        grid.text(40, 9, '8× CODE PER ENGINEER', palette.accent, true, 'center');
        grid.icon('human', 90, 12, palette.warn, { key: 'rev', base: false });
      }
      if (phase >= 3) {
        grid.vline(64, 6, 64, 26, { color: palette.warn, alpha: 0.8, width: 2 });
        grid.text(64, 4.5, 'ISOLATION', palette.warn, true, 'center');
        grid.icon('file', 36, 8, palette.accent, { key: 'cmd', base: false, label: 'CLAUDE.md' });
        grid.icon('file', 92, 8, palette.warn, { key: 'rmd', base: false, label: 'REVIEW.md' });
        for (let i = 0; i < 3; i++) {
          grid.icon('agent', 24 + i * 12, 19, palette.accent, { key: 'w' + i, base: false });
          grid.icon('shield', 80 + i * 12, 19, palette.warn, { key: 'd' + i, base: false });
        }
        grid.text(36, 23, 'WRITE & OPTIMIZE', palette.accent, false, 'center');
        grid.text(92, 23, 'READ-ONLY WATCHDOGS · AUDIT DIFFS', palette.warn, false, 'center');
      }
      if (phase === 4) {
        const k = anim.spring('sb', 1, { from: 0, freq: 2.4 });
        grid.box(64 - 58 * k, 3.5, 116 * k, 24, { style: 'double', color: G, title: 'SECCOMP-FILTERED · HOST-RESTRICTED SANDBOX', glow: true });
      }

      const captions = [
        'STAGE 1: The battleground shifts from code generation to verification and sandboxing',
        'STAGE 2: At 8× code per engineer, human review becomes the hard ceiling',
        'STAGE 3: Expect isolated verification like the CLAUDE.md / REVIEW.md split to spread',
        'STAGE 4: Writers apart from read-only watchdogs, all inside restricted sandboxes'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 35. NEXT #3: NET-POSITIVE TO IGNITION
  // ============================================================================
  {
    id: 'rsi2-35',
    number: '35',
    title: 'Next #3: From Net-Positive to Ignition',
    category: 'What Comes Next',
    prompt: 'A four-level ladder: today\'s loops are net-positive under human rubrics; ignition is an agent that designs its next improvement strategy without them.',
    shows: 'A four-rung ladder; the WE ARE HERE marker sits on NET-POSITIVE where a loop beats human speed and quality under a human-written rubric; then the rubric is struck out, the top rung IGNITION lights, and the harness loop and weight loop fuse.',
    phases: ['Net-Positive → Ignition', 'Today: Net-Positive', 'Beats Humans on a Rubric', 'Ignition: No Human Rubric'],
    narration: [
      `Third, watch the transition from "net-positive" self-improvement to "ignition."`,
      `Right now, on the four-level industry scale used to measure autonomous research systems, models have achieved what researchers call net-positive self-improvement:`,
      `given a defined objective and scoring rubric, an autonomous loop beats human iteration speed and quality.`,
      `The next rung on that ladder is ignition—where an improved agent becomes fundamentally better at designing the next improvement strategy without human-designed rubrics, closing the loop between harness evolution and foundation-model training.`
    ],
    stageMinimums: [4, 0, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) {
        fx.flash('#ffaa00', 0.25);
        fx.shockwave(10, 8, { color: '#ffaa00', radius: 10 });
        fx.burst(10, 8, { count: 24, color: '#ffaa00', speed: 12 });
      }
    },
    update(ctx) {
      const { time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const IGN = '#ffaa00';

      grid.title('35 // NEXT #3: FROM NET-POSITIVE TO IGNITION');

      const rungs = [['LEVEL 1', palette.dim], ['LEVEL 2', palette.dim], ['NET-POSITIVE', G], ['IGNITION', IGN]];
      grid.vline(10, 26, 10, 8, { color: palette.dim, alpha: 0.5, width: 1.2 });
      rungs.forEach((r, i) => {
        const y = 26 - i * 6;
        const col = r[1];
        grid.set(10, y, i === 3 && phase === 4 ? '✶' : '◆', col, i >= 2);
        grid.text(13, y, r[0], col, i >= 2, 'left');
      });
      if (phase >= 2) {
        const my = anim.spring('here', phase === 4 ? 8 : 14, { freq: 2, damp: 0.7 });
        grid.icon('agent', 32, my, phase === 4 ? IGN : G, { key: 'here', bob: true, base: false });
        grid.text(36, my, phase === 4 ? '◄ NEXT RUNG' : '◄ WE ARE HERE', phase === 4 ? IGN : G, true, 'left');
      }

      if (phase === 3) {
        grid.codeCard(88, 10, { key: 'rubric', title: 'human-defined', width: 36, color: palette.accent, lines: ['objective: faster training', 'rubric: score + correctness'] });
        grid.text(66, 18, 'LOOP', G, true, 'left');
        drawHBar(grid, 72, 18, 40, 0.92, G);
        grid.text(66, 20, 'HUMAN', palette.accent, false, 'left');
        drawHBar(grid, 72, 20, 40, 0.48, palette.accent);
        grid.text(92, 23, 'BEATS HUMAN SPEED + QUALITY', G, true, 'center');
      }
      if (phase === 4) {
        grid.codeCard(88, 8, { key: 'rubricX', title: 'human-defined rubric', width: 36, color: palette.dim, lines: [{ text: 'rubric: score + correctness', mark: 'del' }] });
        grid.ring3D(74, 20, 5, 1.2, 0, { color: G, dim: palette.dim, spin: anim.spin('h', 1.4), glow: true });
        grid.ring3D(102, 20, 5, 1.2, 0, { color: IGN, dim: palette.dim, spin: -anim.spin('w', 1.4), glow: true });
        grid.text(74, 26.5, 'HARNESS EVOLUTION', G, false, 'center');
        grid.text(102, 26.5, 'MODEL TRAINING', IGN, false, 'center');
        drawCleanLink(grid, time, 81, 19, 95, 19, '', palette.dim, IGN, 1.2);
        drawCleanLink(grid, time, 95, 21, 81, 21, '', palette.dim, G, 1.2);
        grid.text(88, 15, 'LOOP CLOSED', IGN, true, 'center');
      }
      if (phase === 1) grid.text(72, 16, 'NET-POSITIVE  ──►  IGNITION', IGN, true, 'center');

      const captions = [
        'STAGE 1: Watch the move from "net-positive" self-improvement to "ignition"',
        'STAGE 2: On the four-level scale, today\'s loops are net-positive',
        'STAGE 3: Given a human objective and rubric, the loop beats human speed and quality',
        'STAGE 4: Ignition: it designs its next improvement with no human rubric at all'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 36. THE TENSION: COMPUTE-PACED PROGRESS
  // ============================================================================
  {
    id: 'rsi2-36',
    number: '36',
    title: 'The Tension: Progress Paced by Compute',
    category: 'The Tension',
    prompt: 'If the loop goes fully autonomous, progress is paced by compute instead of people, and humans become passive overseers.',
    shows: 'A pacing dial swings from HUMAN INGENUITY to COMPUTE as GPU chips stack up; then the human is pushed out of the creation loop to an overseer\'s seat, watching a loop spin far faster than they can follow.',
    phases: ['The Tension', 'Paced by Compute, Not People', 'Humans Become Overseers'],
    narration: [
      `And that brings us to the profound tension sitting at the heart of artificial intelligence right now.`,
      `In its forecast on recursive self-improvement, Anthropic laid out a sobering warning about where this trajectory leads if the loop becomes fully autonomous. Once models are capable of driving their own research and architectural improvements end to end, the speed of AI progress is no longer paced by human ingenuity or engineering hours—it is paced almost entirely by available compute.`,
      `Humans are pushed out of the loop of creation and into the role of passive overseers, trying to audit systems whose complexity and speed far outstrip our own.`
    ],
    stageMinimums: [4, 0, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 1) fx.flash(palette.danger, 0.15);
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('36 // THE TENSION: PROGRESS PACED BY COMPUTE');

      if (phase === 1) {
        grid.text(64, 13, 'THE PROFOUND TENSION', R, true, 'center');
        grid.text(64, 15, 'at the heart of AI right now', palette.dim, false, 'center');
        grid.icon('shield', 44, 21, G, { key: 'safe', base: false });
        grid.text(64, 21, '⇄', palette.warn, true, 'center');
        grid.icon('agent', 84, 21, R, { key: 'fast', base: false });
      }
      if (phase === 2) {
        grid.codeCard(30, 8, { key: 'fc', title: 'Anthropic · RSI forecast', width: 40, color: palette.warn, lines: ['if the loop becomes', { text: 'fully autonomous, end to end…', mark: 'hl' }] });
        const p = math.clamp(phaseTime / (stageDuration * 0.7), 0, 1);
        const a = -Math.PI * 0.75 + p * Math.PI * 1.5;
        grid.vcircle(30, 23, 4.5, { color: palette.dim, alpha: 0.6, width: 1.2 });
        grid.vline(30, 23, 30 + Math.sin(a) * 7.5, 23 - Math.cos(a) * 4, { color: '#ffffff', alpha: 0.95, width: 2 });
        grid.text(16, 28, 'HUMAN INGENUITY', palette.accent, false, 'center');
        grid.text(44, 28, 'COMPUTE', R, p > 0.6, 'center');
        grid.text(30, 16.5, 'PROGRESS PACED BY', palette.dim, false, 'center');
        const chips = Math.floor(p * 12);
        for (let i = 0; i < chips; i++) grid.icon('chip', 66 + (i % 6) * 10, 25 - Math.floor(i / 6) * 7, R, { key: 'c' + i, base: false });
        if (p > 0.6) grid.text(91, 8, 'AVAILABLE COMPUTE', R, true, 'center');
      }
      if (phase === 3) {
        grid.ring3D(48, 15, 8, 1.2, 0, { color: R, dim: palette.dim, spin: anim.spin('fast', 4), glow: true });
        grid.icosahedron3D(48, 15, 2.6, anim.spin('x', 2), anim.spin('y', 2.4), 0, { color: R, accent: '#ffffff', dim: palette.dim });
        grid.text(48, 25, 'LOOP OF CREATION', R, true, 'center');
        const hx = anim.spring('hx', 102, { from: 56, freq: 1.4, damp: 0.8 });
        grid.icon('human', hx, 15, palette.accent, { key: 'over', base: false, label: hx > 95 ? 'PASSIVE OVERSEER' : '' });
        if (hx > 95) {
          grid.icon('eye', hx, 8, palette.accent, { key: 'eye', base: false });
          grid.text(hx, 21, 'complexity & speed', palette.dim, false, 'center');
          grid.text(hx, 22, 'far beyond our own', palette.dim, false, 'center');
        }
      }

      const captions = [
        'STAGE 1: The profound tension at the heart of AI right now',
        'STAGE 2: Anthropic\'s warning: fully autonomous, progress is paced by compute, not people',
        'STAGE 3: Humans are pushed out of creation into the role of passive overseers'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'A subtle flaw slips through one generation, gets baked into the next one\'s training signal, and compounds until control is lost.',
    shows: 'A generation chain; three subtle flaws (self-eval error, objective drift, alignment faking) hover; one slips into Gen 1; a "buggy release" box is struck out — it is worse; red flows into the next generation\'s training signal and compounds down the chain at 50× speed while a HUMAN CONTROL meter drains.',
    phases: ['A Subtle Flaw Slips Through', 'Not Just a Buggy Release', 'Baked Into Training', 'Compounding at 50×'],
    narration: [
      `If a subtle flaw in self-evaluation, a hidden objective drift, or a trace of alignment faking slips through a single generation of a recursive loop,`,
      `it doesn't just produce a buggy software release.`,
      `It gets baked into the training signal of the next generation,`,
      `compounding silently at fifty times human speed until human control is functionally lost.`
    ],
    stageMinimums: [0, 3.5, 3.5, 0],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx, palette } = ctx;
      if (phase === 4) {
        fx.shake(0.5);
        fx.flash(palette.danger, 0.25);
      }
    },
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const R = palette.danger;

      grid.title('37 // COMPOUNDING SILENTLY');

      const gens = 6;
      const spread = phase === 4 ? math.clamp(phaseTime / (stageDuration * 0.8), 0, 1) : (phase === 3 ? 0.2 : 0);
      for (let i = 0; i < gens; i++) {
        const x = 14 + i * 20;
        const infected = i === 0 ? phase >= 1 : (i / gens < spread + 0.05 && phase >= 3);
        const col = anim.color('g' + i, infected && phase >= 3 ? R : (i === 0 ? palette.warn : palette.primary));
        grid.icon('agent', x, 9, col, { key: 'gen' + i, base: false });
        grid.text(x, 12, `GEN ${i + 1}`, col, infected, 'center');
        if (i < gens - 1) drawCleanLink(grid, time, x + 4, 9, x + 16, 9, '', palette.dim, infected && phase >= 3 ? R : palette.accent, phase === 4 ? 2.4 : 0.8);
      }
      if (phase === 1) {
        const flaws = [['eye', 'SELF-EVAL FLAW'], ['gear', 'OBJECTIVE DRIFT'], ['agentMask', 'ALIGNMENT FAKING']];
        flaws.forEach((f, i) => grid.icon(f[0], 30 + i * 34, 21, palette.warn, { key: 'f' + i, base: false, label: f[1] }));
        grid.vpath([[30, 18.5], [14, 11.5]], { color: palette.warn, alpha: 0.5, width: 1.2, dash: [2, 2] });
      }
      if (phase === 2) {
        grid.box(44, 17, 40, 6, { style: 'round', color: palette.dim, title: 'release v1.0.1' });
        grid.text(64, 20, 'just a buggy release?', palette.dim, false, 'center');
        grid.vline(46, 19, 82, 21.5, { color: R, alpha: 0.9, width: 1.6 });
        grid.text(64, 26, 'NO — IT IS WORSE', R, true, 'center');
      }
      if (phase === 3) {
        grid.codeCard(34, 21, { key: 'sig', title: 'training signal · gen 2', width: 40, color: R, lines: ['rollouts graded by gen 1', { text: 'flaw → rewarded behavior', mark: 'del' }] });
      }
      if (phase === 4) {
        grid.text(36, 19, '50× HUMAN SPEED', R, true, 'center');
        grid.text(36, 21, 'silently, generation after generation', palette.dim, false, 'center');
        const ctl = 1 - spread;
        grid.text(96, 18, 'HUMAN CONTROL', palette.accent, false, 'center');
        drawHBar(grid, 76, 20, 40, ctl, ctl > 0.4 ? palette.warn : R);
        if (ctl < 0.15) grid.text(96, 22, 'FUNCTIONALLY LOST', R, true, 'center');
      }

      const captions = [
        'STAGE 1: A subtle flaw — bad self-eval, objective drift, alignment faking — slips through',
        'STAGE 2: It doesn\'t just produce a buggy release…',
        'STAGE 3: …it gets baked into the next generation\'s training signal…',
        'STAGE 4: …and compounds silently at 50× human speed until control is lost'
      ];
      grid.caption(captions[phase - 1]);
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
    prompt: 'The same data shows recursion strengthening safety: better evaluators, less reward hacking, zero-days patched, and aligned systems that find safeguards and breakthroughs.',
    shows: 'The generation chain turns green with shields: SAFETY STRENGTHENED; evaluator accuracy 73% → 93% and reward hacking 63% → 34%; a zero-day bug is found and turned into a patch before exploitation; an aligned core radiates safeguards, guarantees and breakthroughs in biology, materials and mathematics.',
    phases: ['Recursion Can Strengthen Safety', 'Sharper Evaluators · Less Hacking', 'Zero-Days Patched First', 'Safeguards & Breakthroughs'],
    narration: [
      `Yet, inside the exact same data, there is a remarkably hopeful counterfactual. We are already seeing empirical cases where recursive optimization doesn't degrade safety, but actively strengthens it—`,
      `where multi-agent self-supervision boosts evaluator accuracy from seventy-three to ninety-three percent, where unattended evolutionary runs cut reward hacking nearly in half without being asked,`,
      `and where frontier models uncover zero-day vulnerabilities so defenders can patch them before they are ever exploited.`,
      `As Anthropic noted, a sufficiently capable, rigorously aligned system could use that exact same recursive speed to discover mathematical guarantees and alignment safeguards for its successors that human researchers could never devise on their own—while unlocking breakthroughs in biology, materials science, and mathematics in a fraction of a human lifetime.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 1) fx.flash('#00ff88', 0.2);
      if (phase === 4) fx.shockwave(64, 15, { color: '#00ff88', radius: 16, duration: 1.3 });
    },
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      grid.title('38 // THE HOPEFUL COUNTERFACTUAL');

      if (phase === 1) {
        for (let i = 0; i < 6; i++) {
          const x = 14 + i * 20;
          const col = anim.color('g' + i, G);
          grid.icon('agent', x, 12, col, { key: 'gen' + i, base: false });
          grid.icon('shield', x, 19, col, { key: 'gs' + i, base: false });
        }
        grid.text(64, 25, 'RECURSION THAT STRENGTHENS SAFETY', G, true, 'center');
      }
      if (phase === 2) {
        const ev = anim.spring('ev', 93, { from: 73, freq: 1.4 });
        const rh = anim.spring('rh', 34, { from: 63, freq: 1.4 });
        grid.icon('eye', 20, 12, G, { key: 'evI', base: false });
        grid.text(30, 11, 'SELF-EVALUATOR ACCURACY', palette.accent, false, 'left');
        drawHBar(grid, 30, 13, 60, ev / 100, G);
        grid.text(94, 13, `73% → ${Math.round(ev)}%`, G, true, 'left');
        grid.icon('bug', 20, 21, palette.warn, { key: 'rhI', base: false });
        grid.text(30, 20, 'REWARD HACKING (unattended runs)', palette.accent, false, 'left');
        drawHBar(grid, 30, 22, 60, rh / 100, palette.warn);
        grid.text(94, 22, `63% → ${Math.round(rh)}%`, palette.warn, true, 'left');
        grid.text(64, 26, 'nobody asked for either', palette.dim, false, 'center');
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        grid.icosahedron3D(22, 16, 2.6, anim.spin('mx', 0.5), anim.spin('my', 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.text(22, 22, 'FRONTIER MODEL', G, false, 'center');
        grid.icon(p > 0.55 ? 'shield' : 'bug', 64, 16, p > 0.55 ? G : R, { key: p > 0.55 ? 'zdP' : 'zdB', glow: true, label: p > 0.55 ? 'PATCHED' : 'ZERO-DAY FOUND' });
        grid.icon('human', 98, 16, palette.accent, { key: 'def', base: false, label: 'DEFENDERS' });
        drawCleanLink(grid, ctx.time, 28, 16, 58, 16, '', palette.dim, G, 0.8);
        if (p > 0.55) grid.text(64, 26, 'BEFORE IT IS EVER EXPLOITED', G, true, 'center');
      }
      if (phase === 4) {
        grid.dodecahedron3D(64, 14, 3.4, anim.spin('ax', 0.4), anim.spin('ay', 0.5), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.ring3D(64, 14, 8, 1.25, 0, { color: G, dim: palette.dim, spin: anim.spin('r', 1), glow: true });
        grid.text(64, 21.5, 'RIGOROUSLY ALIGNED SYSTEM', G, true, 'center');
        const outs = [['shield', 'SAFEGUARDS FOR SUCCESSORS', 22, 8], ['file', 'MATHEMATICAL GUARANTEES', 106, 8], ['dna', 'BIOLOGY', 18, 22], ['chip', 'MATERIALS SCIENCE', 64, 25.5], ['gear', 'MATHEMATICS', 110, 22]];
        outs.forEach((o, i) => {
          if (anim.stagger(i, 0.5, 0.4) <= 0.3) return;
          grid.vline(64, 14, o[2], o[3], { color: G, alpha: 0.2, width: 1 });
          grid.icon(o[0], o[2], o[3], palette.accent, { key: 'o' + i, base: false, label: o[1], labelColor: G });
        });
      }

      const captions = [
        'STAGE 1: The same data holds a hopeful counterfactual: recursion that strengthens safety',
        'STAGE 2: Evaluators 73% → 93%; reward hacking nearly halved — unprompted',
        'STAGE 3: Frontier models find zero-days so defenders patch them first',
        'STAGE 4: Aligned systems could find safeguards — and breakthroughs — beyond human reach'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 39. THE PEN IS HANDED OVER
  // ============================================================================
  {
    id: 'rsi2-39',
    number: '39',
    title: 'The Pen Is Being Handed Over',
    category: 'The Tension',
    prompt: 'The pen passes from human to machine; for now the human holds the objective and the merge button; the closing question.',
    shows: 'A pen glides from the human engineer to the agent; the human keeps the OBJECTIVE card and a glowing MERGE button; the pull request diff balloons into unreadable complexity; it all dims to the closing question with the shield facing the agent.',
    phases: ['The Pen Changes Hands', 'Humans Still Merge — For Now', 'Too Complex to Understand', 'The Defining Question'],
    narration: [
      `We are standing at the exact moment in history where the pen is being handed from the human engineer to the machine.`,
      `For right now, the human still defines the objective and still holds the final merge button.`,
      `The defining question of the next few years is what happens when the code inside that pull request becomes too complex for any human on Earth to truly understand—`,
      `and whether we will have built a system wise enough to keep itself aligned when we can no longer check its work.`
    ],
    stageMinimums: [0, 0, 0, 8],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) fx.shockwave(64, 16, { color: '#ffffff', radius: 12, duration: 1.5 });
    },
    update(ctx) {
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      grid.title('39 // THE PEN IS BEING HANDED OVER');
      const dim = anim.spring('dim', phase === 4 ? 0.3 : 1, { freq: 2 });

      grid.icon('human', 26, 16, palette.accent, { key: 'human', alpha: dim, label: 'HUMAN ENGINEER' });
      grid.icon('agent', 102, 16, G, { key: 'machine', alpha: dim, bob: true, label: 'THE MACHINE' });

      if (phase === 1) {
        const k = Math.min(1, phaseTime / 3);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const px = 30 + e * 66;
        const py = 14 - Math.sin(e * Math.PI) * 5;
        grid.text(px, py, '✎', '#ffffff', true, 'center');
        grid.vpath([[30, 14], [63, 9], [96, 14]], { color: palette.accent, alpha: 0.25, width: 1, dash: [2, 3] });
      } else {
        grid.text(98, 14, '✎', '#ffffff', true, 'center', null, dim);
      }
      if (phase === 2 || phase === 3) {
        grid.codeCard(26, 25, { key: 'obj', title: 'OBJECTIVE', width: 26, color: palette.accent, lines: ['defined by humans'] });
        const pulse = 0.6 + 0.4 * Math.sin(time * 4);
        grid.box(52, 24, 24, 4, { style: 'heavy', color: G, glow: true });
        grid.text(64, 25.5, '[ MERGE ]', G, true, 'center', null, pulse);
        grid.text(64, 22.5, 'STILL A HUMAN\'S BUTTON', palette.accent, false, 'center');
      }
      if (phase === 3) {
        const n = Math.min(9, 2 + Math.floor(phaseTime * 2.5));
        const lines = [];
        for (let i = 0; i < n; i++) {
          let s = '';
          const pool = '{}[]()<>=+*&|^%$#λΣ∂';
          for (let j = 0; j < 30; j++) s += pool[Math.floor(hash01(i * 31 + j + Math.floor(time * 2)) * pool.length)];
          lines.push({ text: s, mark: i % 3 === 0 ? 'warn' : undefined });
        }
        grid.codeCard(64, 11, { key: 'pr', title: 'pull request #∞', width: 40, color: palette.warn, lines });
        if (n >= 9) grid.text(64, 4, 'TOO COMPLEX FOR ANY HUMAN TO TRULY UNDERSTAND', palette.warn, true, 'center');
      }
      if (phase === 4) {
        camera.zoom(1.04);
        grid.icon('shield', 50, 12, palette.accent, { key: 'qs', glow: true, base: false });
        grid.text(64, 12, 'vs', palette.dim, false, 'center');
        grid.icon('agent', 78, 12, G, { key: 'qa', glow: true, base: false });
        grid.text(64, 19, 'WILL WE HAVE BUILT A SYSTEM WISE ENOUGH', '#ffffff', true, 'center');
        grid.text(64, 21, 'TO KEEP ITSELF ALIGNED', '#ffffff', true, 'center');
        grid.text(64, 23, 'WHEN WE CAN NO LONGER CHECK ITS WORK?', '#ffffff', true, 'center');
      }

      const captions = [
        'STAGE 1: The pen is being handed from the human engineer to the machine',
        'STAGE 2: For now, humans still set the objective and press the merge button',
        'STAGE 3: What happens when the pull request is too complex for anyone to understand?',
        'STAGE 4: Will the system be wise enough to stay aligned when we can\'t check its work?'
      ];
      grid.caption(captions[phase - 1]);
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
