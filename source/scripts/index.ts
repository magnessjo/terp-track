import '../styles/terp-chat.css';
import { getSession, clearSession } from './auth';
import { initLogin } from './login';
import {
  classifyInput,
  nextDemoMode,
  buildWebhookPayload,
  parseWebhookResponse,
  buildNetworkErrorMessage,
  buildServerErrorMessage,
  buildWelcomeMessage,
  DELIVERABLES_QUERY,
  messageAttributes,
  validateFile,
  truncateFilename,
  isImageMimeType,
  formatMessageText,
  FILE_ACCEPT_STRING,
} from './chat.pure';
import type { MessageDescriptor, WebhookResponse } from './chat.pure';
import logoLightUrl from '../../images/logo-light.png';
import logoDarkUrl from '../../images/logo-dark.png';
import patternUrl from '../../images/pattern.png';
import chatIconUrl from '../../images/chat-icon.png';

const shellPattern = document.getElementById('shell-pattern');
if (shellPattern) {
  shellPattern.style.backgroundImage = `url('${patternUrl}')`;
}

const WEBHOOK_URL = 'https://n8n.srv975877.hstgr.cloud/webhook/school-trello';

const GEAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
</svg>`;

const CLOSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <line x1="18" y1="6" x2="6" y2="18"/>
  <line x1="6" y1="6" x2="18" y2="18"/>
</svg>`;

const PAPERCLIP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
</svg>`;

const PERSON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
</svg>`;

type Theme = 'light' | 'dark';

function getTheme(): Theme {
  const stored = localStorage.getItem('terp-track-theme');
  return stored === 'dark' ? 'dark' : 'light';
}

function logoForTheme(theme: Theme): string {
  return theme === 'dark' ? logoDarkUrl : logoLightUrl;
}

function setTheme(chat: Element, theme: Theme) {
  localStorage.setItem('terp-track-theme', theme);
  chat.setAttribute('data-theme', theme);
  const logo = chat.querySelector('.chat-header img') as HTMLImageElement;
  if (logo) logo.src = logoForTheme(theme);
}

function init() {
  const chat = document.querySelector('terp-chat');
  if (!chat) return;

  setTheme(chat, getTheme());

  const header = buildHeader(chat);
  const messages = buildMessages();
  const loading = buildLoading();
  const inputArea = buildInputArea();
  const settingsPanel = buildSettingsPanel(chat);

  messages.appendChild(loading);

  const chatContent = document.createElement('div');
  chatContent.className = 'chat-content';
  chatContent.appendChild(messages);
  chatContent.appendChild(inputArea);

  const chatBody = document.createElement('div');
  chatBody.className = 'chat-body';
  chatBody.appendChild(chatContent);
  chatBody.appendChild(settingsPanel);

  chat.appendChild(header);
  chat.appendChild(chatBody);

  const input = inputArea.querySelector(
    'input[type="text"]',
  ) as HTMLInputElement;
  const button = inputArea.querySelector('.send-btn') as HTMLButtonElement;
  const uploadBtn = inputArea.querySelector(
    '.upload-btn',
  ) as HTMLButtonElement;
  const fileInput = inputArea.querySelector(
    'input[type="file"]',
  ) as HTMLInputElement;
  const filePreviewArea = inputArea.querySelector(
    '.file-preview-area',
  ) as HTMLElement;

  let pendingFile: File | null = null;

  function handleFileSelection(file: File) {
    const result = validateFile(file.name, file.size, file.type);
    if (!result.valid) {
      renderMessage(messages, loading, {
        sender: 'bot',
        type: 'error',
        text: result.reason,
      });
      return;
    }
    pendingFile = file;
    renderFilePreview(filePreviewArea, file, clearPendingFile);
  }

  function clearPendingFile() {
    pendingFile = null;
    filePreviewArea.hidden = true;
    filePreviewArea.innerHTML = '';
    fileInput.value = '';
  }

  uploadBtn.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files?.[0]) handleFileSelection(fileInput.files[0]);
  });

  // Drag and drop
  let dragCounter = 0;
  inputArea.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    inputArea.setAttribute('data-drag-over', 'true');
  });
  inputArea.addEventListener('dragleave', () => {
    dragCounter--;
    if (dragCounter === 0) inputArea.removeAttribute('data-drag-over');
  });
  inputArea.addEventListener('dragover', (e) => e.preventDefault());
  inputArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    inputArea.removeAttribute('data-drag-over');
    const file = (e as DragEvent).dataTransfer?.files[0];
    if (file) handleFileSelection(file);
  });

  renderMessage(messages, loading, buildWelcomeMessage());
  sendToWebhook(chat, messages, loading, DELIVERABLES_QUERY);

  const handleSubmit = () => {
    const action = classifyInput(input.value);
    const file = pendingFile;

    if (action.kind === 'empty' && !file) return;

    input.value = '';
    if (file) clearPendingFile();

    if (action.kind === 'command') {
      chat.setAttribute(
        'data-mode',
        nextDemoMode(chat.getAttribute('data-mode')),
      );
      return;
    }

    const text = action.kind === 'message' ? action.text : '';
    const descriptor: MessageDescriptor = { sender: 'user', text };
    if (file) descriptor.attachment = { name: file.name, type: file.type };

    renderMessage(messages, loading, descriptor);
    sendToWebhook(chat, messages, loading, text, file);
  };

  button.addEventListener('click', handleSubmit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubmit();
  });
}

