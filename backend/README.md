# Bilik Arena Backend 🇦🇿

Intellectual social arena of Azerbaijan. This is a production-ready NestJS backend for the Bilik Arena mobile/PWA app.

## 🚀 Overview
Bilik Arena is a trivia-based social game featuring:
- **Solo Mode**: Quick sessions to earn coins and XP.
- **PvP Duels**: Asynchronous 1v1 battles against other players.
- **City Battles**: Every point earned contributes to your city's global ranking.
- **Social & Rankings**: Global, regional, and daily/weekly/monthly leaderboards.
- **Premium UI Foundation**: Built for speed and visual excellence.

## 🛠 Tech Stack
- **Framework**: [NestJS](https://nestjs.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: [Firebase Admin SDK](https://firebase.google.com/docs/admin)
- **Validation**: [class-validator](https://github.com/typestack/class-validator)

## 📦 Getting Started

### 1. Environment Variables
Create a `.env` file in the `/backend` directory:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/bilik_arena"
PORT=3000

# Firebase Config
FIREBASE_PROJECT_ID="your-project"
FIREBASE_CLIENT_EMAIL="your-email"
FIREBASE_PRIVATE_KEY="your-private-key"
```

### 2. Database Setup
```bash
npm install
npx prisma generate
npx prisma db push
npm run seed
```

### 3. Run Locally
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## 📖 Documentation
Detailed documentation for each system:
- 🛠 [Local Setup & API Reference](backend/LOCAL_SETUP.md)
- 🔐 [Firebase & Auth Setup](backend/AUTH_SETUP.md)
- 🎮 [Game Engine (Scoring & Rewards)](backend/GAME_ENGINE.md)
- 🏆 [Leaderboards & Aggregation](backend/LEADERBOARDS.md)
- ⚔️ [PvP Duels (Async Flow)](backend/DUELS.md)
- 📱 [Frontend Setup & UI](frontend/FRONTEND_SETUP.md)

## 🏗 Project Structure
- `/backend`: NestJS source code.
- `/frontend`: React + Vite mobile application.

## 🛡 Security
- Correct answers are **never** sent to the client.
- All rewards and scores are calculated server-side.
- Firebase ID tokens are verified for every request.
- Admin endpoints are protected by `AdminGuard`.
