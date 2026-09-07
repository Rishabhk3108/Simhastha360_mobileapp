# Simhastha 360 — Mobile App

Expo (React Native + TypeScript) app covering all three on-the-ground roles from the spec, in one app:

- **Visitor mode** (default, no login) — live crowd status, Find Help (facility search, distance-sorted), Safety (SOS, crowdsourced reports, lost-person reporting), AI Assistant chat, and an Account tab holding the opt-in Digital Health Card and Temporary Family Group
- **Volunteer mode** (unlocked after admin approval) — a "Tasks" tab appears once signed in, with an on-duty/off-duty toggle and acknowledge → complete task flow
- **Field Team mode** — same Tasks tab and flow, minus the availability toggle; live location is pinged to the backend while the tab is focused

Visitor-facing actions use a per-device anonymous ID (persisted in AsyncStorage) rather than an account, matching the spec's "no smartphone/account required" principle for pilgrims. Volunteers and field team sign in with phone + password (same backend auth as the web admin dashboard).

## Setup
```bash
npm install
cp .env.example .env   # set EXPO_PUBLIC_API_BASE_URL
npx expo start
```

Requires the [backend](../backend) running. **On a physical device or emulator**, `127.0.0.1` refers to the device itself, not your dev machine — set `EXPO_PUBLIC_API_BASE_URL` to your machine's LAN IP (e.g. `http://192.168.1.x:8000`) instead.

## Structure
- `src/api/` — axios client (attaches JWT from AsyncStorage) and TypeScript types mirroring the backend
- `src/auth/` — auth context for volunteer/field-team login
- `src/device/` — anonymous per-device ID for visitor actions
- `src/location/` — `expo-location` permission/GPS hook + haversine distance helper
- `src/screens/` — one file per tab
- `src/navigation/RootNavigator.tsx` — bottom tabs; the Tasks tab is conditionally rendered based on the logged-in role

## Known placeholders (see spec §10)
- No Mappls Maps SDK yet — screens use list views, not a live map; the map/geofencing/turn-by-turn routing integration is the natural next step, likely as a native module or WebView.
- No offline mode (PWA service-worker caching) or push notifications yet — both called out in the spec as needing the Mappls/production build phase.
- Health Card shows its QR token as text rather than rendering an actual QR code — adding a QR rendering library (e.g. `react-native-qrcode-svg`, which needs `react-native-svg`) is a quick follow-up, deliberately deferred to keep this scaffold's dependency footprint small.
