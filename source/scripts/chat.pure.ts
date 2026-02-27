// File upload constants
export const ACCEPTED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
]);

export const ACCEPTED_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.pdf',
  '.txt',
  '.csv',
]);

export const FILE_ACCEPT_STRING = [...ACCEPTED_MIME_TYPES].join(',');

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// File upload pure functions
export function fileExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

export function isAcceptedFileType(mimeType: string, filename: string): boolean {
  if (ACCEPTED_MIME_TYPES.has(mimeType)) return true;
  return ACCEPTED_EXTENSIONS.has(fileExtension(filename));
}

export function validateFile(
  name: string,
  size: number,
  mimeType: string,
): { valid: true } | { valid: false; reason: string } {
  if (!isAcceptedFileType(mimeType, name)) {
    return { valid: false, reason: 'File type not supported.' };
  }
  if (size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, reason: 'File exceeds 10 MB limit.' };
  }
  return { valid: true };
}

export function truncateFilename(name: string, maxLength: number): string {
  if (name.length <= maxLength) return name;
  const ext = fileExtension(name);
  const base = name.slice(0, name.length - ext.length);
  const truncatedBase = base.slice(0, maxLength - ext.length - 1) + '\u2026';
  return truncatedBase + ext;
}

export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// Types
export interface AttachmentMeta {
  name: string;
  type: string;
}

export interface DataItem {
  name: string;
  dueDate: string;
  status: string;
  course: string;
}

export type MessageSender = 'user' | 'bot';
export type MessageType =
  | 'success'
  | 'error'
  | 'clarification'
  | 'confirmation'
  | 'info';

export interface WebhookResponse {
  success: boolean;
  action: string;
  type: MessageType;
  message: string;
  data?: unknown;
}

export interface WebhookRequest {
  request: string;
}

export interface MessageDescriptor {
  sender: MessageSender;
  type?: MessageType;
  text: string;
  attachment?: AttachmentMeta;
  items?: DataItem[];
}

export type InputAction =
  | { kind: 'empty' }
  | { kind: 'command'; command: string }
  | { kind: 'message'; text: string };

export function classifyInput(raw: string): InputAction {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: 'empty' };
  if (trimmed.toLowerCase() === 'demo mode')
    return { kind: 'command', command: 'demo-mode' };
  return { kind: 'message', text: trimmed };
}

export function nextDemoMode(current: string | null): string {
  return current === 'demo' ? 'default' : 'demo';
}

export function buildWebhookPayload(text: string): WebhookRequest {
  return { request: text };
}

export const DELIVERABLES_QUERY =
  'What deliverables are due today and this week?';

export function buildDeliverablesPayload(): WebhookRequest {
  return { request: DELIVERABLES_QUERY };
}

export function parseWebhookResponse(data: WebhookResponse): MessageDescriptor {
  const descriptor: MessageDescriptor = {
    sender: 'bot',
    type: data.type,
    text: data.message,
  };

  if (
    data.data != null &&
    typeof data.data === 'object' &&
    'items' in data.data &&
    Array.isArray((data.data as Record<string, unknown>).items)
  ) {
    descriptor.items = (data.data as Record<string, unknown>)
      .items as DataItem[];
  }

  return descriptor;
}

export function buildNetworkErrorMessage(): MessageDescriptor {
  return {
    sender: 'bot',
    type: 'error',
    text: 'Unable to reach the server. Please refresh to try again.',
  };
}

export function buildServerErrorMessage(): MessageDescriptor {
  return {
    sender: 'bot',
    type: 'error',
    text: 'Something went wrong on our end. Please contact admin for assistance.',
  };
}

export function buildWelcomeMessage(): MessageDescriptor {
  return {
    sender: 'bot',
    type: 'info',
    text: 'Welcome to Terp Track! Tell me what you need help with — I can create, update, or check on your Trello tasks.',
  };
}

export function messageAttributes(
  descriptor: MessageDescriptor,
): Record<string, string> {
  const attrs: Record<string, string> = { 'data-sender': descriptor.sender };
  if (descriptor.type) attrs['data-type'] = descriptor.type;
  return attrs;
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMessageText(raw: string): string {
  if (!raw) return '';

  let text = escapeHtml(raw);

  // Bold: **text** → <strong>text</strong>
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  // Split on literal \n (escaped newline from JSON) or actual newlines
  const lines = text.split(/\\n|\n/);
  const result: string[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      const items = bulletBuffer
        .map((b) => `<li>${b}</li>`)
        .join('');
      result.push(`<ul>${items}</ul>`);
      bulletBuffer = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const bulletMatch = trimmed.match(/^[•\-]\s*(.*)/);
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1]);
    } else {
      flushBullets();
      result.push(trimmed);
    }
  }
  flushBullets();

  let output = result
    .filter((s) => s.length > 0)
    .join('<br>');

  // URLs → clickable links
  output = output.replace(
    /https?:\/\/[^\s<)]+/g,
    (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
  );

  return output;
}
