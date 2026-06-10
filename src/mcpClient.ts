import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.js';

const MCP_URL = 'https://mcp.query.enterspeed.com/';

let mcpClient: Client | null = null;
let cachedTools: Tool[] = [];

export async function getMcpClient(): Promise<Client> {
  if (mcpClient) return mcpClient;

  const apiKey = process.env.ENTERSPEED_API_KEY;
  if (!apiKey) throw new Error('ENTERSPEED_API_KEY is not set');

  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
    requestInit: { headers: { 'x-api-key': apiKey } },
  });

  const client = new Client(
    { name: 'enterspeed-chat-ui', version: '1.0.0' },
    { capabilities: {} }
  );

  await client.connect(transport);
  mcpClient = client;
  return mcpClient;
}

export async function getMcpTools(): Promise<Tool[]> {
  if (cachedTools.length > 0) return cachedTools;

  const client = await getMcpClient();
  const { tools } = await client.listTools();

  cachedTools = tools.map((t) => ({
    name: t.name,
    description: t.description ?? '',
    input_schema: t.inputSchema as Tool['input_schema'],
  }));

  return cachedTools;
}

export async function callMcpTool(
  name: string,
  input: Record<string, unknown>
): Promise<{ text: string; isError: boolean }> {
  const client = await getMcpClient();
  const result = await client.callTool({ name, arguments: input });

  const text = result.content
    .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
    .map((c) => c.text)
    .join('\n') || JSON.stringify(result.content);

  return { text, isError: result.isError === true };
}
