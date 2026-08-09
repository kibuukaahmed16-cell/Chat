import express from 'express';
import cors from 'cors';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { chat } from './chat.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Configure multer for memory storage (better for Render)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Main chat endpoint - ALL FEATURES
app.post('/api/chat', limiter, upload.single('image'), async (req, res) => {
  try {
    const {
      message,
      instruction = '',
      history = '[]',
      conversationId = null,
      parentMessageId = null,
      webSearch = 'false',
      stream = 'false'
    } = req.body;
    
    // Parse history if string
    let parsedHistory = [];
    try {
      parsedHistory = typeof history === 'string' ? JSON.parse(history) : history;
    } catch (e) {
      parsedHistory = [];
    }
    
    // Parse booleans
    const useWebSearch = webSearch === 'true';
    const useStream = stream === 'true';
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Handle image upload
    let imageBuffer = null;
    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body.image) {
      // Handle base64 image
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }
    
    // Prepare options for chat
    const chatOptions = {
      instruction,
      history: parsedHistory,
      conversationId,
      parentMessageId,
      webSearch: useWebSearch,
      stream: useStream,
      imageBuffer
    };
    
    const result = await chat({
      message,
      ...chatOptions
    });
    
    res.json({
      success: true,
      ...result
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Web search endpoint
app.post('/api/chat/search', limiter, async (req, res) => {
  try {
    const { message, instruction = '' } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await chat({
      message,
      instruction,
      webSearch: true
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stream endpoint
app.post('/api/chat/stream', limiter, async (req, res) => {
  try {
    const { message, instruction = '' } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const result = await chat({
      message,
      instruction,
      stream: true,
      onChunk: (chunk) => {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
    });
    
    res.write(`data: ${JSON.stringify({ done: true, ...result })}\n\n`);
    res.end();
    
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Image upload endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    
    const imageBase64 = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    
    res.json({
      success: true,
      image: `data:${mimeType};base64,${imageBase64}`,
      filename: req.file.originalname,
      size: req.file.size,
      mimeType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Conversation history endpoint
app.post('/api/conversation', limiter, async (req, res) => {
  try {
    const { message, conversationId, parentMessageId } = req.body;
    
    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    const result = await chat({
      message,
      conversationId,
      parentMessageId
    });
    
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Batch chat endpoint
app.post('/api/chat/batch', limiter, async (req, res) => {
  try {
    const { messages, instruction = '' } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }
    
    const results = [];
    let conversationId = null;
    let parentMessageId = null;
    
    for (const msg of messages) {
      const result = await chat({
        message: msg,
        instruction,
        conversationId,
        parentMessageId
      });
      
      results.push(result);
      conversationId = result.conversationId;
      parentMessageId = result.messageId;
    }
    
    res.json({
      success: true,
      results,
      conversationId,
      messageIds: results.map(r => r.messageId)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`✅ ChatGPT API running on port ${PORT}`);
  console.log(`📝 Test UI: http://localhost:${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});