import { describe, it, expect } from 'vitest';
import {
  classifyInput,
  nextDemoMode,
  buildWebhookPayload,
  buildDeliverablesPayload,
  parseWebhookResponse,
  buildNetworkErrorMessage,
  buildServerErrorMessage,
  buildWelcomeMessage,
  messageAttributes,
  fileExtension,
  isAcceptedFileType,
  validateFile,
  truncateFilename,
  isImageMimeType,
  escapeHtml,
  formatMessageText,
  MAX_FILE_SIZE_BYTES,
} from './chat.pure';
import type {
  WebhookResponse,
  MessageDescriptor,
  DataItem,
} from './chat.pure';

describe('classifyInput', () => {
  it('returns empty for blank string', () => {
    expect(classifyInput('')).toEqual({ kind: 'empty' });
  });

  it('returns empty for whitespace-only', () => {
    expect(classifyInput('   ')).toEqual({ kind: 'empty' });
  });

  it('returns command for "demo mode"', () => {
    expect(classifyInput('demo mode')).toEqual({
      kind: 'command',
      command: 'demo-mode',
    });
  });

  it('is case-insensitive for demo mode', () => {
    expect(classifyInput('Demo Mode')).toEqual({
      kind: 'command',
      command: 'demo-mode',
    });
  });

  it('returns message for regular text', () => {
    expect(classifyInput('create a task')).toEqual({
      kind: 'message',
      text: 'create a task',
    });
  });

  it('trims message text', () => {
    expect(classifyInput('  hello  ')).toEqual({
      kind: 'message',
      text: 'hello',
    });
  });
});

describe('nextDemoMode', () => {
  it('returns default when current is demo', () => {
    expect(nextDemoMode('demo')).toBe('default');
  });

  it('returns demo when current is default', () => {
    expect(nextDemoMode('default')).toBe('demo');
  });

  it('returns demo when current is null', () => {
    expect(nextDemoMode(null)).toBe('demo');
  });
});

describe('buildWebhookPayload', () => {
  it('wraps text in request field', () => {
    expect(buildWebhookPayload('hello')).toEqual({ request: 'hello' });
  });
});

describe('buildDeliverablesPayload', () => {
  it('returns request with deliverables query', () => {
    const payload = buildDeliverablesPayload();
    expect(payload.request).toBe(
      'What deliverables are due today and this week?',
    );
  });
});

describe('parseWebhookResponse', () => {
  it('extracts sender, type, and message', () => {
    const data: WebhookResponse = {
      success: true,
      action: 'create',
      type: 'success',
      message: 'Task created',
    };
    expect(parseWebhookResponse(data)).toEqual({
      sender: 'bot',
      type: 'success',
      text: 'Task created',
    });
  });

  it('extracts items from data.items', () => {
    const items: DataItem[] = [
      {
        name: 'Project Report',
        dueDate: '2026-02-28',
        status: 'In Progress',
        course: 'INST 762',
      },
      {
        name: 'Final Essay',
        dueDate: '2026-03-05',
        status: 'Not Started',
        course: 'INST 741',
      },
    ];
    const data: WebhookResponse = {
      success: true,
      action: 'list_deliverables',
      type: 'success',
      message: 'Here are your deliverables:',
      data: { items },
    };
    const result = parseWebhookResponse(data);
    expect(result.items).toHaveLength(2);
    expect(result.items![0]).toEqual(items[0]);
  });

  it('omits items when data is absent', () => {
    const data: WebhookResponse = {
      success: true,
      action: 'create',
      type: 'success',
      message: 'Done',
    };
    expect(parseWebhookResponse(data).items).toBeUndefined();
  });

  it('omits items when data has no items key', () => {
    const data: WebhookResponse = {
      success: true,
      action: 'create',
      type: 'success',
      message: 'Done',
      data: { something: 'else' },
    };
    expect(parseWebhookResponse(data).items).toBeUndefined();
  });

  it('omits items when data.items is not an array', () => {
    const data: WebhookResponse = {
      success: true,
      action: 'create',
      type: 'success',
      message: 'Done',
      data: { items: 'string' },
    };
    expect(parseWebhookResponse(data).items).toBeUndefined();
  });
});

describe('buildNetworkErrorMessage', () => {
  it('returns bot error with refresh guidance', () => {
    const msg = buildNetworkErrorMessage();
    expect(msg.sender).toBe('bot');
    expect(msg.type).toBe('error');
    expect(msg.text).toContain('refresh to try again');
  });
});

describe('buildServerErrorMessage', () => {
  it('returns bot error with contact admin guidance', () => {
    const msg = buildServerErrorMessage();
    expect(msg.sender).toBe('bot');
    expect(msg.type).toBe('error');
    expect(msg.text).toContain('contact admin');
  });
});

describe('buildWelcomeMessage', () => {
  it('returns bot info descriptor', () => {
    const msg = buildWelcomeMessage();
    expect(msg.sender).toBe('bot');
    expect(msg.type).toBe('info');
    expect(msg.text).toContain('Welcome to Terp Track');
  });
});

describe('messageAttributes', () => {
  it('includes data-sender', () => {
    const desc: MessageDescriptor = { sender: 'user', text: 'hi' };
    expect(messageAttributes(desc)).toEqual({ 'data-sender': 'user' });
  });

  it('includes data-type when present', () => {
    const desc: MessageDescriptor = {
      sender: 'bot',
      type: 'error',
      text: 'oops',
    };
    expect(messageAttributes(desc)).toEqual({
      'data-sender': 'bot',
      'data-type': 'error',
    });
  });
});

