# Bilik Arena Beta Test Plan

## 🎯 Goal
Verify that the core loops (Auth, Solo, PvP) work correctly for real users in a local network environment before cloud deployment.

## 🛠 Prerequisites
1. **Server Running**: `cd backend && npm run dev`
2. **Database Running**: PostgreSQL accessible.
3. **Frontend Running**: `cd frontend && npm run dev`
4. **Local Network Access**: Find your local IP (e.g., `192.168.1.50`).
5. **Mobile Testing**: Open `http://<YOUR_IP>:5173` on your mobile browser.

## 📋 Test Scenarios

### Scenario 1: New Player Onboarding
1. Open the app on a mobile device.
2. Verify Splash Screen shows up.
3. Select a city (e.g., "Bakı").
4. Verify you land on the Home screen with 100 coins and Level 1.
5. **Goal**: Check if `POST /auth/sync` and `PATCH /profile/city` work.

### Scenario 2: Solo Intelligence Test
1. From Home, click "Solo Oyun".
2. Select a category or "Bütün Kateqoriyalar".
3. Answer all questions. Try to answer some correctly and some wrongly.
4. Verify the results screen shows correct counts and awarded coins/xp.
5. Return to Home and check if your balance updated.

### Scenario 3: 1v1 Async Duel (Dual Device)
1. **Device A**: Start a Duel ("Rəqib Tap"). Play all questions.
2. **Device A**: Should see "Waiting for opponent".
3. **Device B**: Start a Duel. Should be matched with Device A.
4. **Device B**: Play all questions.
5. **Both**: Verify the Result screen appears for both with correct Winner/Loser.

### Scenario 4: Ranking & Social
1. Open "Reytinq Cədvəli".
2. Check if your city's score increased after playing.
3. Switch between "Şəhərlər" and "Oyunçular".
4. Check different periods (Daily/Weekly).

## 💬 Feedback Questions for Testers
1. Did the game feel fast?
2. Were the Azerbaijani texts clear and natural?
3. Did you encounter any "Wait..." or "Error" screens?
4. Was it easy to understand how to earn coins?
5. Is the design "Premium" enough?

## 📊 Key Metrics to Observe
- Time to first game.
- Average questions answered per session.
- Number of reported questions (if any).
- Success rate of `sync` calls.
