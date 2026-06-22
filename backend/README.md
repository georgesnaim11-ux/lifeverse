# LifeVerse Backend Workspace

Planning and design for the **backend / persistence** side of LifeVerse. This is a
non-app workspace inside the game repo — it holds contracts, design notes, and a
reference save module, but **not** game code. The simulation itself lives in
`packages/server` (Express + SQLite) and `packages/client` (React).

## Why this exists

The save system spans three places that must agree on **one data shape**:

- the **client** (browser, resume-after-refresh, offline cache),
- the **server** (authoritative SQLite game state today),
- **Supabase** (cloud saves + auth + purchases, later).

This workspace is where we lock that shared contract down before wiring it through
all three.

## Contents

```text
backend/
  local-save/    Reference TypeScript save module (client localStorage). Cloud-ready shape.
  docs/
    local-save-system.md   What the reference module is and how it works.
    save-contract.md        The canonical SaveRecord contract all three layers share.
    integration-plan.md     ★ How this reconciles with the real server/SQLite game.
```

## Current step

Designing how the local save contract integrates with the **existing
server-authoritative game**. Start with **[docs/integration-plan.md](docs/integration-plan.md)** —
it explains the architecture mismatch and the phased path forward.

> Read order: `integration-plan.md` → `save-contract.md` → `local-save-system.md`.
