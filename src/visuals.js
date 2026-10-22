// ============================================================================
// TermFX Studio - Visual Library
// Shows *what* things are, in the holographic house style:
//   people   -> grid.portrait / grid.quote   (your photo as halftone, scanline or ASCII)
//   papers   -> grid.paper                   (3D-tilted page: title, authors, abstract)
//   data     -> grid.lineChart / barChart / donut / network
//   places   -> grid.globe                   (dotted Earth, city markers, arcs)
//   objects  -> grid.building / grid.model   (procedural buildings, any .obj model)
// Photos and .obj files live in termfx_data/assets (served at /assets/<name>).
// ============================================================================

(function () {
  const Engine = window.AsciiEngine;
  if (!Engine) return;

  const c01 = (t) => (t < 0 ? 0 : t > 1 ? 1 : t);
  const smooth = (t) => { t = c01(t); return t * t * (3 - 2 * t); };
  const hashN = (i) => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

  // --------------------------------------------------------------------------
  // Asset loading (async; scenes draw a fallback until an asset is ready)
  // --------------------------------------------------------------------------
  const assets = new Map();
  const warned = new Set();
  // Missing assets never draw text on stage (it would end up in exports)
  function warnOnce(kind, name) {
    if (warned.has(name)) return;
    warned.add(name);
    console.info(`[TermFX] ${kind} not found: put ${name} in termfx_data/assets (fallback shown)`);
  }

  function assetUrl(name) {
    if (/^(https?:|data:|\/)/.test(name)) return name;
    return '/assets/' + encodeURIComponent(name);
  }

  function getImage(name) {
    let a = assets.get('img:' + name);
    if (!a) {
      a = { status: 'loading', img: new Image() };
      a.img.onload = () => { a.status = 'ok'; };
      a.img.onerror = () => { a.status = 'missing'; };
      a.img.src = assetUrl(name);
      assets.set('img:' + name, a);
    }
    return a;
  }

  function getText(name) {
    let a = assets.get('txt:' + name);
    if (!a) {
      a = { status: 'loading', text: '' };
      fetch(assetUrl(name))
        .then(r => (r.ok ? r.text() : Promise.reject(new Error('missing'))))
        .then(t => { a.text = t; a.status = 'ok'; })
        .catch(() => { a.status = 'missing'; });
      assets.set('txt:' + name, a);
    }
    return a;
  }

  // Luminance grid (nx × ny, 0..1) from a photo, cover-cropped and auto-levelled
  const lumaCache = new Map();
  function photoLuma(img, nx, ny, ratio) {
    const key = img.src + '|' + nx + '|' + ny + '|' + (ratio || 0);
    let L = lumaCache.get(key);
    if (L) return L;
    const cv = document.createElement('canvas');
    cv.width = nx;
    cv.height = ny;
    const g = cv.getContext('2d', { willReadFrequently: true });
    const ir = img.width / img.height;
    const tr = ratio || nx / ny;
    let sw = img.width, sh = img.height, sx = 0, sy = 0;
    if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2; } else { sh = img.width / tr; sy = (img.height - sh) * 0.3; }
    g.drawImage(img, sx, sy, sw, sh, 0, 0, nx, ny);
    const d = g.getImageData(0, 0, nx, ny).data;
    L = new Float32Array(nx * ny);
    let lo = 1, hi = 0;
    for (let i = 0; i < nx * ny; i++) {
      const v = (0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]) / 255;
      L[i] = v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
    }
    const span = Math.max(0.05, hi - lo);
    for (let i = 0; i < L.length; i++) L[i] = Math.pow(c01((L[i] - lo) / span), 1.15);
    if (lumaCache.size > 64) lumaCache.clear();
    lumaCache.set(key, L);
    return L;
  }

  // Procedural head-and-shoulders, lit from the upper left (used until a photo exists)
  function silhouetteLuma(nx, ny) {
    const key = 'sil|' + nx + '|' + ny;
    let L = lumaCache.get(key);
    if (L) return L;
    L = new Float32Array(nx * ny);
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        const u = (i + 0.5) / nx;
        const v = (j + 0.5) / ny;
        const hx = (u - 0.5) / 0.25;
        const hy = (v - 0.38) / 0.21;
        const head = 1 - (hx * hx + hy * hy);
        const sx = (u - 0.5) / 0.46;
        const sy = (v - 1.08) / 0.4;
        const shoulders = 1 - (sx * sx + sy * sy);
        const neck = Math.abs(u - 0.5) < 0.08 && v > 0.55 && v < 0.75 ? 0.6 : 0;
        let val = Math.max(head > 0 ? 0.35 + 0.65 * Math.sqrt(head) : 0, shoulders > 0 ? 0.3 + 0.5 * Math.sqrt(shoulders) : 0, neck);
        val *= 0.75 + 0.35 * (1 - u) * (1 - v * 0.6);
        L[j * nx + i] = c01(val);
      }
    }
    lumaCache.set(key, L);
    return L;
  }

  // --------------------------------------------------------------------------
  // PEOPLE: portrait + quote
  // --------------------------------------------------------------------------
  // grid.portrait(name, cx, cy, { w, h, mode: 'halftone'|'scan'|'ascii', color, label, sublabel, frame })
  Engine.prototype.drawPortrait = function (name, cx, cy, opts = {}) {
    const pal = this.palette;
    const w = opts.w || 22;
    const h = opts.h || 14;
    const col = opts.color || pal.accent;
    const mode = opts.mode || 'halftone';
    const a = name ? getImage(name) : { status: 'missing' };
    const t0 = this._revealStart('§portrait:' + (opts.key || name || 'anon') + mode, cx, cy, 'p');
    const k = c01((this.time - t0) / (opts.revealTime || 1.6));
    const time = this.time;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;

    if (mode === 'ascii') {
      const ramp = ' .:-=+*#%@';
      const L = a.status === 'ok' ? photoLuma(a.img, w, h, (w * this.cellW) / (h * this.cellH)) : silhouetteLuma(w, h);
      const rows = Math.floor(k * h);
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < w; i++) {
          const v = L[j * w + i];
          if (v < 0.08) continue;
          const ch = ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))];
          const fresh = rows - j < 2 && k < 1;
          this.setCell(cx - w / 2 + i, cy - h / 2 + j, ch, fresh ? '#ffffff' : mixColor(pal.dim, col, v), fresh || v > 0.8, null, alpha * (0.35 + 0.65 * v));
        }
      }
    } else {
      this.vItems.push({
        t: 'draw', h: this._hudMode,
        fn(c, X, Y, cw, chh, ws) {
          const Wpx = w * cw;
          const Hpx = h * chh;
          const px0 = X(cx) - Wpx / 2;
          const py0 = Y(cy) - Hpx / 2;
          const pitch = opts.pitch || 4.2;
          const nx = Math.max(8, Math.round(Wpx / pitch));
          const ny = Math.max(8, Math.round(Hpx / pitch));
          const L = a.status === 'ok' ? photoLuma(a.img, nx, ny) : silhouetteLuma(nx, ny);
          const front = k * ny;
          const band = ((time * 0.35) % 1.4) * ny;
          c.fillStyle = col;
          c.strokeStyle = col;
          const lite = ws > 1;
          for (let j = 0; j < Math.min(ny, Math.ceil(front)); j++) {
            const glitch = Math.sin(time * 37 + j * 3.1) > 0.995 ? (Math.sin(j) * 4) : 0;
            const near = Math.abs(j - band) < 2 ? 1.25 : 1;
            for (let i = 0; i < nx; i++) {
              const v = L[j * nx + i];
              if (v < 0.06) continue;
              const fx = px0 + (i + 0.5) * pitch + glitch;
              const fy = py0 + (j + 0.5) * pitch;
              const fresh = front - j < 2.5 && k < 1;
              c.globalAlpha = alpha * Math.min(0.85, (0.2 + 0.65 * v) * near) * (fresh ? 1 : 0.92);
              if (fresh) c.fillStyle = '#ffffff';
              if (mode === 'scan') {
                const lw = pitch * 0.75 * v;
                if (lite) c.fillRect(fx - pitch / 2, fy - lw / 2, pitch, lw);
                else c.fillRect(fx - pitch / 2, fy - lw / 2, pitch + 0.3, Math.max(0.3, lw));
              } else {
                const r = (pitch * 0.44) * Math.sqrt(v);
                if (lite) c.fillRect(fx - r, fy - r, r * 2, r * 2);
                else { c.beginPath(); c.arc(fx, fy, Math.max(0.25, r), 0, Math.PI * 2); c.fill(); }
              }
              if (fresh) c.fillStyle = col;
            }
          }
          if (k < 1) {
            c.globalAlpha = 0.9 * alpha;
            c.fillStyle = '#ffffff';
            c.fillRect(px0 - 4, py0 + front * pitch - 0.75, Wpx + 8, 1.5);
          }
          if (opts.frame !== false) {
            const L2 = Math.min(Wpx, Hpx) * 0.12;
            c.globalAlpha = 0.7 * alpha;
            c.strokeStyle = col;
            c.lineWidth = 1.4 * ws;
            const corners = [[px0, py0, 1, 1], [px0 + Wpx, py0, -1, 1], [px0, py0 + Hpx, 1, -1], [px0 + Wpx, py0 + Hpx, -1, -1]];
            c.beginPath();
            for (const q of corners) {
              c.moveTo(q[0] + q[2] * L2, q[1]);
              c.lineTo(q[0], q[1]);
              c.lineTo(q[0], q[1] + q[3] * L2);
            }
            c.stroke();
          }
        }
      });
    }
    if (opts.label) this.drawBigText(cx, cy + h / 2 + 1.6, opts.label, { size: opts.labelSize || 1.3, color: col, alpha });
    if (opts.sublabel) this.drawText(cx, cy + h / 2 + 3.2, opts.sublabel, pal.dim, false, 'center', null, alpha);
    if (a.status === 'missing' && name) warnOnce('photo', name);
  };

  // grid.quote(text, author, cx, cy, { width, portrait, color, cps })
  Engine.prototype.drawQuote = function (text, author, cx, cy, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const maxChars = opts.width || 36;
    const words = String(text).split(/\s+/);
    const lines = [];
    let cur = '';
    for (const wd of words) {
      if ((cur + ' ' + wd).trim().length > maxChars) { lines.push(cur.trim()); cur = wd; } else cur += ' ' + wd;
    }
    if (cur.trim()) lines.push(cur.trim());
    const size = opts.size || 1.5;
    const lineGap = size * 1.45;
    let qx = cx;
    if (opts.portrait) {
      this.drawPortrait(opts.portrait, cx - (opts.portraitOffset || 30), cy, { w: 20, h: 13, label: '', frame: true, color: col });
      qx = cx + 10;
    }
    const t0 = this._revealStart('§quote:' + text, cx, cy, 'q');
    let budget = (this.time - t0) * (opts.cps || 30);
    const y0 = cy - ((lines.length - 1) * lineGap) / 2;
    this.drawBigText(qx - (maxChars * 0.62 * size) / 2 - 2, y0 - 1.2, '“', { size: 4, color: col, alpha: 0.45, reveal: false });
    lines.forEach((ln, i) => {
      const n = Math.max(0, Math.min(ln.length, Math.floor(budget)));
      budget -= ln.length;
      if (n > 0) this.drawBigText(qx, y0 + i * lineGap, ln.slice(0, n), { size, color: '#ffffff', reveal: false, alpha: 0.95 });
    });
    if (budget > 4 && author) this.drawText(qx, y0 + lines.length * lineGap + 0.8, '— ' + author, col, true, 'center');
  };

  // --------------------------------------------------------------------------
  // PAPERS & DOCUMENTS
  // --------------------------------------------------------------------------
  // grid.paper(cx, cy, { title, authors, venue, stamp, w, h, yaw, highlight, color, lines, key })
  Engine.prototype.drawPaper = function (cx, cy, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const w = opts.w || 30;
    const h = opts.h || 20;
    const key = opts.key || opts.title || 'paper';
    const t0 = this._revealStart('§paper:' + key, cx, cy, 'd');
    const time = this.time;
    const el = time - t0;
    const kIn = smooth(el / 0.9);
    const kBody = c01((el - 0.5) / 1.6);
    const baseYaw = opts.yaw !== undefined ? opts.yaw : -0.28;
    const yaw = baseYaw * (1.6 - 0.6 * kIn) + Math.sin(time * 0.5 + cx) * 0.035;
    const nLines = opts.lines || 9;
    const alpha = (opts.alpha !== undefined ? opts.alpha : 1) * kIn;
    const fs = this.fontSize;
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        const W = w * cw;
        const H = h * chh;
        c.translate(X(cx), Y(cy) + (1 - kIn) * chh * 3);
        c.transform(Math.cos(yaw), Math.sin(yaw) * 0.22, 0, 1, 0, 0);
        const x0 = -W / 2;
        const y0 = -H / 2;
        const fold = W * 0.1;
        c.globalAlpha = 0.06 * alpha;
        c.fillStyle = col;
        c.beginPath();
        c.moveTo(x0, y0); c.lineTo(x0 + W - fold, y0); c.lineTo(x0 + W, y0 + fold); c.lineTo(x0 + W, y0 + H); c.lineTo(x0, y0 + H); c.closePath();
        c.fill();
        c.globalAlpha = 0.85 * alpha;
        c.strokeStyle = col;
        c.lineWidth = 1.3 * ws;
        c.stroke();
        c.beginPath();
        c.moveTo(x0 + W - fold, y0); c.lineTo(x0 + W - fold, y0 + fold); c.lineTo(x0 + W, y0 + fold);
        c.globalAlpha = 0.5 * alpha;
        c.stroke();
        const pad = W * 0.08;
        let y = y0 + pad;
        c.textAlign = 'left';
        c.textBaseline = 'top';
        if (opts.venue) {
          c.globalAlpha = 0.6 * alpha;
          c.fillStyle = col;
          c.font = `600 ${fs * 0.62}px "Cascadia Mono", Consolas, monospace`;
          c.fillText(String(opts.venue).toUpperCase(), x0 + pad, y);
          y += fs * 1.1;
        }
        if (opts.title) {
          c.font = `700 ${fs * (opts.titleScale || 1.05)}px "Cascadia Mono", Consolas, monospace`;
          c.fillStyle = '#ffffff';
          c.globalAlpha = 0.95 * alpha;
          const words = String(opts.title).split(/\s+/);
          let line = '';
          const maxW = W - pad * 2 - fold * 0.3;
          const tl = [];
          for (const wd of words) {
            const test = (line + ' ' + wd).trim();
            if (c.measureText(test).width > maxW && line) { tl.push(line); line = wd; } else line = test;
          }
          if (line) tl.push(line);
          for (const ln of tl.slice(0, 3)) { c.fillText(ln, x0 + pad, y); y += fs * 1.25; }
        }
        if (opts.authors) {
          c.font = `500 ${fs * 0.68}px "Cascadia Mono", Consolas, monospace`;
          c.fillStyle = col;
          c.globalAlpha = 0.7 * alpha;
          c.fillText(opts.authors, x0 + pad, y + 2);
          y += fs * 1.2;
        }
        c.globalAlpha = 0.35 * alpha;
        c.fillRect(x0 + pad, y + 2, W - pad * 2, 1);
        y += fs * 0.8;
        const lineH = Math.max(fs * 0.62, (y0 + H - pad - y) / nLines);
        for (let i = 0; i < nLines; i++) {
          const rv = c01(kBody * nLines - i);
          if (rv <= 0) break;
          const lw = (W - pad * 2) * (i === nLines - 1 ? 0.55 : 0.82 + hashN(i + key.length) * 0.18) * rv;
          const ly = y + i * lineH;
          if (opts.highlight === i && kBody > 0.95) {
            c.globalAlpha = 0.25 * alpha * (0.7 + 0.3 * Math.sin(time * 4));
            c.fillStyle = opts.highlightColor || pal.warn;
            c.fillRect(x0 + pad - 3, ly - lineH * 0.25, lw + 6, lineH * 0.9);
            c.fillStyle = col;
          }
          const mark = opts.lineColor ? opts.lineColor(i) : null;
          c.globalAlpha = (opts.highlight === i || mark ? 0.9 : 0.35) * alpha;
          if (mark) c.fillStyle = mark;
          c.fillRect(x0 + pad, ly, lw, Math.max(1.4, lineH * 0.28));
          if (mark) c.fillStyle = col;
        }
        if (opts.stamp && kBody > 0.6) {
          c.save();
          c.translate(x0 + W - pad - fs * 2.5, y0 + H - pad - fs * 1.2);
          c.rotate(-0.18);
          c.globalAlpha = 0.85 * alpha;
          c.strokeStyle = opts.stampColor || pal.warn;
          c.fillStyle = opts.stampColor || pal.warn;
          c.lineWidth = 1.6 * ws;
          c.font = `800 ${fs * 0.8}px "Cascadia Mono", Consolas, monospace`;
          const sw = c.measureText(opts.stamp).width + fs * 0.8;
          c.strokeRect(-sw / 2, -fs * 0.65, sw, fs * 1.3);
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(opts.stamp, 0, 0);
          c.restore();
        }
      }
    });
  };

  // --------------------------------------------------------------------------
  // DATA: line chart, bar chart, donut, network
  // --------------------------------------------------------------------------
  function revealK(engine, key, x, y, dur) {
    const t0 = engine._revealStart('§chart:' + key, x, y, 'c');
    return smooth((engine.time - t0) / dur);
  }

  // grid.lineChart(x, y, w, h, [{ values, color, label }], { yMax, xLabels, progress, key })
  Engine.prototype.drawLineChart = function (x, y, w, h, series, opts = {}) {
    const pal = this.palette;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'line' + x, x, y, opts.duration || 2.2);
    const yMax = opts.yMax || Math.max(...series.flatMap(s => s.values));
    this._vline(x, y + h, x + w, y + h, pal.dim, 0.5, 1);
    this._vline(x, y, x, y + h, pal.dim, 0.35, 1);
    for (let g = 1; g <= 3; g++) this._vline(x, y + h - (h * g) / 4, x + w, y + h - (h * g) / 4, pal.dim, 0.14, 1, [2, 5]);
    if (opts.xLabels) opts.xLabels.forEach((l, i) => this.drawText(x + (w * i) / Math.max(1, opts.xLabels.length - 1), y + h + 1.4, l, pal.dim, false, 'center'));
    series.forEach((s, si) => {
      const n = s.values.length;
      const pts = [];
      const upto = p * (n - 1);
      for (let i = 0; i <= Math.floor(upto); i++) pts.push([x + (w * i) / (n - 1), y + h - (h * s.values[i]) / yMax]);
      const f = upto - Math.floor(upto);
      if (Math.floor(upto) < n - 1 && f > 0) {
        const a = s.values[Math.floor(upto)];
        const b = s.values[Math.floor(upto) + 1];
        pts.push([x + (w * upto) / (n - 1), y + h - (h * (a + (b - a) * f)) / yMax]);
      }
      const col = s.color || [pal.accent, '#00ff88', pal.warn, pal.primary][si % 4];
      if (pts.length > 1) this._vpath(pts, { color: col, alpha: 0.95, width: s.width || 2.4, glow: true, dash: s.dash || null });
      const end = pts[pts.length - 1];
      if (end) {
        this._vdot(end[0], end[1], 2.8, '#ffffff', 1);
        if (s.label && p > 0.98) this.drawBigText(end[0] + 2, end[1], s.label, { size: 0.95, color: col, align: 'left' });
      }
    });
  };

  // grid.barChart(x, y, w, h, [{ value, label, color }], { yMax, format, key })
  Engine.prototype.drawBarChart = function (x, y, w, h, bars, opts = {}) {
    const pal = this.palette;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'bar' + x, x, y, opts.duration || 1.8);
    const yMax = opts.yMax || Math.max(...bars.map(b => b.value));
    const n = bars.length;
    const slot = w / n;
    this._vline(x, y + h, x + w, y + h, pal.dim, 0.5, 1);
    bars.forEach((b, i) => {
      const local = smooth(p * 1.4 - i * 0.12);
      const bx = x + slot * (i + 0.5);
      const bh = (h * b.value / yMax) * local;
      const col = b.color || pal.accent;
      const bw = slot * 0.5;
      this.vItems.push({
        t: 'draw', h: this._hudMode,
        fn(c, X, Y, cw, chh) {
          const x0 = X(bx - bw / 2), x1 = X(bx + bw / 2), yb = Y(y + h), yt = Y(y + h - bh);
          const g = c.createLinearGradient(0, yt, 0, yb);
          g.addColorStop(0, col);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          c.globalAlpha = 0.55;
          c.fillStyle = g;
          c.fillRect(x0, yt, x1 - x0, yb - yt);
          c.globalAlpha = 0.95;
          c.fillStyle = '#ffffff';
          c.fillRect(x0, yt - 1, x1 - x0, 2);
        }
      });
      const shown = b.value * local;
      const txt = opts.format ? opts.format(shown) : (b.value < 10 ? shown.toFixed(1) : Math.round(shown).toLocaleString('en-US'));
      if (local > 0.05) this.drawBigText(bx, y + h - bh - 1.6, txt, { size: opts.valueSize || 1.2, color: col, reveal: false });
      if (b.label) this.drawText(bx, y + h + 1.4, b.label, pal.dim, false, 'center');
    });
  };

  // grid.donut(cx, cy, r, [{ value, color, label }], { center, key })
  Engine.prototype.drawDonut = function (cx, cy, r, segs, opts = {}) {
    const pal = this.palette;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'donut' + cx, cx, cy, opts.duration || 1.8);
    const total = segs.reduce((a, s) => a + s.value, 0) || 1;
    let a0 = -Math.PI / 2;
    const sweepTotal = Math.PI * 2 * p;
    let used = 0;
    segs.forEach((s, i) => {
      const span = (s.value / total) * Math.PI * 2;
      const vis = Math.max(0, Math.min(span, sweepTotal - used));
      used += span;
      const col = s.color || [pal.accent, '#00ff88', pal.warn, pal.primary, pal.danger][i % 5];
      if (vis > 0.01) {
        const pts = [];
        const steps = Math.max(4, Math.ceil(vis * 24));
        for (let k = 0; k <= steps; k++) {
          const a = a0 + 0.02 + (vis - 0.04) * (k / steps);
          pts.push([cx + Math.cos(a) * r * 1.85, cy + Math.sin(a) * r]);
        }
        this._vpath(pts, { color: col, alpha: 0.95, width: opts.thickness || 5, glow: true });
        if (s.label && vis >= span - 0.01) {
          const am = a0 + span / 2;
          this.drawText(cx + Math.cos(am) * (r + 3) * 1.85, cy + Math.sin(am) * (r + 2.2), s.label, col, false, 'center');
        }
      }
      a0 += span;
    });
    if (opts.center) this.drawBigText(cx, cy, opts.center, { size: opts.centerSize || 2.2, color: opts.centerColor || '#ffffff' });
  };

  // grid.network([{ x, y, label, color, r }], [[a, b], ...], { packets, key })
  Engine.prototype.drawNetwork = function (nodes, edges, opts = {}) {
    const pal = this.palette;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'net', nodes[0]?.x || 0, nodes[0]?.y || 0, opts.duration || 2);
    edges.forEach((e, i) => {
      const a = nodes[e[0]];
      const b = nodes[e[1]];
      if (!a || !b) return;
      const k = smooth(p * 1.5 - (i / edges.length) * 0.5);
      if (k <= 0) return;
      const ex = a.x + (b.x - a.x) * k;
      const ey = a.y + (b.y - a.y) * k;
      this._vline(a.x, a.y, ex, ey, e[2] || pal.primary, 0.35, 1.2);
      if (opts.packets !== false && k >= 1) {
        const t = (this.time * 0.5 + i * 0.37) % 1;
        this._vdot(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, 1.6, e[2] || pal.accent, 0.9);
      }
    });
    nodes.forEach((n, i) => {
      const k = smooth(p * 2 - (i / nodes.length));
      if (k <= 0) return;
      const col = n.color || pal.accent;
      this._vdot(n.x, n.y, (n.r || 2.6) * k, col, 1);
      this.addGlow(n.x, n.y, 2.5, col, 0.8 * k);
      if (n.label) this.drawText(n.x, n.y + 1.6, n.label, col, false, 'center', null, k);
    });
  };

  // --------------------------------------------------------------------------
  // OBJECTS: procedural buildings + .obj models
  // --------------------------------------------------------------------------
  const buildingCache = new Map();
  function box(V, E, x0, y0, z0, x1, y1, z1) {
    const b = V.length;
    V.push([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]);
    E.push([b, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b], [b + 4, b + 5], [b + 5, b + 6], [b + 6, b + 7], [b + 7, b + 4], [b, b + 4], [b + 1, b + 5], [b + 2, b + 6], [b + 3, b + 7]);
  }
  function ring(V, E, x0, z0, x1, z1, y) {
    const b = V.length;
    V.push([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);
    E.push([b, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b]);
  }
  function seg(V, E, a, b) {
    const i = V.length;
    V.push(a, b);
    E.push([i, i + 1]);
  }

  // Model space: y is up (0 = ground). Converted to screen space when drawn.
  function buildModel(kind) {
    if (buildingCache.has(kind)) return buildingCache.get(kind);
    const V = [];
    const E = [];
    const W = [];
    if (kind === 'tower') {
      const hw = 0.32;
      const H = 2.6;
      box(V, E, -hw, 0, -hw, hw, H, hw);
      for (let f = 1; f < 13; f++) ring(V, E, -hw, -hw, hw, hw, (f * H) / 13);
      box(V, E, -hw * 0.6, H, -hw * 0.6, hw * 0.6, H + 0.18, hw * 0.6);
      seg(V, E, [0, H + 0.18, 0], [0, H + 0.6, 0]);
      for (let f = 0; f < 13; f++) for (let k = 0; k < 3; k++) {
        const y = ((f + 0.5) * H) / 13;
        const o = -hw + ((k + 0.5) * 2 * hw) / 3;
        W.push([o, y, hw], [hw, y, o], [o, y, -hw], [-hw, y, o]);
      }
    } else if (kind === 'datacenter') {
      const hx = 1.2, hz = 0.55, H = 0.5;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      for (let i = 1; i < 12; i++) {
        const x = -hx + (i * 2 * hx) / 12;
        seg(V, E, [x, 0, hz], [x, H, hz]);
        seg(V, E, [x, 0, -hz], [x, H, -hz]);
      }
      for (let u = 0; u < 4; u++) {
        const x = -hx + 0.35 + u * 0.55;
        box(V, E, x - 0.14, H, -0.18, x + 0.14, H + 0.14, 0.18);
      }
      for (let i = 0; i < 22; i++) for (let r = 0; r < 2; r++) W.push([-hx + 0.1 + i * 0.105, 0.12 + r * 0.16, hz]);
    } else if (kind === 'lab') {
      const hx = 0.9, hz = 0.38, H = 0.62;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      for (let i = 1; i < 11; i++) {
        const x = -hx + (i * 2 * hx) / 11;
        seg(V, E, [x, 0, hz], [x, H, hz]);
      }
      ring(V, E, -hx, -hz, hx, hz, H / 2);
      box(V, E, hx - 0.05, 0, -0.3, hx + 0.55, 1.3, 0.3);
      for (let f = 1; f < 6; f++) ring(V, E, hx - 0.05, -0.3, hx + 0.55, 0.3, (f * 1.3) / 6);
      box(V, E, -0.25, 0.32, hz, 0.25, 0.36, hz + 0.25);
      for (let i = 0; i < 10; i++) for (let r = 0; r < 2; r++) W.push([-hx + 0.09 + i * 0.163, 0.15 + r * 0.31, hz]);
    } else if (kind === 'rack') {
      const hx = 0.32, hz = 0.4, H = 1.9;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      for (let u = 1; u < 12; u++) ring(V, E, -hx, -hz, hx, hz, (u * H) / 12);
      for (let u = 0; u < 12; u++) for (let l = 0; l < 3; l++) W.push([-hx + 0.08 + l * 0.08, ((u + 0.5) * H) / 12, hz]);
    } else if (kind === 'gpu') {
      const hx = 1.1, hz = 0.45, H = 0.16;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      for (let f = 0; f < 3; f++) {
        const fx = -0.7 + f * 0.7;
        const b = V.length;
        const N = 16;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([fx + Math.cos(a) * 0.3, H, Math.sin(a) * 0.3]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          seg(V, E, [fx, H, 0], [fx + Math.cos(a) * 0.28, H, Math.sin(a) * 0.28]);
        }
      }
      box(V, E, -hx + 0.1, -0.12, hz - 0.02, hx - 0.6, 0, hz);
      for (let i = 0; i < 8; i++) W.push([-hx + 0.2 + i * 0.25, 0.08, hz]);
    } else if (kind === 'laptop') {
      const hx = 0.8, hz = 0.55;
      box(V, E, -hx, 0, -hz, hx, 0.05, hz);
      const b = V.length;
      V.push([-hx, 0.05, -hz], [hx, 0.05, -hz], [hx, 1.05, -hz - 0.18], [-hx, 1.05, -hz - 0.18]);
      E.push([b, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b]);
      ring(V, E, -0.6, -0.2, 0.6, 0.35, 0.05);
      for (let r = 0; r < 5; r++) for (let i = 0; i < 6; i++) W.push([-0.6 + i * 0.22 + 0.1, 0.25 + r * 0.17, -hz - 0.06 - r * 0.03]);
    } else if (kind === 'chip') {
      const h = 0.7;
      box(V, E, -h, 0, -h, h, 0.12, h);
      box(V, E, -0.35, 0.12, -0.35, 0.35, 0.18, 0.35);
      for (let i = 0; i < 7; i++) {
        const o = -h + 0.15 + i * 0.2;
        seg(V, E, [o, 0.06, h], [o, 0.06, h + 0.22]);
        seg(V, E, [o, 0.06, -h], [o, 0.06, -h - 0.22]);
        seg(V, E, [h, 0.06, o], [h + 0.22, 0.06, o]);
        seg(V, E, [-h, 0.06, o], [-h - 0.22, 0.06, o]);
      }
      for (let i = 0; i < 9; i++) W.push([-0.24 + (i % 3) * 0.24, 0.19, -0.24 + Math.floor(i / 3) * 0.24]);
    } else if (kind === 'hall') {
      // Datacenter hall, roof cut away: raised floor, three rack rows, cable trays, cooling units
      const hx = 1.35, hz = 0.85, H = 0.8;
      ring(V, E, -hx, -hz, hx, hz, 0);
      for (let i = 1; i < 10; i++) seg(V, E, [-hx + (i * 2 * hx) / 10, 0, -hz], [-hx + (i * 2 * hx) / 10, 0, hz]);
      for (let i = 1; i < 6; i++) seg(V, E, [-hx, 0, -hz + (i * 2 * hz) / 6], [hx, 0, -hz + (i * 2 * hz) / 6]);
      for (const c of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) seg(V, E, [c[0], 0, c[1]], [c[0], H, c[1]]);
      ring(V, E, -hx, -hz, hx, hz, H);
      const rows = [-0.5, 0, 0.5];
      rows.forEach((rz) => {
        const x0 = -1.0, x1 = 1.0, d = 0.11, h = 0.46;
        box(V, E, x0, 0, rz - d, x1, h, rz + d);
        for (let r = 1; r < 9; r++) {
          const x = x0 + (r * (x1 - x0)) / 9;
          seg(V, E, [x, 0, rz + d], [x, h, rz + d]);
          seg(V, E, [x, 0, rz - d], [x, h, rz - d]);
        }
        seg(V, E, [x0, 0.6, rz], [x1, 0.6, rz]);
        seg(V, E, [x0, h, rz], [x0, 0.6, rz]);
        seg(V, E, [x1, h, rz], [x1, 0.6, rz]);
        for (let r = 0; r < 9; r++) for (let l = 0; l < 3; l++) W.push([x0 + ((r + 0.5) * (x1 - x0)) / 9, 0.1 + l * 0.12, rz + d]);
      });
      box(V, E, -hx + 0.05, 0, -0.75, -hx + 0.25, 0.55, -0.35);
      box(V, E, -hx + 0.05, 0, 0.35, -hx + 0.25, 0.55, 0.75);
    } else if (kind === 'bank') {
      box(V, E, -0.95, 0, -0.55, 0.95, 0.06, 0.55);
      box(V, E, -0.85, 0.06, -0.47, 0.85, 0.12, 0.47);
      box(V, E, -0.72, 0.12, -0.38, 0.72, 0.78, 0.3);
      for (let i = 0; i < 6; i++) {
        const x = -0.62 + i * 0.248;
        box(V, E, x - 0.035, 0.12, 0.36, x + 0.035, 0.78, 0.43);
      }
      box(V, E, -0.85, 0.78, -0.47, 0.85, 0.88, 0.47);
      const b = V.length;
      V.push([-0.85, 0.88, 0.47], [0.85, 0.88, 0.47], [0, 1.18, 0.47], [-0.85, 0.88, -0.47], [0.85, 0.88, -0.47], [0, 1.18, -0.47]);
      E.push([b, b + 2], [b + 1, b + 2], [b + 3, b + 5], [b + 4, b + 5], [b + 2, b + 5]);
      W.push([0, 0.3, 0.31], [0, 0.45, 0.31], [-0.3, 0.45, 0.31], [0.3, 0.45, 0.31]);
    } else if (kind === 'gate') {
      box(V, E, -0.62, 0, -0.16, -0.44, 1.15, 0.16);
      box(V, E, 0.44, 0, -0.16, 0.62, 1.15, 0.16);
      box(V, E, -0.62, 1.15, -0.16, 0.62, 1.28, 0.16);
      ring(V, E, -0.7, -0.5, 0.7, 0.5, 0);
      for (let i = 0; i < 9; i++) {
        W.push([-0.44, 0.15 + i * 0.11, 0.0], [0.44, 0.15 + i * 0.11, 0.0]);
      }
    } else if (kind === 'padlock') {
      box(V, E, -0.45, 0, -0.16, 0.45, 0.62, 0.16);
      for (const z of [-0.05, 0.05]) {
        const b = V.length;
        const N = 14;
        for (let k = 0; k <= N; k++) {
          const a = Math.PI * (k / N);
          V.push([Math.cos(a) * 0.3, 0.88 + Math.sin(a) * 0.3, z]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + k + 1]);
        seg(V, E, [0.3, 0.62, z], [0.3, 0.88, z]);
        seg(V, E, [-0.3, 0.62, z], [-0.3, 0.88, z]);
      }
      const kb = V.length;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        V.push([Math.cos(a) * 0.07, 0.38 + Math.sin(a) * 0.07, 0.16]);
      }
      for (let k = 0; k < 10; k++) E.push([kb + k, kb + ((k + 1) % 10)]);
      seg(V, E, [0, 0.31, 0.16], [0, 0.16, 0.16]);
      W.push([0, 0.38, 0.17]);
    } else if (kind === 'stopwatch') {
      for (const z of [-0.08, 0.08]) {
        const b = V.length;
        const N = 28;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * 0.62, 0.7 + Math.sin(a) * 0.62, z]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      }
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        seg(V, E, [Math.cos(a) * 0.62, 0.7 + Math.sin(a) * 0.62, -0.08], [Math.cos(a) * 0.62, 0.7 + Math.sin(a) * 0.62, 0.08]);
      }
      box(V, E, -0.08, 1.32, -0.06, 0.08, 1.44, 0.06);
      box(V, E, -0.14, 1.44, -0.07, 0.14, 1.5, 0.07);
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * Math.PI * 2;
        W.push([Math.cos(a) * 0.52, 0.7 + Math.sin(a) * 0.52, 0.09]);
      }
    } else if (kind === 'magnifier') {
      for (const z of [-0.04, 0.04]) for (const r of [0.42, 0.5]) {
        const b = V.length;
        const N = 26;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * r, 0.95 + Math.sin(a) * r, z]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      }
      const hb = V.length;
      V.push([0.33, 0.58, -0.05], [0.4, 0.62, -0.05], [0.95, 0.02, -0.05], [0.88, -0.02, -0.05], [0.33, 0.58, 0.05], [0.4, 0.62, 0.05], [0.95, 0.02, 0.05], [0.88, -0.02, 0.05]);
      E.push([hb, hb + 1], [hb + 1, hb + 2], [hb + 2, hb + 3], [hb + 3, hb], [hb + 4, hb + 5], [hb + 5, hb + 6], [hb + 6, hb + 7], [hb + 7, hb + 4], [hb, hb + 4], [hb + 2, hb + 6]);
      W.push([-0.18, 1.12, 0.05]);
    } else if (kind === 'workstation') {
      box(V, E, -0.95, 0.52, -0.42, 0.95, 0.57, 0.42);
      for (const c of [[-0.9, -0.38], [0.9, -0.38], [0.9, 0.38], [-0.9, 0.38]]) seg(V, E, [c[0], 0, c[1]], [c[0], 0.52, c[1]]);
      box(V, E, -0.5, 0.66, -0.3, 0.5, 1.22, -0.25);
      seg(V, E, [0, 0.57, -0.28], [0, 0.66, -0.28]);
      ring(V, E, -0.12, -0.34, 0.12, -0.22, 0.57);
      ring(V, E, -0.38, 0.02, 0.38, 0.2, 0.575);
      ring(V, E, -0.25, 0.62, 0.25, 0.95, 0.36);
      seg(V, E, [-0.25, 0.36, 0.95], [-0.25, 0.85, 1.0]);
      seg(V, E, [0.25, 0.36, 0.95], [0.25, 0.85, 1.0]);
      seg(V, E, [-0.25, 0.85, 1.0], [0.25, 0.85, 1.0]);
      seg(V, E, [0, 0, 0.78], [0, 0.36, 0.78]);
      for (let r = 0; r < 5; r++) for (let i = 0; i < 7; i++) if (hashN(r * 7 + i) > 0.25) W.push([-0.4 + i * 0.12, 1.12 - r * 0.1, -0.24]);
    } else if (kind === 'monitor') {
      box(V, E, -0.9, 0.3, -0.05, 0.9, 1.3, 0.05);
      seg(V, E, [0, 0.05, -0.02], [0, 0.3, -0.02]);
      ring(V, E, -0.3, -0.2, 0.3, 0.15, 0.05);
      for (let r = 0; r < 7; r++) for (let i = 0; i < 12; i++) if (hashN(r * 12 + i + 3) > 0.3) W.push([-0.75 + i * 0.125, 1.18 - r * 0.12, 0.06]);
    } else {
      const hx = 0.5, hz = 0.38, H = 0.45;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      const b = V.length;
      V.push([-hx, H + 0.35, 0], [hx, H + 0.35, 0]);
      E.push([b, b + 1], [b, 4], [b, 7], [b + 1, 5], [b + 1, 6]);
      box(V, E, -0.1, 0, hz, 0.1, 0.26, hz);
      W.push([-0.3, 0.25, hz], [0.3, 0.25, hz]);
    }
    let maxY = 0;
    for (const v of V) if (v[1] > maxY) maxY = v[1];
    const m = { V, E, W, maxY };
    buildingCache.set(kind, m);
    return m;
  }

  // grid.building(kind, cx, cy, scale, rotY, { progress, tilt, color, windows })
  Engine.prototype.drawBuilding = function (kind, cx, cy, scale, rotY, opts = {}) {
    const pal = this.palette;
    const m = buildModel(kind || 'tower');
    const p = opts.progress !== undefined ? opts.progress : revealK(this, 'b:' + kind + cx, cx, cy, opts.duration || 1.8);
    const cap = m.maxY * c01(p);
    const yc = m.maxY / 2;
    // Spin about the building's own vertical axis, then tilt toward camera (keeps it upright)
    const cy0 = Math.cos(rotY), sy0 = Math.sin(rotY);
    const toScreen = (v, clamp) => {
      const y = clamp ? Math.min(v[1], cap) : v[1];
      return [v[0] * cy0 + v[2] * sy0, -(y - yc), -v[0] * sy0 + v[2] * cy0];
    };
    const verts = m.V.map(v => toScreen(v, true));
    const col = opts.color || pal.accent;
    // Positive tilt looks down onto the roof
    const tilt = -(opts.tilt !== undefined ? opts.tilt : 0.32);
    this.drawWireframe3D(verts, m.E, cx, cy, { scale, rotX: tilt, rotY: 0, rotZ: 0, color: col, dim: pal.dim, ascii: false, vertices: false, packets: false, alpha: opts.alpha });
    const gy = this.project3D(0, yc, 0, cx, cy, tilt, 0, 0, scale).y;
    if (opts.windows !== false) {
      for (let i = 0; i < m.W.length; i++) {
        const w = m.W[i];
        if (w[1] > cap) continue;
        const q = toScreen(w, false);
        const pr = this.project3D(q[0], q[1], q[2], cx, cy, tilt, 0, 0, scale);
        if (pr.z < -0.05) continue;
        const lit = Math.sin(this.time * (0.4 + hashN(i) * 1.6) + i) > -0.2;
        if (lit) this._vdot(pr.x, pr.y, 1.1, opts.windowColor || pal.warn, 0.75);
      }
    }
    if (kind === 'stopwatch') {
      // Sweep hand: one turn every `opts.handPeriod` seconds
      const ang = (this.time / (opts.handPeriod || 4)) * Math.PI * 2;
      const c0 = toScreen([0, 0.7, 0.09], false);
      const c1 = toScreen([Math.sin(ang) * 0.5, 0.7 + Math.cos(ang) * 0.5, 0.09], false);
      const a0 = this.project3D(c0[0], c0[1], c0[2], cx, cy, tilt, 0, 0, scale);
      const a1 = this.project3D(c1[0], c1[1], c1[2], cx, cy, tilt, 0, 0, scale);
      this._vline(a0.x, a0.y, a1.x, a1.y, '#ffffff', 0.95, 2);
      this._vdot(a0.x, a0.y, 2, '#ffffff', 1);
    }
    if (opts.label) this.drawText(cx, gy + 2, opts.label, col, false, 'center');
  };

  const modelCache = new Map();
  function parseObj(text) {
    const V = [];
    const seen = new Set();
    const E = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('v ')) {
        const p = line.trim().split(/\s+/);
        V.push([+p[1], +p[2], +p[3]]);
      } else if (line.startsWith('f ')) {
        const idx = line.trim().split(/\s+/).slice(1).map(t => parseInt(t, 10)).map(i => (i < 0 ? V.length + i : i - 1));
        for (let k = 0; k < idx.length; k++) {
          const a = idx[k];
          const b = idx[(k + 1) % idx.length];
          const key = a < b ? a + '_' + b : b + '_' + a;
          if (!seen.has(key)) { seen.add(key); E.push([a, b]); }
        }
      }
    }
    let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (const v of V) for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k], v[k]); max[k] = Math.max(max[k], v[k]); }
    const ctr = [0, 1, 2].map(k => (min[k] + max[k]) / 2);
    const span = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
    const N = V.map(v => [(v[0] - ctr[0]) / span * 2, -(v[1] - ctr[1]) / span * 2, (v[2] - ctr[2]) / span * 2]);
    const stride = Math.max(1, Math.ceil(E.length / 3500));
    return { V: N, E: E.filter((_, i) => i % stride === 0) };
  }

  // grid.model('ship.obj', cx, cy, scale, rx, ry, rz, { color }) — any .obj in assets
  Engine.prototype.drawModel = function (name, cx, cy, scale, rx, ry, rz, opts = {}) {
    const a = getText(name);
    if (a.status === 'ok') {
      let m = modelCache.get(name);
      if (!m) { m = parseObj(a.text); modelCache.set(name, m); }
      return this.drawWireframe3D(m.V, m.E, cx, cy, { scale, rotX: rx, rotY: ry, rotZ: rz, color: opts.color, dim: this.palette.dim, ascii: false, vertices: false, packets: false, alpha: opts.alpha });
    }
    this.drawShape3D('icosa', cx, cy, scale * 0.6, rx, ry, rz, { color: opts.color || this.palette.dim, accent: '#ffffff', dim: this.palette.dim });
    if (a.status === 'missing') warnOnce('model', name);
  };

  // --------------------------------------------------------------------------
  // PLACES: dotted globe
  // --------------------------------------------------------------------------
  // Rough continent outlines [lon, lat] — stylised, good enough for a dot globe
  const LAND = [
    [[-168, 65], [-160, 70], [-140, 70], [-125, 72], [-95, 72], [-80, 75], [-65, 70], [-60, 55], [-55, 50], [-65, 45], [-70, 41], [-76, 35], [-81, 31], [-80, 25], [-83, 29], [-90, 30], [-97, 26], [-97, 20], [-87, 21], [-88, 15], [-83, 9], [-80, 8], [-85, 12], [-92, 15], [-105, 20], [-110, 24], [-112, 30], [-117, 32], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
    [[-55, 60], [-45, 60], [-20, 70], [-20, 80], [-60, 82], [-70, 77], [-55, 70]],
    [[-80, 8], [-60, 10], [-50, 0], [-35, -5], [-38, -13], [-48, -25], [-58, -35], [-65, -42], [-68, -55], [-75, -50], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -5], [-80, 0]],
    [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [-2, 50], [5, 53], [8, 55], [10, 58], [5, 62], [15, 69], [25, 71], [40, 68], [30, 60], [28, 56], [40, 55], [50, 50], [45, 45], [40, 41], [28, 41], [26, 38], [22, 37], [20, 40], [15, 38], [12, 44], [8, 44], [3, 43], [0, 38], [-5, 36]],
    [[-6, 50], [2, 51], [0, 55], [-3, 59], [-7, 57], [-5, 54]],
    [[-17, 15], [-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 12], [42, -2], [40, -10], [40, -15], [35, -25], [32, -29], [20, -35], [17, -30], [12, -17], [13, -5], [9, 4], [-8, 4], [-13, 8]],
    [[26, 38], [36, 36], [35, 32], [43, 13], [52, 16], [57, 20], [60, 25], [67, 25], [72, 20], [77, 8], [80, 15], [88, 22], [92, 22], [98, 16], [100, 8], [104, 1], [104, 10], [109, 12], [108, 21], [117, 24], [122, 31], [120, 38], [122, 40], [130, 43], [135, 48], [140, 53], [135, 55], [143, 60], [160, 60], [163, 70], [180, 70], [180, 65], [140, 72], [110, 77], [80, 73], [70, 73], [60, 68], [50, 68], [40, 68], [30, 60], [28, 56], [40, 55], [50, 50], [45, 45], [40, 41], [28, 41]],
    [[95, 5], [105, -6], [100, -2]],
    [[109, 1], [118, 7], [119, 0], [116, -4], [110, -3]],
    [[130, 31], [141, 36], [142, 44], [140, 41], [135, 35]],
    [[113, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -25], [150, -37], [140, -38], [132, -32], [124, -34], [115, -34]],
    [[172, -34], [178, -38], [174, -41], [167, -46], [170, -42]],
    [[43, -12], [50, -15], [47, -25], [44, -23]]
  ];
  function inPoly(lon, lat, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  const GLOBE_DOTS = (() => {
    const out = [];
    for (let lat = -84; lat <= 84; lat += 3.2) {
      const step = 3.2 / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
      for (let lon = -180; lon < 180; lon += step) {
        const land = lat < -68 || LAND.some(p => inPoly(lon, lat, p));
        out.push([lon, lat, land]);
      }
    }
    return out;
  })();
  const toXYZ = (lon, lat, spin, rad = 1) => {
    const la = (lat * Math.PI) / 180;
    const lo = (lon * Math.PI) / 180 + spin;
    return [Math.cos(la) * Math.sin(lo) * rad, -Math.sin(la) * rad, Math.cos(la) * Math.cos(lo) * rad];
  };

  // grid.globe(cx, cy, r, { spin, tilt, markers: [{ lat, lon, label, color }], arcs: [[a, b]], color })
  Engine.prototype.drawGlobe = function (cx, cy, r, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const spin = opts.spin !== undefined ? opts.spin : this.time * 0.15;
    const tilt = opts.tilt !== undefined ? opts.tilt : -0.4;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, 'globe' + cx, cx, cy, 1.6);
    for (let i = 0; i < GLOBE_DOTS.length; i++) {
      const d = GLOBE_DOTS[i];
      if (!d[2] && i % 3) continue;
      if (hashN(i) > p) continue;
      const v = toXYZ(d[0], d[1], spin);
      const pr = this.project3D(v[0], v[1], v[2], cx, cy, tilt, 0, 0, r);
      if (pr.z < 0) continue;
      const depth = 0.35 + 0.65 * pr.z;
      const polar = Math.abs(d[1]) > 66 ? 0.45 : 1;
      if (d[2]) this._vdot(pr.x, pr.y, 1.7, col, (0.3 + 0.7 * depth) * polar);
      else this._vdot(pr.x, pr.y, 0.9, pal.primary, 0.22 * depth);
    }
    const R = r * 0.8 * (this.viewportScale || 1);
    this.vItems.push({ t: 'ellipse', x: cx, y: cy, rx: R * (this.cellH / this.cellW), ry: R, c: col, a: 0.25 * p, w: 1.2, h: this._hudMode });
    const markers = opts.markers || [];
    const pts = markers.map(m => {
      const v = toXYZ(m.lon, m.lat, spin, 1.01);
      return this.project3D(v[0], v[1], v[2], cx, cy, tilt, 0, 0, r);
    });
    (opts.arcs || []).forEach((a, ai) => {
      const A = markers[a[0]];
      const B = markers[a[1]];
      if (!A || !B) return;
      const k = c01(((this.time * 0.35 + ai * 0.3) % 1.6));
      const seg = [];
      const N = 32;
      for (let s = 0; s <= N * k; s++) {
        const t = s / N;
        const lat = A.lat + (B.lat - A.lat) * t;
        const dLon = ((B.lon - A.lon + 540) % 360) - 180;
        const lon = A.lon + dLon * t;
        const v = toXYZ(lon, lat, spin, 1 + 0.22 * Math.sin(Math.PI * t));
        const pr = this.project3D(v[0], v[1], v[2], cx, cy, tilt, 0, 0, r);
        if (pr.z < -0.15) { if (seg.length > 1) this._vpath(seg.splice(0), { color: '#00ff88', alpha: 0.9, width: 1.8, glow: true }); seg.length = 0; continue; }
        seg.push([pr.x, pr.y]);
      }
      if (seg.length > 1) this._vpath(seg, { color: '#00ff88', alpha: 0.9, width: 1.8, glow: true });
    });
    markers.forEach((m, i) => {
      const pr = pts[i];
      if (pr.z < 0) return;
      const mc = m.color || pal.warn;
      const pulse = (this.time * 0.9 + i * 0.3) % 1;
      this._vdot(pr.x, pr.y, 2.4, mc, 1);
      this.vItems.push({ t: 'ellipse', x: pr.x, y: pr.y, rx: (0.6 + pulse * 2) * 1.85, ry: 0.6 + pulse * 2, c: mc, a: (1 - pulse) * 0.8, w: 1.2, h: this._hudMode });
      if (m.label) this.drawBigText(pr.x + 2, pr.y, m.label, { size: 0.85, color: mc, align: 'left', reveal: false, alpha: 0.4 + 0.6 * pr.z });
    });
  };

  // --------------------------------------------------------------------------
  // MORE THINGS: people, codebases, calendars, timelines, containment, pipelines
  // --------------------------------------------------------------------------
  // grid.person(cx, cy, { size, label, color, photo, alpha }) — a generic person
  // (lit silhouette) or a named one when `photo` is given
  Engine.prototype.drawPerson = function (cx, cy, opts = {}) {
    const s = opts.size || 8;
    this.drawPortrait(opts.photo || null, cx, cy, {
      key: opts.key || 'person' + Math.round(cx) + ',' + Math.round(cy), w: s * 1.25, h: s, mode: opts.mode || 'halftone', frame: false, color: opts.color,
      label: opts.label, labelSize: opts.labelSize || 1, alpha: opts.alpha, pitch: opts.pitch || 3.4, revealTime: opts.revealTime || 0.9
    });
  };

  // grid.fileGrid(cx, cy, cols, rows, { filled, fillColor, color, progress, key, cell })
  // A codebase as a wall of files; `filled` (0..1) of them light up in fillColor,
  // spreading in a stable scattered order.
  Engine.prototype.drawFileGrid = function (cx, cy, cols, rows, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.dim;
    const fillCol = opts.fillColor || '#00ff88';
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'files' + cx, cx, cy, 1.2);
    const filled = c01(opts.filled || 0);
    const cw0 = opts.cell ? opts.cell[0] : 3.2;
    const ch0 = opts.cell ? opts.cell[1] : 2.4;
    const n = cols * rows;
    const order = [];
    for (let i = 0; i < n; i++) order.push([hashN(i * 3.7 + 1), i]);
    order.sort((a, b) => a[0] - b[0]);
    const rank = new Array(n);
    order.forEach((o, r) => { rank[o[1]] = r; });
    const x0 = cx - (cols * cw0) / 2;
    const y0 = cy - (rows * ch0) / 2;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        for (let i = 0; i < n; i++) {
          const gx = i % cols;
          const gy = Math.floor(i / cols);
          const appear = c01(p * 1.6 - (gy / rows) * 0.6);
          if (appear <= 0) continue;
          const on = rank[i] < filled * n;
          const fresh = on && rank[i] > filled * n - Math.max(1, n * 0.03);
          const px = X(x0 + gx * cw0) - cw * 0.5;
          const py = Y(y0 + gy * ch0) - chh * 0.5;
          const w = cw0 * cw * 0.72;
          const h = ch0 * chh * 0.78;
          const fold = w * 0.28;
          c.globalAlpha = alpha * appear * (on ? 0.95 : 0.35);
          c.strokeStyle = fresh ? '#ffffff' : on ? fillCol : col;
          c.lineWidth = 1 * ws;
          c.beginPath();
          c.moveTo(px, py); c.lineTo(px + w - fold, py); c.lineTo(px + w, py + fold); c.lineTo(px + w, py + h); c.lineTo(px, py + h); c.closePath();
          c.stroke();
          if (on) {
            c.globalAlpha = alpha * appear * 0.18;
            c.fillStyle = fillCol;
            c.fill();
          }
          c.globalAlpha = alpha * appear * (on ? 0.8 : 0.3);
          c.fillStyle = on ? fillCol : col;
          for (let l = 0; l < 3; l++) c.fillRect(px + w * 0.15, py + h * (0.3 + l * 0.2), w * (l === 2 ? 0.4 : 0.65), Math.max(0.8, h * 0.06));
        }
      }
    });
  };

  // grid.calendar(cx, cy, { month, startDay, days, marks: { 7: { color } }, focus, progress })
  Engine.prototype.drawCalendar = function (cx, cy, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.primary;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'cal' + cx, cx, cy, 1.4);
    const days = opts.days || 31;
    const start = opts.startDay || 0;
    const marks = opts.marks || {};
    const cellX = opts.cellX || 6;
    const cellY = opts.cellY || 3;
    const x0 = cx - (7 * cellX) / 2 + cellX / 2;
    const rows = Math.ceil((start + days) / 7);
    const y0 = cy - (rows * cellY) / 2 + cellY / 2 + 1;
    const time = this.time;
    if (opts.month) this.drawBigText(cx, y0 - cellY - 0.6, opts.month, { size: opts.monthSize || 1.6, color: opts.monthColor || pal.accent });
    'SMTWTFS'.split('').forEach((d, i) => this.drawText(x0 + i * cellX, y0 - cellY * 0.75, d, pal.dim, false, 'center', null, 0.6 * p));
    for (let d = 1; d <= days; d++) {
      const idx = start + d - 1;
      const k = c01(p * 1.5 - (d / days) * 0.5);
      if (k <= 0) continue;
      const x = x0 + (idx % 7) * cellX;
      const y = y0 + Math.floor(idx / 7) * cellY;
      const m = marks[d];
      const isFocus = opts.focus === d;
      if (m) {
        const mc = m.color || pal.accent;
        const pulse = isFocus ? 0.75 + 0.25 * Math.sin(time * 4) : 0.8;
        this.vItems.push({ t: 'draw', h: this._hudMode, fn(c, X, Y, cw, chh, ws) {
          const w = cellX * cw * 0.8;
          const h = cellY * chh * 0.78;
          c.globalAlpha = 0.22 * k * pulse;
          c.fillStyle = mc;
          c.fillRect(X(x) - w / 2, Y(y) - h / 2, w, h);
          c.globalAlpha = 0.9 * k * pulse;
          c.strokeStyle = mc;
          c.lineWidth = (isFocus ? 1.8 : 1.2) * ws;
          c.strokeRect(X(x) - w / 2, Y(y) - h / 2, w, h);
        } });
        this.drawText(x, y, String(d), '#ffffff', true, 'center', null, k);
      } else {
        this.drawText(x, y, String(d), col, false, 'center', null, 0.55 * k);
      }
    }
  };

  // grid.timeline(x0, x1, y, { from, to, ticks, label(v), progress, events: [{ at, label, color, above }] })
  // Returns the value → x mapping so scenes can place things on it.
  Engine.prototype.drawTimeline = function (x0, x1, y, opts = {}) {
    const pal = this.palette;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'tl' + x0, x0, y, 1.2);
    const from = opts.from || 0;
    const to = opts.to || 1;
    const xOf = (v) => x0 + ((v - from) / (to - from)) * (x1 - x0);
    const xe = x0 + (x1 - x0) * p;
    this._vline(x0, y, xe, y, opts.color || pal.primary, 0.5, 1.4);
    const step = opts.ticks || (to - from) / 5;
    for (let v = from; v <= to + 1e-6; v += step) {
      const x = xOf(v);
      if (x > xe + 0.01) break;
      this._vline(x, y - 0.35, x, y + 0.35, pal.dim, 0.8, 1);
      this.drawText(x, y + 1.5, opts.label ? opts.label(v) : String(Math.round(v)), pal.dim, false, 'center');
    }
    (opts.events || []).forEach((e) => {
      const x = xOf(e.at);
      if (x > xe + 0.01) return;
      const ec = e.color || pal.accent;
      this._vdot(x, y, 2.6, ec, 1);
      this.addGlow(x, y, 2.5, ec, 0.8);
      if (e.label) {
        const below = e.above === false;
        const ly = below ? y + 3.4 : y - 2.6;
        this._vline(x, y + (below ? 0.6 : -0.6), x, ly + (below ? -0.8 : 0.8), ec, 0.4, 1);
        this.drawText(x, ly, e.label, ec, true, 'center');
      }
    });
    return xOf;
  };

  // grid.glassBox(cx, cy, w, h, d, { color, progress, rotY, tilt, label })
  // A 3D containment box (sandbox / boundary) around whatever sits at cx, cy. Sizes in cells.
  Engine.prototype.drawGlassBox = function (cx, cy, w, h, d, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'gbox' + cx, cx, cy, 1.1);
    const k = smooth(p);
    const ry = opts.rotY !== undefined ? opts.rotY : 0.35;
    const tilt = opts.tilt !== undefined ? opts.tilt : -0.25;
    // Normalise so the box height is ±1 model unit (keeps perspective sane)
    const vs = (this.viewportScale || 1) * 0.8;
    const aspect = this.cellH / this.cellW;
    const U = h / 2;
    const sx = (w / 2) / (U * aspect);
    const sy = 1;
    const sz = (d / 2) / (U * aspect);
    const e = 0.55 + 0.45 * k;
    const V = [];
    for (const yy of [-1, 1]) for (const xz of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) V.push([xz[0] * sx * e, yy * sy * e, xz[1] * sz * e]);
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    this.drawWireframe3D(V, E, cx, cy, { scale: U / vs, rotX: tilt, rotY: ry, rotZ: 0, color: col, dim: col, ascii: false, vertices: false, packets: false, alpha: k * (opts.alpha !== undefined ? opts.alpha : 1) });
    if (opts.label) this.drawText(cx, cy - h / 2 - 2, opts.label, col, false, 'center', null, k);
  };

  // grid.releaseNotes(cx, cy, { product, version, date, items: [{ tag, text }], highlight, color, width, progress, key })
  // A changelog: version header, a rail of entries, each with a coloured tag. Not a page — it's
  // how release notes look in a product, and entries slide in one by one.
  const TAG_COLORS = { NEW: '#00ff88', FIX: '#ffcc33', FIXED: '#ffcc33', IMPROVED: '#33ccff', BREAKING: '#ff3366', SECURITY: '#ff8a3d', BETA: '#b48cff', GA: '#00ff88', DEFAULT: '#33ccff' };
  Engine.prototype.drawReleaseNotes = function (cx, cy, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const items = opts.items || [];
    const key = opts.key || (opts.product || 'notes') + (opts.version || '');
    const t0 = this._revealStart('§notes:' + key, cx, cy, 'n');
    const time = this.time;
    const el = time - t0;
    const p = opts.progress !== undefined ? opts.progress : el;
    const width = opts.width || 64;
    const rowH = opts.rowH || 4.4;
    const totalH = 6.5 + items.length * rowH;
    const x0 = cx - width / 2;
    const y0 = cy - totalH / 2;
    const fs = this.fontSize;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        const head = smooth(p / 0.6);
        c.textBaseline = 'middle';
        c.textAlign = 'left';
        c.globalAlpha = 0.65 * head * alpha;
        c.fillStyle = col;
        c.font = `600 ${fs * 0.95}px "Cascadia Mono", Consolas, monospace`;
        if (opts.product) c.fillText(String(opts.product).toUpperCase(), X(x0), Y(y0));
        c.globalAlpha = head * alpha;
        c.fillStyle = '#ffffff';
        c.font = `800 ${fs * 2.3}px "Cascadia Mono", Consolas, monospace`;
        const vtxt = opts.version || 'Release notes';
        c.fillText(vtxt, X(x0), Y(y0 + 2.6));
        const vw = c.measureText(vtxt).width;
        if (opts.date) {
          c.font = `600 ${fs * 0.95}px "Cascadia Mono", Consolas, monospace`;
          const dw = c.measureText(opts.date).width + fs * 0.9;
          const dx = X(x0) + vw + fs * 0.9;
          const dy = Y(y0 + 2.6);
          c.globalAlpha = 0.85 * head * alpha;
          c.strokeStyle = col;
          c.lineWidth = 1.2 * ws;
          c.beginPath();
          c.roundRect ? c.roundRect(dx, dy - fs * 0.55, dw, fs * 1.1, fs * 0.55) : c.rect(dx, dy - fs * 0.55, dw, fs * 1.1);
          c.stroke();
          c.fillStyle = col;
          c.fillText(opts.date, dx + fs * 0.45, dy);
        }
        const railX = X(x0) + fs * 0.3;
        const yFirst = Y(y0 + 6.5);
        const yLast = Y(y0 + 6.5 + (items.length - 1) * rowH);
        const railK = smooth((p - 0.3) / 0.8);
        c.globalAlpha = 0.35 * alpha;
        c.strokeStyle = col;
        c.lineWidth = 1.2 * ws;
        c.beginPath();
        c.moveTo(railX, yFirst - chh);
        c.lineTo(railX, yFirst - chh + (yLast - yFirst + chh * 2) * railK);
        c.stroke();
        items.forEach((it, i) => {
          const k = smooth((p - 0.45 - i * 0.28) / 0.45);
          if (k <= 0) return;
          const y = Y(y0 + 6.5 + i * rowH);
          const slide = (1 - k) * cw * 6;
          const tag = String(it.tag || 'NEW').toUpperCase();
          const tc = it.color || TAG_COLORS[tag] || TAG_COLORS.DEFAULT;
          const hl = opts.highlight === i;
          c.globalAlpha = k * alpha;
          c.fillStyle = hl ? '#ffffff' : tc;
          c.beginPath();
          c.arc(railX, y, (hl ? 4.2 : 3) * ws, 0, Math.PI * 2);
          c.fill();
          c.font = `800 ${fs * 0.88}px "Cascadia Mono", Consolas, monospace`;
          const tw = c.measureText(tag).width + fs * 0.9;
          const tx = railX + fs * 1.1 + slide;
          c.globalAlpha = 0.22 * k * alpha;
          c.fillStyle = tc;
          c.beginPath();
          c.roundRect ? c.roundRect(tx, y - fs * 0.52, tw, fs * 1.04, fs * 0.25) : c.rect(tx, y - fs * 0.52, tw, fs * 1.04);
          c.fill();
          c.globalAlpha = 0.95 * k * alpha;
          c.strokeStyle = tc;
          c.lineWidth = 1 * ws;
          c.stroke();
          c.fillStyle = tc;
          c.fillText(tag, tx + fs * 0.45, y);
          c.font = `${hl ? 700 : 500} ${fs * 1.2}px "Cascadia Mono", Consolas, monospace`;
          c.fillStyle = hl ? '#ffffff' : '#d8fff0';
          c.globalAlpha = (hl ? 1 : 0.85) * k * alpha;
          c.fillText(it.text || '', tx + tw + fs * 0.7, y);
          if (hl) {
            const tw2 = c.measureText(it.text || '').width;
            c.globalAlpha = 0.25 * (0.7 + 0.3 * Math.sin(time * 4)) * alpha;
            c.fillStyle = tc;
            c.fillRect(tx - fs * 0.3, y - fs * 0.85, tw + tw2 + fs * 1.6, fs * 1.7);
          }
        });
      }
    });
    return { titleY: y0 + 2.6, rowY: (i) => y0 + 6.5 + i * rowH, x0 };
  };

  // grid.pipeline(x0, x1, y, ['propose', 'run', ...], { color, loop, speed, icons, progress, iteration })
  // A process: hexagonal stations joined by arrows, a glowing work packet travelling through,
  // the station it reaches lighting up, and (loop) a curved return path back to the start.
  Engine.prototype.drawPipeline = function (x0, x1, y, steps, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'pipe' + x0, x0, y, 1.2);
    const n = steps.length;
    const xs = steps.map((_, i) => x0 + (n === 1 ? 0 : ((x1 - x0) * i) / (n - 1)));
    const speed = opts.speed || 0.4;
    const loop = Boolean(opts.loop);
    const depth = opts.loopDepth || 6;
    const r = opts.radius || 3.4;
    const time = this.time;
    const cyc = (time * speed) % 1;
    const fwdShare = loop ? 0.72 : 1;
    let px;
    let py;
    let active = -1;
    if (cyc < fwdShare) {
      const u = cyc / fwdShare;
      const f = u * (n - 1);
      const i = Math.min(n - 2, Math.floor(f));
      const local = f - i;
      const dwell = 0.35;
      const mv = local < dwell ? 0 : (local - dwell) / (1 - dwell);
      const e = mv * mv * (3 - 2 * mv);
      px = xs[i] + (xs[i + 1] - xs[i]) * e;
      py = y;
      active = local < dwell ? i : (e > 0.98 ? i + 1 : -1);
      if (u > 0.985) active = n - 1;
    } else {
      const u = (cyc - fwdShare) / (1 - fwdShare);
      const a = Math.PI * u;
      px = x1 + (x0 - x1) * (0.5 - 0.5 * Math.cos(a));
      py = y + Math.sin(a) * depth;
    }
    const hl = opts.active !== undefined ? opts.active : active;
    const iconFor = opts.icons || [];
    const self = this;
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        const R = r * chh * 0.62;
        const hex = (cx0, cy0, rad) => {
          c.beginPath();
          for (let k = 0; k < 6; k++) {
            const a = Math.PI / 6 + (k * Math.PI) / 3;
            const hx = cx0 + Math.cos(a) * rad;
            const hy = cy0 + Math.sin(a) * rad;
            if (k === 0) c.moveTo(hx, hy); else c.lineTo(hx, hy);
          }
          c.closePath();
        };
        // connectors with flowing dashes and chevrons
        for (let i = 0; i < n - 1; i++) {
          const k = c01(p * n - i - 0.5);
          if (k <= 0) continue;
          const ax = X(xs[i]) + R * 1.15;
          const bx = X(xs[i + 1]) - R * 1.15;
          const yy = Y(y);
          c.globalAlpha = 0.45;
          c.strokeStyle = col;
          c.lineWidth = 1.3 * ws;
          c.setLineDash([4 * ws, 5 * ws]);
          c.lineDashOffset = -time * 30;
          c.beginPath();
          c.moveTo(ax, yy);
          c.lineTo(ax + (bx - ax) * k, yy);
          c.stroke();
          c.setLineDash([]);
          if (k >= 1) {
            c.globalAlpha = 0.8;
            c.beginPath();
            c.moveTo(bx - 5, yy - 4);
            c.lineTo(bx, yy);
            c.lineTo(bx - 5, yy + 4);
            c.stroke();
          }
        }
        if (loop && p > 0.9) {
          const k = c01((p - 0.9) / 0.4);
          c.globalAlpha = 0.28 * k;
          c.strokeStyle = col;
          c.lineWidth = 1.2 * ws;
          c.beginPath();
          const N = 40;
          for (let s = 0; s <= N; s++) {
            const a = Math.PI * (s / N);
            const qx = X(x1 + (x0 - x1) * (0.5 - 0.5 * Math.cos(a)));
            const qy = Y(y + Math.sin(a) * depth) + R * 0.9 * Math.sin(a);
            if (s === 0) c.moveTo(qx, qy); else c.lineTo(qx, qy);
          }
          c.stroke();
          const ex = X(x0) - 1;
          const ey = Y(y) + R * 0.9;
          c.globalAlpha = 0.6 * k;
          c.beginPath();
          c.moveTo(ex - 4, ey + 6);
          c.lineTo(ex, ey);
          c.lineTo(ex + 5, ey + 5);
          c.stroke();
        }
        // stations
        xs.forEach((x, i) => {
          const k = c01(p * n - i);
          if (k <= 0) return;
          const on = i === hl;
          const cxp = X(x);
          const cyp = Y(y);
          hex(cxp, cyp, R * (0.6 + 0.4 * k) * (on ? 1.12 : 1));
          c.globalAlpha = (on ? 0.32 : 0.08) * k;
          c.fillStyle = col;
          c.fill();
          c.globalAlpha = (on ? 1 : 0.7) * k;
          c.strokeStyle = on ? '#ffffff' : col;
          c.lineWidth = (on ? 1.8 : 1.2) * ws;
          c.stroke();
          c.font = `800 ${self.fontSize * 1.15}px "Cascadia Mono", Consolas, monospace`;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillStyle = on ? '#ffffff' : col;
          c.globalAlpha = k;
          c.fillText(iconFor[i] || String(i + 1), cxp, cyp + 0.5);
          c.font = `${on ? 800 : 600} ${self.fontSize * (on ? 1.15 : 1)}px "Cascadia Mono", Consolas, monospace`;
          c.globalAlpha = (on ? 1 : 0.65) * k;
          c.fillText(String(steps[i]).toUpperCase(), cxp, cyp - R * 1.75);
        });
      }
    });
    if (p > 0.95 && opts.packets !== false) {
      this._vdot(px, py, 2.4, '#ffffff', 1);
      this.addGlow(px, py, 2.2, col, 1);
    }
    if (hl >= 0 && p > 0.95) this.addGlow(xs[hl], y, 3.2, col, 0.9);
    if (opts.iteration !== undefined) this.drawText(x1 + r + 3, y, `×${opts.iteration}`, col, true, 'left');
    return { xs, active: hl };
  };

  // --------------------------------------------------------------------------
  // Register in the scene sandbox
  // --------------------------------------------------------------------------
  const baseSandbox = Engine.prototype._buildSandbox;
  Engine.prototype._buildSandbox = function () {
    const sb = baseSandbox.call(this);
    const self = this;
    Object.assign(sb.grid, {
      portrait: (name, cx, cy, opts) => self.drawPortrait(name, cx, cy, opts || {}),
      quote: (text, author, cx, cy, opts) => self.drawQuote(text, author, cx, cy, opts || {}),
      paper: (cx, cy, opts) => self.drawPaper(cx, cy, opts || {}),
      lineChart: (x, y, w, h, series, opts) => self.drawLineChart(x, y, w, h, series, opts || {}),
      barChart: (x, y, w, h, bars, opts) => self.drawBarChart(x, y, w, h, bars, opts || {}),
      donut: (cx, cy, r, segs, opts) => self.drawDonut(cx, cy, r, segs, opts || {}),
      network: (nodes, edges, opts) => self.drawNetwork(nodes, edges, opts || {}),
      building: (kind, cx, cy, scale, rotY, opts) => self.drawBuilding(kind, cx, cy, scale, rotY, opts || {}),
      model: (name, cx, cy, scale, rx, ry, rz, opts) => self.drawModel(name, cx, cy, scale, rx, ry, rz, opts || {}),
      globe: (cx, cy, r, opts) => self.drawGlobe(cx, cy, r, opts || {}),
      object: (kind, cx, cy, scale, rotY, opts) => self.drawBuilding(kind, cx, cy, scale, rotY, opts || {}),
      person: (cx, cy, opts) => self.drawPerson(cx, cy, opts || {}),
      fileGrid: (cx, cy, cols, rows, opts) => self.drawFileGrid(cx, cy, cols, rows, opts || {}),
      calendar: (cx, cy, opts) => self.drawCalendar(cx, cy, opts || {}),
      timeline: (x0, x1, y, opts) => self.drawTimeline(x0, x1, y, opts || {}),
      glassBox: (cx, cy, w, h, d, opts) => self.drawGlassBox(cx, cy, w, h, d, opts || {}),
      pipeline: (x0, x1, y, steps, opts) => self.drawPipeline(x0, x1, y, steps, opts || {}),
      releaseNotes: (cx, cy, opts) => self.drawReleaseNotes(cx, cy, opts || {})
    });
    return sb;
  };

  window.TermFXVisuals = { getImage, getText, LAND };
})();
