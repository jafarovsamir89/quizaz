# Bilik Arena Backend — Foundation

This is the NestJS backend for the Bilik Arena trivia platform.

## Prerequisites
- Node.js 20+
- PostgreSQL database

## Installation
1. Go to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already done):
   ```bash
   npm install
   ```

## Configuration
1. Open the `.env` file.
2. Update the `DATABASE_URL` with your local PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/bilikarena?schema=public"
   ```

## Database Setup
Once your PostgreSQL is running and the `.env` is configured:

1. Run migrations to create tables:
   ```bash
   npx prisma migrate dev --name init
   ```
2. Seed the database with initial Azerbaijani cities and categories:
   ```bash
   npx prisma db seed
   ```

## Running the Application
- Development mode: `npm run start:dev`
- Production mode: `npm run start:prod`

## API Endpoints

### Metadata
- **Health Check**: `GET /health`
- **Cities List**: `GET /cities`
- **Categories List**: `GET /categories`

### Questions
- **List All**: `GET /questions`
- **Random (Game Mode)**: `GET /questions/random?categoryId=1&limit=10` (Correct answer hidden)
- **Create**: `POST /questions`
- **Bulk Import**: `POST /questions/import` (Accepts JSON array)
- **Report Question**: `POST /questions/:id/report`

### Gameplay (Solo)
- **Start Game**: `POST /game/solo/start` (Body: `{ "categoryId": 1, "limit": 10 }`)
- **Submit Answer**: `POST /game/solo/:sessionId/answer` (Body: `{ "questionId": 1, "selectedOption": "a", "timeSpentMs": 3000 }`)
- **Finish Game**: `POST /game/solo/:sessionId/finish`
- **Session Info**: `GET /game/sessions/:sessionId`

### Profile & Wallet
- **My Stats**: `GET /profile/stats`
- **Full Profile**: `GET /profile/me`
- **Update City**: `PATCH /profile/city` (Body: `{ "cityId": 1 }`)

### Social & Leaderboards
- **Cities Ranking**: `GET /leaderboards/cities?period=weekly`
- **Top Players**: `GET /leaderboards/players?period=all`
- **My Rank**: `GET /leaderboards/me?period=monthly`
- **City Top Players**: `GET /leaderboards/cities/:cityId/players`

### PvP Duels (Async)
- **Start/Join**: `POST /duels/find-or-create`
- **My Duels**: `GET /duels/my`
- **Submit Answer**: `POST /duels/:id/answer` (Body: `{ "questionId": 1, "selectedOption": "a", "timeSpentMs": 3000 }`)
- **Finish Side**: `POST /duels/:id/finish`
- **Cancel Pending**: `POST /duels/:id/cancel`

### Admin (Reports)
- **List Reports**: `GET /admin/question-reports`
- **Resolve Report**: `PATCH /admin/question-reports/:id/resolve` (Body: `{ "adminComment": "..." }`)

## Bulk Import Testing
You can use the provided `sample_questions.json` to test the import system:
```bash
# Using curl
curl -X POST http://localhost:3000/questions/import \
     -H "Content-Type: application/json" \
     -d @../sample_questions.json
```
