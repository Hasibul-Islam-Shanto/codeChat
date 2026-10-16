import type { GroqAssistantMessage, LLMResponse, ToolCall } from '../validators/llm.validators';

export type { GroqAssistantMessage, LLMResponse, ToolCall };

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}
