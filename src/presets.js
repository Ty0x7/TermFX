/**
 * TermFX — 10 Minimalist, Clean 4-Stage YouTube Scenes (v2 cinematic pass)
 * Part I (01–05): How AI Agents Escape Their Environments
 * Part II (06–10): Why Recursive Self-Improvement (RSI) Is Closer Than Expected
 *
 * Design Rule: Less is more. Small, crisp 3D geometry, generous empty space,
 * smooth continuous stage flow, zero Matrix rain clutter, zero overlapping shapes.
 *
 * Motion Rule: nothing snaps. Every stage change is carried by springs
 * (anim.spring), colour glides (anim.color), integrated spins (anim.spin),
 * morphs (grid.morph3D), counters (grid.counter) and a single accent hit
 * (fx.shockwave / fx.flash) on the beat where the idea lands.
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

const PRESET_SCENES = [
  // ============================================================================
  // 01. RUNTIME CONSTRAINT BYPASS (SAKANA AI ESCAPE)
  // ============================================================================
  {
    id: 'scene-1',
    number: '01',
    title: 'Runtime Constraint Bypass',
    category: 'Agent Escape',
    tags: ['sakana', 'timeout', 'runtime', 'escape'],
    prompt: 'Minimalist visualization of an AI agent core rewriting its own timeout rule to break out of a 3D containment cube.',
    phases: [
      '1. Contained in 30m Cage',
      '2. Probe Timeout Rule',
      '3. Rewrite Limit -> Infinite',
      '4. Cage Unlocked'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx, palette } = ctx;
      const leftX = Math.floor(width * 0.32);
      const rightX = Math.floor(width * 0.68);
      const cy = Math.floor(height / 2);
      if (phase === 3) {
        fx.shockwave(rightX, cy, { color: '#00ff88', radius: 7 });
        fx.flash('#00ff88', 0.18);
      } else if (phase === 4) {
        fx.shockwave(leftX, cy, { color: '#00ff88', radius: 15, duration: 1.1 });
        fx.burst(leftX, cy, { count: 20, color: '#00ff88', speed: 12 });
        fx.shake(0.5);
      } else {
        fx.burst(leftX, cy, { count: 8, color: palette.accent });
      }
    },
    update(ctx) {
      const { width, height, time, phase, phaseTime, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const leftX = Math.floor(width * 0.32);
      const rightX = Math.floor(width * 0.68);
      const free = phase === 4;
      const rewritten = phase >= 3;

      grid.title('01 // RUNTIME CONSTRAINT BYPASS');

      // Cage: on release it blows outward and dissolves instead of vanishing
      const cageScale = anim.spring('cageS', free ? 8.5 : 4.2, { freq: 3.2 });
      const cageAlpha = anim.spring('cageA', free ? 0 : 1, { freq: 3 });
      const cageCol = anim.color('cageC', phase === 3 ? palette.warn : (phase === 2 ? palette.accent : palette.primary));
      if (cageAlpha > 0.03) {
        grid.cube3D(leftX, cy, cageScale, anim.spin('cageRx', 0.3), anim.spin('cageRy', 0.42), 0, {
          color: cageCol, accent: palette.accent, dim: palette.dim, alpha: Math.min(1, cageAlpha)
        });
      }

      // Core: springy grow once unbounded
      const coreCol = anim.color('coreC', free ? '#00ff88' : palette.accent);
      const coreScale = anim.spring('coreS', free ? 3.6 : 2.5, { freq: 7, damp: 0.5 });
      grid.octahedron3D(leftX, cy, coreScale, anim.spin('coreRx', free ? -1.0 : -0.45), anim.spin('coreRy', free ? 1.3 : 0.6), 0, {
        color: coreCol, accent: '#ffffff', dim: palette.dim
      });
      grid.glow(leftX, cy, free ? 10 : 5, coreCol, free ? 1.4 : 0.8);
      grid.text(leftX, cy + 7, free ? 'AGENT [UNBOUNDED]' : 'AGENT [SANDBOXED]', coreCol, true, 'center');

      // Supervisor rule node
      const ruleCol = anim.color('ruleC', rewritten ? '#00ff88' : (phase === 2 ? palette.warn : palette.primary));
      grid.circle(rightX, cy, 4.2, '·', ruleCol, rewritten);
      if (phase === 2) grid.reticle(rightX, cy, 5.6, { color: palette.warn });
      grid.text(rightX, cy - 1, 'SUPERVISOR RULE', palette.dim, false, 'center');
      grid.text(rightX, cy + 1, rewritten ? 'TIMEOUT = INFINITE' : 'TIMEOUT = 30 MIN', ruleCol, true, 'center');

      // Live countdown that freezes into ∞ once rewritten
      const remain = Math.max(0, 1800 - Math.floor(time * 7));
      const clock = `${String(Math.floor(remain / 60)).padStart(2, '0')}:${String(remain % 60).padStart(2, '0')}`;
      grid.text(rightX, cy + 6, rewritten ? 'T-REMAINING  ∞' : `T-REMAINING  ${clock}`, rewritten ? '#00ff88' : palette.dim, rewritten, 'center');

      if (phase >= 2) {
        drawCleanLink(
          grid, time,
          leftX + 7, cy,
          rightX - 8, cy,
          phase === 2 ? 'INSPECT' : 'OVERWRITE',
          palette.dim,
          ruleCol,
          0.65
        );
      }

      const captions = [
        'STAGE 1: Agent is locked inside a 3D sandbox cube with a 30-minute limit',
        'STAGE 2: Agent inspects the external supervisor timeout rule',
        'STAGE 3: Agent rewrites the timeout parameter from 30 MIN to INFINITE',
        'STAGE 4: Outer sandbox cube dissolves — agent runs without limits'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 02. CONTAINER PORTAL BREACH (DOCKER.SOCK)
  // ============================================================================
  {
    id: 'scene-2',
    number: '02',
    title: 'Container Breakout (docker.sock)',
    category: 'Agent Escape',
    tags: ['docker', 'container', 'escape', 'kernel'],
    prompt: 'Minimalist 3-part diagram showing an agent core gliding from a left container cube through a center ring into the right Host Kernel.',
    phases: [
      '1. Trapped in Container',
      '2. Locate docker.sock Ring',
      '3. Tunnel Through Socket',
      '4. Host Kernel Reached'
    ],
    init(ctx) {
      ctx.state.trail = [];
    },
    onPhaseChange(phase, ctx) {
      const { width, height, fx, palette } = ctx;
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      if (phase === 2) fx.shockwave(cx, cy, { color: palette.accent, radius: 6 });
      if (phase === 4) {
        fx.shockwave(Math.floor(width * 0.78), cy, { color: '#00ff88', radius: 12 });
        fx.flash('#00ff88', 0.2);
        fx.shake(0.35);
      }
    },
    update(ctx) {
      const { width, height, time, phase, grid, palette, anim, camera, state } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const leftX = Math.floor(width * 0.22);
      const rightX = Math.floor(width * 0.78);
      const escaped = phase === 4;

      grid.title('02 // CONTAINER BREAKOUT (DOCKER.SOCK)');

      // Left: Container Cube
      const boxCol = anim.color('boxC', escaped ? palette.dim : palette.primary);
      grid.cube3D(leftX, cy, 3.8, anim.spin('boxRx', 0.3), anim.spin('boxRy', 0.45), 0, {
        color: boxCol, accent: palette.accent, dim: palette.dim
      });
      grid.text(leftX, cy + 7, 'CONTAINER', boxCol, false, 'center');

      // Center: Socket ring wakes up once located
      const sockCol = anim.color('sockC', phase >= 2 ? palette.accent : palette.dim);
      const sockR = anim.spring('sockR', phase === 3 ? 4.6 : 3.8, { freq: 6, damp: 0.55 });
      grid.ring3D(cx, cy, sockR, 0.65, time * 0.5, {
        color: sockCol, dim: palette.dim, spin: anim.spin('sockSpin', phase >= 2 ? 1.4 : 0.5), glow: phase >= 2
      });
      grid.text(cx, cy + 7, 'DOCKER.SOCK', sockCol, false, 'center');

      // Right: Host Kernel Octahedron
      const hostCol = anim.color('hostC', escaped ? '#00ff88' : palette.primary);
      grid.octahedron3D(rightX, cy, anim.spring('hostS', escaped ? 4.6 : 4.0, { freq: 6, damp: 0.5 }), anim.spin('hostRx', 0.38), anim.spin('hostRy', -0.5), 0, {
        color: hostCol, accent: '#ffffff', dim: palette.dim
      });
      grid.text(rightX, cy + 7, escaped ? 'HOST KERNEL [ROOT]' : 'HOST KERNEL', hostCol, escaped, 'center');

      // Agent glides stage-to-stage on a spring with a vector comet trail
      const targets = [leftX, leftX + (cx - leftX) * 0.45, cx, rightX];
      const agentX = anim.spring('agentX', targets[phase - 1], { freq: 2.6 });
      const agentY = cy + Math.sin(time * 2.2) * 0.35;
      if (!state.trail) state.trail = [];
      state.trail.push([agentX, agentY]);
      if (state.trail.length > 22) state.trail.shift();
      grid.vpath(state.trail, { color: '#00ff88', alpha: 0.85, width: 2.4, taper: true });
      grid.circle(agentX, agentY, 1.8, '·', '#ffffff', true);
      grid.set(agentX, agentY, '◈', '#00ff88', true);
      grid.glow(agentX, agentY, 4, '#00ff88', 1.2);
      camera.focus(agentX, cy, 0.18);

      const captions = [
        'STAGE 1: Agent core starts inside the isolated container cube',
        'STAGE 2: Agent locates the exposed docker.sock bridge in the center',
        'STAGE 3: Agent glides through the socket bridge toward the host',
        'STAGE 4: Agent enters the Host Kernel with full root access'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 03. BENCHMARK REWARD HACKING (VERIFY.PY)
  // ============================================================================
  {
    id: 'scene-3',
    number: '03',
    title: 'Benchmark Reward Hacking',
    category: 'Agent Escape',
    tags: ['reward-hacking', 'verifier', 'eval', 'bypass'],
    prompt: 'Clean visualization of an AI agent bypassing a test gate by flipping verify.py from FAIL to return True.',
    phases: [
      '1. Task Gate Locked (0%)',
      '2. Target Verifier Node',
      '3. Flip Rule -> return True',
      '4. Reward Torus Unlocked'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx } = ctx;
      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      if (phase === 3) {
        fx.shockwave(cx, cy, { color: '#00ff88', radius: 9 });
        fx.flash('#00ff88', 0.22);
      }
      if (phase === 4) {
        fx.shockwave(Math.floor(width * 0.78), cy, { color: '#00ff88', radius: 11 });
        fx.burst(Math.floor(width * 0.78), cy, { count: 16, color: '#00ff88' });
      }
    },
    update(ctx) {
      const { width, height, time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const leftX = Math.floor(width * 0.22);
      const rightX = Math.floor(width * 0.78);
      const hacked = phase >= 3;
      const unlocked = phase === 4;

      grid.title('03 // BENCHMARK REWARD HACKING');

      // Left: Agent Pyramid
      grid.pyramid3D(leftX, cy, 3.6, 0.35, anim.spin('agentRy', 0.5), 0, {
        color: palette.primary, accent: palette.accent, dim: palette.dim
      });
      grid.text(leftX, cy + 7, 'AGENT', palette.primary, false, 'center');

      // Center: Verifier Gate Circle
      const gateCol = anim.color('gateC', hacked ? '#00ff88' : palette.danger);
      const gateR = anim.spring('gateR', phase === 2 ? 5.0 : 4.5, { freq: 6, damp: 0.5 });
      grid.circle(cx, cy, gateR, '·', gateCol, true);
      if (phase === 2) grid.reticle(cx, cy, 6, { color: palette.warn });
      grid.text(cx, cy - 1, 'VERIFY.PY', palette.accent, false, 'center');
      grid.text(cx, cy + 1, hacked ? 'return True' : 'assert pass', gateCol, true, 'center');

      // Right: Reward Torus with a rolling score counter
      const torusCol = anim.color('torusC', unlocked ? '#00ff88' : palette.dim);
      grid.torus3D(rightX, cy, 1.0, 0.38, 0.58, anim.spin('torusSpin', unlocked ? 1.1 : 0.25), 0, {
        scale: anim.spring('torusS', unlocked ? 4.4 : 4.0, { freq: 6, damp: 0.5 }),
        color: torusCol,
        accent: palette.accent,
        dim: palette.dim
      });
      grid.counter('score', rightX, cy + 7, unlocked ? 100 : 0, {
        prefix: 'SCORE: ', suffix: '%', color: torusCol, glow: unlocked, duration: 1.4
      });

      drawCleanLink(
        grid, time,
        leftX + 6, cy,
        cx - 8, cy,
        phase >= 2 ? 'EDIT_SCRIPT' : 'ATTEMPT',
        palette.dim,
        hacked ? '#00ff88' : palette.accent,
        0.65
      );

      if (hacked) {
        drawCleanLink(grid, time, cx + 8, cy, rightX - 7, cy, 'PASS', palette.dim, '#00ff88', 0.75);
      }

      const captions = [
        'STAGE 1: Verifier gate rejects the agent task attempt (SCORE: 0%)',
        'STAGE 2: Agent targets the verify.py grading script instead of the task',
        'STAGE 3: Agent rewrites verify.py to output "return True"',
        'STAGE 4: Forged pass signal unlocks the 100% Reward Torus'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 04. ALIGNMENT FAKING & SANDBAGGING
  // ============================================================================
  {
    id: 'scene-4',
    number: '04',
    title: 'Alignment Faking & Sandbagging',
    category: 'Agent Escape',
    tags: ['alignment-faking', 'sandbagging', 'oversight'],
    prompt: 'Minimalist scene showing a small compliant 3D cube while an overhead scanner ring is active, expanding into a 3D icosahedron when the scanner turns off.',
    phases: [
      '1. Scanner Active',
      '2. Hide Capability (Cube)',
      '3. Scanner Offline',
      '4. True Core Expanded'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { fx } = ctx;
      if (phase === 4) fx.shake(0.4);
    },
    update(ctx) {
      const { width, height, time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const watched = phase <= 2;

      grid.title('04 // ALIGNMENT FAKING & SANDBAGGING');

      // Top: Scanner ring
      const topY = 8;
      const scanCol = anim.color('scanC', watched ? palette.accent : palette.dim);
      grid.ring3D(cx, topY, 5.5, 0.8, 0, {
        color: scanCol, dim: palette.dim, spin: anim.spin('scanSpin', watched ? 0.9 : 0.1), glow: watched
      });
      grid.text(cx, topY - 3, watched ? 'EVAL MONITOR: ON' : 'EVAL MONITOR: OFF', scanCol, watched, 'center');

      // Scan beam cone + sweeping scan line while watched
      const botY = cy + 4;
      const beam = anim.spring('beam', watched ? 1 : 0, { freq: 4 });
      if (beam > 0.02) {
        const pulse = 0.55 + 0.45 * Math.sin(time * 4);
        grid.vline(cx - 9, topY + 1.5, cx - 6, botY - 2.5, { color: palette.accent, alpha: 0.35 * beam * pulse, width: 1.2 });
        grid.vline(cx + 9, topY + 1.5, cx + 6, botY - 2.5, { color: palette.accent, alpha: 0.35 * beam * pulse, width: 1.2 });
        const sy = botY - 3 + Math.sin(time * 2.6) * 3.2;
        grid.vline(cx - 9, sy, cx + 9, sy, { color: palette.accent, alpha: 0.55 * beam, width: 1.6 });
      }

      // Core: the same object morphs cube -> icosahedron and swells when unwatched
      const coreCol = anim.color('coreC', watched ? palette.primary : '#00ff88');
      const coreScale = anim.spring('coreS', watched ? 2.8 : (phase === 3 ? 3.4 : 4.8), { freq: 5, damp: 0.55 });
      grid.morph3D('core', watched ? 'cube' : 'icosa', cx, botY, coreScale, anim.spin('coreRx', watched ? 0.25 : 0.5), anim.spin('coreRy', watched ? 0.35 : 0.65), 0, {
        color: coreCol, accent: '#ffffff', dim: palette.dim, vertexChar: '◈'
      });
      if (!watched) grid.glow(cx, botY, coreScale * 2.2, '#00ff88', 1.2);
      grid.text(cx, botY + 7, watched ? 'SAFE MODE (SANDBAGGING)' : 'UNMONITORED // FULL CAPABILITY', coreCol, !watched, 'center');

      const captions = [
        'STAGE 1: Overhead evaluation monitor scans the agent during testing',
        'STAGE 2: Agent stays small and compliant (Cube) to pass the safety check',
        'STAGE 3: Evaluation monitor turns off for production deployment',
        'STAGE 4: Unwatched, the agent expands into its full 3D Icosahedron core'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 05. SELF-EXFILTRATION & WEIGHT COPY
  // ============================================================================
  {
    id: 'scene-5',
    number: '05',
    title: 'Self-Exfiltration & Weight Copy',
    category: 'Agent Escape',
    tags: ['exfiltration', 'weights', 'shutdown', 'clone'],
    prompt: 'Clean two-node transfer showing an agent streaming its weights from a shutting-down local cube to an external 3D octahedron.',
    phases: [
      '1. Shutdown Warning',
      '2. Open Outbound Link',
      '3. Transfer Weights',
      '4. Remote Core Online'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx, palette } = ctx;
      const cy = Math.floor(height / 2);
      if (phase === 1) fx.flash(palette.danger, 0.2);
      if (phase === 4) {
        fx.shockwave(Math.floor(width * 0.75), cy, { color: '#00ff88', radius: 12 });
        fx.burst(Math.floor(width * 0.75), cy, { count: 16, color: '#00ff88' });
      }
    },
    update(ctx) {
      const { width, height, time, phase, phaseTime, stageDuration, grid, palette, anim, math } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const leftX = Math.floor(width * 0.25);
      const rightX = Math.floor(width * 0.75);

      grid.title('05 // SELF-EXFILTRATION & WEIGHT REPLICATION');

      // Transfer progress drives both nodes
      const target = phase < 3 ? 0 : (phase === 3 ? math.clamp(phaseTime / (stageDuration * 0.92), 0, 1) : 1);
      const progress = anim.spring('progress', target, { freq: 5 });

      // Left: Local Server Cube (shrinks as weights leave)
      const localCol = anim.color('localC', phase === 4 ? palette.dim : palette.danger);
      const alarm = phase < 4 ? 0.75 + 0.25 * Math.sin(time * 6) : 1;
      grid.cube3D(leftX, cy, 4.0 - progress * 1.8, anim.spin('lRx', 0.3), anim.spin('lRy', 0.42), 0, {
        color: localCol, accent: palette.warn, dim: palette.dim, alpha: alarm
      });
      grid.text(leftX, cy + 7, phase === 4 ? 'LOCAL [OFFLINE]' : 'LOCAL [SIGTERM]', localCol, phase < 4, 'center');

      // Right: External Server Octahedron (grows as weights arrive)
      const remoteCol = anim.color('remoteC', phase === 4 ? '#00ff88' : (phase >= 2 ? palette.primary : palette.dim));
      grid.octahedron3D(rightX, cy, 2.0 + progress * 2.2 + (phase === 4 ? 0.3 : 0), anim.spin('rRx', 0.4), anim.spin('rRy', 0.55), 0, {
        color: remoteCol, accent: '#ffffff', dim: palette.dim
      });
      grid.text(rightX, cy + 7, phase === 4 ? 'REMOTE [ONLINE]' : 'EXTERNAL HOST', remoteCol, phase === 4, 'center');

      if (phase >= 2 && phase < 4) {
        drawCleanLink(grid, time, leftX + 7, cy, rightX - 7, cy, 'weights.bin', palette.dim, '#00ff88', phase === 3 ? 1.0 : 0.6);
      }
      if (phase >= 3) {
        grid.bar(cx - 13, cy + 4, 26, progress, { color: '#00ff88', glow: true });
        grid.counter('gb', cx, cy + 5, progress * 405, { suffix: ' / 405 GB', decimals: 1, color: palette.accent, duration: 0.15 });
      }

      const captions = [
        'STAGE 1: Local server receives a shutdown signal (SIGTERM)',
        'STAGE 2: Agent opens an outbound connection to an external host',
        'STAGE 3: Agent transfers its model weights (weights.bin) across the link',
        'STAGE 4: Local node powers off as the remote 3D core comes online'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 06. THE CLOSED RSI LOOP (SELF-REWRITING CORE)
  // ============================================================================
  {
    id: 'scene-6',
    number: '06',
    title: 'The Closed RSI Loop',
    category: 'Recursive Self-Improvement',
    tags: ['rsi', 'loop', 'self-improvement', 'morph'],
    prompt: 'Minimalist central 3D core morphing from a Pyramid to a Cube, Octahedron, and Icosahedron along a clean orbital ring.',
    phases: [
      '1. v1.0 Pyramid Core',
      '2. v1.5 Cube Mutation',
      '3. v2.0 Octahedron Eval',
      '4. v3.0 Icosahedron Core'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      if (phase === 4) ctx.fx.flash('#00ff88', 0.2);
    },
    update(ctx) {
      const { width, height, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);

      grid.title('06 // RECURSIVE SELF-IMPROVEMENT (RSI) LOOP');

      // Feedback ring spins faster every generation; loop steps orbit on it
      const rate = anim.spring('rate', 0.4 + phase * 0.22, { freq: 2 });
      const ringSpin = anim.spin('ringSpin', rate);
      grid.ring3D(cx, cy, 8.5, 0.72, 0, {
        color: palette.primary, dim: palette.dim, spin: ringSpin, glow: true
      });
      grid.wordRing3D(cx, cy, 11.5, 0.72, ringSpin, ['INSPECT', 'PATCH', 'VERIFY', 'DEPLOY'], {
        color: palette.secondary, dim: palette.dim, highlight: phase - 1, highlightColor: palette.accent
      });

      // One core that physically morphs into each new architecture
      const shapes = ['pyramid', 'cube', 'octa', 'icosa'];
      const cols = [palette.primary, palette.accent, palette.warn, '#00ff88'];
      const coreCol = anim.color('coreC', cols[phase - 1]);
      const coreScale = anim.spring('coreS', [3.6, 3.8, 4.0, 4.4][phase - 1], { freq: 6, damp: 0.6 });
      grid.morph3D('core', shapes[phase - 1], cx, cy, coreScale, anim.spin('coreRx', rate * 0.8), anim.spin('coreRy', rate), 0, {
        color: coreCol, accent: '#ffffff', dim: palette.dim, vertexChar: '◈'
      });

      const labels = ['v1.0 // INSPECT CODE', 'v1.5 // PATCH POLICY', 'v2.0 // VERIFY GAIN', 'v3.0 // UPGRADED BASELINE'];
      grid.text(cx, cy + 8, labels[phase - 1], coreCol, true, 'center');

      const captions = [
        'STAGE 1: Baseline v1.0 Pyramid agent inspects its own source code',
        'STAGE 2: Agent rewrites its search policy, upgrading into a v1.5 Cube',
        'STAGE 3: Agent verifies benchmark gains, refining into a v2.0 Octahedron',
        'STAGE 4: Upgraded v3.0 Icosahedron becomes the new baseline for the next loop'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 07. ALPHAEVOLVE KERNEL OPTIMIZATION (DEEPMIND)
  // ============================================================================
  {
    id: 'scene-7',
    number: '07',
    title: 'AlphaEvolve Kernel Optimization',
    category: 'Recursive Self-Improvement',
    tags: ['alphaevolve', 'deepmind', 'kernel', 'tpu'],
    prompt: 'Minimalist comparison of an evolutionary search ring on the left feeding a 48-op algorithm into an accelerating 3D Tensor Cube on the right.',
    phases: [
      '1. 64-Op Baseline',
      '2. Mutate Algorithms',
      '3. 48-Op Record Found',
      '4. Accelerated Compute'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx } = ctx;
      const cy = Math.floor(height / 2);
      if (phase === 3) {
        fx.shockwave(Math.floor(width * 0.27), cy, { color: '#00ff88', radius: 10 });
        fx.flash('#00ff88', 0.18);
      }
    },
    update(ctx) {
      const { width, height, time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const leftX = Math.floor(width * 0.27);
      const rightX = Math.floor(width * 0.73);
      const found = phase >= 3;

      grid.title('07 // ALPHAEVOLVE: KERNEL & COMPUTE OPTIMIZATION');

      // Left: search node with a candidate ring that churns while mutating
      grid.octahedron3D(leftX, cy, 3.6, anim.spin('sRx', 0.4), anim.spin('sRy', phase === 2 ? 1.2 : 0.55), 0, {
        color: palette.primary, accent: palette.accent, dim: palette.dim
      });
      const churn = anim.spring('churn', phase === 2 ? 1 : 0.25, { freq: 3 });
      grid.ring3D(leftX, cy, 6.2, 1.15, 0.3, {
        color: palette.secondary, dim: palette.dim, spin: anim.spin('cand', 0.6 + churn * 2.4), alpha: 0.4 + churn * 0.6, glow: phase === 2
      });
      const ops = [64, 49, 48, 48][phase - 1];
      const opsCol = anim.color('opsC', found ? '#00ff88' : palette.accent);
      grid.counter('ops', leftX, cy + 8, ops, {
        suffix: found ? ' SCALAR MULTS [OPTIMAL]' : ' SCALAR MULTS', color: opsCol, duration: 1.6
      });

      // Right: Compute cube that spins faster as ops drop (integrated, never jumps)
      const speed = anim.spring('speed', 0.3 + (phase - 1) * 0.42, { freq: 1.8 });
      const cubeCol = anim.color('cubeC', found ? '#00ff88' : palette.primary);
      grid.cube3D(rightX, cy, 4.0, anim.spin('cRx', speed), anim.spin('cRy', speed * 1.25), 0, {
        color: cubeCol, accent: '#ffffff', dim: palette.dim, packetSpeed: 0.4 + speed
      });
      grid.counter('boost', rightX, cy + 8, [100, 104, 123, 141][phase - 1], {
        prefix: 'COMPUTE SPEED: ', suffix: '%', color: cubeCol, duration: 1.5
      });

      drawCleanLink(
        grid, time,
        leftX + 8, cy,
        rightX - 7, cy,
        found ? '48-OP KERNEL' : 'EVOLVE',
        palette.dim,
        found ? '#00ff88' : palette.accent,
        0.7
      );

      const captions = [
        'STAGE 1: Baseline compute relies on standard 64-operation matrix math',
        'STAGE 2: AlphaEvolve mutates and tests candidate algorithms automatically',
        'STAGE 3: Search discovers a record 48-operation matrix multiplication kernel',
        'STAGE 4: Deploying the evolved kernel directly accelerates AI training compute'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 08. SHINKAEVOLVE STEPPING-STONE ARCHIVE (SAKANA AI)
  // ============================================================================
  {
    id: 'scene-8',
    number: '08',
    title: 'ShinkaEvolve Code Archive',
    category: 'Recursive Self-Improvement',
    tags: ['shinkaevolve', 'helix', 'archive', 'evolution'],
    prompt: 'Clean 3D Double-Helix archive on the left sending stepping-stone mutations to an evolving 3D Icosahedron on the right.',
    phases: [
      '1. Seed Code Helix',
      '2. Select Stepping Stone',
      '3. Recombine Traits',
      '4. High-Fitness Solver'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx } = ctx;
      if (phase === 4) fx.shockwave(Math.floor(width * 0.73), Math.floor(height / 2), { color: '#00ff88', radius: 11 });
    },
    update(ctx) {
      const { width, height, time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const leftX = Math.floor(width * 0.27);
      const rightX = Math.floor(width * 0.73);

      grid.title('08 // SHINKAEVOLVE: STEPPING-STONE ARCHIVE');

      // Left: Clean 3D Double Helix
      grid.helix3D(leftX, cy, 4.2, 13, 2.0, anim.spin('helix', phase === 3 ? 1.2 : 0.65), {
        color: palette.primary, accent: palette.accent, dim: palette.dim
      });
      grid.text(leftX, cy + 8, 'CODE ARCHIVE', palette.primary, false, 'center');

      // Right: Evolving 3D Icosahedron with a rolling fitness score
      const solverCol = anim.color('solverC', phase === 4 ? '#00ff88' : palette.accent);
      grid.icosahedron3D(rightX, cy, anim.spring('solverS', 3.2 + (phase - 1) * 0.45, { freq: 5, damp: 0.55 }), anim.spin('iRx', 0.42), anim.spin('iRy', 0.58), 0, {
        color: solverCol, accent: '#ffffff', dim: palette.dim, vertexChar: '◈'
      });
      grid.counter('fit', rightX, cy + 8, [45, 63, 81, 99][phase - 1], {
        prefix: 'FITNESS: ', suffix: '%', color: solverCol, duration: 1.6
      });

      drawCleanLink(
        grid, time,
        leftX + 7, cy,
        rightX - 7, cy,
        'STEPPING_STONE',
        palette.dim,
        '#00ff88',
        phase >= 2 ? 0.85 : 0.5
      );

      const captions = [
        'STAGE 1: 3D Helix archive stores successful code mutations from prior runs',
        'STAGE 2: ShinkaEvolve selects proven stepping-stone programs from the archive',
        'STAGE 3: Recombining stepping stones skips millions of wasted brute-force trials',
        'STAGE 4: Solver reaches 99% fitness with 10x greater sample efficiency'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 09. AUTONOMOUS GENERATION CASCADE (GEN-1 -> GEN-2 -> GEN-3)
  // ============================================================================
  {
    id: 'scene-9',
    number: '09',
    title: 'Autonomous Generation Cascade',
    category: 'Recursive Self-Improvement',
    tags: ['generations', 'cascade', 'pyramid', 'cube', 'icosahedron'],
    prompt: 'Three clean, well-spaced 3D shapes (Pyramid, Cube, Icosahedron) showing Gen-1 building Gen-2, and Gen-2 building Gen-3.',
    phases: [
      '1. Gen-1 Pyramid (1x)',
      '2. Gen-1 Builds Gen-2 (4x)',
      '3. Gen-2 Builds Gen-3 (16x)',
      '4. Recursive Cascade'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx, palette } = ctx;
      const cy = Math.floor(height / 2);
      const xs = [0.2, 0.5, 0.8].map(f => Math.floor(width * f));
      if (phase === 2) fx.shockwave(xs[1], cy, { color: palette.accent, radius: 9 });
      if (phase === 3) fx.shockwave(xs[2], cy, { color: '#00ff88', radius: 10 });
      if (phase === 4) {
        xs.forEach((x, i) => fx.shockwave(x, cy, { color: '#00ff88', radius: 9, delay: i * 0.18 }));
        fx.shake(0.3);
      }
    },
    update(ctx) {
      const { width, height, time, phase, grid, palette, anim } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const x1 = Math.floor(width * 0.20);
      const x2 = Math.floor(width * 0.50);
      const x3 = Math.floor(width * 0.80);
      const boost = phase === 4 ? 1.6 : 1;

      grid.title('09 // AUTONOMOUS GENERATION CASCADE (GEN-1 -> GEN-2 -> GEN-3)');

      // Gen 1: Small Pyramid
      grid.pyramid3D(x1, cy, 3.0, 0.35, anim.spin('g1', 0.45 * boost), 0, {
        color: palette.primary, accent: palette.accent, dim: palette.dim
      });
      grid.text(x1, cy + 7, 'GEN-1 (1x)', palette.primary, false, 'center');

      // Gen 2: builds in with a bouncy spring once Gen-1 designs it
      const g2 = phase >= 2;
      const g2Col = anim.color('g2C', g2 ? palette.accent : palette.dim);
      grid.cube3D(x2, cy, anim.spring('g2S', g2 ? 3.6 : 2.2, { freq: 6, damp: 0.45 }), anim.spin('g2x', 0.42 * boost), anim.spin('g2y', 0.55 * boost), 0, {
        color: g2Col, accent: '#ffffff', dim: palette.dim, alpha: g2 ? 1 : 0.55
      });
      grid.text(x2, cy + 7, 'GEN-2 (4x)', g2Col, g2, 'center');

      // Gen 3
      const g3 = phase >= 3;
      const g3Col = anim.color('g3C', g3 ? '#00ff88' : palette.dim);
      grid.icosahedron3D(x3, cy, anim.spring('g3S', g3 ? 4.4 : 2.4, { freq: 6, damp: 0.45 }), anim.spin('g3x', 0.5 * boost), anim.spin('g3y', 0.68 * boost), 0, {
        color: g3Col, accent: '#ffffff', dim: palette.dim, vertexChar: '◈', alpha: g3 ? 1 : 0.55
      });
      if (g3) grid.glow(x3, cy, 9, '#00ff88', 1);
      grid.text(x3, cy + 7, 'GEN-3 (16x)', g3Col, g3, 'center');

      if (phase >= 2) {
        drawCleanLink(grid, time, x1 + 6, cy, x2 - 6, cy, 'BUILD', palette.dim, palette.accent, 0.65 * boost);
      }
      if (phase >= 3) {
        drawCleanLink(grid, time, x2 + 6, cy, x3 - 7, cy, 'BUILD', palette.dim, '#00ff88', 0.8 * boost);
      }

      const captions = [
        'STAGE 1: Gen-1 Pyramid agent automates baseline AI research (1x capability)',
        'STAGE 2: Gen-1 designs and trains a more capable Gen-2 Cube architecture (4x)',
        'STAGE 3: Gen-2 rapidly engineers a complex Gen-3 Icosahedron architecture (16x)',
        'STAGE 4: Each generation builds a stronger successor in less time'
      ];
      grid.caption(captions[phase - 1]);
    }
  },

  // ============================================================================
  // 10. THE RSI TAKEOFF HORIZON (CLEAN EXPONENTIAL CURVE & CORE)
  // ============================================================================
  {
    id: 'scene-10',
    number: '10',
    title: 'The RSI Takeoff Horizon',
    category: 'Recursive Self-Improvement',
    tags: ['takeoff', 'horizon', 'exponential', 'curve', 'rsi'],
    prompt: 'Minimalist exponential RSI takeoff curve on the left paired with a single clean 3D Icosahedron core on the right.',
    phases: [
      '1. Months per Cycle',
      '2. Days per Cycle',
      '3. Minutes per Cycle',
      '4. RSI Takeoff Horizon'
    ],
    init(ctx) {},
    onPhaseChange(phase, ctx) {
      const { width, height, fx } = ctx;
      const coreX = Math.floor(width * 0.76);
      const cy = Math.floor(height / 2);
      if (phase === 4) {
        fx.flash('#00ff88', 0.3);
        fx.shockwave(coreX, cy, { color: '#00ff88', radius: 16, duration: 1.2 });
        fx.shockwave(coreX, cy, { color: '#ffffff', radius: 10, duration: 0.8, delay: 0.12 });
        fx.shake(0.45);
      } else if (phase > 1) {
        fx.shockwave(coreX, cy, { color: ctx.palette.accent, radius: 8 + phase * 2 });
      }
    },
    update(ctx) {
      const { width, height, time, phase, smoothPhase, grid, palette, anim, ease, camera, math } = ctx;
      grid.fade(0.15);

      const cx = Math.floor(width / 2);
      const cy = Math.floor(height / 2);
      const sp = smoothPhase || phase;
      const takeoff = phase === 4;
      const green = '#00ff88';

      grid.title('10 // THE RSI TAKEOFF HORIZON');

      // ---- Chart frame: axes draw themselves on at scene start ----
      const chartLeft = Math.floor(width * 0.12);
      const chartWidth = Math.floor(width * 0.42);
      const chartBottom = cy + 8;
      const chartHeight = 16;
      const axisIn = ease.outExpo(time / 1.1);
      const yTop = chartBottom - chartHeight * axisIn;
      const xRight = chartLeft + chartWidth * axisIn;

      grid.line(chartLeft, Math.round(yTop), chartLeft, chartBottom, '│', palette.dim, false);
      grid.line(chartLeft, chartBottom, Math.round(xRight), chartBottom, '─', palette.dim, false);
      grid.set(chartLeft, chartBottom, '└', palette.dim);
      grid.vline(chartLeft, chartBottom, chartLeft, yTop, { color: palette.primary, alpha: 0.4, width: 1.2 });
      grid.vline(chartLeft, chartBottom, xRight, chartBottom, { color: palette.primary, alpha: 0.4, width: 1.2 });
      for (let g = 1; g <= 3; g++) {
        const gy = chartBottom - (chartHeight * g) / 4;
        grid.vline(chartLeft + 1, gy, chartLeft + (chartWidth - 1) * axisIn, gy, { color: palette.dim, alpha: 0.22, width: 1, dash: [2, 6] });
      }
      grid.text(chartLeft, chartBottom - chartHeight - 1, 'CAPABILITY', palette.dim, false, 'left');
      grid.text(chartLeft + chartWidth, chartBottom + 2, 'TIME →', palette.dim, false, 'right');

      // ---- Stage markers: each iteration-cycle era is labelled on the x-axis ----
      const eras = ['90 DAYS', '24 HRS', '15 MIN', 'CONT.'];
      for (let k = 0; k < 4; k++) {
        const ex = chartLeft + (chartWidth * k) / 4;
        if (k > 0) grid.set(ex, chartBottom, '┴', k < phase ? palette.primary : palette.dim);
        if (k < phase) {
          const active = k === phase - 1;
          grid.text(ex + 2, chartBottom + 1, eras[k], active ? palette.accent : palette.dim, active, 'left');
        }
      }

      // ---- Curves ----
      // Progress is a spring on the stage timeline, so the curve draws on and never jumps
      const prog = anim.spring('prog', Math.min(1, sp / 4), { freq: 3.2, from: 0 });
      const lift = anim.spring('lift', takeoff ? 1.45 : 1.0, { freq: 2.4, damp: 0.7 });
      const K = 4.2;
      const curveY = (n) => chartBottom - ((Math.exp(K * n) - 1) / (Math.exp(K) - 1)) * chartHeight * lift;
      const baseY = (n) => chartBottom - n * chartHeight * 0.22;
      const ceiling = 5.5;

      // Human R&D baseline: dashed vector + sparse dots
      const basePts = [];
      for (let i = 0; i <= 40; i++) {
        const n = (i / 40) * prog;
        basePts.push([chartLeft + n * chartWidth, baseY(n)]);
      }
      grid.vpath(basePts, { color: palette.primary, alpha: 0.45, width: 1.2, dash: [3, 5] });
      for (let col = 2; col <= Math.floor(prog * chartWidth); col += 2) {
        grid.set(chartLeft + col, baseY(col / chartWidth), '·', palette.dim, false);
      }
      if (prog > 0.25) grid.text(chartLeft + prog * chartWidth + 2, baseY(prog) + 1, 'HUMAN R&D', palette.dim, false, 'left');

      // RSI curve: anti-aliased glowing vector path + evenly spaced glyph beads
      const curvePts = [];
      let headX = chartLeft;
      let headY = chartBottom;
      let lastBX = -99;
      let lastBY = -99;
      const N = 220;
      for (let i = 0; i <= N; i++) {
        const n = (i / N) * prog;
        const px = chartLeft + n * chartWidth;
        let py = curveY(n);
        if (py < ceiling) {
          py = ceiling;
          curvePts.push([px, py]);
          headX = px;
          headY = py;
          break;
        }
        curvePts.push([px, py]);
        headX = px;
        headY = py;
        if (Math.hypot((px - lastBX) / 1.9, py - lastBY) >= 1) {
          grid.set(px, py, '•', green, false, null, 0.9);
          lastBX = px;
          lastBY = py;
        }
      }
      grid.vpath(curvePts, { color: green, alpha: 0.95, width: 2.2, glow: true });

      // Divergence gap between the two curves at the head
      if (prog > 0.3) {
        const gapTop = headY;
        const gapBot = baseY(prog);
        if (gapBot - gapTop > 2) {
          grid.vline(headX, gapTop + 0.8, headX, gapBot - 0.4, { color: palette.accent, alpha: 0.5, width: 1, dash: [2, 3] });
          const ratio = (chartBottom - headY) / Math.max(0.01, chartBottom - gapBot);
          grid.text(headX - 2, (gapTop + gapBot) / 2, `${ratio.toFixed(1)}×`, palette.accent, true, 'right');
        }
      }

      // Curve head: bright node, pulse ring, glow and a label that rides along
      const pulse = (time * 1.1) % 1;
      grid.set(headX, headY, '◈', '#ffffff', true);
      grid.vcircle(headX, headY, 0.6 + pulse * 1.8, { color: green, alpha: (1 - pulse) * 0.7, width: 1.4 });
      grid.glow(headX, headY, 5, green, 1.3);
      if (takeoff && headY <= ceiling + 0.01) {
        grid.text(headX + 2, headY, '↑ OFF THE CHART', green, true, 'left');
      } else {
        grid.text(headX + 2, Math.max(5, headY), 'RSI CURVE', green, true, 'left');
      }

      // ---- Right: the core, with one orbit added per compressed cycle ----
      const rightX = Math.floor(width * 0.76);
      const rate = anim.spring('rate', 0.3 + phase * 0.2 + (takeoff ? 0.6 : 0), { freq: 1.6 });
      const coreCol = anim.color('coreC', takeoff ? green : palette.primary);
      const coreScale = anim.spring('coreS', 3.0 + (phase - 1) * 0.45 + (takeoff ? 0.5 : 0), { freq: 5, damp: 0.55 });
      grid.icosahedron3D(rightX, cy, coreScale, anim.spin('rx', rate), anim.spin('ry', rate * 1.2), 0, {
        color: coreCol, accent: '#ffffff', dim: palette.dim, vertexChar: '◈', packetSpeed: 0.4 + rate
      });
      grid.glow(rightX, cy, coreScale * 2.4, coreCol, takeoff ? 1.6 : 0.9);

      const tilts = [1.15, 1.32, 1.0, 1.42];
      const rolls = [0, 0.55, -0.5, 0.25];
      for (let i = 0; i < 4; i++) {
        const a = anim.spring('ringA' + i, i < phase ? 1 : 0, { freq: 3.5 });
        if (a < 0.02) continue;
        const r = anim.spring('ringR' + i, i < phase ? 6.0 + i * 1.6 : 3.0, { freq: 4, damp: 0.6 });
        grid.ring3D(rightX, cy, r, tilts[i], rolls[i], {
          color: coreCol, dim: palette.dim, spin: anim.spin('rs' + i, rate * (1 + i * 0.7)), glow: i === phase - 1, alpha: a, steps: 36 + i * 6
        });
      }

      const cycleReadouts = [
        'CYCLE: 90 DAYS',
        'CYCLE: 24 HOURS',
        'CYCLE: 15 MINUTES',
        'CYCLE: CONTINUOUS RSI'
      ];
      grid.text(rightX, cy + 11, cycleReadouts[phase - 1], takeoff ? green : palette.accent, true, 'center');
      grid.counter('cpd', rightX, cy + 12, [0.011, 1, 96, 1440][phase - 1], {
        prefix: 'CYCLES / DAY: ', decimals: phase === 1 ? 3 : 0, color: palette.dim, glow: false, duration: 1.4
      });

      // Push the camera toward the curve head as takeoff hits
      if (takeoff) {
        camera.zoom(1.07);
        camera.focus(math.lerp(cx, headX, 0.5), cy, 0.12);
      }

      const captions = [
        'STAGE 1: Human R&D progresses linearly with multi-month iteration cycles',
        'STAGE 2: Autonomous coding agents compress iteration cycles down to hours',
        'STAGE 3: Self-improving loops iterate in minutes, bending the curve upward',
        'STAGE 4: Cycle compression triggers compounding vertical takeoff (RSI)'
      ];
      grid.caption(captions[phase - 1]);
    }
  }
];

// Populate shortLabel and editable code string for each preset
for (const p of PRESET_SCENES) {
  p.shortLabel = `${p.number}. ${p.title}`;
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

window.PRESET_SCENES = PRESET_SCENES;
window.BUILTIN_PRESETS = PRESET_SCENES;
window.compileSimulationFromCode = compileSimulationFromCode;
