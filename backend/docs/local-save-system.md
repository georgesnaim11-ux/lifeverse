# Local Save System (reference module)

What the `backend/local-save/` module is, as-shipped. It is a **reference
implementation of the client side** of the save contract — clean, framework-free,
and Supabase-ready. It is **not yet wired into the real game**; see
[integration-plan.md](integration-plan.md) for how it gets adapted (the real game
is server-authoritative, so the module becomes a cache/pointer, not the live store).

## Files

```text
types.ts                   The save format (the contract — see save-contract.md).
localStorageSaveAdapter.ts The only code that touches localStorage. Device id, JSON guards.
migrations.ts              Shape validation + version-gating for old local blobs.
saveManager.ts             Public API the game calls. Never call localStorage directly.
index.ts                   Barrel re-export.
```

## Flow

```text
Game state -> SaveManager -> LocalStorageSaveAdapter -> localStorage
(later)    -> SaveManager -> LocalStorageSaveAdapter -> Supabase sync
```

The game only ever talks to `SaveManager`. Swapping/extending the adapter (e.g.
adding Supabase) doesn't touch the game loop.

## Public API (`SaveManager`)

- `loadActiveSave<T>()` → `LoadSaveResult` with status `found | missing | corrupted
  | unsupported-version`. Branch on status; it never throws.
- `loadSave<T>(saveId)` — load a specific save.
- `createSave<T>({ gameState, summary, slotId?, gameVersion })` — new `SaveRecord`,
  `revision: 1`, `syncStatus: 'local-only'`, becomes the active save.
- `updateSave<T>({ saveRecord, nextGameState, summary, gameVersion })` — bumps
  `revision`, refreshes timestamps, flips `syncStatus` to `pending-upload` when a
  `userId` is set.
- `deleteSave(saveId)` — removes the record and its index entry.
- `loadIndex()` — the `SaveIndex` (all saves + active id) for a Load screen.

## Integration notes (from the module README)

- On startup: `loadActiveSave()` → `found` ⇒ hydrate store; `missing` ⇒ new game;
  `corrupted`/`unsupported-version` ⇒ friendly recovery.
- On meaningful state change (React `useEffect`): `updateSave(...)`. **Do not save
  during initial load/hydration** — loading is not progress.

## How it differs from the real game (important)

The module assumes the **browser owns** a serializable `gameState`. In LifeVerse
today the state is **server-side SQLite** and the client has no blob. So in the
real game this module is repurposed to hold the **active-save pointer + index +
optional snapshot cache**, with `gameState` sourced from a new server **export**
endpoint. Full reasoning and the phased plan: [integration-plan.md](integration-plan.md).

> Note: the module README mentions a `local-save/browser-test.html`. It was not
> included in the delivered zip — only the five `.ts` files shipped. If we want the
> standalone refresh/corruption demo, it can be added later; it is not needed for
> the integration.
