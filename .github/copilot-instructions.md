# AI Coding Agent Instructions

## Project Overview

This is a **local AI chat application** powered by [Ollama](https://ollama.com). It provides three interfaces for interacting with locally-running LLMs:

- **Chat** (`/`) — multi-turn chat with history, image attachments, markdown/code rendering, and per-chat model selection
- **Arena** (`/arena`) — side-by-side model comparison; same prompt sent to two models simultaneously
- **Voice** (`/voice`) — real-time voice call using Web Speech API (STT + TTS) with optional screen share for vision-capable models

## Core Architecture

### Technology Stack

- **Next.js 16** with App Router (`src/app/`)
- **React 19.2** with **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`)
- **Vercel AI SDK** (`ai`, `@ai-sdk/react`) — `useChat` hook on the client
- **ai-sdk-ollama** — Ollama provider for the AI SDK; also provides `streamText` and `createOllama` (used in all API routes instead of the base AI SDK's `streamText` for better Ollama compatibility)
- **Tailwind CSS v4** with OKLCH color system and CSS variables
- **shadcn/ui** ("new-york" style) component library
- **TypeScript** with strict mode
- **Bun** as package manager
- **marked** + **shiki** for markdown and syntax-highlighted code rendering

### Key Configuration Files

- `components.json` — shadcn/ui config with path aliases
- `next.config.ts` — React Compiler enabled
- `tsconfig.json` — path alias `@/*` → `./src/*`
- `.prettierrc` — import organization + Tailwind class sorting, 120 char line width, single quotes

## Project Structure

```
src/
├── app/
│   ├── globals.css          # Tailwind v4 + theme CSS variables
│   ├── layout.tsx           # Root layout with ThemeProvider
│   ├── page.tsx             # Chat interface (client component)
│   ├── arena/
│   │   └── page.tsx         # Model arena (client component)
│   ├── voice/
│   │   └── page.tsx         # Voice call interface (client component)
│   └── api/ollama/
│       ├── chat/route.ts    # Streaming chat endpoint
│       ├── generate/route.ts # Single-shot generation (arena)
│       ├── models/route.ts  # Model list + capability detection
│       └── voice/route.ts   # Voice streaming endpoint
├── components/
│   ├── ui/                  # shadcn/ui components (do not edit directly)
│   ├── chat-input.tsx       # Message input with image upload
│   ├── chat-message.tsx     # Message bubble with markdown/code rendering
│   ├── chat-sidebar.tsx     # Chat history sidebar
│   ├── model-selector.tsx   # Model picker with capability badges
│   ├── arena-*.tsx          # Arena-specific components
│   ├── code-block.tsx       # Shiki syntax-highlighted code block
│   ├── copy-button.tsx      # Clipboard copy button
│   ├── mode-toggle.tsx      # Light/dark mode toggle
│   └── theme-provider.tsx   # next-themes provider
├── hooks/
│   ├── use-ollama-models.ts # Fetches /api/ollama/models, provides OllamaModel[]
│   ├── use-speech.ts        # TTS wrapper (SpeechSynthesis)
│   └── use-mobile.ts        # Responsive breakpoint hook
└── lib/
    ├── ai.ts                # AI SDK types (ChatUIMessage, MessageMetadata)
    ├── arena.ts             # Arena utilities (prompt list, code extraction)
    └── utils.ts             # cn() className merger
```

## API Routes

### `POST /api/ollama/chat`

Streams multi-turn chat via `streamText` + `toUIMessageStreamResponse`. Accepts `{ model, messages, supportsThinking }`. Supports vision via `file` parts in messages.

### `POST /api/ollama/generate`

Single-shot generation for the arena. Accepts `{ model, prompt, system }`, returns a plain text stream.

### `GET /api/ollama/models`

Fetches all local Ollama models, enriches each with `supportsVision` and `supportsThinking` flags via the Ollama `/api/show` endpoint.

### `POST /api/ollama/voice`

Streams a voice response as plain text (`toTextStreamResponse`). Uses a conversation-optimised system prompt. Accepts `{ model, messages }` where messages may include `file` parts (screenshots from screen share).

## Key Patterns

### Model Capability Detection

`OllamaModel` (from `use-ollama-models.ts`) exposes `supportsVision?: boolean` and `supportsThinking?: boolean`. Always check these before enabling vision UI or thinking mode.

### Image / Vision Messages

Images are passed as `{ type: 'file', url: dataUrl, mediaType: 'image/jpeg' }` parts alongside `text` parts in a `UIMessage`. `convertToModelMessages` from the AI SDK converts these for Ollama automatically.

### Chat History

Stored in `localStorage` under `'ollama-chat-history'`. Selected model persisted under `'ollama-selected-model'`. Both managed in `src/app/page.tsx`.

### Voice Architecture

`src/app/voice/page.tsx` is a single client component managing:

- `SpeechRecognition` in continuous mode — submits after 1500 ms of silence
- TTS queue via `SpeechSynthesisUtterance` with sentence-level streaming
- Screen share via `getDisplayMedia` — screenshot captured on the first spoken word, attached as a vision part
- All async state lives in `useRef` to avoid stale closures in event callbacks

### Streaming in Voice

The voice route returns `toTextStreamResponse()` (plain text, not a UI message stream). The page reads chunks and feeds a sentence buffer into the TTS queue for low-latency speech output.

## Development Workflows

### Running the Project

```bash
bun run dev        # Development server (localhost:3000)
bun run build      # Production build
bun run start      # Production server
bun run lint       # ESLint check
bun run format     # Prettier auto-format
bun run deps       # Interactive dependency updates
```

**Ollama must be running locally** (`ollama serve`) with at least one model pulled.

### Adding shadcn/ui Components

```bash
bun run shadcn add <component>
# or: bun x --bun shadcn@latest add <component>
```

Components install to `src/components/ui/`. Never edit them directly.

## Styling Conventions

- Tailwind utility classes exclusively — no inline styles or raw CSS
- CSS variable tokens only, no hex/rgb (e.g. `bg-background`, `text-foreground`, `text-muted-foreground`)
- Dark mode via `.dark` class + `dark:*` utilities
- Merge classes with `cn()` from `@/lib/utils`
- 120 char line width, single quotes, Tailwind classes auto-sorted by Prettier

## What to Avoid

- **Don't** add `'use client'` unnecessarily — API routes and utility files are server-only
- **Don't** modify `src/components/ui/` directly — extend in custom components
- **Don't** use hex/rgb colors — use CSS variable tokens
- **Don't** use `npm install` — use `bun add`
- **Don't** duplicate model-fetching logic — always use the `useOllamaModels` hook
- **Don't** add new Ollama API routes outside `/api/ollama/` to keep the proxy layer consistent
- **Don't** skip formatting — run `bun run format` before committing
