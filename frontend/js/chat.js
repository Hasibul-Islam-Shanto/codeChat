import { api } from './api.js';
import { ui } from './ui.js';
import {
  CHAT_TITLE_MAX_LENGTH,
  COPY_LABEL,
  COPIED_LABEL,
  DEFAULT_CHAT_TITLE,
  TOAST,
  WELCOME_CHAT_TITLE,
} from './constants.js';

class ChatApp {
  constructor() {
    this.currentUser = null;
    this.chats = [];
    this.activeChatId = null;
    this.messages = [];
    this.isSending = false;
    this._selectingChatId = null;

    this.chatListEl = document.getElementById('chat-list');
    this.messagesContainerEl = document.getElementById('messages-container');
    this.messageInputEl = document.getElementById('message-input');
    this.btnSendEl = document.getElementById('btn-send');
    this.btnNewChatEl = document.getElementById('btn-new-chat');
    this.searchChatsEl = document.getElementById('search-chats');
    this.sidebarEl = document.getElementById('sidebar');
    this.sidebarOverlayEl = document.getElementById('sidebar-overlay');
    this.btnMobileToggleEl = document.getElementById('btn-mobile-toggle');
    this.btnLogoutEl = document.getElementById('btn-logout');
    this.userProfileEl = document.getElementById('user-profile');
    this.userAvatarEl = document.getElementById('user-avatar');
    this.userNameEl = document.getElementById('user-name');
    this.userEmailEl = document.getElementById('user-email');
  }

  async init() {
    this.bindEvents();

    try {
      const meRes = await api.getMe();
      this.currentUser = meRes.user;
      this.renderUserProfile();
    } catch {
      window.location.href = 'auth.html';
      return;
    }

    await this.loadChats();

    if (this.chats.length > 0) {
      await this.selectChat(this.chats[0].id);
    } else {
      await this.createNewChat(WELCOME_CHAT_TITLE);
    }
  }

  bindEvents() {
    this.btnNewChatEl?.addEventListener('click', () => this.createNewChat());
    this.searchChatsEl?.addEventListener('input', (e) => this.filterChats(e.target.value));

    this.messageInputEl?.addEventListener('input', () => {
      ui.autoExpandTextarea(this.messageInputEl);
      this.updateSendButtonState();
    });

    this.messageInputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    this.btnSendEl?.addEventListener('click', () => this.sendMessage());
    this.btnMobileToggleEl?.addEventListener('click', () => this.toggleMobileSidebar(true));
    this.sidebarOverlayEl?.addEventListener('click', () => this.toggleMobileSidebar(false));

    this.btnLogoutEl?.addEventListener('click', () => {
      ui.showConfirmModal({
        title: 'Sign Out',
        message: 'Are you sure you want to end your CodeChat session?',
        confirmText: 'Sign Out',
        onConfirm: async () => {
          await api.logout();
          ui.showToast(TOAST.signedOut, 'info');
          setTimeout(() => {
            window.location.href = 'auth.html';
          }, 350);
        },
      });
    });

    window.addEventListener('keydown', (e) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (document.activeElement?.isContentEditable) return;
      e.preventDefault();
      this.createNewChat();
    });

