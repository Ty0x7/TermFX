// ============================================================================
// TermFX Studio - AI 3D ASCII Simulation Generator + Dry-Run Validator
// ============================================================================

const SYSTEM_PROMPT = `You are the TermFX 3D ASCII Simulation Architect.
The user will describe a concept or visualization they want demonstrated in a cyber-terminal for a YouTube video.
You must output ONLY valid JSON (no markdown commentary outside JSON) with this exact structure:
{
  "title": "Short Title",
  "phases": [
    "Stage 1",
    "Stage 2",
    "Stage 3",
    "Stage 4"
  ],
  "code": "function init(ctx) { ... }\\nfunction onPhaseChange(phase, ctx) { ... }\\nfunction update(ctx) { ... }"
}

GLOBAL VARIABLES & SANDBOX CONTEXT (Available BOTH directly as globals AND as properties on ctx):
- width, height (or ctx.width, ctx.height): integer grid columns (~120) and rows (~40)
- time (or ctx.time): elapsed seconds (float)
- dt (or ctx.dt): delta time in seconds (~0.016)
- phase (or ctx.phase): current interactive stage (1, 2, 3, or 4)
- phaseTime (or ctx.phaseTime): seconds elapsed in current stage
- state (or ctx.state): persistent object for storing arrays/entities across frames
- palette (or ctx.palette): { primary, secondary, accent, warn, danger, dim, muted }
- grid (or ctx.grid):
  - grid.fade(0.22)
  - grid.clear()
  - grid.set(x, y, char, color, glowBoolean)
  - grid.text(x, y, str, color, glowBoolean, align) // align: 'left' | 'center' | 'right'
  - grid.sprite(cx, cy, arrayOfStrings, color, glowBoolean) // draws multi-line ASCII art centered at (cx, cy)
  - grid.box(x, y, w, h, { style: 'double'|'single'|'heavy', color, glow, title })
  - grid.line(x0, y0, x1, y1, char, color, glowBoolean)
  - grid.dataLine(x0, y0, x1, y1, { char: '·', color, packetChar: '◆', packetColor, speed: 1.8, packets: 2 })
  - grid.circle(cx, cy, radius, char, color, glowBoolean)
  - grid.project3D(x, y, z, cx, cy, rotX, rotY, rotZ, scale) -> returns { x, y, z, persp }
  - grid.robotCube(cx, cy, { scale: 3.4, color, frameColor, label: 'CUBE-BOT' }) // True 1:1 Cube Robot
  - grid.shadedCube3D(cx, cy, scale, rotX, rotY, rotZ, { color, accent, dim, shadeAlpha: 0.4 })
  - grid.shadedSphere3D(cx, cy, radius, lightAngle, { color, accent, dim })
  - grid.wordStream(x0, y0, x1, y1, ['TOKEN', 'SYNC'], { color, wordColor, speed: 0.55 })
  - grid.wordRing3D(cx, cy, radius, tiltX, spin, ['SPAWN', 'ROUTE', 'MESH'], { color, dim })
  - grid.waveField(cx, cy, w, h, { color, accent })
  - grid.octahedron3D(cx, cy, scale, rotX, rotY, rotZ, { color, accent, dim, glow: true, packets: true })
  - grid.cube3D(cx, cy, scale, rotX, rotY, rotZ, { color, accent, dim, glow: true, packets: true })
  - grid.ring3D(cx, cy, radius, tiltX, tiltZ, { charFront: '•', charBack: '·', color, dim, glow: true })
  - grid.torus3D(cx, cy, majorR, minorR, rotX, rotY, { color, accent, dim, glow: true })
  - grid.helix3D(cx, cy, radius, heightSpan, rotX, rotY, { turns: 2.5, steps: 24, color, accent, dim, glow: true })
  - grid.icosahedron3D(cx, cy, scale, rotX, rotY, rotZ, { color, accent, dim, glow: true, packets: true })
  - grid.cylinder3D(cx, cy, radius, heightSpan, rotX, rotY, { rings: 3, pillars: 6, color, accent, dim, glow: true })
  - grid.pyramid3D(cx, cy, scale, rotX, rotY, rotZ, { color, accent, dim, glow: true })
  - grid.title('01 // SCENE TITLE')                      // HUD title at row 2 with animated rule lines
  - grid.caption('STAGE 1: What is happening now')       // HUD lower-third caption, types on per stage
  - grid.counter(key, x, y, value, { prefix, suffix, decimals, color, duration }) // rolling number
  - grid.morph3D(key, 'pyramid'|'cube'|'octa'|'icosa'|'dodeca'|'tetra', cx, cy, scale, rotX, rotY, rotZ, { color, accent, dim }) // changing the name morphs the shape
  - grid.shape3D(name, cx, cy, scale, rotX, rotY, rotZ, opts)
  - grid.vline(x0, y0, x1, y1, { color, alpha, width, dash: [3, 5] })  // smooth sub-pixel vector line
  - grid.vpath([[x, y], ...], { color, alpha, width, glow: true, taper: true })
  - grid.vcircle(cx, cy, r, { color, alpha, width })
  - grid.glow(cx, cy, radius, color, intensity)
  - grid.icon(name, cx, cy, color, { bob, glow, label, key, alpha }) // animated holographic concept icon
      names: agent, agentMask, bug, file, binary, lock, unlock, eye, eyeClosed, server, cloud, trophy, plug, gear, warn, shield, chip, dna
      Use icons to show WHAT a thing is (an agent, a bug, a config file) next to the 3D shapes. Swapping the name on the same key re-materialises it.
  - grid.codeCard(cx, cy, { title: 'config.yaml', width: 26, color, lines: ['a: 1', { text: 'b: 2', mark: 'hl'|'del'|'add'|'warn'|'dim' }] })
      // a code/config window; show a rule or script being edited with 'hl' then 'del' + 'add' lines
  - All 3D primitives accept { alpha: 0..1 } in opts for fading in/out.
- fx (or ctx.fx):
  - fx.burst(x, y, { count: 14, color, chars: ['░','▒','▓','+'] })
  - fx.shockwave(x, y, { color, radius: 10, duration: 0.9, delay: 0 })
  - fx.flash(color, 0.25), fx.shake(0.4), fx.punch(0.3)
- anim (or ctx.anim) — USE THESE so nothing snaps between stages:
  - anim.spring(key, target, { freq: 6, damp: 1 })  // smooth value; damp < 1 overshoots
  - anim.color(key, targetColor)                    // smooth colour
  - anim.spin(key, ratePerSecond)                   // rotation angle; use instead of time * speed
  - anim.tween(key, target, duration, 'outCubic')
  - anim.enter(delay, duration)                     // 0..1 since the stage started
- camera (or ctx.camera): camera.zoom(1.05), camera.focus(x, y, 0.2)
- ease (or ctx.ease): ease.outCubic(t), ease.outBack(t), ease.outExpo(t), ease.inOutCubic(t)
- math (or ctx.math):
  - math.lerp(a, b, t), math.smoothstep(e0, e1, x), math.clamp(v, min, max), math.dist(x1, y1, x2, y2), math.rand(min, max), math.randInt(min, max), math.pick(array)

EXACT WORKING CODE TEMPLATE (Follow this pattern strictly):
function init(ctx) {
  state.items = [];
  for (let i = 0; i < 12; i++) {
    state.items.push({ x: width / 2, y: height / 2, angle: (i / 12) * Math.PI * 2 });
  }
}
function onPhaseChange(phase, ctx) {
  fx.burst(width / 2, height / 2, { count: 12, color: palette.accent });
}
function update(ctx) {
  if (!state.items) init(ctx);
  const cx = width / 2;
  const cy = height / 2;
  grid.fade(0.22);
  grid.robotCube(cx, cy, { scale: 3.4, color: palette.accent, frameColor: palette.primary, label: 'CORE' });
  grid.wordRing3D(cx, cy, 13, 0.85, time * 0.45, ['SYNC', 'FLOW', 'NODE', 'EXEC'], { color: palette.secondary, dim: palette.dim });
  for (let i = 0; i < state.items.length; i++) {
    const it = state.items[i];
    const r = 10 + phase * 2;
    const tx = cx + Math.cos(it.angle + time * 0.5) * r * 1.75;
    const ty = cy + Math.sin(it.angle + time * 0.5) * r;
    it.x = math.lerp(it.x, tx, dt * 4.5);
    it.y = math.lerp(it.y, ty, dt * 4.5);
    if (i % 3 === 0) {
      grid.dataLine(cx, cy, it.x, it.y, { char: '·', color: palette.dim, packetChar: '◆', packetColor: palette.accent, speed: 0.9, packets: 2 });
    }
    grid.circle(it.x, it.y, 2.2, '·', palette.primary, false);
    grid.text(it.x, it.y, '[◉]', palette.accent, true, 'center');
  }
}

CRITICAL RULES:
1. Always compute positions dynamically from current width and height inside update(ctx) so fullscreen/window resize always stays centered in the middle.
2. Use clean 3D geometric wireframes (grid.cube3D, grid.octahedron3D, grid.ring3D, grid.icosahedron3D, grid.torus3D, grid.helix3D, grid.pyramid3D) and well-spaced kinetic ASCII text/code lines.
3. NEVER draw bot faces, static connecting lines, wave fields, or heavy block shading (░▒▓). Use smooth gliding tokens through open space.
4. Output ONLY valid JSON.`;

