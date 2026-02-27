import { authenticate } from './auth.pure';

export interface LoginFormInput {
  username: string;
  password: string;
  remember: boolean;
}

export type LoginResult =
  | { success: true; username: string; shouldPersist: boolean }
  | { success: false };

export function evaluateLogin(input: LoginFormInput): LoginResult {
  const username = input.username.trim();
  if (!authenticate(username, input.password)) {
    return { success: false };
  }
  return { success: true, username, shouldPersist: input.remember };
}
