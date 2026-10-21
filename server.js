// ============================================================================
// TermFX Studio - Standalone Desktop Backend Server (Zero Dependencies)
// Handles local file persistence + LM Studio / Ollama / Cloud AI requests
// ============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');
const crypto = require('crypto');

const PORT = Number(process.env.TERMFX_PORT) || 4577;
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

// ----------------------------------------------------------------------------
// Frame-exact video export: the browser renders each frame at a fixed timestep
// and streams PNGs here; ffmpeg encodes them (H.264 MP4, ProRes 4444 w/ alpha)
// or they are written out as a PNG sequence.
// ----------------------------------------------------------------------------
const RENDER_DIR = path.join(DATA_DIR, 'renders');
const ASSETS_DIR = path.join(DATA_DIR, 'assets');
let ffmpegBin;

function findFfmpeg() {
  if (process.env.TERMFX_FFMPEG && fs.existsSync(process.env.TERMFX_FFMPEG)) return process.env.TERMFX_FFMPEG;
  try {
    const cmd = process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg';
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (out[0]) return out[0];
  } catch (_) {}
  return null;
}

function getFfmpeg() {
  if (ffmpegBin === undefined) ffmpegBin = findFfmpeg();
  return ffmpegBin;
}

const renderJobs = new Map();

function slugify(s) {
  return String(s || 'scene').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'scene';
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Two ingest paths keep uploads small (Chromium's blob store tops out around
// 2 GB, so raw RGBA frames can't be streamed for a whole scene):
//   'h264' – the page encodes H.264 with WebCodecs; ffmpeg only muxes to MP4
//   'png'  – PNG frames; piped into ffmpeg for ProRes, or written as files
function startRenderJob({ name, format, fps, input }) {
  fs.mkdirSync(RENDER_DIR, { recursive: true });
  const base = `${slugify(name)}_${timestamp()}`;
  const ffmpeg = getFfmpeg();
  const rate = String(Math.max(1, Math.min(120, Number(fps) || 60)));
  const id = crypto.randomBytes(8).toString('hex');

  const wantsPipe = ffmpeg && (format === 'prores' || (format === 'mp4' && input === 'h264'));
  if (!wantsPipe) {
    const dir = path.join(RENDER_DIR, base);
    fs.mkdirSync(dir, { recursive: true });
    renderJobs.set(id, { format: 'png', input: 'png', dir, frames: 0, output: dir, started: Date.now() });
    return { id, format: 'png', input: 'png', output: dir, fallback: format !== 'png' };
  }

  let output;
  let args;
  if (format === 'prores') {
    output = path.join(RENDER_DIR, base + '.mov');
    args = ['-f', 'image2pipe', '-framerate', rate, '-c:v', 'png', '-i', '-',
      '-c:v', 'prores_ks', '-profile:v', '4444', '-pix_fmt', 'yuva444p10le', '-alpha_bits', '16', '-vendor', 'apl0', output];
  } else {
    output = path.join(RENDER_DIR, base + '.mp4');
    args = ['-fflags', '+genpts', '-f', 'h264', '-framerate', rate, '-i', '-',
      '-c:v', 'copy', '-bsf:v', 'h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0',
      '-movflags', '+faststart', output];
  }
  const proc = spawn(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: ['pipe', 'ignore', 'pipe'], windowsHide: true });
  const job = { format, input: format === 'prores' ? 'png' : 'h264', piped: true, output, proc, frames: 0, stderr: '', exited: false, code: null, started: Date.now() };
  job.done = new Promise((resolve) => {
    proc.on('close', (code) => {
      job.exited = true;
      job.code = code;
      resolve(code);
    });
    proc.on('error', (err) => {
      job.exited = true;
      job.stderr += String(err.message);
      resolve(-1);
    });
  });
  proc.stderr.on('data', (d) => { job.stderr = (job.stderr + d.toString()).slice(-4000); });
  proc.stdin.on('error', () => {});
  renderJobs.set(id, job);
  return { id, format, input: job.input, output };
}

// `count` is how many frames this upload carries (H.264 chunks arrive batched)
async function writeRenderFrame(job, buf, count = 1) {
  if (!job.piped) {
    job.frames++;
    fs.writeFileSync(path.join(job.dir, `frame_${String(job.frames).padStart(5, '0')}.png`), buf);
    return;
  }
  if (job.exited) throw new Error(`ffmpeg exited: ${job.stderr.trim() || job.code}`);
  job.frames += count;
  if (!job.proc.stdin.write(buf)) {
    await new Promise((resolve) => {
      const done = () => {
        job.proc.stdin.off('drain', done);
        job.proc.off('close', done);
        resolve();
      };
      job.proc.stdin.on('drain', done);
      job.proc.on('close', done);
    });
  }
}

// Abandoned renders (page reloaded / closed mid-render) would leave ffmpeg
// waiting on stdin forever, so reap any job idle for a minute.
setInterval(() => {
  const now = Date.now();
  for (const [id, job] of renderJobs) {
    if (now - (job.lastSeen || job.started || now) < 60000) continue;
    renderJobs.delete(id);
    if (job.proc && !job.exited) job.proc.kill();
    try { fs.rmSync(job.output, { recursive: true, force: true }); } catch (_) {}
  }
}, 15000).unref();

function isInsideRenderDir(p) {
  const rel = path.relative(RENDER_DIR, path.resolve(p));
  return Boolean(rel) && !rel.startsWith('..') && !path.isAbsolute(rel);
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
    // Visual-library assets (portrait photos, .obj models): termfx_data/assets first, then src/assets
    if (url.pathname.startsWith('/assets/') && req.method === 'GET') {
      const name = path.basename(decodeURIComponent(url.pathname.slice('/assets/'.length)));
      const candidates = [path.join(ASSETS_DIR, name), path.join(SRC_DIR, 'assets', name)];
      const found = candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile());
      if (!found) {
        res.writeHead(404);
        return res.end('Not Found');
      }
      const ext = path.extname(found).toLowerCase();
      const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.obj': 'text/plain; charset=utf-8' };
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      return fs.createReadStream(found).pipe(res);
    }
    if (url.pathname === '/api/open-assets' && req.method === 'POST') {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
      exec(`explorer.exe "${ASSETS_DIR}"`);
      return sendJson(res, 200, { ok: true, dir: ASSETS_DIR });
    }
    if (url.pathname === '/api/open-data-dir' && req.method === 'POST') {
      exec(`explorer.exe "${DATA_DIR}"`);
      return sendJson(res, 200, { ok: true });
    }

    // Frame-exact render pipeline
    if (url.pathname === '/api/render/caps' && req.method === 'GET') {
      return sendJson(res, 200, { ok: true, ffmpeg: Boolean(getFfmpeg()), renderDir: RENDER_DIR });
    }
    if (url.pathname === '/api/render/start' && req.method === 'POST') {
      const body = await readJsonBody(req);
      return sendJson(res, 200, { ok: true, ...startRenderJob(body || {}) });
    }
    if (url.pathname === '/api/render/frame' && req.method === 'POST') {
      const job = renderJobs.get(url.searchParams.get('id'));
      const buf = await readRawBody(req);
      if (!job) return sendJson(res, 404, { ok: false, error: 'Unknown render job' });
      job.lastSeen = Date.now();
      try {
        await writeRenderFrame(job, buf, Math.max(1, Number(url.searchParams.get('count')) || 1));
        return sendJson(res, 200, { ok: true, frames: job.frames });
      } catch (err) {
        return sendJson(res, 200, { ok: false, error: err.message });
      }
    }
    if (url.pathname === '/api/render/finish' && req.method === 'POST') {
      const { id, cancel } = await readJsonBody(req);
      const job = renderJobs.get(id);
      if (!job) return sendJson(res, 404, { ok: false, error: 'Unknown render job' });
      renderJobs.delete(id);
      if (!job.piped) {
        if (cancel) fs.rmSync(job.dir, { recursive: true, force: true });
        return sendJson(res, 200, { ok: true, output: job.output, frames: job.frames, cancelled: Boolean(cancel) });
      }
      job.proc.stdin.end();
      const code = await job.done;
      if (cancel) {
        try { fs.rmSync(job.output, { recursive: true, force: true }); } catch (_) {}
        return sendJson(res, 200, { ok: true, cancelled: true });
      }
      return sendJson(res, 200, { ok: code === 0, output: job.output, frames: job.frames, error: code === 0 ? null : job.stderr.trim() });
    }
    if (url.pathname === '/api/render/snapshot' && req.method === 'POST') {
      const buf = await readRawBody(req);
      fs.mkdirSync(RENDER_DIR, { recursive: true });
      const output = path.join(RENDER_DIR, `snap_${slugify(url.searchParams.get('name'))}_${timestamp()}.png`);
      fs.writeFileSync(output, buf);
      return sendJson(res, 200, { ok: true, output });
    }
    if (url.pathname === '/api/render/reveal' && req.method === 'POST') {
      const { output } = await readJsonBody(req);
      fs.mkdirSync(RENDER_DIR, { recursive: true });
      if (output && isInsideRenderDir(output) && fs.existsSync(output)) {
        exec(`explorer.exe /select,"${path.resolve(output)}"`);
      } else {
        exec(`explorer.exe "${RENDER_DIR}"`);
      }
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
