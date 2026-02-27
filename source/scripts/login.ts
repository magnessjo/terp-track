import '../styles/terp-login.css';
import { createSession } from './auth';
import { evaluateLogin } from './login.pure';

const GOOGLE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>`;

const APPLE_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="#fff"/></svg>`;

export function initLogin(onSuccess: () => void): void {
  const login = document.querySelector('terp-login');
  if (!login) return;

  login.setAttribute('data-tab', 'password');

  const card = document.createElement('div');
  card.className = 'login-card';

  const heading = document.createElement('h1');
  heading.className = 'login-heading';
  heading.textContent = 'Welcome back';

  const subtitle = document.createElement('p');
  subtitle.className = 'login-subtitle';
  subtitle.textContent = 'Sign in to continue to Terp Track';

  const social = buildSocial();
  const divider = buildDivider();
  const tabs = buildTabs(login);
  const passwordPanel = buildPasswordPanel(onSuccess);
  const magicPanel = buildMagicLinkPanel();
  const footer = buildFooter();

  card.appendChild(heading);
  card.appendChild(subtitle);
  card.appendChild(social);
  card.appendChild(divider);
  card.appendChild(tabs);
  card.appendChild(passwordPanel);
  card.appendChild(magicPanel);
  card.appendChild(footer);

  login.appendChild(card);
}

function buildSocial(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'login-social';

  const google = document.createElement('button');
  google.type = 'button';
  google.className = 'login-social-btn';
  google.innerHTML = `${GOOGLE_ICON} Google`;

  const apple = document.createElement('button');
  apple.type = 'button';
  apple.className = 'login-social-btn';
  apple.innerHTML = `${APPLE_ICON} Apple`;

  wrapper.appendChild(google);
  wrapper.appendChild(apple);
  return wrapper;
}

function buildDivider(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'login-divider';
  el.textContent = 'or continue with email';
  return el;
}

function buildTabs(login: Element): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'login-tabs';

  const passwordTab = document.createElement('button');
  passwordTab.type = 'button';
  passwordTab.className = 'login-tab';
  passwordTab.setAttribute('data-tab-target', 'password');
  passwordTab.textContent = 'Password';

  const magicTab = document.createElement('button');
  magicTab.type = 'button';
  magicTab.className = 'login-tab';
  magicTab.setAttribute('data-tab-target', 'magic-link');
  magicTab.textContent = 'Magic Link';

  wrapper.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-tab-target]');
    if (!target) return;
    const tab = target.getAttribute('data-tab-target');
    if (tab) login.setAttribute('data-tab', tab);
  });

  wrapper.appendChild(passwordTab);
  wrapper.appendChild(magicTab);
  return wrapper;
}

function buildPasswordPanel(onSuccess: () => void): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'login-panel';
  panel.setAttribute('data-panel', 'password');

  const usernameLabel = document.createElement('label');
  usernameLabel.textContent = 'Username';
  const usernameInput = document.createElement('input');
  usernameInput.type = 'text';
  usernameInput.placeholder = 'Enter your username';
  usernameInput.autocomplete = 'username';
  usernameLabel.setAttribute('for', 'login-username');
  usernameInput.id = 'login-username';

  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.placeholder = 'Enter your password';
  passwordInput.autocomplete = 'current-password';
  passwordLabel.setAttribute('for', 'login-password');
  passwordInput.id = 'login-password';

  const rememberLabel = document.createElement('label');
  rememberLabel.className = 'login-remember';
  const rememberCheckbox = document.createElement('input');
  rememberCheckbox.type = 'checkbox';
  rememberCheckbox.checked = true;
  rememberLabel.appendChild(rememberCheckbox);
  rememberLabel.appendChild(
    document.createTextNode('Remember me for 24 hours'),
  );

  const error = document.createElement('p');
  error.className = 'login-error';
  error.setAttribute('role', 'alert');
  error.textContent = 'Invalid username or password';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'login-submit';
  submit.textContent = 'Sign in';

  const handleSubmit = () => {
    const result = evaluateLogin({
      username: usernameInput.value,
      password: passwordInput.value,
      remember: rememberCheckbox.checked,
    });

    if (result.success) {
      error.setAttribute('data-visible', 'false');
      if (result.shouldPersist) {
        createSession(result.username);
      }
      onSuccess();
    } else {
      error.setAttribute('data-visible', 'true');
    }
  };

  submit.addEventListener('click', handleSubmit);
  usernameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubmit();
  });
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSubmit();
  });

  panel.appendChild(usernameLabel);
  panel.appendChild(usernameInput);
  panel.appendChild(passwordLabel);
  panel.appendChild(passwordInput);
  panel.appendChild(rememberLabel);
  panel.appendChild(error);
  panel.appendChild(submit);
  return panel;
}

function buildMagicLinkPanel(): HTMLElement {
  const panel = document.createElement('div');
  panel.className = 'login-panel';
  panel.setAttribute('data-panel', 'magic-link');

  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email address';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.placeholder = 'you@example.com';
  emailInput.autocomplete = 'email';
  emailLabel.setAttribute('for', 'login-email');
  emailInput.id = 'login-email';

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'login-submit';
  submit.textContent = 'Send magic link';

  panel.appendChild(emailLabel);
  panel.appendChild(emailInput);
  panel.appendChild(submit);
  return panel;
}

function buildFooter(): HTMLElement {
  const el = document.createElement('p');
  el.className = 'login-footer';
  el.innerHTML = 'Don\'t have an account? <a href="#">Create one</a>';
  return el;
}