describe('fileExtension', () => {
  it('extracts lowercase extension', () => {
    expect(fileExtension('photo.PNG')).toBe('.png');
  });

  it('returns empty string for no extension', () => {
    expect(fileExtension('README')).toBe('');
  });

  it('handles multiple dots', () => {
    expect(fileExtension('archive.tar.gz')).toBe('.gz');
  });
});

describe('isAcceptedFileType', () => {
  it('accepts valid MIME type', () => {
    expect(isAcceptedFileType('image/png', 'photo.png')).toBe(true);
  });

  it('falls back to extension when MIME is unknown', () => {
    expect(isAcceptedFileType('application/octet-stream', 'doc.pdf')).toBe(
      true,
    );
  });

  it('rejects unknown MIME and extension', () => {
    expect(isAcceptedFileType('application/zip', 'archive.zip')).toBe(false);
  });
});

describe('validateFile', () => {
  it('returns valid for accepted type under size limit', () => {
    expect(validateFile('photo.png', 1024, 'image/png')).toEqual({
      valid: true,
    });
  });

  it('rejects unsupported file type', () => {
    const result = validateFile('app.exe', 1024, 'application/x-msdownload');
    expect(result).toEqual({
      valid: false,
      reason: 'File type not supported.',
    });
  });

  it('rejects file exceeding size limit', () => {
    const result = validateFile(
      'big.png',
      MAX_FILE_SIZE_BYTES + 1,
      'image/png',
    );
    expect(result).toEqual({
      valid: false,
      reason: 'File exceeds 10 MB limit.',
    });
  });
});

describe('truncateFilename', () => {
  it('returns short name unchanged', () => {
    expect(truncateFilename('hi.txt', 20)).toBe('hi.txt');
  });

  it('truncates long name preserving extension', () => {
    const result = truncateFilename('very-long-filename.pdf', 12);
    expect(result).toBe('very-lo\u2026.pdf');
    expect(result.length).toBeLessThanOrEqual(12);
  });

  it('handles name with no extension', () => {
    const result = truncateFilename('abcdefghijklmnop', 8);
    expect(result).toBe('abcdefg\u2026');
    expect(result.length).toBeLessThanOrEqual(8);
  });
});

describe('isImageMimeType', () => {
  it('returns true for image types', () => {
    expect(isImageMimeType('image/png')).toBe(true);
    expect(isImageMimeType('image/jpeg')).toBe(true);
  });

  it('returns false for non-image types', () => {
    expect(isImageMimeType('application/pdf')).toBe(false);
    expect(isImageMimeType('text/plain')).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<div>hi</div>')).toBe('&lt;div&gt;hi&lt;/div&gt;');
  });

  it('escapes quotes', () => {
    expect(escapeHtml('"hello" & \'world\'')).toBe(
      '&quot;hello&quot; &amp; &#39;world&#39;',
    );
  });

  it('passes through plain text unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });
});

describe('formatMessageText', () => {
  it('returns empty string for empty input', () => {
    expect(formatMessageText('')).toBe('');
  });

  it('converts **bold** to strong tags', () => {
    expect(formatMessageText('**Hello**')).toBe('<strong>Hello</strong>');
  });

  it('handles multiple bold segments', () => {
    expect(formatMessageText('**A** and **B**')).toBe(
      '<strong>A</strong> and <strong>B</strong>',
    );
  });

  it('converts newlines to <br>', () => {
    expect(formatMessageText('line1\\nline2')).toBe('line1<br>line2');
  });

  it('converts bullet lines into ul/li', () => {
    const input = '• Item one\\n• Item two';
    const output = formatMessageText(input);
    expect(output).toContain('<ul>');
    expect(output).toContain('<li>Item one</li>');
    expect(output).toContain('<li>Item two</li>');
    expect(output).toContain('</ul>');
  });

  it('converts dash bullet lines into ul/li', () => {
    const input = '- First\\n- Second';
    const output = formatMessageText(input);
    expect(output).toContain('<ul>');
    expect(output).toContain('<li>First</li>');
    expect(output).toContain('<li>Second</li>');
  });

  it('groups consecutive bullets in single ul', () => {
    const input = 'Header\\n• A\\n• B\\nFooter';
    const output = formatMessageText(input);
    const ulCount = (output.match(/<ul>/g) || []).length;
    expect(ulCount).toBe(1);
    expect(output).toContain('Header<br>');
    expect(output).toContain('<br>Footer');
  });

  it('creates separate lists for non-consecutive bullet groups', () => {
    const input = '• A\\nMiddle\\n• B';
    const output = formatMessageText(input);
    const ulCount = (output.match(/<ul>/g) || []).length;
    expect(ulCount).toBe(2);
  });

  it('converts URLs to anchor tags', () => {
    const input = 'Visit https://example.com for more';
    const output = formatMessageText(input);
    expect(output).toContain(
      '<a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>',
    );
  });

  it('escapes HTML to prevent XSS', () => {
    const input = '<script>alert("xss")</script>';
    const output = formatMessageText(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('&lt;script&gt;');
  });

  it('handles real webhook response format', () => {
    const input =
      '**Task Update**\\n\\nYour task has been updated:\\n• Status changed to In Progress\\n• Due date set to 2026-03-01\\n\\nView it at https://trello.com/c/abc123';
    const output = formatMessageText(input);
    expect(output).toContain('<strong>Task Update</strong>');
    expect(output).toContain('<ul>');
    expect(output).toContain('<li>Status changed to In Progress</li>');
    expect(output).toContain(
      '<a href="https://trello.com/c/abc123" target="_blank"',
    );
  });
});
