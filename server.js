import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { chat } from './chat.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Multer config for file uploads (memory storage)
const upload = multer({ 
  limits: { fileSize: 20 * 1024 * 1024 },
  storage: multer.memoryStorage()
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint: accepts JSON or multipart/form-data
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    let { message, instruction = '', history = [], webSearch = false, stream = false } = req.body;

    // If multipart, body fields are strings; parse booleans/history if needed
    if (typeof history === 'string') {
      try { history = JSON.parse(history); } catch { history = []; }
    }
    if (typeof webSearch === 'string') webSearch = webSearch === 'true';
    if (typeof stream === 'string') stream = stream === 'true';

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let imageBuffer = null;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      // base64 image from JSON
      const base64 = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64, 'base64');
    }

    // If streaming, use SSE
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let fullText = '';
      const result = await chat({
        message,
        instruction,
        imageBuffer,
        history,
        webSearch,
        stream: true,
        onChunk: (chunk) => {
          fullText += chunk;
          res.write(`data: ${JSON.stringify({ chunk, full: fullText })}\n\n`);
        }
      });

      // Send final metadata
      res.write(`data: ${JSON.stringify({ 
        done: true, 
        full: fullText,
        model: result.model,
        conversationId: result.conversationId,
        messageId: result.messageId
      })}\n\n`);
      res.end();
    } else {
      // Non-streaming
      const result = await chat({
        message,
        instruction,
        imageBuffer,
        history,
        webSearch,
        stream: false
      });
      res.json({ success: true, ...result });
    }
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
