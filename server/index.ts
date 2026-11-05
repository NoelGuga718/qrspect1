/**
 * Backend Server for API Key Protection
 *
 * This Express server runs separately from the Vite dev server
 * and handles sensitive API calls (like Gemini) server-side.
 *
 * Run this server with: npm run server
 * It will run on http://localhost:3001
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import express from 'express';
import cors from 'cors';
import { analyzeUrlProxy } from './api/gemini';

// Load .env.server file (server-side environment variables)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../.env.server') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'QRspect API Proxy' });
});

// Gemini AI Proxy endpoint
app.post('/api/gemini/analyze', analyzeUrlProxy);

// Start server
app.listen(PORT, () => {
  console.log(`🔒 Secure API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📝 Gemini analysis: ${process.env.GEMINI_API_KEY ? 'enabled' : 'disabled (optional)'}`);
});
