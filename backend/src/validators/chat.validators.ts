import { z } from 'zod';
import { CHAT_TITLE_MAX_LENGTH } from '../constants/chat';
import { MESSAGE_CONTENT_MAX_LENGTH } from '../constants/llm';

const chatTitleSchema = z
  .string()
  .trim()
  .min(1, 'Chat title cannot be empty')
  .max(CHAT_TITLE_MAX_LENGTH, `Chat title must not exceed ${CHAT_TITLE_MAX_LENGTH} characters`);

export const createChatSchema = z.object({
  title: chatTitleSchema.optional(),
});

export const updateChatSchema = z.object({
  title: chatTitleSchema,
});

export const createMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(MESSAGE_CONTENT_MAX_LENGTH, `Message must not exceed ${MESSAGE_CONTENT_MAX_LENGTH} characters`),
});

export const sendMessageSchema = z.object({
  content: z
    .string({ required_error: 'Message content is required' })
    .trim()
    .min(1, 'Message content cannot be empty')
    .max(MESSAGE_CONTENT_MAX_LENGTH, `Message must not exceed ${MESSAGE_CONTENT_MAX_LENGTH} characters`),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
export type UpdateChatInput = z.infer<typeof updateChatSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
