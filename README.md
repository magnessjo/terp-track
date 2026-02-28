# Terp Track

Chatbot UI for managing Trello tasks via n8n webhook.

## Tech Stack

- **Language**: Vanilla TypeScript (strict, ES2020)
- **Styles**: PostCSS with nesting, custom properties, `postcss-preset-env`
- **Build**: Vite 6
- **Testing**: Vitest
- **Formatting**: Prettier (singleQuote, trailingComma: all)

## Commands

- `npm start` — Dev server on port 3000
- `npm run build` — Production build to `dist/`
- `npm test` — Run tests in watch mode
- `npm run test:run` — Run tests once
- `npm run format` — Prettier on source files

## Architecture

Single custom HTML element `<terp-chat>` built with vanilla DOM manipulation. State managed via data attributes:

- `data-mode="default|demo"` — layout sizing
- `data-loading="true|false"` — loading state
- `data-theme="light|dark"` — color theme
- `data-settings="open|closed"` — settings panel visibility

## Webhook

- **Method**: POST
- **Body**: `{ "request": "user input text" }`
- **Response**: `{ success, action, type, message, data }`

## File Structure

```
source/
├── index.html              # HTML shell with <terp-chat> element
├── scripts/
│   └── index.ts            # Component logic, DOM, events, webhook
└── styles/
    ├── tokens.css           # CSS custom properties (design tokens)
    └── terp-chat.css        # Component styles
```
