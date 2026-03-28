# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run setup          # First-time setup: install deps + generate Prisma + run migrations
npm run dev            # Start dev server with Turbopack (localhost:3000)
npm run build          # Production build
npm run lint           # Run ESLint
npm run test           # Run Vitest unit tests
npm run db:reset       # Reset SQLite database (destructive)
npx prisma studio      # Visual DB browser
```

Run a single test file:

```bash
npx vitest run src/path/to/file.test.ts
```

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, the app uses a `MockLanguageModel` that generates static placeholder code. The JWT secret (`JWT_SECRET`) is also required for auth to work.

## Architecture

**UIGen** is an AI-powered React component generator with live preview. The user chats with Claude, which generates/edits React components in a virtual file system. Changes render live in a sandboxed iframe.

### Data Flow

```
Chat Input → POST /api/chat → streamText() with tools
                                     ↓
                         Claude generates tool_call
                         (str_replace or file_manager)
                                     ↓
                         Tool executes server-side
                                     ↓
                    Client onToolCall → FileSystemContext.handleToolCall()
                                     ↓
                    PreviewFrame re-renders via Babel JSX transform
```

### Key Abstractions

**Virtual File System** (`src/lib/file-system.ts`): All generated files live in memory — no disk writes. The `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) manages CRUD operations and exposes `handleToolCall()` to apply AI tool results.

**AI Tools** (`src/lib/tools/`):

- `str_replace.ts` — replaces a string in an existing file (like sed)
- `file-manager.ts` — creates, renames, deletes files in the virtual FS

**Live Preview** (`src/components/preview/PreviewFrame.tsx`): Renders all virtual FS files inside a sandboxed iframe using `@babel/standalone` for JSX→JS transformation. Entry point is always `/App.jsx`.

**Chat API** (`src/app/api/chat/route.ts`): Streams Claude responses via `@ai-sdk/anthropic`. Uses `claude-haiku-4-5` with prompt caching. Falls back to mock if no API key.

**Project Persistence**: `messages` (chat history) and `data` (serialized FS) are stored as JSON strings in a single `Project` row in SQLite via Prisma.

### Database Schema

Always read `prisma/schema.prisma` to understand DB model structure before working with Prisma queries or data persistence.

### Auth

JWT stored in an httpOnly cookie (`auth-token`, 7-day TTL). `getSession()` in `src/lib/auth.ts` verifies on the server. Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem` routes. Server actions in `src/actions/` handle sign-up/in/out.

### Routing

- `/` — Home; redirects authenticated users to their first project
- `/[projectId]` — Project view; loads project from DB via `getProject` server action
- `/api/chat` — POST only; streams AI responses

### State Management

Two React contexts wrap the entire app:

- `FileSystemProvider` — virtual file system state + editor selected file
- `ChatProvider` — wraps `useChat` from `@ai-sdk/react`, bridges tool call events to `FileSystemContext`

### UI Layout

Split-pane layout (via `react-resizable-panels`): Chat (35% left) | Preview/Code Editor (65% right). The right panel tabs between live preview and Monaco code editor.

### AI Prompt Conventions

The system prompt (`src/lib/prompts/generation.tsx`) instructs Claude to:

- Always use `/App.jsx` as the component entry point
- Use Tailwind CSS for all styling
- Use `@/` path imports for cross-file references
- Keep chat responses brief; put all code in tool calls
