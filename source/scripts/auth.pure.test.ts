import { describe, it, expect } from 'vitest';
import {
  parseSession,
  buildSession,
  authenticate,
  SESSION_KEY,
  TTL_MS,
} from './auth.pure';

describe('parseSession', () => {
  const now = 1000000;

  it('returns null for null input', () => {
    expect(parseSession(null, now)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseSession('', now)).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseSession('not-json', now)).toBeNull();
  });

  it('returns null for expired session', () => {
    const raw = JSON.stringify({ username: 'demo', expiresAt: now - 1 });
    expect(parseSession(raw, now)).toBeNull();
  });

  it('returns null when now equals expiresAt (boundary)', () => {
    const raw = JSON.stringify({ username: 'demo', expiresAt: now });
    expect(parseSession(raw, now)).toBeNull();
  });

  it('returns session when not expired', () => {
    const session = { username: 'demo', expiresAt: now + 1000 };
    const raw = JSON.stringify(session);
    expect(parseSession(raw, now)).toEqual(session);
  });
});

describe('buildSession', () => {
  it('creates session with correct username and TTL', () => {
    const now = 5000;
    const session = buildSession('demo', now);
    expect(session.username).toBe('demo');
    expect(session.expiresAt).toBe(now + TTL_MS);
  });
});

describe('authenticate', () => {
  it('returns true for valid credentials', () => {
    expect(authenticate('demo', 'demo')).toBe(true);
  });

  it('returns false for wrong username', () => {
    expect(authenticate('admin', 'demo')).toBe(false);
  });

  it('returns false for wrong password', () => {
    expect(authenticate('demo', 'wrong')).toBe(false);
  });

  it('returns false for empty credentials', () => {
    expect(authenticate('', '')).toBe(false);
  });
});

describe('constants', () => {
  it('SESSION_KEY is defined', () => {
    expect(SESSION_KEY).toBe('terp-track-session');
  });

  it('TTL_MS is 24 hours', () => {
    expect(TTL_MS).toBe(86400000);
  });
});
