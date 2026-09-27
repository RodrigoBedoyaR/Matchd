# Matchd

A local part-time work marketplace MVP. The core idea: **fewer, better job matches beat endless browsing**. Workers browse curated opportunities, businesses find candidates who actively want to work with them.

## Project Structure

This is an npm workspace monorepo:

- **`apps/web`** — React + TypeScript SPA (Vite), deployed to Vercel. Handles both worker and business user flows.
- **`apps/api`** — Express + TypeScript REST API with Prisma ORM, deployed to Railway. Manages authentication, job listings, candidate profiles, and applications.
- **`packages/shared`** — Shared TypeScript types and Zod schemas consumed by both apps.

## Local Development

### Prerequisites

- Node.js 18+
- Docker (for running PostgreSQL locally)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start a local PostgreSQL database:
   ```bash
   docker run -d --name matchd-postgres \
     -e POSTGRES_USER=matchd \
     -e POSTGRES_PASSWORD=matchd \
     -e POSTGRES_DB=matchd \
     -p 5432:5432 \
     postgres:16-alpine
   ```

3. Set up environment files:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate --workspace apps/api
   ```

5. Seed the database with demo accounts and sample data:
   ```bash
   npm run db:seed --workspace apps/api
   ```

6. In one terminal, start the API server (listens on `http://localhost:4000`):
   ```bash
   npm run dev:api
   ```

7. In another terminal, start the web app (listens on `http://localhost:3200`):
   ```bash
   npm run dev:web
   ```

8. Open [http://localhost:3200](http://localhost:3200) in your browser.

### Quick Start with Demo Accounts

The fastest way to explore the app is via demo login:

- On the landing page, click **"Continue as demo worker"** or **"Continue as demo business"** for instant access.
- Or log in with credentials:
  - **Worker:** `demo-worker@matchd.app` / `password123`
  - **Business:** `demo-business@matchd.app` / `password123`

Both routes show real seeded data (job listings and candidate profiles) so you can test the matching flow end-to-end.

## Deployment

For a complete walkthrough of deploying to Railway (backend + database) and Vercel (frontend), see [DEPLOY.md](./DEPLOY.md).

## Architecture Notes

- **Frontend routing** is client-side (React Router in browser history mode), not static file routing. The `vercel.json` config handles fallback to `/index.html` for all routes.
- **API migrations** run automatically on every deploy (via the Dockerfile `CMD`). The **seed** does not — run it manually once after the first deploy (see [DEPLOY.md](./DEPLOY.md)).
- **Workspace dependencies** (`@matchd/shared`) are resolved during monorepo install; the Dockerfile handles this by installing from the repo root.

## Development Workflow

- Both the API and web app watch for changes and hot-reload during `npm run dev:*`.
- Prisma migrations: see `apps/api/prisma/migrations/` after running `npm run db:migrate`.
- Shared types: `packages/shared` compiles to `dist/` (plain Node can't run `.ts` directly, which the API's production Docker build needs). `apps/web`'s Vite dev server picks up `packages/shared/src` changes instantly, but `apps/api`'s `tsx` dev server resolves the package via its built `dist/`, so after editing `packages/shared/src` run `npm run build:shared` once before the API picks it up.
