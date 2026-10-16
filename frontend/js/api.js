import { DEFAULT_CHAT_TITLE, TOAST } from './constants.js';

const hostname =
  typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const BASE_URL =
  typeof window !== 'undefined' && window.CODECHAT_API_URL
    ? window.CODECHAT_API_URL
    : `http://${hostname}:5001/api`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error(TOAST.networkError);
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => ({}))
    : {};

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

function normalizeChatId(item, fallbackId) {
  const raw = item?.id ?? item?._id ?? fallbackId;
  return raw != null ? String(raw) : fallbackId;
}

export const api = {
  async signup({ username, email, password }) {
    const data = await request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    return { status: 'ok', user: data.user };
  },

  async signin({ email, password }) {
    const data = await request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return { status: 'ok', user: data.user };
  },

  async getMe() {
    const data = await request('/auth/me');
    return { status: 'ok', user: data.user };
  },

  async logout() {
    return request('/auth/logout', { method: 'POST' });
  },

  async listChats() {
    const data = await request('/chats');
    const rawList = Array.isArray(data) ? data : data.chats || [];

    return rawList.map((item) => ({
      id: normalizeChatId(item),
      title: item.title || 'Conversation',
      createdAt: item.createdAt || new Date().toISOString(),
      updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
    }));
  },

  async createChat(title = DEFAULT_CHAT_TITLE) {
    const data = await request('/chats', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    const chat = data.chat || data;
    return {
      id: normalizeChatId(data, normalizeChatId(chat)),
      title: chat.title || title,
      createdAt: chat.createdAt || new Date().toISOString(),
      updatedAt: chat.updatedAt || new Date().toISOString(),
    };
  },

  async getChat(chatId) {
    const data = await request(`/chats/${chatId}`);
    const chat = data.chat || data;
    return {
      id: normalizeChatId(data, normalizeChatId(chat, chatId)),
      title: chat.title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  },

  async updateChat(chatId, title) {
    const data = await request(`/chats/${chatId}`, {
      method: 'PATCH',
      body: JSON.stringify({ title }),
    });
    const chat = data.chat || data;
    return {
      id: normalizeChatId(data, normalizeChatId(chat, chatId)),
      title: data.title || chat.title || title,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt || new Date().toISOString(),
    };
  },

  async deleteChat(chatId) {
    return request(`/chats/${chatId}`, { method: 'DELETE' });
  },

  async getMessages(chatId) {
    const rawMessages = await request(`/chats/${chatId}/messages`);
    const list = Array.isArray(rawMessages) ? rawMessages : [];

    let prevWasTool = false;
    const formattedMessages = [];

    for (const msg of list) {
      if (msg.role === 'tool') {
        prevWasTool = true;
        continue;
      }

      if (msg.role === 'assistant' && !msg.content && msg.toolCalls && msg.toolCalls.length > 0) {
        prevWasTool = true;
        continue;
      }

      const hasToolCall = Boolean(
        msg.searchedWeb ||
          (msg.toolCalls && msg.toolCalls.length > 0) ||
          (msg.role === 'assistant' && prevWasTool)
      );

      formattedMessages.push({
        id: normalizeChatId(msg, msg._id || msg.id),
        chatId: msg.chatId,
        role: msg.role,
        content: msg.content || '',
        searchedWeb: hasToolCall,
        createdAt: msg.createdAt || new Date().toISOString(),
      });

      if (msg.role === 'assistant') {
        prevWasTool = false;
      }
    }

    return formattedMessages;
  },

  async sendMessage(chatId, content) {
    const data = await request(`/chats/${chatId}/send`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    const reply = data.reply || data;
    return {
      id: normalizeChatId(data, normalizeChatId(reply)),
      chatId: reply.chatId || chatId,
      role: 'assistant',
      content: reply.content || data.content || '',
      searchedWeb: Boolean(data.searchedWeb || (reply.toolCalls && reply.toolCalls.length > 0)),
      createdAt: reply.createdAt || new Date().toISOString(),
    };
  },
};
