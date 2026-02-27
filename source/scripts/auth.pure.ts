export const SESSION_KEY = 'terp-track-session';
export const TTL_MS = 24 * 60 * 60 * 1000;

export interface Session {
  username: string;
  expiresAt: number;
}

export function parseSession(raw: string | null, now: number): Session | null {
  if (!raw) return null;
  try {
    const session: Session = JSON.parse(raw);
    if (now >= session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

export function buildSession(username: string, now: number): Session {
  return { username, expiresAt: now + TTL_MS };
}

export function authenticate(username: string, password: string): boolean {
  return username === 'demo' && password === 'demo';
}
