// ============================================================================
// TermFX Studio - Visual Library gallery
// One scene per kind of subject, so every primitive in visuals.js can be
// previewed, recorded and copied into your own scenes.
// Not part of the RSI video (the shot list only reads presets.js).
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
            ['Dream-RSI', 'Google DeepMind', 'Oct 6'],
            ['MASS: Multi-Agent Self-Search', 'Research preprint', 'Oct 8'],
            ['When AI Builds Itself', 'Anthropic', 'Report']
          ];
          titles.forEach((t, i) => {
            const k = anim.spring('fan' + i, 1, { from: 0, freq: 1.6 + i * 0.3, damp: 0.75 });
            grid.paper(64 + (i - 1) * 34 * k, 18 + Math.abs(i - 1) * 1.5, { key: 'fan' + i, title: t[0], authors: t[1], venue: t[2], w: 26, h: 19, yaw: (i - 1) * 0.35, lines: 7 });
          });
        }
        if (phase === 3) {
          grid.paper(64, 18, { key: 'finding', title: 'When AI Builds Itself', authors: 'Anthropic', venue: 'Report', w: 34, h: 24, highlight: 4, yaw: -0.12 });
        }
        if (phase === 4) {
          grid.paper(64, 18, { key: 'stamped', title: 'When AI Builds Itself', authors: 'Anthropic', venue: 'Report', w: 34, h: 24, stamp: 'PUBLISHED', stampColor: '#00ff88', yaw: 0.18 });
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
    }
  ];

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