function buildHeader(chat: Element): HTMLElement {
  const header = document.createElement('div');
  header.className = 'chat-header';

  const logo = document.createElement('img');
  logo.src = logoForTheme(getTheme());
  logo.alt = 'Terp Track logo';
  logo.width = 36;
  logo.height = 36;

  const title = document.createElement('h1');
  title.textContent = 'Terp Track';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'settings-toggle';
  toggle.setAttribute('aria-label', 'Settings');
  toggle.innerHTML = GEAR_SVG;

  toggle.addEventListener('click', () => {
    const open = chat.getAttribute('data-settings') === 'open';
    chat.setAttribute('data-settings', open ? 'closed' : 'open');
    toggle.innerHTML = open ? GEAR_SVG : CLOSE_SVG;
    toggle.setAttribute('aria-label', open ? 'Settings' : 'Close settings');
  });

  header.appendChild(logo);
  header.appendChild(title);
  header.appendChild(toggle);

  return header;
}

function buildSettingsPanel(chat: Element): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'settings-panel';

  // Theme row
  const themeRow = document.createElement('div');
  themeRow.className = 'settings-row';

  const themeLabel = document.createElement('span');
  themeLabel.className = 'settings-label';
  themeLabel.textContent = 'Theme';

  const btnGroup = document.createElement('div');
  btnGroup.className = 'settings-btn-group';

  const lightBtn = document.createElement('button');
  lightBtn.type = 'button';
  lightBtn.textContent = 'Light';
  lightBtn.setAttribute('data-theme-option', 'light');

  const darkBtn = document.createElement('button');
  darkBtn.type = 'button';
  darkBtn.textContent = 'Dark';
  darkBtn.setAttribute('data-theme-option', 'dark');

  const updateActive = () => {
    const current = getTheme();
    lightBtn.classList.toggle('active', current === 'light');
    darkBtn.classList.toggle('active', current === 'dark');
  };

  updateActive();

  lightBtn.addEventListener('click', () => {
    setTheme(chat, 'light');
    updateActive();
  });

  darkBtn.addEventListener('click', () => {
    setTheme(chat, 'dark');
    updateActive();
  });

  btnGroup.appendChild(lightBtn);
  btnGroup.appendChild(darkBtn);
  themeRow.appendChild(themeLabel);
  themeRow.appendChild(btnGroup);

  // Privacy row
  const privacyRow = document.createElement('div');
  privacyRow.className = 'settings-row';

  const privacyLabel = document.createElement('span');
  privacyLabel.className = 'settings-label';
  privacyLabel.textContent = 'Privacy';

  const privacyText = document.createElement('span');
  privacyText.className = 'settings-placeholder';
  privacyText.textContent = 'Coming soon';

  privacyRow.appendChild(privacyLabel);
  privacyRow.appendChild(privacyText);

  // Logout button
  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.className = 'settings-logout';
  logoutBtn.textContent = 'Logout';

  logoutBtn.addEventListener('click', () => {
    clearSession();
    location.reload();
  });

  panel.appendChild(themeRow);
  panel.appendChild(privacyRow);
  panel.appendChild(logoutBtn);

  return panel;
}

