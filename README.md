# OpenMemo

AI-powered document generator. Create memos, official letters, announcements, and other business documents in Indonesian — formal, semi-formal, or casual — via chat, then export as PDF.

## Architecture

### Agent Layer (`packages/agent/`)
Core AI agent built on [Anvia](https://github.com/anvia-ai). Processes chat, determines document tone/register, and composes content.

**Tools:**
- `web-search` — search the web for document formats, templates, and examples
- `webExtract` — extract full content from a webpage for deeper research

### API Layer (`apps/api/`)
Hono HTTP server + BullMQ workers. Provides API endpoints and handles PDF generation in the background.

**Endpoints:**
- `POST /api/chat` — streaming chat with the agent
- `GET /api/memos?sessionId=` — list documents in a session
- `GET /api/memos/:id/download` — download or preview PDF
- `GET /api/sessions` — list all sessions
- `GET /api/sessions/:id/messages` — get session messages

**Tools (additional to agent):**
- `create-document` — saves document content and queues PDF generation

### Platform Layer (`apps/platform/`)
React + TanStack Router + Tailwind CSS v4 frontend. Chat interface with live streaming, document preview, and download.

**Features:**
- Real-time chat with AI agent (streaming responses)
- Document preview (Markdown + PDF viewer)
- PDF download
- Session management (history, continue previous conversations)
- Register-aware suggestions (formal letter, memo, announcement)

## Prerequisites

- Node.js >= 20
- pnpm >= 11.13.1
- Docker

## Setup

```bash
# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# Generate Prisma client & run migrations
pnpm --filter api db:generate
pnpm --filter api db:migrate
```

## Run

```bash
# Start all apps (api + platform) in parallel
pnpm dev
```

- API: http://localhost:8000
- Platform: http://localhost:3000

## Environment

Copy `.env.example` to `.env` and fill in the required values (OpenAI-compatible API key, Tavily API key for web search). Langfuse keys are optional for tracing.
