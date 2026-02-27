import { describe, it, expect } from 'vitest';
import { evaluateLogin } from './login.pure';

describe('evaluateLogin', () => {
  it('returns success with shouldPersist when remember is true', () => {
    const result = evaluateLogin({
      username: 'demo',
      password: 'demo',
      remember: true,
    });
    expect(result).toEqual({
      success: true,
      username: 'demo',
      shouldPersist: true,
    });
  });

  it('returns success without persist when remember is false', () => {
    const result = evaluateLogin({
      username: 'demo',
      password: 'demo',
      remember: false,
    });
    expect(result).toEqual({
      success: true,
      username: 'demo',
      shouldPersist: false,
    });
  });

  it('trims whitespace from username', () => {
    const result = evaluateLogin({
      username: '  demo  ',
      password: 'demo',
      remember: true,
    });
    expect(result).toEqual({
      success: true,
      username: 'demo',
      shouldPersist: true,
    });
  });

  it('returns failure for wrong credentials', () => {
    const result = evaluateLogin({
      username: 'demo',
      password: 'wrong',
      remember: true,
    });
    expect(result).toEqual({ success: false });
  });

  it('returns failure for empty fields', () => {
    const result = evaluateLogin({
      username: '',
      password: '',
      remember: false,
    });
    expect(result).toEqual({ success: false });
  });

  it('returns failure when username is only whitespace', () => {
    const result = evaluateLogin({
      username: '   ',
      password: 'demo',
      remember: true,
    });
    expect(result).toEqual({ success: false });
  });
});
