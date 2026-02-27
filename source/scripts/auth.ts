import {
  SESSION_KEY,
  parseSession,
  buildSession,
  authenticate,
} from './auth.pure';
import type { Session } from './auth.pure';

export type { Session };
export { authenticate };

export function getSession(): Session | null {
  const raw = localStorage.getItem(SESSION_KEY);
  const session = parseSession(raw, Date.now());
  if (!session) {
    clearSession();
    return null;
  }
  return session;
}

export function createSession(username: string): void {
  const session = buildSession(username, Date.now());
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
