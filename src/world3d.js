// ============================================================================
// TermFX Studio - 3D World (third-person scenes)
// A small real 3D renderer in the holographic style: a perspective camera with
// position / look-at / field of view, solid dark-tinted faces sorted by depth,
// glowing edges, emissive screens and windows, and depth fog.
// On top of it: a faceless mannequin character with animated poses, and sets
// (a desk setup, a gaming room, a suburban house at night).
//
//   const w = grid.world({ from: [x, y, z], to: [x, y, z], fov: 45 });
//   w.room({ w: 6, d: 5, h: 3 });
//   w.desk({ at: [0, 0, 0] });
//   w.person({ at: [0, 0.5, 0.62], yaw: Math.PI, pose: 'typing', t: time });
//   w.render();
//   const p = w.toCells([0, 1.6, 0]);   // place 2D labels / holograms over it
// ============================================================================

(function () {
  const Engine = window.AsciiEngine;
  if (!Engine) return;

  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const rotY = (p, a) => { const c = Math.cos(a), s = Math.sin(a); return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c]; };
  const c01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const smooth = (t) => { t = c01(t); return t * t * (3 - 2 * t); };
  const hashN = (i) => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  // ---------------------------------------------------------------------------
  class World {
    constructor(engine, opts = {}) {
      this.e = engine;
      this.items = [];
      this.T = [];
      this.fog = opts.fog !== undefined ? opts.fog : 22;
      this.light = norm(opts.light || [-0.45, 0.85, 0.55]);
      this.camera(opts.from || [0, 1.6, 4], opts.to || [0, 1, 0], opts.fov || 45);
      this.pal = engine.palette;
      this.alpha = opts.alpha !== undefined ? opts.alpha : 1;
    }

    camera(from, to, fov = 45) {
      this.from = from;
      this.to = to;
      this.fov = fov;
      const f = norm(sub(to, from));
      const r = norm(cross(f, [0, 1, 0]));
      const u = cross(r, f);
      this.basis = { f, r, u };
      return this;
    }

    // Orbit a target: yaw around it, pitch above it, at distance `dist`
    orbit(target, dist, yaw, pitch = 0.25, fov = 45) {
      const from = [target[0] + Math.sin(yaw) * Math.cos(pitch) * dist, target[1] + Math.sin(pitch) * dist, target[2] + Math.cos(yaw) * Math.cos(pitch) * dist];
      return this.camera(from, target, fov);
    }

    // --- transforms -----------------------------------------------------------
    push(pos = [0, 0, 0], yaw = 0, scale = 1) { this.T.push({ pos, yaw, scale }); return this; }
    pop() { this.T.pop(); return this; }
    xf(p) {
      let q = p;
      for (let i = this.T.length - 1; i >= 0; i--) {
        const t = this.T[i];
        q = add(rotY(mul(q, t.scale), t.yaw), t.pos);
      }
      return q;
    }

    // --- primitives (style: { col, k (fill brightness), edge (alpha), emit, a }) -----
    face(pts, st = {}) {
      this.items.push({ type: 'f', pts: pts.map((p) => this.xf(p)), st });
      return this;
    }
    line(a, b, st = {}) {
      this.items.push({ type: 'l', pts: [this.xf(a), this.xf(b)], st });
      return this;
    }
    // Axis-aligned box in local space (min, max), optional yaw about its centre
    box(min, max, st = {}, yaw = 0) {
      const c = mul(add(min, max), 0.5);
      const h = mul(sub(max, min), 0.5);
      const P = (sx, sy, sz) => add(c, rotY([sx * h[0], sy * h[1], sz * h[2]], yaw));
      const v = [P(-1, -1, -1), P(1, -1, -1), P(1, -1, 1), P(-1, -1, 1), P(-1, 1, -1), P(1, 1, -1), P(1, 1, 1), P(-1, 1, 1)];
      const F = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [2, 3, 7, 6], [1, 2, 6, 5], [0, 3, 7, 4]];
      for (const f of F) this.face(f.map((i) => v[i]), st);
      return this;
    }
    // Tapered tube between two points (elliptical ends), n sides
    tube(a, b, r0, r1, st = {}, n = 7, caps = true) {
      const d = norm(sub(b, a));
      const ref = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
      const e1 = norm(cross(d, ref));
      const e2 = cross(d, e1);
      const ring = (c, r) => {
        const pts = [];
        for (let i = 0; i < n; i++) {
          const t = (i / n) * Math.PI * 2;
          pts.push(add(c, add(mul(e1, Math.cos(t) * r), mul(e2, Math.sin(t) * r))));
        }
        return pts;
      };
      const A = ring(a, r0);
      const B = ring(b, r1);
      const sst = { ...st, smooth: true };
      for (let i = 0; i < n; i++) this.face([A[i], A[(i + 1) % n], B[(i + 1) % n], B[i]], sst);
      if (caps) { this.face(A.slice().reverse(), sst); this.face(B, sst); }
      return this;
    }
    // Ellipsoid (lat-long), radii rx, ry, rz
    ellipsoid(c, rx, ry, rz, st = {}, seg = 10, rings = 7, cut = null) {
      const P = (i, j) => {
        const th = (i / seg) * Math.PI * 2;
        const ph = (j / rings) * Math.PI;
        return add(c, [Math.cos(th) * Math.sin(ph) * rx, Math.cos(ph) * ry, Math.sin(th) * Math.sin(ph) * rz]);
      };
      const sst = { ...st, smooth: true };
      const jMax = cut ? Math.ceil(rings * cut) : rings;
      for (let j = 0; j < jMax; j++) for (let i = 0; i < seg; i++) {
        this.face([P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)], sst);
      }
      return this;
    }
    // Flat polygon ring (disc) facing +y at height y
    disc(c, r, st = {}, n = 16) {
      const pts = [];
      for (let i = 0; i < n; i++) { const t = (i / n) * Math.PI * 2; pts.push(add(c, [Math.cos(t) * r, 0, Math.sin(t) * r])); }
      return this.face(pts, st);
    }
    // Ground grid (as subdivided tiles so near-plane clipping never drops the whole floor)
    floor(size = 10, step = 1, st = {}, y = 0) {
      const n = Math.round(size / step);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x0 = -size / 2 + i * step;
        const z0 = -size / 2 + j * step;
        this.face([[x0, y, z0], [x0 + step, y, z0], [x0 + step, y, z0 + step], [x0, y, z0 + step]], { k: 0.08, edge: 0.18, ...st, flat: true });
      }
      return this;
    }

    // --- projection -------------------------------------------------------------
    project(p) {
      const q = sub(p, this.from);
      const z = dot(q, this.basis.f);
      const x = dot(q, this.basis.r);
      const y = dot(q, this.basis.u);
      const e = this.e;
      const aspect = (e.cols * e.cellW) / (e.rows * e.cellH);
      const t = Math.tan((this.fov * Math.PI) / 360);
      return { u: 0.5 + x / (z * t * aspect * 2), v: 0.5 - y / (z * t * 2), z };
    }
    // Project a world point to stage cells (for 2D labels, holograms, bubbles)
    toCells(p) {
      const pr = this.project(this.xf(p));
      return { x: pr.u * this.e.cols - 0.5, y: pr.v * this.e.rows - 0.5, z: pr.z, visible: pr.z > 0.1 };
    }

    render() {
      const e = this.e;
      const pal = this.pal;
      const L = this.light;
      const fog = this.fog;
      const bg = pal.bg || '#000000';
      const out = [];
      for (const it of this.items) {
        const P = it.pts.map((p) => this.project(p));
        if (P.some((q) => q.z < 0.12)) continue;
        const z = P.reduce((s, q) => s + q.z, 0) / P.length;
        let shade = 1;
        if (it.type === 'f' && it.pts.length >= 3) {
          const n = norm(cross(sub(it.pts[1], it.pts[0]), sub(it.pts[2], it.pts[0])));
          shade = 0.35 + 0.65 * Math.abs(dot(n, L));
        }
        out.push({ it, P, z, shade });
      }
      out.sort((a, b) => b.z - a.z);
      const alpha = this.alpha;
      // A world shot frames itself: keep auto-framing and the stage push-in out of its way
      e.camFocus = { x: e.cols / 2, y: e.rows / 2, s: 1 };
      if (e.camZoomReq == null) e.camZoomReq = 1;
      e._worldShot = true;
      e.vItems.push({
        t: 'draw', h: e._hudMode,
        fn(c, X, Y, cw, chh, ws) {
          const ox = X(-0.5);
          const oy = Y(-0.5);
          const W = e.cols * cw;
          const H = e.rows * chh;
          const glowPass = ws > 1;
          for (const o of out) {
            const st = o.it.st;
            const col = st.col || pal.accent;
            const fogK = Math.max(0.12, 1 - o.z / fog);
            const pts = o.P.map((q) => [ox + q.u * W, oy + q.v * H]);
            c.beginPath();
            c.moveTo(pts[0][0], pts[0][1]);
            for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
            if (o.it.type === 'f') {
              c.closePath();
              if (st.emit) {
                c.globalCompositeOperation = 'source-over';
                c.globalAlpha = (st.a !== undefined ? st.a : 0.75) * alpha * (glowPass ? 1 : 0.9);
                c.fillStyle = col;
                c.fill();
              } else if (!glowPass) {
                c.globalCompositeOperation = 'source-over';
                c.globalAlpha = (st.fa !== undefined ? st.fa : 0.92) * alpha;
                c.fillStyle = mixColor(bg, col, Math.min(1, (st.k !== undefined ? st.k : 0.22) * o.shade * (0.55 + 0.45 * fogK)));
                c.fill();
              } else {
                // glow pass: occlude what is behind solids so bloom respects depth
                c.globalCompositeOperation = 'source-over';
                c.globalAlpha = 0.9 * alpha;
                c.fillStyle = '#000000';
                c.fill();
              }
              const ea = (st.edge !== undefined ? st.edge : (st.smooth ? 0.16 : 0.55)) * fogK * alpha;
              if (ea > 0.01) {
                c.globalCompositeOperation = 'lighter';
                c.globalAlpha = ea;
                c.strokeStyle = st.edgeCol || col;
                c.lineWidth = (st.lw || 1) * ws;
                c.stroke();
              }
            } else {
              c.globalCompositeOperation = 'lighter';
              c.globalAlpha = (st.a !== undefined ? st.a : 0.6) * fogK * alpha;
              c.strokeStyle = col;
              c.lineWidth = (st.lw || 1.2) * ws;
              c.stroke();
            }
          }
          c.globalCompositeOperation = 'lighter';
        }
      });
      return this;
    }

    // ===========================================================================
    // CHARACTER: a faceless mannequin (Fern-style), articulated and posed
    // ===========================================================================
    // person({ at, yaw, pose, t, shirt, pants, skin, hair, seated }) — `at` is the pelvis
    // for seated poses and the feet for standing ones. Returns joint world positions.
    person(o = {}) {
      const pal = this.pal;
      const t = o.t || 0;
      const pose = POSES[o.pose || 'stand'](t, o);
      const shirt = { col: o.shirt || pal.accent, k: 0.42 };
      const pants = { col: o.pants || pal.primary, k: 0.3 };
      const skin = { col: o.skin || '#dfe9f2', k: 0.62 };
      const hairSt = { col: o.hairCol || '#c8a06a', k: 0.4 };
      const seated = pose.seated;
      const base = o.at || [0, 0, 0];
      const pelvis = seated ? [0, 0, 0] : [0, 0.95 + (pose.bob || 0), 0];
      this.push(base, o.yaw || 0, o.scale || 1);
      const dirP = (pitch, roll) => [Math.sin(roll), -Math.cos(pitch) * Math.cos(roll), Math.sin(pitch) * Math.cos(roll)];
      const spine = [0, Math.cos(pose.lean), Math.sin(pose.lean)];
      const chest = add(pelvis, mul(spine, 0.5));
      const neckTop = add(chest, mul(spine, 0.07));
      const headDir = [0, Math.cos(pose.lean + pose.head), Math.sin(pose.lean + pose.head)];
      const head = add(neckTop, add(mul(headDir, 0.12), [pose.headTurn || 0, 0, 0]));
      // torso + pelvis
      this.box(add(pelvis, [-0.17, -0.07, -0.11]), add(pelvis, [0.17, 0.09, 0.11]), pants, 0);
      this.tube(add(pelvis, mul(spine, 0.06)), add(chest, mul(spine, -0.02)), 0.135, 0.17, shirt, 9);
      for (const sd of [-1, 1]) this.ellipsoid(add(chest, [sd * 0.19, -0.04, 0]), 0.065, 0.06, 0.065, shirt, 6, 4);
      this.tube(add(chest, mul(spine, -0.04)), neckTop, 0.05, 0.045, skin, 6);
      // head (faceless) + hair
      this.ellipsoid(head, 0.105, 0.13, 0.115, skin, 10, 7);
      if (o.hair !== false) this.ellipsoid(add(head, [0, 0.03, -0.012]), 0.118, 0.13, 0.13, hairSt, 10, 7, o.hairCut || 0.45);
      if (o.glasses) this.line(add(head, [-0.09, 0.01, 0.11]), add(head, [0.09, 0.01, 0.11]), { col: '#ffffff', a: 0.8, lw: 1.4 });
      const J = { head, chest, pelvis, hands: [] };
      // arms
      for (const side of [-1, 1]) {
        const A = side < 0 ? pose.armL : pose.armR;
        const sh = add(chest, [side * 0.2, -0.03, 0]);
        const elbow = add(sh, mul(dirP(A.pitch, side * A.roll), 0.29));
        const fore = dirP(A.pitch + A.bend, side * (A.froll !== undefined ? A.froll : A.roll));
        const wrist = add(elbow, mul(fore, 0.26));
        const hand = add(wrist, mul(fore, 0.06));
        this.tube(sh, elbow, 0.055, 0.047, shirt, 6);
        this.tube(elbow, wrist, 0.045, 0.036, o.sleeves === 'short' ? skin : shirt, 6);
        this.ellipsoid(hand, 0.04, 0.05, 0.045, skin, 6, 4);
        J.hands.push(hand);
      }
      // legs
      for (const side of [-1, 1]) {
        const Lg = side < 0 ? pose.legL : pose.legR;
        const hip = add(pelvis, [side * 0.1, -0.04, 0]);
        const knee = add(hip, mul(dirP(Lg.pitch, side * (Lg.roll || 0)), 0.43));
        const shinD = dirP(Lg.pitch - Lg.bend, side * (Lg.roll || 0));
        const ankle = add(knee, mul(shinD, 0.43));
        this.tube(hip, knee, 0.08, 0.06, pants, 6);
        this.tube(knee, ankle, 0.056, 0.045, pants, 6);
        this.box(add(ankle, [-0.05, -0.06, -0.05]), add(ankle, [0.05, 0.0, 0.17]), { col: '#556070', k: 0.35 });
      }
      this.pop();
      // world-space joints for props (phone in hand etc.)
      const W = (p) => add(rotY(mul(p, o.scale || 1), o.yaw || 0), base);
      return { head: W(J.head), chest: W(J.chest), hands: J.hands.map(W), handsMid: W(mul(add(J.hands[0], J.hands[1]), 0.5)) };
    }

    // ===========================================================================
    // SETS & PROPS (all in metres, y up)
    // ===========================================================================
    desk(o = {}) {
      const pal = this.pal;
      const w = o.w || 1.6, d = o.d || 0.72, h = o.h || 0.74;
      const st = { col: o.col || pal.primary, k: 0.24 };
      this.push(o.at || [0, 0, 0], o.yaw || 0);
      this.box([-w / 2, h - 0.04, -d / 2], [w / 2, h, d / 2], st);
      for (const sx of [-1, 1]) this.box([sx * (w / 2 - 0.06) - 0.03, 0, -d / 2 + 0.04], [sx * (w / 2 - 0.06) + 0.03, h - 0.04, d / 2 - 0.04], st);
      if (o.led !== false) this.line([-w / 2, h - 0.02, d / 2 + 0.001], [w / 2, h - 0.02, d / 2 + 0.001], { col: o.ledCol || '#ff3366', a: 0.9, lw: 1.6 });
      this.pop();
      return { top: h };
    }
    monitor(o = {}) {
      const pal = this.pal;
      const w = o.w || 0.62, h = o.h || 0.36;
      const st = { col: pal.primary, k: 0.2 };
      const time = this.e.time;
      this.push(o.at || [0, 0.74, -0.22], o.yaw || 0);
      this.box([-0.03, 0, -0.03], [0.03, 0.14, 0.03], st);
      this.box([-0.12, 0, -0.08], [0.12, 0.012, 0.08], st);
      this.box([-w / 2, 0.12, -0.02], [w / 2, 0.12 + h, 0.012], st);
      const scr = o.screenCol || '#2f6bff';
      const y0 = 0.135, y1 = 0.12 + h - 0.015;
      this.face([[-w / 2 + 0.015, y0, 0.0135], [w / 2 - 0.015, y0, 0.0135], [w / 2 - 0.015, y1, 0.0135], [-w / 2 + 0.015, y1, 0.0135]], { col: scr, emit: true, a: o.screenA !== undefined ? o.screenA : 0.42 });
      // screen content: lines of "code" / activity
      const rows = o.rows !== undefined ? o.rows : 7;
      for (let r = 0; r < rows; r++) {
        const y = y1 - 0.03 - r * ((y1 - y0 - 0.04) / rows);
        const len = (0.3 + 0.6 * hashN(r * 3 + Math.floor(time * (o.scroll || 0.6)))) * (w - 0.08);
        this.line([-w / 2 + 0.04, y, 0.015], [-w / 2 + 0.04 + len, y, 0.015], { col: o.textCol || '#ffffff', a: 0.55, lw: 1.1 });
      }
      this.pop();
      return { screen: add(o.at || [0, 0.74, -0.22], rotY([0, 0.12 + h / 2, 0.02], o.yaw || 0)) };
    }
    keyboard(o = {}) {
      this.push(o.at || [0, 0.74, 0.08], o.yaw || 0);
      this.box([-0.22, 0, -0.07], [0.22, 0.025, 0.07], { col: this.pal.primary, k: 0.25 });
      this.line([-0.21, 0.027, 0.065], [0.21, 0.027, 0.065], { col: o.rgb || '#ff33aa', a: 0.9, lw: 1.4 });
      for (let r = 0; r < 3; r++) this.line([-0.2, 0.027, -0.04 + r * 0.035], [0.2, 0.027, -0.04 + r * 0.035], { col: o.rgb || '#33ccff', a: 0.45 });
      this.box([0.3, 0, -0.03], [0.36, 0.022, 0.06], { col: this.pal.primary, k: 0.3 });
      this.pop();
    }
    tower(o = {}) {
      const pal = this.pal;
      const time = this.e.time;
      this.push(o.at || [0.62, 0.74, -0.12], o.yaw || 0);
      this.box([-0.1, 0, -0.2], [0.1, 0.42, 0.2], { col: pal.primary, k: 0.16 });
      this.face([[-0.101, 0.04, -0.18], [-0.101, 0.04, 0.18], [-0.101, 0.38, 0.18], [-0.101, 0.38, -0.18]], { col: '#7a3cff', emit: true, a: 0.22 });
      for (let i = 0; i < 3; i++) {
        const cy = 0.09 + i * 0.11;
        const pts = [];
        for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 + time * 3; pts.push([-0.103, cy + Math.sin(a) * 0.045, 0.09 + Math.cos(a) * 0.045]); }
        this.face(pts, { col: ['#ff3366', '#33ccff', '#00ff88'][i], emit: true, a: 0.35 });
      }
      this.pop();
    }
    chair(o = {}) {
      const pal = this.pal;
      const st = { col: o.col || '#3a4250', k: 0.35 };
      const acc = { col: o.accent || '#ff3366', k: 0.26 };
      this.push(o.at || [0, 0, 0.62], o.yaw || 0);
      this.box([-0.27, 0.42, -0.25], [0.27, 0.5, 0.25], st);
      const back = o.lean || 0.12;
      // backrest behind the sitter (-z in the chair's frame), leaning back
      this.push([0, 0.5, -0.25], 0);
      for (const [y0, y1, w0] of [[0, 0.58, 0.22], [0.58, 0.78, 0.14]]) {
        const z0 = -Math.sin(back) * y0, z1 = -Math.sin(back) * y1;
        this.box([-w0, y0, Math.min(z0, z1) - 0.04], [w0, y1, Math.max(z0, z1) + 0.04], o.gaming === false ? st : (y0 > 0 ? st : acc));
      }
      this.pop();
      for (const sx of [-1, 1]) this.box([sx * 0.3 - 0.03, 0.6, -0.18], [sx * 0.3 + 0.03, 0.64, 0.12], st);
      this.tube([0, 0.42, 0], [0, 0.12, 0], 0.03, 0.03, st, 6);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        this.line([0, 0.1, 0], [Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3], { col: pal.dim, a: 0.7, lw: 1.4 });
      }
      this.pop();
    }
    phone(at, yaw = 0, pitch = 0.6) {
      this.push(at, yaw);
      const P = (x, y) => [x, y * Math.cos(pitch), y * Math.sin(pitch)];
      this.face([P(-0.04, -0.08), P(0.04, -0.08), P(0.04, 0.08), P(-0.04, 0.08)], { col: '#33ccff', emit: true, a: 0.75 });
      this.pop();
    }
    // A room corner: floor grid, back + side walls, optional acoustic diamond panels and LED strip
    room(o = {}) {
      const pal = this.pal;
      const w = o.w || 6, d = o.d || 5, h = o.h || 2.8;
      const wall = { col: o.wallCol || pal.primary, k: o.wallK || 0.1, edge: 0.12, flat: true };
      this.floor(Math.max(w, d), 0.5, { col: pal.dim });
      const zb = -d / 2;
      const nx = Math.round(w / 0.5), ny = Math.round(h / 0.5);
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x0 = -w / 2 + i * 0.5, y0 = j * 0.5;
        this.face([[x0, y0, zb], [x0 + 0.5, y0, zb], [x0 + 0.5, y0 + 0.5, zb], [x0, y0 + 0.5, zb]], wall);
      }
      if (o.panels) {
        const cx = o.panelsX || 0;
        for (let i = -2; i <= 2; i++) for (let j = 0; j <= 2; j++) {
          if (Math.abs(i) + Math.abs(j - 1) > 2) continue;
          const px = cx + i * 0.32, py = 2.0 + (j - 1) * 0.32 - Math.abs(i) * 0.0;
          this.face([[px, py - 0.18, zb + 0.02], [px + 0.18, py, zb + 0.02], [px, py + 0.18, zb + 0.02], [px - 0.18, py, zb + 0.02]], { col: pal.accent, k: 0.22, edge: 0.4 });
        }
      }
      if (o.led) this.line([-w / 2, 0.8, zb + 0.01], [w / 2, 0.8, zb + 0.01], { col: o.led, a: 0.9, lw: 2 });
      if (o.posters) for (let i = 0; i < 4; i++) this.face([[w / 2 - 0.02, 1.0 + i * 0.36, -0.5], [w / 2 - 0.02, 1.0 + i * 0.36, -0.1], [w / 2 - 0.02, 1.3 + i * 0.36, -0.1], [w / 2 - 0.02, 1.3 + i * 0.36, -0.5]], { col: '#ffaa55', emit: true, a: 0.18 });
    }

    // A complete desk setup: desk, monitor(s), keyboard, tower, chair and (optionally) a person.
    // Returns anchors in world space: { screen, head, hands, handsMid }
    deskSetup(o = {}) {
      const at = o.at || [0, 0, 0];
      const yaw = o.yaw || 0;
      this.push(at, yaw);
      this.desk({ w: o.deskW || 1.6, led: o.led, ledCol: o.ledCol });
      const mons = o.monitors || 1;
      let scr = null;
      if (mons === 'ultrawide') scr = this.monitor({ at: [0, 0.74, -0.24], w: 1.05, h: 0.36, screenCol: o.screenCol, textCol: o.textCol, scroll: o.scroll, screenA: o.screenA, rows: o.rows });
      else if (mons === 2) {
        scr = this.monitor({ at: [-0.34, 0.74, -0.22], yaw: 0.2, screenCol: o.screenCol, textCol: o.textCol, scroll: o.scroll, screenA: o.screenA, rows: o.rows });
        this.monitor({ at: [0.34, 0.74, -0.22], yaw: -0.2, screenCol: o.screenCol2 || o.screenCol, textCol: o.textCol, scroll: o.scroll, screenA: o.screenA, rows: o.rows });
      } else scr = this.monitor({ at: [0, 0.74, -0.22], w: o.monW || 0.66, h: o.monH || 0.38, screenCol: o.screenCol, textCol: o.textCol, scroll: o.scroll, screenA: o.screenA, rows: o.rows });
      this.keyboard({ rgb: o.rgb });
      if (o.tower !== false) this.tower({});
      if (o.chair !== false) this.chair({ yaw: Math.PI, at: [0, 0, 0.66], gaming: o.gaming !== false, accent: o.chairAccent, lean: o.chairLean });
      let J = null;
      if (o.person) J = this.person({ at: [0, 0.5, 0.64], yaw: Math.PI, ...o.person });
      this.pop();
      const W = (p) => add(rotY(p, yaw), at);
      return {
        screen: W(scr ? scr.screen : [0, 1.0, -0.2]),
        head: J ? J.head : W([0, 1.25, 0.6]),
        hands: J ? J.hands : [],
        handsMid: J ? J.handsMid : W([0, 0.8, 0.3])
      };
    }

    // A two-storey suburban house with a front garage and porch (night-ready).
    // litWindows: array of indices that glow; returns window centres in world space.
    house(o = {}) {
      const pal = this.pal;
      const time = this.e.time;
      const wall = { col: o.col || pal.accent, k: 0.16, edge: 0.45 };
      const roof = { col: o.roofCol || pal.primary, k: 0.22, edge: 0.5 };
      const lit = new Set(o.lit || []);
      const warm = o.warm || '#ffc66e';
      const wins = [];
      this.push(o.at || [0, 0, 0], o.yaw || 0);
      // main block
      this.box([-4, 0, -3], [4, 5.4, 3], wall);
      this.face([[-4.3, 5.4, -3.3], [4.3, 5.4, -3.3], [4.3, 7.2, 0], [-4.3, 7.2, 0]], roof);
      this.face([[-4.3, 5.4, 3.3], [4.3, 5.4, 3.3], [4.3, 7.2, 0], [-4.3, 7.2, 0]], roof);
      this.face([[-4, 5.4, -3], [-4, 5.4, 3], [-4, 7.0, 0]], wall);
      this.face([[4, 5.4, -3], [4, 5.4, 3], [4, 7.0, 0]], wall);
      // siding lines
      for (let y = 0.5; y < 5.4; y += 0.45) this.line([0.2, y, 3.001], [4, y, 3.001], { col: pal.dim, a: 0.25, lw: 0.8 });
      // garage wing (gable faces the street)
      this.box([-7.6, 0, -1.2], [-2.6, 3.2, 4.2], wall);
      this.face([[-7.9, 3.2, -1.2], [-5.1, 5.3, -1.2], [-5.1, 5.3, 4.5], [-7.9, 3.2, 4.5]], roof);
      this.face([[-2.3, 3.2, -1.2], [-5.1, 5.3, -1.2], [-5.1, 5.3, 4.5], [-2.3, 3.2, 4.5]], roof);
      this.face([[-7.6, 3.2, 4.2], [-2.6, 3.2, 4.2], [-5.1, 5.1, 4.2]], wall);
      // garage door
      const gd = { col: pal.dim, k: 0.2, edge: 0.6 };
      this.face([[-6.9, 0, 4.21], [-3.3, 0, 4.21], [-3.3, 2.4, 4.21], [-6.9, 2.4, 4.21]], gd);
      for (let i = 1; i < 4; i++) this.line([-6.9, i * 0.6, 4.215], [-3.3, i * 0.6, 4.215], { col: pal.dim, a: 0.5 });
      for (let i = 0; i < 6; i++) { const x = -6.75 + i * 0.6; this.face([[x, 1.85, 4.22], [x + 0.45, 1.85, 4.22], [x + 0.45, 2.15, 4.22], [x, 2.15, 4.22]], { col: lit.has('garage') ? warm : pal.dim, emit: lit.has('garage'), a: 0.4, k: 0.15 }); }
      // porch
      this.box([0.4, 2.9, 3], [4.2, 3.05, 5.2], roof);
      for (const x of [0.6, 2.3, 4.0]) this.box([x - 0.08, 0, 5.0], [x + 0.08, 2.9, 5.16], wall);
      this.line([0.4, 1.0, 5.1], [4.2, 1.0, 5.1], { col: pal.accent, a: 0.6 });
      // windows (front face z = 3), upstairs and down
      const W = [[1.2, 3.9], [2.9, 3.9], [-1.2, 3.9], [1.4, 1.5], [3.0, 1.5], [-5.1, 4.1, 4.21]];
      W.forEach((wd, i) => {
        const zf = wd[2] !== undefined ? wd[2] : 3.01;
        const on = lit.has(i);
        const flick = on ? 0.6 + 0.12 * Math.sin(time * 7 + i * 3) + 0.08 * Math.sin(time * 17) : 0.18;
        const hw = i === 5 ? 0.3 : 0.45, hh = i === 5 ? 0.35 : 0.6;
        this.face([[wd[0] - hw, wd[1] - hh, zf + 0.01], [wd[0] + hw, wd[1] - hh, zf + 0.01], [wd[0] + hw, wd[1] + hh, zf + 0.01], [wd[0] - hw, wd[1] + hh, zf + 0.01]],
          on ? { col: o.screenGlow && i === o.screenGlow ? '#7fb8ff' : warm, emit: true, a: flick } : { col: pal.dim, k: 0.12, edge: 0.5 });
        this.line([wd[0], wd[1] - hh, zf + 0.02], [wd[0], wd[1] + hh, zf + 0.02], { col: pal.dim, a: 0.6 });
        this.line([wd[0] - hw, wd[1], zf + 0.02], [wd[0] + hw, wd[1], zf + 0.02], { col: pal.dim, a: 0.6 });
        wins.push(add(rotY([wd[0], wd[1], zf], o.yaw || 0), o.at || [0, 0, 0]));
      });
      // front door + porch light
      this.face([[2.0, 0, 3.01], [2.8, 0, 3.01], [2.8, 2.1, 3.01], [2.0, 2.1, 3.01]], { col: pal.primary, k: 0.25 });
      if (o.porchLight !== false) this.face([[1.7, 2.2, 3.02], [1.85, 2.2, 3.02], [1.85, 2.4, 3.02], [1.7, 2.4, 3.02]], { col: warm, emit: true, a: 0.8 });
      // satellite dish on the roof + basketball hoop over the garage
      if (o.dish !== false) { this.ellipsoid([-2.4, 6.6, 0.8], 0.45, 0.45, 0.12, { col: '#c8d4e0', k: 0.45 }, 10, 6, 0.5); this.tube([-2.4, 6.2, 0.8], [-2.4, 6.6, 0.8], 0.03, 0.03, { col: pal.dim, k: 0.3 }, 5); }
      if (o.hoop !== false) { this.face([[-5.6, 3.3, 4.23], [-4.6, 3.3, 4.23], [-4.6, 4.0, 4.23], [-5.6, 4.0, 4.23]], { col: '#ffffff', k: 0.3, edge: 0.7 }); this.line([-5.3, 3.35, 4.4], [-4.9, 3.35, 4.4], { col: '#ff8844', a: 0.9, lw: 1.6 }); }
      this.pop();
      return { windows: wins };
    }
    tree(at, h = 4, st = {}) {
      this.tube(at, add(at, [0, h * 0.25, 0]), 0.12, 0.1, { col: '#3a3020', k: 0.3, ...st }, 5);
      for (let i = 0; i < 3; i++) this.tube(add(at, [0, h * (0.2 + i * 0.22), 0]), add(at, [0, h * (0.55 + i * 0.22), 0]), h * (0.3 - i * 0.07), 0.02, { col: '#1f4a35', k: 0.35, ...st }, 7);
    }
  }

  // ---------------------------------------------------------------------------
  // POSES: joint angles (radians) as functions of time — small motions keep them alive
  // ---------------------------------------------------------------------------
  const arm = (pitch, roll, bend, froll) => ({ pitch, roll, bend, froll });
  const leg = (pitch, bend, roll = 0) => ({ pitch, bend, roll });
  const breathe = (t) => Math.sin(t * 1.6) * 0.015;
  const POSES = {
    typing: (t) => ({
      seated: true, lean: 0.14 + breathe(t), head: 0.08 + Math.sin(t * 0.7) * 0.03, headTurn: Math.sin(t * 0.4) * 0.01,
      armL: arm(0.32, 0.14, 1.12 + Math.max(0, Math.sin(t * 13)) * 0.07, 0.05), armR: arm(0.32, 0.14, 1.12 + Math.max(0, Math.sin(t * 11 + 1.3)) * 0.07, 0.05),
      legL: leg(1.5, 1.45, 0.08), legR: leg(1.5, 1.5, 0.08)
    }),
    phone: (t) => ({
      seated: true, lean: 0.22 + breathe(t), head: 0.45,
      armL: arm(0.18, 0.12, 1.55 + Math.sin(t * 5) * 0.02, -0.45), armR: arm(0.18, 0.12, 1.55 + Math.sin(t * 6 + 1) * 0.02, -0.45),
      legL: leg(1.4, 1.2, 0.18), legR: leg(1.45, 1.55, 0.12)
    }),
    think: (t) => ({
      seated: true, lean: 0.1 + breathe(t), head: -0.05 + Math.sin(t * 0.5) * 0.05, headTurn: Math.sin(t * 0.6) * 0.02,
      armL: arm(0.35, 0.15, 1.1, 0.05), armR: arm(0.75, 0.3, 2.35, -0.4),
      legL: leg(1.5, 1.45, 0.1), legR: leg(1.5, 1.5, 0.1)
    }),
    leanback: (t) => ({
      seated: true, lean: -0.22 + breathe(t), head: 0.15,
      armL: arm(0.3, 0.15, 1.5, -0.4), armR: arm(2.7, 0.55, 2.3, 0.2),
      legL: leg(1.25, 0.9, 0.15), legR: leg(1.3, 1.1, 0.1)
    }),
    watch: (t) => ({
      seated: true, lean: -0.08 + breathe(t), head: 0.02 + Math.sin(t * 0.3) * 0.02,
      armL: arm(0.25, 0.18, 1.0, 0.1), armR: arm(0.25, 0.18, 1.0, 0.1),
      legL: leg(1.45, 1.4, 0.12), legR: leg(1.45, 1.4, 0.12)
    }),
    stand: (t) => ({
      seated: false, lean: 0.02 + breathe(t), head: 0.05, bob: 0,
      armL: arm(0.05, 0.08, 0.12, 0.05), armR: arm(0.05, 0.08, 0.12, 0.05),
      legL: leg(0, 0), legR: leg(0, 0)
    }),
    walk: (t) => {
      const p = t * 6;
      const s = Math.sin(p);
      return {
        seated: false, lean: 0.06, head: 0.04, bob: Math.abs(Math.cos(p)) * 0.03,
        armL: arm(-0.35 * s, 0.08, 0.25, 0.05), armR: arm(0.35 * s, 0.08, 0.25, 0.05),
        legL: leg(0.42 * s, Math.max(0, -Math.cos(p)) * 0.6), legR: leg(-0.42 * s, Math.max(0, Math.cos(p)) * 0.6)
      };
    }
  };

  Engine.prototype.world = function (opts = {}) {
    return new World(this, opts);
  };
  window.TermFXWorld = { World, POSES };

  // Register in the scene sandbox
  const baseSandbox = Engine.prototype._buildSandbox;
  Engine.prototype._buildSandbox = function () {
    const sb = baseSandbox.call(this);
    const self = this;
    sb.grid.world = (opts) => self.world(opts || {});
    return sb;
  };
})();
