# POS Multi-Client Architecture (Electron + React Native + Web)

## Objective
Build one nationwide transaction platform where multiple clients can run reliably in low-connectivity environments.

## Core Principles
- API contracts are versioned and backward compatible (`/api/v1`, `/api/v2`).
- Server is source of truth for final ledger and stock state.
- Every client is offline-first with local persistence + outbox sync.
- Idempotency is mandatory for all write operations.

## Shared Layers
1. Domain Contract Layer
- Shared DTO schema for `Order`, `OrderItem`, `Product`, `StockMovement`, `ApprovalRequest`.
- Keep this in a standalone package or schema repo and generate TS types for all clients.

2. Sync Engine Layer
- Same queue model across clients:
  - `pending`
  - `retrying`
  - `dead-letter`
- Use `client_ref`/idempotency key per mutation.
- Server must accept repeat requests safely.

3. Storage Layer by Platform
- Electron: local SQLite (desktop file DB)
- React Native: SQLite/WatermelonDB/Realm (device local DB)
- Web PWA: IndexedDB (Dexie/LocalForage)

## Conflict Strategy
- Stock/order writes are resolved server-side in transactions.
- Client keeps local optimistic state marked as provisional.
- Server response replaces provisional records after sync.
- If rejected, keep failed record and show recovery action.

## Operational Requirements for Nationwide Use
- Per-branch feature flags and rollout controls.
- Observability: sync latency, queue depth, error rate per branch.
- Background sync with jitter/backoff to avoid thundering herd.
- Disaster recovery: local backup + central backup + weekly restore drills.

## Recommended Next Steps
1. Extract `orderService/catalogService/authService` contract into shared module.
2. Introduce `X-Idempotency-Key` validation on backend for `/orders` and payment-affecting endpoints.
3. Add dead-letter queue viewer in admin dashboard for branch support teams.
4. Add branch-level health dashboard (online/offline rate, pending queue volume, last sync).
