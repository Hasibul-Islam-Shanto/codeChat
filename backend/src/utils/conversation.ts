import { IMessage } from '../models/Message';
import { ChatCompletionMessage } from '../types/llm';

export const sliceConversation = (messages: IMessage[], maxMessages: number): IMessage[] => {
  if (messages.length <= maxMessages) {
    return messages;
  }

  let start = messages.length - maxMessages;
  while (start > 0 && messages[start].role === 'tool') {
    start -= 1;
  }

  return messages.slice(start);
};

export const toChatCompletionMessage = (m: IMessage): ChatCompletionMessage => {
  const hasToolCalls = Boolean(m.toolCalls && m.toolCalls.length > 0);
  const item: ChatCompletionMessage = {
    role: m.role,
    content: hasToolCalls ? m.content || null : m.content || '',
  };

  if (hasToolCalls) {
    item.tool_calls = m.toolCalls;
  }
  if (m.toolCallId) {
    item.tool_call_id = m.toolCallId;
  }

  return item;
};
