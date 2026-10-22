// ============================================================================
// TermFX Studio - Cinematic ASCII & Holographic Vector Engine (v2)
// Fixed 16:9 output stage (720p-4K), sub-pixel glyph motion, multi-pass bloom,
// spring physics & camera rig, automatic text reveal, polyhedron morphing,
// in-canvas CRT post FX (captured by exports), frame-exact render hooks
// ============================================================================

const THEMES = {
  cyberblue: {
    name: 'J.A.R.V.I.S. Cyber Blue',
    bg: '#020710',
    primary: '#00b4ff',
    secondary: '#0284c7',
    accent: '#bae6fd',
    warn: '#38bdf8',
    danger: '#ff2a6d',
    dim: '#0c3b5e',
    muted: '#061d30',
    glowColor: 'rgba(0, 180, 255, 0.55)'
  },
  jarvisgold: {
    name: 'Stark Mark-85 (Blue/Gold)',
    bg: '#030812',
    primary: '#00d2ff',
    secondary: '#0284c7',
    accent: '#fde047',
    warn: '#f59e0b',
    danger: '#ff2a6d',
    dim: '#0e4166',
    muted: '#071f33',
    glowColor: 'rgba(0, 210, 255, 0.58)'
  },
  cyberpunk: {
    name: 'Cyberpunk Neon',
    bg: '#05030f',
    primary: '#00f0ff',
    secondary: '#ff007f',
    accent: '#fcee09',
    warn: '#fcee09',
    danger: '#ff0055',
    dim: '#1b3b52',
    muted: '#10152e',
    glowColor: 'rgba(0, 240, 255, 0.55)'
  },
  amber: {
    name: 'Amber CRT',
    bg: '#0b0600',
    primary: '#ffb000',
    secondary: '#cc7a00',
    accent: '#ffe699',
    warn: '#ffea00',
    danger: '#ff3b00',
    dim: '#5c3b00',
    muted: '#2e1d00',
    glowColor: 'rgba(255, 176, 0, 0.55)'
  },
  redalert: {
    name: 'Combat Override (Red)',
    bg: '#0b0202',
    primary: '#ff2a2a',
    secondary: '#ff7700',
    accent: '#ffdd88',
    warn: '#ffaa00',
    danger: '#ffffff',
    dim: '#591111',
    muted: '#2b0606',
    glowColor: 'rgba(255, 42, 42, 0.55)'
  },
  clean: {
    name: 'Clean Modern Blue',
    bg: '#090d16',
    primary: '#38bdf8',
    secondary: '#818cf8',
    accent: '#e0f2fe',
    warn: '#facc15',
    danger: '#f87171',
    dim: '#334155',
    muted: '#1e293b',
    glowColor: 'rgba(56, 189, 248, 0.35)'
  },
  matrix: {
    name: 'Matrix Green',
    bg: '#030905',
    primary: '#00ff66',
    secondary: '#00cc52',
    accent: '#b3ffd1',
    warn: '#d4ff00',
    danger: '#ff2a55',
    dim: '#0f4d26',
    muted: '#082914',
    glowColor: 'rgba(0, 255, 102, 0.55)'
  }
};

const BOX_STYLES = {
  single: { tl: '┌', tr: '┐', bl: '└', br: '┘', h: '─', v: '│' },
  double: { tl: '╔', tr: '╗', bl: '╚', br: '╝', h: '═', v: '║' },
  round:  { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
  heavy:  { tl: '┏', tr: '┓', bl: '┗', br: '┛', h: '━', v: '┃' },
  ascii:  { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' }
};

// Output stage presets. Fixed modes always lay out a 1280x720 design grid and
// upscale it, so a scene composes identically in preview, 1080p and 4K renders.
const OUTPUT_PRESETS = {
  fit: null,
  '720p': [1280, 720],
  '1080p': [1920, 1080],
  '1440p': [2560, 1440],
  '4k': [3840, 2160]
};
const DESIGN_W = 1280;
const DESIGN_H = 720;
const INTRO_DUR = 0.7;
const SWEEP_DUR = 0.65;

// --- Easing Library (Penner curves, clamped to 0..1) ---
const clamp01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
const EASE = {
  linear: (t) => clamp01(t),
  inQuad: (t) => { t = clamp01(t); return t * t; },
  outQuad: (t) => { t = clamp01(t); return 1 - (1 - t) * (1 - t); },
  inOutQuad: (t) => { t = clamp01(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; },
  inCubic: (t) => { t = clamp01(t); return t * t * t; },
  outCubic: (t) => { t = clamp01(t); return 1 - Math.pow(1 - t, 3); },
  inOutCubic: (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  outQuart: (t) => { t = clamp01(t); return 1 - Math.pow(1 - t, 4); },
  outExpo: (t) => { t = clamp01(t); return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t); },
  inOutExpo: (t) => {
    t = clamp01(t);
    if (t === 0 || t === 1) return t;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  inOutSine: (t) => { t = clamp01(t); return -(Math.cos(Math.PI * t) - 1) / 2; },
  outBack: (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: (t) => { t = clamp01(t); const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  outElastic: (t) => {
    t = clamp01(t);
    if (t === 0 || t === 1) return t;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1;
  }
};
const easeFn = (e) => (typeof e === 'function' ? e : (EASE[e] || EASE.inOutCubic));

// --- Polyhedron Registry (shared by shape3D / morph3D) ---
function edgesByMinDist(verts) {
  let min = Infinity;
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
      if (d < min) min = d;
    }
  }
  const edges = [];
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
      if (Math.abs(d - min) < 1e-3) edges.push([i, j]);
    }
  }
  return edges;
}

const SHAPES = (() => {
  const phi = (1 + Math.sqrt(5)) / 2;
  const normTo = (list, r) => list.map(v => {
    const len = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / len * r, v[1] / len * r, v[2] / len * r];
  });
  const icosaV = normTo([
    [-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0],
    [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi],
    [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]
  ], 1);
  const dodecaRaw = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) dodecaRaw.push([x, y, z]);
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    dodecaRaw.push([0, a / phi, b * phi]);
    dodecaRaw.push([a / phi, b * phi, 0]);
    dodecaRaw.push([a * phi, 0, b / phi]);
  }
  const dodecaV = normTo(dodecaRaw, 1.15);
  const tetraV = normTo([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], 1.3);
  return {
    tetra: { v: tetraV, e: edgesByMinDist(tetraV) },
    pyramid: {
      v: [[0, -1.3, 0], [-1, 0.9, -1], [1, 0.9, -1], [1, 0.9, 1], [-1, 0.9, 1]],
      e: [[0, 1], [0, 2], [0, 3], [0, 4], [1, 2], [2, 3], [3, 4], [4, 1]]
    },
    cube: {
      v: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]],
      e: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
    },
    octa: {
      v: [[0, -1.25, 0], [0, 1.25, 0], [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]],
      e: [[0, 2], [0, 3], [0, 4], [0, 5], [1, 2], [1, 3], [1, 4], [1, 5], [2, 3], [3, 4], [4, 5], [5, 2]]
    },
    icosa: { v: icosaV, e: edgesByMinDist(icosaV) },
    dodeca: { v: dodecaV, e: edgesByMinDist(dodecaV) }
  };
})();
// --- Concept Icons: small ASCII sprites so a scene can show *what* a node is
// (an agent, a bug, a file, a lock...) instead of only an abstract shape.
// Characters in ICON_ACCENT_CHARS are drawn in the icon's accent colour.
// An icon is either static rows or a function of time returning rows, so
// each one has its own idle motion (blinking, scanning, wiggling...).
const ICONS = {
  agent: (t) => {
    const blink = (t % 3.4) < 0.13;
    return [
      (t * 1.6) % 1 < 0.5 ? '  •  ' : '  ╷  ',
      '╭─┴─╮',
      blink ? '│─ ─│' : '│◉ ◉│',
      Math.floor(t * 2) % 2 ? '╰┬─┬╯' : '╰┴─┴╯'
    ];
  },
  human: (t) => [
    ' ◯ ',
    Math.floor(t * 1.5) % 2 ? '╶┼╴' : '╲┼╱',
    '╱ ╲'
  ],
  terminal: (t) => [
    '┌──────┐',
    `│>${(t * 2) % 1 < 0.5 ? '_' : ' '}    │`,
    `│ ${['▪··', '·▪·', '··▪'][Math.floor(t * 4) % 3]}  │`,
    '└──────┘',
    '▔▔▔▔▔▔▔▔'
  ],
  agentMask: (t) => [
    '  ╷  ',
    '╭─┴─╮',
    (t % 2.8) < 0.12 ? '│─ ─│' : '│◠ ◠│',
    '╰─◡─╯'
  ],
  bug: (t) => (Math.floor(t * 7) % 2
    ? [' ╲╭─╮╱ ', '─┤▓●▓├─', ' ╱╰─╯╲ ']
    : [' ╱╭─╮╲ ', '╶┤▓●▓├╴', ' ╲╰─╯╱ ']),
  file: (t) => {
    const k = Math.floor(t * 3) % 3;
    const rows = ['≡≡', '==', '≡='];
    return ['┌──╮', `│${rows[k]}│`, `│${rows[(k + 1) % 3]}│`, '└──┘'];
  },
  binary: (t) => {
    const bits = (n) => (n >>> 0).toString(2).padStart(3, '0').slice(-3);
    const s = Math.floor(t * 8);
    return ['┌───╮', `│${bits(s * 5 + 2)}│`, `│${bits(s * 3 + 5)}│`, '└───┘'];
  },
  lock: [
    ' ╭─╮ ',
    ' │ │ ',
    '█████',
    '██●██'
  ],
  unlock: [
    ' ╭─╮ ',
    ' │   ',
    '█████',
    '██●██'
  ],
  eye: (t) => {
    // Pupil sweeps side to side like a scanner
    const pos = Math.round(Math.sin(t * 1.4) * 2);
    const mid = '  ' + ' '.repeat(2 + pos) + '◉' + ' '.repeat(2 - pos) + '  ';
    return [' ▁▁▁▁▁ ', '╱' + mid.slice(2, 7) + '╲', '╲▁▁▁▁▁╱'];
  },
  eyeClosed: [
    '       ',
    '╲▁▁▁▁▁╱',
    ' ╵ ╵ ╵ '
  ],
  server: (t) => {
    const a = Math.floor(t * 3) % 2;
    const act = ['═══', '══─', '═─═', '─══'][Math.floor(t * 9) % 4];
    return ['┌─────┐', `│${a ? '▪' : '·'} ${act}│`, '├─────┤', `│${a ? '·' : '▪'} ═══│`, '└─────┘'];
  },
  cloud: [
    '  ╭──╮  ',
    '╭─╯  ╰─╮',
    '╰──────╯'
  ],
  trophy: (t) => ['╭───╮', (t % 1.2) < 0.6 ? '╰╮★╭╯' : '╰╮✦╭╯', ' ╰┬╯ ', ' ═╧═ '],
  plug: (t) => [(t * 2) % 1 < 0.5 ? '╺━┫◯┣━╸' : '╺━┫◉┣━╸'],
  gear: (t) => ['╭┴╮', `┤${'◐◓◑◒'[Math.floor(t * 8) % 4]}├`, '╰┬╯'],
  warn: (t) => [' ╱╲ ', (t * 2.5) % 1 < 0.6 ? '╱ !╲' : '╱  ╲', '▔▔▔▔'],
  shield: [
    '╭───╮',
    '│ ✓ │',
    '╰╮ ╭╯',
    ' ╰─╯ '
  ],
  chip: (t) => {
    const k = Math.floor(t * 6) % 3;
    const row = [0, 1, 2].map(i => (i === k ? '■' : '▣')).join('');
    return [' ╷╷╷ ', '┌───┐', `┤${row}├`, '└───┘', ' ╵╵╵ '];
  },
  dna: (t) => {
    const frames = ['╲ ╱', ' ✕ ', '╱ ╲', ' ✕ '];
    const k = Math.floor(t * 5);
    return [0, 1, 2, 3].map(i => frames[(i + k) % 4]);
  }
};
const ICON_ACCENT_CHARS = new Set(['◉', '◠', '◡', '●', '•', '▪', '★', '✦', '!', '✓', '▣', '■', '◯', '◎', '◐', '◓', '◑', '◒', '✕']);

SHAPES.octahedron = SHAPES.octa;
SHAPES.icosahedron = SHAPES.icosa;
SHAPES.dodecahedron = SHAPES.dodeca;
SHAPES.tetrahedron = SHAPES.tetra;

// --- Color Utilities (cached; accepts hex, rgb(), rgba() and CSS names) ---
const _colorProbe = document.createElement('canvas').getContext('2d');
const _colorCache = new Map();
function parseColor(c) {
  let hit = _colorCache.get(c);
  if (hit) return hit;
  let r = 0, g = 180, b = 255;
  if (typeof c === 'string') {
    let s = c.trim();
    if (s[0] !== '#' && !s.startsWith('rgb')) {
      _colorProbe.fillStyle = '#00b4ff';
      _colorProbe.fillStyle = s;
      s = _colorProbe.fillStyle;
    }
    if (s[0] === '#') {
      if (s.length === 4) s = '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
      r = parseInt(s.slice(1, 3), 16);
      g = parseInt(s.slice(3, 5), 16);
      b = parseInt(s.slice(5, 7), 16);
    } else {
      const m = s.match(/[\d.]+/g);
      if (m && m.length >= 3) { r = +m[0]; g = +m[1]; b = +m[2]; }
    }
  }
  hit = [r || 0, g || 0, b || 0];
  if (_colorCache.size > 4096) _colorCache.clear();
  _colorCache.set(c, hit);
  return hit;
}

const _rgbCache = new Map();
function rgbString(r, g, b) {
  const key = ((r & 255) << 16) | ((g & 255) << 8) | (b & 255);
  let s = _rgbCache.get(key);
  if (!s) {
    s = `rgb(${r | 0},${g | 0},${b | 0})`;
    if (_rgbCache.size > 8192) _rgbCache.clear();
    _rgbCache.set(key, s);
  }
  return s;
}

