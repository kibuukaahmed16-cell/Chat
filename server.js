import express from 'express';
import cors from 'cors';
import { chat } from './gemini.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ---------- Frontend page ----------
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gemini API Test</title>
  <style>
    * { box-sizing: border-box; margin: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem 1.5rem;
      min-height: 100vh;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 900px;
      width: 100%;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 2rem;
      border-bottom: 1px solid #30363d;
      padding-bottom: 1rem;
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
      letter-spacing: 0.5px;
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
      margin-bottom: 1rem;
    }
    .card-header .method {
      font-weight: 700;
      font-size: 0.8rem;
      padding: 4px 12px;
      border-radius: 16px;
      background: #238636;
      color: #fff;
    }
    .card-header .endpoint {
      font-family: monospace;
      color: #8b949e;
      font-size: 0.9rem;
    }
    textarea, input {
      width: 100%;
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 0.75rem;
      color: #e6edf3;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      resize: vertical;
      transition: border-color 0.2s;
    }
    textarea:focus, input:focus {
      outline: none;
      border-color: #4f8cf7;
    }
    .row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      margin-top: 0.75rem;
    }
    .row > * { flex: 1; min-width: 150px; }
    label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
      color: #8b949e;
    }
    .btn {
      background: #238636;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      margin-top: 1rem;
      font-size: 1rem;
    }
    .btn:hover { background: #2ea043; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .btn-secondary {
      background: #21262d;
      border: 1px solid #30363d;
    }
    .btn-secondary:hover { background: #30363d; }
    .response-area {
      background: #0d1117;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
      min-height: 80px;
      white-space: pre-wrap;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
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
    .hidden { display: none; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #30363d; border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 8px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🧪 Gemini API</h1>
    <span class="badge">Free</span>
  </div>
  <div class="description">
    Send a prompt to Gemini (Google's AI) – session handling is automatic.
  </div>

  <!-- TRY IT OUT -->
  <div class="card">
    <div class="card-header">
      <span class="method">POST</span>
      <span class="endpoint">/api/chat</span>
    </div>

    <div>
      <label for="jsonInput">Request Body (JSON)</label>
      <textarea id="jsonInput" rows="4" style="font-family:monospace;">{
  "message": "Hello, how are you?",
  "instruction": "Respond like a helpful assistant"
}</textarea>
    </div>

    <div style="display:flex; gap:0.75rem; flex-wrap:wrap; margin-top:0.5rem;">
      <button class="btn" id="executeBtn">🚀 Execute</button>
      <button class="btn btn-secondary" id="resetBtn">↺ Reset</button>
    </div>

    <!-- Curl command -->
    <div class="curl-box" id="curlBox">
      <span style="color:#58a6ff;">curl</span> -X POST <span style="color:#ff7b72;">"/api/chat"</span> \
      -H <span style="color:#79c0ff;">"Content-Type: application/json"</span> \
      -d <span style="color:#ffa657;">'<span id="curlBody">{...}</span>'</span>
      <button class="copy-btn" id="copyCurlBtn">Copy</button>
    </div>

    <!-- Response -->
    <div style="margin-top:1rem;">
      <label>Response</label>
      <div id="responseArea" class="response-area">Awaiting request...</div>
    </div>

    <!-- Session ID -->
    <div id="sessionInfo" class="session-info"></div>
  </div>
</div>

<script>
  const jsonInput = document.getElementById('jsonInput');
  const executeBtn = document.getElementById('executeBtn');
  const resetBtn = document.getElementById('resetBtn');
  const responseArea = document.getElementById('responseArea');
  const sessionInfo = document.getElementById('sessionInfo');
  const curlBody = document.getElementById('curlBody');
  const copyCurlBtn = document.getElementById('copyCurlBtn');

  // Update curl body whenever JSON changes
  function updateCurl() {
    try {
      const obj = JSON.parse(jsonInput.value);
      curlBody.textContent = JSON.stringify(obj, null, 2);
    } catch {
      curlBody.textContent = jsonInput.value;
    }
  }
  jsonInput.addEventListener('input', updateCurl);
  updateCurl();

  // Execute
  executeBtn.addEventListener('click', async () => {
    let body;
    try {
      body = JSON.parse(jsonInput.value);
    } catch (e) {
      responseArea.textContent = '❌ Invalid JSON: ' + e.message;
      return;
    }

    // Ensure at least message
    if (!body.message) {
      responseArea.textContent = '❌ "message" field is required.';
      return;
    }

    executeBtn.disabled = true;
    executeBtn.innerHTML = '<span class="spinner"></span> Sending...';
    responseArea.textContent = '...';
    sessionInfo.textContent = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');

      // Display response
      responseArea.textContent = data.text || '(empty response)';

      // Show session ID
      if (data.sessionId) {
        sessionInfo.textContent = '🧾 Session ID (auto‑generated): ' + data.sessionId;
        // Optionally embed it in the JSON editor for continuity?
        // We'll just show it.
      }

      // Update curl body with the actual request we sent (including any auto-added fields? but we don't auto-add anything)
    } catch (err) {
      responseArea.textContent = '❌ Error: ' + err.message;
    } finally {
      executeBtn.disabled = false;
      executeBtn.textContent = '🚀 Execute';
    }
  });

  // Reset
  resetBtn.addEventListener('click', () => {
    jsonInput.value = JSON.stringify({
      message: 'Hello, how are you?',
      instruction: 'Respond like a helpful assistant'
    }, null, 2);
    updateCurl();
    responseArea.textContent = 'Awaiting request...';
    sessionInfo.textContent = '';
  });

  // Copy curl
  copyCurlBtn.addEventListener('click', () => {
    const curlText = document.getElementById('curlBox').textContent.replace('Copy', '').trim();
    navigator.clipboard.writeText(curlText).then(() => {
      copyCurlBtn.textContent = '✓ Copied';
      setTimeout(() => copyCurlBtn.textContent = 'Copy', 2000);
    }).catch(() => alert('Could not copy.'));
  });

  // Auto-send on Ctrl+Enter
  jsonInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeBtn.click();
    }
  });
</script>
</body>
</html>
  `);
});

// ---------- API Endpoints ----------
// GET /api/chat – documentation / info
app.get('/api/chat', (req, res) => {
  res.json({
    description: 'Gemini AI chat endpoint',
    usage: {
      method: 'POST',
      endpoint: '/api/chat',
      body: {
        message: 'string (required) – your prompt',
        instruction: 'string (optional) – system instruction',
        sessionId: 'string (optional) – omit to auto‑generate new session'
      },
      response: {
        text: 'string – AI reply',
        sessionId: 'string – session ID for continuation'
      }
    }
  });
});

// POST /api/chat – main chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message, instruction, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    // Call Gemini – sessionId is handled internally (auto‑generated if not given)
    const result = await chat({ message, instruction, sessionId });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
