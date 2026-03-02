# Mindforge Student — Android (WebView)

This is a **WebView wrapper** that loads the Mindforge Student web app so you can run it on the **Android Studio emulator** (or a physical device) and try the flow.

## Prerequisites

1. **Android Studio** (Hedgehog or newer recommended) with an **Android emulator** (API 24+).
2. **Backend and web client** running on your machine (see below).

## 1. Start backend and web app on your computer

From the **Mindforge project root**:

```bash
# Terminal 1 — Backend (port 3000)
cd backend && npm run start:dev

# Terminal 2 — Web client (port 5173)
cd client && npm run dev
```

Leave both running. The web app at `http://localhost:5173` proxies API calls to the backend at `http://localhost:3000`.

**Login for testing:** MPIN **`123456`** (seeded test student “Aarav”).

## 2. Open and run the Android project

1. Open **Android Studio**.
2. **File → Open** and select the **`android`** folder inside the Mindforge project.
3. Wait for **Gradle sync** to finish.
4. Start an **Android Virtual Device (AVD)** from **Device Manager** (or use a connected device).
5. Click **Run** (green triangle) to install and launch the app on the emulator.

The app opens a full-screen WebView that loads:

- **Emulator:** `http://10.0.2.2:5173/` (10.0.2.2 is your host machine from the emulator).
- So the emulator sees the same Vite dev server and backend proxy as your browser.

## 3. Using a physical Android device

1. Ensure your phone and computer are on the **same Wi‑Fi**.
2. Find your computer’s **LAN IP** (e.g. `192.168.1.5`).
3. In **`app/src/main/java/com/mindforge/student/MainActivity.kt`**, change:
   ```kotlin
   private const val BASE_URL = "http://10.0.2.2:5173/"
   ```
   to:
   ```kotlin
   private const val BASE_URL = "http://YOUR_IP:5173/"
   ```
   (e.g. `"http://192.168.1.5:5173/"`).
4. Keep backend and `npm run dev` (client) running on your computer.
5. Build and run the app on your device.

## Database and login (quick ref)

- **Database (dev):** In-memory SQLite by default. Optional file: in `backend/.env` set `SQLITE_PATH=./data/mindforge.sqlite` and create `backend/data`.
- **Tables:** See **`docs/DATABASE_AND_LOGIN.md`** in the project root.
- **Test login:** MPIN **`123456`**.

## If the app shows a blank or error page

- Confirm **backend** is running (`http://localhost:3000/health` returns OK).
- Confirm **client** is running (`http://localhost:5173` loads in your browser).
- On **physical device**, confirm you used your computer’s IP in `BASE_URL` and that the device can reach it (same Wi‑Fi, no firewall blocking 5173/3000).
