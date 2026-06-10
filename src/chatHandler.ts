import Anthropic from '@anthropic-ai/sdk';
import { getMcpTools, callMcpTool } from './mcpClient.js';
import type { ChatRequest, ChatResponse, ToolStep } from './types.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_ITERATIONS = 10;

export async function handleChat(req: ChatRequest): Promise<ChatResponse> {
  const tools = await getMcpTools();
  const toolSteps: ToolStep[] = [];

  const messages: Anthropic.MessageParam[] = [
    ...(req.conversationHistory ?? []),
    { role: 'user', content: req.message },
  ];

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      tools,
      messages,
    });

    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find((b) => b.type === 'text');
      return {
        answer: textBlock?.type === 'text' ? textBlock.text : '',
        toolSteps,
      };
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use'
      );

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        let text: string;
        let isError = false;

        try {
          const result = await callMcpTool(
            toolUse.name,
            toolUse.input as Record<string, unknown>
          );
          text = result.text;
          isError = result.isError;
        } catch (err) {
          text = err instanceof Error ? err.message : String(err);
          isError = true;
        }

        toolSteps.push({ toolName: toolUse.name, input: toolUse.input as Record<string, unknown>, result: text, isError });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: text,
          is_error: isError,
        });
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // max_tokens or unexpected stop reason — return whatever text we have
    const textBlock = response.content.find((b) => b.type === 'text');
    return {
      answer: textBlock?.type === 'text' ? textBlock.text : '[Response truncated]',
      toolSteps,
      error: response.stop_reason === 'max_tokens' ? 'Response was cut off (max tokens reached)' : undefined,
    };
  }

  return { answer: '', toolSteps, error: 'Maximum tool iteration limit reached' };
}
