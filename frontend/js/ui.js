import { COPY_LABEL, DEFAULT_CODE_LABEL, LANGUAGE_LABELS } from './constants.js';

export const ui = {
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

    let iconSvg = '';
    if (type === 'error') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else if (type === 'success') {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else {
      iconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `${iconSvg}<span>${this.escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 260);
    }, 3500);
  },

  showConfirmModal({ title = 'Confirm Action', message = 'Are you sure?', confirmText = 'Delete', onConfirm }) {
    const backdrop = document.getElementById('confirm-modal-backdrop');
    const modalCard = backdrop?.querySelector('.modal-card');
    if (!backdrop || !modalCard) return;

    const titleEl = document.getElementById('modal-title');
    const descEl = document.getElementById('modal-desc');
    const confirmBtn = document.getElementById('modal-btn-confirm');
    const cancelBtn = document.getElementById('modal-btn-cancel');

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = message;
    if (confirmBtn) confirmBtn.textContent = confirmText;

    const previouslyFocused = document.activeElement;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');

    const focusable = () =>
      [...modalCard.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
        (el) => !el.hasAttribute('disabled')
      );

    const handleConfirm = () => {
      cleanup();
      if (typeof onConfirm === 'function') onConfirm();
    };

    const handleCancel = () => {
      cleanup();
    };

    const handleBackdropClick = (e) => {
      if (e.target === backdrop) handleCancel();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCancel();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusable();
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    function cleanup() {
      backdrop.classList.remove('open');
      backdrop.setAttribute('aria-hidden', 'true');
      confirmBtn?.removeEventListener('click', handleConfirm);
      cancelBtn?.removeEventListener('click', handleCancel);
      backdrop.removeEventListener('click', handleBackdropClick);
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus();
      }
    }

    confirmBtn?.addEventListener('click', handleConfirm, { once: true });
    cancelBtn?.addEventListener('click', handleCancel, { once: true });
    backdrop.addEventListener('click', handleBackdropClick);
    document.addEventListener('keydown', handleKeyDown);
    (cancelBtn || confirmBtn)?.focus();
  },

  escapeHtml(str = '') {
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  },

  formatUserMessage(text = '') {
    if (!text) return '';
    return this.escapeHtml(text).replace(/\n/g, '<br>');
  },

  normalizeMarkdown(text = '') {
    let src = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    src = src.replace(/【[^】]*】/g, '');
    src = src.replace(/\[\d+\s*[†+]\s*[^\]]*\]/g, '');

    const lines = src.split('\n');
    const out = [];
    let fence = null;

    const brokenOpen = (trimmed) => trimmed.match(/^(`{1,2})([A-Za-z][\w#+.-]*)\s*$/);
    const standardMarker = (trimmed) => {
      const match = trimmed.match(/^(`{3,}|~{3,})/);
      return match ? match[1] : null;
    };
    const isStandardClose = (trimmed, marker) => {
      const char = marker[0] === '`' ? '`' : '~';
      const re = new RegExp(`^${char}{${marker.length},}\\s*$`);
      return re.test(trimmed);
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (fence?.kind === 'standard') {
        out.push(line);
        if (isStandardClose(trimmed, fence.marker)) fence = null;
        continue;
      }

      if (fence?.kind === 'broken') {
        if (/^`{1,3}\s*$/.test(trimmed)) {
          fence = null;
          out.push('```');
          continue;
        }
        const reopen = brokenOpen(trimmed);
        if (reopen) {
          out.push('```');
          out.push('```' + reopen[2]);
          continue;
        }
        out.push(line);
        continue;
      }

      const marker = standardMarker(trimmed);
      if (marker) {
        fence = { kind: 'standard', marker };
        out.push(line);
        continue;
      }

      const opened = brokenOpen(trimmed);
      if (opened) {
        fence = { kind: 'broken', marker: '```' };
        out.push('```' + opened[2]);
        continue;
      }

      out.push(line);
    }

    if (fence) out.push(fence.marker);
    return out.join('\n');
  },

  languageLabel(lang = '') {
    const key = String(lang).trim().toLowerCase();
    if (!key) return DEFAULT_CODE_LABEL;
    return LANGUAGE_LABELS[key] || key;
  },

  ensureMarkdown() {
    const lib = globalThis.marked;
    if (!lib) return null;
    if (!this._markdownReady) {
      if (typeof lib.use === 'function') {
        lib.use({ gfm: true, breaks: true });
      } else if (typeof lib.setOptions === 'function') {
        lib.setOptions({ gfm: true, breaks: true });
      }
      this._markdownReady = true;
    }
    return lib;
  },

  formatMessage(text = '') {
    if (!text) return '';
    const lib = this.ensureMarkdown();
    const purify = globalThis.DOMPurify;
    if (!lib || !purify || typeof lib.parse !== 'function') {
      return this.formatUserMessage(text);
    }

    try {
      const normalized = this.normalizeMarkdown(text);
      const parsed = lib.parse(normalized);
      if (!parsed || typeof parsed !== 'string') return this.formatUserMessage(text);
      const clean = purify.sanitize(parsed, { USE_PROFILES: { html: true } });
      return this.wrapRichBlocks(clean);
    } catch (err) {
      console.warn('Markdown render failed', err);
      return this.formatUserMessage(text);
    }
  },

  hardenLinks(root) {
    root.querySelectorAll('a[href]').forEach((anchor) => {
      const href = anchor.getAttribute('href') || '';
      if (href.startsWith('javascript:') || href.startsWith('data:')) {
        anchor.removeAttribute('href');
        return;
      }
      const isExternal =
        /^https?:\/\//i.test(href) &&
        (typeof window === 'undefined' ||
          !href.startsWith(window.location.origin));
      if (anchor.getAttribute('target') === '_blank' || isExternal) {
        anchor.setAttribute('rel', 'noopener noreferrer');
        if (isExternal && !anchor.getAttribute('target')) {
          anchor.setAttribute('target', '_blank');
        }
      }
    });
  },

  wrapRichBlocks(html = '') {
    const root = document.createElement('div');
    root.innerHTML = html;

    root.querySelectorAll('pre').forEach((pre) => {
      if (pre.closest('.code-block')) return;
      const code = pre.querySelector('code');
      const className = code?.getAttribute('class') || '';
      const langMatch = className.match(/(?:language|lang)-([\w#+.-]+)/i);
      const label = this.languageLabel(langMatch?.[1] || '');

      const block = document.createElement('div');
      block.className = 'code-block';

      const header = document.createElement('div');
      header.className = 'code-block-header';

      const langEl = document.createElement('span');
      langEl.className = 'code-block-lang';
      langEl.textContent = label;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn-copy-code';
      button.textContent = COPY_LABEL;
      button.setAttribute('aria-label', `Copy ${label} code`);

      header.append(langEl, button);
      block.append(header, pre.cloneNode(true));
      pre.replaceWith(block);
    });

    root.querySelectorAll('table').forEach((table) => {
      if (table.parentElement?.classList.contains('table-scroll')) return;
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      table.replaceWith(wrap);
      wrap.appendChild(table);
    });

    this.hardenLinks(root);

    return root.innerHTML;
  },

  formatRelativeTime(dateInput) {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (Number.isNaN(date.getTime())) return '';

    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  },

  autoExpandTextarea(textareaEl) {
    if (!textareaEl) return;
    textareaEl.style.height = 'auto';
    textareaEl.style.height = `${Math.min(textareaEl.scrollHeight, 180)}px`;
  },
};
