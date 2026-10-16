import { Groq } from 'groq-sdk';
import { ZodError } from 'zod';
import { env } from '../config/env';
import type { ChatCompletionMessage, LLMResponse } from '../types/llm';
import { WEB_SEARCH_TOOL } from '../tools/webSearch';
import {
  LLM_TEMPERATURE,
  MOCK_KEY_PREFIX,
  MOCK_SEARCH_QUERY_PATTERN,
  TOOL_CHOICE_AUTO,
  WEB_SEARCH_TOOL_NAME,
} from '../constants/llm';
import { INVALID_LLM_RESPONSE } from '../constants/errors';
import { MOCK_GROQ_WARNING, SYSTEM_PROMPT, mockPlainReply, mockSearchReply } from '../constants/prompts';
import { llmResponseSchema } from '../validators/llm.validators';
import { HttpError } from '../utils/httpError';

export type { ChatCompletionMessage, LLMResponse };
export { WEB_SEARCH_TOOL };

let groqClientInstance: Groq | null = null;

const getGroqClient = (): Groq => {
  if (!groqClientInstance) {
    groqClientInstance = new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  }
  return groqClientInstance;
};

const parseLlmResponse = (message: unknown): LLMResponse => {
  try {
    return llmResponseSchema.parse({ message });
  } catch (error) {
    if (error instanceof ZodError) {
      throw new HttpError(502, INVALID_LLM_RESPONSE);
    }
    throw error;
  }
};

export const callGroqChatCompletion = async (
  messages: ChatCompletionMessage[],
  tools?: typeof WEB_SEARCH_TOOL[]
): Promise<LLMResponse> => {
  const preparedMessages: ChatCompletionMessage[] = [...messages];
  if (!preparedMessages.some((m) => m.role === 'system')) {
    preparedMessages.unshift({
      role: 'system',
      content: SYSTEM_PROMPT,
    });
  }

  if (!env.GROQ_API_KEY || env.GROQ_API_KEY.startsWith(MOCK_KEY_PREFIX)) {
    console.warn(MOCK_GROQ_WARNING);
    const lastUserMessage = [...preparedMessages].reverse().find((m) => m.role === 'user');
    const query = lastUserMessage?.content || '';

    const isSearchQuery = MOCK_SEARCH_QUERY_PATTERN.test(query);
    const hasToolResult = preparedMessages.some((m) => m.role === 'tool');

    if (tools && tools.length > 0 && isSearchQuery && !hasToolResult) {
      return parseLlmResponse({
        role: 'assistant',
        content: null,
        tool_calls: [
          {
            id: `call_${Date.now()}`,
            type: 'function',
            function: {
              name: WEB_SEARCH_TOOL_NAME,
              arguments: JSON.stringify({ query }),
            },
          },
        ],
      });
    }

    if (hasToolResult) {
      const toolMsg = preparedMessages.find((m) => m.role === 'tool');
      return parseLlmResponse({
        role: 'assistant',
        content: mockSearchReply(toolMsg?.content || '', query),
      });
    }

    return parseLlmResponse({
      role: 'assistant',
      content: mockPlainReply(query),
    });
  }

  const formattedMessages = preparedMessages.map((msg) => {
    const formatted: Record<string, unknown> = {
      role: msg.role,
      content: msg.content ?? null,
    };
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      formatted.tool_calls = msg.tool_calls;
    }
    if (msg.tool_call_id) {
      formatted.tool_call_id = msg.tool_call_id;
    }
    return formatted;
  });

  const groq = getGroqClient();

  const completionParams: Record<string, unknown> = {
    model: env.GROQ_MODEL,
    messages: formattedMessages,
    temperature: LLM_TEMPERATURE,
  };

  if (tools && tools.length > 0) {
    completionParams.tools = tools;
    completionParams.tool_choice = TOOL_CHOICE_AUTO;
  }

  const completion = await groq.chat.completions.create(completionParams as any);
  const choice = completion.choices?.[0];

  if (!choice || !choice.message) {
    throw new HttpError(502, INVALID_LLM_RESPONSE);
  }

  return parseLlmResponse(choice.message);
};