function createMockValidationContext() {
  const noop = () => {};
  const dummyVerts = Array.from({ length: 12 }, () => ({ x: 60, y: 20, z: 0, persp: 1 }));
  const state = {};
  const palette = {
    primary: '#00b4ff', secondary: '#0284c7', accent: '#bae6fd',
    warn: '#38bdf8', warning: '#38bdf8', danger: '#ff2a6d', error: '#ff2a6d',
    dim: '#0c3b5e', muted: '#061d30', bg: '#020710',
    cyan: '#00b4ff', blue: '#00b4ff', white: '#ffffff', green: '#00ff88', red: '#ff2a6d', yellow: '#38bdf8'
  };
  const grid = {
    width: 120, height: 40, cols: 120, rows: 40,
    clear: noop, clearGrid: noop, cls: noop,
    fade: noop, fadeGrid: noop,
    set: noop, setCell: noop, put: noop, plot: noop,
    get: () => ({ char: ' ', color: '#00b4ff' }), getCell: () => ({ char: ' ', color: '#00b4ff' }),
    text: noop, drawText: noop, print: noop, write: noop,
    sprite: noop, drawSprite: noop, ascii: noop,
    box: noop, drawBox: noop, rect: noop,
    line: noop, drawLine: noop,
    dataLine: noop, drawDataLine: noop, packetLine: noop,
    circle: noop, drawCircle: noop,
    reticle: noop, drawReticle: noop,
    waveform: noop, drawWaveform: noop,
    progressBar: noop, drawProgressBar: noop, bar: noop,
    project3D: () => ({ x: 60, y: 20, z: 0, persp: 1 }),
    wireframe3D: () => dummyVerts,
    octahedron3D: () => dummyVerts.slice(0, 6),
    drawOctahedron3D: () => dummyVerts.slice(0, 6),
    cube3D: () => dummyVerts.slice(0, 8),
    drawCube3D: () => dummyVerts.slice(0, 8),
    ring3D: noop, drawRing3D: noop,
    sphere3D: () => dummyVerts.slice(0, 6),
    axes3D: noop, drawAxes3D: noop,
    torus3D: noop, drawTorus3D: noop,
    helix3D: noop, drawHelix3D: noop,
    icosahedron3D: () => dummyVerts, drawIcosahedron3D: () => dummyVerts,
    cylinder3D: noop, drawCylinder3D: noop,
    pyramid3D: () => dummyVerts.slice(0, 5), drawPyramid3D: () => dummyVerts.slice(0, 5),
    robotCube: noop, drawRobotCube: noop,
    shadedCube3D: () => dummyVerts.slice(0, 8), drawShadedCube3D: () => dummyVerts.slice(0, 8),
    shadedSphere3D: noop, drawShadedSphere3D: noop,
    wordStream: noop, drawWordStream: noop,
    wordRing3D: noop, drawWordRing3D: noop,
    waveField: noop, drawWaveField: noop,
    matrixRain: noop, drawMatrixRain: noop,
    title: noop, caption: noop, counter: (k, x, y, v) => v,
    shape3D: () => dummyVerts, morph3D: () => dummyVerts,
    tetrahedron3D: () => dummyVerts.slice(0, 4), dodecahedron3D: () => dummyVerts,
    vline: noop, vpath: noop, vcircle: noop, vdot: noop, glow: noop, icon: noop, codeCard: noop
  };
  const fx = {
    burst: noop, spawnBurst: noop, explode: noop, particles: noop, ripple: noop, spawnRipple: noop,
    shockwave: noop, flash: noop, shake: noop, punch: noop
  };
  const anim = {
    spring: (k, target) => target,
    tween: (k, target) => target,
    color: (k, target) => target,
    spin: () => 0.5,
    enter: () => 1,
    intro: () => 1,
    stagger: () => 1,
    pulse: () => 0.5,
    since: () => 1
  };
  const ease = new Proxy({}, { get: () => (t) => Math.max(0, Math.min(1, t)) });
  const camera = { zoom: noop, focus: noop, punch: noop, shake: noop };
  const math = {
    lerp: (a, b, t) => a + (b - a) * t,
    smoothstep: () => 0.5,
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    distance: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    rand: (min = 0, max = 1) => min + 0.5 * (max - min),
    random: (min = 0, max = 1) => min + 0.5 * (max - min),
    randInt: (min = 0) => Math.floor(min),
    randomInt: (min = 0) => Math.floor(min),
    pick: (arr) => (Array.isArray(arr) && arr.length ? arr[0] : '*'),
    choice: (arr) => (Array.isArray(arr) && arr.length ? arr[0] : '*'),
    sin: Math.sin, cos: Math.cos, atan2: Math.atan2, abs: Math.abs, hypot: Math.hypot, PI: Math.PI
  };
  return {
    width: 120, height: 40, cols: 120, rows: 40,
    time: 1.5, tick: 90, dt: 0.016,
    phase: 1, phaseCount: 4, smoothPhase: 1.0, stageBlend: 1.0, phaseTime: 1.0, stageDuration: 4.6,
    state, palette, grid, fx, math: { ...math, mix: (a) => a }, anim, ease, camera
  };
}

