# LaraPOS Delivery Mobile (React Native)

Delivery staff အတွက် React Native + NativeWind MVP app ဖြစ်ပါတယ်။

## Architecture (Scalable)
- `App.tsx`: app state orchestration only
- `src/screens/*`: UI screens (Login, Orders List, Order Detail)
- `src/services/*`: API use-cases (auth/order)
- `src/lib/*`: infra (HTTP client with timeout, storage)
- `src/types/*`: domain contracts
- `src/utils/*`: formatter helpers

## Features
- Sanctum login/logout
- Delivery orders list
- Order detail + item lines
- GPS location update
- Shipment proof upload + auto shipped
- Mark delivered
- Network timeout handling (avoid indefinite `Signing in...`)
- Developer-only server config file (`src/config/server.ts`)

## Professional guardrails
- Delivery role cannot cancel order.
- Delivery role can only update to `shipped` / `delivered`.
- API timeout default = 15s (upload = 25s).

## Setup
1. Go to app folder
   - `cd apps/delivery-mobile`
2. Install dependencies
   - `npm install`
3. Run backend for physical phone access (Docker web port)
   - `docker compose up -d web app`
4. Start app
   - `npm start`
   - or `npm run start:lan`

## Correct API Base URL
- Android Emulator: `http://10.0.2.2:8001`
- iOS Simulator: `http://127.0.0.1:8001`
- Physical Device: `http://<your-laptop-lan-ip>:8001`

Server URL ကို app UI မှာပြောင်းလို့မရတော့ပါ။
Developer များက `apps/delivery-mobile/src/config/server.ts` ထဲက `API_BASE_URL` ကိုပဲ ပြင်ရပါမယ်။

## Troubleshooting (`Signing in...` issue)
- Server မတက်သေးခြင်း
- API URL မမှန်ခြင်း
- Device နှင့် backend host မချိတ်ဆက်နိုင်ခြင်း
- HTTPS/HTTP mismatch

အခု version မှာ timeout + clear error message ပြန်ပြသဖြစ်တဲ့အတွက် “ရပ်နေခြင်း” မဖြစ်တော့ပါ။

## Expo opens old app bundle (important)
Expo Go sometimes opens a cached bundle if the dev server is unreachable or if another Metro server is still running.

Use this reset flow:
1. Stop all Expo terminals.
2. Run fresh start:
   - `npm run start:fresh`
3. In Expo Go:
   - remove old project from Recents
   - force close Expo Go and reopen
   - scan the new QR

If still stale:
- Android settings > Apps > Expo Go > Storage > Clear cache (and Clear data if needed).
- Ensure only one Metro server is running for this project folder.

## Ngrok tunnel error (`@expo/ngrok` global install failed)
If you see:
- `Failed to install @expo/ngrok globally`

Use LAN mode instead of tunnel:
1. Ensure phone and laptop are on same Wi-Fi.
2. Start with:
   - `npm run start:lan`
3. Scan QR again from this new session.

Only use tunnel when needed. Tunnel mode may require global npm install permissions on your system.

## Android Remote Push (Expo Notifications)
Current app supports local notifications and remote push token registration flow.

Required for remote push:
1. Use a physical Android phone.
2. Use development build / release build (recommended), not Expo Go.
3. Provide EAS project id:
   - `EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID`
4. Start app:
   - `EXPO_PUBLIC_EAS_PROJECT_ID=YOUR_EAS_PROJECT_ID npm run start:lan`

If app shows `Push Setup လိုအပ်နေပါသေးတယ်`, that means one of these is missing:
- notification permission
- EAS project id
- non-physical device
