import express from 'express';
import cors from 'cors';
import { chat } from './gemini.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini API</title>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem 1.5rem;
      display: flex;
      justify-content: center;
    }
    .container { max-width: 900px; width: 100%; }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid #30363d;
      padding-bottom: 1rem;
      margin-bottom: 1.5rem;
    }
    .header h1 {
      font-size: 1.8rem;
      font-weight: 600;
      background: linear-gradient(135deg, #7b5cf5, #4f8cf7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      background: #1f6feb;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      -webkit-text-fill-color: #fff;
    }
    .description {
      color: #8b949e;
      margin-bottom: 2rem;
      font-size: 0.95rem;
    }
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }
    .method-tabs {
      display: flex;
      gap: 0.5rem;
    }
    .method-tab {
      padding: 0.3rem 1.2rem;
      border-radius: 20px;
      font-weight: 600;
      font-size: 0.8rem;
      cursor: pointer;
      border: 1px solid #30363d;
      background: transparent;
      color: #8b949e;
      transition: 0.2s;
    }
    .method-tab.active {
      background: #238636;
      border-color: #238636;
      color: #fff;
    }
    .method-tab:hover:not(.active) { background: #21262d; }
    .endpoint {
      font-family: monospace;
      color: #8b949e;
      font-size: 0.9rem;
    }
    .method-content { display: none; }
    .method-content.active { display: block; }

    .param-group {
      margin: 1rem 0;
    }
    .param-group label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #8b949e;
      margin-bottom: 0.3rem;
    }
    .param-group label .required { color: #f85149; margin-left: 4px; }
    .param-group input, .param-group textarea {
      width: 100%;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 0.6rem 0.8rem;
      color: #e6edf3;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }
    .param-group input:focus, .param-group textarea:focus {
      outline: none;
      border-color: #4f8cf7;
    }
    .param-group textarea { resize: vertical; min-height: 70px; }
    .row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .row .param-group { flex: 1; min-width: 150px; }

    .actions {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }
    .btn {
      padding: 0.6rem 1.8rem;
      border-radius: 8px;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: 0.2s;
      font-size: 0.95rem;
    }
    .btn-primary {
      background: #238636;
      color: #fff;
    }
    .btn-primary:hover:not(:disabled) { background: #2ea043; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-secondary {
      background: #21262d;
      color: #c9d1d9;
      border: 1px solid #30363d;
    }
    .btn-secondary:hover { background: #30363d; }

    .response-card {
      margin-top: 1.5rem;
      border-top: 1px solid #30363d;
      padding-top: 1.5rem;
    }
    .response-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #8b949e;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }
    .response-header .method-url { font-family: monospace; }
    .response-header .status { font-weight: 600; }
    .response-body {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      white-space: pre-wrap;
      word-break: break-word;
      min-height: 70px;
      color: #e6edf3;
    }
    .curl-box {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 0.75rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #8b949e;
      overflow-x: auto;
      margin-top: 0.75rem;
      position: relative;
    }
    .curl-box .copy-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      background: #21262d;
      border: 1px solid #30363d;
      color: #c9d1d9;
      padding: 4px 12px;
      border-radius: 6px;
      font-size: 0.7rem;
      cursor: pointer;
    }
    .curl-box .copy-btn:hover { background: #30363d; }
    .session-info {
      color: #8b949e;
      font-size: 0.8rem;
      margin-top: 0.5rem;
      word-break: break-all;
    }
    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #30363d;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
      vertical-align: middle;
      margin-right: 8px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🧪 Gemini API</h1>
    <span class="badge">Free</span>
  </div>
  <div class="description">Send a prompt to Gemini – session ID auto‑generated.</div>

  <div class="card">
    <div class="card-header">
      <div class="method-tabs">
        <button class="method-tab active" data-method="get">GET</button>
        <button class="method-tab" data-method="post">POST</button>
      </div>
      <span class="endpoint">/api/chat</span>
    </div>

    <!-- GET -->
    <div id="getContent" class="method-content active">
      <div class="row">
        <div class="param-group">
          <label>message <span class="required">*</span></label>
          <textarea id="getMessage" rows="2">Hello, how are you?</textarea>
        </div>
        <div class="param-group">
          <label>instruction <span style="color:#8b949e;font-weight:400;">(optional)</span></label>
          <input id="getInstruction" placeholder="e.g. Respond like a pirate" value="Respond like a helpful assistant">
        </div>
      </div>
    </div>

    <!-- POST -->
    <div id="postContent" class="method-content">
      <div class="param-group">
        <label>Request Body (JSON)</label>
        <textarea id="postBody" rows="6" style="font-family:monospace;">{
  "message": "Hello, how are you?",
  "instruction": "Respond like a helpful assistant"
}</textarea>
      </div>
    </div>

    <div class="actions">
      <button class="btn btn-primary" id="executeBtn">🚀 Execute</button>
      <button class="btn btn-secondary" id="clearBtn">✕ Clear</button>
    </div>

    <div class="response-card">
      <div class="response-header">
        <span class="method-url" id="responseMethodUrl">METHOD: —</span>
        <span class="status" id="responseStatus">STATUS: —</span>
      </div>
      <div class="response-body" id="responseBody">Awaiting request...</div>
      <div id="sessionInfo" class="session-info"></div>
    </div>

    <div class="curl-box" id="curlBox">
      <span style="color:#58a6ff;">curl</span> <span id="curlMethod">-X GET</span> <span style="color:#ff7b72;" id="curlUrl">"/api/chat?message=Hello%2C%20how%20are%20you%3F&instruction=Respond%20like%20a%20helpful%20assistant"</span> <span id="curlHeadersAndData"></span>
      <button class="copy-btn" id="copyCurlBtn">Copy</button>
    </div>
  </div>
</div>

<script>
  const tabs = document.querySelectorAll('.method-tab');
  const getContent = document.getElementById('getContent');
  const postContent = document.getElementById('postContent');
  const getMessage = document.getElementById('getMessage');
  const getInstruction = document.getElementById('getInstruction');
  const postBody = document.getElementById('postBody');
  const executeBtn = document.getElementById('executeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const responseMethodUrl = document.getElementById('responseMethodUrl');
  const responseStatus = document.getElementById('responseStatus');
  const responseBody = document.getElementById('responseBody');
  const sessionInfo = document.getElementById('sessionInfo');
  const curlMethod = document.getElementById('curlMethod');
  const curlUrl = document.getElementById('curlUrl');
  const curlHeadersAndData = document.getElementById('curlHeadersAndData');
  const copyCurlBtn = document.getElementById('copyCurlBtn');

  let currentMethod = 'get';

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMethod = tab.dataset.method;
      if (currentMethod === 'get') {
        getContent.classList.add('active');
        postContent.classList.remove('active');
      } else {
        postContent.classList.add('active');
        getContent.classList.remove('active');
      }
      updateCurl();
    });
  });

  function updateCurl() {
    const base = window.location.origin + '/api/chat';
    if (currentMethod === 'get') {
      const msg = encodeURIComponent(getMessage.value);
      const inst = encodeURIComponent(getInstruction.value);
      let q = '?message=' + msg;
      if (inst) q += '&instruction=' + inst;
      curlMethod.textContent = '-X GET';
      curlUrl.textContent = '"' + base + q + '"';
      curlHeadersAndData.textContent = '';
    } else {
      let body = postBody.value.trim();
      try { JSON.parse(body); } catch { /* invalid JSON, show as-is */ }
      curlMethod.textContent = '-X POST';
      curlUrl.textContent = '"' + base + '"';
      curlHeadersAndData.textContent = '\\\\n  -H "Content-Type: application/json" \\\\n  -d \\'' + body + '\\'';
    }
  }

  [getMessage, getInstruction, postBody].forEach(el => {
    el.addEventListener('input', updateCurl);
  });
  updateCurl();

  // Execute
  executeBtn.addEventListener('click', async () => {
    executeBtn.disabled = true;
    executeBtn.innerHTML = '<span class="spinner"></span> Sending...';
    responseBody.textContent = '...';
    responseMethodUrl.textContent = 'METHOD: —';
    responseStatus.textContent = 'STATUS: —';
    sessionInfo.textContent = '';

    try {
      let url, options = { method: currentMethod.toUpperCase(), headers: {} };

      if (currentMethod === 'get') {
        const msg = getMessage.value.trim();
        if (!msg) throw new Error('Message is required');
        const inst = getInstruction.value.trim();
        const params = new URLSearchParams({ message: msg });
        if (inst) params.append('instruction', inst);
        url = '/api/chat?' + params.toString();
      } else {
        const bodyRaw = postBody.value.trim();
        if (!bodyRaw) throw new Error('Request body is empty');
        let body;
        try { body = JSON.parse(bodyRaw); } catch (e) { throw new Error('Invalid JSON: ' + e.message); }
        if (!body.message) throw new Error('"message" field is required');
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
        url = '/api/chat';
      }

      const start = performance.now();
      const res = await fetch(url, options);
      const elapsed = Math.round(performance.now() - start);
      const data = await res.json();

      responseMethodUrl.textContent = 'METHOD: ' + currentMethod.toUpperCase() + ' | URL: ' + window.location.origin + url;
      responseStatus.textContent = 'STATUS: ' + res.status + ' (' + elapsed + 'ms)';

      if (!res.ok) throw new Error(data.error || 'Request failed');

      responseBody.textContent = JSON.stringify(data, null, 2);
      if (data.sessionId) {
        sessionInfo.textContent = '🧾 Session ID (auto‑generated): ' + data.sessionId;
      }
    } catch (err) {
      responseBody.textContent = '❌ Error: ' + err.message;
    } finally {
      executeBtn.disabled = false;
      executeBtn.innerHTML = '🚀 Execute';
      updateCurl();
    }
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    getMessage.value = '';
    getInstruction.value = '';
    postBody.value = JSON.stringify({ message: '', instruction: '' }, null, 2);
    responseBody.textContent = 'Awaiting request...';
    responseMethodUrl.textContent = 'METHOD: —';
    responseStatus.textContent = 'STATUS: —';
    sessionInfo.textContent = '';
    updateCurl();
  });

  // Copy curl
  copyCurlBtn.addEventListener('click', () => {
    const text = document.getElementById('curlBox').innerText.replace('Copy', '').trim();
    navigator.clipboard.writeText(text).then(() => {
      copyCurlBtn.textContent = '✓ Copied';
      setTimeout(() => copyCurlBtn.textContent = 'Copy', 2000);
    });
  });

  // Ctrl+Enter
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      executeBtn.click();
    }
  });
</script>
</body>
</html>
  `);
});

// ---------- API ----------
app.get('/api/chat', async (req, res) => {
  try {
    const { message, instruction } = req.query;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const result = await chat({ message, instruction, sessionId: undefined });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message, instruction } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });
    const result = await chat({ message, instruction, sessionId: undefined });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