function buildMessages(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'chat-messages';
  el.setAttribute('role', 'log');
  el.setAttribute('aria-live', 'polite');
  return el;
}

function buildLoading(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'chat-loading';
  el.setAttribute('aria-label', 'Loading');

  const avatar = document.createElement('img');
  avatar.className = 'message-avatar';
  avatar.src = chatIconUrl;
  avatar.alt = '';
  el.appendChild(avatar);

  const dotsWrapper = document.createElement('div');
  dotsWrapper.className = 'chat-loading-dots';
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('span');
    dot.className = 'chat-loading-dot';
    dotsWrapper.appendChild(dot);
  }
  el.appendChild(dotsWrapper);

  return el;
}

function buildInputArea(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'chat-input-area';

  const filePreviewArea = document.createElement('div');
  filePreviewArea.className = 'file-preview-area';
  filePreviewArea.hidden = true;

  const row = document.createElement('div');
  row.className = 'chat-input-row';

  const uploadBtn = document.createElement('button');
  uploadBtn.type = 'button';
  uploadBtn.className = 'upload-btn';
  uploadBtn.setAttribute('aria-label', 'Attach file');
  uploadBtn.innerHTML = PAPERCLIP_SVG;

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.className = 'file-input-hidden';
  fileInput.accept = FILE_ACCEPT_STRING;
  fileInput.setAttribute('aria-hidden', 'true');
  fileInput.tabIndex = -1;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Type a message…';
  input.setAttribute('aria-label', 'Message input');

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'send-btn';
  button.textContent = 'Send';

  row.appendChild(uploadBtn);
  row.appendChild(fileInput);
  row.appendChild(input);
  row.appendChild(button);

  el.appendChild(filePreviewArea);
  el.appendChild(row);
  return el;
}

function renderFilePreview(
  container: HTMLElement,
  file: File,
  onRemove: () => void,
) {
  container.innerHTML = '';
  container.hidden = false;

  const chip = document.createElement('div');
  chip.className = 'file-chip';

  if (isImageMimeType(file.type)) {
    const thumb = document.createElement('img');
    thumb.className = 'file-chip-thumb';
    thumb.alt = file.name;
    const url = URL.createObjectURL(file);
    thumb.src = url;
    thumb.onload = () => URL.revokeObjectURL(url);
    chip.appendChild(thumb);
  } else {
    const icon = document.createElement('span');
    icon.className = 'file-chip-icon';
    const ext = file.name.split('.').pop()?.toUpperCase() ?? '';
    icon.textContent = ext;
    chip.appendChild(icon);
  }

  const name = document.createElement('span');
  name.className = 'file-chip-name';
  name.textContent = truncateFilename(file.name, 24);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'file-chip-remove';
  removeBtn.setAttribute('aria-label', 'Remove file');
  removeBtn.innerHTML = CLOSE_SVG;
  removeBtn.addEventListener('click', onRemove);

  chip.appendChild(name);
  chip.appendChild(removeBtn);
  container.appendChild(chip);
}