    this.messagesContainerEl?.addEventListener('click', (e) => this.onMessagesClick(e));
  }

  async onMessagesClick(e) {
    const retryBtn = e.target.closest?.('.btn-retry-load-messages');
    if (retryBtn?.dataset.chatId) {
      await this.selectChat(retryBtn.dataset.chatId);
      return;
    }

    const btn = e.target.closest?.('.btn-copy-code');
    if (!btn) return;

    const code = btn.closest('.code-block')?.querySelector('pre')?.textContent ?? '';
    try {
      await this.writeClipboard(code);
      btn.textContent = COPIED_LABEL;
      btn.classList.add('copied');
      window.clearTimeout(btn._copyTimer);
      btn._copyTimer = window.setTimeout(() => {
        btn.textContent = COPY_LABEL;
        btn.classList.remove('copied');
      }, 1500);
    } catch {
      ui.showToast(TOAST.copyFailed, 'error');
    }
  }

  async writeClipboard(text) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return;
      }
    } catch {}

    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '0';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('copy failed');
  }

  toggleMobileSidebar(open) {
    if (open) {
      this.sidebarEl?.classList.add('open');
      this.sidebarOverlayEl?.classList.add('active');
    } else {
      this.sidebarEl?.classList.remove('open');
      this.sidebarOverlayEl?.classList.remove('active');
    }
  }

  renderUserProfile() {
    if (!this.currentUser) return;
    const initial = (this.currentUser.username || 'U').charAt(0).toUpperCase();
    if (this.userAvatarEl) this.userAvatarEl.textContent = initial;
    if (this.userNameEl) this.userNameEl.textContent = this.currentUser.username;
    if (this.userEmailEl) this.userEmailEl.textContent = this.currentUser.email;
    this.userProfileEl?.classList.remove('user-profile--loading');
  }

  updateSendButtonState() {
    const hasText = this.messageInputEl.value.trim().length > 0;
    this.btnSendEl.disabled = !hasText || this.isSending;
  }

  async loadChats() {
    try {
      this.chats = await api.listChats();
      this.renderChatList(this.chats);
    } catch (err) {
      ui.showToast(err.message || TOAST.loadChatsFailed, 'error');
    }
  }

  filterChats(query = '') {
    const term = query.trim().toLowerCase();
    if (!term) {
      this.renderChatList(this.chats);
      return;
    }
    const filtered = this.chats.filter((c) => c.title.toLowerCase().includes(term));
    this.renderChatList(filtered);
  }

  renderChatList(chatsToRender) {
    if (!this.chatListEl) return;

    if (chatsToRender.length === 0) {
      this.chatListEl.innerHTML = '<div class="chat-list-empty">No conversations found</div>';
      return;
    }

    this.chatListEl.innerHTML = '';

    chatsToRender.forEach((chat) => {
      const item = document.createElement('div');
      item.className = `chat-item ${chat.id === this.activeChatId ? 'active' : ''}`;
      item.dataset.chatId = chat.id;
      item.setAttribute('role', 'listitem');

      const timeString = ui.formatRelativeTime(chat.updatedAt);

      item.innerHTML = `
        <div class="chat-item-main">
          <span class="chat-item-title">${ui.escapeHtml(chat.title)}</span>
          <span class="chat-item-meta">${timeString}</span>
        </div>
        <div class="chat-item-actions">
          <button class="chat-item-rename" type="button" title="Rename conversation" aria-label="Rename ${ui.escapeHtml(chat.title)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </button>
          <button class="chat-item-delete" type="button" title="Delete conversation" aria-label="Delete ${ui.escapeHtml(chat.title)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('.chat-item-delete, .chat-item-rename, .chat-rename-input')) return;
        this.selectChat(chat.id);
        this.toggleMobileSidebar(false);
      });

      item.querySelector('.chat-item-rename').addEventListener('click', (e) => {
        e.stopPropagation();
        const titleEl = item.querySelector('.chat-item-title');
        this.startInlineRename(chat, titleEl);
      });

      item.querySelector('.chat-item-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        this.confirmDeleteChat(chat.id, chat.title);
      });

      this.chatListEl.appendChild(item);
    });
  }

  showMessagesLoading() {
    if (!this.messagesContainerEl) return;
    this.messagesContainerEl.innerHTML = `
      <div class="messages-panel-state messages-loading">
        <div class="thinking-dot messages-loading-dot"></div>
        <span>Loading messages...</span>
      </div>
    `;
  }

  showMessagesLoadError(chatId) {
    if (!this.messagesContainerEl) return;
    this.messagesContainerEl.innerHTML = `
      <div class="messages-panel-state messages-load-error">
        <p>Could not load this conversation.</p>
        <button type="button" class="btn-secondary btn-retry-load-messages" data-chat-id="${ui.escapeHtml(chatId)}">
          Try again
        </button>
      </div>
    `;
  }

  async selectChat(chatId) {
    if (this._selectingChatId === chatId) return;

    const previousChatId = this.activeChatId;
    const previousMessages = this.messages;

    this.activeChatId = chatId;
    this._selectingChatId = chatId;

    document.querySelectorAll('.chat-item').forEach((el) => {
      el.classList.toggle('active', el.dataset.chatId === chatId);
    });

    this.showMessagesLoading();

    try {
      this.messages = await api.getMessages(chatId);
      this.renderMessages();
      this.scrollToBottom();
    } catch (err) {
      this.activeChatId = previousChatId;
      this.messages = previousMessages;
      document.querySelectorAll('.chat-item').forEach((el) => {
        el.classList.toggle('active', el.dataset.chatId === previousChatId);
      });
      this.showMessagesLoadError(chatId);
      ui.showToast(err.message || TOAST.loadMessagesFailed, 'error');
    } finally {
      this._selectingChatId = null;
    }
  }

  async createNewChat(initialTitle = DEFAULT_CHAT_TITLE) {
    if (this.activeChatId && this.messages.length === 0) {
      this.messageInputEl?.focus();
      return;
    }
    try {
      const newChat = await api.createChat(initialTitle);
      this.chats.unshift(newChat);
      this.renderChatList(this.chats);
      await this.selectChat(newChat.id);
      this.messageInputEl?.focus();
      ui.showToast(TOAST.chatCreated, 'info');
    } catch (err) {
      ui.showToast(err.message || TOAST.createChatFailed, 'error');
    }
  }

  confirmDeleteChat(chatId, chatTitle) {
    ui.showConfirmModal({
      title: 'Delete Conversation',
      message: `Are you sure you want to delete "${chatTitle}"? This action cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await api.deleteChat(chatId);
          const deletedWasActive = this.activeChatId === chatId;
          this.chats = this.chats.filter((c) => c.id !== chatId);
          this.filterChats(this.searchChatsEl?.value || '');
          ui.showToast(TOAST.chatDeleted, 'info');

          if (deletedWasActive) {
            const visibleId = this.chatListEl?.querySelector('.chat-item')?.dataset.chatId;
            if (visibleId) {
              await this.selectChat(visibleId);
            } else if (this.chats.length > 0) {
              if (this.searchChatsEl) this.searchChatsEl.value = '';
              this.filterChats('');
              await this.selectChat(this.chats[0].id);
            } else {
              this.activeChatId = null;
              this.messages = [];
              await this.createNewChat();
            }
          }
        } catch (err) {
          ui.showToast(err.message || TOAST.deleteChatFailed, 'error');
        }
      },
    });
  }

  startInlineRename(chat, titleEl) {
    if (!titleEl || titleEl.querySelector('input')) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-rename-input';
    input.value = chat.title;
    input.setAttribute('aria-label', 'Chat name');
    input.maxLength = CHAT_TITLE_MAX_LENGTH;
    titleEl.textContent = '';
    titleEl.appendChild(input);
    this.bindRenameInput(input, chat, {
      onDone: (savedTitle) => {
        titleEl.textContent = savedTitle;
      },
    });
  }

  bindRenameInput(input, chat, { onDone }) {
    const original = chat.title;
    let finished = false;

    const finish = async (mode) => {
      if (finished || input.dataset.cancelled === '1') return;
      finished = true;
      const next = input.value.trim();

      if (mode === 'cancel' || next === original) {
        onDone(original);
        return;
      }
      if (!next) {
        ui.showToast(TOAST.emptyChatName, 'error');
        onDone(original);
        return;
      }
      if (next.length > CHAT_TITLE_MAX_LENGTH) {
        ui.showToast(TOAST.chatNameTooLong, 'error');
        onDone(original);
        return;
      }

      try {
        await this.applyRename(chat.id, next);
        onDone(next);
      } catch (err) {
        ui.showToast(err.message || TOAST.renameFailed, 'error');
        onDone(original);
      }
    };

    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') {
        e.preventDefault();
        finish('save');
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finish('cancel');
      }
    });
    input.addEventListener('blur', () => finish('save'));
    input.focus();
    input.select();
  }

  async applyRename(chatId, title) {
    const updated = await api.updateChat(chatId, title);
    const chat = this.chats.find((c) => c.id === chatId);
    if (chat) {
      chat.title = updated.title;
      chat.updatedAt = updated.updatedAt || chat.updatedAt;
    }
    this.filterChats(this.searchChatsEl?.value || '');
    ui.showToast(TOAST.chatRenamed, 'info');
  }

  renderMessages() {
    if (!this.messagesContainerEl) return;
    this.messagesContainerEl.innerHTML = '';

    if (this.messages.length === 0) {
      this.renderEmptyState();
      return;
    }

    this.messages.forEach((msg) => {
      this.appendMessageRow(msg);
    });
  }

  renderEmptyState() {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'chat-empty-state';
    emptyDiv.innerHTML = `
      <div class="empty-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </div>
      <h2 class="empty-title">Start a new conversation</h2>
      <p class="empty-desc">Ask code questions, explore architecture patterns, or search the latest web data in real-time.</p>
      <div class="suggestion-chips">
        <button class="suggestion-chip" data-prompt="What are the latest updates on generative AI models released recently?">
          🔍 "What are the latest updates on generative AI models?"
        </button>
        <button class="suggestion-chip" data-prompt="How do Promise resolution and microtasks work in JavaScript?">
          ⚡ "How do Promise resolution and microtasks work in JS?"
        </button>
        <button class="suggestion-chip" data-prompt="Explain referencing vs embedding in MongoDB schemas.">
          📦 "Explain referencing vs embedding in MongoDB schemas"
        </button>
      </div>
    `;

    emptyDiv.querySelectorAll('.suggestion-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        if (this.messageInputEl) {
          this.messageInputEl.value = chip.dataset.prompt;
          ui.autoExpandTextarea(this.messageInputEl);
          this.sendMessage();
        }
      });
    });

    this.messagesContainerEl.appendChild(emptyDiv);
  }

  appendMessageRow(msg) {
    const row = document.createElement('div');
    const isUser = msg.role === 'user';
    row.className = `message-row ${isUser ? 'user' : 'assistant'}`;
    row.dataset.messageId = msg.id;

    let avatarHtml = '';
    if (isUser) {
      const userInitial = (this.currentUser?.username || 'U').charAt(0).toUpperCase();
      avatarHtml = `<div class="message-avatar user">${userInitial}</div>`;
    } else {
      avatarHtml = `
        <div class="message-avatar assistant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </div>
      `;
    }

    let toolBadgeHtml = '';
    if (!isUser && msg.searchedWeb) {
      toolBadgeHtml = `
        <div class="tool-call-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>searched the web</span>
        </div>
      `;
    }

    const formattedContent = isUser ? ui.formatUserMessage(msg.content) : ui.formatMessage(msg.content);
    const timeFormatted = ui.formatRelativeTime(msg.createdAt);

    row.innerHTML = `
      ${avatarHtml}
      <div class="message-content-wrapper">
        ${toolBadgeHtml}
        <div class="message-bubble">${formattedContent}</div>
        <span class="message-time">${timeFormatted}</span>
      </div>
    `;

    this.messagesContainerEl.appendChild(row);
  }

  showThinkingIndicator() {
    const indicatorRow = document.createElement('div');
    indicatorRow.className = 'message-row assistant';
    indicatorRow.id = 'thinking-indicator-row';

    indicatorRow.innerHTML = `
      <div class="message-avatar assistant">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <polyline points="16 18 22 12 16 6"></polyline>
          <polyline points="8 6 2 12 8 18"></polyline>
        </svg>
      </div>
      <div class="message-content-wrapper">
        <div class="thinking-indicator">
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
          <div class="thinking-dot"></div>
        </div>
      </div>
    `;

    this.messagesContainerEl.appendChild(indicatorRow);
    this.scrollToBottom();
  }

  removeThinkingIndicator() {
    document.getElementById('thinking-indicator-row')?.remove();
  }

  scrollToBottom() {
    if (!this.messagesContainerEl) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.messagesContainerEl.scrollTo({
      top: this.messagesContainerEl.scrollHeight,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  async resyncMessagesAfterSendFailure(failedText, tempMessageId) {
    this.messages = this.messages.filter((m) => m.id !== tempMessageId);
    try {
      this.messages = await api.getMessages(this.activeChatId);
      this.renderMessages();
      this.scrollToBottom();
      const savedUserText = this.messages.some((m) => m.role === 'user' && m.content === failedText);
      if (!savedUserText && this.messageInputEl) {
        this.messageInputEl.value = failedText;
        ui.autoExpandTextarea(this.messageInputEl);
      }
    } catch {
      this.renderMessages();
      if (this.messageInputEl) {
        this.messageInputEl.value = failedText;
        ui.autoExpandTextarea(this.messageInputEl);
      }
    }
  }

  async sendMessage() {
    const text = this.messageInputEl?.value.trim();
    if (!text || this.isSending || !this.activeChatId) return;

    this.isSending = true;
    this.messageInputEl.value = '';
    ui.autoExpandTextarea(this.messageInputEl);
    this.messageInputEl.disabled = true;
    this.btnSendEl.disabled = true;

    this.messagesContainerEl.querySelector('.chat-empty-state')?.remove();

    const tempUserMsg = {
      id: `tmp_${Date.now()}`,
      chatId: this.activeChatId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    this.messages.push(tempUserMsg);
    this.appendMessageRow(tempUserMsg);
    this.scrollToBottom();
    this.showThinkingIndicator();

    try {
      const assistantMsg = await api.sendMessage(this.activeChatId, text);
      this.removeThinkingIndicator();
      try {
        this.messages = await api.getMessages(this.activeChatId);
      } catch {
        this.messages = this.messages.filter((m) => m.id !== tempUserMsg.id);
        this.messages.push(
          { ...tempUserMsg, id: `local_${Date.now()}` },
          assistantMsg,
        );
      }
      this.renderMessages();
      this.scrollToBottom();

      await this.loadChats();
    } catch (err) {
      this.removeThinkingIndicator();
      await this.resyncMessagesAfterSendFailure(text, tempUserMsg.id);
      ui.showToast(err.message || TOAST.assistantFailed, 'error');
    } finally {
      this.isSending = false;
      this.messageInputEl.disabled = false;
      this.messageInputEl.focus();
      this.updateSendButtonState();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new ChatApp();
  app.init();
});
