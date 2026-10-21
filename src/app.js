// ============================================================================
// TermFX Studio - Main Application & Director Controller
// ============================================================================

if (!window.termAPI) {
  window.termAPI = {
    windowAction: async (action) => {
      if (action === 'open-data-dir') {
        await fetch('/api/open-data-dir', { method: 'POST' });
      } else if (action === 'resize-720p') {
        window.resizeTo(1280, 720);
      } else if (action === 'resize-900p') {
        window.resizeTo(1600, 900);
      } else if (action === 'resize-1080p') {
        window.resizeTo(1920, 1080);
      } else if (action === 'maximize' || action === 'fullscreen') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
      } else if (action === 'close') {
        window.close();
      }
    },
    loadSettings: async () => (await fetch('/api/settings')).json(),
    saveSettings: async (s) => (await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s)
    })).json(),
    loadLibrary: async () => (await fetch('/api/library')).json(),
    saveSimulation: async (item) => (await fetch('/api/library/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    })).json(),
    deleteSimulation: async (id) => (await fetch('/api/library/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })).json(),
    fetchLocalModels: async (params) => (await fetch('/api/fetch-models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })).json(),
    generateAI: async (params) => (await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })).json()
  };
}

(async function () {
  const canvas = document.getElementById('ascii-canvas');
  const engine = new window.AsciiEngine(canvas);
  window.TermFX = { engine };

  let settings = {
    provider: 'lmstudio',
    lmstudioUrl: 'http://localhost:1234/v1',
    lmstudioModel: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3.1',
    geminiKey: '',
    geminiModel: 'gemini-2.5-flash',
    openaiKey: '',
    openaiModel: 'gpt-4o',
    anthropicKey: '',
    anthropicModel: 'claude-3-7-sonnet-latest',
    theme: 'cyberblue',
    crtScanlines: true,
    crtGlow: true,
    crtVignette: true,
    typingSound: true,
    typingSpeed: 34,
    fontSize: 16,
    outputMode: '1080p',
    renderFps: 60,
    renderFormat: 'mp4',
    bgMode: 'theme',
    stageDuration: 4.6,
    fx: {}
  };

  const FX_KEYS = ['holoHud', 'crtGlow', 'scanlines', 'subpixel', 'cameraMotion', 'textReveal', 'grain', 'vignette', 'bgGrid', 'transitionFx', 'introFx', 'showTimeline'];

  let savedSimulations = [];
  let allSimulations = [];
  let activeSimMeta = null;

  if (window.termAPI) {
    try {
      const loadedCfg = await window.termAPI.loadSettings();
      if (loadedCfg) settings = { ...settings, ...loadedCfg };
      if (!loadedCfg || !loadedCfg.theme) settings.theme = 'cyberblue';
      savedSimulations = (await window.termAPI.loadLibrary()) || [];
    } catch (err) {
      console.warn('Could not load initial settings:', err);
    }
  }

  function applyThemeToUI(themeKey) {
    const t = window.THEMES[themeKey] || window.THEMES.cyberblue;
    engine.setTheme(themeKey);
    const root = document.documentElement;
    root.style.setProperty('--bg-dark', t.bg);
    root.style.setProperty('--border-col', t.dim);
    root.style.setProperty('--text-primary', t.primary);
    root.style.setProperty('--text-secondary', t.secondary);
    root.style.setProperty('--text-accent', t.accent);
    root.style.setProperty('--text-warn', t.warn);
    root.style.setProperty('--text-danger', t.danger);
  }

  let activeCategory = 'ALL';
  let sceneFilterQuery = '';

  function matchesCategory(preset, cat) {
    if (!cat || cat === 'ALL') return true;
    const c = (preset.category || '').toUpperCase();
    const t = (preset.title || '').toUpperCase();
    if (cat === 'AI') return c.includes('AI') || t.includes('[AI');
    if (cat === 'SEC') return c.includes('SEC') || t.includes('[SEC') || t.includes('SECURITY');
    if (cat === 'NET') return c.includes('NET') || t.includes('[NET');
    if (cat === '3D' || cat === 'TECH') return c.includes('3D') || c.includes('GEOM') || c.includes('TECH') || t.includes('[3D') || t.includes('[TECH');
    return true;
  }

  function getFilteredBuiltins() {
    const q = sceneFilterQuery.trim().toLowerCase();
    return window.BUILTIN_PRESETS.filter(p => {
      if (!matchesCategory(p, activeCategory)) return false;
      if (!q) return true;
      return (p.title || '').toLowerCase().includes(q) ||
             (p.shortLabel || '').toLowerCase().includes(q) ||
             (p.prompt || '').toLowerCase().includes(q);
    });
  }

  function rebuildSimulationList() {
    allSimulations = [
      ...savedSimulations.map(s => ({ ...s, isSaved: true })),
      ...window.BUILTIN_PRESETS.map(p => ({ ...p, isSaved: false }))
    ];

    const sel = document.getElementById('preset-select');
    sel.innerHTML = '';

    if (savedSimulations.length > 0) {
      const grpSaved = document.createElement('optgroup');
      grpSaved.label = '★ Saved Scenes';
      for (const s of savedSimulations) {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `★ ${s.title}`;
        grpSaved.appendChild(opt);
      }
      sel.appendChild(grpSaved);
    }

    const countLabel = document.getElementById('scene-count-label');
    if (countLabel) countLabel.textContent = `SCENES (${window.BUILTIN_PRESETS.length})`;

    const grpBuiltin = document.createElement('optgroup');
    grpBuiltin.label = `◈ Built-In 3D Showcases (${window.BUILTIN_PRESETS.length})`;
    for (const p of window.BUILTIN_PRESETS) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.shortLabel || p.title;
      grpBuiltin.appendChild(opt);
    }
    sel.appendChild(grpBuiltin);

    if (activeSimMeta) {
      sel.value = activeSimMeta.id;
    }
    renderQuickSceneButtons();
  }

  function renderQuickSceneButtons() {
    const qContainer = document.getElementById('quick-scene-buttons');
    if (!qContainer) return;
    qContainer.innerHTML = '';
    const filtered = getFilteredBuiltins();
    let activeBtn = null;

    for (const preset of filtered) {
      const btn = document.createElement('button');
      const isActive = activeSimMeta && activeSimMeta.id === preset.id;
      btn.className = isActive ? 'active' : '';
      btn.textContent = preset.shortLabel || preset.title;
      btn.title = preset.title;
      btn.addEventListener('click', () => {
        selectAndRunSimulation(preset, { autoType: false });
      });
      qContainer.appendChild(btn);
      if (isActive) activeBtn = btn;
    }

    if (activeBtn) {
      activeBtn.scrollIntoView({ block: 'nearest' });
    }
  }

  function stepScene(delta) {
    const list = getFilteredBuiltins();
    const pool = list.length > 0 ? list : window.BUILTIN_PRESETS;
    if (!pool.length) return;
    const curIdx = pool.findIndex(p => activeSimMeta && p.id === activeSimMeta.id);
    const nextIdx = curIdx < 0 ? 0 : (curIdx + delta + pool.length) % pool.length;
    selectAndRunSimulation(pool[nextIdx], { autoType: false });
  }

  function renderPhaseButtons() {
    const container = document.getElementById('phase-buttons');
    container.innerHTML = '';
    const phases = activeSimMeta?.phases || ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'];

    phases.forEach((name, idx) => {
      const num = idx + 1;
      const btn = document.createElement('button');
      btn.className = 'phase-btn' + (engine.phase === num ? ' active' : '');
      // Long stage lists stay on one line: only the active stage shows its name
      btn.textContent = phases.length > 4 && engine.phase !== num ? `${num}` : `${num}. ${name}`;
      btn.title = `Stage ${num}: ${name} (Press SPACE or ${num})`;
      btn.addEventListener('click', () => {
        engine.setPhase(num);
        renderPhaseButtons();
      });
      container.appendChild(btn);
    });
    renderNarration();
  }

  // Script line for the current stage, shown under the stage while recording VO
  function renderNarration() {
    const strip = document.getElementById('narration-strip');
    const line = activeSimMeta?.narration?.[engine.phase - 1];
    strip.classList.toggle('hidden', !line);
    if (!line) return;
    const dur = engine.stageHold(engine.phase);
    document.getElementById('narration-tag').textContent = `VO ${engine.phase}/${engine.phaseCount} · ${dur.toFixed(1)}s`;
    document.getElementById('narration-text').textContent = line;
  }

  engine.onPhaseAutoChange = () => {
    renderPhaseButtons();
  };

  function selectAndRunSimulation(simMeta, { autoType = false } = {}) {
    activeSimMeta = simMeta;
    const compiled = window.compileSimulationFromCode(simMeta);
    engine.typer.speedMs = Number(settings.typingSpeed) || 34;
    engine.loadSimulation(compiled, { autoType });

    const sel = document.getElementById('preset-select');
    if (sel) sel.value = simMeta.id;

    const promptInput = document.getElementById('prompt-input');
    if (promptInput && simMeta.prompt) {
      promptInput.value = simMeta.prompt;
    }

    renderQuickSceneButtons();
    renderPhaseButtons();
  }

  async function handlePromptExecution({ autoType = false } = {}) {
    const promptInput = document.getElementById('prompt-input');
    const statusPill = document.getElementById('ai-status-pill');
    const promptText = promptInput.value.trim();
    if (!promptText) return;

    const btnGen = document.getElementById('btn-generate');
    btnGen.disabled = true;
    btnGen.textContent = '...';
    statusPill.textContent = 'GENERATING...';

    try {
      const { simulation, source } = await window.generateSimulationFromPrompt(promptText, settings);

      const toSave = {
        id: simulation.id,
        title: simulation.title,
        prompt: simulation.prompt,
        category: simulation.category,
        phases: simulation.phases,
        code: simulation.code
      };

      savedSimulations.unshift(toSave);
      if (window.termAPI) {
        await window.termAPI.saveSimulation(toSave);
      }

      rebuildSimulationList();
      selectAndRunSimulation(toSave, { autoType });
      statusPill.textContent = source.toUpperCase();
      promptInput.blur();
    } catch (err) {
      statusPill.textContent = 'ERR';
    } finally {
      btnGen.disabled = false;
      btnGen.textContent = 'Run';
    }
  }

  // --- Wire UI Controls ---
  document.getElementById('preset-select').addEventListener('change', (e) => {
    const found = allSimulations.find(s => s.id === e.target.value);
    if (found) selectAndRunSimulation(found, { autoType: false });
  });

  const catTabs = document.getElementById('category-tabs');
  if (catTabs) {
    catTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      activeCategory = btn.getAttribute('data-cat') || 'ALL';
      catTabs.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
      renderQuickSceneButtons();
    });
  }

  const filterInput = document.getElementById('scene-filter-input');
  if (filterInput) {
    filterInput.addEventListener('input', (e) => {
      sceneFilterQuery = e.target.value || '';
      renderQuickSceneButtons();
    });
  }

  const btnPrevScene = document.getElementById('btn-prev-scene');
  if (btnPrevScene) btnPrevScene.addEventListener('click', () => stepScene(-1));
  const btnNextScene = document.getElementById('btn-next-scene');
  if (btnNextScene) btnNextScene.addEventListener('click', () => stepScene(1));

  document.getElementById('btn-autotype').addEventListener('click', () => {
    if (!activeSimMeta) return;
    const customPrompt = document.getElementById('prompt-input').value.trim() || activeSimMeta.prompt || activeSimMeta.title;
    selectAndRunSimulation({ ...activeSimMeta, prompt: customPrompt }, { autoType: true });
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    if (activeSimMeta) selectAndRunSimulation(activeSimMeta, { autoType: false });
  });

  document.getElementById('theme-select').addEventListener('change', async (e) => {
    settings.theme = e.target.value;
    applyThemeToUI(settings.theme);
    if (window.termAPI) await window.termAPI.saveSettings({ theme: settings.theme });
  });

  // --- Cinematic FX toggles (every effect is rendered into the canvas, so exports match the preview) ---
  function persistSettings(partial) {
    if (window.termAPI) window.termAPI.saveSettings(partial).catch(() => {});
  }

  function applyFxSettings() {
    const fx = settings.fx || {};
    for (const key of FX_KEYS) {
      if (typeof fx[key] === 'boolean') engine[key] = fx[key];
    }
    document.querySelectorAll('button[data-fx]').forEach(btn => {
      btn.classList.toggle('active', Boolean(engine[btn.dataset.fx]));
    });
  }

  document.querySelectorAll('button[data-fx]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.fx;
      engine[key] = !engine[key];
      settings.fx = { ...(settings.fx || {}), [key]: engine[key] };
      btn.classList.toggle('active', engine[key]);
      persistSettings({ fx: settings.fx });
    });
  });

  const outputSelect = document.getElementById('output-select');
  outputSelect.addEventListener('change', (e) => {
    settings.outputMode = e.target.value;
    engine.setOutputMode(settings.outputMode);
    persistSettings({ outputMode: settings.outputMode });
  });

  const fpsSelect = document.getElementById('fps-select');
  fpsSelect.addEventListener('change', (e) => {
    settings.renderFps = Number(e.target.value) || 60;
    persistSettings({ renderFps: settings.renderFps });
  });

  const bgSelect = document.getElementById('bg-select');
  bgSelect.addEventListener('change', (e) => {
    settings.bgMode = e.target.value;
    engine.bgMode = settings.bgMode;
    canvas.classList.toggle('alpha-preview', settings.bgMode === 'alpha');
    persistSettings({ bgMode: settings.bgMode });
  });

  const formatSelect = document.getElementById('format-select');
  formatSelect.addEventListener('change', (e) => {
    settings.renderFormat = e.target.value;
    persistSettings({ renderFormat: settings.renderFormat });
  });

  const stageInput = document.getElementById('cfg-stage-seconds');
  stageInput.addEventListener('change', (e) => {
    const v = Math.max(1.5, Math.min(30, Number(e.target.value) || 4.6));
    e.target.value = v;
    settings.stageDuration = v;
    engine.stageDuration = v;
    persistSettings({ stageDuration: v });
  });

  let paused = false;
  const btnPause = document.getElementById('btn-pause');
  function setPaused(p) {
    paused = p;
    btnPause.classList.toggle('active', paused);
    btnPause.textContent = paused ? '▶ [P]' : '❚❚ [P]';
  }
  btnPause.addEventListener('click', () => setPaused(!paused));

  // --- Toast ---
  let toastTimer = null;
  function toast(msg, ms = 3200) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('visible'), ms);
  }

  // --- Frame-exact Render & Snapshot ---
  const canRender = location.protocol.startsWith('http');
  let rendering = null;
  let lastRenderOutput = null;

  function canvasToPng() {
    return new Promise((resolve, reject) => {
      canvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
  }

  // PNG frames are encoded from a copy: reading the main canvas back every
  // frame makes Chrome drop it to CPU rendering, which cripples the bloom
  let readbackCanvas = null;
  function pngFromCopy(w, h) {
    if (!readbackCanvas || readbackCanvas.width !== w || readbackCanvas.height !== h) {
      readbackCanvas = document.createElement('canvas');
      readbackCanvas.width = w;
      readbackCanvas.height = h;
    }
    const rctx = readbackCanvas.getContext('2d');
    rctx.clearRect(0, 0, w, h);
    rctx.drawImage(canvas, 0, 0);
    return new Promise((resolve, reject) => {
      readbackCanvas.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png');
    });
  }

  // H.264 straight from the canvas on the GPU via WebCodecs; only compressed
  // chunks travel to the server, where ffmpeg muxes them into an MP4
  async function createH264Encoder(w, h, fps) {
    if (typeof VideoEncoder !== 'function') return null;
    const base = {
      codec: w * h > 1920 * 1088 ? 'avc1.640034' : 'avc1.640032',
      width: w,
      height: h,
      framerate: fps,
      latencyMode: 'quality',
      avc: { format: 'annexb' }
    };
    const candidates = [
      { ...base, bitrateMode: 'quantizer' },
      { ...base, bitrateMode: 'variable', bitrate: Math.round(w * h * fps * 0.4) }
    ];
    for (const cfg of candidates) {
      try {
        const res = await VideoEncoder.isConfigSupported(cfg);
        if (!res.supported) continue;
        const enc = { chunks: [], bytes: 0, frames: 0, error: null, quantizer: cfg.bitrateMode === 'quantizer' };
        enc.encoder = new VideoEncoder({
          output: (chunk) => {
            const buf = new Uint8Array(chunk.byteLength);
            chunk.copyTo(buf);
            enc.chunks.push(buf);
            enc.bytes += buf.byteLength;
            enc.frames++;
          },
          error: (e) => { enc.error = e; }
        });
        enc.encoder.configure(cfg);
        return enc;
      } catch (_) {}
    }
    return null;
  }

  async function postFrames(jobId, body, count = 1) {
    const r = await fetch(`/api/render/frame?id=${jobId}&count=${count}`, { method: 'POST', body });
    const res = await r.json();
    if (!res.ok) throw new Error(res.error || 'Frame write failed');
  }

  async function postJson(url, body) {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {})
    });
    return r.json();
  }

  function setRenderProgress(title, ratio, detail) {
    document.getElementById('render-title').textContent = title;
    document.getElementById('render-fill').style.width = `${(ratio * 100).toFixed(1)}%`;
    document.getElementById('render-detail').textContent = detail;
  }

  async function renderVideo() {
    if (rendering || !activeSimMeta) return;
    if (!canRender) {
      toast('Rendering needs the TermFX server (launch via TermFX.exe or `node server.js`).');
      return;
    }
    const fps = Number(settings.renderFps) || 60;
    const format = settings.renderFormat || 'mp4';
    const bgMode = format === 'mp4' && engine.bgMode === 'alpha' ? 'theme' : engine.bgMode;
    const [w, h] = engine.outputSize;

    rendering = { cancel: false };
    document.body.classList.add('rendering');
    const prevAuto = engine.autoPlayStages;
    const prevSound = engine.soundEnabled;
    const prevParallax = engine.mouseParallax;
    const prevGrain = engine.grain;
    engine.autoPlayStages = true;
    engine.soundEnabled = false;
    engine.mouseParallax = false;
    engine.parallaxX = 0;
    engine.parallaxY = 0;
    // Grain exists to stop YouTube's encoder banding the bloom; in intermediate
    // formats (ProRes / PNG) it only bloats files, so leave it to the editor
    if (format !== 'mp4') engine.grain = false;

    let job = null;
    let enc = null;
    try {
      if (format === 'mp4') enc = await createH264Encoder(w, h, fps);
      job = await postJson('/api/render/start', { name: activeSimMeta.title, format, fps, input: enc ? 'h264' : 'png' });
      if (!job.ok) throw new Error(job.error || 'Could not start render');
      if (job.fallback) toast('MP4/ProRes need ffmpeg + WebCodecs here; rendering a PNG sequence instead.');
      if (job.input !== 'h264' && enc) {
        enc.encoder.close();
        enc = null;
      }

      selectAndRunSimulation(activeSimMeta, { autoType: false });
      const dt = 1 / fps;
      const total = Math.ceil(engine.timelineDuration() * fps);
      const label = `${(job.input === 'h264' ? 'MP4' : job.format).toUpperCase()} ${w}x${h} @ ${fps}fps`;
      const usPerFrame = 1e6 / fps;
      let pending = Promise.resolve();
      let sentFrames = 0;
      const t0 = performance.now();

      // Batches go up as plain ArrayBuffers so long renders never touch
      // Chromium's capped blob store
      const flushChunks = () => {
        if (!enc || !enc.chunks.length) return;
        const blob = new Uint8Array(enc.bytes);
        let off = 0;
        for (const c of enc.chunks) {
          blob.set(c, off);
          off += c.byteLength;
        }
        const count = enc.frames - sentFrames;
        sentFrames = enc.frames;
        enc.chunks = [];
        enc.bytes = 0;
        pending = pending.then(() => postFrames(job.id, blob, count));
      };

      for (let f = 0; f < total; f++) {
        if (rendering.cancel) break;
        engine.update(dt);
        engine.render({ bgMode });
        if (enc) {
          if (enc.error) throw enc.error;
          const frame = new VideoFrame(canvas, { timestamp: Math.round(f * usPerFrame), duration: Math.round(usPerFrame) });
          const opts = { keyFrame: f % (fps * 2) === 0 };
          if (enc.quantizer) opts.avc = { quantizer: 16 };
          enc.encoder.encode(frame, opts);
          frame.close();
          if (enc.encoder.encodeQueueSize > 4) {
            await new Promise(r => enc.encoder.addEventListener('dequeue', r, { once: true }));
          }
          if (enc.bytes > 2 * 1024 * 1024) flushChunks();
        } else {
          const body = await pngFromCopy(w, h);
          await pending;
          pending = postFrames(job.id, body);
        }
        if (f % 3 === 0) {
          const elapsed = (performance.now() - t0) / 1000;
          const eta = elapsed / (f + 1) * (total - f - 1);
          setRenderProgress(`● RENDERING ${label}`, (f + 1) / total, `Frame ${f + 1} / ${total} · ETA ${Math.ceil(eta)}s`);
        }
        if (f % 2 === 0) renderPhaseButtons();
      }
      if (enc) {
        await enc.encoder.flush();
        enc.encoder.close();
        flushChunks();
        enc = null;
      }
      await pending;
      setRenderProgress('FINALIZING', 1, 'Encoding...');
      const done = await postJson('/api/render/finish', { id: job.id, cancel: rendering.cancel });
      if (rendering.cancel) toast('Render cancelled.');
      else if (done.ok) {
        lastRenderOutput = done.output;
        toast(`Saved ${done.frames} frames → ${done.output}`, 6000);
      } else {
        toast(`Render failed: ${done.error || 'unknown error'}`, 7000);
      }
    } catch (err) {
      console.error(err);
      if (enc) {
        try { enc.encoder.close(); } catch (_) {}
      }
      if (job && job.id) postJson('/api/render/finish', { id: job.id, cancel: true }).catch(() => {});
      toast(`Render failed: ${err.message || err}`, 7000);
    } finally {
      engine.autoPlayStages = prevAuto;
      engine.soundEnabled = prevSound;
      engine.mouseParallax = prevParallax;
      engine.grain = prevGrain;
      document.body.classList.remove('rendering');
      rendering = null;
      lastTime = performance.now();
      renderPhaseButtons();
    }
  }

  async function saveSnapshot() {
    engine.render();
    const blob = await canvasToPng();
    const name = activeSimMeta?.title || 'scene';
    if (canRender) {
      try {
        const r = await fetch(`/api/render/snapshot?name=${encodeURIComponent(name)}`, { method: 'POST', body: blob });
        const res = await r.json();
        if (res.ok) {
          lastRenderOutput = res.output;
          toast(`Snapshot → ${res.output}`);
          return;
        }
      } catch (_) {}
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `termfx-${Date.now()}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  document.getElementById('btn-render').addEventListener('click', () => renderVideo());
  document.getElementById('btn-snapshot').addEventListener('click', () => saveSnapshot());
  document.getElementById('btn-open-renders').addEventListener('click', () => {
    if (canRender) postJson('/api/render/reveal', { output: lastRenderOutput }).catch(() => {});
  });
  document.getElementById('btn-open-assets').addEventListener('click', () => {
    if (canRender) postJson('/api/open-assets', {}).catch(() => {});
    else toast('Assets folder: termfx_data/assets (start TermFX with its server to open it)');
  });

  document.getElementById('btn-generate').addEventListener('click', () => handlePromptExecution({ autoType: false }));
  document.getElementById('btn-generate-autotype').addEventListener('click', () => handlePromptExecution({ autoType: true }));

  document.getElementById('prompt-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handlePromptExecution({ autoType: e.shiftKey });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      e.target.blur();
      toggleCleanMode();
    }
  });

  // Clean OBS Recording Mode Toggle (Hides sidebar & top bar, keeps bottom prompt line)
  let cleanBadgeTimeout = null;
  function toggleCleanMode(forceState) {
    const isClean = typeof forceState === 'boolean'
      ? forceState
      : !document.body.classList.contains('clean-recording');
    document.body.classList.toggle('clean-recording', isClean);
    engine.resize();
    setTimeout(() => engine.resize(), 60);
    setTimeout(() => engine.resize(), 180);

    const badge = document.getElementById('clean-mode-badge');
    if (isClean) {
      badge.classList.add('visible');
      clearTimeout(cleanBadgeTimeout);
      cleanBadgeTimeout = setTimeout(() => badge.classList.remove('visible'), 2200);
    } else {
      badge.classList.remove('visible');
    }
  }

  document.getElementById('btn-clean-view').addEventListener('click', () => toggleCleanMode());

  const winActions = {
    'btn-720p': 'resize-720p',
    'btn-1080p': 'resize-1080p',
    'btn-min': 'minimize',
    'btn-max': 'maximize',
    'btn-close': 'close'
  };
  for (const [btnId, act] of Object.entries(winActions)) {
    const el = document.getElementById(btnId);
    if (el) {
      el.addEventListener('click', () => {
        if (window.termAPI) window.termAPI.windowAction(act);
      });
    }
  }

  // --- AI Backend Modal ---
  const modalAi = document.getElementById('modal-ai');
  const providerSelect = document.getElementById('cfg-provider');

  function updateProviderBoxes() {
    const val = providerSelect.value;
    ['lmstudio', 'ollama', 'gemini', 'openai', 'anthropic'].forEach(p => {
      const box = document.getElementById(`provider-box-${p}`);
      if (box) box.style.display = (p === val) ? 'block' : 'none';
    });
  }

  providerSelect.addEventListener('change', updateProviderBoxes);

  document.getElementById('btn-ai-settings').addEventListener('click', () => {
    providerSelect.value = settings.provider || 'lmstudio';
    document.getElementById('cfg-lmstudio-url').value = settings.lmstudioUrl || 'http://localhost:1234/v1';
    document.getElementById('cfg-lmstudio-model').value = settings.lmstudioModel || '';
    document.getElementById('cfg-ollama-url').value = settings.ollamaUrl || 'http://localhost:11434';
    document.getElementById('cfg-ollama-model').value = settings.ollamaModel || 'llama3.1';
    document.getElementById('cfg-gemini-key').value = settings.geminiKey || '';
    document.getElementById('cfg-gemini-model').value = settings.geminiModel || 'gemini-2.5-flash';
    document.getElementById('cfg-openai-key').value = settings.openaiKey || '';
    document.getElementById('cfg-openai-model').value = settings.openaiModel || 'gpt-4o';
    document.getElementById('cfg-anthropic-key').value = settings.anthropicKey || '';
    document.getElementById('cfg-anthropic-model').value = settings.anthropicModel || 'claude-3-7-sonnet-latest';
    document.getElementById('cfg-typing-speed').value = settings.typingSpeed || 34;
    document.getElementById('cfg-font-size').value = settings.fontSize || 16;
    updateProviderBoxes();
    modalAi.classList.add('open');
  });

  document.getElementById('btn-close-ai-modal').addEventListener('click', () => modalAi.classList.remove('open'));

  document.getElementById('btn-detect-lmstudio').addEventListener('click', async () => {
    const statusEl = document.getElementById('ai-detect-status');
    const baseUrl = document.getElementById('cfg-lmstudio-url').value.trim();
    statusEl.textContent = 'Querying LM Studio...';
    if (!window.termAPI) return;
    const res = await window.termAPI.fetchLocalModels({ provider: 'lmstudio', baseUrl });
    if (res.ok && res.models.length > 0) {
      document.getElementById('cfg-lmstudio-model').value = res.models[0];
      statusEl.textContent = `✓ Connected: ${res.models.join(', ')}`;
    } else {
      statusEl.textContent = `✕ Not reachable at ${baseUrl}`;
    }
  });

  document.getElementById('btn-detect-ollama').addEventListener('click', async () => {
    const statusEl = document.getElementById('ai-detect-status');
    const baseUrl = document.getElementById('cfg-ollama-url').value.trim();
    statusEl.textContent = 'Querying Ollama...';
    if (!window.termAPI) return;
    const res = await window.termAPI.fetchLocalModels({ provider: 'ollama', baseUrl });
    if (res.ok && res.models.length > 0) {
      document.getElementById('cfg-ollama-model').value = res.models[0];
      statusEl.textContent = `✓ Models: ${res.models.join(', ')}`;
    } else {
      statusEl.textContent = `✕ Not reachable at ${baseUrl}`;
    }
  });

  document.getElementById('btn-open-data-folder').addEventListener('click', () => {
    if (window.termAPI) window.termAPI.windowAction('open-data-dir');
  });

  document.getElementById('btn-save-ai-settings').addEventListener('click', async () => {
    settings.provider = providerSelect.value;
    settings.lmstudioUrl = document.getElementById('cfg-lmstudio-url').value.trim();
    settings.lmstudioModel = document.getElementById('cfg-lmstudio-model').value.trim();
    settings.ollamaUrl = document.getElementById('cfg-ollama-url').value.trim();
    settings.ollamaModel = document.getElementById('cfg-ollama-model').value.trim();
    settings.geminiKey = document.getElementById('cfg-gemini-key').value.trim();
    settings.geminiModel = document.getElementById('cfg-gemini-model').value.trim();
    settings.openaiKey = document.getElementById('cfg-openai-key').value.trim();
    settings.openaiModel = document.getElementById('cfg-openai-model').value.trim();
    settings.anthropicKey = document.getElementById('cfg-anthropic-key').value.trim();
    settings.anthropicModel = document.getElementById('cfg-anthropic-model').value.trim();
    settings.typingSpeed = Number(document.getElementById('cfg-typing-speed').value) || 34;
    settings.fontSize = Number(document.getElementById('cfg-font-size').value) || 16;

    engine.setFontSize(settings.fontSize);
    if (window.termAPI) await window.termAPI.saveSettings(settings);
    document.getElementById('ai-status-pill').textContent = settings.provider.toUpperCase();
    modalAi.classList.remove('open');
  });

  // --- Live Code Inspector Modal ---
  const modalCode = document.getElementById('modal-code');
  document.getElementById('btn-code').addEventListener('click', () => {
    if (!activeSimMeta) return;
    document.getElementById('code-sim-title').value = activeSimMeta.title || 'Custom Scene';
    document.getElementById('code-sim-phases').value = (activeSimMeta.phases || []).join(', ');
    document.getElementById('code-sim-editor').value = (activeSimMeta.code || '').trim();
    modalCode.classList.add('open');
  });

  document.getElementById('btn-close-code-modal').addEventListener('click', () => modalCode.classList.remove('open'));

  document.getElementById('btn-apply-code').addEventListener('click', () => {
    const title = document.getElementById('code-sim-title').value.trim() || 'Custom Scene';
    const phases = document.getElementById('code-sim-phases').value.split(',').map(s => s.trim()).filter(Boolean);
    const code = document.getElementById('code-sim-editor').value;
    activeSimMeta = {
      ...activeSimMeta,
      title,
      phases: phases.length ? phases : ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
      code
    };
    selectAndRunSimulation(activeSimMeta, { autoType: false });
  });

  document.getElementById('btn-save-code-preset').addEventListener('click', async () => {
    const title = document.getElementById('code-sim-title').value.trim() || 'Custom Scene';
    const phases = document.getElementById('code-sim-phases').value.split(',').map(s => s.trim()).filter(Boolean);
    const code = document.getElementById('code-sim-editor').value;
    const item = {
      id: activeSimMeta?.isSaved ? activeSimMeta.id : ('custom-' + Date.now()),
      title,
      prompt: activeSimMeta?.prompt || title,
      category: 'Saved Custom',
      phases: phases.length ? phases : ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'],
      code
    };

    const existingIdx = savedSimulations.findIndex(s => s.id === item.id);
    if (existingIdx >= 0) savedSimulations[existingIdx] = item;
    else savedSimulations.unshift(item);

    if (window.termAPI) await window.termAPI.saveSimulation(item);
    rebuildSimulationList();
    selectAndRunSimulation(item, { autoType: false });
    modalCode.classList.remove('open');
  });

  document.getElementById('btn-delete-saved').addEventListener('click', async () => {
    if (!activeSimMeta) return;
    savedSimulations = savedSimulations.filter(s => s.id !== activeSimMeta.id);
    if (window.termAPI) await window.termAPI.deleteSimulation(activeSimMeta.id);
    rebuildSimulationList();
    selectAndRunSimulation(window.BUILTIN_PRESETS[0], { autoType: false });
    modalCode.classList.remove('open');
  });

  // --- Global Hotkeys ---
  window.addEventListener('keydown', (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase();
    const isTypingInInput = (tag === 'input' || tag === 'textarea' || tag === 'select');

    if (rendering) {
      if (e.key === 'Escape') rendering.cancel = true;
      e.preventDefault();
      return;
    }

    if (e.key === 'F2') {
      e.preventDefault();
      document.getElementById('btn-autotype').click();
      return;
    }

    if (e.key === 'F1' || (e.key === 'Tab' && !isTypingInInput)) {
      e.preventDefault();
      toggleCleanMode();
      return;
    }

    if (e.key === 'F8') {
      e.preventDefault();
      saveSnapshot();
      return;
    }

    if (e.key === 'F9') {
      e.preventDefault();
      renderVideo();
      return;
    }

    if (e.key === 'Escape') {
      if (modalAi.classList.contains('open')) modalAi.classList.remove('open');
      else if (modalCode.classList.contains('open')) modalCode.classList.remove('open');
      else if (document.body.classList.contains('clean-recording')) toggleCleanMode(false);
      return;
    }

    if (isTypingInInput) return;

    if (e.code === 'Space') {
      e.preventDefault();
      if (engine.typer.active) {
        engine.typer.typedLen = engine.typer.prompt.length;
        engine.typer.stage = 'booting';
        engine.typer.bootTime = 1.0;
      } else {
        engine.nextPhase();
        renderPhaseButtons();
      }
    } else if (/^[1-9]$/.test(e.key) && parseInt(e.key, 10) <= engine.phaseCount) {
      e.preventDefault();
      engine.setPhase(parseInt(e.key, 10));
      renderPhaseButtons();
    } else if (e.key.toLowerCase() === 'p') {
      e.preventDefault();
      setPaused(!paused);
    } else if (e.key === '.' && paused) {
      e.preventDefault();
      engine.update(1 / 60);
    } else if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      if (activeSimMeta) selectAndRunSimulation(activeSimMeta, { autoType: false });
    } else if (e.key === '[') {
      e.preventDefault();
      stepScene(-1);
    } else if (e.key === ']') {
      e.preventDefault();
      stepScene(1);
    }
  });

  // Initialize
  document.getElementById('theme-select').value = settings.theme || 'cyberblue';
  applyThemeToUI(settings.theme || 'cyberblue');
  outputSelect.value = settings.outputMode || '1080p';
  fpsSelect.value = String(settings.renderFps || 60);
  bgSelect.value = settings.bgMode || 'theme';
  formatSelect.value = settings.renderFormat || 'mp4';
  stageInput.value = settings.stageDuration || 4.6;
  engine.outputMode = outputSelect.value;
  engine.bgMode = bgSelect.value;
  engine.stageDuration = Number(stageInput.value) || 4.6;
  canvas.classList.toggle('alpha-preview', engine.bgMode === 'alpha');
  applyFxSettings();
  engine.setFontSize(settings.fontSize || 16);

  rebuildSimulationList();
  selectAndRunSimulation(window.BUILTIN_PRESETS[0], { autoType: false });

  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (!rendering) {
      if (!paused) engine.update(dt);
      engine.render();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
