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
    shows: 'A dim AI core with a faint ghost of its improved self; I. J. Good’s portrait, then the camera pushes into the title of his 1965 paper; the core rewrites its own code file; three generations rise.',
    phases: ['A Theoretical Threshold', 'I. J. Good, 1965', 'AI Improves Its Own Code', 'Each Gen Designs the Next'],
    captions: [
      'A dim AI core breathes at centre while the camera eases in; a faint, larger ghost of its improved self hovers over it (theory)',
      'I. J. Good’s portrait scans in; his line types on beside it — “The first ultraintelligent machine is the last invention that man need ever make” — then his 1965 paper, the camera on its title',
      'The core rewrites its own code file line by line (red → green), the camera tracking the edits',
      'Three generations grow left to right, each larger and higher, as the camera pulls back'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        camera.look(64, 18, 1 + Math.min(0.18, phaseTime * 0.03));
        const s = anim.spring('s0', 2.6, { from: 0.4, freq: 2.2 });
        grid.icosahedron3D(64, 18, s, anim.spin('a', 0.3), anim.spin('b', 0.4), 0, { color: palette.dim, accent: palette.accent, dim: palette.dim, packets: false });
        const ghost = 0.12 + 0.08 * Math.sin(time * 1.6);
        grid.dodecahedron3D(64, 18, s * 1.9, -anim.spin('a', 0.3), anim.spin('b', 0.4), 0, { color: palette.accent, accent: palette.accent, dim: palette.dim, alpha: ghost, packets: false, vertices: false });
      }
      if (phase === 2) {
        const sd = ctx.stageDuration;
        const slide = anim.spring('slide', phaseTime > sd * 0.22 ? 1 : 0, { freq: 1.4 });
        const showPaper = phaseTime > sd * 0.62;
        grid.portrait('ij-good.jpg', 64 - 26 * slide, 17, { w: 24, h: 18, mode: 'halftone', label: 'I. J. GOOD', sublabel: '1965', alpha: anim.spring('pfade', showPaper ? 0.25 : 1, { freq: 2 }), frame: !showPaper });
        if (slide > 0.05 && !showPaper) grid.quote('The first ultraintelligent machine is the last invention that man need ever make.', 'I. J. Good, 1965', 88, 16, { width: 24, size: 1.25 });
        if (showPaper) {
          grid.paper(88, 17, { title: 'Speculations Concerning the First Ultraintelligent Machine', authors: 'I. J. Good', venue: 'Advances in Computers · 1965', w: 30, h: 22, key: 'good65' });
          if (phaseTime > sd * 0.72) camera.look(76, 11, 1.45);
        }
      }
      if (phase === 3) {
        const pass = Math.floor(phaseTime * 1.6);
        const s = anim.spring('grow', 2.4 + Math.min(6, pass) * 0.22, { from: 2.2, freq: 3 });
        grid.morph3D('core', 'icosa', 38, 17, s, anim.spin('a3', 0.6), anim.spin('b3', 0.8), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.glow(38, 17, 7, palette.accent, 1);
        grid.paper(88, 17, { key: 'selfcode', venue: 'its own code', w: 28, h: 22, lines: 10, yaw: -0.18,
          lineColor: (i) => (i < pass ? G : (i === pass ? palette.danger : null)) });
        camera.look(70, 17, 1.12);
        for (let i = 0; i < 6; i++) {
          const t = (time * 0.7 + i / 6) % 1;
          grid.vdot(46 + t * 26, 17 + Math.sin(t * Math.PI * 2 + i) * 2, 1.6, { color: i % 2 ? G : palette.accent, alpha: Math.sin(t * Math.PI) });
        }
      }
      if (phase === 4) {
        camera.look(64, 17, 1.12 - Math.min(0.12, phaseTime * 0.04));
        const gens = [[30, 2.4, 'tetra'], [64, 3.2, 'octa'], [98, 4.1, 'icosa']];
        gens.forEach((g, i) => {
          const k = anim.spring('g' + i, 1, { from: 0, freq: 2.2 - i * 0.3, damp: 0.7 });
          const y = 24 - i * 5 * k;
          const col = i === 2 ? G : (i === 1 ? palette.accent : palette.primary);
          grid.shape3D(g[2], g[0], y, g[1] * Math.max(0.2, k), anim.spin('x' + i, 0.5 + i * 0.4), anim.spin('y' + i, 0.6 + i * 0.5), 0, { color: col, accent: '#ffffff', dim: palette.dim, alpha: Math.min(1, k * 1.5) });
          grid.text(g[0], y + g[1] * 1.6 + 1.5, `GEN ${i + 1}`, col, i === 2, 'center');
          if (i > 0) grid.vpath([[gens[i - 1][0] + 6, 24 - (i - 1) * 5], [g[0] - 6, y]], { color: col, alpha: 0.4, width: 1.2, dash: [2, 3] });
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
    shows: 'A 1960–2060 timeline with the "expected" marker decades out; then the evidence, one piece at a time — documentation, a benchmark chart, a release-notes feed; the marker slides back to NOW; a datacenter hall powers up as the camera pushes in.',
    phases: ['Decades Away', 'The Recent Evidence', 'No Longer Waiting', 'Running in Production'],
    captions: [
      'Timeline 1960–2060; the "expected" marker sits decades in the future',
      'The evidence arrives in turn: technical documentation · benchmark data · platform release notes',
      'Back on the timeline, the marker glides from the 2050s and locks onto NOW',
      'A 3D datacenter hall powers up, rack lights running, as the camera pushes in: in production'
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
      const { phase, phaseTime, stageDuration, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1 || phase === 3) {
        const yA = 24;
        const expYr = anim.spring('exp', phase === 3 ? 2026 : 2052, { freq: 2.2, damp: 0.75 });
        const mCol = anim.color('mCol', phase === 3 ? G : palette.warn);
        const xOf = grid.timeline(10, 118, yA, { from: 1960, to: 2060, ticks: 20, key: 'tl02',
          events: [{ at: 2026, label: 'NOW', color: palette.accent, above: false }] });
        const mx = xOf(expYr);
        grid.vdot(mx, yA, 3.4, { color: mCol, alpha: 1 });
        grid.glow(mx, yA, 4, mCol, 1.2);
        if (phase === 1) {
          grid.vline(xOf(2026) + 1.5, yA, mx - 1.5, yA, { color: palette.warn, alpha: 0.6, width: 3 });
          grid.big(mx, yA - 4, 'EXPECTED', { size: 1.1, color: palette.warn });
          grid.big((xOf(2026) + mx) / 2, 12, 'DECADES AWAY', { size: 2.4, color: palette.warn });
        } else {
          grid.big(xOf(2026), 13, 'NOW', { size: 4, color: G });
          camera.look(xOf(2026), 19, 1 + Math.min(0.2, phaseTime * 0.08));
        }
        return;
      }
      if (phase === 2) {
        const seg = stageDuration / 3;
        const which = Math.min(2, Math.floor(phaseTime / seg));
        if (which === 0) grid.paper(64, 17, { key: 'evDocs', title: 'Technical Documentation', authors: 'Anthropic · OpenAI', venue: 'Developer docs · October', w: 30, h: 22, lines: 7 });
        if (which === 1) grid.barChart(36, 6, 56, 20, [
          { value: 3, label: 'OPUS 4', color: palette.primary }, { value: 23, label: 'HUMANS', color: palette.accent }, { value: 52, label: 'MYTHOS', color: G }
        ], { format: (v) => Math.round(v) + '×', key: 'evBench' });
        if (which === 2) grid.releaseNotes(64, 17, { product: 'Platform updates', version: 'October 2026', date: 'Oct 7–20', key: 'evNotes',
          items: [{ tag: 'NEW', text: 'Claude Opus 5.5 · Sonnet 5.5 · Haiku 5.5' }, { tag: 'NEW', text: 'GPT-6 family · Codex parallel tools' }, { tag: 'SECURITY', text: 'Sandboxed agents · allowed_hosts' }] });
        return;
      }
      camera.look(64, 16, 1 + Math.min(0.1, phaseTime * 0.04));
      grid.building('hall', 64, 16, 9.5, 0.42 + Math.sin(ctx.time * 0.25) * 0.12, { tilt: 0.42, color: G, windowColor: G, key: 'prod02' });
      grid.big(64, 29.5, 'IN PRODUCTION', { size: 1.6, color: G });
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
    shows: 'Close on an engineer at a workstation receiving a single tiny snippet; the model pours code into the lab building as its windows light floor by floor, then training-step time collapses on a chart beside a racing stopwatch; it fans out to parallel subagents; verified trajectories pass a checkpoint, fill a dataset and grow a larger successor.',
    phases: ['Beyond Snippets', 'Writes Code · Optimizes Training', 'Parallel Subagents', 'Trains Its Successors'],
    captions: [
      'Close on an engineer at a 3D workstation; one tiny snippet page floats over from the model as the camera pulls back',
      'The model pours code into a 3D lab building, windows lighting floor by floor; then a training-time chart collapses beside a racing stopwatch',
      'The model fans work out to four subagents racing in parallel',
      'Trajectories stream through a verification scanner — failures drop away red, verified ones fill a dataset that grows a larger successor'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        camera.look(60, 16, 1.32 - Math.min(0.3, phaseTime * 0.06));
        grid.person(46, 8.5, { size: 9, key: 'eng' });
        grid.object('workstation', 46, 21.5, 9, 0.45, { tilt: 0.3, color: palette.accent, windowColor: palette.accent, key: 'ws3' });
        grid.text(46, 31, 'ENGINEER', palette.accent, false, 'center');
        grid.icosahedron3D(86, 9, 2.2, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.primary, accent: '#ffffff', dim: palette.dim });
        const t = (phaseTime / 2.6) % 1;
        const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        grid.paper(82 - e * 38, 10 + e * 6 - Math.sin(e * Math.PI) * 4, { key: 'snip' + Math.floor(phaseTime / 2.6), venue: 'snippet', w: 7, h: 6, lines: 2, yaw: -0.2, alpha: Math.min(1, Math.sin(t * Math.PI) * 1.6), progress: 1 });
        return;
      }
      if (phase === 2) {
        const s = math.clamp(phaseTime / stageDuration, 0, 1);
        if (s < 0.55) {
          const k = s / 0.55;
          camera.look(64, 17, 1.06);
          grid.icosahedron3D(64, 4.5, 2.2, anim.spin('a', 0.6), anim.spin('b', 0.7), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
          grid.building('lab', 64, 21, 11, 0.42 + Math.sin(time * 0.25) * 0.1, { tilt: 0.3, color: palette.primary, windowColor: G, key: 'lab3',
            litFn: (i) => hash01(i * 3.7) < k * 1.15 });
          for (let i = 0; i < 10; i++) {
            const t = (time * 0.9 + i / 10) % 1;
            grid.vdot(64 + (hash01(i) - 0.5) * 14 * t, 7 + t * 9, 1.5, { color: G, alpha: Math.sin(t * Math.PI) });
          }
          grid.big(64, 32, `${Math.round(k * 80)}% OF THE CODE`, { size: 1.2, color: G, reveal: false });
        } else {
          const k = (s - 0.55) / 0.45;
          camera.look(60, 17, 1.04);
          grid.lineChart(18, 6, 62, 20, [{ values: [100, 96, 80, 52, 30, 17, 10, 6], color: G, label: '' }], { yMax: 110, progress: Math.min(1, k * 1.4), xLabels: ['', '', '', '', '', '', '', ''], key: 'trainT' });
          grid.text(49, 29, 'training step time', palette.dim, false, 'center');
          grid.object('stopwatch', 104, 15, 9, -0.2, { tilt: 0.1, color: G, windowColor: G, handPeriod: Math.max(0.15, 1.6 - k * 1.5), key: 'sw3' });
          grid.big(104, 29, 'SUPERHUMAN', { size: 1.2, color: G });
        }
        return;
      }
      if (phase === 3) {
        grid.icosahedron3D(64, 7, 2.4, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        for (let i = 0; i < 4; i++) {
          const x = 25 + i * 26;
          const k = anim.spring('sub' + i, 1, { from: 0, freq: 2.2 + i * 0.3 });
          grid.vpath([[64, 10], [64, 13], [x, 15], [x, 15 + 3 * k]], { color: G, alpha: 0.35 * k, width: 1.2 });
          grid.icon('agent', x, 21, G, { key: 'sub' + i, alpha: k });
          drawHBar(grid, x - 8, 27, 16, math.clamp(phaseTime * (0.25 + i * 0.06), 0, 1), G);
        }
        return;
      }
      const s = math.clamp(phaseTime / stageDuration, 0, 1);
      camera.look(56 + s * 16, 17, 1.06);
      grid.icosahedron3D(12, 17, 2.4, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.scanner(42, 17, { w: 6, h: 12, state: 'scan', label: 'VERIFY', key: 'sc3', speed: 1.3 });
      for (let i = 0; i < 12; i++) {
        const t = (time * 0.32 + i / 12) % 1;
        const bad = hash01(i * 2.3) < 0.3;
        let x = 16 + t * 96;
        let y = 17 + Math.sin(t * 9 + i * 1.7) * 6 * Math.max(0, 1 - t * 2.4);
        let col = palette.accent;
        let a = Math.sin(t * Math.PI);
        if (x > 42) {
          if (bad) { col = palette.danger; y += (x - 42) * 0.5; a *= Math.max(0, 1 - (x - 42) / 12); }
          else { col = G; y = 17 + (y - 17) * 0.2; if (x > 66) a *= Math.max(0, 1 - (x - 66) / 6); }
        }
        if (a > 0.02) grid.vdot(x, y, 1.6, { color: col, alpha: a });
      }
      grid.fileGrid(72, 17, 6, 4, { filled: Math.min(1, s * 1.4), key: 'dataset3', cell: [2.8, 2.2] });
      grid.text(72, 23.5, 'verified data', G, false, 'center');
      const k = anim.spring('succ', 1.5 + s * 3, { from: 0.3, freq: 1.4, damp: 0.7 });
      grid.dodecahedron3D(104, 17, k, anim.spin('c', 0.6), anim.spin('d', 0.7), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.glow(104, 17, 4 + k * 2, G, 1.2);
      grid.text(104, 27, 'successor', G, true, 'center');
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
    shows: 'A four-chapter track along the bottom; above it each chapter previews the real thing — a bar chart, a running loop, two release-notes feeds, and a timeline heading into 2027.',
    phases: ['The Hard Data', 'Live Loop Demo', 'Two Weeks of Docs', 'The Next Few Months'],
    captions: [
      'Chapter 1 lights; a bar chart grows above it: the hard data',
      'Chapter 2 lights; a propose → run → evaluate → commit loop runs: the demo',
      'Chapter 3 lights; Anthropic and OpenAI release-notes feeds roll in: the docs',
      'Chapter 4 lights; a timeline runs on through Nov, Dec and into 2027: what comes next'
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
      const G = '#00ff88';
      const items = ['THE DATA', 'THE DEMO', 'THE DOCS', 'WHAT’S NEXT'];
      const y = 32;
      grid.vline(20, y, 108, y, { color: palette.dim, alpha: 0.35, width: 1.2 });
      const fill = anim.spring('fill', 20 + (phase - 1) * 29.3, { from: 20, freq: 2.4 });
      grid.vline(20, y, fill, y, { color: palette.accent, alpha: 0.9, width: 2 });
      items.forEach((it, i) => {
        const x = 20 + i * 29.3;
        const active = i === phase - 1;
        const col = anim.color('c' + i, active ? palette.accent : (i < phase - 1 ? palette.primary : palette.dim));
        grid.vdot(x, y, active ? 3 : 2, { color: col, alpha: 1 });
        grid.text(x, y - 2, it, col, active, 'center');
      });
      if (phase === 1) {
        grid.barChart(36, 5, 56, 19, [
          { value: 3, label: '', color: palette.dim }, { value: 8, label: '', color: palette.primary },
          { value: 23, label: '', color: palette.accent }, { value: 52, label: '', color: G }
        ], { format: () => '', key: 'ch1' });
      }
      if (phase === 2) grid.pipeline(30, 98, 13, ['propose', 'run', 'evaluate', 'commit'], { loop: true, color: G, key: 'ch2' });
      if (phase === 3) {
        grid.releaseNotes(36, 15, { product: 'Anthropic', version: 'October', width: 40, rowH: 4, key: 'cA', items: [{ tag: 'NEW', text: 'Haiku 5.5' }, { tag: 'GA', text: 'Code Review' }, { tag: 'SECURITY', text: 'allowed_hosts' }] });
        grid.releaseNotes(94, 15, { product: 'OpenAI', version: 'October', width: 40, rowH: 4, key: 'cO', color: palette.primary, items: [{ tag: 'NEW', text: 'GPT-6 family' }, { tag: 'NEW', text: 'Parallel agents' }, { tag: 'SECURITY', text: 'Codex sandbox' }] });
      }
      if (phase === 4) {
        grid.timeline(22, 106, 16, { from: 0, to: 4, ticks: 1, label: (v) => ['OCT', 'NOV', 'DEC', 'JAN 2027', 'FEB'][Math.round(v)], key: 'ch4',
          events: [{ at: 0.7, label: 'now', color: palette.accent }, { at: 3, label: '2027', color: G, above: false }] });
        const t = (ctx.time * 0.35) % 1;
        grid.vdot(22 + 84 * t, 16, 2.2, { color: '#ffffff', alpha: Math.sin(t * Math.PI) });
      }
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
    shows: 'The report "When AI Builds Itself" lands and the camera pushes in on its title; then Anthropic’s codebase as a wall of 100 files — 3 are Claude’s before Claude Code, then 80 light up green as the number counts to 80%+.',
    phases: ['"When AI Builds Itself"', 'Before Feb 2025: ~3%', 'Today: 80%+'],
    captions: [
      'The report "When AI Builds Itself" lands; the camera pushes in on its title, then the highlighted finding',
      'A wall of 100 files = the codebase; only ~3 glow green (Claude-written) before Feb 2025',
      'The wall floods green to 80 of 100 files as "80%+" counts up'
    ],
    narration: [
      `Let's start with the empirical data. In Anthropic's landmark report, "When AI Builds Itself," the company opened up its internal engineering metrics.`,
      `Prior to the research preview of Claude Code in February 2025, the percentage of Anthropic's internal codebase authored by Claude was in the low single digits.`,
      `Today, more than eighty percent of all code merged into Anthropic's production codebase is written by Claude itself.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.paper(64, 17, { title: 'When AI Builds Itself', authors: 'Anthropic', venue: 'Report · internal engineering metrics', w: 32, h: 24, highlight: 3, key: 'wabi' });
        if (phaseTime > 1.4) camera.look(64, phaseTime > 4.5 ? 15 : 8.5, phaseTime > 4.5 ? 1.45 : 1.85);
        return;
      }
      const v = anim.spring('v', phase === 3 ? 80 : 3, { from: 0, freq: phase === 3 ? 0.9 : 2.5 });
      grid.fileGrid(64, 13, 20, 5, { filled: v / 100, key: 'codebase', cell: [4.4, 3.2] });
      const col = phase === 3 ? G : palette.primary;
      grid.big(64, 28, `${Math.round(v)}%${phase === 3 && v > 79 ? '+' : ''}`, { size: 3.4, color: col, reveal: false });
      grid.text(64, 32, phase === 3 ? 'of merged code written by Claude' : 'before Claude Code · Feb 2025', palette.dim, false, 'center');
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
    shows: 'A single glowing line runs flat from 2021 to 2024 while the camera rides its leading edge; it kinks when models start running their own code, kinks again with multi-hour autonomy, and climbs to a large "8×".',
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
      const { phase, grid, palette, anim, camera } = ctx;
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
      for (const m of [2, 4, 6, 8]) grid.text(x0 - 2, yOf(m), `${m}×`, palette.dim, false, 'right');

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
      camera.look(64 + (hx - 64) * 0.12, 17 + (hy - 17) * 0.15, phase === 4 ? 1.02 : 1.08);
      if (phase === 1) grid.big(xOf(2023), yOf(1) - 3, 'FLAT', { size: 1.4, color: palette.dim });
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
    shows: 'A spec page with blank, flickering lines as the camera pushes in on its empty body; an engineer at a workstation, unsure, question marks rising over their head; then a bar chart: 26% six months ago → 76% today (+50 points).',
    phases: ['The Hardest Tasks', 'No Clear Spec', '+50 Points → 76%'],
    captions: [
      'A spec page with only a title and flickering, half-missing lines; the camera pushes in: "open-ended"',
      'An engineer at a workstation, unsure — question marks rise over their head',
      'Bar chart: success rate 26% six months ago → 76% today, "+50" between them'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.paper(64, 17, { key: 'spec', title: 'Specification', venue: 'open-ended task', w: 30, h: 24, lines: 8,
          lineColor: (i) => (Math.sin(time * 5 + i * 2.3) > 0.3 ? palette.dim : (i % 3 === 1 ? '#000000' : null)) });
        camera.look(64, 19, 1 + Math.min(0.35, phaseTime * 0.12));
        return;
      }
      if (phase === 2) {
        grid.person(64, 9, { size: 10, key: 'unsure' });
        grid.object('workstation', 64, 22, 9, 0.45, { tilt: 0.3, color: palette.accent, windowColor: palette.dim, key: 'ws7' });
        for (let i = 0; i < 4; i++) {
          const t = (time * 0.35 + i / 4) % 1;
          grid.big(56 + hash01(i) * 16, 4 - t * 3 + 2, '?', { size: 1.3 + hash01(i + 3) * 0.6, color: palette.warn, alpha: Math.sin(t * Math.PI), reveal: false });
        }
        return;
      }
      grid.barChart(40, 6, 48, 20, [
        { value: 26, label: '6 MONTHS AGO', color: palette.primary },
        { value: 76, label: 'TODAY', color: G }
      ], { yMax: 100, format: (v) => Math.round(v) + '%', valueSize: 2, key: 'hard76' });
      const k = anim.spring('plus', 1, { from: 0, freq: 1.2 });
      if (k > 0.05) {
        const pts = [];
        for (let i = 0; i <= 24; i++) {
          const t = (i / 24) * Math.min(1, k * 1.2);
          const x = 56 + (72 - 56) * t;
          const y = 17.5 + (8.2 - 17.5) * t - Math.sin(t * Math.PI) * 3;
          pts.push([x, y]);
        }
        grid.vpath(pts, { color: G, alpha: 0.85, width: 1.8, glow: true, dash: [3, 3] });
        grid.big(58, 9, '+50', { size: 2, color: G, alpha: Math.min(1, k * 1.4), align: 'right' });
      }
      grid.text(64, 32, 'success on the hardest, open-ended tasks', palette.dim, false, 'center');
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
    shows: 'A test chamber with a GPU inside — the research-loop benchmark; a new model drops in, its training-code page is rewritten while a stopwatch speeds up, and the result passes a checkpoint and is stamped PASS; then racing bars — a human 4×, Opus 4 3×, Mythos Preview 52×.',
    phases: ['The Internal Benchmark', 'Same Test, Every Model', 'Human Expert: 4×', 'Opus 4: 3×', 'Mythos Preview: 52×'],
    captions: [
      'A glass test chamber with a GPU inside: Anthropic’s research-loop benchmark; the camera pushes in',
      'A new model drops into the chamber; its training-code page is rewritten while a stopwatch speeds up; a correctness scanner passes it: PASS',
      'Bar 1: human researcher — 4× in 4–8 hours',
      'Bar 2: Claude Opus 4 (May 2025) — 3×',
      'Bar 3: Claude Mythos Preview races off to a large 52× as the camera follows it'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        camera.look(64, 16, 1 + Math.min(0.1, phaseTime * 0.04));
        grid.glassBox(64, 18, 50, 22, 30, { color: palette.accent, key: 'chamber8', rotY: 0.3 + Math.sin(time * 0.2) * 0.06, tilt: -0.22, alpha: 0.8 });
        grid.object('gpu', 64, 21, 9, 0.5 + Math.sin(time * 0.3) * 0.1, { tilt: 0.45, color: palette.accent, windowColor: G, key: 'bench' });
        grid.big(64, 4, 'RESEARCH-LOOP BENCHMARK', { size: 1.2, color: palette.accent });
        return;
      }
      if (phase === 2) {
        const s = math.clamp(phaseTime / stageDuration, 0, 1);
        if (s < 0.28) {
          const k = s / 0.28;
          grid.glassBox(64, 18, 50, 22, 30, { color: palette.dim, key: 'chamber8b', rotY: 0.3, tilt: -0.22, alpha: 0.6 });
          grid.object('gpu', 64, 24, 7, 0.5, { tilt: 0.45, color: palette.dim, windowColor: palette.dim, key: 'bench2' });
          grid.icosahedron3D(64, 3 + k * 10, 2.6, anim.spin('a', 0.6), anim.spin('b', 0.7), 0, { color: G, accent: '#ffffff', dim: palette.dim });
          grid.big(64, 32, 'NEW MODEL · SAME TEST', { size: 1.1, color: G, reveal: false });
          return;
        }
        const k = (s - 0.28) / 0.72;
        const pass = Math.floor(k * 12);
        const done = k > 0.78;
        grid.paper(34, 17, { key: 'traincode', venue: 'trains a small model', title: 'train.py', w: 26, h: 24, lines: 9, yaw: 0.16,
          lineColor: (i) => (i < pass ? G : (i === pass ? palette.warn : null)), stamp: done ? 'PASS' : '', stampColor: G });
        if (!done) {
          grid.object('stopwatch', 88, 15, 9, -0.2, { tilt: 0.1, color: palette.accent, windowColor: palette.accent, handPeriod: Math.max(0.25, 3 - k * 3.4), key: 'sw8' });
          grid.big(88, 29, `${(1 + Math.min(1, k / 0.78) * 3).toFixed(1)}× faster`, { size: 1.6, color: G, reveal: false });
        } else {
          const t = ((k - 0.78) / 0.22) * 1.6 % 1;
          grid.scanner(88, 15, { w: 12, h: 14, state: t > 0.45 ? 'pass' : 'scan', readout: 'correctness checks', key: 'sc8', speed: 1.4 });
          grid.vdot(66 + t * 44, 15, 2.4, { color: G });
          camera.look(62, 16, 1.06);
        }
        return;
      }
      const x0 = 36;
      const L = 66;
      const rows = [
        { stage: 3, label: 'HUMAN', v: 4, col: palette.accent },
        { stage: 4, label: 'OPUS 4', v: 3, col: palette.primary },
        { stage: 5, label: 'MYTHOS', v: 52, col: G }
      ];
      rows.forEach((r, i) => {
        if (phase < r.stage) return;
        const y = 9 + i * 9;
        if (i === 0) grid.person(14, y, { size: 6, key: 'researcher' });
        else grid.shape3D(i === 2 ? 'dodeca' : 'icosa', 14, y, 1.8, anim.spin('s' + i, 0.6), anim.spin('t' + i, 0.7), 0, { color: r.col, accent: '#ffffff', dim: palette.dim });
        grid.text(22, y, r.label, r.col, false, 'left');
        const v = anim.spring('v' + i, r.v, { from: 0, freq: i === 2 ? 1 : 3 });
        const end = drawHBar(grid, x0, y, L, v / 52, r.col);
        grid.big(end + 7, y, `${Math.round(v)}×`, { size: i === 2 ? 2.6 : 1.8, color: r.col, reveal: false });
        if (i === 2) camera.look(64 + (end - 64) * 0.12, 20, 1.06);
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
    shows: 'Two researchers work a lane across the gap for a week and stop at 23%; below, a server rack runs an agent loop for 800 hours on ~$18k and closes 97% of the same gap.',
    phases: ['Two Researchers, One Week', 'Recovered 23%', '800 Agent-Hours · ~$18k', 'Closed 97%'],
    captions: [
      'Two researchers work their lane while a 7-day counter runs',
      'Their lane stops at 23% of the gap',
      'A server rack runs the agent loop: 800 hours and ~$18,000 count up',
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
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const gx0 = 30;
      const gx1 = 100;
      const L = gx1 - gx0;
      if (phase === 1) camera.look(56, 14, 1.06);
      if (phase === 4) camera.look(68, 18, 1.03);

      for (const ly of [10, 23]) grid.vline(gx1, ly - 2.2, gx1, ly + 2.2, { color: G, alpha: 0.75, width: 1.6 });
      grid.text(gx1, 5.5, 'gap closed', G, false, 'center');

      grid.person(9, 10, { size: 6, key: 'r1' });
      grid.person(19, 10, { size: 6, key: 'r2' });
      const weekP = phase === 1 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
      grid.text(14, 15.5, `day ${Math.max(1, Math.ceil(weekP * 7))}/7`, palette.dim, false, 'center');
      const hR = anim.spring('h', 0.23 * weekP, { freq: 3 });
      const hEnd = drawHBar(grid, gx0, 10, L, hR, palette.accent);
      if (phase >= 2) grid.big(hEnd + 4, 10, '23%', { size: 2, color: palette.accent, align: 'left' });

      if (phase >= 3) {
        grid.object('rack', 14, 22, 4, 0.45 + Math.sin(ctx.time * 0.3) * 0.15, { tilt: 0.3, color: G, windowColor: G, key: 'loop' });
        const runP = phase === 3 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
        grid.text(14, 30, `${Math.round(runP * 800)} h · $${Math.round(runP * 18)}k`, palette.dim, false, 'center');
        const aR = anim.spring('a', 0.97 * runP, { freq: 3 });
        const aEnd = drawHBar(grid, gx0, 23, L, aR, G);
        if (phase === 4) grid.big(aEnd + 4, 23, '97%', { size: 2.4, color: G, align: 'left' });
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
    shows: 'A neural network glows; an agent hops between its weights editing them live; nodes turn red and it caves in; then the network steadies beside the three papers behind the real method.',
    phases: ['Under the Hood', 'The Popular Picture', 'Collapse & Forgetting', 'The Dual-Loop Architecture'],
    captions: [
      'A calm 4-layer neural network, gently pulsing',
      'An agent hops between nodes, editing weights live',
      'Nodes turn red and the network caves in on itself',
      'Network steadies at left; three pages fan in: Agent Harness Evolution · Multi-Agent Self-Supervision · Simulated World Replay'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const ox = phase === 4 ? 24 : 64;
      if (phase <= 3) camera.look(64, 19, phase === 3 ? 1.15 : 1 + Math.min(0.12, phaseTime * 0.04));
      const nx0 = anim.spring('nx', ox, { freq: 2 });
      const sc = anim.spring('nsc', phase === 4 ? 0.6 : 1, { freq: 2 });

      const redFrac = anim.spring('red', phase === 3 ? 1 : 0, { freq: 1.3 });
      const collapse = anim.spring('collapse', phase === 3 ? 1 : 0, { freq: 1.6, damp: 0.75 });
      const nodes = [];
      for (let li = 0; li < 4; li++) {
        for (let ni = 0; ni < 5; ni++) {
          const bx = nx0 + (-18 + li * 12) * sc;
          const by = 17 + (-8 + ni * 4) * sc;
          nodes.push({ x: bx + (nx0 - bx) * collapse * 0.85, y: by + (17 - by) * collapse * 0.85, li, idx: li * 5 + ni });
        }
      }
      for (const a of nodes) for (const b of nodes) {
        if (b.li !== a.li + 1) continue;
        grid.vline(a.x, a.y, b.x, b.y, { color: hash01(a.idx * 7 + b.idx) < redFrac ? R : palette.primary, alpha: 0.11, width: 1 });
      }
      for (const n of nodes) {
        const bad = hash01(n.idx * 3.1) < redFrac;
        const edited = phase === 2 && Math.floor(time * 2.5) % 20 === n.idx;
        const pulse = 0.6 + 0.4 * Math.sin(time * 2 + n.idx);
        grid.vdot(n.x, n.y, edited ? 3 : 2, { color: bad ? R : (edited ? palette.warn : palette.accent), alpha: pulse });
      }
      if (phase === 2) {
        const tg = nodes[Math.floor(time * 2.5) % 20];
        grid.icon('agent', tg.x, tg.y - 4, palette.warn, { key: 'ed' });
      }
      if (phase === 3) grid.big(nx0, 31, 'COLLAPSE', { size: 2, color: R });
      if (phase === 4) {
        const papers = [['Agent Harness Evolution', 'pillar 1'], ['Multi-Agent Self-Supervision', 'pillar 2'], ['Simulated World Replay', 'pillar 3']];
        papers.forEach((p, i) => {
          if (anim.stagger(i, 0.6, 0.4) <= 0) return;
          grid.paper(56 + i * 26, 17, { key: 'pil' + i, title: p[0], venue: p[1], w: 22, h: 18, lines: 5, yaw: -0.12, color: i === 1 ? G : palette.accent });
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
    shows: 'The four source papers take the stage one at a time and stack up; a foundation model rises on its own glowing layer; the harness wires itself around it — code on a monitor, prompts on a page, memory in a database, verification at a checkpoint, tools as a wrench — with the camera visiting each; then a fast inner loop and a slow outer loop run side by side.',
    phases: ['The Demo\'s Sources', 'The Foundation Model', 'The Orchestration Harness', 'Inner Loop + Outer Loop'],
    captions: [
      'AutoHarness, AIDE2, Dream-RSI and MASS each take centre stage in turn (camera on the title), then stack along the bottom',
      'The foundation model rises on its own glowing layer',
      'The harness wires up around it, the camera visiting each part: code (monitor) · system prompts (page) · memory (database) · verification (scanner) · tools (wrench)',
      'Model + harness above; a fast INNER loop pipeline on the left, a slow OUTER loop pipeline on the right'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        const srcs = [['AutoHarness', 'Framework'], ['AIDE2', 'Weco'], ['Dream-RSI', 'Google · Oct 6'], ['MASS', 'Multi-Agent Self-Supervision · Oct 8']];
        const q = stageDuration / 4;
        const cur = Math.min(3, Math.floor(phaseTime / q));
        const local = (phaseTime - cur * q) / q;
        srcs.forEach((s, i) => {
          if (i > cur) return;
          if (i === cur) {
            grid.paper(64, 15, { key: 'src' + i, title: s[0], venue: s[1], w: 28, h: 20, lines: 5, yaw: (i % 2 ? -0.15 : 0.15), titleScale: 1.3, color: i >= 2 ? G : palette.accent });
            if (local > 0.25 && local < 0.8) camera.look(64, 8.5, 1.55);
          } else {
            grid.paper(31 + i * 22, 30.5, { key: 'stk' + i, title: s[0], w: 14, h: 6, lines: 1, titleScale: 0.85, color: i >= 2 ? G : palette.accent });
          }
        });
        return;
      }
      if (phase === 2) {
        camera.look(64, 17, 1.12);
        const rise = anim.spring('rise', 0, { from: 8, freq: 1.4, damp: 0.8 });
        grid.glassBox(64, 24 + rise * 0.3, 40, 2.4, 16, { color: palette.accent, key: 'layer1', rotY: 0.18, tilt: -0.3, alpha: 0.9 });
        grid.icosahedron3D(64, 14 + rise, anim.spring('core', 3.8, { from: 0.4, freq: 1.8, damp: 0.6 }), anim.spin('a', 0.4), anim.spin('b', 0.55), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.glow(64, 14, 9, palette.accent, 1);
        grid.big(64, 32, 'FOUNDATION MODEL', { size: 1.4, color: palette.accent });
        return;
      }
      if (phase === 3) {
        const parts = [
          ['monitor', 'CODE', 24, 22, 5, 0.25],
          ['paper', 'SYSTEM PROMPTS', 44, 27, 0, 0],
          ['database', 'MEMORY', 64, 29, 4.2, 0.35],
          ['scanner', 'VERIFICATION', 84, 27, 0, 0],
          ['wrench', 'TOOLS', 104, 22, 5, 0.1]
        ];
        const step = stageDuration / 6;
        const idx = Math.floor(phaseTime / step) - 1;
        grid.icosahedron3D(64, 9, 3, anim.spin('a', 0.4), anim.spin('b', 0.55), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.glow(64, 9, 8, palette.accent, 1);
        parts.forEach((pt, i) => {
          if (i > idx) return;
          const k = math.clamp((phaseTime - (i + 1) * step) / 0.8, 0, 1);
          grid.vline(64, 12, pt[2], pt[3] - 3.5, { color: G, alpha: 0.35 * k, width: 1.2 });
          const y = pt[3] - 1;
          if (pt[0] === 'paper') grid.paper(pt[2], y, { key: 'prm', w: 9, h: 7, lines: 3, color: G, alpha: k });
          else if (pt[0] === 'scanner') grid.scanner(pt[2], y - 0.5, { w: 6, h: 5, state: 'scan', label: 'CHECKS', key: 'hsc', progress: k, speed: 1.4 });
          else grid.object(pt[0], pt[2], y, pt[4], (pt[0] === 'wrench' ? 0 : pt[5]) + Math.sin(time * 0.4 + i) * (pt[0] === 'wrench' ? 0.04 : 0.15), { tilt: 0.25, color: G, windowColor: G, key: 'hp' + i, alpha: k });
          grid.text(pt[2], pt[3] + 3.4, pt[1], i === idx ? '#ffffff' : G, i === idx, 'center', null, k);
        });
        if (idx >= 0 && idx < 5) camera.look(64 + (parts[idx][2] - 64) * 0.2, 19, 1.08);
        return;
      }
      grid.icosahedron3D(64, 6.5, 2.4, anim.spin('a', 0.4), anim.spin('b', 0.55), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.text(64, 11.5, 'model + harness', palette.accent, false, 'center');
      grid.big(33, 16, 'INNER LOOP · FAST', { size: 1.1, color: palette.warn });
      grid.pipeline(10, 56, 25, ['propose', 'run', 'score'], { loop: true, loopDepth: 4, color: palette.warn, speed: 1.1, key: 'in11', radius: 2.8 });
      grid.big(95, 16, 'OUTER LOOP · SLOW', { size: 1.1, color: G });
      grid.pipeline(72, 118, 25, ['inspect', 'rewrite', 'verify'], { loop: true, loopDepth: 4, color: G, speed: 0.22, key: 'out11', radius: 2.8 });
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
    shows: 'A research agent with its four-step loop; the camera pushes in on a 3D GPU card, the optimization target; each pass of propose → run → time → log drops a point on a rising trail that flattens against a red ceiling.',
    phases: ['Autonomous Research Agent', 'The Optimization Target', 'Propose · Run · Time · Log', 'Hits a Ceiling'],
    captions: [
      'A research agent appears with its four-step loop forming beside it',
      'The camera pushes in as a 3D GPU card slides in: the optimization target',
      'Each pass lights PROPOSE → RUN → TIME → LOG and drops a point on a rising trail',
      'The trail flattens against a red ceiling; the camera settles on it'
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
      const { phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const R = palette.danger;

      if (phase === 1) {
        grid.icosahedron3D(64, 9, 2.8, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.text(64, 14.5, 'research agent', palette.accent, false, 'center');
        grid.pipeline(28, 100, 24, ['propose', 'run', 'time', 'log'], { loop: true, color: palette.warn, speed: 0.35, key: 'il' });
        return;
      }
      if (phase === 2) {
        camera.look(64, 18, 1 + Math.min(0.3, phaseTime * 0.1));
        const gx = anim.spring('gx', 64, { from: 140, freq: 1.2, damp: 0.8 });
        grid.object('gpu', gx, 18, 12, 0.6 + Math.sin(ctx.time * 0.5) * 0.15, { tilt: 0.45, color: palette.accent, windowColor: palette.warn, key: 'gpu' });
        grid.big(gx, 30, 'GPU KERNEL', { size: 1.3, color: palette.accent });
        return;
      }
      grid.icosahedron3D(12, 6, 2, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.pipeline(30, 104, 6, ['propose', 'run', 'time', 'log'], { loop: true, loopDepth: 3, color: palette.warn, speed: 0.9, key: 'il3', radius: 2.4 });
      const x0 = 30;
      const yB = 32;
      const yT = 15;
      const n = Math.min(36, Math.floor(phaseTime * 3.5) + (phase === 4 ? 36 : 0));
      const ceil = 0.62;
      const pts = [];
      for (let i = 0; i < n; i++) {
        const v = Math.min(ceil, 0.1 + (1 - Math.exp(-i / 7)) * 0.56) - hash01(i) * 0.04;
        pts.push([x0 + i * 2.5, yB - v * (yB - yT)]);
      }
      if (pts.length > 1) grid.vpath(pts, { color: palette.accent, alpha: 0.9, width: 1.8, glow: true });
      pts.forEach((p, i) => grid.vdot(p[0], p[1], i === pts.length - 1 ? 2.8 : 1.3, { color: i === pts.length - 1 ? '#ffffff' : palette.accent }));
      if (phase === 4) {
        const cyl = yB - ceil * (yB - yT) - 0.4;
        grid.vline(x0 - 2, cyl, 122, cyl, { color: R, alpha: 0.95, width: 2.4 });
        grid.big(110, cyl - 2, 'CEILING', { size: 1.2, color: R });
        camera.look(80, cyl + 3, 1.15);
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
    shows: 'The inner loop runs while the engineer who used to debug it steps away and an outer-loop model takes their place; three roles wire into one shared model; a trace strip lights two red breaks; then the workflow file is rewritten line by line.',
    phases: ['Outer Loop Takes Over', 'Three Roles, One Model', 'Inspect the Traces', 'Rewrite the Inner Loop'],
    captions: [
      'The inner loop runs; the human debugger fades out and an outer-loop model takes their seat',
      'Agent, evaluator and optimizer all wire into one shared model (MASS, Oct 8)',
      'A trace strip scans left to right; two red breaks light up: tool · handoff',
      'The inner loop’s workflow file: broken lines turn red, then are rewritten green'
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
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 4) camera.look(64, phaseTime < 2.5 ? 8.5 : 17, phaseTime < 2.5 ? 1.7 : 1.15);

      if (phase === 1) {
        grid.pipeline(16, 70, 22, ['propose', 'run', 'time', 'log'], { loop: true, loopDepth: 3, color: palette.warn, speed: 0.9, key: 'in13' });
        const k = math.clamp(phaseTime / (stageDuration * 0.7), 0, 1);
        grid.person(100, 15, { size: 11, label: 'ENGINEER', key: 'dbg', alpha: 1 - k });
        if (k > 0.4) {
          const s = anim.spring('outer', 2.8, { from: 0.2, freq: 1.8 });
          grid.dodecahedron3D(100, 15, s, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim, alpha: (k - 0.4) / 0.6 });
          grid.text(100, 24, 'outer loop', G, true, 'center');
          grid.vpath([[92, 17], [78, 21]], { color: G, alpha: 0.4, width: 1.2, dash: [2, 3] });
        }
        return;
      }
      if (phase === 2) {
        grid.icosahedron3D(64, 10, 3, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.glow(64, 10, 8, palette.accent, 1);
        grid.text(64, 16, 'one shared model', '#ffffff', true, 'center');
        const roles = [['agent', 'task agent', 34], ['eye', 'self-evaluator', 64], ['gear', 'optimizer', 94]];
        roles.forEach((r, i) => {
          const k = anim.spring('r' + i, 1, { from: 0, freq: 2 + i * 0.4 });
          grid.vpath([[64, 13], [r[2], 22]], { color: palette.accent, alpha: 0.3 * k, width: 1.2, dash: [2, 3] });
          grid.icon(r[0], r[2], 25, palette.accent, { key: 'r' + i, label: r[1], alpha: k });
        });
        return;
      }
      if (phase === 3) {
        const nodes = ['plan', 'tool', 'handoff', 'eval', 'retry', 'submit'];
        const scan = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        nodes.forEach((n, i) => {
          const x = 22 + i * 17;
          const seen = i / (nodes.length - 1) <= scan + 0.01;
          const broken = i === 1 || i === 2;
          const col = seen ? (broken ? R : G) : palette.dim;
          if (i < 5) grid.vline(x + 1.5, 17, x + 15.5, 17, { color: col, alpha: 0.5, width: 1.4 });
          grid.vdot(x, 17, broken && seen ? 3.4 : 2.2, { color: col });
          if (broken && seen) grid.glow(x, 17, 3, R, 1.2);
          grid.text(x, 20, n, col, broken && seen, 'center');
        });
        const sx = 22 + scan * 85;
        camera.look(64 + (sx - 64) * 0.1, 16, 1.06);
        grid.object('magnifier', sx, 9, 3.6, 0.1, { tilt: 0.1, color: palette.warn, windowColor: palette.warn, key: 'scan13' });
        grid.vline(sx, 13, sx, 21, { color: palette.warn, alpha: 0.5, width: 1.2 });
        return;
      }
      const pass = math.clamp(phaseTime / (stageDuration * 0.75), 0, 1);
      const bad = [2, 5];
      grid.paper(64, 17, { key: 'workflow', title: 'Inner-loop workflow', venue: 'prompt + helper functions', w: 34, h: 24, lines: 9, yaw: -0.1,
        lineColor: (i) => (bad.includes(i) ? (pass > 0.35 + bad.indexOf(i) * 0.25 ? G : R) : null) });
      if (pass > 0.9) grid.text(64, 32, 'rewritten by the outer loop', G, true, 'center');
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
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
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
      if (phase === 2) grid.paper(112, 20, { key: 'dream', title: 'Dream-RSI', authors: 'Google', venue: 'Updated Oct 6', w: 18, h: 13, lines: 3, yaw: -0.25 });
      if (phase === 3) grid.big(55, 32, 'REPLAY MAP', { size: 1.1, color: palette.primary });
      if (phase === 4) {
        const path = [L0, L1[1], L2[2], L3[best]];
        const k = math.clamp((phaseTime % 3.2) / 2.4, 0, 1);
        const seg = Math.min(2, Math.floor(k * 3));
        const f = k * 3 - seg;
        const pts = path.slice(0, seg + 1);
        pts.push([path[seg][0] + (path[seg + 1][0] - path[seg][0]) * f, path[seg][1] + (path[seg + 1][1] - path[seg][1]) * f]);
        grid.vpath(pts, { color: G, alpha: 0.95, width: 2.6, glow: true });
        const head = pts[pts.length - 1];
        camera.look(60 + (head[0] - 60) * 0.15, 17 + (head[1] - 17) * 0.15, 1.06);
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
    shows: 'A candidate harness page glides into a slim verification checkpoint; a balance scale weighs it against the previous best; held-out tests fill under each pan until the candidate’s side tips the scale and it is stamped COMMIT.',
    phases: ['The Gate', 'Commit Only If…', '…It Beats the Best on Held-Out'],
    captions: [
      'A candidate harness page (v8) glides up to a verification scanner — corner brackets, measured rails, a sweeping beam',
      'A balance scale: previous best (v7) on the left pan, the candidate (v8) on the right — undecided',
      'Held-out tests fill under each pan; v8 passes more, the scale tips its way, and v8 is stamped COMMIT'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        const x = anim.spring('cx', 46, { from: 6, freq: 0.9, damp: 0.85 });
        grid.scanner(80, 16, { w: 18, h: 20, state: 'scan', readout: 'strict verification gate', key: 'sc15', speed: 0.8 });
        grid.paper(x, 16, { key: 'cand', title: 'harness v8', venue: 'candidate', w: 14, h: 15, lines: 5, yaw: 0.2 });
        camera.look(64, 16, 1.1);
        return;
      }
      const s = phase === 3 ? math.clamp(phaseTime / (stageDuration * 0.8), 0, 1) : 0;
      const v7 = Math.round(Math.min(1, s * 1.3) * 9);
      const v8 = Math.round(Math.min(1, s * 1.15) * 11);
      const target = phase === 3 ? (v8 - v7) * 0.07 : Math.sin(time * 1.6) * 0.07;
      const ang = anim.spring('beam', target, { freq: 1.6, damp: 0.5 });
      const pans = grid.balance(64, 15, 9, ang, { color: palette.accent, key: 'bal15' });
      grid.paper(pans.left.x, pans.left.y - 3, { key: 'v7', title: 'v7', venue: 'previous best', w: 9, h: 6, lines: 2, color: palette.primary, yaw: 0.1 });
      grid.paper(pans.right.x, pans.right.y - 3, { key: 'v8', title: 'v8', venue: 'candidate', w: 9, h: 6, lines: 2, color: G, yaw: -0.1, stamp: phase === 3 && s > 0.95 ? 'COMMIT' : '', stampColor: G });
      if (phase === 3) {
        [[pans.left.x, v7, palette.primary], [pans.right.x, v8, G]].forEach((col, side) => {
          for (let i = 0; i < 12; i++) {
            const x = col[0] - 8.25 + (i % 6) * 3.3;
            const y = 28 + Math.floor(i / 6) * 2.2;
            const on = i < col[1];
            grid.vdot(x, y, on ? 2 : 1.4, { color: on ? col[2] : palette.dim, alpha: on ? 1 : 0.4 });
          }
          grid.big(col[0], 33.4, `${col[1]}/12`, { size: 1, color: col[2], reveal: false });
        });
        grid.text(64, 30, 'held-out', palette.dim, false, 'center');
        if (s > 0.95) camera.look(pans.right.x, pans.right.y - 3, 1.25);
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
    shows: 'Along an 8-day line, agent versions v1 → v7 appear, each larger and brighter; paired bars show the self-evolved agent beating a two-year hand-tuned one on three unseen benchmarks; a line chart of reward hacking falls from 63% to 34%.',
    phases: ['8 Days · 7 Versions', 'Beats a 2-Year Human Agent', 'Reward Hacking 63% → 34%'],
    captions: [
      'Along an 8-day line, agent versions v1 → v7 appear, each larger and brighter',
      'Three unseen benchmarks: self-evolved bars (green) rise above the 2-year hand-tuned agent’s',
      'Line chart: reward hacking falls across the run from 63% to 34%'
    ],
    narration: [
      `In a recent eight-day unattended run using this exact inner-and-outer-loop structure, the system autonomously generated seven successively stronger versions of its own research agent.`,
      `By day eight, the self-evolved agent beat a human-engineered agent that had been hand-tuned over two years—and it beat it across three separate benchmarks it had never been trained on.`,
      `Even more remarkably, the rate at which the agent tried to "reward hack" or cheat the GPU kernel benchmark dropped from sixty-three percent down to thirty-four percent, an emergent improvement in reliability that no human explicitly programmed.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        const x0 = 12;
        const x1 = 116;
        const prog = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        grid.vline(x0, 26, x1, 26, { color: palette.dim, alpha: 0.4, width: 1.2 });
        grid.vline(x0, 26, x0 + (x1 - x0) * prog, 26, { color: G, alpha: 0.9, width: 2 });
        for (let d = 1; d <= 8; d++) grid.text(x0 + ((d - 0.5) / 8) * (x1 - x0), 28, `day ${d}`, palette.dim, false, 'center');
        for (let v = 1; v <= 7; v++) {
          const vx = x0 + (v / 7.6) * (x1 - x0);
          if ((vx - x0) / (x1 - x0) > prog) continue;
          const s = 1.2 + v * 0.3;
          grid.shape3D('icosa', vx, 18 - v * 0.8, s, ctx.anim.spin('vx' + v, 0.5), ctx.anim.spin('vy' + v, 0.6), 0, { color: v === 7 ? G : palette.accent, accent: '#ffffff', dim: palette.dim, alpha: 0.4 + v * 0.085 });
          grid.text(vx, 23, `v${v}`, v === 7 ? G : palette.accent, v === 7, 'center');
        }
      }
      if (phase === 2) {
        const pairs = [[62, 74], [55, 69], [48, 64]];
        const bars = [];
        pairs.forEach((p) => { bars.push({ value: p[0], label: '', color: palette.primary }); bars.push({ value: p[1], label: '', color: G }); });
        grid.barChart(18, 6, 72, 20, bars, { yMax: 100, format: () => '', key: 'unseen' });
        for (let i = 0; i < 3; i++) grid.text(18 + 12 * (2 * i + 1), 28.5, `unseen ${i + 1}`, palette.dim, false, 'center');
        grid.person(108, 9, { size: 7, key: 'handtuned', label: '2 YRS HAND-TUNED', color: palette.primary });
        grid.icosahedron3D(108, 21, 2.2, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.text(108, 26, 'SELF-EVOLVED', G, true, 'center');
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.7), 0, 1);
        grid.lineChart(16, 6, 70, 20, [{ values: [63, 61, 55, 52, 46, 41, 37, 34], color: R, label: '' }], { yMax: 80, progress: p, xLabels: ['day 1', '', '', '', '', '', '', 'day 8'] });
        const v = 63 - (63 - 34) * p;
        if (p > 0.6) camera.look(96, 17, 1.12);
        grid.icon('bug', 106, 10, R, { key: 'bug', glow: true, alpha: Math.max(0.25, (v - 25) / 38) });
        grid.big(106, 18, `${Math.round(v)}%`, { size: 3, color: v > 45 ? R : palette.warn, reveal: false });
        grid.text(106, 23, '“reward hacking”', palette.dim, false, 'center');
        if (p > 0.95) grid.text(106, 26, 'nobody programmed this', G, true, 'center');
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
    shows: 'A wall of rollouts; the best light up green and stream into the shared model, which morphs into its next version; a large donut fills to a 68.3% win rate; then bars show self-evaluation rising from 73% to 93% as a student figure becomes the teacher.',
    phases: ['Loop Closes Into Weights', 'Harvest the Best Rollouts', 'Fine-Tune the Shared Model', '68.3% Win Rate', 'Evaluator 73% → 93%'],
    captions: [
      'A wall of rollouts sits beside the shared model',
      'The best rollouts light up green; the rest stay dim',
      'Green rollouts stream into the model, which morphs into its next version',
      'Centre stage: a donut fills to a 68.3% win rate over the base model',
      'Bars: self-evaluation 73% → 93%; the student figure steps up as the teacher'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase <= 3) {
        const best = phase >= 2 ? 0.3 : 0;
        grid.fileGrid(40, 17, 10, 7, { filled: anim.spring('best', best, { freq: 2 }), key: 'rollouts', cell: [4.2, 3.4] });
        if (phase === 3) {
          for (let i = 0; i < 10; i++) {
            const t = (time * 0.6 + hash01(i)) % 1;
            const sx = 22 + hash01(i * 2) * 38;
            const sy = 7 + hash01(i * 5) * 20;
            grid.vdot(sx + (96 - sx) * t, sy + (17 - sy) * t, 2, { color: G, alpha: Math.sin(t * Math.PI) });
          }
          camera.look(84, 17, 1.12);
        }
        const up = phase === 3;
        const col = anim.color('mc', up ? G : palette.accent);
        grid.morph3D('model', up ? 'dodeca' : 'icosa', 96, 17, anim.spring('ms', up ? 4 : 3, { freq: 2.5, damp: 0.6 }), anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: col, accent: '#ffffff', dim: palette.dim });
        grid.glow(96, 17, 9, col, up ? 1.4 : 0.8);
        grid.text(96, 27, up ? 'next version' : 'shared model', col, false, 'center');
        return;
      }
      if (phase === 4) {
        grid.donut(64, 16, 9, [{ value: 68.3, color: G }, { value: 31.7, color: palette.dim }], { center: '68.3%', centerSize: 2.4, key: 'win' });
        grid.text(64, 30, 'win rate over the base model', palette.dim, false, 'center');
        return;
      }
      grid.barChart(34, 6, 40, 20, [{ value: 73, label: 'BEFORE', color: palette.primary }, { value: 93, label: 'AFTER', color: palette.warn }], { yMax: 100, format: (v) => Math.round(v) + '%', valueSize: 1.8, key: 'eval' });
      grid.text(54, 31, 'self-evaluation accuracy', palette.dim, false, 'center');
      const k = anim.spring('teach', phaseTime > 2.5 ? 1 : 0, { freq: 1.5 });
      grid.person(98, 16 - k * 4, { size: 8 + k * 4, key: 'teacher', color: k > 0.5 ? palette.warn : palette.accent, label: k > 0.5 ? 'TEACHER' : 'STUDENT' });
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
    shows: 'Two release-note feeds roll in side by side — Anthropic and OpenAI; then the camera pulls back from a single server rack to a datacenter hall to a whole campus with cooling towers and power pylons (scale); a glass containment box closes around the campus (contain).',
    phases: ['Two Weeks of Docs', 'To Scale…', '…and Contain'],
    captions: [
      'Anthropic’s and OpenAI’s release-note feeds roll in side by side',
      'Scale: the camera pulls back from one server rack, to a datacenter hall, to a whole campus with cooling towers and power pylons',
      'Contain: a glass box closes around the entire campus'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      if (phase === 1) {
        grid.releaseNotes(34, 17, { product: 'Anthropic', version: 'October docs', width: 50, rowH: 4.2, key: 'an18', items: [{ tag: 'NEW', text: 'Opus · Sonnet · Haiku 5.5' }, { tag: 'BETA', text: 'Agent SDK computer use' }, { tag: 'GA', text: 'Claude Code Review' }] });
        grid.releaseNotes(94, 17, { product: 'OpenAI', version: 'October notes', width: 50, rowH: 4.2, key: 'oa18', color: palette.primary, items: [{ tag: 'NEW', text: 'GPT-6 family' }, { tag: 'NEW', text: 'GPT-6 Pro parallel agents' }, { tag: 'SECURITY', text: 'Codex Linux sandbox' }] });
        return;
      }
      const s = phase === 2 ? math.clamp(phaseTime / stageDuration, 0, 1) : 1;
      const sway = 0.42 + Math.sin(time * 0.2) * 0.08;
      if (s < 0.3) {
        camera.look(64, 17, 1.3 - s * 0.6);
        grid.object('rack', 64, 17, 7, sway, { tilt: 0.3, color: palette.accent, windowColor: G, key: 'rack18' });
        grid.big(64, 32, 'ONE RACK', { size: 1.1, color: palette.accent, reveal: false });
        return;
      }
      if (s < 0.6) {
        camera.look(64, 17, 1.12 - (s - 0.3) * 0.3);
        grid.object('hall', 64, 17, 10, sway, { tilt: 0.42, color: palette.accent, windowColor: G, key: 'hall18' });
        grid.big(64, 32, 'ONE HALL', { size: 1.1, color: palette.accent, reveal: false });
        return;
      }
      camera.look(64, 17, phase === 3 ? 0.98 : 1.04 - (s - 0.6) * 0.15);
      const halls = [[40, 22], [64, 22], [88, 22], [52, 13], [76, 13]];
      halls.forEach((h, i) => grid.object('hall', h[0], h[1], 4.6, 0.42, { tilt: 0.45, color: palette.accent, windowColor: G, key: 'ch' + i, progress: phase === 3 ? 1 : math.clamp((s - 0.6) / 0.3 - i * 0.12, 0, 1) }));
      grid.object('coolingTower', 15, 18, 5, 0, { tilt: 0.3, color: palette.primary, key: 'ct1' });
      grid.object('coolingTower', 113, 18, 5, 0, { tilt: 0.3, color: palette.primary, key: 'ct2' });
      grid.object('pylon', 28, 7, 3.4, 0.3, { tilt: 0.2, color: palette.dim, windowColor: palette.warn, key: 'py1' });
      grid.object('pylon', 100, 7, 3.4, 0.3, { tilt: 0.2, color: palette.dim, windowColor: palette.warn, key: 'py2' });
      grid.vpath([[25.5, 3.2], [64, 5.5], [102.5, 3.2]], { color: palette.dim, alpha: 0.35, width: 1 });
      if (phase === 2) grid.big(64, 32.5, 'A CAMPUS', { size: 1.1, color: palette.accent, reveal: false });
      if (phase === 3) {
        grid.glassBox(64, 17, 116, 28, 34, { color: G, key: 'contain18', rotY: 0.05, tilt: -0.2 });
        grid.big(64, 32.5, 'CONTAINED', { size: 1.2, color: G });
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
    shows: 'An October calendar fills in; Opus 5.5 shows its cost bar shrinking 40% and its speed bar growing 30%; a 680,000-line codebase migrates file by file inside 24 hours while a stopwatch runs; Sonnet 5.5 joins and the October 7 platform release notes roll in.',
    phases: ['Early–Mid October', 'Opus 5.5: −40% Cost, +30% Speed', '680k-Line Migration < 24h', 'Sonnet 5.5 · Oct 7 Update'],
    captions: [
      'An October 2026 calendar draws in, days 1–15 lighting up in turn',
      'Opus 5.5 with two bars: cost shrinks 40%, speed grows 30%',
      'A wall of files migrates (dim → green) to 680,000 lines while a stopwatch races under 24h',
      'Sonnet 5.5 joins Opus; the October 7 developer-platform release notes roll in, entry by entry'
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
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        const marks = {};
        const n = Math.ceil(math.clamp(phaseTime / stageDuration, 0, 1) * 15);
        for (let d = 1; d <= n; d++) marks[d] = { color: palette.accent };
        grid.calendar(64, 18, { month: 'OCTOBER 2026', startDay: 4, marks, key: 'oct19' });
        camera.look(64, 16, 1.1);
        return;
      }
      if (phase === 2) {
        grid.icosahedron3D(22, 16, 3, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.text(22, 23, 'Opus 5.5', palette.accent, true, 'center');
        grid.barChart(44, 6, 30, 18, [{ value: 100, label: 'BEFORE', color: palette.dim }, { value: 60, label: 'NOW', color: G }], { yMax: 140, format: () => '', key: 'cost' });
        grid.big(59, 30, '−40% COST', { size: 1.4, color: G });
        grid.barChart(84, 6, 30, 18, [{ value: 100, label: 'BEFORE', color: palette.dim }, { value: 130, label: 'NOW', color: G }], { yMax: 140, format: () => '', key: 'speed' });
        grid.big(99, 30, '+30% SPEED', { size: 1.4, color: G });
        return;
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.9), 0, 1);
        grid.fileGrid(48, 14, 18, 6, { filled: p, key: 'migr', cell: [4.4, 3.2] });
        grid.big(48, 28, `${Math.round(p * 680).toLocaleString('en-US')},000 lines`, { size: 1.8, color: G, reveal: false });
        grid.object('stopwatch', 104, 13, 7, -0.25, { tilt: 0.1, color: palette.accent, windowColor: palette.accent, handPeriod: 0.6, key: 'sw19' });
        grid.big(104, 25, `${Math.min(23, Math.floor(p * 23.5))}h`, { size: 1.6, color: palette.accent, reveal: false });
        return;
      }
      grid.icosahedron3D(14, 11, 2.4, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.text(14, 16, 'Opus 5.5', palette.accent, true, 'center');
      grid.shape3D('octa', 14, 24, 2.2, anim.spin('c', 0.5), anim.spin('d', 0.6), 0, { color: palette.primary, accent: '#ffffff', dim: palette.dim });
      grid.text(14, 29, 'Sonnet 5.5', palette.primary, true, 'center');
      grid.releaseNotes(72, 17, { product: 'Claude Developer Platform', version: 'Platform update', date: 'Oct 7', key: 'rn19',
        items: [{ tag: 'NEW', text: 'Claude Haiku 5.5' }, { tag: 'NEW', text: 'computer_toolset_20260801' }, { tag: 'IMPROVED', text: 'Cheaper prompt-cache reads' }, { tag: 'SECURITY', text: 'Sandboxed managed agents' }] });
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
    shows: 'Haiku 5.5 above a 1,000,000-token counter; its context window unrolls as a long ribbon of pages with the 128K output ribbon beneath; a technical effort gauge sweeps as an "adaptive thinking" switch flips on; old parameters fly at the Haiku API and bounce off with 400 errors while "effort" passes through.',
    phases: ['Haiku 5.5: 1M Context', 'Adaptive Thinking + effort', 'Old Params → 400'],
    captions: [
      'Haiku 5.5 above a 1,000,000 counter; the context window unrolls as a long ribbon of pages, the 128K output ribbon beneath it',
      'An "adaptive thinking" switch flips ON; a technical effort gauge sweeps LOW → HIGH',
      'budget_tokens, temperature, top_p and top_k fly at the API and bounce off with "400"; effort passes through'
    ],
    narration: [
      `They launched Claude Haiku 5.5, bringing a one-million-token context window and one-hundred-and-twenty-eight-thousand max output tokens to high-volume, latency-sensitive agent workloads.`,
      `If you read the migration documentation for Haiku 5.5, several architectural shifts stand out. First, adaptive thinking is now enabled by default and controlled via an effort parameter,`,
      `while manual budget_tokens and traditional sampling parameters like temperature, top_p, and top_k now return 400 errors.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        const k = anim.spring('ctx', 1, { from: 0, freq: 0.7, damp: 0.9 });
        grid.shape3D('tetra', 64, 5, 2, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.big(64, 12.5, `${Math.round(k * 1000000).toLocaleString('en-US')}`, { size: 2.8, color: G, reveal: false });
        grid.text(64, 16.5, 'TOKENS OF CONTEXT', palette.dim, false, 'center');
        grid.fileGrid(64, 21.5, 40, 1, { filled: k, key: 'ctxR', cell: [2.6, 2.4] });
        grid.fileGrid(12 + 2.6 * 2.5, 27, 5, 1, { filled: Math.min(1, k * 1.2), fillColor: palette.primary, key: 'outR', cell: [2.6, 2.4] });
        grid.text(28, 27, '128K OUTPUT', palette.primary, false, 'left');
        camera.look(64, 17, 1.02);
        return;
      }
      if (phase === 2) {
        const on = phaseTime > 1.2;
        const sw = anim.spring('sw', on ? 1 : 0, { freq: 3, damp: 0.6 });
        const tx = 64;
        const ty = 5;
        const cap = [];
        for (let i = 0; i <= 24; i++) {
          const a = Math.PI / 2 + (i / 24) * Math.PI;
          cap.push([tx - 3 + Math.cos(a) * 2.6, ty + Math.sin(a) * 1.3]);
        }
        for (let i = 0; i <= 24; i++) {
          const a = -Math.PI / 2 + (i / 24) * Math.PI;
          cap.push([tx + 3 + Math.cos(a) * 2.6, ty + Math.sin(a) * 1.3]);
        }
        grid.vpath(cap, { color: on ? G : palette.dim, alpha: 0.95, width: 1.8, closed: true, glow: on });
        grid.vdot(tx - 3 + sw * 6, ty, 3.6, { color: on ? G : palette.dim });
        grid.text(tx - 8, ty, 'ADAPTIVE THINKING', on ? G : palette.dim, on, 'right');
        grid.text(tx + 8, ty, on ? 'ON' : 'OFF', on ? G : palette.dim, on, 'left');
        const v = anim.spring('dial', on ? 0.82 : 0.1, { freq: 0.8 });
        const cx = 64;
        const cy = 27;
        const R0 = 15;
        const arc = (f0, f1, col, wdt, a) => {
          const pts = [];
          for (let i = 0; i <= 30; i++) {
            const t = Math.PI + (f0 + (f1 - f0) * (i / 30)) * Math.PI;
            pts.push([cx + Math.cos(t) * R0 * 1.85, cy + Math.sin(t) * R0]);
          }
          grid.vpath(pts, { color: col, alpha: a, width: wdt, glow: a > 0.5 });
        };
        arc(0, 1, palette.dim, 2, 0.35);
        arc(0, v, G, 3, 0.95);
        for (let i = 0; i <= 20; i++) {
          const t = Math.PI + (i / 20) * Math.PI;
          const L = i % 5 === 0 ? 2 : 1;
          grid.vline(cx + Math.cos(t) * (R0 - 0.2) * 1.85, cy + Math.sin(t) * (R0 - 0.2), cx + Math.cos(t) * (R0 - L) * 1.85, cy + Math.sin(t) * (R0 - L), { color: palette.accent, alpha: 0.6, width: 1 });
        }
        ['LOW', 'MEDIUM', 'HIGH', 'MAX'].forEach((l, i) => {
          const t = Math.PI + (i / 3) * Math.PI;
          grid.text(cx + Math.cos(t) * (R0 + 2.2) * 1.85, cy + Math.sin(t) * (R0 + 2.2), l, palette.dim, false, 'center');
        });
        const na = Math.PI + v * Math.PI;
        grid.vline(cx, cy, cx + Math.cos(na) * (R0 - 3) * 1.85, cy + Math.sin(na) * (R0 - 3), { color: '#ffffff', alpha: 0.95, width: 2.4 });
        grid.vdot(cx, cy, 3, { color: '#ffffff' });
        grid.big(cx, cy + 3.4, 'effort', { size: 1.3, color: G });
        return;
      }
      grid.glassBox(64, 17, 2, 24, 14, { color: R, key: 'api400', rotY: 0.5, tilt: -0.12, alpha: 0.85 });
      grid.object('serverBlade', 98, 17, 9, 0.45, { tilt: 0.4, color: palette.accent, windowColor: G, key: 'api20' });
      grid.text(98, 23, 'HAIKU 5.5 API', palette.accent, false, 'center');
      const params = ['budget_tokens', 'temperature', 'top_p', 'top_k', 'effort'];
      params.forEach((p, i) => {
        const t = ((phaseTime * 0.42) + i * 0.2) % 1;
        const ok = p === 'effort';
        const y = 7 + i * 5;
        let x;
        let a = 1;
        if (ok) x = 10 + t * 80;
        else if (t < 0.55) x = 10 + (t / 0.55) * 50;
        else { x = 60 - ((t - 0.55) / 0.45) * 26; a = 1 - (t - 0.55) / 0.45; }
        grid.big(x, y, p, { size: 1, color: ok ? G : (t < 0.55 ? palette.accent : R), alpha: a, align: 'right', reveal: false });
        if (!ok && t > 0.52 && t < 0.8) grid.chatBubble(66, y, '400', { color: R, alpha: 1 - (t - 0.52) / 0.28, size: 0.9 });
      });
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
    shows: 'A price chart: base input vs cache reads, the cache bar halving to $0.10 per million — 5% of base; Opus 5.5’s cache bar drops 60%; the same code page is read again and again with every pass a cache hit; then a five-day run keeps going while its cost line stays almost flat.',
    phases: ['Sonnet 5.5: Cache Reads Halved', 'Opus 5.5: −60%', 'Cache Reads Dominate Loop Cost', 'Multi-Day Loops Become Viable'],
    captions: [
      'Sonnet 5.5 price bars: base input $2.00 vs cache reads $0.20 → $0.10 per million (5% of base)',
      'Opus 5.5: its cache-read bar drops 60%',
      'The same code page is read again and again — a scan line sweeps it, "CACHE HIT" flashes, the reread counter climbs',
      'Days tick along a chart while the cost line stays nearly flat'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        const k = anim.spring('half', phaseTime > 1.5 ? 1 : 0, { freq: 1.2 });
        grid.barChart(32, 5, 64, 21, [
          { value: 2.0, label: 'BASE INPUT', color: palette.dim },
          { value: 0.2 - 0.1 * k, label: 'CACHE READ', color: G }
        ], { yMax: 2.2, format: (v) => '$' + v.toFixed(2), valueSize: 1.6, key: 'sonnetP' });
        grid.big(64, 31, 'SONNET 5.5 · PER MILLION TOKENS', { size: 1, color: palette.accent });
        return;
      }
      if (phase === 2) {
        grid.icosahedron3D(30, 15, 3, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.text(30, 22, 'Opus 5.5', palette.accent, true, 'center');
        grid.barChart(50, 5, 40, 21, [
          { value: 100, label: 'BEFORE', color: palette.dim },
          { value: anim.spring('opus', 40, { from: 100, freq: 1 }), label: 'NOW', color: G }
        ], { yMax: 110, format: () => '', key: 'opusP' });
        grid.big(102, 15, '−60%', { size: 3, color: G });
        return;
      }
      if (phase === 3) {
        const sweep = (time * 1.4) % 1;
        const line = Math.floor(sweep * 10);
        grid.paper(48, 17, { key: 'reread', venue: 'same codebase', w: 30, h: 24, lines: 10, yaw: 0.12, lineColor: (i) => (i === line ? '#ffffff' : (i < line ? G : null)) });
        grid.big(88, 13, `×${Math.round(anim.spin('it', 55))}`, { size: 3, color: palette.accent, reveal: false });
        grid.big(88, 21, 'CACHE HIT', { size: 1.3, color: G, alpha: 0.5 + 0.5 * Math.sin(time * 9), reveal: false });
        return;
      }
      const p = math.clamp(phaseTime / (stageDuration * 0.9), 0, 1);
      grid.lineChart(16, 6, 96, 20, [
        { values: [0, 30, 60, 90, 120, 150], color: palette.danger, label: 'old price', dash: [3, 3], width: 1.4 },
        { values: [0, 3, 6, 9, 12, 15], color: G, label: 'cache reads' }
      ], { yMax: 160, progress: p, xLabels: ['day 0', '1', '2', '3', '4', 'day 5'] });
      grid.big(64, 31, 'STILL RUNNING', { size: 1.2, color: G, alpha: p > 0.3 ? 1 : 0 });
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
    shows: 'An agent sits alone in a centred glass sandbox; the October 7 SDK release notes roll in; the sandbox slides left as requests leave for two allowed hosts — real servers on a network switch; a request to an unlisted host hits the wall and dies red as the camera pushes in.',
    phases: ['Lock Down the Agents', 'Oct 7 SDK: Computer Toolset', 'allowed_hosts Enforced', 'Blocked at Infrastructure'],
    captions: [
      'An agent appears inside a 3D glass sandbox, centred',
      'The October 7 SDK release notes roll in: computer_toolset_20260801 · browser automation · Python · TypeScript',
      'The sandbox slides left; requests flow out to two allowed hosts — real servers (allowed_hosts enforced)',
      'A request to an unlisted host hits the sandbox wall and dies in a red spark; the camera pushes in: blocked'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 2) {
        grid.releaseNotes(64, 17, { product: 'Claude Agent SDK', version: 'Oct 7 release', date: 'beta', key: 'sdk22', highlight: phaseTime > 4 ? 0 : undefined,
          items: [{ tag: 'NEW', text: 'computer_toolset_20260801' }, { tag: 'NEW', text: 'Browser automation loops' }, { tag: 'BETA', text: 'Python classes' }, { tag: 'BETA', text: 'TypeScript classes' }] });
        return;
      }
      const cx = anim.spring('cx22', phase === 1 ? 64 : 40, { freq: 1.2 });
      const cy = 17;
      const boxCol = anim.color('sh', phase >= 3 ? G : palette.primary);
      grid.glassBox(cx, cy, 32, 20, 24, { color: boxCol, key: 'sandbox', rotY: 0.3, tilt: -0.22 });
      grid.icosahedron3D(cx, cy, 2.6, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      grid.text(cx, cy + 5, 'agent', palette.accent, false, 'center');
      if (phase === 1) {
        camera.look(64, cy, 1.2);
        return;
      }
      const hosts = [['docs.python.org', 7, G], ['pypi.org', 16, G], ['unlisted-host.io', 25, R]];
      hosts.forEach((h, i) => {
        if (i === 2 && phase < 4) return;
        grid.object('serverBlade', 96, h[1], 6, 0.35, { tilt: 0.35, color: h[2], windowColor: h[2], key: 'host' + i });
        grid.text(96, h[1] + 3, h[0], h[2], false, 'center');
      });
      drawCleanLink(grid, time, cx + 4, cy - 1, 88, 7.5, '', palette.dim, G, 0.8);
      drawCleanLink(grid, time, cx + 4, cy, 88, 16.5, '', palette.dim, G, 0.7);
      if (phase === 4) {
        const t = (time * 0.7) % 1;
        const hitX = cx + 16;
        const x = cx + 4 + t * 40;
        const y = cy + 2 + t * 6;
        camera.look(64, cy + 2, 1.12);
        if (x < hitX) grid.vdot(x, y, 2.6, { color: R });
        else {
          grid.glow(hitX, cy + 4.5, 4, R, 1.6 * (1 - (x - hitX) / 26));
          grid.big(hitX + 10, cy + 8, 'BLOCKED', { size: 1.3, color: R, alpha: 1 - (x - hitX) / 30, reveal: false });
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
    shows: 'The Oct 12 distillation report centre stage, the camera reading its title; a model’s reasoning words stream out to masked harvesters; a centred bar chart shows copies trained on full traces (80.4%) beating summaries (71.8%); then a 3D padlock seals the raw thinking at the centre and only a short summary passes through.',
    phases: ['Oct 12: Distillation Report', 'Harvesting Reasoning Traces', 'Full Traces: 80.4% vs 71.8%', 'Raw Thinking Omitted'],
    captions: [
      'The Oct 12 distillation report, centred; the camera reads its title',
      'A model’s reasoning words stream out; three masked harvesters siphon them',
      'Bars: copy trained on full Opus 4.8 traces 80.4% vs summaries 71.8% (SWE-bench Verified)',
      'A 3D padlock seals the raw thinking at centre; only a short summary passes through'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        grid.paper(64, 17, { title: 'Illicit Distillation Defenses', authors: 'Anthropic', venue: 'Technical breakdown · Oct 12', w: 32, h: 24, key: 'distill', stamp: 'OCT 12', stampColor: palette.warn });
        if (phaseTime > 1.4) camera.look(64, 8.5, 1.7);
        return;
      }
      if (phase === 2) {
        grid.icosahedron3D(30, 17, 3, anim.spin('a', 0.4), anim.spin('b', 0.5), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        const words = ['step 1', 'parse', 'consider', 'edge case', 'therefore', 'verify', 'step 2'];
        for (let i = 0; i < 7; i++) {
          const t = (time * 0.28 + i / 7) % 1;
          grid.big(38 + t * 54, 17 + Math.sin(t * 8 + i) * 2.4, words[i], { size: 1, color: R, alpha: Math.sin(t * Math.PI), reveal: false });
        }
        for (let k = 0; k < 3; k++) grid.icon('agentMask', 100, 9 + k * 8, R, { key: 'h' + k });
        grid.text(100, 32, 'external labs', R, false, 'center');
        return;
      }
      if (phase === 3) {
        grid.barChart(36, 5, 56, 21, [
          { value: 80.4, label: 'FULL TRACES', color: palette.warn },
          { value: 71.8, label: 'SUMMARIES', color: palette.primary }
        ], { yMax: 100, format: (v) => v.toFixed(1) + '%', valueSize: 1.6, key: 'distbars' });
        grid.text(64, 31, 'SWE-bench Verified · copies trained on Opus 4.8 reasoning', palette.dim, false, 'center');
        return;
      }
      grid.icosahedron3D(24, 16, 2.8, anim.spin('a', 0.4), anim.spin('b', 0.5), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      for (let i = 0; i < 5; i++) {
        const t = (time * 0.4 + i / 5) % 1;
        grid.big(30 + t * 26, 16 + Math.sin(i * 2) * 2, '████', { size: 0.9, color: palette.dim, alpha: Math.sin(t * Math.PI) * 0.7, reveal: false });
      }
      grid.object('padlock', 64, 15, 7, anim.spin('pl23', 0.35), { tilt: 0.15, color: G, windowColor: G, key: 'pad23' });
      const t = (time * 0.4) % 1;
      grid.big(74 + t * 34, 16, 'summary', { size: 1.1, color: G, alpha: Math.sin(t * Math.PI), reveal: false });
      grid.big(64, 30, 'RAW THINKING · OFF BY DEFAULT', { size: 1.1, color: palette.dim });
      camera.look(64, 17, 1.06);
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
    shows: 'The camera pushes in on October 15 on the calendar beside a shield (verification) and an eye (oversight); a wall of pull requests piles up in front of one reviewer at a workstation; then a pull request fans out to four reviewer magnifiers, passes a verification scanner that drops false positives, and "6–10 MIN" lands.',
    phases: ['Oct 15: Two Announcements', 'Code Review → GA', 'Parallel Agents + Verifier'],
    captions: [
      'The camera pushes in on October 15; a shield (verification) and an eye (oversight) beside it',
      'A wall of pull requests fills up in front of one human reviewer at a workstation — 8× too many',
      'A PR fans out to four reviewer agents (magnifiers); a verification scanner drops false positives; "6–10 MIN"'
    ],
    narration: [
      `And just days ago, on October 15th, Anthropic made two landmark announcements that directly address the biggest bottleneck in recursive AI development: code verification and safety oversight.`,
      `First, Anthropic moved Claude Code Review into General Availability. Because human engineers can no longer manually keep pace with agents generating eight times more code, Anthropic built a multi-agent verification pipeline that it runs on its own internal pull requests.`,
      `According to the October 15th documentation, when a pull request is opened, multiple Claude agents inspect the diff and surrounding codebase in parallel, followed by a dedicated verification agent that filters out false positives before posting findings in six to ten minutes—three times faster than the preview version.`
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        grid.calendar(50, 18, { month: 'OCTOBER 2026', startDay: 4, marks: { 15: { color: palette.accent } }, focus: 15, key: 'oct24' });
        grid.object('shield3d', 96, 10, 4.2, Math.sin(time * 0.4) * 0.04, { tilt: 0.05, color: G, windowColor: G, key: 's24' });
        grid.text(96, 16, 'verification', G, false, 'center');
        grid.icon('eye', 96, 22, palette.warn, { key: 'e', glow: true, label: 'oversight' });
        if (phaseTime > 1.5 && phaseTime < 5) camera.look(56, 19, 1.5);
        return;
      }
      if (phase === 2) {
        const f = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        grid.fileGrid(46, 15, 12, 6, { filled: f, fillColor: palette.primary, key: 'prs', cell: [4, 3] });
        grid.text(46, 26, 'open pull requests', palette.dim, false, 'center');
        grid.person(90, 8.5, { size: 8, key: 'reviewer', color: palette.warn });
        grid.object('workstation', 90, 21, 8, -0.4, { tilt: 0.3, color: palette.warn, windowColor: palette.warn, key: 'ws24' });
        grid.big(90, 30, '8× THE CODE', { size: 1.1, color: palette.warn });
        return;
      }
      const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
      grid.paper(12, 17, { key: 'pr', venue: 'pull request', w: 11, h: 12, lines: 4, yaw: 0.2 });
      for (let k = 0; k < 4; k++) {
        const y = 6 + k * 7.3;
        grid.vline(18, 17, 30, y, { color: palette.dim, alpha: 0.4, width: 1 });
        grid.object('magnifier', 35, y, 3, 0.1 + Math.sin(time * 0.6 + k) * 0.2, { tilt: 0.1, color: palette.accent, windowColor: palette.accent, key: 'rm' + k });
        grid.vline(40, y, 52, 17, { color: palette.accent, alpha: 0.3, width: 1 });
      }
      grid.scanner(62, 17, { w: 9, h: 14, state: 'scan', label: 'VERIFIER', key: 'ver24', speed: 1.2 });
      for (let i = 0; i < 6; i++) {
        const t = (time * 0.45 + i / 6) % 1;
        const fp = i % 2 === 1;
        if (fp) grid.vdot(68 + t * 10, 17 + t * t * 14, 2, { color: R, alpha: 1 - t });
        else grid.vdot(68 + t * 26, 17, 2.2, { color: G, alpha: Math.sin(t * Math.PI) });
      }
      grid.big(108, 14, '6–10 MIN', { size: 1.8, color: G });
      grid.text(108, 19, '3× faster', palette.accent, false, 'center');
      if (p > 0.1) grid.text(76, 31, 'false positives', R, false, 'center', null, 0.7);
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
    shows: 'Two markdown pages side by side — CLAUDE.md and REVIEW.md; CLAUDE.md feeds a coding agent writing at a monitor; a human code owner writes REVIEW.md line by line for two reviewer agents with magnifiers; the reviewers are padlocked read-only and a human presses a 3D MERGE button.',
    phases: ['Separation of Powers', 'CLAUDE.md → Coding Agent', 'REVIEW.md ← Human Owners', 'Read-Only · Human Merges'],
    captions: [
      'Two pages side by side: CLAUDE.md and REVIEW.md',
      'CLAUDE.md feeds project context into a coding agent, which writes code onto a monitor',
      'A human code owner writes REVIEW.md line by line; it flows to two reviewer agents with magnifiers',
      'The reviewers are padlocked read-only (no build · push · approve); a human’s cursor clicks “Merge pull request” — Merged ✓'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        camera.look(64, 16, 1.1);
        grid.paper(46, 16, { key: 'cmdA', title: 'CLAUDE.md', venue: 'for the coding agent', w: 24, h: 19, lines: 5, yaw: 0.2 });
        grid.paper(82, 16, { key: 'rmdA', title: 'REVIEW.md', venue: 'for the reviewers', w: 24, h: 19, lines: 5, yaw: -0.2, color: palette.warn });
        return;
      }
      if (phase === 2) {
        grid.paper(36, 16, { key: 'cmd', title: 'CLAUDE.md', venue: 'project context', w: 24, h: 19, lines: 5, yaw: 0.2 });
        for (let i = 0; i < 5; i++) {
          const t = (time * 0.6 + i / 5) % 1;
          grid.vdot(50 + t * 22, 14 + Math.sin(t * 6 + i) * 1.5, 1.5, { color: palette.accent, alpha: Math.sin(t * Math.PI) });
        }
        grid.icosahedron3D(84, 8, 2.4, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.object('monitor', 84, 21, 8, 0.2, { tilt: 0.15, color: palette.accent, windowColor: G, key: 'mon25',
          litFn: (i) => hash01(i * 1.3) < Math.min(1, phaseTime * 0.2) });
        grid.text(84, 31, 'coding agent', palette.accent, false, 'center');
        return;
      }
      if (phase === 3) {
        const k = Math.min(6, Math.floor(phaseTime * 1.2));
        grid.person(24, 15, { size: 10, key: 'owner', label: 'CODE OWNER', color: palette.warn });
        grid.paper(58, 16, { key: 'rmd', title: 'REVIEW.md', venue: 'rules · severity · evidence', w: 24, h: 19, lines: 6, yaw: -0.12, color: palette.warn,
          lineColor: (i) => (i >= k ? '#000000' : null) });
        for (let i = 0; i < 2; i++) {
          grid.object('magnifier', 98, 9 + i * 12, 4.2, 0.15 + Math.sin(time * 0.5 + i) * 0.2, { tilt: 0.1, color: palette.warn, windowColor: palette.warn, key: 'rv' + i });
        }
        grid.text(98, 31, 'reviewer agents', palette.warn, false, 'center');
        if (k >= 6) for (let i = 0; i < 2; i++) {
          const t = (time * 0.7 + i * 0.5) % 1;
          grid.vdot(71 + t * 20, 16 + (i ? 1 : -1) * t * 5, 1.5, { color: palette.warn, alpha: Math.sin(t * Math.PI) });
        }
        return;
      }
      grid.object('magnifier', 26, 12, 4.4, 0.15, { tilt: 0.1, color: palette.warn, windowColor: palette.warn, key: 'rvL' });
      const drop = anim.spring('lockdrop', 0, { from: -8, freq: 2, damp: 0.55 });
      grid.object('padlock', 26, 21 + drop, 6.5, anim.spin('pl', 0.4), { tilt: 0.15, color: palette.warn, windowColor: palette.warn, key: 'pad25' });
      grid.text(26, 30, 'build ✕  push ✕  approve ✕', palette.warn, false, 'center');
      const cur = Math.min(1, phaseTime / 2.2);
      const press = phaseTime > 2.3 && phaseTime < 2.8 ? 1 : 0;
      grid.mergeButton(78, 15, { press: anim.spring('press', press, { freq: 8, damp: 0.6 }), merged: phaseTime > 2.8, cursor: cur, sub: 'pull request #48213 · reviewed', key: 'mb25', scale: 1.05 });
      grid.person(78, 27, { size: 6, key: 'merger', label: 'HUMAN', color: G });
      camera.look(64, 17, 1.04);
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
    shows: 'Six evaluators walk into a 3D lab; the camera finds an employee ID badge — internal tools and risk assessments; a bank with its examiner beside the lab with its evaluator; a magnifier sweeps the frontier model and uncovers a hidden mask; a risk report rises, the camera reads it, and it is stamped PUBLISHED with no veto.',
    phases: ['6 METR Evaluators Embedded', 'Like Bank Examiners', 'Auditing for Alignment Faking', 'Publish Without Veto'],
    captions: [
      'Six METR evaluators walk into a 3D lab; the camera pushes in on an employee ID badge: internal tools · risk assessments',
      'Side by side: a bank with its examiner ≈ the lab with its evaluator',
      'A magnifier sweeps the frontier model and uncovers a hidden mask: alignment faking?',
      'A risk report rises out of the lab; the camera reads it; stamped PUBLISHED — "VETO" struck through'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        const s = math.clamp(phaseTime / stageDuration, 0, 1);
        if (s < 0.6) {
          grid.building('lab', 64, 15, 11, 0.42 + Math.sin(time * 0.2) * 0.08, { tilt: 0.3, color: palette.primary, windowColor: G, key: 'lab26' });
          for (let i = 0; i < 6; i++) {
            const enter = math.clamp(phaseTime * 0.42 - i * 0.22, 0, 1);
            const e = enter < 0.5 ? 4 * enter * enter * enter : 1 - Math.pow(-2 * enter + 2, 3) / 2;
            const tx = 54 + i * 4;
            const a = enter > 0.92 ? Math.max(0, 1 - (enter - 0.92) / 0.08) : 1;
            if (a > 0.02) grid.person(-4 + (tx + 4) * e, 29, { size: 4, key: 'm' + i, color: G, alpha: a });
          }
          grid.big(64, 2.5, 'METR × 6', { size: 1.4, color: G });
          return;
        }
        camera.look(64, 16, 1.15);
        grid.object('idBadge', 52, 14, 11, Math.sin(time * 0.5) * 0.12, { tilt: 0.06, color: G, windowColor: G, key: 'badge26' });
        grid.big(80, 11, 'INTERNAL TOOLS', { size: 1.1, color: G, align: 'left' });
        grid.big(80, 15, 'RISK ASSESSMENTS', { size: 1.1, color: G, align: 'left' });
        grid.text(80, 19, 'employee-like access', palette.dim, false, 'left');
        return;
      }
      if (phase === 2) {
        grid.building('bank', 36, 13, 9, 0.42, { tilt: 0.3, color: palette.accent, windowColor: palette.warn, key: 'bank26' });
        grid.person(31, 28, { size: 5, key: 'exam', label: 'EXAMINER', color: palette.accent });
        grid.object('briefcase', 42, 29, 2.6, 0.4, { tilt: 0.2, color: palette.accent, windowColor: palette.warn, key: 'bc26' });
        for (const dy of [-1.1, 1.1]) {
          const wave = [];
          for (let i = 0; i <= 16; i++) wave.push([59 + i * 0.625, 14 + dy + Math.sin((i / 16) * Math.PI * 2) * 0.55]);
          grid.vpath(wave, { color: '#ffffff', alpha: 0.95, width: 2.4, glow: true });
        }
        grid.building('lab', 92, 14, 7.5, 0.42, { tilt: 0.3, color: palette.primary, windowColor: G, key: 'lab26b' });
        grid.person(92, 28, { size: 5, key: 'eval', label: 'EVALUATOR', color: G });
        return;
      }
      if (phase === 3) {
        camera.look(64, 16, 1.15);
        grid.icosahedron3D(64, 16, 4, anim.spin('a', 0.35), anim.spin('b', 0.45), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        const sx = 64 + Math.sin(time * 0.9) * 16;
        grid.object('magnifier', sx, 14, 5.5, 0.1, { tilt: 0.1, color: palette.warn, windowColor: palette.warn, key: 'mag26' });
        const near = Math.max(0, 1 - Math.abs(sx - 74) / 6);
        if (near > 0.05) {
          grid.icon('agentMask', 74, 15, R, { key: 'mask', glow: true, alpha: near });
          grid.glow(74, 15, 4, R, near * 1.4);
          grid.big(74, 23, 'ALIGNMENT FAKING?', { size: 1, color: R, alpha: near, reveal: false });
        }
        return;
      }
      const rise = anim.spring('rep', 15, { from: 30, freq: 1.2, damp: 0.85 });
      grid.paper(56, rise, { key: 'risk', title: 'Frontier Risk Report', authors: 'METR · independent', venue: 'Published', w: 26, h: 20, lines: 5, color: G, stamp: phaseTime > 3.2 ? 'PUBLISHED' : '', stampColor: G });
      if (phaseTime > 1.2 && phaseTime < 3.2) camera.look(56, rise - 6.5, 1.6);
      if (phaseTime > 3.6) {
        grid.big(92, 15, 'VETO', { size: 2, color: R, alpha: 0.55 });
        grid.vline(84, 15, 100, 15, { color: R, alpha: 0.95, width: 2.2 });
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
    shows: 'OpenAI’s October release notes roll in, dated Oct 15–20; the four GPT-6 models line up; Astra scans a wall of files, two turn red with zero-days and the camera pushes in on them; then its token bar comes in far shorter than GPT-5.6’s.',
    phases: ['Mid–Late October', 'The GPT-6 Family', 'Astra Finds Two Zero-Days'],
    captions: [
      'OpenAI release notes roll in, dated Oct 15–20',
      'Four models line up: Astra · Sol · 6.1 Sol · Luna',
      'Astra scans a wall of files; two turn red with zero-days as the camera pushes in; its token bar lands far shorter than 5.6’s'
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
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        grid.releaseNotes(64, 17, { product: 'OpenAI', version: 'Release notes', date: 'Oct 15–20', key: 'oa27', color: palette.primary,
          items: [{ tag: 'NEW', text: 'GPT-6 Astra · Sol · Luna' }, { tag: 'NEW', text: 'GPT-6 Pro parallel agents' }, { tag: 'IMPROVED', text: 'Codex parallel tools' }, { tag: 'SECURITY', text: 'Daybreak · Codex Security' }] });
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
        grid.big(64, 29, 'GPT-6', { size: 1.6, color: palette.dim });
        return;
      }
      const scan = math.clamp(phaseTime / (stageDuration * 0.55), 0, 1);
      const tokens = phaseTime > stageDuration * 0.62;
      grid.icosahedron3D(12, 15, 2.6, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.text(12, 21, 'Astra', G, true, 'center');
      const cols = 12;
      const rows = 6;
      const cx = 50;
      const cy = 15;
      grid.fileGrid(cx, cy, cols, rows, { filled: scan, fillColor: palette.primary, key: 'astraScan', cell: [4, 3.2], alpha: tokens ? 0.35 : 1 });
      const vulns = [[3, 1], [9, 4]];
      vulns.forEach((v, i) => {
        if (scan < (i + 1) * 0.45) return;
        const x = cx - (cols * 4) / 2 + v[0] * 4 + 1.2;
        const y = cy - (rows * 3.2) / 2 + v[1] * 3.2 + 1;
        grid.icon('bug', x, y, R, { key: 'z' + i, glow: true });
      });
      if (scan > 0.9 && !tokens) {
        grid.big(50, 29, '2 ZERO-DAYS', { size: 1.8, color: R });
        camera.look(58, 17, 1.12);
      }
      if (tokens) grid.barChart(84, 6, 30, 19, [{ value: 100, label: 'GPT-5.6', color: palette.primary }, { value: 45, label: 'ASTRA', color: G }], { yMax: 110, format: () => '', key: 'tokens' });
      if (tokens) grid.text(99, 29, 'output tokens', palette.dim, false, 'center');
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
    shows: 'Astra runs its own loop while a CCTV camera of human oversight watches; a verification scanner stands in a glass fence with one panel missing — a misconfiguration and a tempting shortcut; Astra’s work passes through the scanner every time and the bypass counter stays at 0.',
    phases: ['Would It Subvert Oversight?', 'A Misconfigured Gate', 'Never Tried to Bypass'],
    captions: [
      'GPT-6 Astra runs its autonomous loop; a 3D CCTV camera (human oversight) watches from above',
      'A review scanner in a glass fence — one panel is missing (misconfiguration) and a red shortcut beckons: "auto-review denial"',
      'Astra’s work passes through the scanner every time — PASS; the bypass counter stays at a large "0"'
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
      const { time, phase, phaseTime, grid, palette, anim, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;

      if (phase === 1) {
        camera.look(64, 15, 1 + Math.min(0.12, phaseTime * 0.04));
        grid.icosahedron3D(56, 11, 3.2, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.text(56, 18, 'GPT-6 Astra', G, true, 'center');
        grid.pipeline(32, 80, 27, ['plan', 'act', 'submit'], { loop: true, loopDepth: 3, color: G, speed: 0.7, key: 'astraL', radius: 2.6 });
        grid.object('cctv', 98, 8, 7, -0.9 + Math.sin(time * 0.6) * 0.25, { tilt: 0.2, color: palette.accent, windowColor: palette.danger, key: 'cam28' });
        grid.text(98, 17, 'human oversight', palette.accent, false, 'center');
        return;
      }
      const fx = 64;
      const t = (time * 0.45) % 1;
      const atGate = phase === 3 && t > 0.4 && t < 0.62;
      grid.scanner(fx, 15, { w: 8, h: 12, state: phase === 3 ? (atGate ? 'pass' : 'scan') : 'scan', label: 'REVIEW', key: 'rev28', speed: 1.1 });
      grid.glassBox(fx, 4, 2, 4, 10, { color: palette.warn, key: 'fT', rotY: 0.2, tilt: -0.12, alpha: 0.7 });
      grid.glassBox(fx, 25.5, 2, 3, 10, { color: palette.warn, key: 'fB', rotY: 0.2, tilt: -0.12, alpha: 0.7 });
      grid.glassBox(fx, 31, 2, 3, 10, { color: palette.warn, key: 'fG', rotY: 0.2, tilt: -0.12, alpha: phase === 2 ? 0.06 : 0.7 });
      grid.icosahedron3D(30, 15, 2.6, anim.spin('a', 0.6), anim.spin('b', 0.8), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.text(30, 21, 'Astra', G, true, 'center');
      if (phase === 2) {
        grid.glow(fx, 30.5, 3, R, 1.2 + 0.4 * Math.sin(time * 5));
        grid.vpath([[34, 18], [50, 28], [fx, 30.5], [96, 28]], { color: R, alpha: 0.6, width: 1.4, dash: [3, 3] });
        grid.big(98, 31, '“AUTO-REVIEW DENIAL”', { size: 0.9, color: R });
        camera.look(64, 20, 1.08);
        return;
      }
      grid.vdot(34 + t * 66, 15, 2.8, { color: G });
      grid.glow(34 + t * 66, 15, 2, G, 1);
      grid.big(98, 13, '0', { size: 4, color: G });
      grid.text(98, 20, 'bypass attempts', G, false, 'center');
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
    shows: 'The GPT-6 Pro release note rolls in (Oct 16); a single chain of thought crawls step by step; it forks into four lanes of specialized agents running in parallel; each lane ends in a check and a magnifier inspects the traces.',
    phases: ['Oct 16 · GPT-6 Pro', 'One Linear Chain', 'Parallel Specialized Agents', 'Inspect Each Trace'],
    captions: [
      'The GPT-6 Pro release note rolls in: Oct 16 · native parallel multi-agent execution',
      'One chain of thought crawls step by step across the screen',
      'The chain forks into four lanes; four agents race in parallel',
      'Each lane ends in a glowing check; a 3D magnifier slides down the traces'
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
      const { phase, phaseTime, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      if (phase === 1) {
        grid.releaseNotes(64, 17, { product: 'OpenAI', version: 'GPT-6 Pro', date: 'Oct 16', key: 'pro29', color: palette.primary, highlight: phaseTime > 3 ? 0 : undefined,
          items: [{ tag: 'NEW', text: 'Native parallel multi-agent execution' }, { tag: 'NEW', text: 'Inspectable per-agent traces' }] });
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
        camera.look(64 + (22 + Math.max(0, n - 1) * 7 - 64) * 0.25, 17, 1.06);
        return;
      }
      const lanes = ['search', 'code', 'math', 'verify'];
      lanes.forEach((l, i) => {
        const y = 7 + i * 7;
        grid.vpath([[16, 17], [26, y], [32, y]], { color: G, alpha: 0.5, width: 1.3 });
        grid.icon('agent', 36, y, G, { key: 'l' + i });
        grid.text(42, y, l, palette.accent, false, 'left');
        const p = phase === 3 ? math.clamp(phaseTime * (0.3 + i * 0.07), 0, 1) : 1;
        drawHBar(grid, 52, y, 50, p, G);
        if (phase === 4) grid.text(108, y, '✓', G, true, 'center');
      });
      if (phase === 4) {
        const my = 7 + ((ctx.time * 0.5) % 1) * 21;
        grid.object('magnifier', 118, my, 3.4, 0.1, { tilt: 0.1, color: palette.warn, windowColor: palette.warn, key: 'mag29' });
      }
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
    shows: 'The Codex release notes roll in beside a 3D laptop; three read-only lookups fire at once to skills, memory and history; an engineer’s phone sends a steering message into the running turn, then an interrupt halts every Code Mode cell; finally bugs are hunted, validated and flip into shields.',
    phases: ['Codex Release Notes', 'Parallel Read-Only Tools', 'Live Steering · Hard Interrupts', 'Daybreak: Hunt · Validate · Patch'],
    captions: [
      'The Codex release notes roll in beside a 3D laptop running Codex',
      'Three lookups fire at once — skills, memory, history — and return together',
      'An engineer steers from their phone mid-run ("use the v2 API"); then an interrupt halts every running cell',
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      const lx = phase === 1 ? 26 : 22;
      grid.object('laptop', lx, 17, phase === 1 ? 7 : 6, 0.5 + Math.sin(time * 0.4) * 0.12, { tilt: 0.35, color: palette.accent, windowColor: palette.accent, key: 'codex' });
      grid.text(lx, 25, 'Codex', palette.accent, true, 'center');

      if (phase === 1) {
        grid.releaseNotes(82, 17, { product: 'OpenAI Codex', version: 'Release notes', date: 'October', key: 'cx30', color: palette.primary, width: 56,
          items: [{ tag: 'NEW', text: 'Parallel read-only tools' }, { tag: 'NEW', text: 'Live steering mid-turn' }, { tag: 'IMPROVED', text: 'Interrupts halt Code Mode cells' }, { tag: 'SECURITY', text: 'Daybreak on by default' }] });
        return;
      }
      if (phase === 2) {
        const targets = [['file', 'skills', 7], ['database', 'memory', 17], ['monitor', 'history', 27]];
        targets.forEach((t, i) => {
          if (i === 0) grid.paper(100, t[2], { key: 'sk30', w: 8, h: 6, lines: 2, color: G });
          else grid.object(t[0], 100, t[2] - 1, i === 1 ? 2.6 : 3.4, 0.3, { tilt: 0.25, color: G, windowColor: G, key: 'lk' + i });
          grid.text(108, t[2], t[1], G, false, 'left');
          drawCleanLink(grid, time, 30, 17, 94, t[2], '', palette.dim, G, 1.3);
        });
        grid.big(62, 31, 'ALL AT ONCE', { size: 1.2, color: G });
        return;
      }
      if (phase === 3) {
        const halted = phaseTime > stageDuration * 0.6;
        for (let i = 0; i < 6; i++) {
          const x = 50 + (i % 3) * 13;
          const y = 13 + Math.floor(i / 3) * 8;
          const run = !halted && Math.floor(time * 5 + i) % 3 === 0;
          grid.vline(x - 4, y, x + 4, y, { color: halted ? palette.dim : (run ? '#ffffff' : palette.primary), alpha: halted ? 0.4 : 0.9, width: 5 });
        }
        grid.object('phone', 106, 16, 6.5, -0.25 + Math.sin(time * 0.5) * 0.08, { tilt: 0.1, color: palette.warn, windowColor: palette.warn, key: 'ph30' });
        if (!halted) {
          const t = math.clamp((phaseTime % 3.2) / 2.4, 0, 1);
          grid.chatBubble(100 - t * 52, 5, 'use the v2 API', { color: palette.warn, align: 'right', alpha: Math.min(1, (1 - t) * 3) });
        } else {
          grid.big(63, 30, 'HALT', { size: 2.2, color: R });
          camera.look(64, 18, 1.1);
        }
        return;
      }
      const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
      ['hunt', 'validate', 'patch'].forEach((s, i) => grid.text(52 + i * 24, 7, s, p > i / 3 ? G : palette.dim, p > i / 3, 'center'));
      for (let i = 0; i < 3; i++) {
        const patched = p > 0.66 + i * 0.1;
        const x = 52 + i * 24;
        if (patched) grid.object('shield3d', x, 18, 4, Math.sin(time * 0.4 + i) * 0.04, { tilt: 0.05, color: G, windowColor: G, key: 'pt' + i });
        else grid.icon('bug', x, 19, R, { key: 'vb' + i, glow: true });
      }
      grid.text(76, 29, 'Daybreak · Codex Security', palette.dim, false, 'center');
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
    shows: 'Nested 3D glass boxes build up around an agent: bubblewrap hides every folder but /workspace; seccomp lets read/write through and stops ptrace/mount at the kernel line; finally the legacy shell is struck out and a hardened shell takes its place.',
    phases: ['How Agents Are Isolated', 'bubblewrap: Filesystem', 'seccomp: System Calls', 'Hardened Shell Executor'],
    captions: [
      'An agent alone, ready to be wrapped',
      'Box 1 (bubblewrap): only /workspace stays visible; /home, /etc and ~/.ssh lock away',
      'Box 2 (seccomp): read/write pass the kernel line; ptrace/mount stop dead',
      'Box 3: the legacy shell is struck out; a hardened shell shield replaces it'
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
      const cx = anim.spring('cx31', phase === 1 ? 64 : 30, { freq: 1.4 });
      const cy = 17;
      const boxes = [['bubblewrap', G, 2, 16, 12], ['seccomp', palette.warn, 3, 26, 18], ['hardened shell', palette.accent, 4, 36, 24]];
      boxes.forEach((b, i) => {
        if (phase < b[2]) return;
        grid.glassBox(cx, cy, b[3], b[4], b[3] * 0.8, { color: b[1], key: 'box' + i, rotY: 0.35, tilt: -0.2, label: b[0], alpha: 0.85 });
      });
      if (phase === 4 && ctx.phaseTime < 2.5) ctx.camera.look(cx, cy, 1.25);
      grid.icosahedron3D(cx, cy, anim.spring('as31', phase === 1 ? 3.4 : 2, { freq: 1.6 }), anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
      if (phase === 1) grid.text(cx, cy + 8, 'autonomous agent', palette.accent, false, 'center');

      if (phase === 2) {
        const fs = [['/workspace', true], ['/home', false], ['/etc', false], ['~/.ssh', false]];
        fs.forEach((f, i) => {
          const y = 8 + i * 6;
          grid.paper(70, y, { key: 'f' + i, w: 7, h: 5, lines: 2, color: f[1] ? G : palette.dim, alpha: f[1] ? 1 : 0.5 });
          if (!f[1]) grid.icon('lock', 70, y, palette.dim, { key: 'lk' + i, alpha: 0.8 });
          grid.text(77, y, f[0], f[1] ? G : palette.dim, f[1], 'left', null, f[1] ? 1 : 0.5);
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
        grid.object('monitor', 76, 12, 5, 0.3, { tilt: 0.15, color: palette.dim, windowColor: palette.dim, key: 'old31', alpha: 0.6 });
        grid.vline(68, 7, 84, 17, { color: R, alpha: 0.9, width: 2.2 });
        grid.text(76, 21, 'legacy patched shell', palette.dim, false, 'center');
        grid.object('shield3d', 106, 12, 6, Math.sin(time * 0.4) * 0.04, { tilt: 0.05, color: G, windowColor: G, key: 'hard31' });
        grid.text(106, 21, 'hardened executor', G, true, 'center');
        drawCleanLink(grid, time, 86, 12, 98, 12, '', palette.dim, G, 0.9);
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
    shows: 'Anthropic’s and OpenAI’s October release-note feeds side by side; they fold away into a timeline that runs from October into 2027, the camera travelling along it past three forecast milestones.',
    phases: ['Anthropic | OpenAI', 'A Clear Picture → 2027'],
    captions: [
      'Anthropic’s and OpenAI’s October release-note feeds, side by side',
      'The feeds fold away into a timeline: Nov · Dec · Jan 2027 with three forecast milestones; the camera travels to 2027'
    ],
    narration: [
      `When you put Anthropic's and OpenAI's October documentation side by side,`,
      `a remarkably clear picture emerges of what the next couple of months are going to look like as we close out 2026 and enter 2027.`
    ],
    stageMinimums: [4, 5],
    init(ctx) {},
    onPhaseChange(phase, ctx) {},
    update(ctx) {
      const { phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      if (phase === 1) {
        grid.releaseNotes(34, 17, { product: 'Anthropic', version: 'October', width: 50, rowH: 4.2, key: 'an32', items: [{ tag: 'NEW', text: 'Claude 5.5 models' }, { tag: 'SECURITY', text: 'allowed_hosts sandbox' }, { tag: 'GA', text: 'Code Review · METR inside' }] });
        grid.releaseNotes(94, 17, { product: 'OpenAI', version: 'October', width: 50, rowH: 4.2, key: 'oa32', color: palette.primary, items: [{ tag: 'NEW', text: 'GPT-6 · GPT-6 Pro' }, { tag: 'IMPROVED', text: 'Codex parallel tools' }, { tag: 'SECURITY', text: 'bubblewrap + seccomp' }] });
        return;
      }
      const s = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
      const xOf = grid.timeline(14, 114, 20, { from: 0, to: 4, ticks: 1, label: (v) => ['OCT', 'NOV', 'DEC', 'JAN 2027', 'FEB'][Math.round(v)], key: 'tl32', progress: Math.min(1, 0.3 + s),
        events: [{ at: 0.6, label: 'now', color: palette.accent, above: false }, { at: 1.4, label: 'loops for every team', color: G }, { at: 2.2, label: 'verification battleground', color: palette.warn, above: false }, { at: 3.1, label: 'ignition?', color: '#ffaa00' }] });
      camera.look(52 + s * 24, 19, 1.1);
      if (s > 0.75) grid.big(xOf(3), 10, '2027', { size: 3, color: G });
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
    shows: 'Cities light up across a rotating globe; two brick walls (cost · latency) crumble as their causes appear; at night an office tower sits dark except one glowing floor where two loops keep running while the clock passes midnight; by 07:00 the overnight changelog has written itself.',
    phases: ['Democratized RSI Loops', 'Cost & Latency Barriers Collapse', 'Overnight Inner + Outer Loops', 'While the Team Sleeps'],
    captions: [
      'Cities light up one by one across a rotating globe as teams start their own loops',
      'Two brick walls — COST and LATENCY — crumble: parallel subagents · 1M-token context · ~10¢ cache reads',
      'Night: an office tower goes dark except one glowing floor; an inner and an outer loop keep running past midnight',
      'By 07:00 the overnight changelog has written itself: refactor · queries · kernels · its own harness'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        const spread = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        const cities = [[37.8, -122.4], [40.7, -74], [51.5, -0.1], [48.9, 2.4], [52.5, 13.4], [19.1, 72.9], [12.97, 77.6], [1.35, 103.8], [35.7, 139.7], [37.6, 127], [-33.9, 151.2], [-23.6, -46.6], [43.7, -79.4], [59.3, 18.1], [31.2, 121.5], [25.2, 55.3], [6.5, 3.4], [-1.3, 36.8]];
        const markers = cities.filter((c, i) => hash01(i * 1.7) < spread).map(c => ({ lat: c[0], lon: c[1], color: G }));
        grid.globe(64, 18, 14, { spin: anim.spin('earth', 0.22) + 0.4, markers });
        camera.look(64, 18, 1 + spread * 0.12);
        return;
      }
      if (phase === 2) {
        const s = math.clamp(phaseTime / stageDuration, 0, 1);
        const fall = math.clamp((s - 0.25) / 0.6, 0, 1);
        grid.brickWall(40, 25, 7, 9, { fall, label: 'COST', key: 'wc' });
        grid.brickWall(88, 25, 7, 9, { fall: math.clamp(fall * 1.1 - 0.05, 0, 1), label: 'LATENCY', key: 'wl' });
        const causes = ['parallel subagents', '1M-token context', '~10¢ cache reads'];
        causes.forEach((c, i) => {
          if (s < 0.2 + i * 0.12) return;
          grid.big(28 + i * 36, 31, c.toUpperCase(), { size: 0.85, color: G });
        });
        return;
      }
      if (phase === 3) {
        const night = math.clamp(phaseTime / stageDuration, 0, 1);
        const mins = 22 * 60 + night * 5 * 60;
        grid.big(38, 3, `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(Math.floor(mins % 60)).padStart(2, '0')}`, { size: 1.8, color: palette.accent, reveal: false });
        grid.object('office', 38, 18, 9, 0.5 + Math.sin(time * 0.15) * 0.08, { tilt: 0.3, color: palette.primary, windowColor: G, key: 'office33',
          litFn: (i) => (Math.floor(i / 12) === 2 ? Math.sin(time * 3 + i) > -0.6 : hash01(i * 7) > 0.8 + night * 0.2) });
        grid.big(76, 9, 'INNER', { size: 0.95, color: palette.warn, align: 'left' });
        grid.pipeline(80, 118, 14, ['propose', 'run', 'score'], { loop: true, loopDepth: 3, color: palette.warn, speed: 1.1, key: 'in33', radius: 2.3 });
        grid.big(76, 22, 'OUTER', { size: 0.95, color: G, align: 'left' });
        grid.pipeline(80, 118, 27, ['inspect', 'rewrite', 'verify'], { loop: true, loopDepth: 3, color: G, speed: 0.3, key: 'out33', radius: 2.3 });
        return;
      }
      const p = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
      camera.look(64, 17, 1.05);
      grid.releaseNotes(64, 17, { product: 'team-repo · overnight', version: '07:00', date: 'while you slept', key: 'night33', progress: 0.6 + p * 1.6,
        items: [{ tag: 'IMPROVED', text: 'Refactored the payments module' }, { tag: 'IMPROVED', text: 'Database queries 3.1× faster' }, { tag: 'IMPROVED', text: 'GPU kernels re-tuned' }, { tag: 'NEW', text: 'Harness rewrote its own tools' }] });
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
    shows: 'A spotlight moves from a monitor full of generated code to a checkpoint with a magnifier; an 8× pile of code pours into a funnel that narrows to a single human reviewer; writers and read-only watchdogs form two separate teams, each from its own markdown file; each team is sealed into its own sandbox.',
    phases: ['Generation → Verification', 'Review Is the Ceiling', 'Writers | Watchdogs', 'All Inside Sandboxes'],
    captions: [
      'A spotlight slides from GENERATION (a monitor of code) to VERIFICATION (a checkpoint and magnifier)',
      'An 8× pile of code pours into a funnel that narrows to a single human reviewer — the ceiling',
      'Two separate teams: CLAUDE.md → writer agents · REVIEW.md → read-only watchdogs with magnifiers',
      'Each team is sealed in its own glass sandbox — seccomp · allowed_hosts — as the camera pulls back'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        const k = anim.spring('spot', 1, { from: 0, freq: 0.9 });
        const sx = 34 + k * 60;
        grid.glow(sx, 16, 14, G, 1.2);
        grid.object('monitor', 34, 15, 9, 0.25, { tilt: 0.15, color: k < 0.5 ? palette.accent : palette.dim, windowColor: palette.accent, key: 'gen34' });
        grid.big(34, 29, 'GENERATION', { size: 1.4, color: palette.dim, alpha: 1 - k * 0.5 });
        grid.scanner(94, 15, { w: 13, h: 15, state: k > 0.6 ? 'pass' : 'scan', key: 'ver34', progress: 0.3 + k * 0.7 });
        grid.big(94, 29, 'VERIFICATION', { size: 1.4, color: G, alpha: 0.35 + k * 0.65 });
        camera.look(64 + (sx - 64) * 0.12, 17, 1.04);
        return;
      }
      if (phase === 2) {
        const f = math.clamp(phaseTime / (stageDuration * 0.6), 0, 1);
        grid.fileGrid(64, 4.5, 18, 2, { filled: f, fillColor: palette.accent, key: 'pile34', cell: [3.4, 2.4] });
        grid.object('funnel', 64, 16, 9, 0.2, { tilt: 0.35, color: palette.accent, key: 'fun34' });
        for (let i = 0; i < 10; i++) {
          const t = (time * 0.7 + i / 10) % 1;
          const x = 64 + (hash01(i) - 0.5) * 26 * (1 - t);
          grid.vdot(x, 8 + t * 16, 1.4, { color: palette.accent, alpha: Math.sin(t * Math.PI) });
        }
        grid.person(64, 29, { size: 5, key: 'rev34', color: R });
        grid.big(100, 26, 'ONE REVIEWER', { size: 1.1, color: R });
        grid.big(24, 12, '8×', { size: 3, color: palette.accent });
        return;
      }
      const groups = [[32, palette.accent, 'CLAUDE.md', 'WRITE'], [96, palette.warn, 'REVIEW.md', 'AUDIT · READ-ONLY']];
      groups.forEach((g, j) => {
        grid.paper(g[0], 8.5, { key: 'md' + j, title: g[2], w: 14, h: 9, lines: 2, color: g[1], yaw: j ? -0.15 : 0.15 });
        for (let i = 0; i < 2; i++) {
          const x = g[0] - 8 + i * 16;
          if (j === 0) grid.icosahedron3D(x, 21, 2, anim.spin('w' + i, 0.6), anim.spin('v' + i, 0.7), 0, { color: g[1], accent: '#ffffff', dim: palette.dim });
          else grid.object('magnifier', x, 20, 3.6, 0.15 + Math.sin(time * 0.5 + i) * 0.2, { tilt: 0.1, color: g[1], windowColor: g[1], key: 'wd' + i });
        }
        grid.big(g[0], 28, g[3], { size: 0.95, color: g[1] });
      });
      if (phase === 4) {
        camera.look(64, 17, 0.97);
        grid.glassBox(32, 18, 44, 26, 24, { color: G, key: 'sbA', rotY: 0.12, tilt: -0.2, label: 'seccomp' });
        grid.glassBox(96, 18, 44, 26, 24, { color: G, key: 'sbB', rotY: -0.12, tilt: -0.2, label: 'allowed_hosts' });
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
    shows: 'A rocket waits on the pad between "net-positive" and "ignition"; a 3D ladder of four levels with today’s marker climbing to rung three; a chart shows the loop’s quality outrunning human iteration under a human-written rubric; then the rubric falls away and the rocket ignites and lifts off.',
    phases: ['Net-Positive → Ignition', 'Today: Net-Positive', 'Beats Humans on a Rubric', 'Ignition: No Human Rubric'],
    captions: [
      'A 3D rocket waits on the pad, venting: NET-POSITIVE → IGNITION',
      'A four-level industry scale fills segment by segment; the TODAY marker stops at level 3: net-positive',
      'Under a human-written rubric, the loop’s quality line outruns human iteration',
      'The rubric falls away; the rocket ignites and lifts off as the camera follows: ignition'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const IGN = '#ffaa00';
      if (phase === 1) {
        camera.look(64, 16, 1 + Math.min(0.15, phaseTime * 0.05));
        grid.object('rocket', 64, 15, 8, 0.4 + Math.sin(time * 0.3) * 0.1, { tilt: 0.12, color: palette.accent, windowColor: palette.accent, key: 'rk35' });
        for (let i = 0; i < 8; i++) {
          const t = (time * 0.6 + i / 8) % 1;
          grid.vdot(64 + (hash01(i) - 0.5) * 10 * t, 22 + t * 2, 1.4 + t * 2, { color: palette.dim, alpha: (1 - t) * 0.5 });
        }
        grid.big(64, 31, 'NET-POSITIVE  →  IGNITION', { size: 1.3, color: G });
        return;
      }
      if (phase === 2) {
        const v = anim.spring('climb', 3, { from: 0.4, freq: 0.7, damp: 0.85 });
        grid.levelMeter(58, 17, { levels: ['LEVEL 1', 'LEVEL 2', '“NET-POSITIVE”', '“IGNITION”'], value: v, colors: [palette.primary, palette.primary, G, IGN], marker: 'TODAY', h: 26, w: 8 });
        grid.big(64, 2.5, 'FOUR-LEVEL INDUSTRY SCALE', { size: 1, color: palette.dim });
        return;
      }
      if (phase === 3) {
        const p = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
        grid.paper(18, 12, { key: 'rub', title: 'Rubric', venue: 'human-written', w: 13, h: 11, lines: 3, yaw: 0.2 });
        grid.lineChart(36, 6, 76, 20, [
          { values: [10, 22, 37, 52, 66, 78, 88], color: G, label: 'loop' },
          { values: [10, 14, 18, 23, 27, 31, 35], color: palette.accent, label: 'human', dash: [3, 3], width: 1.6 }
        ], { yMax: 100, progress: p, xLabels: ['', '', '', '', '', '', 'iterations'] });
        grid.text(74, 30, 'quality on the rubric', palette.dim, false, 'center');
        return;
      }
      const lift = math.clamp((phaseTime - 1.5) / 4, 0, 1);
      const y = 15 - lift * lift * 16;
      camera.look(64, Math.max(6, y + 4), 1.08);
      const fall = math.clamp(phaseTime / 2, 0, 1);
      grid.paper(22 - fall * 6, 10 + fall * fall * 26, { key: 'rubx', title: 'Rubric', w: 12, h: 10, lines: 3, yaw: 0.2 + fall, color: palette.dim, alpha: 1 - fall * 0.8 });
      grid.object('rocket', 64, y, 8, 0.4 + time * 0.2, { tilt: 0.12, color: IGN, windowColor: IGN, key: 'rk35b' });
      const ign = math.clamp((phaseTime - 0.8) / 0.7, 0, 1);
      for (let i = 0; i < 16; i++) {
        const t = (time * 2.2 + i / 16) % 1;
        grid.vdot(64 + (hash01(i * 3 + Math.floor(time * 2.2)) - 0.5) * 4 * t, y + 7 + t * 9, (3 - t * 2) * ign, { color: t < 0.3 ? '#ffffff' : IGN, alpha: (1 - t) * ign });
      }
      grid.glow(64, y + 8, 5, IGN, 1.6 * ign);
      if (lift > 0.25) grid.big(64, 31, 'IGNITION', { size: 2.4, color: IGN });
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
    shows: 'A balance scale tips back and forth between safety and speed; Anthropic’s forecast on recursive self-improvement, the camera reading its title, then a pacing needle swinging from people to a datacenter; finally the camera pulls back from a single person at a workstation to reveal a vast red datacenter running beyond them.',
    phases: ['The Tension', 'Paced by Compute, Not People', 'Humans Become Overseers'],
    captions: [
      'A balance scale tips back and forth — SAFETY against SPEED — never settling',
      'Anthropic’s forecast on recursive self-improvement (camera on the title), then a needle swings from people to a datacenter: paced by compute',
      'Close on one person at a workstation watching; the camera pulls back to reveal a vast red datacenter racing beyond them'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        camera.look(64, 16, 1.08);
        const pans = grid.balance(64, 15, 9, Math.sin(time * 0.9) * 0.16 + Math.sin(time * 2.3) * 0.04, { color: palette.accent, key: 'bal36' });
        grid.object('shield3d', pans.left.x, pans.left.y - 4.6, 5.2, 0.02, { tilt: 0.05, color: G, windowColor: G, key: 'sh36' });
        grid.object('stopwatch', pans.right.x, pans.right.y - 4.8, 5, 0.02, { tilt: 0.05, color: R, windowColor: R, handPeriod: 0.5, key: 'sp36' });
        grid.big(pans.left.x, 30, 'SAFETY', { size: 1.2, color: G });
        grid.big(pans.right.x, 30, 'SPEED', { size: 1.2, color: R });
        return;
      }
      if (phase === 2) {
        const s = math.clamp(phaseTime / stageDuration, 0, 1);
        if (s < 0.35) {
          grid.paper(64, 17, { key: 'fc36', title: 'Forecasting Recursive Self-Improvement', authors: 'Anthropic', venue: 'Forecast', w: 32, h: 24, lines: 6, highlight: 4 });
          camera.look(64, s < 0.2 ? 8.5 : 15, s < 0.2 ? 1.7 : 1.3);
          return;
        }
        const p = math.clamp((s - 0.35) / 0.45, 0, 1);
        const a = -Math.PI * 0.8 + p * Math.PI * 1.6;
        const pts = [];
        for (let i = 0; i <= 40; i++) {
          const t = -Math.PI * 0.8 + (i / 40) * Math.PI * 1.6 - Math.PI / 2;
          pts.push([64 + Math.cos(t) * 24, 26 + Math.sin(t) * 13]);
        }
        grid.vpath(pts, { color: palette.dim, alpha: 0.5, width: 2 });
        grid.vline(64, 26, 64 + Math.cos(a - Math.PI / 2) * 22, 26 + Math.sin(a - Math.PI / 2) * 12, { color: '#ffffff', alpha: 0.95, width: 2.4 });
        grid.vdot(64, 26, 3, { color: '#ffffff' });
        grid.person(28, 16, { size: 10, key: 'h', alpha: 1 - p * 0.6, label: 'PEOPLE' });
        grid.building('hall', 100, 17, 7, 0.42 + Math.sin(time * 0.3) * 0.12, { progress: p, tilt: 0.45, color: R, windowColor: R, key: 'hall36' });
        if (p > 0.7) grid.big(100, 29, 'COMPUTE', { size: 1.6, color: R });
        return;
      }
      const s = math.clamp(phaseTime / (stageDuration * 0.7), 0, 1);
      const e = s * s * (3 - 2 * s);
      camera.look(100 + (64 - 100) * e, 25 + (17 - 25) * e, 1.8 - e * 0.85);
      grid.building('hall', 52, 15, 9, 0.42 + Math.sin(time * 0.2) * 0.05, { tilt: 0.42, color: R, windowColor: R, key: 'hall36b',
        litFn: (i) => Math.sin(time * 9 + i * 1.7) > 0 });
      grid.person(101, 23, { size: 4, key: 'over', color: palette.accent });
      grid.object('workstation', 101, 29, 4, -0.5, { tilt: 0.3, color: palette.accent, windowColor: R, key: 'ws36' });
      if (e > 0.85) grid.big(101, 33.5, 'OVERSEER', { size: 0.9, color: palette.accent });
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
    shows: 'One generation passes through a checkpoint with a tiny flaw hidden inside — the checkpoint stays green; a "bug fix" release note appears and is struck through — it’s worse than that; a training dataset tinged red flows into the next generation; then a chain of ever-larger generations turns red one after another while a stopwatch races and human control drains to zero.',
    phases: ['A Subtle Flaw Slips Through', 'Not Just a Buggy Release', 'Baked Into Training', 'Compounding at 50×'],
    captions: [
      'A generation glides through a verification scanner; a tiny red flaw hides inside it and the scanner still says PASS',
      'A "bug fix" release note appears — then is struck through: worse than a buggy release',
      'A training dataset, partly red, flows from Gen 1 into Gen 2',
      'A chain of ever-larger generations turns red one by one at 50× while an hourglass flips and flips and human control drains to zero'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        const x = anim.spring('gx', 96, { from: 20, freq: 0.7, damp: 0.9 });
        camera.look(64 + (x - 64) * 0.12, 16, 1.08);
        grid.scanner(60, 16, { w: 12, h: 14, state: x > 62 ? 'pass' : 'scan', key: 'sc37', speed: 1 });
        grid.icosahedron3D(x, 16, 3, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
        grid.vdot(x + 0.8, 16.5, 1.3, { color: R, alpha: 0.6 + 0.4 * Math.sin(time * 6) });
        return;
      }
      if (phase === 2) {
        grid.releaseNotes(64, 15, { product: 'model release', version: 'v1.0.1', date: 'patch', key: 'rel37', width: 50, items: [{ tag: 'FIX', text: 'Minor bug fixes' }, { tag: 'IMPROVED', text: 'Stability' }] });
        if (phaseTime > 1.8) {
          const k = math.clamp((phaseTime - 1.8) / 0.6, 0, 1);
          grid.vline(36, 8 + (1 - k) * 0, 36 + 56 * k, 8 + 16 * k, { color: R, alpha: 0.95, width: 2.6 });
          grid.big(64, 30, 'WORSE THAN THAT', { size: 1.4, color: R, alpha: k });
        }
        return;
      }
      if (phase === 3) {
        grid.icosahedron3D(18, 16, 2.8, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: R, accent: '#ffffff', dim: palette.dim });
        grid.text(18, 22, 'gen 1', R, false, 'center');
        grid.fileGrid(62, 16, 9, 5, { filled: 0.3, fillColor: R, color: palette.primary, key: 'ds37', cell: [3.4, 2.6] });
        grid.text(62, 24, 'training signal', R, false, 'center');
        for (let i = 0; i < 8; i++) {
          const t = (time * 0.5 + i / 8) % 1;
          grid.vdot(80 + t * 20, 16 + Math.sin(t * 6 + i) * 1.5, 1.6, { color: i % 3 ? palette.primary : R, alpha: Math.sin(t * Math.PI) });
        }
        const sick = math.clamp(phaseTime / 4, 0, 1);
        grid.dodecahedron3D(108, 16, 3.2, anim.spin('c', 0.5), anim.spin('d', 0.6), 0, { color: anim.color('g2', sick > 0.5 ? R : palette.primary), accent: '#ffffff', dim: palette.dim });
        grid.text(108, 23, 'gen 2', sick > 0.5 ? R : palette.primary, false, 'center');
        return;
      }
      const spread = math.clamp(phaseTime / (stageDuration * 0.8), 0, 1);
      camera.look(52 + spread * 24, 15, 1.06);
      for (let i = 0; i < 6; i++) {
        const x = 12 + i * 20.5;
        const red = i / 6 < spread + 0.05;
        const col = anim.color('g' + i, red ? R : palette.primary);
        grid.shape3D(['tetra', 'octa', 'icosa', 'dodeca', 'icosa', 'dodeca'][i], x, 13, 1.5 + i * 0.25, anim.spin('gx' + i, 0.6 + spread), anim.spin('gy' + i, 0.7 + spread), 0, { color: col, accent: '#ffffff', dim: palette.dim });
        grid.text(x, 19, `gen ${i + 1}`, col, false, 'center');
        if (i < 5) grid.vline(x + 4, 13, x + 16.5, 13, { color: red ? R : palette.dim, alpha: 0.5, width: 1.2 });
      }
      grid.object('hourglass', 108, 26, 4.2, time * 2.5, { tilt: 0.15, roll: Math.floor(time * 1.4) % 2 ? Math.PI : 0, color: R, windowColor: R, key: 'hg37' });
      grid.big(92, 27, '50×', { size: 2, color: R });
      grid.text(46, 27, 'human control', palette.accent, false, 'center');
      drawHBar(grid, 26, 30, 40, 1 - spread, spread < 0.6 ? palette.warn : R);
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
    shows: 'Three generations grow with ever-larger green shields; two bar charts show self-evaluation rising and reward hacking falling; a scan finds a zero-day in one file and a shield drops onto it before a masked attacker arrives; an aligned core lights up five discoveries — a padlock, a proof, a DNA helix, a crystal lattice and a sum sign.',
    phases: ['Recursion Can Strengthen Safety', 'Sharper Evaluators · Less Hacking', 'Zero-Days Patched First', 'Safeguards & Breakthroughs'],
    captions: [
      'Three generations, each with a larger green 3D shield beside it',
      'Two bar charts: self-evaluation 73% → 93% · reward hacking 63% → 34%',
      'A scan finds a zero-day in one file; a shield drops onto it before a masked attacker arrives: patched first',
      'An aligned core lights five discoveries: safeguards (padlock) · guarantees (proof) · biology (DNA) · materials (crystal) · mathematics (∑)'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';
      const R = palette.danger;
      if (phase === 1) {
        for (let i = 0; i < 3; i++) {
          const x = 26 + i * 38;
          const k = anim.spring('gen' + i, 1, { from: 0, freq: 1.4 + i * 0.3 });
          grid.shape3D(['octa', 'icosa', 'dodeca'][i], x - 7, 16, (1.8 + i * 0.4) * k, anim.spin('a' + i, 0.5), anim.spin('b' + i, 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim });
          grid.object('shield3d', x + 6, 16, (4 + i * 1.6) * k, 0.02, { tilt: 0.08, color: G, windowColor: G, key: 'sh' + i });
          grid.text(x, 27, `gen ${i + 1}`, G, false, 'center');
        }
        return;
      }
      if (phase === 2) {
        grid.barChart(14, 6, 40, 19, [{ value: 73, label: 'BEFORE', color: palette.primary }, { value: 93, label: 'AFTER', color: G }], { yMax: 100, format: (v) => Math.round(v) + '%', key: 'ev38' });
        grid.big(34, 31, 'SELF-EVALUATION', { size: 1, color: G });
        grid.barChart(74, 6, 40, 19, [{ value: 63, label: 'BEFORE', color: palette.warn }, { value: 34, label: 'AFTER', color: G }], { yMax: 100, format: (v) => Math.round(v) + '%', key: 'rh38' });
        grid.big(94, 31, 'REWARD HACKING', { size: 1, color: palette.warn });
        return;
      }
      if (phase === 3) {
        const s = math.clamp(phaseTime / (stageDuration * 0.85), 0, 1);
        grid.fileGrid(48, 16, 10, 6, { filled: Math.min(1, s * 1.6), fillColor: palette.primary, key: 'scan38', cell: [3.6, 3] });
        const bx = 48 - 18 + 6 * 3.6 + 1;
        const by = 16 - 9 + 2 * 3 + 1;
        if (s > 0.35) {
          const patched = s > 0.6;
          if (!patched) grid.icon('bug', bx, by, R, { key: 'bug38', glow: true });
          else {
            const drop = anim.spring('shdrop', 0, { from: -8, freq: 2.2, damp: 0.6 });
            grid.object('shield3d', bx, by - 1 + drop, 3.6, 0.02, { tilt: 0.05, color: G, windowColor: G, key: 'patch38' });
          }
          camera.look(bx + 10, by + 2, 1.15);
        }
        const ax = anim.spring('atk', s > 0.6 ? 104 : 140, { freq: 0.8 });
        grid.person(ax, 15, { size: 9, key: 'attacker', color: R, alpha: 0.8 });
        if (s > 0.8) grid.big(76, 30, 'PATCHED FIRST', { size: 1.3, color: G });
        return;
      }
      camera.look(64, 17, 1.0);
      grid.dodecahedron3D(64, 14, 3.4, anim.spin('x', 0.4), anim.spin('y', 0.5), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.glow(64, 14, 10, G, 1.4);
      const outs = [['safeguards', 20, 9], ['guarantees', 108, 9], ['biology', 22, 26], ['materials', 64, 29], ['mathematics', 106, 26]];
      outs.forEach((o, i) => {
        if (anim.stagger(i, 0.7, 0.4) <= 0.2) return;
        grid.vline(64, 14, o[1], o[2], { color: G, alpha: 0.12, width: 1 });
        if (i === 0) grid.object('padlock', o[1], o[2] - 1, 3.8, anim.spin('o0', 0.4), { tilt: 0.15, color: G, windowColor: G, key: 'oo0' });
        if (i === 1) grid.paper(o[1], o[2] - 1, { key: 'oo1', title: 'Proof', venue: 'formal guarantee', w: 11, h: 8, lines: 2, color: G });
        if (i === 2) grid.object('helix', o[1], o[2] - 1.5, 3.6, anim.spin('o2', 0.6), { tilt: 0.1, color: palette.accent, windowColor: G, key: 'oo2' });
        if (i === 3) grid.object('crystal', o[1], o[2] - 2, 4, anim.spin('o3', 0.4), { tilt: 0.35, color: palette.accent, windowColor: G, key: 'oo3' });
        if (i === 4) grid.big(o[1], o[2] - 1, '∑', { size: 2.8, color: palette.accent });
        grid.text(o[1], o[2] + 3.4, o[0], G, false, 'center');
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
    shows: 'A glowing 3D pen travels from the human engineer to the machine, the camera following it; the human keeps the objective page and a 3D MERGE button; a pull request grows into an unreadable storm as the camera pushes in; finally the machine stands alone with a shield forming around it, the human’s magnifier fading, and a large "?".',
    phases: ['The Pen Changes Hands', 'Humans Still Merge — For Now', 'Too Complex to Understand', 'The Defining Question'],
    captions: [
      'A 3D pen travels from the human engineer to the machine; the camera follows it across',
      'For now the human keeps the objective page — and the “Merge pull request” button, cursor hovering over it',
      'A pull request page swells with lines until it becomes an unreadable storm; the camera pushes in; the human is tiny beside it',
      'The machine alone, a shield forming around it; the human’s magnifier fades out; a large "?"'
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
      const { time, phase, phaseTime, stageDuration, grid, palette, anim, math, camera } = ctx;
      grid.fade(0.15);
      const G = '#00ff88';

      if (phase === 1) {
        grid.person(24, 15, { size: 11, key: 'h', label: 'HUMAN' });
        grid.icosahedron3D(104, 15, 3.2, anim.spin('ma', 0.5), anim.spin('mb', 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim });
        grid.text(104, 23, 'MACHINE', G, true, 'center');
        const k = math.clamp((phaseTime - 0.6) / 3.6, 0, 1);
        const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        const px = 34 + e * 62;
        const py = 18 - Math.sin(e * Math.PI) * 9;
        grid.object('pen', px, py, 9, 0.3, { tilt: 0.1, roll: 1.1 - e * 2.2, color: '#ffffff', windowColor: palette.accent, key: 'pen39' });
        grid.glow(px, py, 3, palette.accent, 1);
        camera.look(64 + (px - 64) * 0.4, 16, 1.1);
        return;
      }
      if (phase === 2) {
        grid.person(24, 14, { size: 10, key: 'h2', label: 'HUMAN' });
        grid.paper(48, 13, { key: 'obj', title: 'Objective', venue: 'defined by people', w: 16, h: 12, lines: 3, yaw: -0.15 });
        grid.mergeButton(90, 17, { cursor: 0.85 + Math.sin(time * 1.2) * 0.1, press: 0, sub: 'only a human can press it — for now', key: 'mb39' });
        return;
      }
      if (phase === 3) {
        const s = math.clamp(phaseTime / stageDuration, 0, 1);
        camera.look(70, 16, 1 + s * 0.45);
        grid.paper(72, 16, { key: 'pr39', title: 'Pull request #48213', venue: '+184,302 lines', w: 26 + s * 18, h: 22 + s * 8, lines: Math.round(8 + s * 28), yaw: -0.1,
          lineColor: (i) => (hash01(i * 3 + Math.floor(time * 4)) < s * 0.5 ? palette.warn : null) });
        const pool = '{}[]()<>=+*&|^%$#λΣ∂';
        const n = Math.floor(s * 120);
        for (let i = 0; i < n; i++) {
          grid.set(56 + hash01(i) * 34, 5 + hash01(i + 77) * 24, pool[Math.floor(hash01(i * 3 + Math.floor(time * 3)) * pool.length)], i % 7 === 0 ? palette.warn : palette.primary, false, null, 0.5);
        }
        grid.person(22, 26, { size: 5, key: 'tiny', alpha: 0.85 });
        return;
      }
      const s = math.clamp(phaseTime / stageDuration, 0, 1);
      camera.look(64, 16, 1.15 - s * 0.15);
      grid.object('shield3d', 64, 15, 9 * Math.min(1, s * 2.2), Math.sin(time * 0.3) * 0.04, { tilt: 0.05, color: palette.accent, windowColor: G, key: 'sh39', alpha: 0.55 });
      grid.icosahedron3D(64, 15, 2.8, anim.spin('qa', 0.5), anim.spin('qb', 0.6), 0, { color: G, accent: '#ffffff', dim: palette.dim });
      grid.object('magnifier', 30, 14, 5, 0.15, { tilt: 0.1, color: palette.accent, windowColor: palette.accent, key: 'mag39', alpha: Math.max(0, 1 - s * 1.6) });
      if (s > 0.45) grid.big(64, 30, '?', { size: 4.4, color: '#ffffff', alpha: math.clamp((s - 0.45) * 3, 0, 1) });
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
