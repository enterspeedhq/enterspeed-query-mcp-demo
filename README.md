# Enterspeed Query MCP Demo

A chat UI that connects Claude AI to the [Enterspeed Query MCP server](https://mcp.query.enterspeed.com/). Ask natural language questions about your Enterspeed data — products, customers, orders, and order lines — and Claude uses MCP tools to fetch and analyse the results in real time.

## Prerequisites

- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com/)
- An Enterspeed environment API key

## Setup

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your keys:

   ```bash
   cp .env.example .env
   ```

   | Variable | Description |
   |---|---|
   | `ANTHROPIC_API_KEY` | Your Anthropic API key |
   | `ENTERSPEED_API_KEY` | Your Enterspeed environment API key (`environment-<uuid>-...`) |
   | `PORT` | Server port (default: `3000`) |

3. *(First run only)* Ingest synthetic demo data into Enterspeed:

     Open the demo-data.mjs file and set the source keys. Then run the following command to ingest the data into Enterspeed:

   ```bash
   node demo-data.mjs
   ```

   This generates and ingests 100 products, 500 customers, 1 000 orders, and 5 000 order lines, batched in groups of 50.

## Usage

**Development** (hot reload):

```bash
npm run dev
```

**Production**:

```bash
npm run build
npm start
```

Open `http://localhost:3000` in your browser and start chatting. Example questions:

- "What are our top 10 best-selling products?"
- "Show me customers who placed more than 5 orders"
- "What is the total revenue for the last month?"

## Architecture

The server is stateless — the browser maintains conversation history and sends it with every request.

```
Browser (public/)
  └─ POST /api/chat  { message, history }
       ↓
  server.ts  — Express, CORS, static files
       ↓
  chatHandler.ts  — Agentic loop (max 10 iterations)
       │  calls Claude with MCP tools; on tool_use, calls mcpClient, feeds result back
       ↓
  mcpClient.ts  — Singleton StreamableHTTPClientTransport
       ↓
  Enterspeed Query MCP Server (https://mcp.query.enterspeed.com/)
```

### Key files

| File | Role |
|---|---|
| `src/server.ts` | Express entry point; bootstraps MCP connection at startup |
| `src/chatHandler.ts` | Agentic loop: calls Claude, detects `tool_use`, dispatches tools, collects tool trace |
| `src/mcpClient.ts` | Singleton MCP client; lazy-initialised; caches available tools |
| `src/types.ts` | Shared TypeScript interfaces |
| `public/app.js` | Vanilla JS chat UI with collapsible tool-trace panel |
| `demo-data.mjs` | One-off script to bulk-ingest synthetic e-commerce data |

## Tech stack

- **Runtime**: Node.js + TypeScript
- **Server**: Express
- **AI**: Claude (`claude-sonnet-4-6`) via the Anthropic SDK
- **MCP**: `@modelcontextprotocol/sdk` with `StreamableHTTPClientTransport`
- **Frontend**: Vanilla JS, no build step
