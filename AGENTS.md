# AI Coding Agent Instructions

## Project Overview

This is a **local AI chat application** powered by [Ollama](https://ollama.com). It provides three interfaces for interacting with locally-running LLMs:

- **Chat** (`/`) - multi-turn chat with history, image attachments, markdown/code rendering, and per-chat model selection
- **Arena** (`/arena`) - side-by-side model comparison; the same prompt is sent to two models simultaneously
- **Voice** (`/voice`) - real-time voice call using Web Speech API (STT + TTS) with optional screen share for vision-capable models

## Core Architecture

### Technology Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19.2** with **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`)
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`) - `useChat` hook on the client
- **ai-sdk-ollama** ([repo](https://github.com/jagreehal/ai-sdk-ollama)) - Ollama provider for the AI SDK; also provides `streamText` and `createOllama`
- **SQLite** + **Drizzle ORM** - local persistence for chats and user preferences
- **Tailwind CSS v4** with OKLCH color system and CSS variables
- **shadcn/ui** ("new-york" style) component library
- **TypeScript** with strict mode
- **Bun** as package manager
- **marked** + **shiki** for markdown and syntax-highlighted code rendering

### Key Configuration Files

- `components.json` - shadcn/ui config with path aliases
- `drizzle.config.ts` - Drizzle Kit configuration for the local SQLite database
- `next.config.ts` - React Compiler enabled, `better-sqlite3` externalized for the server runtime
- `tsconfig.json` - path alias `@/*` -> `./src/*`
- `.prettierrc` - import organization + Tailwind class sorting, 120 char line width, single quotes

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
│   ├── api/chat-state/route.ts
│   ├── api/chats/[chatId]/route.ts
│   ├── api/preferences/model/route.ts
│   └── api/ollama/
│       ├── chat/route.ts
│       ├── generate/route.ts
│       ├── models/route.ts
│       └── voice/route.ts
├── components/
│   ├── ui/
│   ├── chat-input.tsx
│   ├── chat-message.tsx
│   ├── chat-sidebar.tsx
│   ├── model-selector.tsx
│   ├── arena-*.tsx
│   ├── code-block.tsx
│   ├── copy-button.tsx
│   ├── mode-toggle.tsx
│   └── theme-provider.tsx
├── hooks/
│   ├── use-ollama-models.ts
│   ├── use-speech.ts
│   └── use-mobile.ts
└── lib/
    ├── ai.ts
    ├── arena.ts
    ├── chat-api.ts
    ├── chat-store.ts
    ├── db/
    │   ├── index.ts
    │   └── schema.ts
    └── utils.ts
```

## API Routes

### `POST /api/ollama/chat`

Streams multi-turn chat via `streamText` + `toUIMessageStreamResponse`. Accepts `{ model, messages, supportsThinking }`. Supports vision via `file` parts in messages.

### `POST /api/ollama/generate`

Single-shot generation for the arena. Accepts `{ model, prompt, system }`, returns a plain text stream.

### `GET /api/ollama/models`

Fetches all local Ollama models, enriches each with `supportsVision` and `supportsThinking` flags via the Ollama `/api/show` endpoint.

### `POST /api/ollama/voice`

Streams a voice response as plain text (`toTextStreamResponse`). Uses a conversation-optimized system prompt. Accepts `{ model, messages }`, where messages may include `file` parts (screen-share screenshots).

### `GET /api/chat-state`

Returns the persisted chats and globally selected model from SQLite for the chat page bootstrap.

### `PUT` / `DELETE /api/chats/[chatId]`

Upserts or deletes a chat record in SQLite. Chats store the full `UIMessage[]` payload as JSON.

### `PUT /api/preferences/model`

Persists the globally selected model in SQLite.

## Key Patterns

### Model Capability Detection

`OllamaModel` (from `use-ollama-models.ts`) exposes `supportsVision?: boolean` and `supportsThinking?: boolean`. Always check these before enabling vision UI or thinking mode.

### Image / Vision Messages

Images are passed as `{ type: 'file', url: dataUrl, mediaType: 'image/jpeg' }` parts alongside `text` parts in a `UIMessage`. `convertToModelMessages` from the AI SDK converts these for Ollama automatically.

### Chat Persistence

Chat history and the selected model are stored in SQLite at `data/app.db`. Keep persistence logic centralized in `src/lib/chat-store.ts` and `src/lib/db/`.

### Voice Architecture

`src/app/voice/page.tsx` is a single client component managing:

- `SpeechRecognition` in continuous mode - submits after 1500 ms of silence
- TTS queue via `SpeechSynthesisUtterance` with sentence-level streaming
- Screen share via `getDisplayMedia` - screenshot captured on the first spoken word, attached as a vision part
- Async state in `useRef` to avoid stale closures in event callbacks

### Streaming in Voice

The voice route returns `toTextStreamResponse()` (plain text, not a UI message stream). The page reads chunks and feeds a sentence buffer into the TTS queue for low-latency speech output.

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

**Ollama must be running locally** (`ollama serve`) with at least one model pulled.

**SQLite DB is auto-created** at `data/app.db` when the app or persistence routes run.

### Adding shadcn/ui Components

```bash
bun run shadcn add <component>
# or: bun x --bun shadcn@latest add <component>
```

Components install to `src/components/ui/`. Never edit them directly.

## Styling Conventions

- Tailwind utility classes exclusively - no inline styles or raw CSS
- CSS variable tokens only, no hex/rgb (e.g. `bg-background`, `text-foreground`, `text-muted-foreground`)
- Dark mode via `.dark` class + `dark:*` utilities
- Merge classes with `cn()` from `@/lib/utils`
- 120 char line width, single quotes, Tailwind classes auto-sorted by Prettier

## What to Avoid

- **Don't** add `'use client'` unnecessarily - API routes and utility files are server-only
- **Don't** modify `src/components/ui/` directly - extend in custom components
- **Don't** use hex/rgb colors - use CSS variable tokens
- **Don't** use `npm install` - use `bun add`
- **Don't** duplicate model-fetching logic - always use the `useOllamaModels` hook
- **Don't** add new Ollama API routes outside `/api/ollama/` to keep the proxy layer consistent
- **Don't** bypass `src/lib/chat-store.ts` or `src/lib/db/` for chat persistence - keep SQLite access centralized
- **Don't** skip formatting - run `bun run format` before committing