function renderMessage(
  container: HTMLElement,
  loading: HTMLElement,
  descriptor: MessageDescriptor,
) {
  const msg = document.createElement('div');
  msg.className = 'chat-message';
  const attrs = messageAttributes(descriptor);
  for (const [key, value] of Object.entries(attrs)) {
    msg.setAttribute(key, value);
  }

  // Avatar
  if (descriptor.sender === 'bot') {
    const avatar = document.createElement('img');
    avatar.className = 'message-avatar';
    avatar.src = chatIconUrl;
    avatar.alt = '';
    msg.appendChild(avatar);
  }

  // Bubble wrapper
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const textNode = document.createElement('span');
  if (descriptor.sender === 'bot') {
    textNode.innerHTML = formatMessageText(descriptor.text);
  } else {
    textNode.textContent = descriptor.text;
  }
  bubble.appendChild(textNode);

  if (descriptor.items && descriptor.items.length > 0) {
    const list = document.createElement('ul');
    list.className = 'message-item-list';

    for (const item of descriptor.items) {
      const li = document.createElement('li');
      li.className = 'message-item';

      const name = document.createElement('span');
      name.className = 'message-item-name';
      name.textContent = item.name;

      const details = document.createElement('span');
      details.className = 'message-item-details';
      details.textContent = `${item.course} · Due ${item.dueDate} · ${item.status}`;

      li.appendChild(name);
      li.appendChild(details);
      list.appendChild(li);
    }

    bubble.appendChild(list);
  }

  if (descriptor.attachment) {
    const attach = document.createElement('div');
    attach.className = 'message-attachment';
    attach.innerHTML = PAPERCLIP_SVG;
    const fname = document.createElement('span');
    fname.textContent = descriptor.attachment.name;
    attach.appendChild(fname);
    bubble.appendChild(attach);
  }

  msg.appendChild(bubble);

  // User avatar (after bubble)
  if (descriptor.sender === 'user') {
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = PERSON_SVG;
    msg.appendChild(avatar);
  }

  container.insertBefore(msg, loading);
  container.scrollTop = container.scrollHeight;
}

function setLoading(chat: Element, loading: boolean) {
  chat.setAttribute('data-loading', String(loading));
  const sendBtn = chat.querySelector('.send-btn') as HTMLButtonElement;
  if (!sendBtn) return;

  if (loading) {
    sendBtn.disabled = true;
    sendBtn.dataset.originalText = sendBtn.textContent ?? '';
    sendBtn.textContent = '';
    const spinner = document.createElement('span');
    spinner.className = 'send-spinner';
    sendBtn.appendChild(spinner);
  } else {
    sendBtn.disabled = false;
    sendBtn.textContent = sendBtn.dataset.originalText ?? 'Send';
    delete sendBtn.dataset.originalText;
  }
}

async function sendToWebhook(
  chat: Element,
  messages: HTMLElement,
  loading: HTMLElement,
  text: string,
  file: File | null = null,
) {
  setLoading(chat, true);

  try {
    let res: Response;

    if (file) {
      const formData = new FormData();
      formData.append('request', text);
      formData.append('file', file, file.name);
      res = await fetch(WEBHOOK_URL, { method: 'POST', body: formData });
    } else {
      res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildWebhookPayload(text)),
      });
    }

    if (!res.ok) {
      console.error('Webhook returned status:', res.status);
      renderMessage(messages, loading, buildServerErrorMessage());
      return;
    }

    const data: WebhookResponse = await res.json();
    renderMessage(messages, loading, parseWebhookResponse(data));
  } catch (err) {
    console.error('Webhook request failed:', err);

    if (err instanceof TypeError) {
      renderMessage(messages, loading, buildNetworkErrorMessage());
    } else {
      renderMessage(messages, loading, buildServerErrorMessage());
    }
  } finally {
    setLoading(chat, false);
    const input = chat.querySelector(
      '.chat-input-area input[type="text"]',
    ) as HTMLInputElement;
    input?.focus();
  }
}

function showChat() {
  const update = () => {
    document.body.setAttribute('data-page', 'chat');
    init();
  };

  if (document.startViewTransition) {
    document.startViewTransition(update);
  } else {
    update();
  }
}

function bootstrap() {
  if (getSession()) {
    showChat();
  } else {
    initLogin(showChat);
  }
}

document.addEventListener('DOMContentLoaded', bootstrap);
