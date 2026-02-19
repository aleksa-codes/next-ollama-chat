# AI Coding Agent Instructions

## Project Overview

This is a **Next.js 16 starter template** optimized for rapid development with modern tooling. It's designed as a minimal, production-ready foundation for new projects using React Server Components (RSC), Tailwind CSS v4, and shadcn/ui components.

## Core Architecture

### Technology Stack

- **Next.js 16** with App Router and React Server Components (RSC enabled)
- **React 19.2** with **React Compiler** enabled (`reactCompiler: true` in `next.config.ts`)
- **Tailwind CSS v4** with OKLCH color system and CSS variables
- **shadcn/ui** ("new-york" style) for component library
- **TypeScript** with strict mode enabled
- **Bun** as package manager

### Key Configuration Files

- `components.json`: shadcn/ui config with aliases (`@/components`, `@/lib`, etc.)
- `next.config.ts`: React Compiler enabled
- `tsconfig.json`: Path aliases (`@/*` → `./src/*`)
- `.prettierrc`: Auto-format with import organization and Tailwind class sorting

## Project Structure

```
src/
├── app/              # App Router pages and layouts
│   ├── globals.css   # Tailwind v4 imports + theme CSS variables
│   ├── layout.tsx    # Root layout with ThemeProvider
│   └── page.tsx      # Homepage
├── components/       # Shared components
│   ├── ui/          # shadcn/ui components (auto-generated)
│   └── *.tsx        # Custom components (theme-provider, mode-toggle, etc.)
└── lib/
    └── utils.ts     # cn() utility for className merging
```

## Development Workflows

### Adding Components - shadcn/ui

- shadcn/ui has these components available: Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Chart, Calendar, Card, Carousel, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Drawer, Dropdown Menu, Empty, Field, Form, Hover Card, Input, Input Group, Input OTP, Item, Kbd, Label, Menubar, Native Select, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group, Tooltip.
- Always prefer using shadcn/ui components when possible for consistency.

Use the custom script for shadcn/ui components:

```bash
bun run shadcn
# or directly: bun x --bun shadcn@latest add <component>
```

Components are installed to `src/components/ui/` and use the "new-york" style variant.

### Running the Project

```bash
bun run dev        # Development server (localhost:3000)
bun run build      # Production build
bun run start      # Production server
bun run lint       # ESLint check
bun run format     # Prettier auto-format
bun run deps       # Interactive dependency updates
```

### Code Quality

- **Prettier** auto-formats on save with:
  - Import organization (`prettier-plugin-organize-imports`)
  - Tailwind class sorting (`prettier-plugin-tailwindcss`)
  - Single quotes for JSX and JS (`singleQuote: true`, `jsxSingleQuote: true`)
  - 120 character line width
- **ESLint** enforces:
  - Next.js best practices
  - React Compiler rules
  - TypeScript type safety

## Critical Patterns

### Client vs Server Components

- **Default to Server Components** (no `'use client'` directive)
- Add `'use client'` ONLY when using:
  - React hooks (`useState`, `useEffect`, etc.)
  - Browser APIs
  - Event handlers
  - `next-themes` (e.g., `theme-provider.tsx`, `mode-toggle.tsx`)

### Styling Conventions

- Use Tailwind utility classes exclusively
- Leverage CSS variables from `globals.css` for theming (e.g., `bg-background`, `text-foreground`)
- Dark mode uses `.dark` class with custom variant: `dark:*` utilities
- Merge classes with `cn()` utility from `@/lib/utils`

### Component Patterns

- shadcn/ui components use `class-variance-authority` (CVA) for variant management (see `button.tsx`)
- Prefer composition with `asChild` prop (Radix pattern) for polymorphic components
- Icons from `lucide-react` library

### Theme System

- Managed by `next-themes` with system preference detection
- ThemeProvider in `layout.tsx` with `suppressHydrationWarning` on `<html>`
- Color palette uses OKLCH color space for better perceptual uniformity
- Customizable via CSS variables in `:root` and `.dark` selectors

### Path Aliases

Always use configured aliases:

- `@/components` → `src/components`
- `@/lib` → `src/lib`
- `@/app` → `src/app`

## What to Avoid

- **Don't** add `'use client'` unnecessarily (React Compiler optimization depends on Server Components)
- **Don't** modify shadcn/ui components in `src/components/ui/` directly—extend them in custom components instead
- **Don't** use RGB/HEX colors—stick to CSS variable tokens (e.g., `text-muted-foreground`)
- **Don't** install npm packages—use `bun add` for faster installs
- **Don't** skip formatting—run `bun run format` before committing

## Common Tasks

### Adding a New Page

Create `src/app/[route]/page.tsx` using Server Components by default.

### Creating Custom Components

Place in `src/components/` (not `ui/`), import shadcn components from `@/components/ui`.

### Modifying Theme Colors

Edit CSS variables in `src/app/globals.css` under `:root` and `.dark`. Use https://tweakcn.com for theme generation.

### Updating Dependencies

Run `bun run deps` for interactive updates (uses taze under the hood).

---

**Remember**: This template prioritizes minimalism and performance. Keep dependencies lean and leverage React Server Components + React Compiler for optimal bundle size and runtime performance.
