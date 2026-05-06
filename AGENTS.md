# AI Coding Agent Instructions

## Project Overview

This is a **local AI chat application** that supports **two local inference backends**:

- **Ollama** (native Ollama API + capability enrichment)
- **oMLX** (OpenAI-compatible API)

It provides three interfaces for interacting with local models:

- **Chat** (`/`) - multi-turn chat with history, image attachments, markdown/code rendering, and per-chat model selection
- **Arena** (`/arena`) - model comparison view; the same prompt is sent to selected models
- **Voice** (`/voice`) - real-time voice call using Web Speech API (STT + TTS) with optional screen share for vision-capable models

Provider selection is **global** and is controlled from **one place**: the left sidebar footer (above theme toggle).

## Core Architecture

### Technology Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19.2** with **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`)
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`) - `useChat` hook + streaming server helpers
- **ai-sdk-ollama** - Ollama provider integration
- **@ai-sdk/openai-compatible** - oMLX integration through OpenAI-compatible endpoints
- **SQLite** + **Drizzle ORM** - local persistence for chats and preferences
- **Tailwind CSS v4** with OKLCH color system and CSS variables
- **shadcn/ui** ("new-york" style) component library
- **TypeScript** with strict mode
- **Bun** as package manager
- **marked** + **shiki** for markdown and syntax-highlighted code rendering

### Key Configuration Files

- `components.json` - shadcn/ui config with path aliases
- `drizzle.config.ts` - Drizzle Kit configuration for the local SQLite database
- `next.config.ts` - React Compiler enabled, `better-sqlite3` externalized for server runtime
- `tsconfig.json` - path alias `@/*` -> `./src/*`
- `.prettierrc` - import organization + Tailwind class sorting, 120 char line width, single quotes
- `.env` - `OMLX_API_KEY` and optional `OMLX_BASE_URL`

## Project Structure

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── arena/
│   │   └── page.tsx
│   ├── voice/
│   │   └── page.tsx
│   ├── api/chat/route.ts
│   ├── api/generate/route.ts
│   ├── api/models/route.ts
│   ├── api/voice/route.ts
│   ├── api/chat-state/route.ts
│   ├── api/chats/[chatId]/route.ts
│   ├── api/preferences/model/route.ts
│   ├── api/preferences/provider/route.ts
│   └── api/ollama/             # legacy compatibility routes
├── components/
│   ├── ui/
│   ├── chat-input.tsx
│   ├── chat-message.tsx
│   ├── chat-sidebar.tsx
│   ├── provider-selector.tsx
│   ├── model-selector.tsx
│   ├── arena-*.tsx
│   ├── code-block.tsx
│   ├── copy-button.tsx
│   ├── mode-toggle.tsx
│   └── theme-provider.tsx
├── hooks/
│   ├── use-local-models.ts
│   ├── use-selected-provider.ts
│   ├── use-ollama-models.ts    # compatibility wrapper
│   ├── use-speech.ts
│   └── use-mobile.ts
└── lib/
    ├── ai.ts
    ├── arena.ts
    ├── chat-api.ts
    ├── chat-store.ts
    ├── local-ai.ts
    ├── model-provider.ts
    ├── db/
    │   ├── index.ts
    │   └── schema.ts
    └── utils.ts
```

## API Routes

### Canonical Provider-Aware Routes

### `POST /api/chat`

Streams multi-turn chat via `streamText` + `toUIMessageStreamResponse`.
Accepts `{ provider, model, messages, supportsThinking }`.

### `POST /api/generate`

Single-shot streaming generation for Arena.
Accepts `{ provider, model, prompt, mode, supportsThinking }`.

### `GET /api/models`

Lists models for selected provider (`?provider=ollama|omlx`) and normalizes model metadata:

- `supportsVision`
- `supportsThinking`
- `details.parameter_size`
- `size`

For oMLX, the route combines `/v1/models` + `/v1/models/status` so size and thinking defaults are accurate.

### `POST /api/voice`

Streams voice response as plain text (`toTextStreamResponse`).
Accepts `{ provider, model, messages }`.

### State & Preferences

- `GET /api/chat-state` returns chats + `selectedModel` + `selectedProvider`
- `PUT /DELETE /api/chats/[chatId]` upserts/deletes chat rows
- `PUT /api/preferences/model` persists selected model
- `GET|PUT /api/preferences/provider` reads/writes global provider

### Legacy Compatibility Routes

`/api/ollama/*` routes remain in the codebase for compatibility, but UI uses canonical `/api/*` routes.

## Key Patterns

### Provider Selection

- Provider is global (`ollama` or `omlx`).
- UI control lives only in sidebar footer in `chat-sidebar.tsx`.
- State is persisted in SQLite preference key `selected-provider`.

### Model Loading

- Use `useLocalModels(provider)` for model lists.
- `useOllamaModels()` exists only as a compatibility wrapper; do not build new features on it.

### Provider Resolution

- `src/lib/local-ai.ts` contains provider types/constants.
- `src/lib/model-provider.ts` maps `{ provider, model }` to a language model instance.
  - Ollama: `createOllama()`
  - oMLX: `createOpenAICompatible({ baseURL, apiKey })`

### Image / Vision Messages

Images are passed as `{ type: 'file', url: dataUrl, mediaType: 'image/jpeg' }` parts.
`convertToModelMessages` handles conversion for both providers.

### Chat Persistence

Chat history + selected model + selected provider are stored in SQLite at `data/app.db`.
Keep persistence logic centralized in `src/lib/chat-store.ts` and `src/lib/db/`.

### Voice Architecture

`src/app/voice/page.tsx` is a single client component managing:

- `SpeechRecognition` continuous mode (submits after 1500 ms silence)
- TTS queue via `SpeechSynthesisUtterance` with sentence-level streaming
- Optional screen share via `getDisplayMedia`
- `useRef`-based async state to avoid stale closures

## Development Workflows

### Running the Project

```bash
bun run dev         # Development server (localhost:3000)
bun run build       # Production build
bun run start       # Production server
bun run lint        # ESLint check
bun run format      # Prettier auto-format
bun run deps        # Interactive dependency updates
bun run db:generate # Generate Drizzle migrations
bun run db:migrate  # Apply Drizzle migrations
bun run db:studio   # Open Drizzle Studio
```

### Local Backend Requirements

- Ollama: run `ollama serve` and pull at least one model
- oMLX: run server and set `OMLX_API_KEY` (required in this setup)
- Optional: set `OMLX_BASE_URL` (default `http://localhost:8000/v1`)

SQLite DB is auto-created at `data/app.db`.

### Adding shadcn/ui Components

```bash
bun run shadcn add <component>
# or: bun x --bun shadcn@latest add <component>
```

Components install to `src/components/ui/`. Never edit them directly.

## Styling Conventions

- Tailwind utility classes only (no inline styles or raw CSS)
- CSS variable tokens only (no hex/rgb)
- Dark mode via `.dark` + `dark:*`
- Merge classes with `cn()` from `@/lib/utils`
- 120 char line width, single quotes, Tailwind class sort via Prettier

## What to Avoid

- **Don't** add `'use client'` unnecessarily in server files
- **Don't** modify `src/components/ui/` directly
- **Don't** use hex/rgb colors
- **Don't** use `npm install`; use `bun add`
- **Don't** duplicate model-loading logic; use `useLocalModels`
- **Don't** bypass `src/lib/chat-store.ts` or `src/lib/db/` for persistence
- **Don't** add new provider-specific frontend paths when unified `/api/*` routes already cover the use case
- **Don't** skip formatting/linting before commit
