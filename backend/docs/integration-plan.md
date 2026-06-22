# Save System Integration Plan

How the `local-save` reference module reconciles with the **real LifeVerse game**.

> TL;DR — The reference module assumes the game state lives in the browser. The
> real game keeps it on the server in SQLite. We do **not** flip that. Instead we
> promote the module's `SaveRecord` shape to a **shared snapshot/sync envelope**
> used by the client cache, a new server export/import path, and Supabase — while
> the server stays authoritative during live play.

---

## 1. The two systems today

### Real game — server-authoritative (SQLite)
- Game state lives in **normalized SQLite tables** on the Express server
  (`characters`, `stats`, `traits`, `relationships`, `finances`, `loans`,
  `assets`, `housing`, `properties`, `domains`, `resources`, `education`,
  `careers`, `jobs`, `achievements`, `event_log`, …). The migration comment says
  it plainly: **"The DB file is the save."**
- The `saves` table is **bookmark metadata only** (`id, character_id, save_name,
  is_autosave, saved_at`). Autosave deletes the prior autosave row and inserts a
  new one; manual save inserts a named row. **There is no snapshot and no
  restore** — a "save" is a timestamp, not a recoverable point.
- The **client is a thin view**: it fetches DTOs via `GET /api/character/:id` and
  holds them in React state (`useGame`). 
- **No client persistence exists.** There is no `localStorage` anywhere, and the
  active `characterId` is never stored. → **A browser refresh loses the session;
  there is no "Continue".** This is the single most concrete gap.

### Reference module — client-authoritative (localStorage)
- `SaveManager` → `LocalStorageSaveAdapter` → `localStorage`. The whole game state
  is a plain-JSON `gameState` blob inside a `SaveRecord` (`metadata + gameState`).
- Already **cloud-shaped**: `userId`, `cloudSaveId`, `syncStatus`
  (`local-only → pending-upload → synced → conflict`), `revision`, `deviceId`,
  `lastSyncedAt`, `saveSchemaVersion`, plus a `SaveIndex` of all saves + the active one.
- Designed so Supabase can be added later as `metadata columns + game_state jsonb`.

**The mismatch:** the module expects the browser to own a serializable game-state
blob. The real game's state is server-side normalized rows, and the client has no
blob to store. So "copy it into `src/save/`" does not work as-is.

---

## 2. Reconciliation principle

> **The server stays authoritative during live play. The `SaveRecord` becomes the
> canonical _snapshot & sync envelope_ — not the live store.**

That gives the contract three jobs instead of one:

| Layer | Role of `SaveRecord` |
|---|---|
| **Server** | A character's SQLite state can be **serialized → `gameState` JSON** at save points, and **imported back** to restore. SQLite remains the live store during play. |
| **Client** | `SaveManager` + localStorage hold the **active-save pointer** (resume after refresh), the **save index** (Continue/Load screen), and optionally the **latest snapshot** as an offline cache/backup. |
| **Supabase** (later) | One `cloud_saves` row = **metadata columns + `game_state jsonb`** — literally the same `SaveRecord`. The existing `syncStatus`/`revision`/`deviceId` fields drive upload/conflict logic. |

One shape, three consumers. That is exactly the workspace goal: *frontend and
Supabase agree on the same data shape.*

---

## 3. What has to be built (and what's reused)

### A. Shared contract (reuse the module's types)
- Promote `local-save/types.ts` (`SaveMetadata`, `SaveRecord`, `SaveIndex`,
  `SaveSyncStatus`, `CURRENT_SAVE_SCHEMA_VERSION`) into **`@lifeverse/shared`** so
  client **and** server import the identical types. See `save-contract.md`.

### B. Server serializer + endpoints (new)
- `CharacterStateSerializer.export(characterId) → gameState` — read **every**
  per-character table (including hidden trait/stress fields the client DTO omits)
  into one JSON object, stamped with the schema version.
- `CharacterStateSerializer.import(gameState) → characterId` — recreate a
  character and all child rows from a blob (transactional).
- Routes: `GET /api/character/:id/export` → `SaveRecord`; `POST /api/save/import`
  → restores and returns the new `characterId`.
- The existing `CharacterService.getFullState` + the `GET /character/:id` assembly
  is a good *read-model* reference but is **not** the export — export must be the
  full persistable state, not the trimmed client DTO.

### C. Evolve the `saves` table into the canonical record (migration 008)
- Today `saves` is bookmark-only. Add columns mirroring `SaveMetadata`
  (`revision, schema_version, device_id, sync_status, cloud_save_id, user_id,
  updated_at, last_played_at`) **plus a `game_state` JSON column** holding the
  export blob. A bookmark becomes a **real restore point**, and the row maps 1:1
  to the future Supabase `cloud_saves` row. Additive migration; existing rows get
  defaults.

### D. Client wiring (repurpose the module)
- Use `SaveManager`/`LocalStorageSaveAdapter` for: the **active-save pointer**
  (fixes resume-after-refresh), the **save index** for a Continue/Load screen, and
  an optional **snapshot cache**. During online play the server is authoritative;
  the local snapshot is a cache/backup, refreshed at save points from the server
  export.
- The module's `migrations.ts` keeps handling old **client** blobs; the **server
  serializer is the schema authority**. Keep both behind one `saveSchemaVersion`.

### E. Supabase (later)
- `cloud_saves` = `SaveMetadata` columns + `game_state jsonb`. Sync uses the
  existing state machine: `local-only → pending-upload → synced → conflict`, with
  `revision` + `lastSyncedAt` + `deviceId` for conflict detection. Upload = push
  export blob; download = `POST /api/save/import`.

---

## 4. Phased rollout

- **Phase 0 — Resume after refresh (smallest real win).** Persist the active
  `characterId`/`saveId` in `localStorage` (the module's adapter, `gameState`
  omitted; server stays authoritative). Refresh → reload that character via
  `GET /api/character/:id`. Add a "Continue" button on the home screen.
- **Phase 1 — Real saves.** Server serializer + export/import endpoints; migrate
  `saves` to hold snapshots (008); Load/Continue screen backed by `SaveManager` +
  the server save list. Saves become restorable.
- **Phase 2 — Cloud (Supabase).** Auth + `cloud_saves`; drive `syncStatus`;
  conflict resolution by `revision`/`deviceId`.
- **Phase 3 — Purchases.** Out of scope for the save system; separate doc.

---

## 5. Open decisions (need a call before Phase 1)

1. **Authority during play:** server (recommended — the whole sim is server-side)
   vs client. This plan assumes server.
2. **Snapshot strategy:** serialize SQLite → blob *on save* (recommended) vs keep a
   continuously mirrored client blob.
3. **Slots vs characters:** map `SaveMetadata.slotId` to characters/bloodlines —
   one active save per slot, multiple slots? Define before the Load screen.
4. **Eventual home for the module:** `packages/shared` (shared types) +
   `packages/client/src/save/` (adapter/UI), or keep a standalone `save` package.
5. **Schema-version ownership:** confirm the server serializer owns
   `saveSchemaVersion`; client `migrations.ts` only upgrades stale local blobs.

---

## 6. Why this is safe

- The game loop is untouched in Phase 0–1; the server stays authoritative, so
  existing play can't regress.
- Every step is **additive** (new endpoints, additive migration, new client cache)
  — consistent with the repo's stated "forward-compatible, no destructive
  migration" philosophy.
- Supabase slots in behind the same contract with no game-loop rewrite — the
  original design goal of the reference module is preserved.
