# next-ollama-chat

A local AI chat application powered by [Ollama](https://ollama.com), built with Next.js 16, the Vercel AI SDK, and shadcn/ui.

> **Requires Ollama running locally.** Pull any model with `ollama pull <model>` before starting.

## Features

- 💬 **Chat**: multi-turn conversations with markdown and syntax-highlighted code rendering, image attachments for vision models, persistent chat history, and per-chat model selection
- ⚔️ **Arena**: send the same prompt to two models side-by-side and compare responses in real time
- 🎙️ **Voice**: hands-free voice call interface; listens continuously and speaks responses aloud via TTS with sentence-level streaming for low latency
- 🖥️ **Screen Share**: share your screen during a voice call; a screenshot is captured the moment you start speaking and sent alongside your message to vision-capable models
- 🌙 **Dark mode**: system preference detection via next-themes
- 🔍 **Model capability detection**: vision and thinking support auto-detected per model and reflected in the UI

## Prerequisites

- [Ollama](https://ollama.com) installed and running (`ollama serve`)
- At least one model pulled, e.g. `ollama pull qwen3.5` or `ollama run qwen3.5`
- Node.js 20+ installed

## Quick Start

```bash
git clone https://github.com/aleksa-codes/next-ollama-chat
cd next-ollama-chat
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command          | Description                       |
| ---------------- | --------------------------------- |
| `bun run dev`    | Start development server          |
| `bun run build`  | Build for production              |
| `bun run start`  | Run production server             |
| `bun run lint`   | Lint with ESLint                  |
| `bun run format` | Format with Prettier              |
| `bun run shadcn` | Add shadcn/ui components          |
| `bun run deps`   | Update dependencies interactively |

## Tech Stack

- [Next.js 16](https://nextjs.org): App Router
- [Vercel AI SDK](https://sdk.vercel.ai): streaming chat (`useChat` on the client)
- [ai-sdk-ollama](https://github.com/sgomez/ai-sdk-ollama): Ollama provider; also provides `streamText` used in all API routes for better Ollama compatibility
- [Tailwind CSS v4](https://tailwindcss.com): utility-first styling
- [shadcn/ui](https://ui.shadcn.com): component library (New York style)
- [React 19](https://react.dev) with React Compiler
- [marked](https://marked.js.org) + [shiki](https://shiki.style): markdown and code rendering
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API): STT and TTS for voice mode

## License

MIT, see [LICENSE](LICENSE) for details.
