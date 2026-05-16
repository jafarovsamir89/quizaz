# Bilik Arena Frontend Setup

The Bilik Arena frontend is built with React, Vite, and TypeScript, optimized for mobile PWA experience.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Variables
Create a `.env` file in the `/frontend` directory:
```env
VITE_API_URL=http://localhost:3000

# Firebase Client Config (Get from Firebase Console)
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="..."
VITE_FIREBASE_PROJECT_ID="..."
VITE_FIREBASE_STORAGE_BUCKET="..."
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
```

### 3. Run in Development
```bash
npm run dev
```

## 🏗 Architecture
- **State Management**: Zustand (Auth, Game, Profile).
- **Styling**: Vanilla CSS with modern properties (Glassmorphism, Flexbox, Gradients).
- **API**: Axios with interceptors for Firebase Token attachment.
- **PWA**: Configured via `vite-plugin-pwa`.

## 🎮 Gameplay Flow
1. **Auth**: App starts with Firebase Anonymous login.
2. **Sync**: Backend `POST /auth/sync` is called to create/fetch the user profile.
3. **Onboarding**: If `cityId` is missing, the City Selection screen is shown.
4. **Dashboard**: Main menu with access to Solo, Duels, and Leaderboards.
5. **Solo Game**: Start session -> Answer questions -> View results.

## 📱 Mobile Optimization
- **Safe Area**: Uses `env(safe-area-inset-*)` for notch support.
- **Viewport**: Locked to mobile-friendly width (max 500px on desktop).
- **Touch**: iOS-friendly tap highlights removed and smooth transitions added.

## 🛠 Testing the Full Flow
1. Start Backend: `cd backend && npm run dev`.
2. Start Frontend: `cd frontend && npm run dev`.
3. Open the browser at `http://localhost:5173`.
4. You should see the Splash screen, then City Selection.
5. Select a city and start playing!
