# Local Save Implementation

This folder contains a small TypeScript local save system for Lifeverse.

It is intentionally separate from the real game because the real React project is not in this workspace yet. Your friend can copy this folder into the real game later, usually under:

```text
src/save/
```

## What Each File Does

```text
types.ts
  Defines the save format.

localStorageSaveAdapter.ts
  Reads and writes save data to browser localStorage.

migrations.ts
  Validates save data and gives us a place to upgrade old save versions.

saveManager.ts
  Main API the game should use.

index.ts
  Re-exports the save module so the real game can import from one place.
```

## Why This Architecture

The game should not call `localStorage` directly.

Instead, the game should call `SaveManager`.

Today:

```text
Game state
  -> SaveManager
  -> LocalStorageSaveAdapter
  -> localStorage
```

Later:

```text
Game state
  -> SaveManager
  -> LocalStorageSaveAdapter
  -> Supabase sync
```

That means Supabase can be added later without rewriting the game loop.

## Startup Integration

When the game starts, do this:

```ts
const saveManager = new SaveManager();
const loadedSave = saveManager.loadActiveSave<MyGameState>();

if (loadedSave.status === 'found') {
  // Put loadedSave.saveRecord.gameState into the game's state/store.
}

if (loadedSave.status === 'missing') {
  // Create a new character/game state, then call saveManager.createSave(...).
}

if (loadedSave.status === 'corrupted' || loadedSave.status === 'unsupported-version') {
  // Show a friendly message and start a new save or let the player reset.
}
```

## Saving Progress

When important player data changes, call:

```ts
const nextSaveRecord = saveManager.updateSave({
  saveRecord,
  nextGameState,
  summary: {
    characterName: 'Alex River',
    characterAge: 24,
  },
  gameVersion: '0.1.0',
});
```

In React, this usually belongs in a `useEffect` watching the important game state.

Example shape:

```ts
useEffect(() => {
  if (!saveRecord || !gameState) return;

  const nextSaveRecord = saveManager.updateSave({
    saveRecord,
    nextGameState: gameState,
    summary: getSaveSummary(gameState),
    gameVersion: '0.1.0',
  });

  setSaveRecord(nextSaveRecord);
}, [gameState]);
```

Important: avoid saving during the first load/hydration. Loading a save is not player progress.

## Handling Corrupted Saves

The save manager returns a status instead of crashing:

```text
found
missing
corrupted
unsupported-version
```

This means the game can recover gracefully if localStorage contains broken data.

## Supabase Readiness

The save shape is:

```text
metadata + gameState
```

Later, Supabase can store this as:

```text
cloud_saves.metadata columns
cloud_saves.game_state jsonb
```

The important part is that `gameState` is plain JSON.

## Browser Test Page

To test the local save idea before connecting it to the real game, open:

```text
local-save/browser-test.html
```

This is not the real game. It is a tiny fake Lifeverse page that proves the save contract can:

- create a save
- update progress
- persist after browser refresh
- load existing progress
- handle corrupted save data without crashing