function validateCompiledSimulation(compiled) {
  if (!compiled || compiled.compileError) {
    return { valid: false, error: compiled?.compileError || 'Compilation failed' };
  }
  try {
    const mockCtx = createMockValidationContext();
    compiled.init(mockCtx);
    for (let p = 1; p <= 4; p++) {
      mockCtx.phase = p;
      mockCtx.phaseTime = 0.5;
      compiled.onPhaseChange(p, mockCtx);
      compiled.update(mockCtx);
    }
    return { valid: true, error: null };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

function extractSimulationJson(rawText, originalPrompt) {
  let cleaned = rawText.trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed && parsed.code) {
        return {
          title: parsed.title || summarizePromptTitle(originalPrompt),
          phases: Array.isArray(parsed.phases) && parsed.phases.length >= 2
            ? parsed.phases.slice(0, 4)
            : ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
          code: parsed.code
        };
      }
    } catch (_) {}
  }

  const codeBlockMatch = cleaned.match(/```(?:javascript|js)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1].includes('function update')) {
    return {
      title: summarizePromptTitle(originalPrompt),
      phases: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
      code: codeBlockMatch[1].trim()
    };
  }

  throw new Error('Could not parse simulation script from AI response.');
}

function summarizePromptTitle(prompt) {
  const clean = (prompt || 'Custom Scene')
    .replace(/^(please\s+|can you\s+|i want to\s+|show\s+|demonstrate\s+|simulate\s+|create\s+|visualize\s+)/i, '')
    .trim();
  const words = clean.split(/\s+/).slice(0, 4).join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// ============================================================================
// Smart Offline 3D + Sprite Procedural Synthesizer
// ============================================================================
function synthesizeProceduralSimulation(promptText) {
  const p = (promptText || '').toLowerCase();
  const numMatch = p.match(/\b(\d+)\b/);
  const customCount = numMatch ? Math.max(2, Math.min(60, parseInt(numMatch[1], 10))) : null;

  const title = summarizePromptTitle(promptText);
  const entityCount = customCount || 12;

  const matchPreset = (id) => {
    const found = window.BUILTIN_PRESETS.find(x => x.id === id) || window.BUILTIN_PRESETS[0];
    return {
      id: 'sim-' + Date.now(),
      title: title || found.title,
      prompt: promptText,
      category: 'Procedural 3D',
      phases: [...found.phases],
      code: found.code
    };
  };

  const keywordMap = [
    [/sakana.*timeout|launch\.py|runtime.*limit|script.*edit/, 'scene-1'],
    [/docker|socket|container|breakout|chroot|kernel/, 'scene-2'],
    [/reward|verify|unit test|tamper|benchmark|eval/, 'scene-3'],
    [/align|fake|faking|sandbag|oversight|monitor|decept/, 'scene-4'],
    [/exfil|weight|scp|ssh|shutdown|sigterm|replica/, 'scene-5'],
    [/closed.*loop|aide|self-rewrit|self-patch|rsi.*loop/, 'scene-6'],
    [/alphaevolve|deepmind|matmul|matrix|tpu|kernel.*opt/, 'scene-7'],
    [/shinka|archive|stepping.*stone|helix|dna/, 'scene-8'],
    [/generation|cascade|gen-1|gen-2|gen-3|r&d/, 'scene-9'],
    [/takeoff|horizon|exponential|curve|cycle.*time|rsi/, 'scene-10']
  ];

  for (const [regex, presetId] of keywordMap) {
    if (regex.test(p)) return matchPreset(presetId);
  }

  // Bespoke 3D + Robot/Core Sprite Scene
  const customCode = `
function init(ctx) {
  state.entities = [];
  for (let i = 0; i < ${entityCount}; i++) {
    state.entities.push({
      theta: i * 2.39996,
      phi: Math.acos(1 - 2 * ((i + 0.5) / ${entityCount})),
      x: width / 2,
      y: height / 2
    });
  }
}

function onPhaseChange(phase, ctx) {
  fx.burst(width / 2, height / 2, { count: 16, color: palette.accent });
}

function update(ctx) {
  if (!state.entities) init(ctx);
  const cx = width / 2;
  const cy = height / 2;

  grid.fade(0.22);

  grid.robotCube(cx, cy, { scale: 3.6, color: palette.accent, frameColor: palette.primary, label: 'CUBE-CORE' });

  if (phase >= 2) {
    grid.wordRing3D(cx, cy, 13.5, 0.82, time * 0.45, ['SPAWN', 'ROUTE', 'SYNC', 'MESH'], {
      color: palette.secondary, dim: palette.dim
    });
  }

  const count = phase === 1 ? 4 : state.entities.length;
  for (let i = 0; i < count; i++) {
    const e = state.entities[i];
    const r = phase === 4 ? (10 + (i % 3) * 4) : 14.5;
    const sx = Math.sin(e.phi) * Math.cos(e.theta);
    const sy = Math.cos(e.phi);
    const sz = Math.sin(e.phi) * Math.sin(e.theta);
    const p3 = grid.project3D(sx, sy, sz, cx, cy, time * 0.5, time * 0.8, 0, r);

    e.x = math.lerp(e.x, p3.x, dt * 5);
    e.y = math.lerp(e.y, p3.y, dt * 5);

    if (phase >= 3 && i % 2 === 0) {
      grid.dataLine(cx, cy, e.x, e.y, {
        char: '·', color: palette.dim, packetChar: '•', packetColor: palette.accent, speed: 1.8, packets: 1
      });
    }
    grid.text(e.x, e.y, p3.z >= 0 ? '[◉]' : ' · ', p3.z >= 0 ? palette.accent : palette.dim, p3.z >= 0, 'center');
  }
}
`;

  return {
    id: 'sim-' + Date.now(),
    title,
    prompt: promptText,
    category: 'Procedural 3D',
    phases: ['Core Boot', 'Orbital Expansion', 'Synaptic Mesh', 'Overdrive'],
    code: customCode
  };
}

async function generateSimulationFromPrompt(promptText, settings) {
  if (window.termAPI && settings.provider !== 'offline') {
    const res = await window.termAPI.generateAI({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: `Create an interactive 4-stage ASCII terminal visualization for:\n"${promptText}"`,
      settings
    });

    if (res && res.ok && res.text) {
      try {
        const parsed = extractSimulationJson(res.text, promptText);
        const simObj = {
          id: 'ai-' + Date.now(),
          title: parsed.title,
          prompt: promptText,
          category: `AI (${res.provider})`,
          phases: parsed.phases,
          code: parsed.code
        };
        const compiled = window.compileSimulationFromCode(simObj);
        const check = validateCompiledSimulation(compiled);
        if (check.valid) {
          return { simulation: compiled, source: res.provider, warning: null };
        }
        console.warn('AI script dry-run validation failed, using procedural engine:', check.error);
      } catch (parseErr) {
        console.warn('AI parse error, using procedural engine:', parseErr.message);
      }
    }
  }

  const fallback = window.compileSimulationFromCode(synthesizeProceduralSimulation(promptText));
  return {
    simulation: fallback,
    source: '3D Procedural Engine',
    warning: null
  };
}

window.generateSimulationFromPrompt = generateSimulationFromPrompt;
window.synthesizeProceduralSimulation = synthesizeProceduralSimulation;
window.validateCompiledSimulation = validateCompiledSimulation;
