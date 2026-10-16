import { Response } from 'express';
import mongoose from 'mongoose';
import { Chat } from '../models/Chat';
import { Message, IMessage } from '../models/Message';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { callGroqChatCompletion } from '../services/llmService';
import { searchWeb } from '../services/searchService';
import { sendMessageSchema } from '../validators/chat.validators';
import { webSearchArgsSchema } from '../validators/llm.validators';
import { ChatCompletionMessage } from '../types/llm';
import { WEB_SEARCH_TOOL } from '../tools/webSearch';
import { AUTO_TITLE_LIMIT, AUTO_TITLE_SLICE, AUTO_TITLE_TITLES } from '../constants/chat';
import { HISTORY_MAX_MESSAGES, WEB_SEARCH_TOOL_NAME } from '../constants/llm';
import { CHAT_NOT_FOUND, INVALID_CHAT_ID, INVALID_WEB_SEARCH_ARGS } from '../constants/errors';
import {
  ASSISTANT_FAILURE_REPLY,
  EMPTY_SEARCH_ANSWER,
  SYNTHESIS_PROMPT,
  toolUnavailableMessage,
} from '../constants/prompts';
import { withChatLock } from '../utils/chatLock';
import { sliceConversation, toChatCompletionMessage } from '../utils/conversation';

const persistAssistantFailure = async (chatId: mongoose.Types.ObjectId): Promise<IMessage> => {
  return Message.create({
    chatId,
    role: 'assistant',
    content: ASSISTANT_FAILURE_REPLY,
  });
};

const respondWithReply = (res: Response, doc: IMessage, searchedWeb: boolean, userMessage: IMessage): void => {
  const replyJson = doc.toJSON();
  res.status(200).json({
    ...replyJson,
    id: doc._id.toString(),
    searchedWeb,
    userMessage,
    reply: doc,
  });
};

export const sendMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: INVALID_CHAT_ID, message: INVALID_CHAT_ID });
    return;
  }

  const { content } = sendMessageSchema.parse(req.body);

  await withChatLock(id, async () => {
    const chat = await Chat.findOne({ _id: id, userId });
    if (!chat) {
      res.status(404).json({ error: CHAT_NOT_FOUND, message: CHAT_NOT_FOUND });
      return;
    }

    const userMessage = await Message.create({
      chatId: chat._id,
      role: 'user',
      content,
    });

    if (AUTO_TITLE_TITLES.includes(chat.title)) {
      const trimmedTitle = content.length > AUTO_TITLE_LIMIT ? `${content.substring(0, AUTO_TITLE_SLICE)}...` : content;
      chat.title = trimmedTitle;
    }
    chat.updatedAt = new Date();
    await chat.save();

    const dbMessages: IMessage[] = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    const conversationHistory: ChatCompletionMessage[] = sliceConversation(dbMessages, HISTORY_MAX_MESSAGES).map(
      toChatCompletionMessage
    );

    let searchedWeb = false;
    let finalAssistantMessageDoc: IMessage;

    try {
      const initialResponse = await callGroqChatCompletion(conversationHistory, [WEB_SEARCH_TOOL]);
      const assistantMsg = initialResponse.message;

      if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
        searchedWeb = assistantMsg.tool_calls.some((call) => call.function.name === WEB_SEARCH_TOOL_NAME);

        const toolResults: Array<{ id: string; content: string }> = [];
        for (const toolCall of assistantMsg.tool_calls) {
          let toolContent = '';

          if (toolCall.function.name === WEB_SEARCH_TOOL_NAME) {
            let parsedJson: unknown = {};
            try {
              parsedJson = JSON.parse(toolCall.function.arguments || '{}');
            } catch {
              parsedJson = {};
            }

            const parsedArgs = webSearchArgsSchema.safeParse(parsedJson);
            if (!parsedArgs.success) {
              toolContent = INVALID_WEB_SEARCH_ARGS;
            } else {
              const searchResult = await searchWeb(parsedArgs.data.query);
              toolContent = searchResult.formatted;
            }
          } else {
            toolContent = toolUnavailableMessage(toolCall.function?.name);
          }

          toolResults.push({ id: toolCall.id, content: toolContent });
        }

        conversationHistory.push({
          role: 'assistant',
          content: assistantMsg.content || null,
          tool_calls: assistantMsg.tool_calls,
        });

        for (const toolResult of toolResults) {
          conversationHistory.push({
            role: 'tool',
            content: toolResult.content,
            tool_call_id: toolResult.id,
          });
        }

        conversationHistory.push({
          role: 'user',
          content: SYNTHESIS_PROMPT,
        });

        let finalText = ASSISTANT_FAILURE_REPLY;
        try {
          const finalResponse = await callGroqChatCompletion(conversationHistory);
          finalText = (finalResponse.message.content || '').trim() || EMPTY_SEARCH_ANSWER;
        } catch (error) {
          console.error('Error during Groq synthesis completion:', error);
        }

        await Message.create({
          chatId: chat._id,
          role: 'assistant',
          content: assistantMsg.content || '',
          toolCalls: assistantMsg.tool_calls,
        });

        for (const toolResult of toolResults) {
          await Message.create({
            chatId: chat._id,
            role: 'tool',
            content: toolResult.content,
            toolCallId: toolResult.id,
          });
        }

        finalAssistantMessageDoc = await Message.create({
          chatId: chat._id,
          role: 'assistant',
          content: finalText,
        });
      } else {
        finalAssistantMessageDoc = await Message.create({
          chatId: chat._id,
          role: 'assistant',
          content: assistantMsg.content || '',
        });
      }
    } catch (error) {
      console.error('Error during send completion:', error);
      finalAssistantMessageDoc = await persistAssistantFailure(chat._id);
    }

    chat.updatedAt = new Date();
    await chat.save();

    respondWithReply(res, finalAssistantMessageDoc, searchedWeb, userMessage);
  });
};
