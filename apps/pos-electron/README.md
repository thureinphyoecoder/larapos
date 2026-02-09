# LaraPOS Electron Client

Enterprise desktop POS scaffold built with Electron + React + TypeScript.

## Goals
- Keep renderer isolated from Node runtime (`contextIsolation` + preload bridge).
- Use versioned backend API contracts (`/api/v1`).
- Keep business logic maintainable through feature modules (`auth`, `catalog`, `orders`).

## Run
1. `cd apps/pos-electron`
2. `npm install`
3. `npm run dev`

## Environment
Create `.env` inside this folder if needed:

```bash
VITE_POS_API_BASE_URL=http://127.0.0.1:8001/api/v1
VITE_POS_REQUEST_TIMEOUT_MS=15000
```

## Current scope
- Login with Sanctum token
- Product search and quick add-to-cart
- Direct order creation (`POST /orders` with items)
- Recent orders panel

## Next enterprise modules
- Offline queue / sync engine
- Receipt print pipeline
- Barcode + scanner integration
- Shift/session management and cash drawer reconciliation
- RBAC-aware navigation and screen-level permissions
