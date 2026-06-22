# LifeVerse

> Live a life. Build a legacy. No two bloodlines are the same.

A generational life-simulation game. You don't play a single character — you
steward a **bloodline** across decades and descendants, where choices echo
forward through inheritance, reputation, and a procedural consequence engine.

This repository is being built in **phases** (see the GDD). This is **Phase 1**:
a complete, fun single-life experience, with the foundations for Threads,
Generations, Fame, and the Dynamic Economy laid but not yet active.

## Tech stack

| Layer    | Choice |
|----------|--------|
| Frontend | React 18 + Vite + TypeScript |
| Backend  | Node.js + Express + TypeScript |
| Database | SQLite via `better-sqlite3` (synchronous, transactional) |
| Monorepo | npm workspaces + TypeScript project references |

## Repository layout

```
packages/
  shared/   Types, enums, and balance constants shared by client and server.
  server/   Simulation engine, persistence, and HTTP API.
  client/   React web client.
```

The simulation lives entirely on the **server**; the client is a thin
rendering/decision layer.

## Prerequisites

- **Node.js >= 20.11** (`better-sqlite3` ships prebuilt binaries for current LTS;
  no native toolchain needed on standard platforms).
- npm 10+ (bundled with Node 20).

## Getting started

```bash
# 1. Install all workspace dependencies from the repo root.
npm install

# 2. Configure the server environment.
cp packages/server/.env.example packages/server/.env

# 3. Build the shared package (server/client depend on its compiled output).
npm run build --workspace @lifeverse/shared

# 4. Create the database and apply the schema.
npm run db:migrate

# 5. Boot the server (Milestone 1: runs migrations + health check).
npm run dev:server
```

To run everything in watch mode during development:

```bash
npm run dev   # starts shared (watch), server (watch), client (Vite) together
```

## Scripts (root)

| Script             | Purpose |
|--------------------|---------|
| `npm run build`    | Build all packages (project-reference aware). |
| `npm run typecheck`| Type-check the whole monorepo. |
| `npm run db:migrate` | Apply pending SQL migrations. |
| `npm run dev`      | Run all packages in watch mode. |
| `npm run lint`     | Lint TypeScript sources. |
| `npm run format`   | Format with Prettier. |

## Database

- Schema is defined as versioned SQL migrations in
  `packages/server/src/db/migrations/`, tracked in a `schema_migrations` table.
- The DB file path is set by `DATABASE_PATH` (default `./data/lifeverse.db`,
  resolved from the server package root). Database files are git-ignored.
- Forward-compatibility tables (`bloodlines`, `threads`, `npcs`, `economy`) and
  columns exist now but are inert in Phase 1, so later phases are additive.

## Roadmap

Phase 1 → Playable single life. Phase 2 → Thread engine + NPCs + full traits.
Phase 3 → Generations + inheritance + legacy scoring + countries.
Phase 4 → Fame + dynamic economy + rare events + polish.