function rgbaString(c, a) {
  const [r, g, b] = parseColor(c);
  return `rgba(${r | 0},${g | 0},${b | 0},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

function mixColor(a, b, t) {
  const ca = parseColor(a);
  const cb = parseColor(b);
  const k = clamp01(t);
  return rgbString(ca[0] + (cb[0] - ca[0]) * k, ca[1] + (cb[1] - ca[1]) * k, ca[2] + (cb[2] - ca[2]) * k);
}

// Critically-damped (or bouncy, damp < 1) spring, sub-stepped for stability
class Spring {
  constructor(x = 0) {
    this.x = x;
    this.v = 0;
    this.target = x;
    this.tick = -1;
  }

  step(dt, freq = 9, damp = 1) {
    const n = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / n;
    for (let i = 0; i < n; i++) {
      const a = freq * freq * (this.target - this.x) - 2 * damp * freq * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    return this.x;
  }
}

class AsciiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: true });
    this.themeKey = 'cyberblue';
    this.crtGlow = true;
    this.holoHud = true;
    this.fontSize = 16;
    this.cellW = 10;
    this.cellH = 18;
    this.cols = 120;
    this.rows = 40;
    this.viewportScale = 1.0;
    this.cells = [];

    // Output stage
    this.outputMode = '1080p';
    this.logicalW = DESIGN_W;
    this.logicalH = DESIGN_H;
    this.pxScale = 1;
    this.bgMode = 'theme'; // 'theme' | 'black' | 'alpha'

    // Cinematic feature flags (all toggleable from the UI)
    this.subpixel = true;
    this.smoothColor = true;
    this.textReveal = true;
    this.revealCPS = 95;
    this.cameraMotion = true;
    this.scanlines = true;
    this.grain = true;
    this.vignette = true;
    this.bgGrid = true;
    this.transitionFx = true;
    this.introFx = true;
    this.showTimeline = false;
    this.mouseParallax = true;
    this.bloomStrength = 1.0;

    this.running = true;
    this.time = 0;
    this.tick = 0;
    this.phase = 1;
    this.smoothPhase = 1.0;
    this.phaseTime = 0;
    this.autoPlayStages = true;
    this.stageDuration = 4.6;
    this.onPhaseAutoChange = null;
    this.onLoopComplete = null;
    this.loopsCompleted = 0;
    this.simState = {};
    this.currentSimulation = null;
    this.lastError = null;

    this.particles = [];
    this.shockwaves = [];

    // Vector overlay queue (rebuilt every frame) & glow underlay nodes
    this.vItems = [];
    this.glowNodes = [];
    this._hudMode = false;

    // Animation state stores
    this.springs = new Map();
    this.tweens = new Map();
    this.colorAnims = new Map();
    this.spins = new Map();
    this.morphs = new Map();
    this.iconMemo = new Map();
    this.textMemo = new Map();
    this.textPos = new Map();
    this._dt = 1 / 60;
    this._colorK = 0.2;

    // Camera rig
    this.camZoom = new Spring(1);
    this.camPunch = new Spring(0);
    this.camPanX = new Spring(0);
    this.camPanY = new Spring(0);
    this.camFocus = null;
    this.camZoomReq = null;
    this.shakeAmt = 0;
    this.flashAmt = 0;
    this.flashColor = '#ffffff';
    this.cam = { zoom: 1, x: 0, y: 0, rot: 0 };
    this.introT = INTRO_DUR;
    this.sweepT = SWEEP_DUR;

    // Smooth 3D Camera Parallax & Mouse-Drag 3D Orbit
    this.targetParallaxX = 0;
    this.targetParallaxY = 0;
    this.parallaxX = 0;
    this.parallaxY = 0;
    this.isDraggingOrbit = false;
    this.dragLastX = 0;
    this.dragLastY = 0;
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.targetOrbitYaw = 0;
    this.targetOrbitPitch = 0;

    this.typer = {
      active: false,
      prompt: '',
      typedLen: 0,
      charTimer: 0,
      speedMs: 34,
      stage: 'typing',
      bootTime: 0,
      onFinish: null
    };

    this.audioCtx = null;
    this.soundEnabled = true;

    // Offscreen render layers
    this.glyphLayer = document.createElement('canvas');
    this.gctx = this.glyphLayer.getContext('2d');
    this.emitLayer = document.createElement('canvas');
    this.ectx = this.emitLayer.getContext('2d');
    this.blurA = document.createElement('canvas');
    this.bactx = this.blurA.getContext('2d');
    this.blurB = document.createElement('canvas');
    this.bbctx = this.blurB.getContext('2d');
    this._buildNoise();

    this._sandbox = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.isDraggingOrbit = true;
        this.dragLastX = e.clientX;
        this.dragLastY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingOrbit = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        this.targetParallaxX = Math.max(-1, Math.min(1, nx)) * 0.16;
        this.targetParallaxY = Math.max(-1, Math.min(1, ny)) * 0.12;
      }
      if (this.isDraggingOrbit) {
        const dx = e.clientX - this.dragLastX;
        const dy = e.clientY - this.dragLastY;
        this.dragLastX = e.clientX;
        this.dragLastY = e.clientY;
        this.targetOrbitYaw += dx * 0.008;
        this.targetOrbitPitch = Math.max(-0.85, Math.min(0.85, this.targetOrbitPitch + dy * 0.008));
      }
    });
  }

  get palette() {
    return THEMES[this.themeKey] || THEMES.cyberblue;
  }

  get phaseCount() {
    return (this.currentSimulation?.phases?.length) || 4;
  }

  setTheme(key) {
    if (THEMES[key]) {
      this.themeKey = key;
    }
  }

  setFontSize(size) {
    this.fontSize = Math.max(11, Math.min(28, size));
    this.resize(true);
  }

  setOutputMode(mode) {
    this.outputMode = OUTPUT_PRESETS.hasOwnProperty(mode) ? mode : 'fit';
    this.resize(true);
  }

  get outputSize() {
    return [this.canvas.width, this.canvas.height];
  }

  resize(force = false) {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const preset = OUTPUT_PRESETS[this.outputMode];
    let logicalW, logicalH, pxW, pxH;

    if (preset) {
      logicalW = DESIGN_W;
      logicalH = DESIGN_H;
      [pxW, pxH] = preset;
      const s = Math.min(rect.width / logicalW, rect.height / logicalH) || 1;
      this.canvas.style.width = `${Math.max(1, Math.floor(logicalW * s))}px`;
      this.canvas.style.height = `${Math.max(1, Math.floor(logicalH * s))}px`;
    } else {
      const dpr = window.devicePixelRatio || 1;
      logicalW = Math.max(320, rect.width);
      logicalH = Math.max(180, rect.height);
      pxW = Math.floor(logicalW * dpr);
      pxH = Math.floor(logicalH * dpr);
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
    }

    const sizeChanged = this.canvas.width !== pxW || this.canvas.height !== pxH;
    if (sizeChanged) {
      this.canvas.width = pxW;
      this.canvas.height = pxH;
      this.glyphLayer.width = pxW;
      this.glyphLayer.height = pxH;
      this.emitLayer.width = Math.max(1, Math.ceil(pxW / 2));
      this.emitLayer.height = Math.max(1, Math.ceil(pxH / 2));
      this.blurA.width = Math.max(1, Math.ceil(pxW / 4));
      this.blurA.height = Math.max(1, Math.ceil(pxH / 4));
      this.blurB.width = Math.max(1, Math.ceil(pxW / 8));
      this.blurB.height = Math.max(1, Math.ceil(pxH / 8));
    }
    this.logicalW = logicalW;
    this.logicalH = logicalH;
    this.pxScale = pxW / logicalW;

    this.cellH = Math.round(this.fontSize * 1.22);
    this.cellW = Math.round(this.fontSize * 0.62);

    const newCols = Math.max(50, Math.floor(logicalW / this.cellW));
    const newRows = Math.max(20, Math.floor(logicalH / this.cellH));
    if (sizeChanged || force) this._buildPostCache();

    if (!force && newCols === this.cols && newRows === this.rows && this.cells.length === newCols * newRows) return;

    this.cols = newCols;
    this.rows = newRows;
    this.viewportScale = Math.max(0.75, Math.min(1.85, Math.min(this.cols / 118, this.rows / 36)));

    this.cells = new Array(this.cols * this.rows);
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = { char: ' ', color: '#00b4ff', r: 0, g: 180, b: 255, bg: null, alpha: 0, glow: false, ox: 0, oy: 0, hud: false };
    }
    if (this._sandbox) {
      this._sandbox.grid.width = this._sandbox.grid.cols = this.cols;
      this._sandbox.grid.height = this._sandbox.grid.rows = this.rows;
    }
  }

  _buildNoise() {
    this.noiseCanvas = document.createElement('canvas');
    this.noiseCanvas.width = 256;
    this.noiseCanvas.height = 256;
    const nctx = this.noiseCanvas.getContext('2d');
    const img = nctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    nctx.putImageData(img, 0, 0);
  }

  _buildPostCache() {
    // Scanline pattern in device pixels so it stays crisp at every output size
    const period = Math.max(3, Math.round(3 * this.pxScale));
    const sc = document.createElement('canvas');
    sc.width = 4;
    sc.height = period;
    const sctx = sc.getContext('2d');
    sctx.fillStyle = 'rgba(0,0,0,1)';
    sctx.fillRect(0, period - Math.max(1, Math.round(period / 3)), 4, Math.max(1, Math.round(period / 3)));
    this.scanPattern = this.ctx.createPattern(sc, 'repeat');
    this.noisePattern = this.ctx.createPattern(this.noiseCanvas, 'repeat');
  }

  // --- Soft Sound Synthesizer ---
  playTone(freq = 600, duration = 0.03, type = 'sine', vol = 0.025) {
    if (!this.soundEnabled) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (_) {}
  }

  playKeystrokeSound() {
    this.playTone(520 + Math.random() * 200, 0.016, 'triangle', 0.02);
  }

  playPhaseTriggerSound(phaseNum) {
    const freqs = [440, 554.37, 659.25, 880];
    const f = freqs[(phaseNum - 1) % freqs.length];
    this.playTone(f, 0.09, 'sine', 0.024);
  }

  // --- Simulation Loading & Control ---
  loadSimulation(simObj, { autoType = false } = {}) {
    this.currentSimulation = simObj;
    this.time = 0;
    this.tick = 0;
    this.phase = 1;
    this.smoothPhase = 1.0;
    this.phaseTime = 0;
    this.loopsCompleted = 0;
    this.targetOrbitYaw = 0;
    this.targetOrbitPitch = 0;
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.simState = {};
    this.particles = [];
    this.shockwaves = [];
    this.springs.clear();
    this.tweens.clear();
    this.colorAnims.clear();
    this.spins.clear();
    this.morphs.clear();
    this.iconMemo.clear();
    this.textMemo.clear();
    this.textPos.clear();
    this.camZoom = new Spring(1);
    this.camPunch = new Spring(0);
    this.camPanX = new Spring(0);
    this.camPanY = new Spring(0);
    this.shakeAmt = 0;
    this.flashAmt = 0;
    this.sweepT = SWEEP_DUR;
    this.lastError = null;
    this.clearGrid();

    if (autoType) {
      this.introT = INTRO_DUR;
      this.startAutoTyper(simObj.prompt || simObj.title);
    } else {
      this.typer.active = false;
      this.introT = this.introFx ? 0 : INTRO_DUR;
      this._initSimState();
    }
  }

  _initSimState() {
    if (!this.currentSimulation) return;
    try {
      if (typeof this.currentSimulation.init === 'function') {
        this.currentSimulation.init(this._createSandboxContext(1 / 60));
      }
    } catch (err) {
      this.lastError = err.message;
      console.error('Simulation init error:', err);
    }
  }

  setPhase(phaseNum) {
    const maxPhases = this.phaseCount;
    const clamped = Math.max(1, Math.min(maxPhases, phaseNum));
    this.phase = clamped;
    this.phaseTime = 0;
    this.playPhaseTriggerSound(clamped);

    // Subtle cinematic camera angle shift for each new shot
    const yawAngles = [-0.14, 0.12, -0.10, 0.16];
    const pitchAngles = [0.06, -0.05, 0.08, -0.04];
    this.targetOrbitYaw = yawAngles[(clamped - 1) % 4];
    this.targetOrbitPitch = pitchAngles[(clamped - 1) % 4];

    // Stage change: a soft dissolve (old content fades faster for a moment,
    // see fadeGrid) and a gentle camera ease — no rings, flashes or sweeps
    if (this.transitionFx) {
      this.camPunch.v += 0.08;
    }

    if (this.currentSimulation && typeof this.currentSimulation.onPhaseChange === 'function') {
      try {
        this.currentSimulation.onPhaseChange(clamped, this._createSandboxContext(this._dt));
      } catch (err) {
        console.error('onPhaseChange error:', err);
      }
    }
  }

  nextPhase() {
    const maxPhases = this.phaseCount;
    const next = this.phase >= maxPhases ? 1 : this.phase + 1;
    this.setPhase(next);
    return next;
  }

  startAutoTyper(promptText, onFinish = null) {
    this.clearGrid();
    this.typer = {
      active: true,
      prompt: promptText || 'simulate',
      typedLen: 0,
      charTimer: 0,
      speedMs: this.typer.speedMs || 30,
      stage: 'typing',
      bootTime: 0,
      onFinish
    };
  }

  // --- Timeline ---
  stageHold(p) {
    // Scenes timed to a voice-over carry their own per-stage durations; the
    // Stage-sec control then acts as a speed scale (4.6s = narration pace)
    const custom = this.currentSimulation?.stageDurations?.[p - 1];
    if (custom) return custom * (this.stageDuration / 4.6);
    return p === this.phaseCount ? this.stageDuration * 1.25 : this.stageDuration;
  }

  timelineDuration() {
    let total = 0;
    for (let p = 1; p <= this.phaseCount; p++) total += this.stageHold(p);
    return total;
  }

  timelineElapsed() {
    let el = 0;
    for (let p = 1; p < this.phase; p++) el += this.stageHold(p);
    return el + Math.min(this.phaseTime, this.stageHold(this.phase));
  }

  // --- Smooth Easing Helpers ---
  easeInOutCubic(t) {
    return EASE.inOutCubic(t);
  }

  get stageBlend() {
    return EASE.inOutCubic(Math.min(1, this.phaseTime / 0.95));
  }

  // --- Animation State Helpers (exposed to scenes as ctx.anim) ---
  animSpring(key, target, opts = {}) {
    let s = this.springs.get(key);
    if (!s) {
      s = new Spring(opts.from !== undefined ? opts.from : target);
      this.springs.set(key, s);
    }
    s.target = target;
    if (s.tick !== this.tick) {
      s.tick = this.tick;
      s.step(this._dt, opts.freq || 9, opts.damp !== undefined ? opts.damp : 1);
    }
    return s.x;
  }

  animTween(key, target, dur = 0.8, ease = 'inOutCubic', opts = {}) {
    let tw = this.tweens.get(key);
    const now = this.time;
    if (!tw) {
      const start = opts.from !== undefined ? opts.from : target;
      tw = { from: start, to: target, t0: now, value: start };
      this.tweens.set(key, tw);
    }
    if (tw.to !== target) {
      // Back-date by one frame so a target that changes every frame (a live
      // progress value) still converges instead of restarting at k = 0
      tw.from = tw.value;
      tw.to = target;
      tw.t0 = now - this._dt;
    }
    const k = easeFn(ease)((now - tw.t0) / Math.max(0.001, dur));
    tw.value = tw.from + (tw.to - tw.from) * k;
    return tw.value;
  }

  animColor(key, target, speed = 6) {
    const rgb = parseColor(target);
    let c = this.colorAnims.get(key);
    if (!c) {
      c = { r: rgb[0], g: rgb[1], b: rgb[2], tick: -1 };
      this.colorAnims.set(key, c);
    }
    if (c.tick !== this.tick) {
      c.tick = this.tick;
      const k = 1 - Math.exp(-this._dt * speed);
      c.r += (rgb[0] - c.r) * k;
      c.g += (rgb[1] - c.g) * k;
      c.b += (rgb[2] - c.b) * k;
    }
    return rgbString(c.r, c.g, c.b);
  }

  // Integrated rotation: changing the rate never makes the angle jump
  animSpin(key, rate, smoothing = 3) {
    let s = this.spins.get(key);
    if (!s) {
      s = { angle: 0, rate, tick: -1 };
      this.spins.set(key, s);
    }
    if (s.tick !== this.tick) {
      s.tick = this.tick;
      s.rate += (rate - s.rate) * (1 - Math.exp(-this._dt * smoothing));
      s.angle += s.rate * this._dt;
    }
    return s.angle;
  }

  // --- 2D Grid Primitives ---
  clearGrid() {
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      c.char = ' ';
      c.alpha = 0;
      c.bg = null;
      c.glow = false;
    }
  }

  fadeGrid(decay = 0.16) {
    // Phosphor persistence, normalised to 60fps so 30/60fps renders match
    let smoothDecay = Math.min(0.22, Math.max(0.08, decay * 0.78));
    // Dissolve outgoing visuals quickly right after a stage change
    if (this.transitionFx && this.phaseTime < 0.35) smoothDecay = Math.min(0.4, smoothDecay * 2.2);
    const keep = Math.pow(Math.max(0, Math.min(1, 1 - smoothDecay)), this._dt * 60);
    for (let i = 0; i < this.cells.length; i++) {
      const c = this.cells[i];
      if (c.alpha > 0) {
        c.alpha *= keep;
        c.glow = false;
        if (c.alpha < 0.05) {
          c.char = ' ';
          c.alpha = 0;
          c.bg = null;
        }
      }
    }
  }

  setCell(x, y, char, color = null, glow = false, bg = null, alpha = 1.0) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.cols || iy < 0 || iy >= this.rows) return;
    if (!char || char === '') return;
    const cell = this.cells[iy * this.cols + ix];
    const ch = String(char)[0];
    const col = color || this.palette.primary;
    const rgb = parseColor(col);
    if (this.smoothColor && cell.alpha > 0.05 && cell.char === ch) {
      // Same glyph changing colour (e.g. a stage recolour): glide instead of snapping
      const k = this._colorK;
      cell.r += (rgb[0] - cell.r) * k;
      cell.g += (rgb[1] - cell.g) * k;
      cell.b += (rgb[2] - cell.b) * k;
    } else {
      cell.r = rgb[0];
      cell.g = rgb[1];
      cell.b = rgb[2];
    }
    cell.char = ch;
    cell.color = col;
    cell.glow = Boolean(glow);
    cell.bg = bg || null;
    cell.alpha = Math.max(cell.alpha * 0.35, alpha);
    cell.hud = this._hudMode;
    if (this.subpixel) {
      cell.ox = x - ix;
      cell.oy = y - iy;
    } else {
      cell.ox = 0;
      cell.oy = 0;
    }
  }

  getCell(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.cols || iy < 0 || iy >= this.rows) return null;
    return this.cells[iy * this.cols + ix];
  }

  // Returns the time a string started revealing. New strings type on; strings
  // whose only change is a number / bar fill at the same spot update in place.
  _revealStart(text, x, y, align) {
    const now = this.time;
    const posKey = `${Math.round(x)}|${Math.round(y)}|${align}`;
    const memo = this.textMemo.get(text);
    let t0;
    if (memo && now - memo.seen < 0.35) {
      t0 = memo.t0;
    } else {
      const prev = this.textPos.get(posKey);
      const norm = (s) => s.replace(/[\d.,%]+/g, '0').replace(/[█░▒▓■□━┄─═=#·•]+/g, '~');
      if (prev && now - prev.seen < 0.35 && norm(prev.str) === norm(text)) t0 = prev.t0;
      else t0 = now;
    }
    if (memo) {
      memo.t0 = t0;
      memo.seen = now;
    } else {
      this.textMemo.set(text, { t0, seen: now });
    }
    this.textPos.set(posKey, { str: text, t0, seen: now });
    return t0;
  }

  _gcTextMemo() {
    const now = this.time;
    for (const [k, v] of this.textMemo) if (now - v.seen > 2) this.textMemo.delete(k);
    for (const [k, v] of this.textPos) if (now - v.seen > 2) this.textPos.delete(k);
  }

  drawText(x, y, str, color = null, glow = false, align = 'left', bg = null, alpha = 1) {
    const text = String(str ?? '');
    if (!text) return;
    const len = text.length;
    let startX = x;
    if (align === 'center') startX -= Math.floor(len / 2);
    else if (align === 'right') startX -= len;
    if (!this.subpixel) startX = Math.round(startX);

    let shown = len;
    if (this.textReveal && !this._noReveal) {
      const t0 = this._revealStart(text, x, y, align);
      shown = Math.min(len, Math.max(0, (this.time - t0) * this.revealCPS));
    }
    const a0 = typeof alpha === 'number' ? alpha : 1;

    for (let i = 0; i < len; i++) {
      if (i >= shown) {
        if (i === Math.floor(shown)) this.setCell(startX + i, y, '▌', this.palette.accent, true, null, a0);
        break;
      }
      const ramp = Math.min(1, shown - i);
      const hot = shown < len && shown - i < 5;
      this.setCell(startX + i, y, text[i], color, glow || hot, bg, a0 * ramp);
    }
  }

  // Lower-third caption. "STAGE 2: ..." becomes a stage tag + body with a
  // drawn-on underline. Rendered in HUD space so camera moves never crop it.
  drawCaption(text, opts = {}) {
    const pal = this.palette;
    const raw = String(text ?? '');
    if (!raw) return;
    const y = opts.y !== undefined ? opts.y : this.rows - 3;
    const cx = Math.floor(this.cols / 2);
    const m = /^\s*(STAGE\s*\d+)\s*[:\-–—]\s*(.*)$/i.exec(raw);
    const body = m ? m[2] : raw;
    this._hudMode = true;
    if (m && opts.tag !== false) {
      const tag = `◆ ${m[1].toUpperCase()} / ${this.phaseCount}`;
      this.drawText(cx, y - 1, tag, opts.tagColor || pal.secondary, false, 'center');
    }
    this.drawText(cx, y, body, opts.color || pal.primary, true, 'center');
    const t0 = this._revealStart(body, cx, y, 'center');
    const k = EASE.outExpo((this.time - t0) / 0.9);
    const half = (body.length / 2 + 1) * k;
    if (half > 0.2) {
      this._vline(cx - half, y + 0.62, cx + half, y + 0.62, opts.lineColor || pal.accent, 0.38, 1);
      this._vdot(cx - half, y + 0.62, 1.4, pal.accent, 0.7);
      this._vdot(cx + half, y + 0.62, 1.4, pal.accent, 0.7);
    }
    this._hudMode = false;
  }

  // Scene title with rule lines that extend outward once the text lands
  drawTitle(text, opts = {}) {
    const pal = this.palette;
    const str = String(text ?? '');
    if (!str) return;
    const y = opts.y !== undefined ? opts.y : 2;
    const cx = Math.floor(this.cols / 2);
    this._hudMode = true;
    this.drawText(cx, y, str, opts.color || pal.accent, true, 'center');
    const t0 = this._revealStart(str, cx, y, 'center');
    const k = EASE.outExpo((this.time - t0 - str.length / this.revealCPS) / 1.1);
    const inner = str.length / 2 + 2;
    const reach = (opts.rule !== undefined ? opts.rule : 16) * k;
    if (reach > 0.3) {
      this._vline(cx - inner, y, cx - inner - reach, y, pal.primary, 0.42, 1);
      this._vline(cx + inner, y, cx + inner + reach, y, pal.primary, 0.42, 1);
      this._vdot(cx - inner - reach, y, 1.5, pal.accent, 0.8);
      this._vdot(cx + inner + reach, y, 1.5, pal.accent, 0.8);
    }
    this._hudMode = false;
  }

  drawCounter(key, x, y, value, opts = {}) {
    const dur = opts.duration !== undefined ? opts.duration : 1.1;
    const v = this.animTween(`counter:${key}`, Number(value) || 0, dur, opts.ease || 'outCubic', { from: opts.from });
    const dec = opts.decimals || 0;
    const num = dec > 0 ? v.toFixed(dec) : Math.round(v).toLocaleString('en-US');
    const str = `${opts.prefix || ''}${num}${opts.suffix || ''}`;
    this.drawText(x, y, str, opts.color || this.palette.accent, opts.glow !== false, opts.align || 'center');
    return v;
  }

  drawBox(x, y, w, h, opts = {}) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    const iw = Math.round(w);
    const ih = Math.round(h);
    if (iw < 2 || ih < 2) return;

    const style = BOX_STYLES[opts.style || 'round'] || BOX_STYLES.round;
    const color = opts.color || this.palette.primary;
    const glow = Boolean(opts.glow);
    const fill = opts.fill !== undefined ? opts.fill : null;
    const bg = opts.bg || null;

    if (fill !== null) {
      for (let row = iy + 1; row < iy + ih - 1; row++) {
        for (let col = ix + 1; col < ix + iw - 1; col++) {
          this.setCell(col, row, fill, opts.fillColor || this.palette.dim, false, bg);
        }
      }
    }

    for (let col = ix + 1; col < ix + iw - 1; col++) {
      this.setCell(col, iy, style.h, color, glow, bg);
      this.setCell(col, iy + ih - 1, style.h, color, glow, bg);
    }
    for (let row = iy + 1; row < iy + ih - 1; row++) {
      this.setCell(ix, row, style.v, color, glow, bg);
      this.setCell(ix + iw - 1, row, style.v, color, glow, bg);
    }

    this.setCell(ix, iy, style.tl, color, glow, bg);
    this.setCell(ix + iw - 1, iy, style.tr, color, glow, bg);
    this.setCell(ix, iy + ih - 1, style.bl, color, glow, bg);
    this.setCell(ix + iw - 1, iy + ih - 1, style.br, color, glow, bg);

    if (this.holoHud) {
      this._vpath([ix, iy, ix + iw - 1, iy, ix + iw - 1, iy + ih - 1, ix, iy + ih - 1], { color, alpha: glow ? 0.3 : 0.16, width: 1, closed: true });
    }

    if (opts.title) {
      const titleStr = ` ${opts.title} `;
      const tx = ix + Math.max(2, Math.floor((iw - titleStr.length) / 2));
      this.drawText(tx, iy, titleStr, opts.titleColor || this.palette.accent, true, 'left', bg);
    }
  }

  drawLine(x0, y0, x1, y1, char = '·', color = null, glow = false, alpha = 1) {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);
    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);

    const dx = Math.abs(ix1 - ix0);
    const dy = Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;
    let err = dx - dy;
    let steps = 0;
    const a = typeof alpha === 'number' ? alpha : 1;

    while (steps++ < 400) {
      this.setCell(ix0, iy0, char, color || this.palette.dim, glow, null, a);
      if (ix0 === ix1 && iy0 === iy1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; ix0 += sx; }
      if (e2 < dx) { err += dx; iy0 += sy; }
    }
  }

  drawDataLine(x0, y0, x1, y1, opts = {}) {
    const lineChar = opts.char || '┄';
    const lineColor = opts.color || this.palette.dim;
    const count = opts.packets || 3;
    const rawSpeed = opts.speed || 1.0;
    const speed = Math.min(1.3, rawSpeed * 0.55);
    const packetChar = opts.packetChar || '◈';
    const packetColor = opts.packetColor || this.palette.accent;

    // 1. Clean structural conduit line connecting source to destination
    if (opts.showTrack !== false) {
      this.drawLine(x0, y0, x1, y1, lineChar, lineColor, false);
      if (this.holoHud) this._vline(x0, y0, x1, y1, packetColor, 0.14, 1);
    }

    // 2. Directional terminal joints & arrowhead
    const dx = x1 - x0;
    const dy = y1 - y0;
    this.setCell(x0, y0, '├', lineColor, false);
    const arrow = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? '►' : '◄')
      : (dy >= 0 ? '▼' : '▲');
    this.setCell(x1, y1, arrow, packetColor, true);

    // 3. Gliding packets: sub-pixel glyph + vector comet tail
    for (let i = 0; i < count; i++) {
      const rawT = ((this.time * speed) + (i / count)) % 1;
      const t = EASE.inOutCubic(rawT);
      const tail1 = EASE.inOutCubic(Math.max(0, rawT - 0.045));
      const tail2 = EASE.inOutCubic(Math.max(0, rawT - 0.09));
      const tailV = EASE.inOutCubic(Math.max(0, rawT - 0.16));
      this.setCell(x0 + dx * tail2, y0 + dy * tail2, '·', lineColor, false, null, 0.55);
      this.setCell(x0 + dx * tail1, y0 + dy * tail1, '•', packetColor, false, null, 0.82);
      this.setCell(x0 + dx * t, y0 + dy * t, packetChar, packetColor, true);
      if (this.holoHud) {
        this._vcomet(x0 + dx * tailV, y0 + dy * tailV, x0 + dx * t, y0 + dy * t, packetColor, 0.85, 2);
        this._vdot(x0 + dx * t, y0 + dy * t, 2.4, packetColor, 0.9);
      }
    }
  }

  drawCircle(cx, cy, r, char = '·', color = null, glow = false, alpha = 1) {
    const steps = Math.max(16, Math.floor(r * 7));
    const col = color || this.palette.secondary;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = cx + Math.cos(angle) * r * 1.85;
      const y = cy + Math.sin(angle) * r;
      this.setCell(x, y, char, col, glow, null, alpha);
    }
    if (this.holoHud) {
      this.vItems.push({ t: 'ellipse', x: cx, y: cy, rx: r * 1.85, ry: r, c: col, a: (glow ? 0.32 : 0.16) * alpha, w: 1, h: this._hudMode });
    }
  }

  drawReticle(cx, cy, r = 5, opts = {}) {
    const col = opts.color || this.palette.accent;
    const rx = Math.round(r * 1.75);
    const ry = Math.round(r);
    this.setCell(cx - rx, cy - ry, '⌜', col, true);
    this.setCell(cx + rx, cy - ry, '⌝', col, true);
    this.setCell(cx - rx, cy + ry, '⌞', col, true);
    this.setCell(cx + rx, cy + ry, '⌟', col, true);
    if (this.holoHud) {
      this.vItems.push({ t: 'arcs', x: cx, y: cy, rx: r * 1.6, ry: r * 0.92, c: col, a: 0.4, w: 1.2, rot: this.time * 0.9, h: this._hudMode });
    }
    if (opts.label) this.drawText(cx, cy - ry - 1, opts.label, col, true, 'center');
  }

  drawWaveform() {
    // Removed wave bars so waves never block the visual example
  }

  drawProgressBar(x, y, w, ratio, opts = {}) {
    const clamped = Math.max(0, Math.min(1, ratio));
    const innerW = Math.max(4, w - 2);
    const filled = Math.round(innerW * clamped);
    const barStr = '[' + '█'.repeat(filled) + '░'.repeat(innerW - filled) + ']';
    this.drawText(x, y, barStr, opts.color || this.palette.primary, Boolean(opts.glow));
  }

  // --- Vector Overlay Queue (cell-space coordinates, AA strokes) ---
  _vline(x0, y0, x1, y1, color, alpha = 0.5, width = 1.2, dash = null) {
    this.vItems.push({ t: 'path', p: [x0, y0, x1, y1], c: color, a: alpha, w: width, dash, h: this._hudMode });
  }

  _vpath(points, opts = {}) {
    let flat = points;
    if (Array.isArray(points) && Array.isArray(points[0])) {
      flat = [];
      for (const pt of points) flat.push(pt[0], pt[1]);
    } else if (Array.isArray(points) && points.length && typeof points[0] === 'object') {
      flat = [];
      for (const pt of points) flat.push(pt.x, pt.y);
    }
    if (!flat || flat.length < 4) return;
    this.vItems.push({
      t: opts.taper ? 'taper' : 'path',
      p: flat,
      c: opts.color || this.palette.primary,
      a: opts.alpha !== undefined ? opts.alpha : 0.6,
      w: opts.width || 1.4,
      dash: opts.dash || null,
      closed: Boolean(opts.closed),
      h: this._hudMode
    });
    if (opts.glow && this.holoHud) {
      this.vItems.push({ t: 'path', p: flat, c: opts.color || this.palette.primary, a: (opts.alpha !== undefined ? opts.alpha : 0.6) * 0.35, w: (opts.width || 1.4) * 3.2, closed: Boolean(opts.closed), h: this._hudMode });
    }
  }

  _vcomet(x0, y0, x1, y1, color, alpha = 0.8, width = 2) {
    this.vItems.push({ t: 'comet', p: [x0, y0, x1, y1], c: color, a: alpha, w: width, h: this._hudMode });
  }

  _vdot(x, y, r, color, alpha = 0.8) {
    this.vItems.push({ t: 'dot', x, y, r, c: color, a: alpha, h: this._hudMode });
  }

  _vDepthSegs(proj, closed, color, dim, alpha, wFront = 1.3, wBack = 1) {
    const front = [];
    const back = [];
    const n = proj.length;
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) {
      const a = proj[i];
      const b = proj[(i + 1) % n];
      ((a.z + b.z) * 0.5 >= 0 ? front : back).push(a.x, a.y, b.x, b.y);
    }
    if (back.length) this.vItems.push({ t: 'segs', p: back, c: dim || color, a: 0.16 * alpha, w: wBack, h: this._hudMode });
    if (front.length) this.vItems.push({ t: 'segs', p: front, c: color, a: 0.5 * alpha, w: wFront, h: this._hudMode });
  }

  // Draws a concept icon (see ICONS) centred on (cx, cy). Positions are
  // sub-pixel, so an icon can ride along a path or bob without stepping.
  // Icons are holographic like the rest of the stage: they materialise row by
  // row (with a bright scan front) when they first appear or change, a scan
  // band rolls through them, and a projector ring pulses underneath.
  drawIcon(name, cx, cy, color = null, opts = {}) {
    const src = Array.isArray(name) ? name : ICONS[name];
    if (!src) return;
    const t = this.time;
    const lines = typeof src === 'function' ? src(t + (opts.phaseOffset || 0)) : src;
    const col = color || this.palette.primary;
    const accent = opts.accent || '#ffffff';
    const baseAlpha = opts.alpha !== undefined ? opts.alpha : 1;
    const bob = opts.bob ? Math.sin(t * 2.2 + cx * 0.37) * 0.28 : 0;
    const rows = lines.length;
    const startY = cy - (rows - 1) / 2 + bob;
    const maxW = Math.max(...lines.map(l => l.length));

    // Materialise when this icon (by key) first shows up or switches design
    const key = opts.key || (typeof name === 'string' ? name : 'icon');
    const iconName = typeof name === 'string' ? name : 'custom';
    let memo = this.iconMemo.get(key);
    if (!memo || memo.name !== iconName || t - memo.seen > 0.35) {
      memo = { name: iconName, t0: t, seen: t };
      this.iconMemo.set(key, memo);
    }
    memo.seen = t;
    const k = (t - memo.t0) / (opts.materialize || 0.5);
    const front = k * (rows + 1.5);
    const band = ((t * 0.55 + cx * 0.013) % 1.6) * (rows + 2) - 1;
    const flicker = 0.93 + 0.07 * Math.sin(t * 13 + cx);

    for (let r = 0; r < rows; r++) {
      const line = lines[r];
      const startX = cx - (line.length - 1) / 2;
      for (let c = 0; c < line.length; c++) {
        const ch = line[c];
        if (ch === ' ') continue;
        const jitter = (Math.sin((c + 1) * 12.9898 + r * 78.233) * 43758.5453) % 1;
        const reveal = front - r - Math.abs(jitter) * 0.8;
        if (reveal <= 0) continue;
        const fresh = reveal < 1;
        const inBand = Math.abs(band - r) < 0.6;
        const isAccent = ICON_ACCENT_CHARS.has(ch);
        const a = baseAlpha * flicker * Math.min(1, reveal) * (inBand ? 1 : 0.88);
        const glyphCol = fresh ? '#ffffff' : (isAccent ? accent : col);
        this.setCell(startX + c, startY + r, ch, glyphCol, opts.glow || isAccent || inBand || fresh, null, a);
      }
    }
    if (k < 1.1 && front > 0 && front < rows + 0.5) {
      const fy = startY + front - 0.5;
      this._vline(cx - maxW / 2 - 0.5, fy, cx + maxW / 2 - 0.5, fy, '#ffffff', 0.7 * baseAlpha, 1.2);
    }
    if (this.holoHud) {
      if (opts.glow) this.addGlow(cx, cy, Math.max(3, maxW * 0.6), col, 0.8 * baseAlpha);
      // Pulsing floor ellipse is opt-in only (it read as an orbit ring)
      if (opts.base === true) {
        const pulse = (t * 0.8 + cx * 0.02) % 1;
        const by = startY + rows - 0.35;
        this.vItems.push({ t: 'ellipse', x: cx - 0.5, y: by, rx: maxW * 0.55, ry: 0.32, c: col, a: 0.32 * baseAlpha * Math.min(1, k), w: 1, h: this._hudMode });
        this.vItems.push({ t: 'ellipse', x: cx - 0.5, y: by, rx: maxW * (0.55 + pulse * 0.45), ry: 0.32 + pulse * 0.3, c: col, a: 0.3 * (1 - pulse) * baseAlpha * Math.min(1, k), w: 1, h: this._hudMode });
      }
    }
    if (opts.label) {
      this.drawText(cx, startY + rows + 0.2, opts.label, opts.labelColor || col, Boolean(opts.glow), 'center', null, baseAlpha);
    }
  }

  // A small code / config window. Each line is a string or
  // { text, mark: 'hl' | 'add' | 'del' | 'warn' | 'dim' }: highlighted lines get
  // a glowing bar, 'del' is struck through, 'add' types on in green.
  // The card unrolls line by line the first time it appears.
  drawCodeCard(cx, cy, opts = {}) {
    const pal = this.palette;
    const lines = (opts.lines || []).map(l => (typeof l === 'string' ? { text: l } : l));
    const key = opts.key || opts.title || 'card';
    const frameCol = opts.color || pal.primary;
    const width = opts.width || Math.max(14, ...lines.map(l => l.text.length + 8), (opts.title || '').length + 6);
    const h = lines.length + 2;
    const x0 = Math.round(cx - width / 2);
    const y0 = Math.round(cy - h / 2);
    const appear = this.animSpring(`card:${key}`, 1, { from: 0, freq: 5, damp: 0.9 });
    const shownRows = Math.floor(appear * (lines.length + 0.99));
    const green = opts.addColor || '#00ff88';

    this.drawBox(x0, y0, width, h, { style: 'round', color: frameCol, title: opts.title, titleColor: opts.titleColor || pal.accent, glow: Boolean(opts.glow) });
    if (this.holoHud) {
      this.vItems.push({ t: 'rect', x: x0 + 0.5, y: y0 + 0.5, w: width - 1, rh: h - 1, c: frameCol, a: 0.05, h: this._hudMode });
    }

    for (let i = 0; i < Math.min(shownRows, lines.length); i++) {
      const ln = lines[i];
      const y = y0 + 1 + i;
      const tx = x0 + 4;
      let col = opts.textColor || pal.accent;
      let prefix = ' ';
      if (ln.mark === 'hl') { col = opts.hlColor || pal.warn; prefix = '▶'; }
      else if (ln.mark === 'warn') { col = pal.warn; prefix = '!'; }
      else if (ln.mark === 'del') { col = pal.danger; prefix = '-'; }
      else if (ln.mark === 'add') { col = green; prefix = '+'; }
      else if (ln.mark === 'dim') { col = pal.dim; }
      this.drawText(x0 + 1, y, String(i + 1).padStart(2, ' '), pal.dim, false, 'left');
      if (prefix !== ' ') this.setCell(x0 + 3, y, prefix, col, true);
      // Marked lines sit on a tinted bar, so lift their text toward white to stay legible
      const lit = ln.mark === 'add' || ln.mark === 'hl' || ln.mark === 'warn';
      this.drawText(tx, y, ln.text, lit ? mixColor(col, '#ffffff', 0.55) : col, lit, 'left');
      if (this.holoHud && (ln.mark === 'hl' || ln.mark === 'add' || ln.mark === 'warn')) {
        const pulse = 0.75 + 0.25 * Math.sin(this.time * 4);
        this.vItems.push({ t: 'rect', x: x0 + 0.6, y: y, w: width - 1.2, rh: 1, c: col, a: 0.07 * pulse, h: this._hudMode });
      }
      if (ln.mark === 'del') {
        this._vline(tx - 0.4, y, tx + ln.text.length - 0.6, y, pal.danger, 0.85, 1.3);
      }
    }
  }

  // Large hero type drawn in the vector layer (so it glows and moves with the
  // camera). Types on character by character the first time a string appears.
  drawBigText(x, y, str, opts = {}) {
    const text = String(str ?? '');
    if (!text) return;
    const align = opts.align || 'center';
    let shown = text.length;
    if (opts.reveal !== false && this.textReveal) {
      const t0 = this._revealStart('§' + text, x, y, align);
      shown = Math.min(text.length, Math.floor((this.time - t0) * (opts.cps || 28)) + 1);
    }
    this.vItems.push({
      t: 'text', x, y, str: text.slice(0, shown), size: opts.size || 3,
      c: opts.color || this.palette.accent, a: opts.alpha !== undefined ? opts.alpha : 1,
      align, h: this._hudMode
    });
  }

  addGlow(cx, cy, radius = 6, color = null, intensity = 1) {
    this.glowNodes.push({ cx, cy, radius, color: color || this.palette.primary, intensity, h: this._hudMode });
  }

  // --- 3D Projection & Diverse Geometric Primitives ---
  project3D(x, y, z, cx, cy, rotX = 0, rotY = 0, rotZ = 0, scale = 12, camDist = 3.6) {
    const effRotX = rotX * 0.68 + this.parallaxY + this.orbitPitch;
    const effRotY = rotY * 0.68 + this.parallaxX + this.orbitYaw;
    const effRotZ = rotZ * 0.68;

    // Rotate X
    const y1 = y * Math.cos(effRotX) - z * Math.sin(effRotX);
    const z1 = y * Math.sin(effRotX) + z * Math.cos(effRotX);
    const x1 = x;
    // Rotate Y
    const x2 = x1 * Math.cos(effRotY) + z1 * Math.sin(effRotY);
    const z2 = -x1 * Math.sin(effRotY) + z1 * Math.cos(effRotY);
    const y2 = y1;
    // Rotate Z
    const x3 = x2 * Math.cos(effRotZ) - y2 * Math.sin(effRotZ);
    const y3 = x2 * Math.sin(effRotZ) + y2 * Math.cos(effRotZ);
    const z3 = z2;

    // Responsive 3D scale that adapts to the stage size and keeps a 1:1 cube aspect ratio
    const vScale = this.viewportScale || 1.0;
    const smoothScale = scale * 0.80 * vScale;
    const persp = camDist / Math.max(0.85, camDist - z3);
    const aspect = this.cellH / Math.max(1, this.cellW);
    return {
      x: cx + x3 * smoothScale * persp * aspect,
      y: cy + y3 * smoothScale * persp,
      z: z3,
      persp
    };
  }

  // --- Clean 3D Geometric & Orbital Node Primitives (No Bot Faces or Heavy Shading) ---
  drawRobotCube(cx, cy, opts = {}) {
    const pal = this.palette;
    const scale = opts.scale || 3.6;
    const color = opts.color || pal.accent;
    const frameCol = opts.frameColor || pal.primary;
    const label = opts.label || '';

    if (opts.cube3D !== false) {
      this.drawCube3D(cx, cy, scale, this.time * 0.48, this.time * 0.68, 0, {
        color: frameCol,
        accent: color,
        dim: pal.dim,
        frontChar: ':',
        backChar: '·',
        vertexChar: '◈'
      });
    }

    this.drawCircle(cx, cy, 2.2, '·', frameCol, false);
    this.setCell(cx, cy, '◈', color, true);

    if (label) {
      this.drawText(cx, Math.round(cy + scale + 2), label, color, true, 'center');
    }
  }

  drawShadedCube3D(cx, cy, scale = 4.2, rotX = 0.4, rotY = 0.6, rotZ = 0, opts = {}) {
    return this.drawCube3D(cx, cy, scale, rotX, rotY, rotZ, {
      frontChar: ':',
      backChar: '·',
      vertexChar: '◈',
      ...opts
    });
  }

  drawShadedSphere3D(cx, cy, radius = 6.5, lightAngle = 0, opts = {}) {
    this.drawRing3D(cx, cy, radius, 0.65, lightAngle * 0.4, {
      color: opts.color || this.palette.primary,
      dim: opts.dim || this.palette.dim,
      spin: this.time * 0.6,
      glow: true
    });
    return this.drawIcosahedron3D(cx, cy, radius * 0.78, this.time * 0.45, lightAngle, 0, {
      color: opts.color || this.palette.primary,
      accent: opts.accent || this.palette.accent,
      dim: opts.dim || this.palette.dim,
      vertexChar: '◈'
    });
  }

  drawWordStream(x0, y0, x1, y1, words = ['DATA'], opts = {}) {
    const pal = this.palette;
    const wordCol = opts.wordColor || pal.accent;
    const speed = (opts.speed || 0.48);
    const count = opts.count || 1;

    // Pure moving ASCII words without static connecting lines
    const list = Array.isArray(words) && words.length ? words : [String(words)];
    for (let i = 0; i < count; i++) {
      const rawT = (this.time * speed + i / count);
      const t = EASE.inOutCubic(rawT % 1);
      const word = list[(Math.floor(rawT) + i) % list.length];
      const wx = x0 + (x1 - x0) * t;
      const wy = y0 + (y1 - y0) * t;
      this.drawText(wx, wy, word, wordCol, true, 'center');
    }
  }

  drawWordRing3D(cx, cy, radius = 12, tiltX = 0.75, spin = 0, words = [], opts = {}) {
    const pal = this.palette;
    if (!Array.isArray(words) || !words.length) return;
    for (let i = 0; i < words.length; i++) {
      const a = (i / words.length) * Math.PI * 2 + spin * 0.65;
      const p = this.project3D(Math.cos(a), 0, Math.sin(a), cx, cy, tiltX, 0, 0, radius);
      const front = p.z >= 0;
      const wStr = String(words[i]);
      const highlight = opts.highlight !== undefined && opts.highlight === i;
      const col = front ? (highlight ? (opts.highlightColor || '#ffffff') : (opts.color || pal.accent)) : (opts.dim || pal.dim);
      const depthA = 0.45 + 0.55 * Math.max(0, Math.min(1, (p.z + 1) / 2));
      this.drawText(p.x, p.y, wStr, col, front, 'center', null, depthA * (opts.alpha !== undefined ? opts.alpha : 1));
    }
  }

  drawWaveField() {
    // Removed wave field so waves never block the example
  }

  // Borderless, Cascading Matrix Digital Rain / Cipher Columns with Smooth Alpha Trails
  drawMatrixRain(x, y, w, h, opts = {}) {
    const pal = this.palette;
    const glyphs = opts.glyphs || '0179AFX◈❖•:·+=<>';
    const speed = opts.speed || 9.5;
    const density = opts.step || 2;
    const headCol = opts.headColor || '#ffffff';
    const mainCol = opts.color || pal.accent;
    const trailCol = opts.trailColor || pal.primary;
    const dimCol = opts.dim || pal.dim;
    const trailLen = opts.trail || 9;
    const dir = opts.direction === 'up' ? -1 : 1;

    const startX = Math.round(x);
    const startY = Math.round(y);
    const endX = startX + Math.round(w);
    const endY = startY + Math.round(h);

    for (let col = startX; col < endX; col += density) {
      const seed = Math.sin(col * 12.9898 + 78.233) * 43758.5453;
      const colPhase = seed - Math.floor(seed);
      const colSpeed = speed * (0.65 + colPhase * 0.75);
      const cycleH = h + trailLen + 4;
      const rawPos = ((this.time * colSpeed + colPhase * cycleH) % cycleH);
      const headRow = dir === 1
        ? startY + Math.floor(rawPos) - 2
        : endY - Math.floor(rawPos) + 2;

      for (let t = 0; t < trailLen; t++) {
        const ry = headRow - dir * t;
        if (ry < startY || ry >= endY) continue;
        const gIdx = Math.abs(Math.floor(this.time * 8 + col * 3 + ry * 5 + t)) % glyphs.length;
        const ch = glyphs[gIdx];
        if (t === 0) {
          this.setCell(col, ry, ch, headCol, true, null, 1.0);
        } else if (t <= 2) {
          this.setCell(col, ry, ch, mainCol, true, null, 0.92 - t * 0.1);
        } else {
          const fadeAlpha = Math.max(0.18, 0.85 * (1 - t / trailLen));
          this.setCell(col, ry, ch, t < trailLen * 0.6 ? trailCol : dimCol, false, null, fadeAlpha);
        }
      }
    }
  }

  // True 3D X / Y / Z Coordinate Space Grid & Axes
  drawAxes3D(cx, cy, scale = 12, rotX = 0.42, rotY = -0.55, rotZ = 0, opts = {}) {
    const pal = this.palette;
    const origin = this.project3D(0, 0, 0, cx, cy, rotX, rotY, rotZ, scale);
    const xEnd   = this.project3D(1.35, 0, 0, cx, cy, rotX, rotY, rotZ, scale);
    const yEnd   = this.project3D(0, -1.25, 0, cx, cy, rotX, rotY, rotZ, scale);
    const zEnd   = this.project3D(0, 0, 1.35, cx, cy, rotX, rotY, rotZ, scale);

    // Subtle 3D XZ ground plane grid
    for (let g = -1.0; g <= 1.01; g += 0.5) {
      const a1 = this.project3D(g, 0.85, -1.0, cx, cy, rotX, rotY, rotZ, scale);
      const a2 = this.project3D(g, 0.85,  1.0, cx, cy, rotX, rotY, rotZ, scale);
      const b1 = this.project3D(-1.0, 0.85, g, cx, cy, rotX, rotY, rotZ, scale);
      const b2 = this.project3D( 1.0, 0.85, g, cx, cy, rotX, rotY, rotZ, scale);
      if (this.holoHud) {
        this._vline(a1.x, a1.y, a2.x, a2.y, pal.dim, 0.22, 1);
        this._vline(b1.x, b1.y, b2.x, b2.y, pal.dim, 0.22, 1);
      }
      this.drawLine(a1.x, a1.y, a2.x, a2.y, '·', pal.muted, false);
      this.drawLine(b1.x, b1.y, b2.x, b2.y, '·', pal.muted, false);
    }

    // X, Y, Z Axis vectors
    this.drawLine(origin.x, origin.y, xEnd.x, xEnd.y, '─', pal.primary, true);
    this.drawLine(origin.x, origin.y, yEnd.x, yEnd.y, '│', pal.accent, true);
    this.drawLine(origin.x, origin.y, zEnd.x, zEnd.y, '·', pal.warn, true);

    if (this.holoHud) {
      this._vline(origin.x, origin.y, xEnd.x, xEnd.y, pal.primary, 0.65, 1.4);
      this._vline(origin.x, origin.y, yEnd.x, yEnd.y, pal.accent, 0.65, 1.4);
      this._vline(origin.x, origin.y, zEnd.x, zEnd.y, pal.warn, 0.65, 1.4);
    }

    this.drawText(xEnd.x + 1, xEnd.y, '+X', pal.primary, true);
    this.drawText(yEnd.x, yEnd.y - 1, '+Y', pal.accent, true, 'center');
    this.drawText(zEnd.x + 1, zEnd.y, '+Z', pal.warn, true);
  }

  drawWireframe3D(vertices, edges, cx, cy, opts = {}) {
    const rx = opts.rotX || 0;
    const ry = opts.rotY || 0;
    const rz = opts.rotZ || 0;
    const scale = opts.scale || 10;
    const color = opts.color || this.palette.primary;
    const accent = opts.accent || this.palette.accent;
    const dim = opts.dim || this.palette.dim;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;

    if (this.holoHud) {
      this.addGlow(cx, cy, scale * 1.4, color, alpha);
    }

    const proj = vertices.map(v => this.project3D(v[0], v[1], v[2], cx, cy, rx, ry, rz, scale));

    const sortedEdges = edges.map(e => {
      const a = proj[e[0]];
      const b = proj[e[1]];
      return { a, b, z: (a.z + b.z) * 0.5 };
    }).sort((u, v) => u.z - v.z);

    const vFront = [];
    const vBack = [];
    for (let eIdx = 0; eIdx < sortedEdges.length; eIdx++) {
      const edge = sortedEdges[eIdx];
      const isFront = edge.z > 0.02;
      (isFront ? vFront : vBack).push(edge.a.x, edge.a.y, edge.b.x, edge.b.y);
      let edgeChar = opts.backChar || '·';
      if (isFront) {
        if (opts.frontChar) {
          edgeChar = opts.frontChar;
        } else {
          const dx = edge.b.x - edge.a.x;
          const dy = (edge.b.y - edge.a.y) * 1.85;
          const adx = Math.abs(dx);
          const ady = Math.abs(dy);
          if (adx > ady * 2.1) edgeChar = '─';
          else if (ady > adx * 2.1) edgeChar = '│';
          else edgeChar = (dx * dy >= 0) ? '\\' : '/';
        }
      }
      const edgeCol = isFront ? color : dim;
      if (opts.ascii !== false) this.drawLine(edge.a.x, edge.a.y, edge.b.x, edge.b.y, edgeChar, edgeCol, false, alpha * (isFront ? 1 : 0.8));

      if (isFront && (opts.packets !== false) && (eIdx % 2 === 0)) {
        const t = ((this.time * (opts.packetSpeed || 0.55)) + eIdx * 0.17) % 1;
        const px = edge.a.x + (edge.b.x - edge.a.x) * t;
        const py = edge.a.y + (edge.b.y - edge.a.y) * t;
        this.setCell(px, py, '•', accent, true, null, alpha);
        if (this.holoHud) this._vdot(px, py, 1.6, accent, 0.7 * alpha);
      }
    }

    if (this.holoHud && opts.vector !== false) {
      if (vBack.length) this.vItems.push({ t: 'segs', p: vBack, c: dim, a: 0.2 * alpha, w: 1, h: this._hudMode });
      if (vFront.length) this.vItems.push({ t: 'segs', p: vFront, c: color, a: 0.55 * alpha, w: 1.35, h: this._hudMode });
    }

    // opts.vertices === false: clean vector-only look for dense models (buildings, OBJ)
    if (opts.vertices !== false) for (const p of proj) {
      const isFront = p.z >= 0;
      const vChar = isFront ? (opts.vertexChar || '◈') : '·';
      this.setCell(p.x, p.y, vChar, isFront ? accent : dim, isFront, null, (isFront ? 1.0 : 0.5) * alpha);
      if (this.holoHud && isFront) this._vdot(p.x, p.y, 2.2, accent, 0.55 * alpha);
    }

    return proj;
  }

  drawShape3D(name, cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    const shape = SHAPES[name] || SHAPES.cube;
    return this.drawWireframe3D(shape.v, shape.e, cx, cy, { scale, rotX, rotY, rotZ, ...opts });
  }

  // Draws a named polyhedron; when `name` changes for this key the new shape
  // unfolds out of the old one's vertices with an overshoot (true morph).
  drawMorph3D(key, name, cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    const shape = SHAPES[name] || SHAPES.cube;
    let st = this.morphs.get(key);
    if (!st) {
      st = { name, from: null, map: null, t0: -99, cur: shape.v };
      this.morphs.set(key, st);
    }
    if (st.name !== name) {
      const from = st.cur.map(v => v.slice());
      st.map = shape.v.map(v => {
        let best = 0;
        let bestD = Infinity;
        for (let i = 0; i < from.length; i++) {
          const d = (from[i][0] - v[0]) ** 2 + (from[i][1] - v[1]) ** 2 + (from[i][2] - v[2]) ** 2;
          if (d < bestD) { bestD = d; best = i; }
        }
        return best;
      });
      st.from = from;
      st.name = name;
      st.t0 = this.time;
      if (opts.fx === true) {
        const col = opts.color || this.palette.accent;
        this.spawnShockwave(cx, cy, { color: col, radius: scale * 2.6, duration: 0.9 });
        this.spawnBurst(cx, cy, { count: 14, color: col, speed: 10 });
        this.camPunch.v += 0.25;
      }
    }
    const dur = opts.morphDuration || 0.95;
    let verts = shape.v;
    if (st.from) {
      const k = (this.time - st.t0) / dur;
      if (k < 1) {
        const e = EASE.outBack(k);
        verts = shape.v.map((v, i) => {
          const f = st.from[st.map[i]];
          return [f[0] + (v[0] - f[0]) * e, f[1] + (v[1] - f[1]) * e, f[2] + (v[2] - f[2]) * e];
        });
      } else {
        st.from = null;
      }
    }
    st.cur = verts;
    return this.drawWireframe3D(verts, shape.e, cx, cy, { scale, rotX, rotY, rotZ, ...opts });
  }

  drawOctahedron3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    return this.drawShape3D('octa', cx, cy, scale, rotX, rotY, rotZ, opts);
  }

  drawCube3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    return this.drawShape3D('cube', cx, cy, scale, rotX, rotY, rotZ, opts);
  }

  drawPyramid3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    return this.drawShape3D('pyramid', cx, cy, scale, rotX, rotY, rotZ, opts);
  }

  drawIcosahedron3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    return this.drawShape3D('icosa', cx, cy, scale, rotX, rotY, rotZ, opts);
  }

  drawCylinder3D(cx, cy, radius, height, rotX, rotY, rotZ, opts = {}) {
    const segs = opts.segments || 8;
    const verts = [];
    const edges = [];
    const hh = height * 0.5;
    for (let i = 0; i < segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      verts.push([Math.cos(a), -hh, Math.sin(a)]);
      verts.push([Math.cos(a),  hh, Math.sin(a)]);
      const topIdx = i * 2;
      const botIdx = i * 2 + 1;
      const nextTop = ((i + 1) % segs) * 2;
      const nextBot = ((i + 1) % segs) * 2 + 1;
      edges.push([topIdx, nextTop], [botIdx, nextBot], [topIdx, botIdx]);
    }
    return this.drawWireframe3D(verts, edges, cx, cy, { scale: radius, rotX, rotY, rotZ, ...opts });
  }

  drawTorus3D(cx, cy, R = 1.1, r = 0.42, rotX = 0.5, rotY = 0.5, rotZ = 0, opts = {}) {
    const scale = opts.scale || 8.5;
    const uSteps = opts.uSteps || 18;
    const vSteps = opts.vSteps || 9;
    const colFront = opts.color || this.palette.primary;
    const colAccent = opts.accent || this.palette.accent;
    const colBack = opts.dim || this.palette.dim;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;

    if (this.holoHud) {
      this.addGlow(cx, cy, scale * 2.0, colFront, alpha);
      // Smooth vector equators (outer & inner rim) under the dot lattice
      for (const rim of [R + r, R - r]) {
        const pts = [];
        for (let i = 0; i < 64; i++) {
          const th = (i / 64) * Math.PI * 2;
          pts.push(this.project3D(rim * Math.cos(th), 0, rim * Math.sin(th), cx, cy, rotX, rotY, rotZ, scale));
        }
        this._vDepthSegs(pts, true, colFront, colBack, alpha);
      }
    }

    for (let u = 0; u < uSteps; u++) {
      const theta = (u / uSteps) * Math.PI * 2;
      for (let v = 0; v < vSteps; v++) {
        const phi = (v / vSteps) * Math.PI * 2;
        const x = (R + r * Math.cos(phi)) * Math.cos(theta);
        const y = r * Math.sin(phi);
        const z = (R + r * Math.cos(phi)) * Math.sin(theta);
        const p = this.project3D(x, y, z, cx, cy, rotX, rotY, rotZ, scale);
        const front = p.z >= 0;
        const ch = front ? (v === 0 ? '◈' : '•') : '·';
        this.setCell(p.x, p.y, ch, front ? (v === 0 ? colAccent : colFront) : colBack, front && v === 0, null, (front ? 0.95 : 0.45) * alpha);
      }
    }
  }

  drawHelix3D(cx, cy, radius = 6, height = 18, turns = 2.5, spin = 0, opts = {}) {
    const steps = opts.steps || 32;
    const colA = opts.color || this.palette.primary;
    const colB = opts.accent || this.palette.accent;
    const dim = opts.dim || this.palette.dim;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    const strandA = [];
    const strandB = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = (t - 0.5) * 2.2;
      const ang = t * Math.PI * 2 * turns + spin * 0.7;
      const p1 = this.project3D(Math.cos(ang), y, Math.sin(ang), cx, cy, 0.25, 0, 0, radius);
      const p2 = this.project3D(Math.cos(ang + Math.PI), y, Math.sin(ang + Math.PI), cx, cy, 0.25, 0, 0, radius);
      strandA.push(p1);
      strandB.push(p2);

      if (i % 3 === 0) {
        this.drawLine(p1.x, p1.y, p2.x, p2.y, '┄', dim, false, alpha);
        if (this.holoHud) this._vline(p1.x, p1.y, p2.x, p2.y, colB, 0.12 * alpha, 1);
      }
      this.setCell(p1.x, p1.y, p1.z >= 0 ? '◈' : '·', p1.z >= 0 ? colA : dim, p1.z >= 0, null, alpha);
      this.setCell(p2.x, p2.y, p2.z >= 0 ? '❖' : '·', p2.z >= 0 ? colB : dim, p2.z >= 0, null, alpha);
    }
    if (this.holoHud) {
      this._vDepthSegs(strandA, false, colA, dim, alpha, 1.5);
      this._vDepthSegs(strandB, false, colB, dim, alpha, 1.5);
    }
  }

  drawRing3D(cx, cy, radius, tiltX, tiltZ, opts = {}) {
    const steps = opts.steps || 36;
    const charFront = opts.charFront || '•';
    const charBack = opts.charBack || '·';
    const colFront = opts.color || this.palette.primary;
    const colBack = opts.dim || this.palette.dim;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    const spinOff = (opts.spin || 0) * 0.65;

    if (this.holoHud) {
      const pts = [];
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2 + spinOff;
        pts.push(this.project3D(Math.cos(a), 0, Math.sin(a), cx, cy, tiltX, 0, tiltZ, radius));
      }
      this._vDepthSegs(pts, true, colFront, colBack, alpha * (opts.glow ? 1.15 : 0.85));
    }

    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2 + spinOff;
      const p = this.project3D(Math.cos(a), 0, Math.sin(a), cx, cy, tiltX, 0, tiltZ, radius);
      const front = p.z >= 0;
      const isTick = (i % 9 === 0);
      const glyph = front ? (isTick ? '◈' : charFront) : charBack;
      const col = front ? (isTick ? this.palette.accent : colFront) : colBack;
      this.setCell(p.x, p.y, glyph, col, front && opts.glow, null, (front ? 1.0 : 0.48) * alpha);
    }
  }

  drawSprite(cx, cy, lines, color = null, glow = false, bg = null) {
    if (!Array.isArray(lines) || lines.length === 0) return;
    const startY = Math.round(cy - Math.floor(lines.length / 2));
    let maxW = 0;
    for (let r = 0; r < lines.length; r++) {
      const line = String(lines[r]);
      if (line.length > maxW) maxW = line.length;
      const startX = Math.round(cx - Math.floor(line.length / 2));
      for (let c = 0; c < line.length; c++) {
        if (line[c] !== ' ') {
          this.setCell(startX + c, startY + r, line[c], color || this.palette.primary, glow, bg);
        } else if (bg) {
          this.setCell(startX + c, startY + r, ' ', color, false, bg);
        }
      }
    }

    if (this.holoHud && glow) {
      this.addGlow(cx, cy, Math.max(maxW * 0.42, lines.length), color || this.palette.primary);
    }
  }

  // --- Built-in FX Primitives ---
  spawnBurst(x, y, opts = {}) {
    const count = opts.count || 12;
    const chars = opts.chars || ['*', '+', '·', '°', '◈', '•'];
    const color = opts.color || this.palette.accent;
    const speed = (opts.speed || 9) * 0.72;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const spd = speed * (0.4 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * spd * 1.6,
        vy: Math.sin(angle) * spd,
        life: 0.55 + Math.random() * 0.45,
        char: chars[Math.floor(Math.random() * chars.length)],
        color
      });
    }
  }

  spawnShockwave(x, y, opts = {}) {
    this.shockwaves.push({
      x, y,
      t: -(opts.delay || 0),
      dur: opts.duration || 0.9,
      color: opts.color || this.palette.accent,
      r: opts.radius || 12,
      ascii: opts.ascii !== false
    });
  }

  spawnRipple(x, y, opts = {}) {
    if (typeof x !== 'number' || typeof y !== 'number') return;
    this.spawnShockwave(x, y, opts);
  }

  flash(color = null, amount = 0.35) {
    this.flashColor = color || this.palette.accent;
    this.flashAmt = Math.max(this.flashAmt, amount);
  }

  shake(amount = 0.5) {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
  }

  punch(amount = 0.3) {
    this.camPunch.v += amount;
  }

  _updateShockwaves(dt) {
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.t += dt;
      if (s.t < 0) continue;
      const k = s.t / s.dur;
      if (k >= 1) {
        this.shockwaves.splice(i, 1);
        continue;
      }
      const r = s.r * EASE.outCubic(k);
      const a = 1 - k;
      this.vItems.push({ t: 'ellipse', x: s.x, y: s.y, rx: r * 1.85, ry: r, c: s.color, a: a * 0.75, w: 0.6 + 2.6 * a, h: false });
      if (s.ascii && k < 0.75 && r > 0.8) {
        const steps = Math.max(16, Math.floor(r * 6));
        for (let j = 0; j < steps; j++) {
          const ang = (j / steps) * Math.PI * 2;
          this.setCell(s.x + Math.cos(ang) * r * 1.85, s.y + Math.sin(ang) * r, '·', s.color, true, null, a * 0.8);
        }
      }
    }
  }

  _updateAndDrawFX(dt) {
    const damp = Math.pow(0.96, dt * 60);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= damp;
      p.vy *= damp;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        this.setCell(p.x, p.y, p.char, p.color, p.life > 0.35, null, Math.min(1, p.life * 1.8));
        if (this.holoHud) this._vcomet(p.x - p.vx * 0.05, p.y - p.vy * 0.05, p.x, p.y, p.color, Math.min(0.8, p.life * 1.4), 1.4);
      }
    }
  }

  _drawTimeline() {
    const pal = this.palette;
    const n = this.phaseCount;
    const total = this.timelineDuration();
    const ratio = clamp01(this.timelineElapsed() / Math.max(0.001, total));
    const barW = Math.min(64, Math.floor(this.cols * 0.5));
    const barX = (this.cols - barW) / 2;
    const y = this.rows - 1;
    this._hudMode = true;
    this._vline(barX, y, barX + barW, y, pal.dim, 0.55, 1);
    this._vline(barX, y, barX + barW * ratio, y, pal.primary, 0.95, 1.8);
    let acc = 0;
    for (let p = 1; p < n; p++) {
      acc += this.stageHold(p);
      const tx = barX + barW * (acc / total);
      this._vline(tx, y - 0.22, tx, y + 0.22, p < this.phase ? pal.primary : pal.dim, 0.8, 1);
    }
    this._vdot(barX + barW * ratio, y, 2.6, pal.accent, 1);
    this._hudMode = false;
  }

  _createSandboxContext(dt) {
    if (!this._sandbox) this._sandbox = this._buildSandbox();
    const sb = this._sandbox;
    const pal = {
      ...this.palette,
      warning: this.palette.warn,
      error: this.palette.danger,
      cyan: this.palette.primary,
      blue: this.palette.primary,
      white: '#ffffff',
      green: '#00ff88',
      red: this.palette.danger,
      yellow: this.palette.warn
    };
    return {
      width: this.cols,
      height: this.rows,
      cols: this.cols,
      rows: this.rows,
      time: this.time,
      tick: this.tick,
      dt,
      phase: this.phase,
      phaseCount: this.phaseCount,
      smoothPhase: this.smoothPhase,
      stageBlend: this.stageBlend,
      phaseTime: this.phaseTime,
      stageDuration: this.stageHold(this.phase),
      state: this.simState,
      palette: pal,
      grid: sb.grid,
      fx: sb.fx,
      math: sb.math,
      anim: sb.anim,
      ease: EASE,
      camera: sb.camera
    };
  }

  _buildSandbox() {
    const self = this;
    const grid = {
      width: this.cols,
      height: this.rows,
      cols: this.cols,
      rows: this.rows,
      clear: () => self.clearGrid(),
      clearGrid: () => self.clearGrid(),
      cls: () => self.clearGrid(),
      fade: (decay = 0.16) => self.fadeGrid(decay),
      fadeGrid: (decay = 0.16) => self.fadeGrid(decay),
      set: (x, y, ch, col, glow, bg, alpha) => self.setCell(x, y, ch, col, glow, bg, alpha),
      setCell: (x, y, ch, col, glow, bg, alpha) => self.setCell(x, y, ch, col, glow, bg, alpha),
      put: (x, y, ch, col, glow, bg, alpha) => self.setCell(x, y, ch, col, glow, bg, alpha),
      plot: (x, y, ch, col, glow, bg, alpha) => self.setCell(x, y, ch, col, glow, bg, alpha),
      get: (x, y) => self.getCell(x, y),
      getCell: (x, y) => self.getCell(x, y),
      text: (x, y, str, col, glow, align, bg, alpha) => self.drawText(x, y, str, col, glow, align, bg, alpha),
      drawText: (x, y, str, col, glow, align, bg, alpha) => self.drawText(x, y, str, col, glow, align, bg, alpha),
      print: (x, y, str, col, glow, align, bg, alpha) => self.drawText(x, y, str, col, glow, align, bg, alpha),
      write: (x, y, str, col, glow, align, bg, alpha) => self.drawText(x, y, str, col, glow, align, bg, alpha),
      title: (str, opts) => self.drawTitle(str, opts),
      caption: (str, opts) => self.drawCaption(str, opts),
      counter: (key, x, y, value, opts) => self.drawCounter(key, x, y, value, opts),
      sprite: (cx, cy, lines, col, glow, bg) => self.drawSprite(cx, cy, lines, col, glow, bg),
      drawSprite: (cx, cy, lines, col, glow, bg) => self.drawSprite(cx, cy, lines, col, glow, bg),
      ascii: (cx, cy, lines, col, glow, bg) => self.drawSprite(cx, cy, lines, col, glow, bg),
      box: (x, y, w, h, opts) => self.drawBox(x, y, w, h, opts),
      drawBox: (x, y, w, h, opts) => self.drawBox(x, y, w, h, opts),
      rect: (x, y, w, h, opts) => self.drawBox(x, y, w, h, opts),
      line: (x0, y0, x1, y1, ch, col, glow, alpha) => self.drawLine(x0, y0, x1, y1, ch, col, glow, alpha),
      drawLine: (x0, y0, x1, y1, ch, col, glow, alpha) => self.drawLine(x0, y0, x1, y1, ch, col, glow, alpha),
      dataLine: (x0, y0, x1, y1, opts) => self.drawDataLine(x0, y0, x1, y1, opts),
      drawDataLine: (x0, y0, x1, y1, opts) => self.drawDataLine(x0, y0, x1, y1, opts),
      packetLine: (x0, y0, x1, y1, opts) => self.drawDataLine(x0, y0, x1, y1, opts),
      circle: (cx, cy, r, ch, col, glow, alpha) => self.drawCircle(cx, cy, r, ch, col, glow, alpha),
      drawCircle: (cx, cy, r, ch, col, glow, alpha) => self.drawCircle(cx, cy, r, ch, col, glow, alpha),
      reticle: (cx, cy, r, opts) => self.drawReticle(cx, cy, r, opts),
      drawReticle: (cx, cy, r, opts) => self.drawReticle(cx, cy, r, opts),
      waveform: (x, y, w, h, opts) => self.drawWaveform(x, y, w, h, opts),
      drawWaveform: (x, y, w, h, opts) => self.drawWaveform(x, y, w, h, opts),
      progressBar: (x, y, w, ratio, opts) => self.drawProgressBar(x, y, w, ratio, opts),
      drawProgressBar: (x, y, w, ratio, opts) => self.drawProgressBar(x, y, w, ratio, opts),
      bar: (x, y, w, ratio, opts) => self.drawProgressBar(x, y, w, ratio, opts),
      // Sub-pixel vector overlay (cell coordinates)
      vline: (x0, y0, x1, y1, opts = {}) => self._vline(x0, y0, x1, y1, opts.color || self.palette.primary, opts.alpha !== undefined ? opts.alpha : 0.6, opts.width || 1.4, opts.dash || null),
      vpath: (points, opts) => self._vpath(points, opts || {}),
      vcircle: (cx, cy, r, opts = {}) => self.vItems.push({ t: 'ellipse', x: cx, y: cy, rx: opts.rx !== undefined ? opts.rx : r * 1.85, ry: r, c: opts.color || self.palette.primary, a: opts.alpha !== undefined ? opts.alpha : 0.5, w: opts.width || 1.2, fill: Boolean(opts.fill), h: self._hudMode }),
      big: (x, y, str, opts) => self.drawBigText(x, y, str, opts || {}),
      vdot: (x, y, r, opts = {}) => self._vdot(x, y, r, opts.color || self.palette.accent, opts.alpha !== undefined ? opts.alpha : 0.85),
      glow: (cx, cy, radius, col, intensity) => self.addGlow(cx, cy, radius, col, intensity),
      icon: (name, cx, cy, col, opts) => self.drawIcon(name, cx, cy, col, opts || {}),
      codeCard: (cx, cy, opts) => self.drawCodeCard(cx, cy, opts || {}),
      project3D: (x, y, z, cx, cy, rx, ry, rz, scale) => self.project3D(x, y, z, cx, cy, rx, ry, rz, scale),
      axes3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawAxes3D(cx, cy, scale, rx, ry, rz, opts),
      drawAxes3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawAxes3D(cx, cy, scale, rx, ry, rz, opts),
      wireframe3D: (v, e, cx, cy, opts) => self.drawWireframe3D(v, e, cx, cy, opts),
      shape3D: (name, cx, cy, scale, rx, ry, rz, opts) => self.drawShape3D(name, cx, cy, scale, rx, ry, rz, opts),
      morph3D: (key, name, cx, cy, scale, rx, ry, rz, opts) => self.drawMorph3D(key, name, cx, cy, scale, rx, ry, rz, opts),
      tetrahedron3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawShape3D('tetra', cx, cy, scale, rx, ry, rz, opts),
      dodecahedron3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawShape3D('dodeca', cx, cy, scale, rx, ry, rz, opts),
      octahedron3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawOctahedron3D(cx, cy, scale, rx, ry, rz, opts),
      drawOctahedron3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawOctahedron3D(cx, cy, scale, rx, ry, rz, opts),
      cube3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawCube3D(cx, cy, scale, rx, ry, rz, opts),
      drawCube3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawCube3D(cx, cy, scale, rx, ry, rz, opts),
      pyramid3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawPyramid3D(cx, cy, scale, rx, ry, rz, opts),
      drawPyramid3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawPyramid3D(cx, cy, scale, rx, ry, rz, opts),
      cylinder3D: (cx, cy, r, h, rx, ry, rz, opts) => self.drawCylinder3D(cx, cy, r, h, rx, ry, rz, opts),
      drawCylinder3D: (cx, cy, r, h, rx, ry, rz, opts) => self.drawCylinder3D(cx, cy, r, h, rx, ry, rz, opts),
      torus3D: (cx, cy, R, r, rx, ry, rz, opts) => self.drawTorus3D(cx, cy, R, r, rx, ry, rz, opts),
      drawTorus3D: (cx, cy, R, r, rx, ry, rz, opts) => self.drawTorus3D(cx, cy, R, r, rx, ry, rz, opts),
      helix3D: (cx, cy, r, h, turns, spin, opts) => self.drawHelix3D(cx, cy, r, h, turns, spin, opts),
      drawHelix3D: (cx, cy, r, h, turns, spin, opts) => self.drawHelix3D(cx, cy, r, h, turns, spin, opts),
      icosahedron3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawIcosahedron3D(cx, cy, scale, rx, ry, rz, opts),
      drawIcosahedron3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawIcosahedron3D(cx, cy, scale, rx, ry, rz, opts),
      ring3D: (cx, cy, r, tx, tz, opts) => self.drawRing3D(cx, cy, r, tx, tz, opts),
      drawRing3D: (cx, cy, r, tx, tz, opts) => self.drawRing3D(cx, cy, r, tx, tz, opts),
      robotCube: (cx, cy, opts) => self.drawRobotCube(cx, cy, opts),
      drawRobotCube: (cx, cy, opts) => self.drawRobotCube(cx, cy, opts),
      shadedCube3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawShadedCube3D(cx, cy, scale, rx, ry, rz, opts),
      drawShadedCube3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawShadedCube3D(cx, cy, scale, rx, ry, rz, opts),
      shadedSphere3D: (cx, cy, r, lightAng, opts) => self.drawShadedSphere3D(cx, cy, r, lightAng, opts),
      drawShadedSphere3D: (cx, cy, r, lightAng, opts) => self.drawShadedSphere3D(cx, cy, r, lightAng, opts),
      wordStream: (x0, y0, x1, y1, words, opts) => self.drawWordStream(x0, y0, x1, y1, words, opts),
      drawWordStream: (x0, y0, x1, y1, words, opts) => self.drawWordStream(x0, y0, x1, y1, words, opts),
      wordRing3D: (cx, cy, r, tx, spin, words, opts) => self.drawWordRing3D(cx, cy, r, tx, spin, words, opts),
      drawWordRing3D: (cx, cy, r, tx, spin, words, opts) => self.drawWordRing3D(cx, cy, r, tx, spin, words, opts),
      waveField: (cx, cy, w, h, opts) => self.drawWaveField(cx, cy, w, h, opts),
      drawWaveField: (cx, cy, w, h, opts) => self.drawWaveField(cx, cy, w, h, opts),
      matrixRain: (x, y, w, h, opts) => self.drawMatrixRain(x, y, w, h, opts),
      drawMatrixRain: (x, y, w, h, opts) => self.drawMatrixRain(x, y, w, h, opts),
      sphere3D: (cx, cy, r, rx, ry, rz, opts) => {
        self.drawRing3D(cx, cy, r, rx, rz, opts);
        self.drawRing3D(cx, cy, r, rx + 1.57, rz + 0.78, opts);
        return self.drawIcosahedron3D(cx, cy, r * 0.85, rx, ry, rz, opts);
      }
    };
    const fx = {
      burst: (x, y, opts) => self.spawnBurst(x, y, opts),
      spawnBurst: (x, y, opts) => self.spawnBurst(x, y, opts),
      explode: (x, y, opts) => self.spawnBurst(x, y, opts),
      particles: (x, y, opts) => self.spawnBurst(x, y, opts),
      shockwave: (x, y, opts) => self.spawnShockwave(x, y, opts),
      ripple: (x, y, opts) => self.spawnRipple(x, y, opts),
      spawnRipple: (x, y, opts) => self.spawnRipple(x, y, opts),
      flash: (col, amount) => self.flash(col, amount),
      shake: (amount) => self.shake(amount),
      punch: (amount) => self.punch(amount)
    };
    const math = {
      lerp: (a, b, t) => a + (b - a) * Math.min(1, t),
      smoothstep: (a, b, t) => {
        const c = Math.max(0, Math.min(1, t));
        return a + (b - a) * (c * c * (3 - 2 * c));
      },
      clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
      dist: (x1, y1, x2, y2) => Math.hypot((x2 - x1) / 1.75, y2 - y1),
      distance: (x1, y1, x2, y2) => Math.hypot((x2 - x1) / 1.75, y2 - y1),
      rand: (min = 0, max = 1) => min + Math.random() * (max - min),
      random: (min = 0, max = 1) => min + Math.random() * (max - min),
      randInt: (min = 0, max = 10) => Math.floor(min + Math.random() * (max - min + 1)),
      randomInt: (min = 0, max = 10) => Math.floor(min + Math.random() * (max - min + 1)),
      pick: (arr) => (Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : '*'),
      choice: (arr) => (Array.isArray(arr) && arr.length ? arr[Math.floor(Math.random() * arr.length)] : '*'),
      mix: (a, b, t) => mixColor(a, b, t),
      sin: Math.sin,
      cos: Math.cos,
      atan2: Math.atan2,
      abs: Math.abs,
      hypot: Math.hypot,
      PI: Math.PI
    };
    const anim = {
      spring: (key, target, opts) => self.animSpring(key, target, opts),
      tween: (key, target, dur, ease, opts) => self.animTween(key, target, dur, ease, opts),
      color: (key, target, speed) => self.animColor(key, target, speed),
      spin: (key, rate, smoothing) => self.animSpin(key, rate, smoothing),
      enter: (delay = 0, dur = 0.6, ease = 'outCubic') => easeFn(ease)((self.phaseTime - delay) / Math.max(0.001, dur)),
      intro: (delay = 0, dur = 0.8, ease = 'outCubic') => easeFn(ease)((self.time - delay) / Math.max(0.001, dur)),
      stagger: (i, step = 0.08, dur = 0.5, ease = 'outCubic', delay = 0) => easeFn(ease)((self.phaseTime - delay - i * step) / Math.max(0.001, dur)),
      pulse: (freq = 1) => 0.5 + 0.5 * Math.sin(self.time * Math.PI * 2 * freq),
      since: () => self.phaseTime
    };
    const camera = {
      zoom: (z) => { self.camZoomReq = z; },
      focus: (x, y, strength = 0.35) => { self.camFocus = { x, y, s: strength }; },
      punch: (amount) => self.punch(amount),
      shake: (amount) => self.shake(amount)
    };
    return { grid, fx, math, anim, camera };
  }

  _updateCamera(dt) {
    const n = this.phaseCount;
    let zt = 1;
    if (this.cameraMotion) zt = 1 + ((this.smoothPhase - 1) / Math.max(1, n - 1)) * 0.05;
    if (this.camZoomReq != null) zt = this.camZoomReq;
    this.camZoom.target = zt;
    this.camZoom.step(dt, 2.4, 1);
    this.camPunch.target = 0;
    this.camPunch.step(dt, 13, 0.42);

    let px = 0;
    let py = 0;
    if (this.camFocus) {
      px = (this.cols / 2 - this.camFocus.x) * this.cellW * this.camFocus.s;
      py = (this.rows / 2 - this.camFocus.y) * this.cellH * this.camFocus.s;
    }
    this.camPanX.target = px;
    this.camPanY.target = py;
    this.camPanX.step(dt, 2.2, 1);
    this.camPanY.step(dt, 2.2, 1);

    const t = this.time;
    const drift = this.cameraMotion ? 1 : 0;
    const amp = this.shakeAmt * 7;
    this.cam = {
      zoom: this.camZoom.x + (this.cameraMotion || this.transitionFx ? this.camPunch.x * 0.12 : 0),
      x: this.camPanX.x + drift * (Math.sin(t * 0.21) * 1.8 + Math.sin(t * 0.53) * 0.6) + amp * (Math.sin(t * 71.3) + Math.sin(t * 43.1) * 0.6),
      y: this.camPanY.x + drift * (Math.cos(t * 0.17) * 1.2) + amp * (Math.cos(t * 61.7) + Math.sin(t * 37.9) * 0.6),
      rot: this.shakeAmt * 0.006 * Math.sin(t * 53)
    };
  }

  // --- Main Frame Update & Render ---
  update(dt) {
    if (!this.running) return;
    this.time += dt;
    this.tick++;
    this._dt = dt;
    this._colorK = 1 - Math.exp(-dt * 14);

    // Smoothly interpolate 3D camera parallax & drag orbit
    const breathX = Math.sin(this.time * 0.45) * 0.05;
    const breathY = Math.cos(this.time * 0.35) * 0.035;
    const mx = this.mouseParallax ? this.targetParallaxX : 0;
    const my = this.mouseParallax ? this.targetParallaxY : 0;
    this.parallaxX += ((mx + breathX) - this.parallaxX) * Math.min(1, dt * 4.5);
    this.parallaxY += ((my + breathY) - this.parallaxY) * Math.min(1, dt * 4.5);
    this.orbitYaw += (this.targetOrbitYaw - this.orbitYaw) * Math.min(1, dt * 6.0);
    this.orbitPitch += (this.targetOrbitPitch - this.orbitPitch) * Math.min(1, dt * 6.0);

    this.vItems.length = 0;
    this.glowNodes.length = 0;
    this.camFocus = null;
    this.camZoomReq = null;
    this.introT += dt;
    this.sweepT += dt;
    this.flashAmt *= Math.exp(-dt * 7);
    this.shakeAmt *= Math.exp(-dt * 4.5);

    if (this.typer.active) {
      this._updateAutoTyper(dt);
      this._updateCamera(dt);
      return;
    }

    this.phaseTime += dt;

    // Continuous auto-advancing video timeline across all stages
    const maxPhases = this.phaseCount;
    const holdDur = this.stageHold(this.phase);
    if (this.autoPlayStages && this.phaseTime >= holdDur) {
      const nextP = this.phase >= maxPhases ? 1 : this.phase + 1;
      if (nextP === 1) {
        this.smoothPhase = 1.0;
        this.loopsCompleted++;
        if (typeof this.onLoopComplete === 'function') this.onLoopComplete(this.loopsCompleted);
      }
      this.setPhase(nextP);
      if (typeof this.onPhaseAutoChange === 'function') {
        this.onPhaseAutoChange(nextP);
      }
    }

    // Smooth continuous progression of smoothPhase across the stage duration
    const stageProgress = EASE.inOutCubic(Math.min(1, this.phaseTime / this.stageHold(this.phase)));
    const targetSmooth = this.autoPlayStages
      ? Math.min(maxPhases, this.phase + stageProgress * 0.96)
      : this.phase;
    this.smoothPhase += (targetSmooth - this.smoothPhase) * Math.min(1, dt * 4.5);

    if (this.currentSimulation && typeof this.currentSimulation.update === 'function') {
      try {
        const sandboxCtx = this._createSandboxContext(dt);
        this.currentSimulation.update(sandboxCtx);
      } catch (err) {
        this.lastError = err.message;
        console.error('Simulation frame error:', err);
      }
    }
    this._hudMode = false;

    this._updateShockwaves(dt);
    this._updateAndDrawFX(dt);
    if (this.showTimeline) this._drawTimeline();
    this._updateCamera(dt);
    if (this.tick % 120 === 0) this._gcTextMemo();
  }

  _updateAutoTyper(dt) {
    this.clearGrid();
    const pal = this.palette;
    const cy = Math.floor(this.rows / 2);

    this.typer.charTimer += dt * 1000;
    const delay = this.typer.speedMs * (0.65 + Math.random() * 0.5);
    if (this.typer.charTimer >= delay) {
      this.typer.charTimer = 0;
      this.typer.typedLen++;
      this.playKeystrokeSound();
      if (this.typer.typedLen >= this.typer.prompt.length) {
        this.typer.active = false;
        this.clearGrid();
        this.time = 0;
        this.tick = 0;
        this.phase = 1;
        this.smoothPhase = 1.0;
        this.phaseTime = 0;
        this.textMemo.clear();
        this.textPos.clear();
        this.introT = this.introFx ? 0 : INTRO_DUR;
        this._initSimState();
        if (typeof this.typer.onFinish === 'function') {
          this.typer.onFinish();
        }
        return;
      }
    }

    const prefix = '> ';
    const visiblePrompt = this.typer.prompt.slice(0, this.typer.typedLen);
    const maxLineW = Math.min(76, this.cols - 12);
    const startX = Math.max(6, Math.floor((this.cols - Math.min(maxLineW, this.typer.prompt.length + 4)) / 2));

    this._noReveal = true;
    this.drawText(startX, cy - 1, prefix, pal.accent, true);

    const words = visiblePrompt.split(' ');
    let lineY = cy - 1;
    let lineX = startX + prefix.length;
    for (const w of words) {
      if (lineX + w.length > startX + maxLineW) {
        lineY++;
        lineX = startX + prefix.length;
      }
      this.drawText(lineX, lineY, w + ' ', pal.primary, true);
      lineX += w.length + 1;
    }
    this._noReveal = false;

    this.setCell(lineX - 1, lineY, '█', pal.accent, true);
  }

  // --- Rendering ---
  _applyCam(c, scale, depth = 1) {
    const W = this.logicalW;
    const H = this.logicalH;
    const cam = this.cam;
    const z = 1 + (cam.zoom - 1) * depth;
    c.setTransform(scale, 0, 0, scale, 0, 0);
    c.translate(W / 2 + cam.x * depth, H / 2 + cam.y * depth);
    if (cam.rot) c.rotate(cam.rot * depth);
    c.scale(z, z);
    c.translate(-W / 2, -H / 2);
  }

  _drawVectors(c, widthScale, hudPass) {
    const ox = this._ox;
    const oy = this._oy;
    const cw = this.cellW;
    const chh = this.cellH;
    const X = (x) => ox + (x + 0.5) * cw;
    const Y = (y) => oy + (y + 0.5) * chh;
    c.globalCompositeOperation = 'lighter';
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const it of this.vItems) {
      if (Boolean(it.h) !== hudPass) continue;
      const w = it.w * widthScale;
      switch (it.t) {
        case 'segs': {
          c.globalAlpha = it.a;
          c.strokeStyle = it.c;
          c.lineWidth = w;
          c.beginPath();
          const p = it.p;
          for (let i = 0; i < p.length; i += 4) {
            c.moveTo(X(p[i]), Y(p[i + 1]));
            c.lineTo(X(p[i + 2]), Y(p[i + 3]));
          }
          c.stroke();
          break;
        }
        case 'path': {
          c.globalAlpha = it.a;
          c.strokeStyle = it.c;
          c.lineWidth = w;
          if (it.dash) c.setLineDash(it.dash.map(d => d * widthScale));
          c.beginPath();
          const p = it.p;
          c.moveTo(X(p[0]), Y(p[1]));
          for (let i = 2; i < p.length; i += 2) c.lineTo(X(p[i]), Y(p[i + 1]));
          if (it.closed) c.closePath();
          c.stroke();
          if (it.dash) c.setLineDash([]);
          break;
        }
        case 'taper': {
          c.strokeStyle = it.c;
          c.lineWidth = w;
          const p = it.p;
          const n = p.length / 2 - 1;
          for (let i = 0; i < n; i++) {
            c.globalAlpha = it.a * ((i + 1) / n);
            c.beginPath();
            c.moveTo(X(p[i * 2]), Y(p[i * 2 + 1]));
            c.lineTo(X(p[i * 2 + 2]), Y(p[i * 2 + 3]));
            c.stroke();
          }
          break;
        }
        case 'comet': {
          const x0 = X(it.p[0]), y0 = Y(it.p[1]), x1 = X(it.p[2]), y1 = Y(it.p[3]);
          if (Math.abs(x1 - x0) + Math.abs(y1 - y0) < 0.5) break;
          const grad = c.createLinearGradient(x0, y0, x1, y1);
          grad.addColorStop(0, rgbaString(it.c, 0));
          grad.addColorStop(1, rgbaString(it.c, 1));
          c.globalAlpha = it.a;
          c.strokeStyle = grad;
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(x0, y0);
          c.lineTo(x1, y1);
          c.stroke();
          break;
        }
        case 'dot': {
          c.globalAlpha = it.a;
          c.fillStyle = it.c;
          c.beginPath();
          c.arc(X(it.x), Y(it.y), Math.max(0.3, it.r * widthScale), 0, Math.PI * 2);
          c.fill();
          break;
        }
        case 'ellipse': {
          c.globalAlpha = it.a;
          c.beginPath();
          c.ellipse(X(it.x), Y(it.y), Math.max(0.1, it.rx * cw), Math.max(0.1, it.ry * chh), 0, 0, Math.PI * 2);
          if (it.fill) {
            c.fillStyle = it.c;
            c.fill();
          } else {
            c.strokeStyle = it.c;
            c.lineWidth = w;
            c.stroke();
          }
          break;
        }
        case 'draw': {
          // Custom vector drawing (papers, portraits, charts) in logical px
          c.save();
          it.fn(c, X, Y, cw, chh, widthScale);
          c.restore();
          c.globalCompositeOperation = 'lighter';
          break;
        }
        case 'text': {
          if (!it.str) break;
          c.globalAlpha = it.a;
          c.fillStyle = it.c;
          c.font = `700 ${this.fontSize * it.size * (widthScale > 1 ? 1 : 1)}px "Cascadia Mono", "Consolas", "Courier New", monospace`;
          c.textAlign = it.align;
          c.textBaseline = 'middle';
          c.fillText(it.str, X(it.x) - (it.align === 'center' ? 0 : cw * 0.5), Y(it.y));
          break;
        }
        case 'rect': {
          // Cell-edge coordinates (x, y = top-left cell index)
          c.globalAlpha = it.a;
          c.fillStyle = it.c;
          c.fillRect(ox + it.x * cw, oy + it.y * chh, it.w * cw, it.rh * chh);
          break;
        }
        case 'arcs': {
          c.globalAlpha = it.a;
          c.strokeStyle = it.c;
          c.lineWidth = w;
          for (let k = 0; k < 4; k++) {
            const a0 = it.rot + k * Math.PI / 2;
            c.beginPath();
            c.ellipse(X(it.x), Y(it.y), it.rx * cw, it.ry * chh, 0, a0, a0 + Math.PI / 4);
            c.stroke();
          }
          break;
        }
        default:
          break;
      }
    }
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  _drawGlowNodes(c) {
    const ox = this._ox;
    const oy = this._oy;
    c.globalCompositeOperation = 'lighter';
    for (const g of this.glowNodes) {
      const gx = ox + (g.cx + 0.5) * this.cellW;
      const gy = oy + (g.cy + 0.5) * this.cellH;
      const gr = Math.max(18, g.radius * this.cellW * 1.05);
      const grad = c.createRadialGradient(gx, gy, 1, gx, gy, gr);
      grad.addColorStop(0, rgbaString(g.color, 0.2 * (g.intensity !== undefined ? g.intensity : 1)));
      grad.addColorStop(0.5, rgbaString(g.color, 0.06 * (g.intensity !== undefined ? g.intensity : 1)));
      grad.addColorStop(1, rgbaString(g.color, 0));
      c.globalAlpha = 1;
      c.fillStyle = grad;
      c.fillRect(gx - gr, gy - gr, gr * 2, gr * 2);
    }
    c.globalCompositeOperation = 'source-over';
  }

  render(opts = {}) {
    const ctx = this.ctx;
    const pal = this.palette;
    const S = this.pxScale;
    const W = this.logicalW;
    const H = this.logicalH;
    const pxW = this.canvas.width;
    const pxH = this.canvas.height;
    const bgMode = opts.bgMode || this.bgMode;
    const transparent = bgMode === 'alpha';
    const bloom = this.crtGlow;

    this._ox = Math.floor((W - this.cols * this.cellW) / 2);
    this._oy = Math.floor((H - this.rows * this.cellH) / 2);

    // ---- 1. Background ----
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.clearRect(0, 0, pxW, pxH);
    ctx.setTransform(S, 0, 0, S, 0, 0);
    if (!transparent) {
      const base = bgMode === 'black' ? '#000000' : pal.bg;
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, W, H);
      if (bgMode !== 'black') {
        const lift = ctx.createRadialGradient(W / 2, H * 0.46, 0, W / 2, H * 0.46, Math.max(W, H) * 0.62);
        lift.addColorStop(0, rgbaString(pal.primary, 0.07));
        lift.addColorStop(1, rgbaString(pal.primary, 0));
        ctx.fillStyle = lift;
        ctx.fillRect(0, 0, W, H);
      }
      if (this.bgGrid && !this.typer.active) {
        this._applyCam(ctx, S, 0.45);
        ctx.fillStyle = pal.dim;
        ctx.globalAlpha = 0.28;
        const step = 4;
        for (let r = 1; r < this.rows; r += 2) {
          for (let c = (r % 4 === 1 ? 2 : 0); c < this.cols; c += step) {
            ctx.fillRect(this._ox + (c + 0.5) * this.cellW - 0.6, this._oy + (r + 0.5) * this.cellH - 0.6, 1.2, 1.2);
          }
        }
        ctx.globalAlpha = 1;
      }
    }

    // ---- 2. Glyph layer (world cells under the camera, HUD cells fixed) ----
    const g = this.gctx;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.clearRect(0, 0, pxW, pxH);
    const font = `600 ${this.fontSize}px "Cascadia Mono", "Consolas", "Courier New", monospace`;
    g.font = font;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const glowList = [];
    const hudList = [];
    this._applyCam(g, S, 1);
    this._drawCells(g, false, glowList, hudList);
    g.setTransform(S, 0, 0, S, 0, 0);
    g.font = font;
    this._drawCellList(g, hudList);

    // ---- 3. Emissive layer & bloom ----
    if (bloom) {
      const e = this.ectx;
      const eS = S * (this.emitLayer.width / pxW);
      e.setTransform(1, 0, 0, 1, 0, 0);
      e.globalAlpha = 1;
      e.globalCompositeOperation = 'source-over';
      e.clearRect(0, 0, this.emitLayer.width, this.emitLayer.height);
      e.globalAlpha = 0.32;
      e.drawImage(this.glyphLayer, 0, 0, this.emitLayer.width, this.emitLayer.height);
      e.globalAlpha = 1;
      e.font = font;
      e.textAlign = 'center';
      e.textBaseline = 'middle';
      this._applyCam(e, eS, 1);
      this._drawCellList(e, glowList.filter(c => !c.hud));
      if (this.holoHud) this._drawVectors(e, 1.8, false);
      e.setTransform(eS, 0, 0, eS, 0, 0);
      this._drawCellList(e, glowList.filter(c => c.hud));
      if (this.holoHud) this._drawVectors(e, 1.8, true);

      const pxPerLogicalA = this.blurA.width / W;
      const a = this.bactx;
      a.setTransform(1, 0, 0, 1, 0, 0);
      a.clearRect(0, 0, this.blurA.width, this.blurA.height);
      a.filter = `blur(${(4 * pxPerLogicalA).toFixed(2)}px)`;
      a.drawImage(this.emitLayer, 0, 0, this.blurA.width, this.blurA.height);
      a.filter = 'none';

      const pxPerLogicalB = this.blurB.width / W;
      const b = this.bbctx;
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.clearRect(0, 0, this.blurB.width, this.blurB.height);
      b.filter = `blur(${(14 * pxPerLogicalB).toFixed(2)}px)`;
      b.drawImage(this.emitLayer, 0, 0, this.blurB.width, this.blurB.height);
      b.filter = 'none';
    }

    // ---- 4. Composite ----
    if (this.holoHud && !this.typer.active) {
      this._applyCam(ctx, S, 1);
      this._drawGlowNodes(ctx);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    if (bloom) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.75 * this.bloomStrength;
      ctx.drawImage(this.blurB, 0, 0, pxW, pxH);
      ctx.globalAlpha = 0.95 * this.bloomStrength;
      ctx.drawImage(this.blurA, 0, 0, pxW, pxH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    if (this.holoHud && !this.typer.active) {
      this._applyCam(ctx, S, 1);
      this._drawVectors(ctx, 1, false);
      ctx.setTransform(S, 0, 0, S, 0, 0);
      this._drawVectors(ctx, 1, true);
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.glyphLayer, 0, 0);

    // ---- 5. Post FX (baked into exports) ----
    this._renderPost(ctx, transparent);
  }

  _drawCells(g, _unused, glowList, hudList) {
    const cw = this.cellW;
    const ch = this.cellH;
    const ox = this._ox;
    const oy = this._oy;
    let lastFill = '';
    for (let r = 0; r < this.rows; r++) {
      const rowOffset = r * this.cols;
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[rowOffset + c];
        if (cell.alpha <= 0.02 && !cell.bg) continue;
        cell._c = c;
        cell._r = r;
        if (cell.hud) {
          hudList.push(cell);
          if (cell.glow && cell.char !== ' ') glowList.push(cell);
          continue;
        }
        const a = Math.max(0, Math.min(1, cell.alpha));
        if (cell.bg) {
          g.globalAlpha = a;
          g.fillStyle = cell.bg;
          lastFill = '';
          g.fillRect(ox + c * cw, oy + r * ch, cw, ch);
        }
        if (cell.char && cell.char !== ' ' && a > 0.02) {
          const fill = rgbString(cell.r, cell.g, cell.b);
          if (fill !== lastFill) {
            g.fillStyle = fill;
            lastFill = fill;
          }
          g.globalAlpha = a;
          g.fillText(cell.char, ox + (c + 0.5 + cell.ox) * cw, oy + (r + 0.5 + cell.oy) * ch + 1);
          if (cell.glow) glowList.push(cell);
        }
      }
    }
    g.globalAlpha = 1;
  }

  _drawCellList(g, list) {
    const cw = this.cellW;
    const ch = this.cellH;
    const ox = this._ox;
    const oy = this._oy;
    for (const cell of list) {
      const a = Math.max(0, Math.min(1, cell.alpha));
      if (cell.bg) {
        g.globalAlpha = a;
        g.fillStyle = cell.bg;
        g.fillRect(ox + cell._c * cw, oy + cell._r * ch, cw, ch);
      }
      if (cell.char && cell.char !== ' ' && a > 0.02) {
        g.globalAlpha = a;
        g.fillStyle = rgbString(cell.r, cell.g, cell.b);
        g.fillText(cell.char, ox + (cell._c + 0.5 + cell.ox) * cw, oy + (cell._r + 0.5 + cell.oy) * ch + 1);
      }
    }
    g.globalAlpha = 1;
  }

  _renderPost(ctx, transparent) {
    const pal = this.palette;
    const S = this.pxScale;
    const W = this.logicalW;
    const H = this.logicalH;
    const pxW = this.canvas.width;
    const pxH = this.canvas.height;

    // Stage-change scan sweep
    if (this.sweepT < SWEEP_DUR && !this.typer.active) {
      const k = this.sweepT / SWEEP_DUR;
      const y = H * EASE.inOutCubic(k);
      const a = Math.sin(Math.PI * k);
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      const trail = ctx.createLinearGradient(0, y - 70, 0, y);
      trail.addColorStop(0, rgbaString(pal.primary, 0));
      trail.addColorStop(1, rgbaString(pal.primary, 0.07 * a));
      ctx.fillStyle = trail;
      ctx.fillRect(0, y - 70, W, 70);
      ctx.globalAlpha = 0.4 * a;
      ctx.fillStyle = pal.accent;
      ctx.fillRect(0, y - 0.75, W, 1.5);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    // Flash
    if (this.flashAmt > 0.01) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = Math.min(1, this.flashAmt * 0.45);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, pxW, pxH);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    if (!transparent) {
      if (this.scanlines) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = this.scanPattern;
        ctx.fillRect(0, 0, pxW, pxH);
        // Slow rolling refresh band
        const bandY = ((this.time * 0.09) % 1.3 - 0.15) * pxH;
        const band = ctx.createLinearGradient(0, bandY - pxH * 0.08, 0, bandY + pxH * 0.08);
        band.addColorStop(0, rgbaString(pal.primary, 0));
        band.addColorStop(0.5, rgbaString(pal.primary, 0.025));
        band.addColorStop(1, rgbaString(pal.primary, 0));
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = band;
        ctx.fillRect(0, bandY - pxH * 0.08, pxW, pxH * 0.16);
        ctx.globalCompositeOperation = 'source-over';
      }
      if (this.vignette) {
        ctx.setTransform(S, 0, 0, S, 0, 0);
        const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.58);
        vg.addColorStop(0, 'rgba(0,0,0,0)');
        vg.addColorStop(1, 'rgba(0,0,0,0.62)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, W, H);
      }
      if (this.grain) {
        // Film grain also dithers bloom gradients so YouTube's encoder doesn't band them
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const ox = Math.floor(Math.random() * 256);
        const oy = Math.floor(Math.random() * 256);
        ctx.translate(-ox, -oy);
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.07;
        ctx.fillStyle = this.noisePattern;
        ctx.fillRect(ox, oy, pxW, pxH);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }
    }

    // CRT power-on reveal
    if (this.introT < INTRO_DUR) {
      const t = this.introT / INTRO_DUR;
      const wOpen = EASE.outExpo(t / 0.32);
      const hOpen = EASE.outExpo((t - 0.28) / 0.72);
      const bandW = W * wOpen;
      const bandH = Math.max(1.5, H * hOpen);
      ctx.setTransform(S, 0, 0, S, 0, 0);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((W - bandW) / 2, (H - bandH) / 2, bandW, bandH);
      ctx.globalCompositeOperation = 'lighter';
      const lineA = 1 - hOpen;
      if (lineA > 0.01) {
        const glowH = 26;
        const gl = ctx.createLinearGradient(0, H / 2 - glowH, 0, H / 2 + glowH);
        gl.addColorStop(0, rgbaString(pal.primary, 0));
        gl.addColorStop(0.5, rgbaString(pal.primary, 0.35 * lineA));
        gl.addColorStop(1, rgbaString(pal.primary, 0));
        ctx.fillStyle = gl;
        ctx.fillRect((W - bandW) / 2, H / 2 - glowH, bandW, glowH * 2);
        ctx.globalAlpha = lineA;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect((W - bandW) / 2, H / 2 - 0.75, bandW, 1.5);
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}

window.THEMES = THEMES;
window.EASE = EASE;
window.SHAPES = SHAPES;
window.ICONS = ICONS;
window.OUTPUT_PRESETS = OUTPUT_PRESETS;
window.AsciiEngine = AsciiEngine;
