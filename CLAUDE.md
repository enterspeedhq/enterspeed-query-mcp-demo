# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A chat UI that connects Claude AI to the [Enterspeed Query MCP server](https://mcp.query.enterspeed.com/). Users ask natural language questions about their Enterspeed data (products, customers, orders, order lines), and Claude uses MCP tools to fetch and analyse the data.

## Commands

```bash
npm run dev       # Development server with hot reload (tsx watch)
npm run build     # Compile TypeScript → dist/
npm start         # Run compiled server (requires build first)
```

No test runner or linter is configured.

## Environment

Copy `.env.example` to `.env` and populate:
- `ANTHROPIC_API_KEY` — Anthropic API key
- `ENTERSPEED_API_KEY` — Enterspeed API key (used as `x-api-key` for MCP transport)
- `PORT` — defaults to 3000

## Architecture

The server is stateless — the browser maintains conversation history and sends it with every request.

```
Browser (public/)
  └─ POST /api/chat  {message, history}
       ↓
  server.ts  — Express, CORS, static files
       ↓
  chatHandler.ts  — Agentic loop (max 10 iterations)
       │  calls Claude with MCP tools; on tool_use, calls mcpClient, feeds result back
       ↓
  mcpClient.ts  — Singleton StreamableHTTPClientTransport to https://mcp.query.enterspeed.com/
       ↓
  Enterspeed Query MCP Server  — executes queries, returns data
```

### Key files

| File | Role |
|------|------|
| `src/server.ts` | Express entry point; bootstraps MCP connection at startup |
| `src/chatHandler.ts` | Agentic loop: calls Claude, detects `tool_use` stop reason, dispatches tools, collects `ToolStep[]` |
| `src/mcpClient.ts` | Singleton MCP client; lazy-initialised; caches available tools after first call |
| `src/types.ts` | Shared interfaces: `ConversationMessage`, `ChatRequest`, `ChatResponse`, `ToolStep` |
| `public/app.js` | Vanilla JS chat UI; sends history on every request; renders collapsible tool-trace panel |
| `enterspeed-ingest.mjs` | One-off script to bulk-ingest synthetic e-commerce data into Enterspeed |

### MCP transport

`mcpClient.ts` uses `StreamableHTTPClientTransport` (not `SSEClientTransport`). The Enterspeed API key is passed as an `x-api-key` header in the transport's `requestInit`.

### Claude model

`chatHandler.ts` uses model `claude-sonnet-4-6` with `max_tokens: 4096`. The agentic loop runs up to 10 iterations and handles three stop reasons: `end_turn`, `tool_use`, and fallback (truncated response with error flag).

### Data ingest

`enterspeed-ingest.mjs` generates and ingests synthetic data: 100 products, 500 customers, 1000 orders, 5000 order lines. Run once to populate Enterspeed before querying. It batches in groups of 50 with a 60 ms delay between batches.
