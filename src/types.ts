export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ConversationMessage[];
}

export interface ToolStep {
  toolName: string;
  input: Record<string, unknown>;
  result: string;
  isError: boolean;
}

export interface ChatResponse {
  answer: string;
  toolSteps: ToolStep[];
  error?: string;
}
