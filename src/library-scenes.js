// ============================================================================
// TermFX Studio - Visual Library gallery
// One scene per kind of subject, so every primitive in visuals.js can be
// previewed, recorded and copied into your own scenes.
// Visual Library previews. These ship with TermFX.
// ============================================================================

(function () {
  if (!window.BUILTIN_PRESETS) return;

  const LIBRARY = [
    {
      id: 'lib-people',
      number: 'L1',
      title: 'People & Quotes',
      category: 'Visual Library',
      prompt: 'A named person appears as a portrait: halftone, scanline, ASCII, then with their quote.',
      shows: 'Put a photo you have rights to in termfx_data/assets (here ij-good.jpg). Without one, a lit silhouette stands in.',
      phases: ['Halftone Portrait', 'Scanline Portrait', 'ASCII Portrait', 'Portrait + Quote'],
      stageDurations: [5, 5, 5, 7],
      update(ctx) {
        const { phase, grid, palette } = ctx;
        grid.fade(0.2);
        if (phase === 1) grid.portrait('ij-good.jpg', 64, 16, { w: 30, h: 22, mode: 'halftone', label: 'I. J. GOOD' });
        if (phase === 2) grid.portrait('ij-good.jpg', 64, 16, { w: 30, h: 22, mode: 'scan', label: 'I. J. GOOD', color: palette.primary });
        if (phase === 3) grid.portrait('ij-good.jpg', 64, 16, { w: 44, h: 24, mode: 'ascii', label: 'I. J. GOOD' });
        if (phase === 4) {
          grid.portrait('ij-good.jpg', 30, 16, { w: 26, h: 20, mode: 'halftone', label: 'I. J. GOOD', sublabel: '1965' });
          grid.quote('The first ultraintelligent machine is the last invention that man need ever make.', 'I. J. Good', 84, 16, { width: 28, size: 1.35 });
        }
      }
    },
    {
      id: 'lib-papers',
      number: 'L2',
      title: 'Papers & Reports',
      category: 'Visual Library',
      prompt: 'A paper or report appears as a page with its real title, then a stack, a highlighted finding and a stamp.',
      shows: 'Pages tilt in 3D with the title, authors and venue typeset; abstract lines draw on.',
      phases: ['The Paper', 'The Literature', 'The Key Finding', 'Published'],
      stageDurations: [5, 5, 5, 5],
      update(ctx) {
        const { phase, grid, palette, anim } = ctx;
        grid.fade(0.2);
        if (phase === 1) {
          grid.paper(64, 18, { title: 'Speculations Concerning the First Ultraintelligent Machine', authors: 'I. J. Good', venue: 'Advances in Computers · 1965', w: 34, h: 24 });
        }
        if (phase === 2) {
          const titles = [
            ['Agent Replay Simulators', 'Example Lab', '2026'],
            ['Multi-Agent Self-Supervision', 'Example Lab', '2026'],
            ['Engineering Metrics Report', 'Example Lab', 'Report']
          ];
          titles.forEach((t, i) => {
            const k = anim.spring('fan' + i, 1, { from: 0, freq: 1.6 + i * 0.3, damp: 0.75 });
            grid.paper(64 + (i - 1) * 34 * k, 18 + Math.abs(i - 1) * 1.5, { key: 'fan' + i, title: t[0], authors: t[1], venue: t[2], w: 26, h: 19, yaw: (i - 1) * 0.35, lines: 7 });
          });
        }
        if (phase === 3) {
          grid.paper(64, 18, { key: 'finding', title: 'Engineering Metrics Report', authors: 'Example Lab', venue: 'Report', w: 34, h: 24, highlight: 4, yaw: -0.12 });
        }
        if (phase === 4) {
          grid.paper(64, 18, { key: 'stamped', title: 'Engineering Metrics Report', authors: 'Example Lab', venue: 'Report', w: 34, h: 24, stamp: 'PUBLISHED', stampColor: '#00ff88', yaw: 0.18 });
        }
      }
    },
    {
      id: 'lib-charts',
      number: 'L3',
      title: 'Charts & Data',
      category: 'Visual Library',
      prompt: 'Numbers shown as real charts: a line chart, bars, a donut and a network.',
      shows: 'Each chart draws itself on: lines trace left to right, bars grow, the donut sweeps, the network links up.',
      phases: ['Line Chart', 'Bar Chart', 'Donut', 'Network'],
      stageDurations: [5, 5, 5, 5],
      update(ctx) {
        const { phase, grid, palette } = ctx;
        grid.fade(0.2);
        if (phase === 1) {
          grid.lineChart(18, 6, 92, 22, [
            { values: [2, 3, 5, 9, 18, 34, 61, 80], label: 'AI-written code %', color: palette.accent },
            { values: [98, 97, 95, 91, 82, 66, 39, 20], label: 'human', color: palette.dim, width: 1.6, dash: [3, 4] }
          ], { yMax: 100, xLabels: ['2025', '', '', '', '', '', '', 'NOW'], key: 'lc' });
        }
        if (phase === 2) {
          grid.barChart(26, 6, 76, 22, [
            { value: 4, label: 'HUMAN', color: palette.dim },
            { value: 3, label: 'OPUS 4', color: palette.primary },
            { value: 52, label: 'MYTHOS', color: '#00ff88' }
          ], { format: (v) => Math.round(v) + '×', key: 'bc' });
        }
        if (phase === 3) {
          grid.donut(64, 17, 9, [
            { value: 80, color: palette.accent, label: 'AI' },
            { value: 20, color: palette.dim, label: 'HUMAN' }
          ], { center: '80%', key: 'dn' });
        }
        if (phase === 4) {
          const nodes = [
            { x: 64, y: 17, label: 'ORCHESTRATOR', color: '#ffffff', r: 3.4 },
            { x: 34, y: 8, label: 'RESEARCH' }, { x: 94, y: 8, label: 'CODE' },
            { x: 26, y: 25, label: 'EVAL' }, { x: 102, y: 25, label: 'REVIEW' },
            { x: 64, y: 30, label: 'DEPLOY', color: '#00ff88' }
          ];
          grid.network(nodes, [[0, 1], [0, 2], [0, 3], [0, 4], [3, 5], [4, 5], [1, 2]], { key: 'nw' });
        }
      }
    },
    {
      id: 'lib-buildings',
      number: 'L4',
      title: 'Buildings & 3D Models',
      category: 'Visual Library',
      prompt: 'Places and things as rotating 3D wireframes: a tower, a datacenter, a lab campus, any .obj model.',
      shows: 'Floors rise into place and windows flicker on. Stage 4 loads model.obj from termfx_data/assets (a placeholder spins until one is added).',
      phases: ['Tower', 'Datacenter', 'Lab Campus', 'Your 3D Model'],
      stageDurations: [5, 5, 5, 5],
      update(ctx) {
        const { phase, grid, palette, anim } = ctx;
        grid.fade(0.2);
        const yaw = anim.spin('yaw', 0.22) + 0.6;
        if (phase === 1) grid.building('tower', 64, 18, 10, yaw, { tilt: 0.25 });
        if (phase === 2) grid.building('datacenter', 64, 18, 15, yaw, { tilt: 0.45, color: palette.primary });
        if (phase === 3) {
          grid.building('lab', 54, 18, 13, yaw, { tilt: 0.4 });
          grid.building('house', 100, 22, 8, yaw + 0.4, { tilt: 0.4, color: palette.dim });
        }
        if (phase === 4) grid.model('model.obj', 64, 18, 9, 0.25, anim.spin('m', 0.35), 0, { color: palette.accent });
      }
    },
    {
      id: 'lib-places',
      number: 'L5',
      title: 'Globe & Places',
      category: 'Visual Library',
      prompt: 'Places on a dotted, rotating Earth: markers that pulse, labelled cities and arcs between them.',
      shows: 'A dotted globe builds itself, then cities light up and data arcs travel between them.',
      phases: ['The World', 'Cities', 'Connections', 'Close In'],
      stageDurations: [5, 5, 5, 5],
      update(ctx) {
        const { phase, grid, palette, anim } = ctx;
        grid.fade(0.25);
        const cities = [
          { lat: 37.77, lon: -122.42, label: 'SAN FRANCISCO' },
          { lat: 51.51, lon: -0.13, label: 'LONDON' },
          { lat: 35.68, lon: 139.69, label: 'TOKYO' },
          { lat: 1.35, lon: 103.82, label: 'SINGAPORE' }
        ];
        const r = phase === 4 ? anim.spring('zoom', 17, { from: 14, freq: 1.2, damp: 0.9 }) : 14;
        const spin = phase === 4 ? anim.spring('face', 2.15, { from: 1, freq: 0.8 }) : anim.spin('globe', 0.12) + 0.6;
        grid.globe(64, 18, r, {
          spin,
          markers: phase >= 2 ? cities : [],
          arcs: phase >= 3 ? [[0, 1], [0, 2], [2, 3], [1, 3]] : [],
          tilt: -0.45
        });
      }
    },
    {
      id: 'lib-objects',
      number: 'L6',
      title: 'Hardware & Buildings',
      category: 'Visual Library',
      prompt: 'Hardware and places as 3D holograms: racks, GPUs, laptops, chips, monitors, datacenters, offices, power.',
      shows: 'Each object builds up from the floor with its lights blinking; use grid.object(kind, …).',
      phases: ['Server Rack', 'GPU', 'Laptop', 'Chip', 'Monitor', 'Phone', '1U Server', 'Network Switch', 'Workstation', 'Database', 'Datacenter Hall', 'Office Tower', 'Bank', 'Cooling Tower', 'Power Pylon'],
      stageDurations: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5, 4, 4, 4, 4],
      update(ctx) {
        const { phase, grid, palette, anim } = ctx;
        grid.fade(0.2);
        const G = '#00ff88';
        const yaw = anim.spin('yaw', 0.25) + 0.5;
        const sway = 0.42 + Math.sin(ctx.time * 0.3) * 0.25;
        const list = [
          ['rack', 8, yaw, 0.3, G], ['gpu', 13, yaw, 0.45, G], ['laptop', 11, yaw, 0.4, palette.accent], ['chip', 11, yaw, 0.55, G],
          ['monitor', 12, Math.sin(ctx.time * 0.3) * 0.25, 0.15, G], ['phone', 9, Math.sin(ctx.time * 0.4) * 0.3, 0.1, G], ['serverBlade', 12, sway, 0.4, G], ['switch', 12, sway, 0.4, G], ['workstation', 11, sway, 0.3, palette.accent], ['database', 10, yaw, 0.35, G],
          ['hall', 10, sway, 0.42, G], ['office', 9, sway, 0.3, palette.warn], ['bank', 12, sway, 0.3, palette.warn],
          ['coolingTower', 10, yaw, 0.3, G], ['pylon', 8, sway, 0.25, palette.warn]
        ];
        const o = list[phase - 1];
        if (o) grid.object(o[0], 64, 17, o[1], o[2], { tilt: o[3], windowColor: o[4], key: 'o' + phase });
      }
    },
    {
      id: 'lib-symbols',
      number: 'L9',
      title: 'Tools & Symbols',
      category: 'Visual Library',
      prompt: 'Concrete stand-ins for ideas: checkpoint, padlock, shield, magnifier, stopwatch, CCTV, MERGE button, pen, wrench, ladder, rocket, funnel, DNA, crystal.',
      shows: 'Use these instead of abstract shapes: a checkpoint for verification, a CCTV camera for oversight, a ladder for levels, a rocket for ignition, a funnel for a bottleneck.',
      phases: ['Verification Scanner', 'Padlock', 'Shield', 'Magnifier', 'Stopwatch', 'CCTV', 'Merge Button', 'Pen', 'Wrench', 'Level Meter', 'Rocket', 'Funnel', 'DNA Helix', 'Crystal', 'ID Badge', 'Key', 'Hourglass', 'Gear', 'Microscope', 'Flask', 'Briefcase', 'Phone + Message'],
      stageDurations: [5, 4, 4, 4, 4, 4, 5, 4, 4, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 5],
      update(ctx) {
        const { phase, grid, palette, anim } = ctx;
        grid.fade(0.2);
        const G = '#00ff88';
        const t = ctx.time;
        const face = Math.sin(t * 0.4) * 0.04;
        const list = [
          null, ['padlock', 12, anim.spin('y', 0.3), 0.15, palette.warn], ['shield3d', 11, face, 0.06, G],
          ['magnifier', 11, Math.sin(t * 0.4) * 0.3, 0.1, palette.warn], ['stopwatch', 11, Math.sin(t * 0.4) * 0.3, 0.1, palette.accent], ['cctv', 11, -0.8 + Math.sin(t * 0.6) * 0.3, 0.2, palette.danger],
          null, ['pen', 10, 0.3, 0.1, palette.accent], ['wrench', 11, face, 0.08, G], null,
          ['rocket', 9, anim.spin('r', 0.3), 0.12, palette.accent], ['funnel', 11, 0.2, 0.35, G], ['helix', 8, anim.spin('h', 0.5), 0.1, G], ['crystal', 11, anim.spin('c', 0.3), 0.35, G],
          ['idBadge', 12, face, 0.06, G], ['key', 10, face, 0.06, palette.warn], ['hourglass', 10, anim.spin('hg', 0.3), 0.15, palette.warn], ['gear', 11, face, 0.06, G],
          ['microscope', 11, Math.sin(t * 0.4) * 0.5, 0.2, G], ['flask', 11, anim.spin('f', 0.3), 0.2, G], ['briefcase', 11, Math.sin(t * 0.4) * 0.4, 0.2, palette.warn], null
        ];
        if (phase === 1) {
          const st = Math.floor(ctx.phaseTime / 1.6) % 3;
          grid.scanner(64, 16, { w: 20, h: 20, state: ['scan', 'pass', 'fail'][st], readout: 'held-out checks', key: 'l9scan' });
          return;
        }
        if (phase === 10) {
          grid.levelMeter(58, 17, { levels: ['LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'LEVEL 4'], value: Math.min(4, ctx.phaseTime * 0.9), colors: [palette.primary, palette.primary, G, '#ffaa00'], marker: 'NOW', h: 26, w: 8 });
          return;
        }
        if (phase === 22) {
          grid.object('phone', 50, 17, 9, Math.sin(t * 0.4) * 0.15, { tilt: 0.1, color: G, windowColor: G, key: 'l9ph' });
          grid.chatBubble(60, 10, 'deploy when tests pass', { color: G });
          grid.chatBubble(98, 16, 'on it', { color: palette.accent, align: 'right' });
          return;
        }
        if (phase === 7) {
          const pt = ctx.phaseTime;
          grid.mergeButton(64, 16, { cursor: Math.min(1, pt / 2), press: pt > 2.1 && pt < 2.6 ? 1 : 0, merged: pt > 2.6, sub: 'pull request #48213', key: 'l9mb', scale: 1.2 });
          return;
        }
        const o = list[phase - 1];
        if (o) grid.object(o[0], 64, 17, o[1], o[2], { tilt: o[3], windowColor: o[4], color: o[4], key: 's' + phase, roll: o[0] === 'pen' ? 0.6 : 0, handPeriod: 2 });
      }
    },
    {
      id: 'lib-documents',
      number: 'L7',
      title: 'Codebases, Dates & Timelines',
      category: 'Visual Library',
      prompt: 'A codebase as a wall of files, a file being rewritten, a calendar, a timeline, release notes.',
      shows: 'grid.fileGrid fills a codebase; grid.paper lineColor rewrites lines; grid.calendar marks dates; grid.timeline places events.',
      phases: ['Codebase', 'Rewriting a File', 'Calendar', 'Timeline', 'Release Notes'],
      stageDurations: [5, 5, 5, 5, 6],
      update(ctx) {
        const { phase, phaseTime, grid, palette } = ctx;
        grid.fade(0.2);
        const G = '#00ff88';
        if (phase === 1) grid.fileGrid(64, 16, 20, 6, { filled: Math.min(0.8, phaseTime / 4), key: 'l7a', cell: [4.4, 3.4] });
        if (phase === 2) {
          const pass = Math.floor(phaseTime * 2);
          grid.paper(64, 17, { key: 'l7b', title: 'train.py', venue: 'rewritten by the agent', w: 32, h: 24, lines: 10, lineColor: (i) => (i < pass ? G : (i === pass ? palette.danger : null)) });
        }
        if (phase === 3) grid.calendar(64, 18, { month: 'OCTOBER 2026', startDay: 4, marks: { 7: { color: G }, 12: { color: palette.warn }, 15: { color: palette.accent }, 16: { color: palette.primary } }, focus: 15, key: 'l7c' });
        if (phase === 4) grid.timeline(14, 114, 18, { from: 1960, to: 2030, ticks: 10, key: 'l7d', events: [
          { at: 1965, label: 'I. J. Good', color: palette.accent }, { at: 2017, label: 'Transformer', color: palette.primary, above: false },
          { at: 2025.1, label: 'Claude Code', color: palette.warn }, { at: 2026.8, label: 'now', color: G, above: false }
        ] });
        if (phase === 5) grid.releaseNotes(64, 17, { product: 'Claude Developer Platform', version: 'Platform update', date: 'Oct 7', key: 'l7e', highlight: phaseTime > 3.5 ? 2 : undefined,
          items: [{ tag: 'NEW', text: 'Claude Haiku 5.5' }, { tag: 'BETA', text: 'Agent SDK computer-use classes' }, { tag: 'SECURITY', text: 'allowed_hosts enforced' }, { tag: 'FIXED', text: 'Streaming retries' }] });
      }
    },
    {
      id: 'lib-systems',
      number: 'L8',
      title: 'Systems & Containment',
      category: 'Visual Library',
      prompt: 'Processes and boundaries without orbit rings: a pipeline loop, a glass sandbox, nested sandboxes, people in a system.',
      shows: 'grid.pipeline for loops and processes, grid.glassBox for sandboxes and boundaries, grid.person for people.',
      phases: ['Pipeline Loop', 'Glass Sandbox', 'Nested Boxes', 'People', 'Balance Scale', 'Brick Wall'],
      stageDurations: [5, 5, 5, 5, 5, 6],
      update(ctx) {
        const { phase, grid, palette, anim } = ctx;
        grid.fade(0.2);
        const G = '#00ff88';
        if (phase === 1) grid.pipeline(24, 104, 18, ['propose', 'run', 'evaluate', 'commit'], { loop: true, loopDepth: 5, color: G, key: 'l8a' });
        if (phase >= 2 && phase <= 3) {
          grid.icosahedron3D(64, 17, 2.6, anim.spin('a', 0.5), anim.spin('b', 0.6), 0, { color: palette.accent, accent: '#ffffff', dim: palette.dim });
          grid.glassBox(64, 17, 30, 16, 24, { color: G, key: 'l8b', label: phase === 2 ? 'sandbox' : '' });
          if (phase === 3) {
            grid.glassBox(64, 17, 42, 21, 28, { color: palette.warn, key: 'l8c' });
            grid.glassBox(64, 17, 54, 26, 32, { color: palette.accent, key: 'l8d' });
          }
        }
        if (phase === 4) {
          grid.person(34, 15, { size: 12, key: 'p1', label: 'ENGINEER' });
          grid.person(64, 15, { size: 12, key: 'p2', label: 'REVIEWER', color: palette.warn });
          grid.person(94, 15, { size: 12, key: 'p3', label: 'RESEARCHER', color: G });
        }
        if (phase === 5) grid.balance(64, 16, 10, Math.sin(ctx.time * 0.9) * 0.18, { color: palette.accent, key: 'l8bal' });
        if (phase === 6) grid.brickWall(64, 28, 9, 10, { fall: Math.max(0, Math.min(1, (ctx.phaseTime - 1.5) / 3)), label: 'BARRIER', key: 'l8wall' });
      }
    },
    {
      id: 'lib-world',
      number: 'L10',
      title: 'Characters & 3D Sets',
      category: 'Visual Library',
      prompt: 'Third-person 3D shots: a faceless character at a desk (typing, phone, thinking, leaning back, watching), standing and walking, and a suburban house at night.',
      shows: 'grid.world() — a perspective camera you can orbit and dolly, solid holographic sets, and a posed mannequin character.',
      phases: ['Typing', 'Phone (Gaming Room)', 'Thinking', 'Leaning Back', 'Watching', 'Walk Cycle', 'House at Night'],
      stageDurations: [6, 6, 6, 6, 6, 6, 8],
      update(ctx) {
        const { time, phase, phaseTime, grid, palette } = ctx;
        grid.fade(0.2);
        if (phase <= 5) {
          const poses = ['typing', 'phone', 'think', 'leanback', 'watch'];
          const w = grid.world({ fov: 42 });
          w.orbit([0, 0.95, 0.3], 2.8, 0.35 + phaseTime * 0.12, 0.18, 42);
          w.room({ w: 6, d: 5, h: 2.8, panels: phase === 2, led: phase === 2 ? '#ff3366' : null, posters: phase === 3 });
          const j = w.deskSetup({ monitors: phase === 2 ? 'ultrawide' : (phase === 5 ? 2 : 1), person: { pose: poses[phase - 1], t: time, glasses: phase === 3 }, screenCol: phase === 5 ? palette.danger : '#2f6bff', scroll: 1 });
          if (phase === 2) w.phone(j.handsMid, Math.PI, 0.9);
          w.render();
          return;
        }
        if (phase === 6) {
          const w = grid.world({ fov: 45 });
          w.orbit([0, 0.9, 0], 3.4, 0.3 + phaseTime * 0.25, 0.15, 45);
          w.floor(10, 0.5, { col: palette.dim });
          w.person({ at: [0, 0, 0], yaw: Math.PI / 2, pose: 'walk', t: time });
          w.render();
          return;
        }
        const k = Math.min(1, phaseTime / 7);
        const w = grid.world({ fov: 38, fog: 70 });
        w.camera([8 - k * 5, 2.4 + k, 17 - k * 7], [-0.5 + k, 3, 0], 38);
        w.floor(44, 2, { col: '#335566' });
        w.house({ lit: [0, 3] });
        w.tree([7.5, 0, 1.5], 5);
        w.tree([-11, 0, 0.5], 6);
        w.render();
      }
    }
  ];

  // Keep previews in numeric order (L1 … L10) regardless of where they are defined
  LIBRARY.sort((x, y) => parseInt(x.number.slice(1), 10) - parseInt(y.number.slice(1), 10));

  for (const p of LIBRARY) {
    p.shortLabel = `${p.number}. ${p.title}`;
    p.init = p.init || function () {};
    p.onPhaseChange = p.onPhaseChange || function () {};
    p.code = [
      'function init(ctx) {}',
      'function onPhaseChange(phase, ctx) {}',
      p.update.toString().replace(/^update\s*\(/, 'function update(')
    ].join('\n\n');
    window.BUILTIN_PRESETS.push(p);
  }
})();
