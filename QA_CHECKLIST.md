# Bilik Arena MVP QA Checklist

## 1. Authentication & Onboarding
- [x] **Guest Login**: PASS. App opens and user is logged in anonymously.
- [x] **City Selection**: PASS. First-time user is forced to select a city.
- [x] **Sync**: PASS. Profile data is fetched correctly.
- [x] **Persistence**: FIXED. Persistence now uses `onAuthStateChanged` in `authStore.ts` for rock-solid session recovery.

## 2. Solo Game Loop
- [x] **Setup**: PASS. Category selection works.
- [x] **Gameplay**: PASS. Timer runs, options lock, and feedback shows. Added `analytics` placeholder.
- [x] **Finishing**: PASS. Rewards are granted once (Backend source of truth).
- [x] **Results**: PASS. Accurate summary.

## 3. Social & Leaderboards
- [x] **Cities**: PASS. Aggregation works. Added `EmptyState` for zero-data scenarios.
- [x] **Players**: PASS. Correct rankings.
- [x] **Real-time update**: PASS.

## 4. PvP Duels (Async)
- [x] **Find/Create**: PASS. Matchmaking joins existing or creates new.
- [x] **Dual Play**: PASS. Same questions served to both.
- [x] **Waiting**: FIXED. Improved `DuelWaitingPage` with "Refresh" button and better Azerbaijani text.
- [x] **Finalization**: PASS. Result screen shows winner correctly.
- [x] **My Duels**: FIXED. Added `EmptyState` and "Continue" logic.

## 5. Security & Edge Cases
- [x] **Double Click**: FIXED. Frontend sets `isAnswering` state to block re-submission; Backend checks `answers` array length before appending in `GamesService`.
- [x] **Expiration**: FIXED. `Solo` sessions check `createdAt` (>30m) before starting/finishing; `Duel` status remains `WAITING` until finished or canceled.
- [x] **Negative Balance**: FIXED. `WalletService` throws an `InsufficientFundsException` (402) if `spendCoins` results in balance < 0.

---

## 🧪 Testing with Two Browser Profiles
To test Duels properly:
1. Open Chrome and log in (Profile A).
2. Open Chrome Incognito or a different browser (Edge/Firefox) (Profile B).
3. Start a Duel in Profile A.
4. Go to Duels in Profile B and click "Rəqib Tap".
5. Profile B should join the duel created by Profile A.
6. Play both and check the result.
