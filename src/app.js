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
    fontSize: 16
  };

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
      btn.textContent = `${num}. ${name}`;
      btn.title = `Stage ${num}: ${name} (Press SPACE or ${num})`;
      btn.addEventListener('click', () => {
        engine.setPhase(num);
        renderPhaseButtons();
      });
      container.appendChild(btn);
    });
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

  const crtOverlay = document.getElementById('crt-overlay');
  document.getElementById('btn-scanlines').addEventListener('click', (e) => {
    settings.crtScanlines = !settings.crtScanlines;
    crtOverlay.classList.toggle('scanlines', settings.crtScanlines);
    e.currentTarget.classList.toggle('active', settings.crtScanlines);
  });

  document.getElementById('btn-glow').addEventListener('click', (e) => {
    settings.crtGlow = !settings.crtGlow;
    engine.crtGlow = settings.crtGlow;
    e.currentTarget.classList.toggle('active', settings.crtGlow);
  });

  const btnHoloHud = document.getElementById('btn-holo-hud');
  if (btnHoloHud) {
    btnHoloHud.addEventListener('click', (e) => {
      engine.holoHud = !engine.holoHud;
      e.currentTarget.classList.toggle('active', engine.holoHud);
    });
  }

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
    } else if (['1', '2', '3', '4'].includes(e.key)) {
      e.preventDefault();
      engine.setPhase(parseInt(e.key, 10));
      renderPhaseButtons();
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
  engine.setFontSize(settings.fontSize || 16);

  rebuildSimulationList();
  selectAndRunSimulation(window.BUILTIN_PRESETS[0], { autoType: false });

  let lastTime = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    engine.update(dt);
    engine.render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
