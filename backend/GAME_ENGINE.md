# Bilik Arena Game Engine (Solo Mode)

This document describes the scoring and reward mechanics for the Bilik Arena MVP.

## 1. Scoring Logic
Scoring happens strictly on the backend based on accuracy and speed.

### Base Score
- **Correct Answer**: 100 points
- **Wrong Answer**: 0 points
- **Timeout (> 10s)**: 0 points (even if answer is correct)

### Speed Bonus (Correct Answers Only)
- **0 - 2 seconds**: +50 points (Max 150 total)
- **2 - 5 seconds**: +30 points
- **5 - 8 seconds**: +10 points
- **8 - 10 seconds**: +0 points

## 2. Reward Logic
Rewards are granted upon completing the session.

### Coins (Wallet)
- **Standard**: 5 coins per correct answer.
- **Perfect Game Bonus**: +50 coins (if all questions in the session are correct).

### Experience (XP)
- **XP Earned**: `Total Score / 10` (rounded down).
- **Level Up**: Simple linear progression for MVP (Current XP / 1000 + 1).

### City Points
- **City Points**: `Total Score`.
- Logged in `CityPointsLog` for city-wide leaderboard aggregation.

## 3. Anti-Cheat Measures
1. **Hidden Answers**: Correct options are never sent to the client when a game starts.
2. **One-Time Submission**: The backend only accepts one answer per question per session.
3. **Session Ownership**: Only the session creator can submit answers or finish the game.
4. **Time Validation**: `timeSpentMs` is cross-checked on the backend.
5. **Atomic Transactions**: All rewards are processed in a single database transaction to ensure consistency.

## 4. API Flow
1. `POST /game/solo/start` -> Returns `sessionId` and questions.
2. `POST /game/solo/:sessionId/answer` -> Submit answer for a single question. Returns immediate feedback (`isCorrect`).
3. `POST /game/solo/:sessionId/finish` -> Finalizes session and grants rewards.
