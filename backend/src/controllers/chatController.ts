import { Response } from 'express';
import mongoose from 'mongoose';
import { Chat } from '../models/Chat';
import { Message } from '../models/Message';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { createChatSchema, createMessageSchema, updateChatSchema } from '../validators/chat.validators';
import { DEFAULT_CHAT_TITLE } from '../constants/chat';
import { CHAT_DELETED, CHAT_NOT_FOUND, INVALID_CHAT_ID } from '../constants/errors';

export const createChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { title } = createChatSchema.parse(req.body || {});

  const chat = await Chat.create({
    userId,
    title: title || DEFAULT_CHAT_TITLE,
  });

  const chatJson = chat.toJSON();
  res.status(201).json({
    ...chatJson,
    id: chat._id.toString(),
    chat,
  });
};

export const listChats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const chats = await Chat.find({ userId }).sort({ updatedAt: -1 });
  res.status(200).json(chats);
};

export const getChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: INVALID_CHAT_ID, message: INVALID_CHAT_ID });
    return;
  }

  const chat = await Chat.findOne({ _id: id, userId });
  if (!chat) {
    res.status(404).json({ error: CHAT_NOT_FOUND, message: CHAT_NOT_FOUND });
    return;
  }

  const chatJson = chat.toJSON();
  res.status(200).json({
    ...chatJson,
    id: chat._id.toString(),
    chat,
  });
};

export const deleteChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: INVALID_CHAT_ID, message: INVALID_CHAT_ID });
    return;
  }

  const chat = await Chat.findOneAndDelete({ _id: id, userId });
  if (!chat) {
    res.status(404).json({ error: CHAT_NOT_FOUND, message: CHAT_NOT_FOUND });
    return;
  }

  await Message.deleteMany({ chatId: new mongoose.Types.ObjectId(id) });

  res.status(200).json({ status: 'ok', id, message: CHAT_DELETED });
};

export const updateChat = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: INVALID_CHAT_ID, message: INVALID_CHAT_ID });
    return;
  }

  const { title } = updateChatSchema.parse(req.body || {});

  const chat = await Chat.findOne({ _id: id, userId });
  if (!chat) {
    res.status(404).json({ error: CHAT_NOT_FOUND, message: CHAT_NOT_FOUND });
    return;
  }

  chat.title = title;
  chat.updatedAt = new Date();
  await chat.save();

  const chatJson = chat.toJSON();
  res.status(200).json({
    ...chatJson,
    id: chat._id.toString(),
    title: chat.title,
    chat,
  });
};

export const getMessages = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: INVALID_CHAT_ID, message: INVALID_CHAT_ID });
    return;
  }

  const chat = await Chat.findOne({ _id: id, userId });
  if (!chat) {
    res.status(404).json({ error: CHAT_NOT_FOUND, message: CHAT_NOT_FOUND });
    return;
  }

  const messages = await Message.find({ chatId: id }).sort({ createdAt: 1 });
  res.status(200).json(messages);
};

export const createMessage = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ error: INVALID_CHAT_ID, message: INVALID_CHAT_ID });
    return;
  }

  const chat = await Chat.findOne({ _id: id, userId });
  if (!chat) {
    res.status(404).json({ error: CHAT_NOT_FOUND, message: CHAT_NOT_FOUND });
    return;
  }

  // Stores a user message only — this path does not call the LLM.
  const { content } = createMessageSchema.parse(req.body);

  const message = await Message.create({
    chatId: chat._id,
    role: 'user',
    content,
  });

  chat.updatedAt = new Date();
  await chat.save();

  const msgJson = message.toJSON();
  res.status(201).json({
    ...msgJson,
    id: message._id.toString(),
    message,
  });
};
