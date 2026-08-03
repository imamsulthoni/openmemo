# OpenMemo

AI-powered memo generator.

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

- API: http://localhost:3000
- Platform: http://localhost:3003