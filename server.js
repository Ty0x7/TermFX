// ============================================================================
// TermFX Studio - Standalone Desktop Backend Server (Zero Dependencies)
// Handles local file persistence + LM Studio / Ollama / Cloud AI requests
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 4577;
const ROOT_DIR = __dirname;
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DATA_DIR = path.join(ROOT_DIR, 'termfx_data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DEFAULT_SETTINGS = {
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
  typingSpeed: 36,
  fontSize: 16
};

function loadSettings() {
  const file = path.join(DATA_DIR, 'settings.json');
  try {
    if (fs.existsSync(file)) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    }
  } catch (_) {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(newSettings) {
  const file = path.join(DATA_DIR, 'settings.json');
  const merged = { ...loadSettings(), ...newSettings };
  fs.writeFileSync(file, JSON.stringify(merged, null, 2), 'utf8');
  return merged;
}

function loadLibrary() {
  const file = path.join(DATA_DIR, 'saved_simulations.json');
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (_) {}
  return [];
}

function saveLibrary(items) {
  const file = path.join(DATA_DIR, 'saved_simulations.json');
  fs.writeFileSync(file, JSON.stringify(items, null, 2), 'utf8');
  return items;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

  try {
    if (url.pathname === '/api/settings' && req.method === 'GET') {
      return sendJson(res, 200, loadSettings());
    }
    if (url.pathname === '/api/settings' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return sendJson(res, 200, saveSettings(body));
    }
    if (url.pathname === '/api/library' && req.method === 'GET') {
      return sendJson(res, 200, loadLibrary());
    }
    if (url.pathname === '/api/library/save' && req.method === 'POST') {
      const item = await readJsonBody(req);
      const items = loadLibrary();
      const idx = items.findIndex(x => x.id === item.id);
      if (idx >= 0) items[idx] = item;
      else items.unshift(item);
      return sendJson(res, 200, saveLibrary(items));
    }
    if (url.pathname === '/api/library/delete' && req.method === 'POST') {
      const { id } = await readJsonBody(req);
      const items = loadLibrary().filter(x => x.id !== id);
      return sendJson(res, 200, saveLibrary(items));
    }
    if (url.pathname === '/api/open-data-dir' && req.method === 'POST') {
      exec(`explorer.exe "${DATA_DIR}"`);
      return sendJson(res, 200, { ok: true });
    }

    // Local LLM Model Discovery (LM Studio & Ollama)
    if (url.pathname === '/api/fetch-models' && req.method === 'POST') {
      const { provider, baseUrl } = await readJsonBody(req);
      try {
        if (provider === 'lmstudio') {
          const cleanUrl = (baseUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
          const r = await fetch(`${cleanUrl}/models`, { signal: AbortSignal.timeout(4000) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const data = await r.json();
          return sendJson(res, 200, { ok: true, models: (data.data || []).map(m => m.id) });
        } else if (provider === 'ollama') {
          const cleanUrl = (baseUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
          const r = await fetch(`${cleanUrl}/api/tags`, { signal: AbortSignal.timeout(4000) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const data = await r.json();
          return sendJson(res, 200, { ok: true, models: (data.models || []).map(m => m.name) });
        }
        return sendJson(res, 200, { ok: false, error: 'Unsupported provider' });
      } catch (err) {
        return sendJson(res, 200, { ok: false, error: err.message });
      }
    }

    // Unified LLM Generation Endpoint
    if (url.pathname === '/api/generate' && req.method === 'POST') {
      const { systemPrompt, userPrompt, settings } = await readJsonBody(req);
      const cfg = { ...loadSettings(), ...(settings || {}) };
      const provider = cfg.provider;

      try {
        if (provider === 'lmstudio') {
          const cleanUrl = (cfg.lmstudioUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
          let model = cfg.lmstudioModel;
          if (!model) {
            try {
              const mRes = await fetch(`${cleanUrl}/models`, { signal: AbortSignal.timeout(3000) });
              if (mRes.ok) {
                const mData = await mRes.json();
                if (mData.data && mData.data.length > 0) model = mData.data[0].id;
              }
            } catch (_) {}
          }
          const r = await fetch(`${cleanUrl}/chat/completions`, {
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
          if (!r.ok) throw new Error(`LM Studio HTTP ${r.status}`);
          const data = await r.json();
          return sendJson(res, 200, {
            ok: true,
            text: data.choices?.[0]?.message?.content || '',
            provider: `LM Studio (${model || 'local'})`
          });
        }

        if (provider === 'ollama') {
          const cleanUrl = (cfg.ollamaUrl || 'http://localhost:11434').replace(/\/v1\/?$/, '').replace(/\/+$/, '');
          const model = cfg.ollamaModel || 'llama3.1';
          const r = await fetch(`${cleanUrl}/api/chat`, {
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
          if (!r.ok) throw new Error(`Ollama HTTP ${r.status}`);
          const data = await r.json();
          return sendJson(res, 200, {
            ok: true,
            text: data.message?.content || '',
            provider: `Ollama (${model})`
          });
        }

        if (provider === 'gemini') {
          if (!cfg.geminiKey) throw new Error('Missing Gemini API Key');
          const model = cfg.geminiModel || 'gemini-2.5-flash';
          const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(cfg.geminiKey)}`;
          const r = await fetch(gUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: { temperature: 0.4, maxOutputTokens: 4096 }
            })
          });
          if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
          const data = await r.json();
          const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
          return sendJson(res, 200, { ok: true, text, provider: `Gemini (${model})` });
        }

        if (provider === 'openai') {
          if (!cfg.openaiKey) throw new Error('Missing OpenAI API Key');
          const model = cfg.openaiModel || 'gpt-4o';
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
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
          if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}`);
          const data = await r.json();
          return sendJson(res, 200, {
            ok: true,
            text: data.choices?.[0]?.message?.content || '',
            provider: `OpenAI (${model})`
          });
        }

        if (provider === 'anthropic') {
          if (!cfg.anthropicKey) throw new Error('Missing Anthropic API Key');
          const model = cfg.anthropicModel || 'claude-3-7-sonnet-latest';
          const r = await fetch('https://api.anthropic.com/v1/messages', {
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
          if (!r.ok) throw new Error(`Anthropic HTTP ${r.status}`);
          const data = await r.json();
          const text = (data.content || []).map(c => c.text || '').join('');
          return sendJson(res, 200, { ok: true, text, provider: `Anthropic (${model})` });
        }

        return sendJson(res, 200, { ok: false, error: 'Offline mode active' });
      } catch (err) {
        return sendJson(res, 200, { ok: false, error: err.message });
      }
    }

    // Serve static files from src/
    let relPath = url.pathname === '/' ? '/index.html' : url.pathname;
    const filePath = path.join(SRC_DIR, path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, ''));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  } catch (e) {
    sendJson(res, 500, { error: e.message });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`TermFX Studio Server listening at http://127.0.0.1:${PORT}`);
});
