# next-local-ai-chat

A local AI chat application powered by **Ollama or oMLX**, built with Next.js 16, the Vercel AI SDK, SQLite, Drizzle ORM, and shadcn/ui.

> Run at least one local backend: **Ollama** (`localhost:11434`) or **oMLX** (`localhost:8000` by default).

| Chat              | Arena               | Voice               |
| ----------------- | ------------------- | ------------------- |
| ![Chat](chat.png) | ![Arena](arena.png) | ![Voice](voice.png) |

## Features

- Chat: multi-turn conversations with markdown and syntax-highlighted code rendering, image attachments for vision models, persistent chat history, and per-chat model selection
- Arena: send the same prompt to multiple local models and compare responses in real time
- Voice: real-time voice call interface with low-latency TTS streaming and optional screen share for vision-capable models
- Global provider switching: choose **Ollama** or **oMLX** from one place in the left sidebar (above theme toggle)
- Provider-aware model capability detection: `supportsVision` and `supportsThinking` are normalized for both providers
- SQLite persistence: chat history + selected model + selected provider are stored in `data/app.db`

## Prerequisites

- Bun installed
- Node.js 20+ installed
- At least one local model backend running:
  - Ollama: [https://ollama.com](https://ollama.com), `ollama serve`, and pulled models
  - oMLX: [https://github.com/jundot/omlx](https://github.com/jundot/omlx), server running locally

## Environment Variables

Create `.env` (optional if you only use Ollama):

```bash
# Required for oMLX in your current setup
OMLX_API_KEY=your_omlx_api_key

# Optional (defaults to http://localhost:8000/v1)
OMLX_BASE_URL=http://localhost:8000/v1
```

## Quick Start

```bash
git clone https://github.com/aleksa-codes/next-local-ai-chat
cd next-local-ai-chat
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

The SQLite database is created automatically at `data/app.db` on first run.

## API Routes

Canonical provider-aware routes:

- `GET /api/models` - list models for selected provider (`?provider=ollama|omlx`)
- `POST /api/chat` - streaming chat completion
- `POST /api/generate` - arena generation stream
- `POST /api/voice` - plain text stream for voice mode
- `GET /api/chat-state` - bootstrap persisted chats + selected model + selected provider
- `PUT /api/preferences/model` - persist selected model
- `GET|PUT /api/preferences/provider` - read/write selected provider

Legacy Ollama-only routes are still present under `/api/ollama/*` for compatibility, but UI uses the provider-aware routes.

## Database Migrations

If you change the schema (add/remove fields or tables), generate and apply a new Drizzle migration:

```bash
bun run db:generate
bun run db:migrate
```

> The server runs migrations on startup, but keep migrations committed for team consistency.

## Scripts

| Command               | Description                        |
| --------------------- | ---------------------------------- |
| `bun run dev`         | Start development server           |
| `bun run build`       | Build for production               |
| `bun run start`       | Run production server              |
| `bun run lint`        | Lint with ESLint                   |
| `bun run format`      | Format with Prettier               |
| `bun run shadcn`      | Add shadcn/ui components           |
| `bun run deps`        | Update dependencies interactively  |
| `bun run db:generate` | Generate Drizzle SQL migrations    |
| `bun run db:migrate`  | Apply generated Drizzle migrations |
| `bun run db:studio`   | Open Drizzle Studio                |

## Tech Stack

- [Next.js 16](https://nextjs.org): App Router
- [Vercel AI SDK](https://sdk.vercel.ai): streaming chat with `useChat`
- [ai-sdk-ollama](https://github.com/jagreehal/ai-sdk-ollama): Ollama integration
- [@ai-sdk/openai-compatible](https://www.npmjs.com/package/@ai-sdk/openai-compatible): oMLX OpenAI-compatible integration
- [SQLite](https://www.sqlite.org/index.html) + [Drizzle ORM](https://orm.drizzle.team): local persistence for chats and preferences
- [Tailwind CSS v4](https://tailwindcss.com): utility-first styling
- [shadcn/ui](https://ui.shadcn.com): component library
- [React 19](https://react.dev) with React Compiler
- [marked](https://marked.js.org) + [shiki](https://shiki.style): markdown and code rendering
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API): STT and TTS for voice mode

## License

MIT, see [LICENSE](LICENSE) for details.
