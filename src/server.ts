import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleChat } from './chatHandler.js';
import { getMcpTools } from './mcpClient.js';
import type { ChatRequest } from './types.js';

const app = express();
const PORT = process.env.PORT ?? 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.post('/api/chat', async (req, res) => {
  const body = req.body as ChatRequest;

  if (!body.message?.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  try {
    const result = await handleChat(body);
    res.json(result);
  } catch (err) {
    console.error('Chat handler error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error',
    });
  }
});

async function bootstrap() {
  try {
    console.log('Connecting to Enterspeed MCP server...');
    const tools = await getMcpTools();
    console.log(`MCP connection ready — ${tools.length} tool(s) available`);
  } catch (err) {
    console.error('Failed to connect to MCP server at startup:', err);
    console.warn('Server will still start; MCP will retry on first request');
  }

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

bootstrap();
