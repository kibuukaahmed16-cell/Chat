import express from 'express';
import cors from 'cors';
import { chat } from './gemini.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve the test interface (HTML)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Gemini API Test</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0d1117; color: #e6edf3; padding: 2rem; max-width: 800px; margin: auto; }
        .container { background: #161b22; padding: 2rem; border-radius: 12px; border: 1px solid #30363d; }
        h1 { margin-top: 0; }
        textarea, input, button { width: 100%; padding: 0.75rem; margin: 0.5rem 0; border-radius: 8px; border: 1px solid #30363d; background: #0d1117; color: #e6edf3; font-size: 1rem; box-sizing: border-box; }
        button { background: #238636; border: none; font-weight: bold; cursor: pointer; }
        button:hover { background: #2ea043; }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .response { background: #0d1117; padding: 1rem; border-radius: 8px; white-space: pre-wrap; margin-top: 1rem; border: 1px solid #30363d; min-height: 60px; }
        .session-info { font-size: 0.8rem; color: #8b949e; word-break: break-all; margin-top: 0.5rem; }
        .field-group { margin-bottom: 1rem; }
        label { display: block; margin-bottom: 0.25rem; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🧪 Gemini Test Field</h1>
        <div class="field-group">
          <label for="message">Message</label>
          <textarea id="message" rows="3" placeholder="Type your message...">Hello, who are you?</textarea>
        </div>
        <div class="field-group">
          <label for="instruction">System Instruction (optional)</label>
          <input id="instruction" placeholder="e.g. Respond like a pirate" />
        </div>
        <div class="field-group">
          <label for="sessionId">Session ID (optional – paste existing to continue conversation)</label>
          <input id="sessionId" placeholder="Leave blank for new session" />
        </div>
        <button id="sendBtn">Send</button>
        <div id="loading" style="display:none; margin: 0.5rem 0;">⏳ Processing...</div>
        <div class="response" id="response">Response will appear here</div>
        <div class="session-info" id="sessionInfo">New session ID will appear here after first request</div>
      </div>

      <script>
        const sendBtn = document.getElementById('sendBtn');
        const messageEl = document.getElementById('message');
        const instructionEl = document.getElementById('instruction');
        const sessionIdEl = document.getElementById('sessionId');
        const responseEl = document.getElementById('response');
        const sessionInfoEl = document.getElementById('sessionInfo');
        const loadingEl = document.getElementById('loading');

        sendBtn.addEventListener('click', async () => {
          const message = messageEl.value.trim();
          if (!message) return alert('Please enter a message');

          const instruction = instructionEl.value.trim();
          const sessionId = sessionIdEl.value.trim() || null;

          sendBtn.disabled = true;
          loadingEl.style.display = 'block';
          responseEl.textContent = '...';
          sessionInfoEl.textContent = '';

          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message, instruction, sessionId })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Request failed');
            responseEl.textContent = data.text;
            // Show new session ID for continuation
            if (data.sessionId) {
              sessionInfoEl.textContent = 'New Session ID (copy this for next conversation): ' + data.sessionId;
              // Optionally auto-fill the sessionId field
              sessionIdEl.value = data.sessionId;
            }
          } catch (err) {
            responseEl.textContent = '❌ Error: ' + err.message;
          } finally {
            sendBtn.disabled = false;
            loadingEl.style.display = 'none';
          }
        });

        // Allow Enter to send (Ctrl+Enter for new line)
        messageEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            sendBtn.click();
          }
        });
      </script>
    </body>
    </html>
  `);
});

// API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, instruction, sessionId } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });

    const result = await chat({ message, instruction, sessionId });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
