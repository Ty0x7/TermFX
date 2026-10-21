const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;

// Store config and saved presets in a portable 'data' directory next to the app if writable,
// falling back to Electron userData directory.
function getDataDir() {
  const portableDir = path.join(process.cwd(), 'termfx_data');
  try {
    if (!fs.existsSync(portableDir)) {
      fs.mkdirSync(portableDir, { recursive: true });
    }
    return portableDir;
  } catch (e) {
    const fallback = path.join(app.getPath('userData'), 'termfx_data');
    if (!fs.existsSync(fallback)) {
      fs.mkdirSync(fallback, { recursive: true });
    }
    return fallback;
  }
}

const DEFAULT_SETTINGS = {
  provider: 'lmstudio', // 'lmstudio' | 'ollama' | 'gemini' | 'openai' | 'anthropic' | 'offline'
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
  theme: 'cyberblue', // 'cyberblue' | 'cyberpunk' | 'matrix' | 'amber' | 'redalert' | 'clean'
  crtScanlines: true,
  crtGlow: true,
  crtVignette: true,
  typingSound: true,
  typingSpeed: 38, // ms per char
  fontSize: 16
};

function loadSettings() {
  const file = path.join(getDataDir(), 'settings.json');
  try {
    if (fs.existsSync(file)) {
      const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
      return { ...DEFAULT_SETTINGS, ...raw };
    }
  } catch (err) {
    console.error('Error loading settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(newSettings) {
  const file = path.join(getDataDir(), 'settings.json');
  const merged = { ...loadSettings(), ...newSettings };
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function loadLibrary() {
  const file = path.join(getDataDir(), 'saved_simulations.json');
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading library:', err);
  }
  return [];
}

function saveLibrary(items) {
  const file = path.join(getDataDir(), 'saved_simulations.json');
  fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf8');
  return items;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 840,
    minWidth: 960,
    minHeight: 540,
    backgroundColor: '#020710',
    frame: false, // Custom cyber-terminal header (can be hidden with Tab/F1 for pure OBS capture)
    title: 'TermFX Studio // YouTube Terminal Visualizer',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Window Controls for OBS / YouTube Recording
ipcMain.handle('window:action', (event, action) => {
  if (!mainWindow) return;
  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'maximize':
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
      break;
    case 'fullscreen':
      mainWindow.setFullScreen(!mainWindow.isFullScreen());
      break;
    case 'resize-720p':
      mainWindow.unmaximize();
      mainWindow.setFullScreen(false);
      mainWindow.setSize(1280, 720, true);
      mainWindow.center();
      break;
    case 'resize-900p':
      mainWindow.unmaximize();
      mainWindow.setFullScreen(false);
      mainWindow.setSize(1600, 900, true);
      mainWindow.center();
      break;
    case 'resize-1080p':
      mainWindow.unmaximize();
      mainWindow.setFullScreen(false);
      mainWindow.setSize(1920, 1080, true);
      mainWindow.center();
      break;
    case 'open-data-dir':
      shell.openPath(getDataDir());
      break;
    case 'close':
      mainWindow.close();
      break;
  }
});

// Settings & Library IPC
ipcMain.handle('settings:load', () => loadSettings());
ipcMain.handle('settings:save', (e, s) => saveSettings(s));
ipcMain.handle('library:load', () => loadLibrary());
ipcMain.handle('library:save', (e, item) => {
  const items = loadLibrary();
  const existingIdx = items.findIndex(x => x.id === item.id);
  if (existingIdx >= 0) {
    items[existingIdx] = item;
  } else {
    items.unshift(item);
  }
  return saveLibrary(items);
});
ipcMain.handle('library:delete', (e, id) => {
  const items = loadLibrary().filter(x => x.id !== id);
  return saveLibrary(items);
});

// Local LLM Model Discovery (LM Studio & Ollama)
ipcMain.handle('ai:fetch-models', async (e, { provider, baseUrl }) => {
  try {
    if (provider === 'lmstudio') {
      const cleanUrl = (baseUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/models`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = (data.data || []).map(m => m.id);
      return { ok: true, models };
    } else if (provider === 'ollama') {
      const cleanUrl = (baseUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(4000)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const models = (data.models || []).map(m => m.name);
      return { ok: true, models };
    }
    return { ok: false, error: 'Unsupported provider for local model discovery' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Unified LLM Completion Handler (LM Studio, Ollama, Gemini, OpenAI, Anthropic)
ipcMain.handle('ai:generate', async (e, { systemPrompt, userPrompt, settings }) => {
  const cfg = { ...loadSettings(), ...(settings || {}) };
  const provider = cfg.provider;

  try {
    if (provider === 'lmstudio') {
      const cleanUrl = (cfg.lmstudioUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
      let model = cfg.lmstudioModel;
      // Auto-resolve loaded model if blank
      if (!model) {
        try {
          const mRes = await fetch(`${cleanUrl}/models`, { signal: AbortSignal.timeout(3000) });
          if (mRes.ok) {
            const mData = await mRes.json();
            if (mData.data && mData.data.length > 0) model = mData.data[0].id;
          }
        } catch (_) {}
      }
      const res = await fetch(`${cleanUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || 'local-model',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 3200
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`LM Studio error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      return { ok: true, text: data.choices?.[0]?.message?.content || '', provider: `LM Studio (${model || 'local'})` };
    }

    if (provider === 'ollama') {
      const cleanUrl = (cfg.ollamaUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
      const model = cfg.ollamaModel || 'llama3.1';
      const res = await fetch(`${cleanUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          options: { temperature: 0.4 }
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      return { ok: true, text: data.message?.content || '', provider: `Ollama (${model})` };
    }

    if (provider === 'gemini') {
      if (!cfg.geminiKey) throw new Error('Missing Gemini API Key in AI Settings.');
      const model = cfg.geminiModel || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.geminiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
      return { ok: true, text, provider: `Gemini (${model})` };
    }

    if (provider === 'openai') {
      if (!cfg.openaiKey) throw new Error('Missing OpenAI API Key in AI Settings.');
      const model = cfg.openaiModel || 'gpt-4o';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.openaiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.4,
          max_tokens: 3500
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI API error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      return { ok: true, text: data.choices?.[0]?.message?.content || '', provider: `OpenAI (${model})` };
    }

    if (provider === 'anthropic') {
      if (!cfg.anthropicKey) throw new Error('Missing Anthropic API Key in AI Settings.');
      const model = cfg.anthropicModel || 'claude-3-7-sonnet-latest';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cfg.anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 3500,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          temperature: 0.4
        })
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Anthropic API error (${res.status}): ${errText}`);
      }
      const data = await res.json();
      const text = (data.content || []).map(c => c.text || '').join('');
      return { ok: true, text, provider: `Anthropic (${model})` };
    }

    return { ok: false, error: 'Offline mode active or unknown provider' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
