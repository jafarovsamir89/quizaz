# Bilik Arena PvP Duels (Async)

This document describes the asynchronous 1v1 duel system.

## 1. Concept
Since maintaining a high concurrent online presence is challenging for a new app, Bilik Arena uses an **asynchronous matching** system. Players don't need to be online at the same time to compete.

## 2. Duel Lifecycle

### Phase 1: Find or Create
1. Player A clicks "Start Duel".
2. Backend searches for a `pending` duel created by someone else.
3. If no pending duel exists:
   - Backend creates a new duel with `initiatorId = Player A`.
   - Status: `pending`.
   - Backend selects 7 random questions.
   - Player A completes the questions immediately.
4. If a pending duel exists:
   - Backend joins Player A as `opponentId`.
   - Status: `active`.
   - Player A completes the same 7 questions.

### Phase 2: Gameplay
- Each player answers 7 questions.
- Scoring formula is the same as Solo (100 base + max 50 speed bonus).
- Answers are stored separately in `initiatorAnswers` and `opponentAnswers`.

### Phase 3: Finalization
1. When a player finishes their side, they call `POST /duels/:id/finish`.
2. If the other player hasn't finished yet, the duel remains `active`.
3. When the second player finishes:
   - Backend compares scores.
   - Sets `winnerId`.
   - Grants rewards.
   - Logs points for both players to their respective cities.

## 3. Rewards & Economy
- **Winner**: +20 coins, +XP.
- **Loser**: +5 coins, +XP.
- **Draw**: Both +10 coins, +XP.
- **City Points**: Every point earned in the duel is added to the user's city total.

## 4. Expiration & Anti-Cheat
- **Expiration**: Duels expire after 24 hours.
- **Anti-Cheat**: Correct answers are never sent to the client until the answer is submitted. One-time submission per question.

## 5. API Endpoints
- `POST /duels/find-or-create`: Matchmaking.
- `POST /duels/:id/answer`: Submit a question.
- `POST /duels/:id/finish`: Finalize your side.
- `GET /duels/my`: List your duels.
- `POST /duels/:id/cancel`: Cancel a pending duel (initiator only).
