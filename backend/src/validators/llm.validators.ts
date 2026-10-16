import { z } from 'zod';
import { MESSAGE_CONTENT_MAX_LENGTH } from '../constants/llm';

export const toolCallSchema = z.object({
  id: z.string().min(1),
  type: z.literal('function'),
  function: z.object({
    name: z.string().min(1),
    arguments: z.string().default('{}'),
  }),
});

export const groqAssistantMessageSchema = z
  .object({
    role: z.literal('assistant'),
    content: z.string().nullable().optional(),
    tool_calls: z.array(toolCallSchema).optional(),
  })
  .refine((m) => Boolean(m.content?.trim()) || (m.tool_calls && m.tool_calls.length > 0), {
    message: 'Assistant message must have content or tool_calls',
  });

export const llmResponseSchema = z.object({
  message: groqAssistantMessageSchema,
});

export const webSearchArgsSchema = z.object({
  query: z.string().trim().min(1).max(MESSAGE_CONTENT_MAX_LENGTH),
});

export type ToolCall = z.infer<typeof toolCallSchema>;
export type GroqAssistantMessage = z.infer<typeof groqAssistantMessageSchema>;
export type LLMResponse = z.infer<typeof llmResponseSchema>;
export type WebSearchArgs = z.infer<typeof webSearchArgsSchema>;
