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
    { const w = opts.w || 22, h = opts.h || 14; this._bb(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2 + (opts.label ? 2.4 : 0), 'portrait', opts.alpha !== undefined ? opts.alpha : 1); }
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
    { const w = opts.w || 30, h = opts.h || 20; this._bb(cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2, 'paper', opts.alpha !== undefined ? opts.alpha : 1); }
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
    this._bb(x - 2, y - 1, x + w + 8, y + h + 2, 'chart');
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
    this._bb(x, y - 2, x + w, y + h + 2, 'chart');
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
    this._bb(cx - r * 1.85 - 2, cy - r - 1, cx + r * 1.85 + 2, cy + r + 1, 'chart');
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
    if (nodes.length) this._bb(Math.min(...nodes.map(n => n.x)) - 3, Math.min(...nodes.map(n => n.y)) - 2, Math.max(...nodes.map(n => n.x)) + 3, Math.max(...nodes.map(n => n.y)) + 2.5, 'chart');
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
      // 42U-style rack: frame, 12 server units with bezels + handles, side vents, cable tray, feet
      const hx = 0.32, hz = 0.4, H = 1.9;
      box(V, E, -hx, 0.04, -hz, hx, H, hz);
      for (const c of [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]]) seg(V, E, [c[0], 0, c[1]], [c[0], 0.04, c[1]]);
      for (let u = 0; u < 12; u++) {
        const y0 = 0.1 + (u * (H - 0.16)) / 12;
        const y1 = y0 + (H - 0.16) / 12 - 0.03;
        const f = hz + 0.01;
        const b = V.length;
        V.push([-hx + 0.04, y0, f], [hx - 0.04, y0, f], [hx - 0.04, y1, f], [-hx + 0.04, y1, f]);
        E.push([b, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b]);
        seg(V, E, [hx - 0.1, y0 + 0.03, f + 0.02], [hx - 0.1, y1 - 0.03, f + 0.02]);
        for (let l = 0; l < 3; l++) W.push([-hx + 0.09 + l * 0.06, (y0 + y1) / 2, f + 0.01]);
      }
      for (let v = 0; v < 10; v++) seg(V, E, [hx, 0.25 + v * 0.15, -hz + 0.08], [hx, 0.25 + v * 0.15, hz - 0.08]);
      ring(V, E, -hx + 0.06, -0.1, hx - 0.06, 0.1, H + 0.12);
      for (const x of [-0.16, 0, 0.16]) seg(V, E, [x, H, 0], [x, H + 0.12, 0]);
    } else if (kind === 'gpu') {
      // Graphics card: PCB, shroud, three fans with blades, fin stack, PCIe fingers, I/O bracket
      const hx = 1.1, hz = 0.45;
      box(V, E, -hx, 0, -hz, hx, 0.04, hz);
      box(V, E, -hx + 0.06, 0.04, -hz + 0.04, hx - 0.06, 0.26, hz - 0.04);
      for (let f = 0; f < 3; f++) {
        const fx = -0.68 + f * 0.68;
        const N = 18;
        for (const r of [0.3, 0.1]) {
          const b = V.length;
          for (let k = 0; k < N; k++) {
            const a = (k / N) * Math.PI * 2;
            V.push([fx + Math.cos(a) * r, 0.27, Math.sin(a) * r]);
          }
          for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
        }
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          seg(V, E, [fx + Math.cos(a) * 0.1, 0.27, Math.sin(a) * 0.1], [fx + Math.cos(a + 0.5) * 0.28, 0.27, Math.sin(a + 0.5) * 0.28]);
        }
      }
      for (let i = 0; i < 22; i++) {
        const x = -hx + 0.1 + i * 0.095;
        seg(V, E, [x, 0.04, hz - 0.04], [x, 0.24, hz - 0.04]);
      }
      for (let i = 0; i < 16; i++) {
        const x = -0.55 + i * 0.05;
        seg(V, E, [x, 0, -hz], [x, -0.07, -hz]);
      }
      box(V, E, hx, -0.1, -hz, hx + 0.03, 0.3, hz);
      for (let i = 0; i < 3; i++) ring(V, E, hx + 0.03, -0.3 + i * 0.22, hx + 0.03, -0.18 + i * 0.22, 0.12);
      for (let i = 0; i < 10; i++) W.push([-hx + 0.15 + i * 0.2, 0.15, hz - 0.03]);
    } else if (kind === 'laptop') {
      // Laptop: base with key grid + trackpad, hinged screen with bezel and webcam
      const hx = 0.8, hz = 0.55;
      box(V, E, -hx, 0, -hz, hx, 0.05, hz);
      for (let r = 0; r < 5; r++) for (let c = 0; c < 12; c++) {
        const x = -0.66 + c * 0.11;
        const z = -0.38 + r * 0.09;
        ring(V, E, x, z, x + 0.085, z + 0.07, 0.052);
      }
      ring(V, E, -0.25, 0.14, 0.25, 0.44, 0.052);
      const b = V.length;
      V.push([-hx, 0.05, -hz], [hx, 0.05, -hz], [hx, 1.05, -hz - 0.18], [-hx, 1.05, -hz - 0.18]);
      E.push([b, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b]);
      const ib = V.length;
      V.push([-hx + 0.06, 0.1, -hz - 0.01], [hx - 0.06, 0.1, -hz - 0.01], [hx - 0.06, 0.98, -hz - 0.17], [-hx + 0.06, 0.98, -hz - 0.17]);
      E.push([ib, ib + 1], [ib + 1, ib + 2], [ib + 2, ib + 3], [ib + 3, ib]);
      W.push([0, 1.015, -hz - 0.18]);
      for (let r = 0; r < 6; r++) for (let i = 0; i < 9; i++) if (hashN(r * 9 + i + 2) > 0.3) W.push([-0.64 + i * 0.15, 0.2 + r * 0.13, -hz - 0.03 - r * 0.023]);
    } else if (kind === 'chip') {
      // Processor package: substrate, heat spreader, die with circuitry, pins on four sides
      const h = 0.7;
      box(V, E, -h, 0, -h, h, 0.08, h);
      box(V, E, -0.5, 0.08, -0.5, 0.5, 0.16, 0.5);
      ring(V, E, -0.3, -0.3, 0.3, 0.3, 0.17);
      for (let i = 1; i < 6; i++) {
        seg(V, E, [-0.3 + i * 0.1, 0.17, -0.3], [-0.3 + i * 0.1, 0.17, 0.3]);
        seg(V, E, [-0.3, 0.17, -0.3 + i * 0.1], [0.3, 0.17, -0.3 + i * 0.1]);
      }
      for (let i = 0; i < 9; i++) {
        const o = -h + 0.12 + i * 0.16;
        seg(V, E, [o, 0.04, h], [o, -0.02, h + 0.2]);
        seg(V, E, [o, 0.04, -h], [o, -0.02, -h - 0.2]);
        seg(V, E, [h, 0.04, o], [h + 0.2, -0.02, o]);
        seg(V, E, [-h, 0.04, o], [-h - 0.2, -0.02, o]);
      }
      for (let i = 0; i < 16; i++) W.push([-0.24 + (i % 4) * 0.16, 0.18, -0.24 + Math.floor(i / 4) * 0.16]);
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
      // Display: bezel + inset screen, neck, foot, side ports
      box(V, E, -0.95, 0.32, -0.05, 0.95, 1.38, 0.05);
      const b = V.length;
      V.push([-0.88, 0.38, 0.055], [0.88, 0.38, 0.055], [0.88, 1.32, 0.055], [-0.88, 1.32, 0.055]);
      E.push([b, b + 1], [b + 1, b + 2], [b + 2, b + 3], [b + 3, b]);
      box(V, E, -0.06, 0.06, -0.12, 0.06, 0.34, -0.05);
      ring(V, E, -0.38, -0.25, 0.38, 0.15, 0.04);
      ring(V, E, -0.38, -0.25, 0.38, 0.15, 0.0);
      for (let i = 0; i < 4; i++) seg(V, E, [0.95, 0.5 + i * 0.08, -0.03], [0.95, 0.5 + i * 0.08, 0.03]);
      for (let r = 0; r < 8; r++) for (let i = 0; i < 14; i++) if (hashN(r * 14 + i + 3) > 0.3) W.push([-0.8 + i * 0.123, 1.24 - r * 0.11, 0.06]);
    } else if (kind === 'checkpoint') {
      // Slim verification checkpoint: two posts, a light curtain between them (subtle)
      for (const x of [-0.42, 0.42]) {
        box(V, E, x - 0.035, 0, -0.035, x + 0.035, 0.95, 0.035);
        ring(V, E, x - 0.09, -0.09, x + 0.09, 0.09, 0);
      }
      seg(V, E, [-0.42, 0.95, 0], [0.42, 0.95, 0]);
      for (let r = 0; r < 7; r++) for (let c = 0; c < 8; c++) W.push([-0.33 + c * 0.094, 0.1 + r * 0.13, 0]);
    } else if (kind === 'coolingTower') {
      const N = 18;
      const levels = 7;
      const rad = (y) => 0.3 + 0.32 * Math.pow((y - 0.75) / 0.75, 2);
      for (let l = 0; l < levels; l++) {
        const y = (l / (levels - 1)) * 1.3;
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * rad(y), y, Math.sin(a) * rad(y)]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
        if (l > 0) for (let k = 0; k < N; k += 2) E.push([b + k, b - N + ((k + 2) % N)]);
      }
    } else if (kind === 'pylon') {
      const H = 1.9;
      const w0 = 0.32;
      const w1 = 0.06;
      const lv = [0, 0.45, 0.9, 1.3, 1.6, H];
      const wAt = (y) => w0 + (w1 - w0) * (y / H);
      lv.forEach((y, i) => {
        ring(V, E, -wAt(y), -wAt(y), wAt(y), wAt(y), y);
        if (i > 0) {
          const y0 = lv[i - 1];
          for (const s of [-1, 1]) {
            seg(V, E, [s * wAt(y0), y0, -wAt(y0)], [s * wAt(y), y, -wAt(y)]);
            seg(V, E, [s * wAt(y0), y0, wAt(y0)], [s * wAt(y), y, wAt(y)]);
            seg(V, E, [-wAt(y0), y0, s * wAt(y0)], [wAt(y), y, s * wAt(y)]);
          }
        }
      });
      for (const y of [1.3, 1.6]) {
        seg(V, E, [-0.7, y, 0], [0.7, y, 0]);
        seg(V, E, [-0.7, y, 0], [-0.7, y - 0.15, 0]);
        seg(V, E, [0.7, y, 0], [0.7, y - 0.15, 0]);
        W.push([-0.7, y - 0.15, 0], [0.7, y - 0.15, 0]);
      }
    } else if (kind === 'database') {
      const N = 20;
      const r = 0.5;
      for (let d = 0; d < 3; d++) {
        for (const y of [d * 0.38, d * 0.38 + 0.3]) {
          const b = V.length;
          for (let k = 0; k < N; k++) {
            const a = (k / N) * Math.PI * 2;
            V.push([Math.cos(a) * r, y, Math.sin(a) * r]);
          }
          for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
        }
        for (let k = 0; k < 4; k++) {
          const a = (k / 4) * Math.PI * 2 + 0.4;
          seg(V, E, [Math.cos(a) * r, d * 0.38, Math.sin(a) * r], [Math.cos(a) * r, d * 0.38 + 0.3, Math.sin(a) * r]);
        }
        for (let k = 0; k < 6; k++) W.push([-0.3 + k * 0.12, d * 0.38 + 0.15, r]);
      }
    } else if (kind === 'wrench') {
      const pts = [[-0.08, 0], [0.08, 0], [0.08, 0.8], [0.22, 0.92], [0.22, 1.15], [0.1, 1.15], [0.1, 1.02], [-0.1, 1.02], [-0.1, 1.15], [-0.22, 1.15], [-0.22, 0.92], [-0.08, 0.8]];
      const b = V.length;
      for (const z of [-0.04, 0.04]) for (const p of pts) V.push([p[0], p[1], z]);
      const n = pts.length;
      for (let k = 0; k < n; k++) {
        E.push([b + k, b + ((k + 1) % n)]);
        E.push([b + n + k, b + n + ((k + 1) % n)]);
        if (k % 3 === 0) E.push([b + k, b + n + k]);
      }
    } else if (kind === 'button') {
      box(V, E, -0.55, 0, -0.4, 0.55, 0.16, 0.4);
      const N = 20;
      for (const y of [0.16, 0.24]) {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * 0.36, y, Math.sin(a) * 0.26]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      }
    } else if (kind === 'buttonCap') {
      const N = 20;
      for (const y of [0, 0.14]) {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * 0.3, y, Math.sin(a) * 0.21]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
        if (y > 0) for (let k = 0; k < N; k += 5) E.push([b + k, b - N + k]);
      }
      for (let k = 0; k < 8; k++) W.push([Math.cos((k / 8) * Math.PI * 2) * 0.18, 0.15, Math.sin((k / 8) * Math.PI * 2) * 0.12]);
    } else if (kind === 'pen') {
      const N = 8;
      const r = 0.07;
      const rings = [[0.2, r], [1.25, r], [1.32, r * 1.15], [1.6, r * 1.15]];
      rings.forEach((rg) => {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * rg[1], rg[0], Math.sin(a) * rg[1]]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      });
      for (let k = 0; k < N; k++) {
        E.push([k, 3 * N + k]);
      }
      const tip = V.length;
      V.push([0, 0, 0]);
      for (let k = 0; k < N; k++) E.push([tip, k]);
      seg(V, E, [r * 1.15, 1.55, 0], [r * 1.6, 1.1, 0]);
      W.push([0, 0.02, 0]);
    } else if (kind === 'rocket') {
      const N = 12;
      const rr = 0.22;
      const lv = [0.1, 0.5, 0.9, 1.2];
      lv.forEach((y) => {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * rr, y, Math.sin(a) * rr]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      });
      for (let k = 0; k < N; k += 3) E.push([k, 3 * N + k]);
      const nose = V.length;
      V.push([0, 1.65, 0]);
      for (let k = 0; k < N; k += 2) E.push([nose, 3 * N + k]);
      for (let f = 0; f < 4; f++) {
        const a = (f / 4) * Math.PI * 2;
        const cx0 = Math.cos(a);
        const sz0 = Math.sin(a);
        const b = V.length;
        V.push([cx0 * rr, 0.45, sz0 * rr], [cx0 * 0.48, 0, sz0 * 0.48], [cx0 * rr, 0.1, sz0 * rr]);
        E.push([b, b + 1], [b + 1, b + 2]);
      }
      const nz = V.length;
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2;
        V.push([Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14]);
      }
      for (let k = 0; k < N; k++) E.push([nz + k, nz + ((k + 1) % N)]);
      W.push([0, 1.02, rr], [0, 0.72, rr]);
    } else if (kind === 'ladder') {
      const H = 2.1;
      for (const x of [-0.42, 0.42]) box(V, E, x - 0.04, 0, -0.04, x + 0.04, H, 0.04);
      for (let r = 1; r <= 4; r++) {
        const y = (r * H) / 4.6;
        box(V, E, -0.38, y - 0.025, -0.03, 0.38, y + 0.025, 0.03);
        W.push([0, y, 0.05]);
      }
    } else if (kind === 'cctv') {
      box(V, E, -0.08, 0.9, -0.5, 0.08, 1.25, -0.42);
      seg(V, E, [0, 1.05, -0.42], [0, 1.05, -0.15]);
      box(V, E, -0.16, 0.95, -0.15, 0.16, 1.18, 0.45);
      const N = 12;
      for (const z of [0.45, 0.58]) {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * 0.1, 1.065 + Math.sin(a) * 0.1, z]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      }
      box(V, E, -0.2, 1.18, -0.2, 0.2, 1.22, 0.55);
      W.push([0, 1.065, 0.6], [0.11, 1.12, 0.46]);
    } else if (kind === 'shield3d') {
      const pts = [];
      for (let k = 0; k <= 10; k++) {
        const t = k / 10;
        pts.push([-0.55 + t * 1.1, 1.2 + Math.sin(t * Math.PI) * 0.06]);
      }
      for (let k = 1; k <= 12; k++) {
        const t = k / 12;
        pts.push([0.55 * Math.cos(t * Math.PI / 2), 1.2 - t * 1.2 * (0.55 + 0.45 * t)]);
      }
      for (let k = 11; k >= 1; k--) {
        const t = k / 12;
        pts.push([-0.55 * Math.cos(t * Math.PI / 2), 1.2 - t * 1.2 * (0.55 + 0.45 * t)]);
      }
      const n = pts.length;
      const b = V.length;
      for (const z of [-0.06, 0.06]) for (const p of pts) V.push([p[0], p[1] + 0.05, z]);
      for (let k = 0; k < n; k++) {
        E.push([b + k, b + ((k + 1) % n)]);
        E.push([b + n + k, b + n + ((k + 1) % n)]);
        if (k % 4 === 0) E.push([b + k, b + n + k]);
      }
      seg(V, E, [-0.25, 0.75, 0.07], [0, 0.45, 0.07]);
      seg(V, E, [0, 0.45, 0.07], [0.32, 0.95, 0.07]);
      W.push([0, 0.6, 0.08]);
    } else if (kind === 'helix') {
      const turns = 2.2;
      const steps = 44;
      const r = 0.32;
      const H = 1.8;
      for (const ph of [0, Math.PI]) {
        const b = V.length;
        for (let k = 0; k <= steps; k++) {
          const t = k / steps;
          const a = t * turns * Math.PI * 2 + ph;
          V.push([Math.cos(a) * r, t * H, Math.sin(a) * r]);
        }
        for (let k = 0; k < steps; k++) E.push([b + k, b + k + 1]);
      }
      for (let k = 0; k <= steps; k += 3) {
        E.push([k, steps + 1 + k]);
        W.push([0, (k / steps) * H, 0]);
      }
    } else if (kind === 'crystal') {
      const n = 3;
      const sp = 0.42;
      const idx = (i, j, k) => (i * n + j) * n + k;
      const b = V.length;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        V.push([(i - 1) * sp, j * sp, (k - 1) * sp]);
        W.push([(i - 1) * sp, j * sp, (k - 1) * sp]);
      }
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
        if (i < n - 1) E.push([b + idx(i, j, k), b + idx(i + 1, j, k)]);
        if (j < n - 1) E.push([b + idx(i, j, k), b + idx(i, j + 1, k)]);
        if (k < n - 1) E.push([b + idx(i, j, k), b + idx(i, j, k + 1)]);
      }
    } else if (kind === 'funnel') {
      const N = 22;
      const lv = [[1.3, 0.85], [0.95, 0.6], [0.6, 0.18], [0.0, 0.1]];
      lv.forEach((l) => {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * l[1], l[0], Math.sin(a) * l[1]]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      });
      for (let k = 0; k < N; k += 2) for (let l = 0; l < 3; l++) E.push([l * N + k, (l + 1) * N + k]);
    } else if (kind === 'office') {
      const hw = 0.55, hd = 0.4, H = 1.6, floors = 8;
      box(V, E, -hw, 0, -hd, hw, H, hd);
      for (let f = 1; f < floors; f++) ring(V, E, -hw, -hd, hw, hd, (f * H) / floors);
      for (let f = 0; f < floors; f++) for (let k = 0; k < 6; k++) {
        const y = ((f + 0.5) * H) / floors;
        W.push([-hw + 0.1 + k * 0.18, y, hd], [hw, y, -hd + 0.1 + (k % 4) * 0.2]);
      }
    } else if (kind === 'phone') {
      // Smartphone: rounded slab, inset screen, notch, side buttons, camera module on the back
      const w = 0.42, h = 0.88, d = 0.045;
      const outline = [];
      const r = 0.08;
      const corners = [[w - r, h - r, 0], [-w + r, h - r, Math.PI / 2], [-w + r, -h + r, Math.PI], [w - r, -h + r, Math.PI * 1.5]];
      corners.forEach((cn) => { for (let k = 0; k <= 4; k++) { const a = cn[2] + (k / 4) * (Math.PI / 2); outline.push([cn[0] + Math.cos(a) * r, cn[1] + Math.sin(a) * r]); } });
      const n = outline.length;
      const b = V.length;
      for (const z of [-d, d]) for (const p of outline) V.push([p[0], p[1] + h, z]);
      for (let k = 0; k < n; k++) {
        E.push([b + k, b + ((k + 1) % n)]);
        E.push([b + n + k, b + n + ((k + 1) % n)]);
        if (k % 5 === 0) E.push([b + k, b + n + k]);
      }
      const sb = V.length;
      V.push([-w + 0.04, 0.06 + 0.04, d + 0.005], [w - 0.04, 0.1, d + 0.005], [w - 0.04, 2 * h - 0.1, d + 0.005], [-w + 0.04, 2 * h - 0.1, d + 0.005]);
      E.push([sb, sb + 1], [sb + 1, sb + 2], [sb + 2, sb + 3], [sb + 3, sb]);
      seg(V, E, [-0.08, 2 * h - 0.06, d + 0.006], [0.08, 2 * h - 0.06, d + 0.006]);
      seg(V, E, [w, 1.25, 0], [w, 1.45, 0]);
      seg(V, E, [-w, 1.3, 0], [-w, 1.4, 0]);
      ring(V, E, -0.3, -d - 0.02, -0.08, -d, 1.5);
      for (let r2 = 0; r2 < 9; r2++) for (let i = 0; i < 5; i++) if (hashN(r2 * 5 + i + 11) > 0.35) W.push([-0.3 + i * 0.15, 1.55 - r2 * 0.16, d + 0.01]);
    } else if (kind === 'serverBlade') {
      // 1U server: long thin chassis, front drive bays, vent slots, status LEDs
      const hx = 1.2, hz = 0.6, H = 0.14;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      for (let i = 0; i < 8; i++) {
        const x = -hx + 0.1 + i * 0.2;
        ring(V, E, x, hz, x + 0.16, hz, 0.03);
        seg(V, E, [x, 0.03, hz], [x, 0.11, hz]);
        seg(V, E, [x + 0.16, 0.03, hz], [x + 0.16, 0.11, hz]);
        seg(V, E, [x, 0.11, hz], [x + 0.16, 0.11, hz]);
      }
      for (let i = 0; i < 12; i++) seg(V, E, [0.5 + i * 0.05, 0.03, hz], [0.5 + i * 0.05, 0.11, hz]);
      for (let i = 0; i < 8; i++) W.push([-hx + 0.18 + i * 0.2, 0.07, hz + 0.01]);
      W.push([1.15, 0.07, hz + 0.01]);
    } else if (kind === 'switch') {
      // Network switch: 24 ports in two rows, link LEDs, uplink cages
      const hx = 1.2, hz = 0.5, H = 0.16;
      box(V, E, -hx, 0, -hz, hx, H, hz);
      for (let r = 0; r < 2; r++) for (let i = 0; i < 12; i++) {
        const x = -1.05 + i * 0.15;
        const y = 0.03 + r * 0.065;
        const bb = V.length;
        V.push([x, y, hz], [x + 0.11, y, hz], [x + 0.11, y + 0.05, hz], [x, y + 0.05, hz]);
        E.push([bb, bb + 1], [bb + 1, bb + 2], [bb + 2, bb + 3], [bb + 3, bb]);
        W.push([x + 0.055, y + 0.025, hz + 0.01]);
      }
      for (let i = 0; i < 4; i++) ring(V, E, 0.85 + i * 0.08, hz, 0.91 + i * 0.08, hz, 0.08);
    } else if (kind === 'idBadge') {
      // Employee ID badge: card, photo window, name lines, barcode, clip and lanyard
      const w = 0.5, h = 0.75, d = 0.02;
      box(V, E, -w, 0, -d, w, h, d);
      ring(V, E, -0.38, d + 0.001, -0.08, d + 0.001, 0.42);
      const pb = V.length;
      V.push([-0.38, 0.42, d], [-0.08, 0.42, d], [-0.08, 0.66, d], [-0.38, 0.66, d]);
      E.push([pb, pb + 1], [pb + 1, pb + 2], [pb + 2, pb + 3], [pb + 3, pb]);
      for (let i = 0; i < 3; i++) seg(V, E, [0.0, 0.62 - i * 0.08, d], [0.38 - i * 0.08, 0.62 - i * 0.08, d]);
      for (let i = 0; i < 16; i++) { const x = -0.38 + i * 0.045 + (i % 3 === 0 ? 0.01 : 0); seg(V, E, [x, 0.08, d], [x, 0.24, d]); }
      box(V, E, -0.08, h, -0.03, 0.08, h + 0.08, 0.03);
      seg(V, E, [-0.05, h + 0.08, 0], [-0.25, h + 0.5, 0]);
      seg(V, E, [0.05, h + 0.08, 0], [0.25, h + 0.5, 0]);
      W.push([-0.23, 0.54, d + 0.01], [0.3, 0.3, d + 0.01]);
    } else if (kind === 'key') {
      // Key: bow with hole, shaft, bit with teeth
      const N = 20;
      for (const z of [-0.03, 0.03]) {
        for (const r of [0.3, 0.1]) {
          const b = V.length;
          for (let k = 0; k < N; k++) {
            const a = (k / N) * Math.PI * 2;
            V.push([Math.cos(a) * r, 1.2 + Math.sin(a) * r, z]);
          }
          for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
        }
      }
      box(V, E, -0.045, 0, -0.03, 0.045, 0.9, 0.03);
      const teeth = [[0.05, 0.05], [0.16, 0.05], [0.16, 0.14], [0.11, 0.14], [0.11, 0.24], [0.18, 0.24], [0.18, 0.34], [0.05, 0.34]];
      const tb = V.length;
      for (const t of teeth) V.push([t[0], t[1], 0.03]);
      for (let k = 0; k < teeth.length - 1; k++) E.push([tb + k, tb + k + 1]);
      W.push([0, 1.2, 0.04]);
    } else if (kind === 'hourglass') {
      // Hourglass: two glass bulbs meeting at a waist, top/bottom plates, three posts
      ring(V, E, -0.5, -0.5, 0.5, 0.5, 0);
      ring(V, E, -0.5, -0.5, 0.5, 0.5, 1.6);
      ring(V, E, -0.5, -0.5, 0.5, 0.5, 0.06);
      ring(V, E, -0.5, -0.5, 0.5, 0.5, 1.54);
      for (const p of [[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.42, 0.42]]) seg(V, E, [p[0], 0.06, p[1]], [p[0], 1.54, p[1]]);
      const N = 16;
      const base = V.length;
      const prof = [[0.08, 0.36], [0.35, 0.33], [0.62, 0.18], [0.8, 0.04], [0.98, 0.18], [1.25, 0.33], [1.52, 0.36]];
      prof.forEach((pp) => {
        const b = V.length;
        for (let k = 0; k < N; k++) {
          const a = (k / N) * Math.PI * 2;
          V.push([Math.cos(a) * pp[1], pp[0], Math.sin(a) * pp[1]]);
        }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      });
      for (let l = 0; l < prof.length - 1; l++) for (let k = 0; k < N; k += 4) E.push([base + l * N + k, base + (l + 1) * N + k]);
    } else if (kind === 'gear') {
      // Toothed gear: 14 teeth, hub, spokes
      const teeth = 14;
      const ro = 0.75, ri = 0.62;
      const pts = [];
      for (let t = 0; t < teeth; t++) {
        const a0 = (t / teeth) * Math.PI * 2;
        const da = (Math.PI * 2) / teeth;
        pts.push([Math.cos(a0) * ri, Math.sin(a0) * ri], [Math.cos(a0 + da * 0.15) * ro, Math.sin(a0 + da * 0.15) * ro], [Math.cos(a0 + da * 0.5) * ro, Math.sin(a0 + da * 0.5) * ro], [Math.cos(a0 + da * 0.65) * ri, Math.sin(a0 + da * 0.65) * ri]);
      }
      const n = pts.length;
      const b = V.length;
      for (const z of [-0.08, 0.08]) for (const p of pts) V.push([p[0], p[1] + 0.8, z]);
      for (let k = 0; k < n; k++) {
        E.push([b + k, b + ((k + 1) % n)]);
        E.push([b + n + k, b + n + ((k + 1) % n)]);
        if (k % 4 === 1) E.push([b + k, b + n + k]);
      }
      const hb = V.length;
      for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; V.push([Math.cos(a) * 0.16, 0.8 + Math.sin(a) * 0.16, 0.09]); }
      for (let k = 0; k < 14; k++) E.push([hb + k, hb + ((k + 1) % 14)]);
      for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; seg(V, E, [Math.cos(a) * 0.16, 0.8 + Math.sin(a) * 0.16, 0.09], [Math.cos(a) * 0.55, 0.8 + Math.sin(a) * 0.55, 0.09]); }
      W.push([0, 0.8, 0.1]);
    } else if (kind === 'microscope') {
      // Microscope: base, arm, stage, objective, tube and eyepiece
      box(V, E, -0.5, 0, -0.35, 0.5, 0.08, 0.35);
      box(V, E, 0.12, 0.08, -0.1, 0.24, 1.1, 0.1);
      box(V, E, -0.35, 0.42, -0.25, 0.16, 0.47, 0.25);
      const tube = (y0, y1, r, x0, x1) => {
        const N = 10;
        const b = V.length;
        for (const [y, x] of [[y0, x0], [y1, x1]]) for (let k = 0; k < N; k++) { const a = (k / N) * Math.PI * 2; V.push([x + Math.cos(a) * r, y, Math.sin(a) * r]); }
        for (let k = 0; k < N; k++) { E.push([b + k, b + ((k + 1) % N)]); E.push([b + N + k, b + N + ((k + 1) % N)]); if (k % 3 === 0) E.push([b + k, b + N + k]); }
      };
      tube(0.55, 0.75, 0.05, -0.12, -0.12);
      tube(0.75, 1.3, 0.1, -0.12, -0.02);
      tube(1.3, 1.5, 0.07, -0.02, 0.04);
      seg(V, E, [0.12, 1.0, 0], [-0.02, 1.05, 0]);
      W.push([-0.12, 0.5, 0], [0.04, 1.5, 0]);
    } else if (kind === 'flask') {
      // Erlenmeyer flask with liquid line and graduation marks
      const N = 18;
      const prof = [[0, 0.55], [0.35, 0.46], [0.7, 0.22], [0.82, 0.13], [1.25, 0.13], [1.3, 0.16]];
      prof.forEach((pp) => {
        const b = V.length;
        for (let k = 0; k < N; k++) { const a = (k / N) * Math.PI * 2; V.push([Math.cos(a) * pp[1], pp[0], Math.sin(a) * pp[1]]); }
        for (let k = 0; k < N; k++) E.push([b + k, b + ((k + 1) % N)]);
      });
      for (let l = 0; l < prof.length - 1; l++) for (let k = 0; k < N; k += 3) E.push([l * N + k, (l + 1) * N + k]);
      for (let i = 0; i < 4; i++) seg(V, E, [0.3, 0.12 + i * 0.12, 0.42 - i * 0.04], [0.42 - i * 0.05, 0.12 + i * 0.12, 0.3]);
      for (let i = 0; i < 6; i++) W.push([(hashN(i) - 0.5) * 0.5, 0.08 + hashN(i + 3) * 0.25, 0.3]);
    } else if (kind === 'briefcase') {
      box(V, E, -0.7, 0, -0.18, 0.7, 0.95, 0.18);
      seg(V, E, [-0.7, 0.62, 0.18], [0.7, 0.62, 0.18]);
      const N = 10;
      const b = V.length;
      for (let k = 0; k <= N; k++) { const a = Math.PI * (k / N); V.push([Math.cos(a) * 0.22, 0.95 + Math.sin(a) * 0.2, 0]); }
      for (let k = 0; k < N; k++) E.push([b + k, b + k + 1]);
      for (const x of [-0.45, 0.45]) box(V, E, x - 0.06, 0.55, 0.18, x + 0.06, 0.68, 0.21);
      W.push([-0.45, 0.62, 0.22], [0.45, 0.62, 0.22]);
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
    // Keyed by opts.key when given, so objects that move keep their reveal state
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'b:' + kind + cx, opts.key ? 0 : cx, opts.key ? 0 : cy, opts.duration || 1.8);
    const cap = m.maxY * c01(p);
    const yc = m.maxY / 2;
    // Spin about the building's own vertical axis, then tilt toward camera (keeps it upright)
    const cy0 = Math.cos(rotY), sy0 = Math.sin(rotY);
    // Optional roll (tilt the object sideways about its centre), then yaw, then camera tilt
    const cr = Math.cos(opts.roll || 0), sr = Math.sin(opts.roll || 0);
    const toScreen = (v, clamp) => {
      const y0 = (clamp ? Math.min(v[1], cap) : v[1]) - yc;
      const x = v[0] * cr - y0 * sr;
      const y = v[0] * sr + y0 * cr;
      return [x * cy0 + v[2] * sy0, -y, -x * sy0 + v[2] * cy0];
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
        const lit = opts.litFn ? opts.litFn(i, w) : Math.sin(this.time * (0.4 + hashN(i) * 1.6) + i) > -0.2;
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
    { const R = r * 0.8 * (this.viewportScale || 1); this._bb(cx - R * (this.cellH / this.cellW), cy - R, cx + R * (this.cellH / this.cellW), cy + R, 'globe'); }
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
    { const cw0 = opts.cell ? opts.cell[0] : 3.2, ch0 = opts.cell ? opts.cell[1] : 2.4; this._bb(cx - (cols * cw0) / 2, cy - (rows * ch0) / 2, cx + (cols * cw0) / 2, cy + (rows * ch0) / 2, 'grid', opts.alpha !== undefined ? opts.alpha : 1); }
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
    { const cx0 = opts.cellX || 6, cy0 = opts.cellY || 3, rws = Math.ceil(((opts.startDay || 0) + (opts.days || 31)) / 7); this._bb(cx - 3.5 * cx0, cy - (rws * cy0) / 2 - cy0 - 1, cx + 3.5 * cx0, cy + (rws * cy0) / 2 + 1, 'calendar'); }
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
    this._bb(x0 - 2, y - 3.2, x1 + 2, y + 4, 'timeline');
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
    const U = Math.max(h, w / aspect, d / aspect) / 2;
    const sx = (w / 2) / (U * aspect);
    const sy = (h / 2) / U;
    const sz = (d / 2) / (U * aspect);
    const e = 0.55 + 0.45 * k;
    const V = [];
    for (const yy of [-1, 1]) for (const xz of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) V.push([xz[0] * sx * e, yy * sy * e, xz[1] * sz * e]);
    const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    this.drawWireframe3D(V, E, cx, cy, { bbKind: 'box', scale: U / vs, rotX: tilt, rotY: ry, rotZ: 0, color: col, dim: col, ascii: false, vertices: false, packets: false, alpha: k * (opts.alpha !== undefined ? opts.alpha : 1) });
    if (opts.label) this.drawText(cx, cy - h / 2 - 2, opts.label, col, false, 'center', null, k);
  };

  // grid.releaseNotes(cx, cy, { product, version, date, items: [{ tag, text }], highlight, color, width, progress, key })
  // A changelog: version header, a rail of entries, each with a coloured tag. Not a page — it's
  // how release notes look in a product, and entries slide in one by one.
  const TAG_COLORS = { NEW: '#00ff88', FIX: '#ffcc33', FIXED: '#ffcc33', IMPROVED: '#33ccff', BREAKING: '#ff3366', SECURITY: '#ff8a3d', BETA: '#b48cff', GA: '#00ff88', DEFAULT: '#33ccff' };
  Engine.prototype.drawReleaseNotes = function (cx, cy, opts = {}) {
    { const w = opts.width || 64, rh = opts.rowH || 4.4, th = 6.5 + (opts.items || []).length * rh; this._bb(cx - w / 2, cy - th / 2 - 1, cx + w / 2, cy + th / 2 - rh + 1, 'notes', opts.alpha !== undefined ? opts.alpha : 1); }
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
    { const r = opts.radius || 3.4; this._bb(x0 - r * 1.3 - (opts.loop ? 2 : 0), y - r * 1.9, x1 + r * 1.3 + (opts.loop ? 2 : 0), y + (opts.loop ? (opts.loopDepth || 6) + r * 0.6 : r), 'pipeline'); }
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

  // grid.balance(cx, cy, scale, angle, { color, rotY, tilt }) — a two-pan balance scale.
  // `angle` tips the beam (+ = right pan down). Returns the screen positions of the two
  // pans ({ left: { x, y }, right: { x, y } }) so a scene can set things on them.
  Engine.prototype.drawBalance = function (cx, cy, scale, angle, opts = {}) {
    const pal = this.palette;
    const col = opts.color || pal.accent;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'bal' + cx, cx, cy, 1.2);
    const k = smooth(p);
    const V = [];
    const E = [];
    const H = 1.5;
    box(V, E, -0.45, 0, -0.25, 0.45, 0.08, 0.25);
    box(V, E, -0.04, 0.08, -0.04, 0.04, H, 0.04);
    const L = 1.25;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const end = (s) => [s * L * ca, H - s * L * sa];
    const le = end(-1);
    const re = end(1);
    // Beam and strings sit a touch in front of the post so they render as front edges
    seg(V, E, [le[0], le[1], 0.08], [re[0], re[1], 0.08]);
    seg(V, E, [0, H - 0.02, 0], [0, H + 0.14, 0]);
    const pans = [];
    for (const e of [le, re]) {
      const py = e[1] - 0.55;
      const N = 14;
      const b = V.length;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        V.push([e[0] + Math.cos(a) * 0.38, py, Math.sin(a) * 0.38]);
      }
      for (let i = 0; i < N; i++) E.push([b + i, b + ((i + 1) % N)]);
      for (const a of [0, 2.1, 4.2]) seg(V, E, [e[0], e[1], 0.08], [e[0] + Math.cos(a) * 0.38, py, Math.sin(a) * 0.38 + 0.08]);
      pans.push([e[0], py]);
    }
    const yc = H / 2;
    const ry = opts.rotY !== undefined ? opts.rotY : 0.12;
    const tilt = -(opts.tilt !== undefined ? opts.tilt : 0.12);
    const cy0 = Math.cos(ry);
    const sy0 = Math.sin(ry);
    const toS = (v) => [v[0] * cy0 + v[2] * sy0, -(v[1] - yc), -v[0] * sy0 + v[2] * cy0];
    this.drawWireframe3D(V.map(toS), E, cx, cy, { scale, rotX: tilt, rotY: 0, rotZ: 0, color: col, dim: pal.dim, ascii: false, vertices: false, packets: false, alpha: k * (opts.alpha !== undefined ? opts.alpha : 1) });
    const proj = (q) => {
      const s = toS([q[0], q[1], 0]);
      const pr = this.project3D(s[0], s[1], s[2], cx, cy, tilt, 0, 0, scale);
      return { x: pr.x, y: pr.y };
    };
    return { left: proj(pans[0]), right: proj(pans[1]) };
  };

  // grid.brickWall(cx, baseY, cols, rows, { fall, color, label, brick: [w, h] })
  // A wall of bricks; `fall` 0..1 knocks it down brick by brick, top rows first.
  Engine.prototype.drawBrickWall = function (cx, baseY, cols, rows, opts = {}) {
    { const bw = opts.brick ? opts.brick[0] : 4, bh = opts.brick ? opts.brick[1] : 1.6; this._bb(cx - (cols * bw) / 2 - bw / 2, baseY - rows * bh - (opts.label ? 3 : 0), cx + (cols * bw) / 2, baseY, 'wall', 1 - (opts.fall || 0) * 0.9); }
    const pal = this.palette;
    const col = opts.color || pal.warn;
    const fall = c01(opts.fall || 0);
    const bw = opts.brick ? opts.brick[0] : 4;
    const bh = opts.brick ? opts.brick[1] : 1.6;
    const x0 = cx - (cols * bw) / 2;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'wall' + cx, cx, baseY, 1);
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        for (let r = 0; r < rows; r++) {
          const off = r % 2 ? bw / 2 : 0;
          for (let i = 0; i < cols; i++) {
            const appear = c01(p * rows * 1.2 - r);
            if (appear <= 0) continue;
            const order = (rows - 1 - r) / rows * 0.6 + hashN(r * 31 + i) * 0.4;
            const f = c01((fall - order * 0.7) / 0.3);
            const bx = x0 + i * bw - (r % 2 ? bw / 2 : 0);
            const by = baseY - (r + 1) * bh;
            const dx = (hashN(i * 7 + r) - 0.5) * 14 * f;
            const dy = f * f * (r + 2) * bh * 1.6;
            const rot = (hashN(i + r * 13) - 0.5) * 2.4 * f;
            const px = X(bx + bw / 2 + dx) - cw * 0.5;
            const py = Y(by + bh / 2 + dy) - chh * 0.5;
            c.save();
            c.translate(px, py);
            c.rotate(rot);
            c.globalAlpha = appear * (1 - f * 0.85) * 0.9;
            c.strokeStyle = col;
            c.lineWidth = 1.2 * ws;
            c.strokeRect(-bw * cw * 0.46, -bh * chh * 0.42, bw * cw * 0.92, bh * chh * 0.84);
            c.globalAlpha = appear * (1 - f) * 0.14;
            c.fillStyle = col;
            c.fillRect(-bw * cw * 0.46, -bh * chh * 0.42, bw * cw * 0.92, bh * chh * 0.84);
            c.restore();
          }
        }
      }
    });
    if (opts.label) this.drawBigText(cx, baseY - rows * bh - 2, opts.label, { size: opts.labelSize || 1.2, color: col, alpha: 1 - fall });
  };

  // grid.scanner(cx, cy, { w, h, state: 'scan' | 'pass' | 'fail', label, readout, color })
  // A verification gate drawn as an instrument: corner brackets, measured side rails, a sweeping
  // scan beam with a trail, and a status readout. Returns the beam's current y.
  Engine.prototype.drawScanner = function (cx, cy, opts = {}) {
    { const w = opts.w || 16, h = opts.h || 18; this._bb(cx - w / 2 - 1.5, cy - h / 2 - (opts.readout ? 2 : 0.5), cx + w / 2 + 1.5, cy + h / 2 + 2.6, 'scanner', opts.alpha !== undefined ? opts.alpha : 1); }
    const pal = this.palette;
    const w = opts.w || 16;
    const h = opts.h || 18;
    const state = opts.state || 'scan';
    const col = state === 'pass' ? '#00ff88' : state === 'fail' ? pal.danger : (opts.color || pal.warn);
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'scan' + cx, opts.key ? 0 : cx, opts.key ? 0 : cy, 0.9);
    const k = smooth(p);
    const time = this.time;
    const speed = opts.speed || 0.6;
    const beamT = state === 'scan' ? (time * speed) % 1 : 0.5;
    const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
    const fs = this.fontSize;
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        const L = Math.min(w * cw, h * chh) * 0.18 * k;
        c.strokeStyle = col;
        c.lineWidth = 2 * ws;
        c.globalAlpha = 0.95 * k;
        const corners = [[X(x0), Y(y0), 1, 1], [X(x1), Y(y0), -1, 1], [X(x0), Y(y1), 1, -1], [X(x1), Y(y1), -1, -1]];
        c.beginPath();
        for (const q of corners) { c.moveTo(q[0] + q[2] * L, q[1]); c.lineTo(q[0], q[1]); c.lineTo(q[0], q[1] + q[3] * L); }
        c.stroke();
        c.lineWidth = 1 * ws;
        c.globalAlpha = 0.45 * k;
        for (const x of [X(x0) - cw * 0.8, X(x1) + cw * 0.8]) {
          c.beginPath();
          c.moveTo(x, Y(y0) + L);
          c.lineTo(x, Y(y1) - L);
          c.stroke();
          for (let i = 0; i <= 12; i++) {
            const yy = Y(y0) + L + ((Y(y1) - Y(y0) - 2 * L) * i) / 12;
            const tl = i % 4 === 0 ? cw * 0.7 : cw * 0.35;
            c.beginPath();
            c.moveTo(x, yy);
            c.lineTo(x + (x < X(cx) ? tl : -tl), yy);
            c.stroke();
          }
        }
        const by = Y(y0) + (Y(y1) - Y(y0)) * beamT;
        if (state === 'scan') {
          const g = c.createLinearGradient(0, by - chh * 3, 0, by);
          g.addColorStop(0, 'rgba(0,0,0,0)');
          g.addColorStop(1, col);
          c.globalAlpha = 0.18 * k;
          c.fillStyle = g;
          c.fillRect(X(x0), by - chh * 3, X(x1) - X(x0), chh * 3);
          c.globalAlpha = 0.95 * k;
          c.fillStyle = '#ffffff';
          c.fillRect(X(x0) - cw * 0.5, by - 0.8, X(x1) - X(x0) + cw, 1.6);
        } else {
          c.globalAlpha = (0.1 + 0.06 * Math.sin(time * 6)) * k;
          c.fillStyle = col;
          c.fillRect(X(x0), Y(y0), X(x1) - X(x0), Y(y1) - Y(y0));
        }
        const status = state === 'pass' ? (opts.passText || 'PASS  ✓') : state === 'fail' ? (opts.failText || 'BLOCKED  ✕') : (opts.label || 'VERIFYING');
        c.font = `800 ${fs * 0.95}px "Cascadia Mono", Consolas, monospace`;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const tw = c.measureText(status).width + fs * 1.4;
        const sy = Y(y1) + chh * 1.6;
        c.globalAlpha = 0.2 * k;
        c.fillStyle = col;
        c.fillRect(X(cx) - tw / 2, sy - fs * 0.7, tw, fs * 1.4);
        c.globalAlpha = 0.95 * k;
        c.strokeStyle = col;
        c.lineWidth = 1.2 * ws;
        c.strokeRect(X(cx) - tw / 2, sy - fs * 0.7, tw, fs * 1.4);
        c.fillStyle = col;
        c.fillText(status, X(cx), sy);
        if (opts.readout) {
          c.font = `600 ${fs * 0.75}px "Cascadia Mono", Consolas, monospace`;
          c.globalAlpha = 0.75 * k;
          c.fillText(opts.readout, X(cx), Y(y0) - chh * 1.1);
        }
      }
    });
    return Y0toCells(y0, h, beamT);
    function Y0toCells(yy0, hh, t) { return yy0 + hh * t; }
  };

  // grid.mergeButton(cx, cy, { press (0..1), merged, title, sub, cursor (0..1) })
  // The real thing: a "Merge pull request" button with a branch-merge glyph, a cursor that moves
  // in and clicks, and a merged state.
  Engine.prototype.drawMergeButton = function (cx, cy, opts = {}) {
    { const sc = opts.scale || 1; const title = opts.merged ? (opts.mergedText || 'Merged') : (opts.title || 'Merge pull request'); const w = (title.length * 1.92 + 8.3) * sc * (this.fontSize / 16); this._bb(cx - w / 2, cy - 2 * sc, cx + w / 2, cy + (opts.sub ? 4 : 2) * sc, 'button'); }
    const G = '#00ff88';
    const press = c01(opts.press || 0);
    const merged = Boolean(opts.merged);
    const col = merged ? '#b48cff' : G;
    const p = opts.progress !== undefined ? opts.progress : revealK(this, opts.key || 'merge' + cx, opts.key ? 0 : cx, opts.key ? 0 : cy, 0.8);
    const k = smooth(p);
    const fs = this.fontSize * (opts.scale || 1);
    const time = this.time;
    const title = merged ? (opts.mergedText || 'Merged') : (opts.title || 'Merge pull request');
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        c.font = `800 ${fs * 2}px "Cascadia Mono", Consolas, monospace`;
        const tw = c.measureText(title).width;
        const bw = tw + fs * 5.2;
        const bh = fs * 3.8;
        const s = 1 - press * 0.05;
        const x = X(cx);
        const y = Y(cy);
        c.save();
        c.translate(x, y);
        c.scale(s * (0.9 + 0.1 * k), s * (0.9 + 0.1 * k));
        const r = bh * 0.22;
        const rr = (x0, y0, w0, h0) => {
          c.beginPath();
          c.moveTo(x0 + r, y0); c.lineTo(x0 + w0 - r, y0); c.quadraticCurveTo(x0 + w0, y0, x0 + w0, y0 + r);
          c.lineTo(x0 + w0, y0 + h0 - r); c.quadraticCurveTo(x0 + w0, y0 + h0, x0 + w0 - r, y0 + h0);
          c.lineTo(x0 + r, y0 + h0); c.quadraticCurveTo(x0, y0 + h0, x0, y0 + h0 - r);
          c.lineTo(x0, y0 + r); c.quadraticCurveTo(x0, y0, x0 + r, y0); c.closePath();
        };
        rr(-bw / 2, -bh / 2, bw, bh);
        c.globalAlpha = (0.22 + press * 0.35) * k;
        c.fillStyle = col;
        c.fill();
        c.globalAlpha = 0.95 * k;
        c.strokeStyle = col;
        c.lineWidth = 2 * ws;
        c.stroke();
        // branch-merge glyph: main line, a branch curving back in, three commit dots
        const gx = -bw / 2 + fs * 2.1;
        const gs = fs * 1.2;
        c.lineWidth = 2.2 * ws;
        c.strokeStyle = '#ffffff';
        c.beginPath();
        c.moveTo(gx - gs * 0.45, -gs);
        c.lineTo(gx - gs * 0.45, gs);
        c.moveTo(gx + gs * 0.5, -gs * 0.35);
        c.quadraticCurveTo(gx + gs * 0.5, gs * 0.45, gx - gs * 0.45, gs * 0.55);
        c.stroke();
        c.fillStyle = '#ffffff';
        for (const d of [[gx - gs * 0.45, -gs], [gx - gs * 0.45, gs], [gx + gs * 0.5, -gs * 0.45]]) { c.beginPath(); c.arc(d[0], d[1], 2.6 * ws, 0, Math.PI * 2); c.fill(); }
        c.font = `800 ${fs * 2}px "Cascadia Mono", Consolas, monospace`;
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillStyle = '#ffffff';
        c.fillText(title + (merged ? '  ✓' : ''), gx + gs * 1.4, 1);
        c.restore();
        if (opts.sub) {
          c.font = `600 ${fs * 1.05}px "Cascadia Mono", Consolas, monospace`;
          c.textAlign = 'center';
          c.globalAlpha = 0.7 * k;
          c.fillStyle = col;
          c.fillText(opts.sub, x, y + bh * 0.95);
        }
        if (press > 0.05) {
          c.globalAlpha = 0.35 * press;
          c.fillStyle = col;
          c.fillRect(x - bw * 0.55, y - bh * 0.7, bw * 1.1, bh * 1.4);
        }
        if (opts.cursor !== undefined) {
          const t = c01(opts.cursor);
          const e = t * t * (3 - 2 * t);
          const cx0 = x + bw * 0.9;
          const cy0 = y + bh * 2.2;
          const tx = x + bw * 0.18;
          const ty = y + bh * 0.1;
          const px = cx0 + (tx - cx0) * e;
          const py = cy0 + (ty - cy0) * e;
          const sc = fs * 1.3 * (1 - press * 0.15);
          c.globalAlpha = 0.95;
          c.fillStyle = '#ffffff';
          c.strokeStyle = '#000000';
          c.lineWidth = 1.2;
          c.beginPath();
          c.moveTo(px, py); c.lineTo(px, py + sc); c.lineTo(px + sc * 0.28, py + sc * 0.74); c.lineTo(px + sc * 0.48, py + sc * 1.12);
          c.lineTo(px + sc * 0.62, py + sc * 1.05); c.lineTo(px + sc * 0.42, py + sc * 0.68); c.lineTo(px + sc * 0.75, py + sc * 0.68); c.closePath();
          c.fill();
          c.stroke();
        }
        void time;
      }
    });
  };

  // grid.levelMeter(cx, cy, { levels: ['L1', ...], value (0..n), colors, h, w })
  // A segmented vertical gauge (an industry scale): segments fill up to `value`, labels at right,
  // a marker arrow at the current level.
  Engine.prototype.drawLevelMeter = function (cx, cy, opts = {}) {
    { const h = opts.h || 24, w = opts.w || 7; this._bb(cx - w / 2 - (opts.marker ? 8 : 3), cy - h / 2, cx + w / 2 + 16, cy + h / 2, 'meter'); }
    const pal = this.palette;
    const levels = opts.levels || ['LEVEL 1', 'LEVEL 2', 'LEVEL 3', 'LEVEL 4'];
    const n = levels.length;
    const v = Math.max(0, Math.min(n, opts.value || 0));
    const h = opts.h || 24;
    const w = opts.w || 7;
    const colors = opts.colors || [];
    const gap = 0.8;
    const segH = (h - gap * (n - 1)) / n;
    const y1 = cy + h / 2;
    const time = this.time;
    const fs = this.fontSize;
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        for (let i = 0; i < n; i++) {
          const yb = y1 - i * (segH + gap);
          const yt = yb - segH;
          const fill = Math.max(0, Math.min(1, v - i));
          const col = colors[i] || pal.accent;
          const active = v > i && v <= i + 1.001;
          c.globalAlpha = 0.85;
          c.strokeStyle = fill > 0 ? col : pal.dim;
          c.lineWidth = (active ? 2 : 1.2) * ws;
          c.strokeRect(X(cx - w / 2), Y(yt), w * cw, segH * chh);
          if (fill > 0) {
            const top = yb - segH * fill;
            c.globalAlpha = active ? 0.35 + 0.1 * Math.sin(time * 4) : 0.28;
            c.fillStyle = col;
            c.fillRect(X(cx - w / 2), Y(top), w * cw, (yb - top) * chh);
          }
          for (let t = 1; t < 4; t++) {
            c.globalAlpha = 0.35;
            c.beginPath();
            c.moveTo(X(cx + w / 2), Y(yt + (segH * t) / 4));
            c.lineTo(X(cx + w / 2) + cw * 0.6, Y(yt + (segH * t) / 4));
            c.stroke();
          }
          c.font = `${active ? 800 : 600} ${fs * (active ? 1.05 : 0.85)}px "Cascadia Mono", Consolas, monospace`;
          c.textAlign = 'left';
          c.textBaseline = 'middle';
          c.globalAlpha = fill > 0 ? 1 : 0.45;
          c.fillStyle = fill > 0 ? (active ? '#ffffff' : col) : pal.dim;
          c.fillText(levels[i], X(cx + w / 2) + cw * 2, Y(yt + segH / 2));
        }
        const my = y1 - Math.max(0, v - 0.5) * (segH + gap) - segH / 2 + (v < 0.5 ? 0 : 0);
        const ax = X(cx - w / 2) - cw * 1.2;
        c.globalAlpha = 1;
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.moveTo(ax, Y(my));
        c.lineTo(ax - cw * 1.6, Y(my) - chh * 0.5);
        c.lineTo(ax - cw * 1.6, Y(my) + chh * 0.5);
        c.closePath();
        c.fill();
        if (opts.marker) {
          c.font = `700 ${fs * 0.85}px "Cascadia Mono", Consolas, monospace`;
          c.textAlign = 'right';
          c.fillText(opts.marker, ax - cw * 2.4, Y(my));
        }
      }
    });
  };

  // grid.chatBubble(x, y, text, { color, align: 'left' | 'right', alpha }) — a message bubble
  Engine.prototype.drawChatBubble = function (x, y, text, opts = {}) {
    { const w = String(text).length * 0.96 * (opts.size || 1) + 1.6; const bx = opts.align === 'right' ? x - w : x; this._bb(bx, y - 1.1, bx + w, y + 1.1, 'bubble', opts.alpha !== undefined ? opts.alpha : 1); }
    const col = opts.color || this.palette.accent;
    const fs = this.fontSize;
    const alpha = opts.alpha !== undefined ? opts.alpha : 1;
    const right = opts.align === 'right';
    this.vItems.push({
      t: 'draw', h: this._hudMode,
      fn(c, X, Y, cw, chh, ws) {
        c.font = `600 ${fs * (opts.size || 1)}px "Cascadia Mono", Consolas, monospace`;
        const tw = c.measureText(text).width;
        const bw = tw + fs * 1.6;
        const bh = fs * 2;
        const x0 = right ? X(x) - bw : X(x);
        const y0 = Y(y) - bh / 2;
        const r = bh * 0.45;
        c.beginPath();
        c.moveTo(x0 + r, y0); c.lineTo(x0 + bw - r, y0); c.quadraticCurveTo(x0 + bw, y0, x0 + bw, y0 + r);
        c.lineTo(x0 + bw, y0 + bh - r); c.quadraticCurveTo(x0 + bw, y0 + bh, x0 + bw - r, y0 + bh);
        c.lineTo(x0 + r, y0 + bh); c.quadraticCurveTo(x0, y0 + bh, x0, y0 + bh - r);
        c.lineTo(x0, y0 + r); c.quadraticCurveTo(x0, y0, x0 + r, y0); c.closePath();
        c.globalAlpha = 0.22 * alpha;
        c.fillStyle = col;
        c.fill();
        c.globalAlpha = 0.95 * alpha;
        c.strokeStyle = col;
        c.lineWidth = 1.4 * ws;
        c.stroke();
        c.fillStyle = '#ffffff';
        c.textAlign = 'left';
        c.textBaseline = 'middle';
        c.fillText(text, x0 + fs * 0.8, Y(y) + 1);
      }
    });
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
      releaseNotes: (cx, cy, opts) => self.drawReleaseNotes(cx, cy, opts || {}),
      balance: (cx, cy, scale, angle, opts) => self.drawBalance(cx, cy, scale, angle, opts || {}),
      brickWall: (cx, baseY, cols, rows, opts) => self.drawBrickWall(cx, baseY, cols, rows, opts || {}),
      scanner: (cx, cy, opts) => self.drawScanner(cx, cy, opts || {}),
      mergeButton: (cx, cy, opts) => self.drawMergeButton(cx, cy, opts || {}),
      levelMeter: (cx, cy, opts) => self.drawLevelMeter(cx, cy, opts || {}),
      chatBubble: (x, y, text, opts) => self.drawChatBubble(x, y, text, opts || {})
    });
    return sb;
  };

  window.TermFXVisuals = { getImage, getText, LAND };
})();
