# Save Contract

The single data shape shared by the client cache, the server export/import path,
and (later) Supabase. It is the module's `local-save/types.ts`, promoted to the
canonical contract. See **[integration-plan.md](integration-plan.md)** for how
each layer uses it.

## Shape

A **`SaveRecord`** = `metadata` (about the save) + `gameState` (the game itself, as
plain JSON).

```ts
type SaveRecord<TGameState> = {
  metadata: SaveMetadata;
  gameState: TGameState;   // plain JSON — the serialized character state
};
```

### `SaveMetadata`

| Field | Meaning | Notes |
|---|---|---|
| `saveId` | Local save id | `save_…` uuid |
| `slotId` | Save slot | maps to a character/bloodline (see open decision #3) |
| `userId` | Auth user | `null` until Supabase auth |
| `cloudSaveId` | Supabase row id | `null` until uploaded |
| `characterName`, `characterAge` | Summary for the save list | denormalized for the Load screen |
| `gameVersion` | App version that wrote it | e.g. `0.1.0` |
| `saveSchemaVersion` | Contract version | gates migration; server serializer owns it |
| `revision` | Monotonic counter | conflict detection |
| `syncStatus` | `local-only \| pending-upload \| synced \| conflict` | sync state machine |
| `deviceId` | Origin device | conflict detection |
| `createdAt` / `updatedAt` / `lastPlayedAt` / `lastSyncedAt` | ISO timestamps | |

### `SaveIndex`
A lightweight list of all saves + the **active** one. Powers Continue/Load and the
resume-after-refresh pointer. Entries are a `Pick<>` of metadata (id, slot, name,
age, timestamps, syncStatus, revision) — no `gameState`, so it stays cheap.

## Invariants

- `gameState` **must be plain JSON** — no class instances, `Date`, `Map`, etc. This
  is what lets the same blob live in localStorage, a SQLite `game_state` column,
  and a Supabase `jsonb` column unchanged.
- `revision` is **monotonic** per save; bump on every `updateSave`.
- `syncStatus` flips to `pending-upload` once a `userId` exists (offline edit
  awaiting upload); back to `synced` after a successful push.
- A load returns a **status**, never throws: `found | missing | corrupted |
  unsupported-version`. Callers branch on status (see module README).

## Mapping across layers

| Contract | Client | Server (`saves`, migration 008) | Supabase (`cloud_saves`) |
|---|---|---|---|
| `metadata.*` | localStorage index/record | columns on `saves` | columns |
| `gameState` | localStorage record / cache | `saves.game_state` JSON | `game_state jsonb` |
| `saveSchemaVersion` | `migrations.ts` upgrades stale local blobs | serializer is authority | mirrors server |

## What `gameState` contains (server export)

The serialized **full** per-character state — every persistable table, **including
server-only fields the client DTO hides** (hidden traits, raw stress/willpower,
etc.): character, stats, traits, flags, relationships, education, careers, jobs,
finances, loans, assets, housing, properties, domains, resources, achievements,
event_log, activity_log. Stamped with `saveSchemaVersion`. (Defined by the
`CharacterStateSerializer` in Phase 1 — see integration plan §3B.)
