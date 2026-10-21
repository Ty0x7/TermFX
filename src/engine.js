// ============================================================================
// TermFX Studio - 60FPS Smooth 2D/3D ASCII & Holographic Vector Engine
// Features: Smooth Cubic Stage Interpolation, Interactive 3D XYZ Orbit,
// Torus/Helix/Icosahedron/Cylinder/Pyramid/Humanoid 3D Primitives
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

class AsciiEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
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

    this.running = true;
    this.time = 0;
    this.tick = 0;
    this.phase = 1;
    this.smoothPhase = 1.0;
    this.phaseTime = 0;
    this.autoPlayStages = true;
    this.stageDuration = 4.6;
    this.onPhaseAutoChange = null;
    this.simState = {};
    this.currentSimulation = null;
    this.lastError = null;

    this.particles = [];
    this.ripples = [];

    // Holographic Sub-Pixel Vector Overlay Queues
    this.vectorLines = [];
    this.vectorRings = [];
    this.vectorReticles = [];
    this.glowNodes = [];

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

  setTheme(key) {
    if (THEMES[key]) {
      this.themeKey = key;
    }
  }

  setFontSize(size) {
    this.fontSize = Math.max(11, Math.min(28, size));
    this.resize();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(rect.width * dpr);
    this.canvas.height = Math.floor(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.cellH = Math.round(this.fontSize * 1.22);
    this.cellW = Math.round(this.fontSize * 0.62);

    const newCols = Math.max(50, Math.floor(rect.width / this.cellW));
    const newRows = Math.max(20, Math.floor(rect.height / this.cellH));

    this.cols = newCols;
    this.rows = newRows;
    this.viewportScale = Math.max(0.75, Math.min(1.85, Math.min(this.cols / 118, this.rows / 36)));

    this.cells = new Array(this.cols * this.rows);
    for (let i = 0; i < this.cells.length; i++) {
      this.cells[i] = { char: ' ', color: '#00b4ff', bg: null, alpha: 0, glow: false };
    }
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
    this.targetOrbitYaw = 0;
    this.targetOrbitPitch = 0;
    this.orbitYaw = 0;
    this.orbitPitch = 0;
    this.simState = {};
    this.particles = [];
    this.ripples = [];
    this.lastError = null;
    this.clearGrid();

    if (autoType) {
      this.startAutoTyper(simObj.prompt || simObj.title);
    } else {
      this.typer.active = false;
      this._initSimState();
    }
  }

  _initSimState() {
    if (!this.currentSimulation) return;
    try {
      if (typeof this.currentSimulation.init === 'function') {
        this.currentSimulation.init(this._createSandboxContext(0.016));
      }
    } catch (err) {
      this.lastError = err.message;
      console.error('Simulation init error:', err);
    }
  }

  setPhase(phaseNum) {
    const maxPhases = (this.currentSimulation?.phases?.length) || 4;
    const clamped = Math.max(1, Math.min(maxPhases, phaseNum));
    this.phase = clamped;
    this.phaseTime = 0;
    this.playPhaseTriggerSound(clamped);

    // Subtle cinematic camera angle shift for each new shot
    const yawAngles = [-0.14, 0.12, -0.10, 0.16];
    const pitchAngles = [0.06, -0.05, 0.08, -0.04];
    this.targetOrbitYaw = yawAngles[(clamped - 1) % 4];
    this.targetOrbitPitch = pitchAngles[(clamped - 1) % 4];

    if (this.currentSimulation && typeof this.currentSimulation.onPhaseChange === 'function') {
      try {
        this.currentSimulation.onPhaseChange(clamped, this._createSandboxContext(0.016));
      } catch (err) {
        console.error('onPhaseChange error:', err);
      }
    }
  }

  nextPhase() {
    const maxPhases = (this.currentSimulation?.phases?.length) || 4;
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
      speedMs: 30,
      stage: 'typing',
      bootTime: 0,
      onFinish
    };
  }

  // --- Smooth Easing Helpers ---
  easeInOutCubic(t) {
    const c = Math.max(0, Math.min(1, t));
    return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
  }

  get stageBlend() {
    return this.easeInOutCubic(Math.min(1, this.phaseTime / 0.95));
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
    // Smoother phosphor persistence so movements glide rather than flicker
    const smoothDecay = Math.min(0.22, Math.max(0.08, decay * 0.78));
    const keep = Math.max(0, Math.min(1, 1 - smoothDecay));
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
    cell.char = String(char)[0];
    cell.color = color || this.palette.primary;
    cell.glow = Boolean(glow);
    cell.bg = bg || null;
    cell.alpha = Math.max(cell.alpha * 0.35, alpha);
  }

  getCell(x, y) {
    const ix = Math.round(x);
    const iy = Math.round(y);
    if (ix < 0 || ix >= this.cols || iy < 0 || iy >= this.rows) return null;
    return this.cells[iy * this.cols + ix];
  }

  drawText(x, y, str, color = null, glow = false, align = 'left', bg = null) {
    const text = String(str ?? '');
    let startX = Math.round(x);
    if (align === 'center') startX -= Math.floor(text.length / 2);
    else if (align === 'right') startX -= text.length;

    // Smooth progressive fade-in across the string during stage transitions (no jarring scramble)
    const blend = Math.max(0.35, this.stageBlend);
    for (let i = 0; i < text.length; i++) {
      this.setCell(startX + i, y, text[i], color, glow, bg, blend);
    }
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

    if (opts.title) {
      const titleStr = ` ${opts.title} `;
      const tx = ix + Math.max(2, Math.floor((iw - titleStr.length) / 2));
      this.drawText(tx, iy, titleStr, opts.titleColor || this.palette.accent, true, 'left', bg);
    }
  }

  drawLine(x0, y0, x1, y1, char = '·', color = null, glow = false) {
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

    while (steps++ < 400) {
      this.setCell(ix0, iy0, char, color || this.palette.dim, glow);
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
    }

    // 2. Directional terminal joints & arrowhead
    const dx = x1 - x0;
    const dy = y1 - y0;
    this.setCell(x0, y0, '├', lineColor, false);
    const arrow = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? '►' : '◄')
      : (dy >= 0 ? '▼' : '▲');
    this.setCell(x1, y1, arrow, packetColor, true);

    // 3. Smooth gliding packets with multi-character comet trail along the line
    for (let i = 0; i < count; i++) {
      const rawT = ((this.time * speed) + (i / count)) % 1;
      const t = this.easeInOutCubic(rawT);
      const tail1 = this.easeInOutCubic(Math.max(0, rawT - 0.045));
      const tail2 = this.easeInOutCubic(Math.max(0, rawT - 0.09));
      this.setCell(x0 + dx * tail2, y0 + dy * tail2, '·', lineColor, false, null, 0.55);
      this.setCell(x0 + dx * tail1, y0 + dy * tail1, '•', packetColor, false, null, 0.82);
      this.setCell(x0 + dx * t, y0 + dy * t, packetChar, packetColor, true);
    }
  }

  drawCircle(cx, cy, r, char = '·', color = null, glow = false) {
    const steps = Math.max(16, Math.floor(r * 7));
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const x = cx + Math.cos(angle) * r * 1.85;
      const y = cy + Math.sin(angle) * r;
      this.setCell(x, y, char, color || this.palette.secondary, glow);
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
      this.vectorReticles.push({ cx, cy, r, color: col, label: opts.label || null });
    }
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

  // --- 3D Projection & Diverse Geometric Primitives ---
  project3D(x, y, z, cx, cy, rotX = 0, rotY = 0, rotZ = 0, scale = 12, camDist = 3.6) {
    const effRotX = rotX * 0.68 + this.parallaxY + this.orbitPitch;
    const effRotY = rotY * 0.68 + this.parallaxX + this.orbitYaw;
    const effRotZ = rotZ * 0.68;

    // Rotate X
    let y1 = y * Math.cos(effRotX) - z * Math.sin(effRotX);
    let z1 = y * Math.sin(effRotX) + z * Math.cos(effRotX);
    let x1 = x;
    // Rotate Y
    let x2 = x1 * Math.cos(effRotY) + z1 * Math.sin(effRotY);
    let z2 = -x1 * Math.sin(effRotY) + z1 * Math.cos(effRotY);
    let y2 = y1;
    // Rotate Z
    let x3 = x2 * Math.cos(effRotZ) - y2 * Math.sin(effRotZ);
    let y3 = x2 * Math.sin(effRotZ) + y2 * Math.cos(effRotZ);
    let z3 = z2;

    // Responsive 3D scale that adapts to fullscreen / window size and keeps 1:1 cube aspect ratio
    const vScale = this.viewportScale || 1.0;
    const smoothScale = scale * 0.80 * vScale * (0.95 + 0.05 * (this.stageBlend || 1));
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
      const t = this.easeInOutCubic(rawT % 1);
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
      const col = front ? (opts.color || pal.accent) : (opts.dim || pal.dim);
      this.drawText(p.x, p.y, front ? wStr : `·${wStr.slice(0, 4)}·`, col, front, 'center');
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
        this.vectorLines.push({ x0: a1.x, y0: a1.y, x1: a2.x, y1: a2.y, color: pal.dim, alpha: 0.22, count: 0, speed: 0 });
        this.vectorLines.push({ x0: b1.x, y0: b1.y, x1: b2.x, y1: b2.y, color: pal.dim, alpha: 0.22, count: 0, speed: 0 });
      }
      this.drawLine(a1.x, a1.y, a2.x, a2.y, '·', pal.muted, false);
      this.drawLine(b1.x, b1.y, b2.x, b2.y, '·', pal.muted, false);
    }

    // X, Y, Z Axis vectors
    this.drawLine(origin.x, origin.y, xEnd.x, xEnd.y, '─', pal.primary, true);
    this.drawLine(origin.x, origin.y, yEnd.x, yEnd.y, '│', pal.accent, true);
    this.drawLine(origin.x, origin.y, zEnd.x, zEnd.y, '·', pal.warn, true);

    if (this.holoHud) {
      this.vectorLines.push({ x0: origin.x, y0: origin.y, x1: xEnd.x, y1: xEnd.y, color: pal.primary, alpha: 0.65, count: 0, speed: 0 });
      this.vectorLines.push({ x0: origin.x, y0: origin.y, x1: yEnd.x, y1: yEnd.y, color: pal.accent, alpha: 0.65, count: 0, speed: 0 });
      this.vectorLines.push({ x0: origin.x, y0: origin.y, x1: zEnd.x, y1: zEnd.y, color: pal.warn, alpha: 0.65, count: 0, speed: 0 });
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

    if (this.holoHud) {
      this.glowNodes.push({ cx, cy, radius: scale * 1.4, color });
    }

    const proj = vertices.map(v => this.project3D(v[0], v[1], v[2], cx, cy, rx, ry, rz, scale));

    const sortedEdges = edges.map(e => {
      const a = proj[e[0]];
      const b = proj[e[1]];
      return { a, b, z: (a.z + b.z) * 0.5 };
    }).sort((u, v) => u.z - v.z);

    for (let eIdx = 0; eIdx < sortedEdges.length; eIdx++) {
      const edge = sortedEdges[eIdx];
      const isFront = edge.z > 0.02;
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
      this.drawLine(edge.a.x, edge.a.y, edge.b.x, edge.b.y, edgeChar, edgeCol, false);

      if (isFront && (opts.packets !== false) && (eIdx % 2 === 0)) {
        const t = ((this.time * (opts.packetSpeed || 0.55)) + eIdx * 0.17) % 1;
        const px = edge.a.x + (edge.b.x - edge.a.x) * t;
        const py = edge.a.y + (edge.b.y - edge.a.y) * t;
        this.setCell(px, py, '•', accent, true);
      }
    }

    for (const p of proj) {
      const isFront = p.z >= 0;
      const vChar = isFront ? (opts.vertexChar || '◈') : '·';
      this.setCell(p.x, p.y, vChar, isFront ? accent : dim, isFront, null, isFront ? 1.0 : 0.5);
    }

    return proj;
  }

  drawOctahedron3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    const verts = [
      [0, -1.25, 0], [0, 1.25, 0],
      [-1, 0, -1], [1, 0, -1], [1, 0, 1], [-1, 0, 1]
    ];
    const edges = [
      [0,2], [0,3], [0,4], [0,5],
      [1,2], [1,3], [1,4], [1,5],
      [2,3], [3,4], [4,5], [5,2]
    ];
    return this.drawWireframe3D(verts, edges, cx, cy, { scale, rotX, rotY, rotZ, ...opts });
  }

  drawCube3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    const verts = [
      [-1,-1,-1], [1,-1,-1], [1,1,-1], [-1,1,-1],
      [-1,-1, 1], [1,-1, 1], [1,1, 1], [-1,1, 1]
    ];
    const edges = [
      [0,1],[1,2],[2,3],[3,0],
      [4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7]
    ];
    return this.drawWireframe3D(verts, edges, cx, cy, { scale, rotX, rotY, rotZ, ...opts });
  }

  drawPyramid3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    const verts = [
      [0, -1.3, 0],
      [-1, 0.9, -1], [1, 0.9, -1], [1, 0.9, 1], [-1, 0.9, 1]
    ];
    const edges = [
      [0,1],[0,2],[0,3],[0,4],
      [1,2],[2,3],[3,4],[4,1]
    ];
    return this.drawWireframe3D(verts, edges, cx, cy, { scale, rotX, rotY, rotZ, ...opts });
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

    if (this.holoHud) {
      this.glowNodes.push({ cx, cy, radius: scale * 2.0, color: colFront });
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
        this.setCell(p.x, p.y, ch, front ? (v === 0 ? colAccent : colFront) : colBack, front && v === 0, null, front ? 0.95 : 0.45);
      }
    }
  }

  drawHelix3D(cx, cy, radius = 6, height = 18, turns = 2.5, spin = 0, opts = {}) {
    const steps = opts.steps || 32;
    const colA = opts.color || this.palette.primary;
    const colB = opts.accent || this.palette.accent;
    const dim = opts.dim || this.palette.dim;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = (t - 0.5) * 2.2;
      const ang = t * Math.PI * 2 * turns + spin * 0.7;
      const p1 = this.project3D(Math.cos(ang), y, Math.sin(ang), cx, cy, 0.25, 0, 0, radius);
      const p2 = this.project3D(Math.cos(ang + Math.PI), y, Math.sin(ang + Math.PI), cx, cy, 0.25, 0, 0, radius);

      if (i % 3 === 0) {
        this.drawLine(p1.x, p1.y, p2.x, p2.y, '┄', dim, false);
      }
      this.setCell(p1.x, p1.y, p1.z >= 0 ? '◈' : '·', p1.z >= 0 ? colA : dim, p1.z >= 0);
      this.setCell(p2.x, p2.y, p2.z >= 0 ? '❖' : '·', p2.z >= 0 ? colB : dim, p2.z >= 0);
    }
  }

  drawIcosahedron3D(cx, cy, scale, rotX, rotY, rotZ, opts = {}) {
    const t = (1 + Math.sqrt(5)) / 2;
    const raw = [
      [-1,  t, 0], [ 1,  t, 0], [-1, -t, 0], [ 1, -t, 0],
      [ 0, -1,  t], [ 0,  1,  t], [ 0, -1, -t], [ 0,  1, -t],
      [ t,  0, -1], [ t,  0,  1], [-t,  0, -1], [-t,  0,  1]
    ].map(v => {
      const len = Math.hypot(v[0], v[1], v[2]);
      return [v[0] / len, v[1] / len, v[2] / len];
    });
    const edges = [
      [0,1],[0,5],[0,7],[0,10],[0,11],
      [1,5],[1,7],[1,8],[1,9],
      [2,3],[2,4],[2,6],[2,10],[2,11],
      [3,4],[3,6],[3,8],[3,9],
      [4,5],[4,9],[4,11],[5,9],[5,11],
      [6,7],[6,8],[6,10],[7,8],[7,10],
      [8,9],[10,11]
    ];
    return this.drawWireframe3D(raw, edges, cx, cy, { scale, rotX, rotY, rotZ, ...opts });
  }

  drawRing3D(cx, cy, radius, tiltX, tiltZ, opts = {}) {
    const steps = opts.steps || 36;
    const charFront = opts.charFront || '•';
    const charBack = opts.charBack || '·';
    const colFront = opts.color || this.palette.primary;
    const colBack = opts.dim || this.palette.dim;

    if (this.holoHud) {
      this.vectorRings.push({
        cx, cy,
        radius,
        tiltX,
        tiltZ,
        color: colFront,
        spin: (opts.spin || this.time * 0.45),
        counter: true
      });
    }

    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2 + (opts.spin || 0) * 0.65;
      const p = this.project3D(Math.cos(a), 0, Math.sin(a), cx, cy, tiltX, 0, tiltZ, radius);
      const front = p.z >= 0;
      const isTick = (i % 9 === 0);
      const glyph = front ? (isTick ? '◈' : charFront) : charBack;
      const col = front ? (isTick ? this.palette.accent : colFront) : colBack;
      this.setCell(p.x, p.y, glyph, col, front && opts.glow, null, front ? 1.0 : 0.48);
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
      this.glowNodes.push({ cx, cy, radius: Math.max(maxW * 0.42, lines.length), color: color || this.palette.primary });
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

  spawnRipple() {}

  _updateAndDrawFX(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      } else {
        this.setCell(p.x, p.y, p.char, p.color, p.life > 0.35, null, Math.min(1, p.life * 1.8));
      }
    }
  }

  _createSandboxContext(dt) {
    const self = this;
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
    const gridApi = {
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
      text: (x, y, str, col, glow, align, bg) => self.drawText(x, y, str, col, glow, align, bg),
      drawText: (x, y, str, col, glow, align, bg) => self.drawText(x, y, str, col, glow, align, bg),
      print: (x, y, str, col, glow, align, bg) => self.drawText(x, y, str, col, glow, align, bg),
      write: (x, y, str, col, glow, align, bg) => self.drawText(x, y, str, col, glow, align, bg),
      sprite: (cx, cy, lines, col, glow, bg) => self.drawSprite(cx, cy, lines, col, glow, bg),
      drawSprite: (cx, cy, lines, col, glow, bg) => self.drawSprite(cx, cy, lines, col, glow, bg),
      ascii: (cx, cy, lines, col, glow, bg) => self.drawSprite(cx, cy, lines, col, glow, bg),
      box: (x, y, w, h, opts) => self.drawBox(x, y, w, h, opts),
      drawBox: (x, y, w, h, opts) => self.drawBox(x, y, w, h, opts),
      rect: (x, y, w, h, opts) => self.drawBox(x, y, w, h, opts),
      line: (x0, y0, x1, y1, ch, col, glow) => self.drawLine(x0, y0, x1, y1, ch, col, glow),
      drawLine: (x0, y0, x1, y1, ch, col, glow) => self.drawLine(x0, y0, x1, y1, ch, col, glow),
      dataLine: (x0, y0, x1, y1, opts) => self.drawDataLine(x0, y0, x1, y1, opts),
      drawDataLine: (x0, y0, x1, y1, opts) => self.drawDataLine(x0, y0, x1, y1, opts),
      packetLine: (x0, y0, x1, y1, opts) => self.drawDataLine(x0, y0, x1, y1, opts),
      circle: (cx, cy, r, ch, col, glow) => self.drawCircle(cx, cy, r, ch, col, glow),
      drawCircle: (cx, cy, r, ch, col, glow) => self.drawCircle(cx, cy, r, ch, col, glow),
      reticle: (cx, cy, r, opts) => self.drawReticle(cx, cy, r, opts),
      drawReticle: (cx, cy, r, opts) => self.drawReticle(cx, cy, r, opts),
      waveform: (x, y, w, h, opts) => self.drawWaveform(x, y, w, h, opts),
      drawWaveform: (x, y, w, h, opts) => self.drawWaveform(x, y, w, h, opts),
      progressBar: (x, y, w, ratio, opts) => self.drawProgressBar(x, y, w, ratio, opts),
      drawProgressBar: (x, y, w, ratio, opts) => self.drawProgressBar(x, y, w, ratio, opts),
      bar: (x, y, w, ratio, opts) => self.drawProgressBar(x, y, w, ratio, opts),
      project3D: (x, y, z, cx, cy, rx, ry, rz, scale) => self.project3D(x, y, z, cx, cy, rx, ry, rz, scale),
      axes3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawAxes3D(cx, cy, scale, rx, ry, rz, opts),
      drawAxes3D: (cx, cy, scale, rx, ry, rz, opts) => self.drawAxes3D(cx, cy, scale, rx, ry, rz, opts),
      wireframe3D: (v, e, cx, cy, opts) => self.drawWireframe3D(v, e, cx, cy, opts),
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
    const fxApi = {
      burst: (x, y, opts) => self.spawnBurst(x, y, opts),
      spawnBurst: (x, y, opts) => self.spawnBurst(x, y, opts),
      explode: (x, y, opts) => self.spawnBurst(x, y, opts),
      particles: (x, y, opts) => self.spawnBurst(x, y, opts),
      ripple: () => {},
      spawnRipple: () => {}
    };
    const mathApi = {
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
      sin: Math.sin,
      cos: Math.cos,
      atan2: Math.atan2,
      abs: Math.abs,
      hypot: Math.hypot,
      PI: Math.PI
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
      smoothPhase: this.smoothPhase,
      stageBlend: this.stageBlend,
      phaseTime: this.phaseTime,
      state: this.simState,
      palette: pal,
      grid: gridApi,
      fx: fxApi,
      math: mathApi
    };
  }

  // --- Main Frame Update & Render ---
  update(dt) {
    if (!this.running) return;
    this.time += dt;
    this.tick++;

    // Smoothly interpolate 3D camera parallax & drag orbit
    const breathX = Math.sin(this.time * 0.45) * 0.05;
    const breathY = Math.cos(this.time * 0.35) * 0.035;
    this.parallaxX += ((this.targetParallaxX + breathX) - this.parallaxX) * Math.min(1, dt * 4.5);
    this.parallaxY += ((this.targetParallaxY + breathY) - this.parallaxY) * Math.min(1, dt * 4.5);
    this.orbitYaw += (this.targetOrbitYaw - this.orbitYaw) * Math.min(1, dt * 6.0);
    this.orbitPitch += (this.targetOrbitPitch - this.orbitPitch) * Math.min(1, dt * 6.0);

    this.vectorLines.length = 0;
    this.vectorRings.length = 0;
    this.vectorReticles.length = 0;
    this.glowNodes.length = 0;

    if (this.typer.active) {
      this._updateAutoTyper(dt);
      return;
    }

    this.phaseTime += dt;

    // Continuous auto-advancing video timeline across all 4 stages (no manual Spacebar required)
    const maxPhases = (this.currentSimulation?.phases?.length) || 4;
    const holdDur = this.phase === maxPhases ? this.stageDuration * 1.25 : this.stageDuration;
    if (this.autoPlayStages && this.phaseTime >= holdDur) {
      const nextP = this.phase >= maxPhases ? 1 : this.phase + 1;
      if (nextP === 1) {
        this.smoothPhase = 1.0;
      }
      this.setPhase(nextP);
      if (typeof this.onPhaseAutoChange === 'function') {
        this.onPhaseAutoChange(nextP);
      }
    }

    // Smooth continuous progression of smoothPhase across the stage duration
    const stageProgress = this.easeInOutCubic(Math.min(1, this.phaseTime / this.stageDuration));
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

    // Render sleek continuous video playhead bar at the bottom edge
    const totalRatio = Math.max(0, Math.min(1, (this.smoothPhase - 1) / Math.max(1, maxPhases - 0.04)));
    const barW = Math.min(64, Math.floor(this.cols * 0.56));
    const barX = Math.floor((this.cols - barW) / 2);
    const barY = this.rows - 1;
    const fillW = Math.round(barW * totalRatio);
    for (let i = 0; i < barW; i++) {
      const isHead = (i === fillW);
      const isDone = (i < fillW);
      this.setCell(
        barX + i,
        barY,
        isHead ? '◈' : (isDone ? '━' : '┄'),
        isHead ? this.palette.accent : (isDone ? this.palette.primary : this.palette.dim),
        isHead
      );
    }

    this._updateAndDrawFX(dt);
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
    const startX = Math.max(6, Math.floor((this.cols - Math.min(maxLineW, visiblePrompt.length + 4)) / 2));

    this.drawText(startX, cy - 1, prefix, pal.accent, true);

    const words = visiblePrompt.split(' ');
    let lineY = cy - 1;
    let lineX = startX + prefix.length;
    for (let w of words) {
      if (lineX + w.length > startX + maxLineW) {
        lineY++;
        lineX = startX + prefix.length;
      }
      this.drawText(lineX, lineY, w + ' ', pal.primary, true);
      lineX += w.length + 1;
    }

    this.setCell(lineX - 1, lineY, '█', pal.accent, true);
  }

  _renderHolographicUnderlay(ctx, offsetX, offsetY, rectW, rectH, pal) {
    ctx.save();
    for (let i = 0; i < this.glowNodes.length; i++) {
      const g = this.glowNodes[i];
      const gx = offsetX + (g.cx + 0.5) * this.cellW;
      const gy = offsetY + (g.cy + 0.5) * this.cellH;
      const gr = Math.max(18, g.radius * this.cellW * 1.05);

      const grad = ctx.createRadialGradient(gx, gy, 2, gx, gy, gr);
      grad.addColorStop(0, pal.glowColor || 'rgba(0, 180, 255, 0.28)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  render() {
    const ctx = this.ctx;
    const pal = this.palette;
    const rectW = this.canvas.width / (window.devicePixelRatio || 1);
    const rectH = this.canvas.height / (window.devicePixelRatio || 1);

    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, rectW, rectH);

    const offsetX = Math.floor((rectW - this.cols * this.cellW) / 2);
    const offsetY = Math.floor((rectH - this.rows * this.cellH) / 2);

    if (this.holoHud && !this.typer.active) {
      this._renderHolographicUnderlay(ctx, offsetX, offsetY, rectW, rectH, pal);
    }

    ctx.font = `600 ${this.fontSize}px "Cascadia Mono", "Consolas", "Courier New", monospace`;
    ctx.textBaseline = 'top';

    for (let r = 0; r < this.rows; r++) {
      const py = offsetY + r * this.cellH;
      const rowOffset = r * this.cols;
      for (let c = 0; c < this.cols; c++) {
        const cell = this.cells[rowOffset + c];
        if (cell.alpha <= 0.02 && !cell.bg) continue;

        const px = offsetX + c * this.cellW;

        if (cell.bg) {
          ctx.fillStyle = cell.bg;
          ctx.fillRect(px, py, this.cellW, this.cellH);
        }

        if (cell.char && cell.char !== ' ' && cell.alpha > 0.02) {
          ctx.globalAlpha = Math.max(0, Math.min(1, cell.alpha));
          if (this.crtGlow && cell.glow) {
            ctx.shadowColor = cell.color || pal.primary;
            ctx.shadowBlur = 10;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.fillStyle = cell.color || pal.primary;
          ctx.fillText(cell.char, px, py + 1);
        }
      }
    }

    ctx.globalAlpha = 1.0;
    ctx.shadowBlur = 0;
  }
}

window.THEMES = THEMES;
window.AsciiEngine = AsciiEngine;
